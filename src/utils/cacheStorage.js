/**
 * Cache storage - DISABLED
 * All cache functionality has been removed
 */

export const setCache = async () => {
  // No-op: cache disabled
  return false;
};

export const getCache = async () => {
  // No-op: cache disabled
  return null;
};

export const removeCache = async () => {
  // No-op: cache disabled
  return false;
};

export const clearAllCache = async () => {
  // No-op: cache disabled
  return false;
};

export const cleanExpiredCache = async () => {
  // No-op: cache disabled
  return false;
};

export const isFirstLogin = async () => {
  // Always return false since we're not using cache
  return false;
};
