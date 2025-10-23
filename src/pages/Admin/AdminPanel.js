import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { rbacAPI } from "../../utils/rbacAPI";
import DashboardLayout from "../../components/Layout/DashboardLayout/DashboardLayout";
import { PermissionGuard } from "../../components/PermissionGuard";
import { PERMISSIONS } from "../../constants/permissions";
import "./AdminPanel.css";

const AdminPanel = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);

  // Form states
  const [newRole, setNewRole] = useState({
    name: "",
    display_name: "",
    description: "",
  });
  const [newPermission, setNewPermission] = useState({
    name: "",
    display_name: "",
    description: "",
    resource: "",
    action: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesData, permissionsData] = await Promise.all([
        rbacAPI.getRoles(),
        rbacAPI.getPermissions(),
      ]);

      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (error) {
      console.error("Error loading admin data:", error);
      alert("Error loading data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPermissions = async (userId) => {
    try {
      const userPerms = await rbacAPI.getUserPermissions(userId);
      setUserPermissions(userPerms);
    } catch (error) {
      console.error("Error loading user permissions:", error);
      alert("Error loading user permissions: " + error.message);
    }
  };

  const loadRolePermissions = async (roleId) => {
    try {
      const rolePerms = await rbacAPI.getRolePermissions(roleId);
      setRolePermissions(rolePerms);
    } catch (error) {
      console.error("Error loading role permissions:", error);
      alert("Error loading role permissions: " + error.message);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      await rbacAPI.createRole(newRole);
      setNewRole({ name: "", display_name: "", description: "" });
      await loadData();
      alert("Role created successfully");
    } catch (error) {
      alert("Error creating role: " + error.message);
    }
  };

  const handleCreatePermission = async (e) => {
    e.preventDefault();
    try {
      await rbacAPI.createPermission(newPermission);
      setNewPermission({
        name: "",
        display_name: "",
        description: "",
        resource: "",
        action: "",
      });
      await loadData();
      alert("Permission created successfully");
    } catch (error) {
      alert("Error creating permission: " + error.message);
    }
  };

  const handleAssignRole = async (userId, roleName) => {
    try {
      await rbacAPI.assignUserRole(userId, roleName);
      alert("Role assigned successfully");
      if (selectedUser === userId) {
        await loadUserPermissions(userId);
      }
    } catch (error) {
      alert("Error assigning role: " + error.message);
    }
  };

  const handleGrantPermission = async (
    userId,
    permissionName,
    expiresAt,
    reason
  ) => {
    try {
      await rbacAPI.grantUserPermission(
        userId,
        permissionName,
        expiresAt,
        reason
      );
      alert("Permission granted successfully");
      if (selectedUser === userId) {
        await loadUserPermissions(userId);
      }
    } catch (error) {
      alert("Error granting permission: " + error.message);
    }
  };

  const handleRevokePermission = async (userId, permissionName, reason) => {
    try {
      await rbacAPI.revokeUserPermission(userId, permissionName, reason);
      alert("Permission revoked successfully");
      if (selectedUser === userId) {
        await loadUserPermissions(userId);
      }
    } catch (error) {
      alert("Error revoking permission: " + error.message);
    }
  };

  const handleAssignPermissionToRole = async (roleId, permissionName) => {
    try {
      await rbacAPI.assignPermissionToRole(roleId, permissionName);
      alert("Permission assigned to role successfully");
      if (selectedRole === roleId) {
        await loadRolePermissions(roleId);
      }
    } catch (error) {
      alert("Error assigning permission to role: " + error.message);
    }
  };

  const handleRemovePermissionFromRole = async (roleId, permissionName) => {
    try {
      await rbacAPI.removePermissionFromRole(roleId, permissionName);
      alert("Permission removed from role successfully");
      if (selectedRole === roleId) {
        await loadRolePermissions(roleId);
      }
    } catch (error) {
      alert("Error removing permission from role: " + error.message);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="admin-panel-denied">
        <h2>Access Denied</h2>
        <p>You need admin privileges to access this panel.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="admin-panel-loading">Loading admin panel...</div>;
  }

  return (
    <DashboardLayout>
      <PermissionGuard 
        permissions={[PERMISSIONS.ADMIN_ACCESS]}
        fallback={
          <div className="admin-panel-denied">
            <div className="access-denied-message">
              <p>You need admin privileges to access this panel.</p>
            </div>
          </div>
        }
      >
        <div className="admin-panel">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <p>Manage roles, permissions, and user access</p>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === "users" ? "active" : ""}
          onClick={() => setActiveTab("users")}
        >
          User Management
        </button>
        <button
          className={activeTab === "roles" ? "active" : ""}
          onClick={() => setActiveTab("roles")}
        >
          Roles
        </button>
        <button
          className={activeTab === "permissions" ? "active" : ""}
          onClick={() => setActiveTab("permissions")}
        >
          Permissions
        </button>
        <button
          className={activeTab === "role-permissions" ? "active" : ""}
          onClick={() => setActiveTab("role-permissions")}
        >
          Role Permissions
        </button>
      </div>

      <div className="admin-content">
        {activeTab === "users" && (
          <div className="user-management">
            <h2>User Management</h2>

            <div className="user-actions">
              <div className="user-selector">
                <label>Select User (Enter User ID):</label>
                <input
                  type="text"
                  placeholder="User ID"
                  value={selectedUser || ""}
                  onChange={(e) => setSelectedUser(e.target.value)}
                />
                <button
                  onClick={() =>
                    selectedUser && loadUserPermissions(selectedUser)
                  }
                  disabled={!selectedUser}
                >
                  Load User Data
                </button>
              </div>

              {selectedUser && (
                <div className="user-role-assignment">
                  <h3>Assign Role to User</h3>
                  <select
                    onChange={(e) =>
                      e.target.value &&
                      handleAssignRole(selectedUser, e.target.value)
                    }
                    defaultValue=""
                  >
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.name}>
                        {role.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedUser && (
                <div className="user-permission-management">
                  <h3>Grant Permission</h3>
                  <div className="permission-form">
                    <select id="grant-permission">
                      <option value="">Select Permission</option>
                      {permissions.map((perm) => (
                        <option key={perm.id} value={perm.name}>
                          {perm.display_name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="datetime-local"
                      id="expires-at"
                      placeholder="Expires At (optional)"
                    />
                    <input
                      type="text"
                      id="grant-reason"
                      placeholder="Reason (optional)"
                    />
                    <button
                      onClick={() => {
                        const permSelect =
                          document.getElementById("grant-permission");
                        const expiresInput =
                          document.getElementById("expires-at");
                        const reasonInput =
                          document.getElementById("grant-reason");

                        if (permSelect.value) {
                          handleGrantPermission(
                            selectedUser,
                            permSelect.value,
                            expiresInput.value || null,
                            reasonInput.value
                          );
                        }
                      }}
                    >
                      Grant Permission
                    </button>
                  </div>

                  <h3>Revoke Permission</h3>
                  <div className="permission-form">
                    <select id="revoke-permission">
                      <option value="">Select Permission</option>
                      {permissions.map((perm) => (
                        <option key={perm.id} value={perm.name}>
                          {perm.display_name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      id="revoke-reason"
                      placeholder="Reason (optional)"
                    />
                    <button
                      onClick={() => {
                        const permSelect =
                          document.getElementById("revoke-permission");
                        const reasonInput =
                          document.getElementById("revoke-reason");

                        if (permSelect.value) {
                          handleRevokePermission(
                            selectedUser,
                            permSelect.value,
                            reasonInput.value
                          );
                        }
                      }}
                    >
                      Revoke Permission
                    </button>
                  </div>
                </div>
              )}

              {userPermissions && (
                <div className="user-permissions-display">
                  <h3>User Permissions & Role</h3>
                  <div className="user-info">
                    <p>
                      <strong>User ID:</strong> {userPermissions.user_id}
                    </p>
                    {userPermissions.role && (
                      <p>
                        <strong>Role:</strong>{" "}
                        {userPermissions.role.display_name} (
                        {userPermissions.role.name})
                      </p>
                    )}
                    <div className="permissions-list">
                      <h4>Effective Permissions:</h4>
                      <ul>
                        {userPermissions.effective_permissions?.map((perm) => (
                          <li key={perm}>{perm}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "roles" && (
          <div className="roles-management">
            <h2>Role Management</h2>

            <div className="create-role">
              <h3>Create New Role</h3>
              <form onSubmit={handleCreateRole}>
                <input
                  type="text"
                  placeholder="Role Name (e.g., content_manager)"
                  value={newRole.name}
                  onChange={(e) =>
                    setNewRole({ ...newRole, name: e.target.value })
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Display Name (e.g., Content Manager)"
                  value={newRole.display_name}
                  onChange={(e) =>
                    setNewRole({ ...newRole, display_name: e.target.value })
                  }
                  required
                />
                <textarea
                  placeholder="Description"
                  value={newRole.description}
                  onChange={(e) =>
                    setNewRole({ ...newRole, description: e.target.value })
                  }
                />
                <button type="submit">Create Role</button>
              </form>
            </div>

            <div className="existing-roles">
              <h3>Existing Roles</h3>
              <div className="roles-grid">
                {roles.map((role) => (
                  <div key={role.id} className="role-card">
                    <h4>{role.display_name}</h4>
                    <p>
                      <strong>Name:</strong> {role.name}
                    </p>
                    <p>
                      <strong>Description:</strong> {role.description}
                    </p>
                    <p>
                      <strong>Active:</strong> {role.is_active ? "Yes" : "No"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "permissions" && (
          <div className="permissions-management">
            <h2>Permission Management</h2>

            <div className="create-permission">
              <h3>Create New Permission</h3>
              <form onSubmit={handleCreatePermission}>
                <input
                  type="text"
                  placeholder="Permission Name (e.g., create_content)"
                  value={newPermission.name}
                  onChange={(e) =>
                    setNewPermission({ ...newPermission, name: e.target.value })
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Display Name (e.g., Create Content)"
                  value={newPermission.display_name}
                  onChange={(e) =>
                    setNewPermission({
                      ...newPermission,
                      display_name: e.target.value,
                    })
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Resource (e.g., content)"
                  value={newPermission.resource}
                  onChange={(e) =>
                    setNewPermission({
                      ...newPermission,
                      resource: e.target.value,
                    })
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Action (e.g., create)"
                  value={newPermission.action}
                  onChange={(e) =>
                    setNewPermission({
                      ...newPermission,
                      action: e.target.value,
                    })
                  }
                  required
                />
                <textarea
                  placeholder="Description"
                  value={newPermission.description}
                  onChange={(e) =>
                    setNewPermission({
                      ...newPermission,
                      description: e.target.value,
                    })
                  }
                />
                <button type="submit">Create Permission</button>
              </form>
            </div>

            <div className="existing-permissions">
              <h3>Existing Permissions</h3>
              <div className="permissions-grid">
                {permissions.map((perm) => (
                  <div key={perm.id} className="permission-card">
                    <h4>{perm.display_name}</h4>
                    <p>
                      <strong>Name:</strong> {perm.name}
                    </p>
                    <p>
                      <strong>Resource:</strong> {perm.resource}
                    </p>
                    <p>
                      <strong>Action:</strong> {perm.action}
                    </p>
                    <p>
                      <strong>Description:</strong> {perm.description}
                    </p>
                    <p>
                      <strong>Active:</strong> {perm.is_active ? "Yes" : "No"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "role-permissions" && (
          <div className="role-permissions-management">
            <h2>Role Permissions Management</h2>
            <p>Assign and manage permissions for each role</p>

            <div className="role-selector">
              <label>Select Role:</label>
              <select
                value={selectedRole || ""}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  if (e.target.value) {
                    loadRolePermissions(e.target.value);
                  } else {
                    setRolePermissions([]);
                  }
                }}
              >
                <option value="">Choose a role...</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.display_name} ({role.name})
                  </option>
                ))}
              </select>
            </div>

            {selectedRole && (
              <div className="role-permission-management">
                <div className="current-role-info">
                  <h3>
                    Managing: {roles.find(r => r.id === selectedRole)?.display_name}
                  </h3>
                  <p>{roles.find(r => r.id === selectedRole)?.description}</p>
                </div>

                <div className="assign-permission-section">
                  <h4>Assign New Permission</h4>
                  <div className="permission-assignment-form">
                    <select id="role-permission-select">
                      <option value="">Select Permission to Assign</option>
                      {permissions
                        .filter(perm => !rolePermissions.some(rp => rp.name === perm.name))
                        .map((perm) => (
                          <option key={perm.id} value={perm.name}>
                            {perm.display_name} ({perm.resource}.{perm.action})
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => {
                        const permSelect = document.getElementById("role-permission-select");
                        if (permSelect.value) {
                          handleAssignPermissionToRole(selectedRole, permSelect.value);
                          permSelect.value = "";
                        }
                      }}
                    >
                      Assign Permission
                    </button>
                  </div>
                </div>

                <div className="current-permissions-section">
                  <h4>Current Role Permissions</h4>
                  {rolePermissions.length > 0 ? (
                    <div className="permissions-list">
                      {rolePermissions.map((perm) => (
                        <div key={perm.id} className="permission-item">
                          <div className="permission-info">
                            <strong>{perm.display_name}</strong>
                            <span className="permission-details">
                              {perm.resource}.{perm.action}
                            </span>
                            <p className="permission-description">{perm.description}</p>
                          </div>
                          <button
                            className="remove-permission-btn"
                            onClick={() => handleRemovePermissionFromRole(selectedRole, perm.name)}
                            title="Remove this permission from role"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-permissions">This role has no permissions assigned.</p>
                  )}
                </div>

                <div className="bulk-assignment-section">
                  <h4>Bulk Permission Assignment</h4>
                  <p>Quickly assign multiple permissions at once:</p>
                  <div className="bulk-checkboxes">
                    {permissions
                      .filter(perm => !rolePermissions.some(rp => rp.name === perm.name))
                      .map((perm) => (
                        <label key={perm.id} className="bulk-permission-checkbox">
                          <input
                            type="checkbox"
                            value={perm.name}
                            onChange={(e) => {
                              // Handle checkbox selection for bulk assignment
                              const checkbox = e.target;
                              checkbox.dataset.selected = checkbox.checked;
                            }}
                          />
                          <span>{perm.display_name}</span>
                          <small>({perm.resource}.{perm.action})</small>
                        </label>
                      ))}
                  </div>
                  <button
                    className="bulk-assign-btn"
                    onClick={async () => {
                      const checkboxes = document.querySelectorAll('.bulk-permission-checkbox input[type="checkbox"]:checked');
                      const selectedPermissions = Array.from(checkboxes).map(cb => cb.value);
                      
                      if (selectedPermissions.length > 0) {
                        try {
                          await rbacAPI.assignBulkPermissionsToRole(selectedRole, selectedPermissions);
                          alert(`${selectedPermissions.length} permissions assigned successfully`);
                          await loadRolePermissions(selectedRole);
                          // Uncheck all checkboxes
                          checkboxes.forEach(cb => cb.checked = false);
                        } catch (error) {
                          alert("Error assigning permissions: " + error.message);
                        }
                      } else {
                        alert("Please select at least one permission to assign");
                      }
                    }}
                  >
                    Assign Selected Permissions
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
        </div>
      </PermissionGuard>
    </DashboardLayout>
  );
};

export default AdminPanel;
