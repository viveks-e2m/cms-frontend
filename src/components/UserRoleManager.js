import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { PermissionGuard } from './PermissionGuard';

export const UserRoleManager = () => {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        axios.get('/rbac/roles'),
        axios.get('/rbac/permissions')
      ]);

      if (rolesRes.data.success) {
        setRoles(rolesRes.data.data.roles);
      }

      if (permissionsRes.data.success) {
        setPermissions(permissionsRes.data.data.permissions);
      }
    } catch (error) {
      console.error('Error loading RBAC data:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId, roleName) => {
    try {
      const response = await axios.put(`/rbac/users/${userId}/role`, roleName, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.success) {
        alert('Role assigned successfully');
        // Refresh user data if needed
      }
    } catch (error) {
      alert('Error assigning role: ' + (error.response?.data?.detail || error.message));
    }
  };

  const grantPermission = async (userId, permissionName, expiresAt = null, reason = '') => {
    try {
      const response = await axios.post(`/rbac/users/${userId}/permissions/grant`, {
        permission_name: permissionName,
        expires_at: expiresAt,
        reason: reason
      });

      if (response.data.success) {
        alert('Permission granted successfully');
      }
    } catch (error) {
      alert('Error granting permission: ' + (error.response?.data?.detail || error.message));
    }
  };

  const revokePermission = async (userId, permissionName, reason = '') => {
    try {
      const response = await axios.post(`/rbac/users/${userId}/permissions/revoke`, {
        permission_name: permissionName,
        reason: reason
      });

      if (response.data.success) {
        alert('Permission revoked successfully');
      }
    } catch (error) {
      alert('Error revoking permission: ' + (error.response?.data?.detail || error.message));
    }
  };

  const getUserPermissions = async (userId) => {
    try {
      const response = await axios.get(`/rbac/users/${userId}/permissions`);
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Error getting user permissions:', error);
    }
    return null;
  };

  if (loading) {
    return <div>Loading RBAC data...</div>;
  }

  return (
    <PermissionGuard 
      permissions={['manage_user_roles']} 
      fallback={<div>Access Denied: You don't have permission to manage user roles</div>}
    >
      <div className="user-role-manager">
        <h2>User Role Management</h2>
        
        {/* Role Assignment Section */}
        <div className="role-assignment">
          <h3>Assign Roles</h3>
          <div>
            <input 
              type="text" 
              placeholder="User ID" 
              onChange={(e) => setSelectedUser(e.target.value)}
            />
            <select onChange={(e) => selectedUser && assignRole(selectedUser, e.target.value)}>
              <option value="">Select Role</option>
              {roles.map(role => (
                <option key={role.id} value={role.name}>
                  {role.display_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Permission Management Section */}
        <div className="permission-management">
          <h3>Manage Permissions</h3>
          <div>
            <input 
              type="text" 
              placeholder="User ID" 
              value={selectedUser || ''}
              onChange={(e) => setSelectedUser(e.target.value)}
            />
            
            <div className="permission-actions">
              <h4>Grant Permission</h4>
              <select id="grant-permission">
                <option value="">Select Permission</option>
                {permissions.map(perm => (
                  <option key={perm.id} value={perm.name}>
                    {perm.display_name}
                  </option>
                ))}
              </select>
              <input type="datetime-local" id="expires-at" placeholder="Expires At (optional)" />
              <input type="text" id="reason" placeholder="Reason (optional)" />
              <button onClick={() => {
                const permSelect = document.getElementById('grant-permission');
                const expiresInput = document.getElementById('expires-at');
                const reasonInput = document.getElementById('reason');
                
                if (selectedUser && permSelect.value) {
                  grantPermission(
                    selectedUser, 
                    permSelect.value,
                    expiresInput.value || null,
                    reasonInput.value
                  );
                }
              }}>
                Grant Permission
              </button>
            </div>

            <div className="permission-actions">
              <h4>Revoke Permission</h4>
              <select id="revoke-permission">
                <option value="">Select Permission</option>
                {permissions.map(perm => (
                  <option key={perm.id} value={perm.name}>
                    {perm.display_name}
                  </option>
                ))}
              </select>
              <input type="text" id="revoke-reason" placeholder="Reason (optional)" />
              <button onClick={() => {
                const permSelect = document.getElementById('revoke-permission');
                const reasonInput = document.getElementById('revoke-reason');
                
                if (selectedUser && permSelect.value) {
                  revokePermission(
                    selectedUser, 
                    permSelect.value,
                    reasonInput.value
                  );
                }
              }}>
                Revoke Permission
              </button>
            </div>
          </div>
        </div>

        {/* User Permissions Display */}
        {selectedUser && (
          <div className="user-permissions-display">
            <h3>User Permissions</h3>
            <button onClick={async () => {
              const userPerms = await getUserPermissions(selectedUser);
              if (userPerms) {
                console.log('User permissions:', userPerms);
                // Display in UI
              }
            }}>
              Load User Permissions
            </button>
          </div>
        )}

        {/* Available Roles Display */}
        <div className="roles-display">
          <h3>Available Roles</h3>
          <ul>
            {roles.map(role => (
              <li key={role.id}>
                <strong>{role.display_name}</strong> ({role.name})
                <p>{role.description}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Available Permissions Display */}
        <div className="permissions-display">
          <h3>Available Permissions</h3>
          <ul>
            {permissions.map(perm => (
              <li key={perm.id}>
                <strong>{perm.display_name}</strong> ({perm.name})
                <p>{perm.description}</p>
                <small>Resource: {perm.resource}, Action: {perm.action}</small>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PermissionGuard>
  );
};