import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { rbacAPI } from "../../utils/rbacAPI";
import DashboardLayout from "../Layout/DashboardLayout/DashboardLayout";
import "./UserProfile.css";

const UserProfile = () => {
  const { user, role, permissions, loadUserData } = useAuth();
  const [userPermissions, setUserPermissions] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadUserPermissions();
    }
  }, [user]);

  const loadUserPermissions = async () => {
    try {
      setLoading(true);
      const perms = await rbacAPI.getUserPermissions(user.id);
      setUserPermissions(perms);
    } catch (error) {
      console.error("Error loading user permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = async () => {
    await loadUserData();
    await loadUserPermissions();
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div>Please log in to view your profile.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="user-profile-container user-profile">
        {/* <div className="profile-header">
          <div className="profile-avatar">
            {user.first_name?.charAt(0) || user.email?.charAt(0) || 'U'}
          </div>
          <div className="profile-info">
            <h2>{user.full_name || user.first_name || 'User'}</h2>
            <p className="profile-email">{user.email}</p>
            {role && (
              <div className="profile-role">
                <span className="role-badge">{role.display_name || role.name}</span>
              </div>
            )}
          </div>
          <button onClick={refreshUserData} className="refresh-btn">
            Refresh Data
          </button>
        </div> */}

        <div className="profile-content">
          <div className="profile-section">
            <h3>User Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Email:</label>
                <span>{user.email}</span>
              </div>
              <div className="info-item">
                <label>First Name:</label>
                <span>{user.first_name || "Not Available"}</span>
              </div>
              <div className="info-item">
                <label>Last Name:</label>
                <span>{user.last_name || "Not Available"}</span>
              </div>
            </div>
          </div>

          {role && (
            <div className="profile-section">
              <h3>Role Information</h3>
              <div className="role-info">
                <div className="info-item">
                  <label>Role Name:</label>
                  <span>{role.name}</span>
                </div>
                <div className="info-item">
                  <label>Display Name:</label>
                  <span>{role.display_name}</span>
                </div>
                <div className="info-item">
                  <label>Description:</label>
                  <span>{role.description || "No description available"}</span>
                </div>
              </div>
            </div>
          )}

          <div className="profile-section">
            <h3>Permissions</h3>
            {loading ? (
              <div>Loading permissions...</div>
            ) : (
              <div className="permissions-section">
                {permissions && permissions.length > 0 ? (
                  <div className="permissions-list">
                    <h4>Effective Permissions:</h4>
                    <div className="permissions-grid">
                      {permissions.map((permission) => (
                        <span key={permission} className="permission-badge">
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p>No permissions assigned</p>
                )}

                {userPermissions && (
                  <div className="detailed-permissions">
                    <h4>Detailed Permission Information:</h4>

                    {userPermissions.role && (
                      <div className="role-permissions">
                        <h5>Role-based Permissions:</h5>
                        <p>From role: {userPermissions.role.display_name}</p>
                      </div>
                    )}

                    {userPermissions.effective_permissions &&
                      userPermissions.effective_permissions.length > 0 && (
                        <div className="effective-permissions">
                          <h5>All Effective Permissions:</h5>
                          <div className="permissions-grid">
                            {userPermissions.effective_permissions.map(
                              (perm) => (
                                <span
                                  key={perm}
                                  className="permission-badge effective"
                                >
                                  {perm}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {userPermissions.user_specific_permissions &&
                      userPermissions.user_specific_permissions.length > 0 && (
                        <div className="user-specific-permissions">
                          <h5>User-specific Permissions:</h5>
                          <div className="permissions-grid">
                            {userPermissions.user_specific_permissions.map(
                              (perm) => (
                                <span
                                  key={perm.id}
                                  className="permission-badge user-specific"
                                >
                                  {perm.permission_name}
                                  {perm.expires_at && (
                                    <small>
                                      {" "}
                                      (expires:{" "}
                                      {new Date(
                                        perm.expires_at
                                      ).toLocaleDateString()}
                                      )
                                    </small>
                                  )}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserProfile;
