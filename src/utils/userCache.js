/**
 * User data cache utility
 * Caches user profile and permissions data to reduce API calls
 */

const CACHE_KEYS = {
  USER_DATA: 'cached_user_data',
  PERMISSIONS: 'cached_permissions',
};

// Cache expiration time: 30 minutes (in milliseconds)
const CACHE_EXPIRY = 30 * 60 * 1000;

/**
 * Get cached data if it exists and is not expired
 * @param {string} key - Cache key
 * @returns {object|null} - Cached data or null if expired/missing
 */
export const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) {
      return null;
    }

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (now - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error reading cache:', error);
    // Clear corrupted cache
    localStorage.removeItem(key);
    return null;
  }
};

/**
 * Set cached data with timestamp
 * @param {string} key - Cache key
 * @param {object} data - Data to cache
 */
export const setCachedData = (key, data) => {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cacheEntry));
  } catch (error) {
    console.error('Error setting cache:', error);
    // If storage is full, try to clear expired cache
    clearExpiredCache();
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(cacheEntry));
    } catch (retryError) {
      console.error('Failed to set cache after clearing expired:', retryError);
    }
  }
};

/**
 * Clear specific cached data
 * @param {string} key - Cache key to clear
 */
export const clearCachedData = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

/**
 * Clear all user-related cache
 */
export const clearAllUserCache = () => {
  Object.values(CACHE_KEYS).forEach(key => {
    clearCachedData(key);
  });
};

/**
 * Clear expired cache entries
 */
export const clearExpiredCache = () => {
  Object.values(CACHE_KEYS).forEach(key => {
    getCachedData(key); // This will automatically remove expired entries
  });
};

/**
 * Get cached user data
 * @returns {object|null}
 */
export const getCachedUser = () => {
  return getCachedData(CACHE_KEYS.USER_DATA);
};

/**
 * Set cached user data
 * @param {object} userData
 */
export const setCachedUser = (userData) => {
  setCachedData(CACHE_KEYS.USER_DATA, userData);
};

/**
 * Get cached permissions
 * @returns {object|null}
 */
export const getCachedPermissions = () => {
  return getCachedData(CACHE_KEYS.PERMISSIONS);
};

/**
 * Set cached permissions
 * @param {object} permissionsData
 */
export const setCachedPermissions = (permissionsData) => {
  setCachedData(CACHE_KEYS.PERMISSIONS, permissionsData);
};

export { CACHE_KEYS };

