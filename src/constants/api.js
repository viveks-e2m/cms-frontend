// Get API URL from environment variable or runtime config
const getApiUrl = () => {
  // First try environment variable (build-time)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Then try runtime config
  if (window.APP_CONFIG && window.APP_CONFIG.API_URL) {
    return window.APP_CONFIG.API_URL;
  }
  
  // Fallback - use the backend URL directly
  return 'https://py-cms.sitepreviews.dev';
};

// Create a function to get API URL dynamically (for runtime updates)
const getDynamicApiUrl = () => {
  // Check runtime config first (in case it was loaded after initial module load)
  if (window.APP_CONFIG && window.APP_CONFIG.API_URL) {
    return window.APP_CONFIG.API_URL;
  }
  
  // Then check environment variable
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Fallback
  return 'https://py-cms.sitepreviews.dev';
};

// API Configuration Constants
export const API_CONFIG = {
  BASE_URL: getApiUrl(),
  DYNAMIC_BASE_URL: getDynamicApiUrl, // Function to get URL at runtime
  TIMEOUT: 30000, // Increased from 10s to 30s for general requests
  LONG_TIMEOUT: 120000, // 2 minutes for client/meeting data loading
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// API Endpoints
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    SIGNUP: '/auth/signup',
    ME: '/auth/me'
  },
  CLIENTS: {
    BASE: '/clients',
    BY_ID: (id) => `/clients/${id}`,
    USERS: (clientId) => `/clients/${clientId}/users`,
    USER_ASSIGNMENT: (clientId, userId) => `/clients/${clientId}/users/${userId}`,
    MEETINGS: (clientId) => `/clients/${clientId}/meetings`,
    OPEN_POINTS: (clientId) => `/clients/${clientId}/open-points`,
    WORKFLOWS: (clientId) => `/clients/${clientId}/workflows`,
    SECRETS: (clientId) => `/clients/${clientId}/secrets`
  },
  MEETINGS: {
    BY_ID: (id) => `/meetings/${id}`,
    NOTES: (meetingId) => `/meetings/${meetingId}/notes`,
    OPEN_POINTS: (meetingId) => `/meetings/${meetingId}/open-points`
  },
  OPEN_POINTS: {
    BY_ID: (id) => `/open-points/${id}`
  },
  WORKFLOWS: {
    BY_ID: (id) => `/workflows/${id}`
  },
  SECRETS: {
    BY_ID: (id) => `/secrets/${id}`
  }
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

// Task/Open Point Status
export const TASK_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

// Workflow Status
export const WORKFLOW_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed'
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  ASSIGNEE: 'assignee'
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNKNOWN_ERROR: 'An unexpected error occurred.'
};