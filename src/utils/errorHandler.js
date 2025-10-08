import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/api';

/**
 * Enhanced error handler for API responses
 * @param {Error} error - The error object from API call
 * @returns {string} - User-friendly error message
 */
export const handleApiError = (error) => {
  // Network or connection errors
  if (!error.response) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  const { status, data } = error.response;

  // Handle specific HTTP status codes
  switch (status) {
    case HTTP_STATUS.UNAUTHORIZED:
      return ERROR_MESSAGES.UNAUTHORIZED;
    
    case HTTP_STATUS.FORBIDDEN:
      return ERROR_MESSAGES.FORBIDDEN;
    
    case HTTP_STATUS.NOT_FOUND:
      return ERROR_MESSAGES.NOT_FOUND;
    
    case HTTP_STATUS.BAD_REQUEST:
      // Try to extract validation errors
      if (data?.error?.details) {
        return formatValidationErrors(data.error.details);
      }
      return data?.error?.message || ERROR_MESSAGES.VALIDATION_ERROR;
    
    case HTTP_STATUS.CONFLICT:
      return data?.error?.message || 'A conflict occurred with the current state.';
    
    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      return ERROR_MESSAGES.SERVER_ERROR;
    
    default:
      return data?.error?.message || ERROR_MESSAGES.UNKNOWN_ERROR;
  }
};

/**
 * Format validation errors into user-friendly messages
 * @param {Object|Array} details - Validation error details
 * @returns {string} - Formatted error message
 */
const formatValidationErrors = (details) => {
  if (Array.isArray(details)) {
    return details.map(error => error.message || error).join(', ');
  }
  
  if (typeof details === 'object') {
    return Object.values(details).flat().join(', ');
  }
  
  return details.toString();
};

/**
 * Log errors for debugging (only in development)
 * @param {Error} error - The error to log
 * @param {string} context - Context where error occurred
 */
export const logError = (error, context = '') => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 Error ${context ? `in ${context}` : ''}`);
    console.error('Error:', error);
    if (error.response) {
      console.error('Response:', error.response);
    }
    console.groupEnd();
  }
};

/**
 * Create a standardized error object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {any} details - Additional error details
 * @returns {Object} - Standardized error object
 */
export const createError = (message, code = 'UNKNOWN_ERROR', details = null) => ({
  message,
  code,
  details,
  timestamp: new Date().toISOString()
});

/**
 * Retry mechanism for failed API calls
 * @param {Function} apiCall - The API function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise} - Promise that resolves with API response or rejects after max retries
 */
export const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
};