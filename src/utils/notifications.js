/**
 * Notification utility functions
 * Provides a consistent interface for showing notifications across the app
 */

// Re-export the notification context hook for convenience
export { useNotificationContext } from '../contexts/NotificationContext';

/**
 * Common notification messages
 */
export const NOTIFICATION_MESSAGES = {
  // Generic messages
  LOADING: 'Loading...',
  SUCCESS: 'Operation completed successfully',
  ERROR: 'An error occurred',
  
  // Data operations
  DATA_LOADED: 'Data loaded successfully',
  DATA_REFRESHED: 'Data refreshed successfully',
  DATA_LOAD_ERROR: 'Failed to load data',
  DATA_REFRESH_ERROR: 'Failed to refresh data',
  
  // API operations
  API_ERROR: 'API request failed',
  NETWORK_ERROR: 'Network connection error',
  
  // n8n specific messages
  N8N_WORKFLOWS_LOADED: 'n8n workflows loaded successfully',
  N8N_WORKFLOWS_ERROR: 'Failed to load n8n workflows',
  N8N_EXECUTIONS_LOADED: 'Executions loaded successfully',
  N8N_EXECUTIONS_ERROR: 'Failed to load executions',
  WORKFLOW_NOT_FOUND: 'Workflow not found',
  WORKFLOW_DETAILS_REFRESHED: 'Workflow details refreshed',
  WORKFLOW_DETAILS_ERROR: 'Failed to refresh workflow details',
  
  // Client workflow messages
  CLIENT_WORKFLOW_CREATED: 'Workflow created successfully',
  CLIENT_WORKFLOW_UPDATED: 'Workflow updated successfully',
  CLIENT_WORKFLOW_DELETED: 'Workflow deleted successfully',
  CLIENT_WORKFLOWS_LOADED: 'Client workflows loaded successfully',
  CLIENT_WORKFLOWS_ERROR: 'Failed to load client workflows',
};

export default NOTIFICATION_MESSAGES;