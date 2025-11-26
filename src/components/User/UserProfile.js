import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { rbacAPI } from "../../utils/rbacAPI";
import { authAPI } from "../../utils/apiServices";
import { useNotificationContext } from "../../contexts/NotificationContext";
import DashboardLayout from "../Layout/DashboardLayout/DashboardLayout";
import "./UserProfile.css";

const UserProfile = () => {
  const { user, role, permissions, refreshUserProfile } = useAuth();
  const { showSuccess, showError } = useNotificationContext();
  const [userPermissions, setUserPermissions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fathomApiKey, setFathomApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(
    user?.profile_image_url || user?.profileImageUrl || ""
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [hasSavedFathomKey, setHasSavedFathomKey] = useState(null);
  const [registeringWebhook, setRegisteringWebhook] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadUserPermissions();
      loadUserProfile();
    }
    if (user?.profile_image_url || user?.profileImageUrl) {
      setProfileImageUrl(user.profile_image_url || user.profileImageUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const profile = await authAPI.getProfile();
      setFathomApiKey(profile.fathom_api_key || "");
      setHasSavedFathomKey(Boolean(profile.fathom_api_key));
      if (profile.profile_image_url) {
        setProfileImageUrl(profile.profile_image_url);
      }
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
      setHasSavedFathomKey(Boolean(fathomApiKey));
    } catch (error) {
      console.error("Error saving profile:", error);
      showError(error.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleWebhookSetup = async () => {
    if (!hasSavedFathomKey) {
      showError("Save your Fathom API key before creating a webhook.");
      return;
    }

    try {
      setRegisteringWebhook(true);
      await authAPI.setupFathomWebhook();
      showSuccess("Fathom webhook created successfully");
    } catch (error) {
      console.error("Error setting up Fathom webhook:", error);
      showError(error.message || "Failed to create Fathom webhook");
    } finally {
      setRegisteringWebhook(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      showError("Please select a valid image file.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showError("Please choose an image smaller than 5 MB.");
      return;
    }

    setUploadingAvatar(true);
    try {
      await authAPI.uploadProfileImage(file);
      showSuccess("Profile image updated");
      const updatedUser = await refreshUserProfile();
      setProfileImageUrl(
        updatedUser.profile_image_url || updatedUser.profileImageUrl || ""
      );
    } catch (error) {
      console.error("Error uploading profile image:", error);
      showError(error.message || "Failed to upload profile image");
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const avatarInitial =
    user?.first_name?.charAt(0)?.toUpperCase() ||
    user?.full_name?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "U";

  if (!user) {
    return (
      <DashboardLayout>
        <div>Please log in to view your profile.</div>
      </DashboardLayout>
    );
  }

  const primaryName =
    user.full_name || [user.first_name, user.last_name].filter(Boolean).join(" ") || "User";

  const stats = [
    {
      label: "Total Permissions",
      value: permissions?.length ? permissions.length : "—",
    },
    {
      label: "Custom Grants",
      value: userPermissions?.user_specific_permissions?.length || 0,
    },
    {
      label: "Role",
      value: role?.display_name || role?.name || "Unassigned",
    },
  ];

  return (
    <DashboardLayout>
      <div className="user-profile-shell">
        <section className="profile-hero">
          <div className="profile-hero__surface">
            <div className="profile-hero__primary">
              <div className="hero-avatar">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="Profile avatar" />
                ) : (
                  <span>{avatarInitial}</span>
                )}
              </div>
              <div className="hero-details">
                <p className="hero-label">Signed in as</p>
                <h1>{primaryName}</h1>
                <p className="hero-email">{user.email}</p>
                <div className="hero-meta">
                  {role && (
                    <span className="meta-pill primary">
                      {role.display_name || role.name}
                    </span>
                  )}
                  <span className="meta-pill subtle">User ID: {user.id}</span>
                </div>
              </div>
            </div>
            <ul className="hero-stats">
              {stats.map((item) => (
                <li key={item.label}>
                  <span className="stat-label">{item.label}</span>
                  <strong>{item.value}</strong>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="profile-grid">
          <div className="profile-grid__main">
            <section className="profile-section profile-avatar-section modern-card">
              <header>
                <div>
                  <p className="eyebrow">Identity</p>
                  <h3>Profile Photo</h3>
                </div>
                <span className="badge-neutral">Private to you</span>
              </header>
              <p className="section-description">
                Upload a clear, square image (JPG/PNG/WebP, max 5 MB). We use it
                across the dashboard so teammates recognize you instantly.
              </p>
              <div className="profile-avatar-grid">
                <div className="profile-avatar-preview">
                  {profileImageUrl ? (
                    <img
                      src={profileImageUrl}
                      alt="Profile avatar"
                      className="profile-avatar-image"
                    />
                  ) : (
                    <span className="profile-avatar-fallback">{avatarInitial}</span>
                  )}
                </div>
                <div className="profile-avatar-actions">
                  <label className="avatar-upload-button">
                    {uploadingAvatar ? "Uploading..." : "Upload new photo"}
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                    />
                  </label>
                  <p className="avatar-upload-hint">
                    Recommended 400x400px minimum • Transparent backgrounds supported
                  </p>
                </div>
              </div>
            </section>

            <section className="profile-section modern-card">
              <header>
                <p className="eyebrow">Contact</p>
                <h3>User Information</h3>
              </header>
              <div className="info-grid">
                <div className="info-item">
                  <label>Email</label>
                  <span>{user.email}</span>
                </div>
                <div className="info-item">
                  <label>First Name</label>
                  <span>{user.first_name || "Not Available"}</span>
                </div>
                <div className="info-item">
                  <label>Last Name</label>
                  <span>{user.last_name || "Not Available"}</span>
                </div>
              </div>
            </section>

            {role && (
              <section className="profile-section modern-card">
                <header>
                  <p className="eyebrow">Access</p>
                  <h3>Role Information</h3>
                </header>
                <div className="role-info">
                  <div className="info-item">
                    <label>Role Name</label>
                    <span>{role.name}</span>
                  </div>
                  <div className="info-item">
                    <label>Display Name</label>
                    <span>{role.display_name}</span>
                  </div>
                  <div className="info-item">
                    <label>Description</label>
                    <span>{role.description || "No description available"}</span>
                  </div>
                </div>
              </section>
            )}

            <section className="profile-section modern-card">
              <header>
                <p className="eyebrow">Integrations</p>
                <h3>Fathom</h3>
              </header>
              <p className="section-description">
                Connect your Fathom account to import meetings and tasks instantly.
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
                  className="user-profile-action-btn primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  className="user-profile-action-btn secondary"
                  onClick={handleWebhookSetup}
                  disabled={!hasSavedFathomKey || registeringWebhook}
                >
                  {registeringWebhook ? "Creating webhook..." : "Create Fathom Webhook"}
                </button>
              </div>
              {hasSavedFathomKey === false && (
                <p className="field-hint">
                  Save your Fathom API key to enable automatic webhook setup.
                </p>
              )}
            </section>
          </div>

          <aside className="profile-grid__secondary">
            <section className="profile-section modern-card permissions-card">
              <header>
                <p className="eyebrow">Security</p>
                <h3>Permissions</h3>
              </header>
              {loading ? (
                <div className="loading-state">Loading permissions...</div>
              ) : (
                <div className="permissions-section">
                  {permissions && permissions.length > 0 ? (
                    <div className="permissions-list">
                      <h4>Effective Permissions</h4>
                      <div className="permissions-grid">
                        {permissions.map((permission) => (
                          <span key={permission} className="permission-badge">
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>No permissions assigned yet.</p>
                      <span>Contact an administrator if you need access.</span>
                    </div>
                  )}

                  {userPermissions && (
                    <div className="detailed-permissions">
                      <h4>Detailed Permission Information</h4>

                      {userPermissions.role && (
                        <div className="role-permissions">
                          <h5>Role-based Permissions</h5>
                          <p>From role: {userPermissions.role.display_name}</p>
                        </div>
                      )}

                      {userPermissions.effective_permissions &&
                        userPermissions.effective_permissions.length > 0 && (
                          <div className="effective-permissions">
                            <h5>All Effective Permissions</h5>
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
                            <h5>User-specific Permissions</h5>
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
            </section>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserProfile;