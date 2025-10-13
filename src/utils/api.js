import axios from 'axios';
import { API_CONFIG } from '../constants/api';
import { handleApiError, logError } from './errorHandler';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
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

// Response interceptor to handle auth errors and logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error for debugging
    logError(error, 'API Response');
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const { success, data, error } = response.data;
    
    if (!success) {
      throw new Error(error?.message || 'Login failed');
    }
    
    // Extract token and user info from Supabase response
    const { access_token, user } = data;
    return {
      token: access_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'user',
        ...user.user_metadata
      }
    };
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    const { success, error } = response.data;
    
    if (!success) {
      throw new Error(error?.message || 'Logout failed');
    }
    
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    const { success, data, error } = response.data;
    
    if (!success) {
      throw new Error(error?.message || 'Failed to get user info');
    }
    
    return {
      id: data.id,
      email: data.email,
      role: data.user_metadata?.role || 'user',
      first_name: data.user_metadata?.first_name || data.first_name,
      last_name: data.user_metadata?.last_name || data.last_name,
      full_name: data.user_metadata?.full_name || data.full_name,
      ...data.user_metadata
    };
  },
  
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    const { success, data, error } = response.data;
    
    if (!success) {
      throw new Error(error?.message || 'Signup failed');
    }
    
    return data;
  }
};

export default api;