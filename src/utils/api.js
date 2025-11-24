import axios from 'axios';
import { API_CONFIG } from '../constants/api';
import { logError } from './errorHandler';
import { getCachedUser, setCachedUser, clearAllUserCache } from './userCache';

// Get the dynamic URL
const dynamicBaseUrl = API_CONFIG.DYNAMIC_BASE_URL();

// Create axios instance with base configuration
const api = axios.create({
  baseURL: dynamicBaseUrl || API_CONFIG.BASE_URL || 'https://py-cms.sitepreviews.dev',
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add auth token and ensure correct baseURL
api.interceptors.request.use(
  (config) => {
    // Ensure we have the correct baseURL
    const currentBaseUrl = API_CONFIG.DYNAMIC_BASE_URL();
    if (currentBaseUrl && currentBaseUrl !== config.baseURL) {
      config.baseURL = currentBaseUrl;
    }
    
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors, token refresh, and logging
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log('=== INTERCEPTOR CALLED ===');
    console.log('Interceptor received error:', error);
    console.log('Error response status:', error.response?.status);
    console.log('Error response data:', error.response?.data);
    
    const originalRequest = error.config;
    
    // Log error for debugging
    logError(error, 'API Response');
    
    // Handle authentication errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if this is a refresh token request that failed
      if (originalRequest.url?.includes('/auth/refresh')) {
        console.log('Refresh token request failed, redirecting to login');
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      // Try to refresh the token
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return api(originalRequest);
            })
            .catch(err => {
              return Promise.reject(err);
            });
        }
        
        originalRequest._retry = true;
        isRefreshing = true;
        
        try {
          console.log('Attempting to refresh token...');
          const response = await axios.post(
            `${originalRequest.baseURL}/auth/refresh`,
            { refresh_token: refreshToken },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
          
          const { success, data } = response.data;
          
          if (success && data.access_token) {
            console.log('Token refreshed successfully');
            const newAccessToken = data.access_token;
            const newRefreshToken = data.refresh_token || refreshToken;
            
            // Update stored tokens
            localStorage.setItem('authToken', newAccessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            
            // Update the authorization header
            api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            
            // Process queued requests
            processQueue(null, newAccessToken);
            
            // Retry the original request
            return api(originalRequest);
          } else {
            throw new Error('Token refresh failed');
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          processQueue(refreshError, null);
          
      // Clear tokens, cache, and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      clearAllUserCache();
      window.location.href = '/login';
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // No refresh token available, redirect to login
        console.log('No refresh token available, redirecting to login');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        clearAllUserCache();
        window.location.href = '/login';
      }
    }
    
    // Enhance error message for better user experience
    if (error.response && error.response.data) {
      const responseData = error.response.data;
      console.log('Interceptor processing error response:', responseData);
      
      // Check for the specific backend error structure: responseData.detail.error.details.msg
      if (responseData.detail && responseData.detail.error && responseData.detail.error.details && responseData.detail.error.details.msg) {
        console.log('Interceptor: Setting error message from detail.error.details.msg:', responseData.detail.error.details.msg);
        error.message = responseData.detail.error.details.msg;
      }
      // Fallback: Check responseData.detail.error.message
      else if (responseData.detail && responseData.detail.error && responseData.detail.error.message) {
        console.log('Interceptor: Setting error message from detail.error.message:', responseData.detail.error.message);
        error.message = responseData.detail.error.message;
      }
      // Fallback: Check responseData.error.details.msg
      else if (responseData.error && responseData.error.details && responseData.error.details.msg) {
        console.log('Interceptor: Setting error message from error.details.msg:', responseData.error.details.msg);
        error.message = responseData.error.details.msg;
      }
      // Fallback: Check responseData.error.message
      else if (responseData.error && responseData.error.message) {
        console.log('Interceptor: Setting error message from error.message:', responseData.error.message);
        error.message = responseData.error.message;
      }
      // Fallback: Check responseData.error as string
      else if (responseData.error && typeof responseData.error === 'string') {
        console.log('Interceptor: Setting error message from error string:', responseData.error);
        error.message = responseData.error;
      }
      // Fallback: Check responseData.message
      else if (responseData.message) {
        console.log('Interceptor: Setting error message from direct message:', responseData.message);
        error.message = responseData.message;
      }
      else {
        console.log('Interceptor: No error message found in expected locations');
      }
      
      console.log('Interceptor: Final error message:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Helper function to extract error messages from auth responses
const extractAuthError = (error, defaultMessage = 'Operation failed') => {
  console.log('Extracting auth error:', error);
  
  let errorMessage = defaultMessage;
  
  // Try to extract error message from response
  if (error.response && error.response.data) {
    const data = error.response.data;
    console.log('Auth error response data:', data);
    
    // Check for the specific backend error structure: data.detail.error.details.msg
    if (data.detail && data.detail.error && data.detail.error.details && data.detail.error.details.msg) {
      errorMessage = data.detail.error.details.msg;
      console.log('✅ Found auth error in data.detail.error.details.msg:', errorMessage);
    }
    // Fallback: Check data.detail.error.message
    else if (data.detail && data.detail.error && data.detail.error.message) {
      errorMessage = data.detail.error.message;
      console.log('✅ Found auth error in data.detail.error.message:', errorMessage);
    }
    // Fallback: Check data.error.details.msg
    else if (data.error && data.error.details && data.error.details.msg) {
      errorMessage = data.error.details.msg;
      console.log('✅ Found auth error in data.error.details.msg:', errorMessage);
    }
    // Fallback: Check data.error.message
    else if (data.error && data.error.message) {
      errorMessage = data.error.message;
      console.log('✅ Found auth error in data.error.message:', errorMessage);
    }
    // Fallback: Check data.error as string
    else if (data.error && typeof data.error === 'string') {
      errorMessage = data.error;
      console.log('✅ Found auth error in data.error (string):', errorMessage);
    }
    // Fallback: Check data.message
    else if (data.message) {
      errorMessage = data.message;
      console.log('✅ Found auth error in data.message:', errorMessage);
    }
  }
  
  // Handle network errors
  if (error.code === 'NETWORK_ERROR' || error.name === 'NetworkError') {
    errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
  } else if (error.code === 'TIMEOUT_ERROR' || error.code === 'ECONNABORTED') {
    errorMessage = 'The request timed out. Please try again.';
  }
  
  console.log('Final auth error message:', errorMessage);
  return errorMessage;
};

// Auth API functions
export const authAPI = {
  login: async (credentials) => {
    // Validate input
    if (!credentials || typeof credentials !== 'object') {
      throw new Error('Invalid credentials format');
    }
    
    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required');
    }
    
    // Create clean login data object
    const loginData = {
      email: String(credentials.email).trim(),
      password: String(credentials.password)
    };
    
    try {
      const response = await api.post('/auth/login', loginData);
      const { success, data, error } = response.data;
      
      if (!success) {
        // Extract the most specific error message available
        let errorMessage = 'Login failed';
        
        if (error) {
          if (typeof error === 'string') {
            errorMessage = error;
          } else if (error.message) {
            errorMessage = error.message;
          } else if (error.details && typeof error.details === 'string') {
            errorMessage = error.details;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      // Extract token and user info from Supabase response
      const { access_token, refresh_token, user } = data;
      return {
        token: access_token,
        refreshToken: refresh_token,
        user: {
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role || 'user',
          ...user.user_metadata
        }
      };
    } catch (error) {
      const errorMessage = extractAuthError(error, 'Login failed. Please check your credentials and try again.');
      throw new Error(errorMessage);
    }
  },
  
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      const { success, error } = response.data;
      
      if (!success) {
        let errorMessage = 'Logout failed';
        if (error) {
          if (typeof error === 'string') {
            errorMessage = error;
          } else if (error.message) {
            errorMessage = error.message;
          }
        }
        throw new Error(errorMessage);
      }
      
      return response.data;
    } catch (error) {
      const errorMessage = extractAuthError(error, 'Logout failed. Please try again.');
      throw new Error(errorMessage);
    }
  },
  
  getCurrentUser: async (forceRefresh = false) => {
    try {
      // Check cache first unless force refresh is requested
      if (!forceRefresh) {
        const cachedUser = getCachedUser();
        if (cachedUser) {
          console.log('Using cached user data');
          return cachedUser;
        }
      }

      // Fetch from API
      const response = await api.get('/auth/me');
      const { success, data, error } = response.data;
      
      if (!success) {
        let errorMessage = 'Failed to get user info';
        if (error) {
          if (typeof error === 'string') {
            errorMessage = error;
          } else if (error.message) {
            errorMessage = error.message;
          }
        }
        throw new Error(errorMessage);
      }
      
      const userData = {
        id: data.id,
        email: data.email,
        role: data.user_metadata?.role || 'user',
        first_name: data.user_metadata?.first_name || data.first_name,
        last_name: data.user_metadata?.last_name || data.last_name,
        full_name: data.user_metadata?.full_name || data.full_name,
        profile_image_url: data.profile_image_url || data.user_metadata?.profile_image_url || null,
        profile_image_path: data.profile_image_path || null,
        fathom_api_key: data.fathom_api_key ?? data.user_metadata?.fathom_api_key,
        role_details: data.role_details,
        ...data.user_metadata,
      };

      // Cache the user data
      setCachedUser(userData);
      console.log('User data cached');

      return userData;
    } catch (error) {
      const errorMessage = extractAuthError(error, 'Failed to get user information. Please try again.');
      throw new Error(errorMessage);
    }
  },
  
  signup: async (userData) => {
    try {
      const response = await api.post('/auth/signup', userData);
      const { success, data, error } = response.data;
      
      if (!success) {
        let errorMessage = 'Signup failed';
        if (error) {
          if (typeof error === 'string') {
            errorMessage = error;
          } else if (error.message) {
            errorMessage = error.message;
          }
        }
        throw new Error(errorMessage);
      }
      
      return data;
    } catch (error) {
      const errorMessage = extractAuthError(error, 'Signup failed. Please try again.');
      throw new Error(errorMessage);
    }
  },
  
  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
      const { success, data, error } = response.data;
      
      if (!success) {
        let errorMessage = 'Token refresh failed';
        if (error) {
          if (typeof error === 'string') {
            errorMessage = error;
          } else if (error.message) {
            errorMessage = error.message;
          }
        }
        throw new Error(errorMessage);
      }
      
      return {
        token: data.access_token,
        refreshToken: data.refresh_token || refreshToken
      };
    } catch (error) {
      const errorMessage = extractAuthError(error, 'Token refresh failed. Please sign in again.');
      throw new Error(errorMessage);
    }
  },

  uploadProfileAvatar: async (file) => {
    if (!file) {
      throw new Error('Please select an image to upload');
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/auth/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { success, data, error } = response.data;

      if (!success) {
        let errorMessage = 'Failed to upload profile image';
        if (error) {
          if (typeof error === 'string') {
            errorMessage = error;
          } else if (error.message) {
            errorMessage = error.message;
          }
        }
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      const errorMessage = extractAuthError(error, 'Failed to upload profile image. Please try again.');
      throw new Error(errorMessage);
    }
  },
};

export default api;