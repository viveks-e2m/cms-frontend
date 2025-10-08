import { useState, useCallback } from 'react';
import { handleApiError, logError, retryApiCall } from '../utils/errorHandler';

/**
 * Custom hook for handling API calls with loading states and error handling
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Configuration options
 * @returns {Object} - API state and methods
 */
export const useApi = (apiFunction, options = {}) => {
  const {
    immediate = false,
    retries = 0,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);

      const apiCall = () => apiFunction(...args);
      const result = retries > 0 
        ? await retryApiCall(apiCall, retries)
        : await apiCall();

      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      logError(err, 'useApi');
      onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, retries, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
};

/**
 * Hook for handling multiple API calls
 * @param {Array} apiCalls - Array of API functions
 * @returns {Object} - Combined API state and methods
 */
export const useMultipleApi = (apiCalls = []) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [results, setResults] = useState({});

  const executeAll = useCallback(async (callsData = {}) => {
    try {
      setLoading(true);
      setErrors({});
      
      const promises = apiCalls.map(async ({ key, apiFunction, args = [] }) => {
        try {
          const result = await apiFunction(...(callsData[key] || args));
          return { key, result, success: true };
        } catch (error) {
          const errorMessage = handleApiError(error);
          return { key, error: errorMessage, success: false };
        }
      });

      const responses = await Promise.allSettled(promises);
      const newResults = {};
      const newErrors = {};

      responses.forEach(({ value }) => {
        if (value.success) {
          newResults[value.key] = value.result;
        } else {
          newErrors[value.key] = value.error;
        }
      });

      setResults(newResults);
      setErrors(newErrors);
      
      return { results: newResults, errors: newErrors };
    } catch (error) {
      logError(error, 'useMultipleApi');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiCalls]);

  const reset = useCallback(() => {
    setResults({});
    setErrors({});
    setLoading(false);
  }, []);

  return {
    results,
    errors,
    loading,
    executeAll,
    reset,
    hasErrors: Object.keys(errors).length > 0
  };
};