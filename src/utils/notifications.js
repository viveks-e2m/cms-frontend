/**
 * Notification utility functions
 * Provides a consistent interface for showing notifications across the app
 */

// Re-export the notification context hook for convenience
export { useNotificationContext } from '../contexts/NotificationContext';

/**
 * Custom hook that provides a unified notification interface
 * This hook wraps the notification context and provides a single showNotification method
 * that automatically determines the notification type based on the second parameter
 */
export const useNotifications = () => {
  const { showSuccess, showError, showWarning, showInfo, ...rest } = useNotificationContext();

  /**
   * Unified notification method
   * @param {string} message - The notification message
   * @param {string} type - The notification type ('success', 'error', 'warning', 'info')
   * @param {object} options - Additional options for the notification
   */
  const showNotification = (message, type = 'info', options = {}) => {
    switch (type) {
      case 'success':
        return showSuccess(message, options);
      case 'error':
        return showError(message, options);
      case 'warning':
        return showWarning(message, options);
      case 'info':
      default:
        return showInfo(message, options);
    }
  };

  return {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    ...rest
  };
};

/**
 * Notification helper functions for common use cases
 */
export const notifications = {
  success: (message, options) => showSuccess(message, options),
  error: (message, options) => showError(message, options),
  warning: (message, options) => showWarning(message, options),
  info: (message, options) => showInfo(message, options),
};

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
};

export default useNotifications;