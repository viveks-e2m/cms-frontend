/**
 * Persistent Cache Storage using IndexedDB
 * Stores API responses for long-term caching across sessions
 */

const DB_NAME = 'cms_cache_db';
const DB_VERSION = 1;
const STORE_NAME = 'api_cache';
const CACHE_VERSION_KEY = 'cache_version';
const CACHE_VERSION = '1.0.0';
const CACHE_EXPIRY_DAYS = 7; // Cache expires after 7 days

let dbInstance = null;

/**
 * Initialize IndexedDB
 */
const initDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB initialization failed:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        objectStore.createIndex('expiry', 'expiry', { unique: false });
      }
    };
  });
};

/**
 * Get cache key from query key
 */
const getCacheKey = (queryKey) => {
  if (Array.isArray(queryKey)) {
    return JSON.stringify(queryKey);
  }
  return String(queryKey);
};

/**
 * Check if cache entry is expired
 */
const isExpired = (entry) => {
  if (!entry || !entry.expiry) return true;
  return Date.now() > entry.expiry;
};

/**
 * Set cache entry
 */
export const setCache = async (queryKey, data, ttlMinutes = null) => {
  try {
    const db = await initDB();
    const cacheKey = getCacheKey(queryKey);
    
    // Default TTL: 7 days, or use provided TTL
    const ttl = ttlMinutes ? ttlMinutes * 60 * 1000 : CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    const expiry = Date.now() + ttl;

    const entry = {
      key: cacheKey,
      data: data,
      timestamp: Date.now(),
      expiry: expiry,
    };

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    await store.put(entry);

    return true;
  } catch (error) {
    console.error('Error setting cache:', error);
    // Fallback to localStorage for smaller data
    try {
      const cacheKey = getCacheKey(queryKey);
      const entry = {
        data: data,
        timestamp: Date.now(),
        expiry: Date.now() + (ttlMinutes ? ttlMinutes * 60 * 1000 : CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      };
      localStorage.setItem(`cache_${cacheKey}`, JSON.stringify(entry));
      return true;
    } catch (localError) {
      console.error('Error setting localStorage cache:', localError);
      return false;
    }
  }
};

/**
 * Get cache entry
 */
export const getCache = async (queryKey) => {
  try {
    const db = await initDB();
    const cacheKey = getCacheKey(queryKey);

    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(cacheKey);

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const entry = request.result;
        
        if (!entry) {
          // Try localStorage fallback
          try {
            const localEntry = localStorage.getItem(`cache_${cacheKey}`);
            if (localEntry) {
              const parsed = JSON.parse(localEntry);
              if (!isExpired(parsed)) {
                resolve(parsed.data);
                return;
              } else {
                localStorage.removeItem(`cache_${cacheKey}`);
              }
            }
          } catch (e) {
            // Ignore localStorage errors
          }
          resolve(null);
          return;
        }

        if (isExpired(entry)) {
          // Delete expired entry
          const deleteTransaction = db.transaction([STORE_NAME], 'readwrite');
          const deleteStore = deleteTransaction.objectStore(STORE_NAME);
          deleteStore.delete(cacheKey);
          resolve(null);
          return;
        }

        resolve(entry.data);
      };

      request.onerror = () => {
        // Try localStorage fallback
        try {
          const localEntry = localStorage.getItem(`cache_${cacheKey}`);
          if (localEntry) {
            const parsed = JSON.parse(localEntry);
            if (!isExpired(parsed)) {
              resolve(parsed.data);
              return;
            } else {
              localStorage.removeItem(`cache_${cacheKey}`);
            }
          }
        } catch (e) {
          // Ignore localStorage errors
        }
        resolve(null);
      };
    });
  } catch (error) {
    console.error('Error getting cache:', error);
    // Try localStorage fallback
    try {
      const cacheKey = getCacheKey(queryKey);
      const localEntry = localStorage.getItem(`cache_${cacheKey}`);
      if (localEntry) {
        const parsed = JSON.parse(localEntry);
        if (!isExpired(parsed)) {
          return parsed.data;
        } else {
          localStorage.removeItem(`cache_${cacheKey}`);
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    return null;
  }
};

/**
 * Remove cache entry
 */
export const removeCache = async (queryKey) => {
  try {
    const db = await initDB();
    const cacheKey = getCacheKey(queryKey);

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    await store.delete(cacheKey);

    // Also remove from localStorage
    localStorage.removeItem(`cache_${cacheKey}`);
    return true;
  } catch (error) {
    console.error('Error removing cache:', error);
    try {
      const cacheKey = getCacheKey(queryKey);
      localStorage.removeItem(`cache_${cacheKey}`);
      return true;
    } catch (e) {
      return false;
    }
  }
};

/**
 * Clear all cache
 */
export const clearAllCache = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    await store.clear();

    // Clear localStorage cache entries
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });

    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    // Clear localStorage cache entries
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (e) {
      return false;
    }
  }
};

/**
 * Clean expired cache entries
 */
export const cleanExpiredCache = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('expiry');
    const range = IDBKeyRange.upperBound(Date.now());
    const request = index.openCursor(range);

    return new Promise((resolve) => {
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve(true);
        }
      };

      request.onerror = () => {
        resolve(false);
      };
    });
  } catch (error) {
    console.error('Error cleaning expired cache:', error);
    return false;
  }
};

/**
 * Check if this is first login (no cache exists)
 */
export const isFirstLogin = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.count();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const count = request.result;
        // Also check localStorage
        const localKeys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
        resolve(count === 0 && localKeys.length === 0);
      };

      request.onerror = () => {
        // Check localStorage only
        const localKeys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
        resolve(localKeys.length === 0);
      };
    });
  } catch (error) {
    // Check localStorage only
    const localKeys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
    return localKeys.length === 0;
  }
};

// Clean expired cache on initialization
if (typeof window !== 'undefined') {
  cleanExpiredCache();
}

