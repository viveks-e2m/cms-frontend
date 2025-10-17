import api from './api';

// RBAC API functions
export const rbacAPI = {
  // Get current user's permissions and role
  getMyPermissions: async () => {
    const response = await api.get('/rbac/my-permissions');
    const { success, data, error } = response.data;
    
    if (!success) {
      throw new Error(error?.message || 'Failed to get permissions');
    }
    
    return data;
  },

  // Get all available roles
  getRoles: async () => {
    const response = await api.get('/rbac/roles');
    const { success, data, error } = response.data;
    
    if (!success) {
      throw new Error(error?.message || 'Failed to get roles');
    }
    
    return data.roles;
  },

  // Get all available permissions
  getPermissions: async () => {
    const response = await api.get('/rbac/permissions');
    const { success, data, error } = response.data;
    
    if (!success) {
      throw new Error(error?.message || 'Failed to get permissions');
    }
    
    return data.permissions;
  },

  // Create a new role (Admin only)
  createRole: async (roleData) => {
    const response = await api.post('/rbac/roles', roleData);
    const { success, data, error } = response.data;
    
    if (!success) {
      throw new Error(error?.message || 'Failed to create role');
    }
    
    return data;
  },

  // Create a new permission (Admin only)
  createPermission: async (permissionData) => {
    const response = await api.post('/rbac/permissions', permissionData);
    const { success, data, error } = response.data;
    
    if (!success) {
      throw new Error(error?.message || 'Failed to create permission');
    }
    
    return data;
  },

  // Assign role to user
  assignUserRole: async (userId, roleName) => {
    const response = await api.put(`/rbac/users/${userId}/role`, {
      role_name: roleName
    });
    const { success, data, error } = response.data;
    
    if (!success) {
      throw new Error(error?.message || 'Failed to assign role');
    }
    
    return data;
  },

  // Get user's permissions
  getUserPermissions: async (userId) => {
    const response = await api.get(`/rbac/users/${userId}/permissions`);
    const { success, data, error } = response.data;
    
    if (!success) {
      throw new Error(error?.message || 'Failed to get user permissions');
    }
    
    return data;
  },

  // Grant permission to user
  grantUserPermission: async (userId, permissionName, expiresAt = null, reason = '') => {
    const response = await api.post(`/rbac/users/${userId}/permissions/grant`, {
      permission_name: permissionName,
      expires_at: expiresAt,
      reason: reason
    });
    const { success, data, error } = response.data;
    
    if (!success) {
      throw new Error(error?.message || 'Failed to grant permission');
    }
    
    return data;
  },

  // Revoke permission from user
  revokeUserPermission: async (userId, permissionName, reason = '') => {
    const response = await api.post(`/rbac/users/${userId}/permissions/revoke`, {
      permission_name: permissionName,
      reason: reason
    });
    const { success, data, error } = response.data;
    
    if (!success) {
      throw new Error(error?.message || 'Failed to revoke permission');
    }
    
    return data;
  }
};

export default rbacAPI;