import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { rbacAPI } from "../../utils/rbacAPI";
import { authAPI } from "../../utils/apiServices";
import { useNotificationContext } from "../../contexts/NotificationContext";
import DashboardLayout from "../Layout/DashboardLayout/DashboardLayout";
import "./UserProfile.css";

const UserProfile = () => {
  const { user, role, permissions } = useAuth();
  const { showSuccess, showError } = useNotificationContext();
  const [userPermissions, setUserPermissions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fathomApiKey, setFathomApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadUserPermissions();
      loadUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const profile = await authAPI.getProfile();
      setFathomApiKey(profile.fathom_api_key || "");
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

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

  const handleSave = async () => {
    try {
      setSaving(true);
      await authAPI.updateProfile({
        fathom_api_key: fathomApiKey || null,
      });
      showSuccess("Profile updated successfully");
    } catch (error) {
      console.error("Error saving profile:", error);
      showError(error.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
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

          {/* Fathom API Key Section */}
          <div className="profile-section">
            <h3>Fathom Integration</h3>
            <p className="section-description">
              Connect your Fathom account to quickly import meetings
            </p>
            
            <div className="form-group">
              <label htmlFor="fathom-api-key">
                Fathom API Key
                <span className="optional-badge">Optional</span>
              </label>
              <div className="api-key-input-wrapper">
                <input
                  id="fathom-api-key"
                  type={showApiKey ? "text" : "password"}
                  className="form-input"
                  value={fathomApiKey}
                  onChange={(e) => setFathomApiKey(e.target.value)}
                  placeholder="Enter your Fathom API key"
                />
                <button
                  type="button"
                  className="toggle-visibility-btn"
                  onClick={() => setShowApiKey(!showApiKey)}
                  title={showApiKey ? "Hide API key" : "Show API key"}
                >
                  {showApiKey ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="field-hint">
                Get your API key from{" "}
                <a
                  href="https://app.fathom.video/settings/integrations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="external-link"
                >
                  Fathom Settings → Integrations
                </a>
              </p>
            </div>
            <div className="profile-actions">
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

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