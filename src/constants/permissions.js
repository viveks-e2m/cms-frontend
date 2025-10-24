/**
 * Centralized Permission Constants
 * 
 * This file contains all permission names used throughout the application.
 * Using these constants ensures consistency and reduces typos.
 */

export const PERMISSIONS = {
  // Client Management Permissions
  READ_CLIENT: 'read_client',
  CREATE_CLIENT: 'create_client',
  UPDATE_CLIENT: 'update_client',
  DELETE_CLIENT: 'delete_client',
  READ_ALL_CLIENTS: 'read_all_clients',

  // Meeting Management Permissions
  READ_MEETING: 'read_meeting',
  CREATE_MEETING: 'create_meeting',
  UPDATE_MEETING: 'update_meeting',
  DELETE_MEETING: 'delete_meeting',
  READ_ALL_MEETINGS: 'read_all_meetings',

  // Task/Action Items Permissions
  READ_TASK: 'read_open_point',
  CREATE_TASK: 'create_open_point',
  UPDATE_TASK: 'update_open_point',
  DELETE_TASK: 'delete_open_point',
  ASSIGN_TASK: 'assign_open_point',

  // Workflow Management Permissions
  READ_WORKFLOW: 'read_workflow',
  CREATE_WORKFLOW: 'create_workflow',
  UPDATE_WORKFLOW: 'update_workflow',
  DELETE_WORKFLOW: 'delete_workflow',
  EXECUTE_WORKFLOW: 'execute_workflow',

  // Secret Management Permissions
  READ_SECRET: 'read_secret',
  CREATE_SECRET: 'create_secret',
  UPDATE_SECRET: 'update_secret',
  DELETE_SECRET: 'delete_secret',

  // System Administration Permissions
  ADMIN_ACCESS: 'manage_system',
  MANAGE_USER_ROLES: 'manage_user_roles',
  CREATE_USER: 'create_user',
  READ_USER: 'read_user',
  UPDATE_USER: 'update_user',
  DELETE_USER: 'delete_user',
  READ_ALL_USERS: 'read_all_users',
  
  // Analytics and Reporting
  VIEW_ANALYTICS: 'view_analytics',
};

/**
 * Permission Groups for easier management
 */
export const PERMISSION_GROUPS = {
  CLIENT_MANAGEMENT: [
    PERMISSIONS.READ_CLIENT,
    PERMISSIONS.CREATE_CLIENT,
    PERMISSIONS.UPDATE_CLIENT,
    PERMISSIONS.DELETE_CLIENT,
    PERMISSIONS.READ_ALL_CLIENTS,
  ],
  
  MEETING_MANAGEMENT: [
    PERMISSIONS.READ_MEETING,
    PERMISSIONS.CREATE_MEETING,
    PERMISSIONS.UPDATE_MEETING,
    PERMISSIONS.DELETE_MEETING,
    PERMISSIONS.READ_ALL_MEETINGS,
  ],
  
  TASK_MANAGEMENT: [
    PERMISSIONS.READ_TASK,
    PERMISSIONS.CREATE_TASK,
    PERMISSIONS.UPDATE_TASK,
    PERMISSIONS.DELETE_TASK,
    PERMISSIONS.ASSIGN_TASK,
  ],
  
  WORKFLOW_MANAGEMENT: [
    PERMISSIONS.READ_WORKFLOW,
    PERMISSIONS.CREATE_WORKFLOW,
    PERMISSIONS.UPDATE_WORKFLOW,
    PERMISSIONS.DELETE_WORKFLOW,
    PERMISSIONS.EXECUTE_WORKFLOW,
  ],
  
  SECRET_MANAGEMENT: [
    PERMISSIONS.READ_SECRET,
    PERMISSIONS.CREATE_SECRET,
    PERMISSIONS.UPDATE_SECRET,
    PERMISSIONS.DELETE_SECRET,
  ],
  
  ADMIN_PERMISSIONS: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.MANAGE_USER_ROLES,
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.READ_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.DELETE_USER,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
};

/**
 * Helper function to check if a permission exists
 */
export const isValidPermission = (permission) => {
  return Object.values(PERMISSIONS).includes(permission);
};

/**
 * Helper function to get all permissions as an array
 */
export const getAllPermissions = () => {
  return Object.values(PERMISSIONS);
};