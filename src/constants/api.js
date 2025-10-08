// API Configuration Constants
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || '/api',
  TIMEOUT: 10000,
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