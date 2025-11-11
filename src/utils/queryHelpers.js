/**
 * Query helpers for cache integration
 */
import { getCache, setCache } from './cacheStorage';
import { queryKeys } from './queryClient';

/**
 * Wrapper for query functions that checks cache first and saves after fetching
 */
export const createCachedQueryFn = (queryFn, queryKey, ttlMinutes = null) => {
  return async () => {
    // Try to get from cache first
    const cachedData = await getCache(queryKey);
    if (cachedData) {
      // Return cached data immediately, but still fetch in background
      queryFn().then(async (freshData) => {
        await setCache(queryKey, freshData, ttlMinutes);
      }).catch(() => {
        // Ignore errors in background fetch
      });
      return cachedData;
    }

    // No cache, fetch fresh data
    const data = await queryFn();
    await setCache(queryKey, data, ttlMinutes);
    return data;
  };
};

/**
 * Get TTL minutes for a query key pattern
 */
export const getTTLForQueryKey = (queryKey) => {
  const keyStr = JSON.stringify(queryKey);
  
  // Statistics: 2 hours
  if (keyStr.includes('statistics')) {
    return 60 * 2;
  }
  
  // Recent clients: 24 hours
  if (keyStr.includes('recent')) {
    return 60 * 24;
  }
  
  // Lists: 12 hours
  if (keyStr.includes('list')) {
    return 60 * 12;
  }
  
  // Details: 12 hours
  if (keyStr.includes('detail')) {
    return 60 * 12;
  }
  
  // Users: 24 hours
  if (keyStr.includes('users')) {
    return 60 * 24;
  }
  
  // Default: 6 hours
  return 60 * 6;
};

