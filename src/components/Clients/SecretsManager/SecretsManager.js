import React, { useState, useEffect } from "react";
import { secretsAPI } from "../../../utils/apiServices";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import LoadingSpinner from "../../UI/LoadingSpinner/LoadingSpinner";
import SecretForm from "./SecretForm";
import SecretViewer from "./SecretViewer";
import {
  Security as SecurityIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import "./SecretsManager.css";

const SecretsManager = ({ clientId, clientName }) => {
  const [secrets, setSecrets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSecretForm, setShowSecretForm] = useState(false);
  const [editingSecret, setEditingSecret] = useState(null);
  const [viewingSecret, setViewingSecret] = useState(null);
  const [showSecretViewer, setShowSecretViewer] = useState(false);
  const { showError, showSuccess } = useNotificationContext();

  useEffect(() => {
    if (clientId) {
      loadSecrets();
    }
  }, [clientId]);

  const loadSecrets = async () => {
    try {
      setLoading(true);
      const secretsData = await secretsAPI.getByClient(clientId);
      setSecrets(secretsData || []);
    } catch (error) {
      showError("Failed to load secrets");
      console.error("Error loading secrets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSecret = () => {
    setEditingSecret(null);
    setShowSecretForm(true);
  };

  const handleEditSecret = (secret) => {
    setEditingSecret(secret);
    setShowSecretForm(true);
  };

  const handleViewSecret = async (secret) => {
    try {
      const secretData = await secretsAPI.getById(secret.id);
      setViewingSecret({
        ...secret,
        decryptedValue: secretData.value || secretData.secret_encrypted,
      });
      setShowSecretViewer(true);
    } catch (error) {
      showError("Failed to decrypt secret");
      console.error("Error viewing secret:", error);
    }
  };

  const handleDeleteSecret = async (secret) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the secret "${secret.title}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await secretsAPI.delete(secret.id);
      showSuccess("Secret deleted successfully");
      loadSecrets();
    } catch (error) {
      showError("Failed to delete secret");
      console.error("Error deleting secret:", error);
    }
  };

  const handleSecretFormSave = () => {
    setShowSecretForm(false);
    setEditingSecret(null);
    loadSecrets();
  };

  const handleSecretFormCancel = () => {
    setShowSecretForm(false);
    setEditingSecret(null);
  };

  const handleSecretViewerClose = () => {
    setShowSecretViewer(false);
    setViewingSecret(null);
  };

  if (loading) {
    return (
      <div className="secrets-loading">
        <LoadingSpinner message="Loading secrets..." />
      </div>
    );
  }

  return (
    <div className="secrets-manager">
      <div className="secrets-header">
        <div className="secrets-title">
          <SecurityIcon className="secrets-icon" />
          <div>
            <h3>Client Secrets</h3>
            <p>Securely manage sensitive information for {clientName}</p>
          </div>
        </div>
        <button
          className="btn btn-primary add-secret-btn"
          onClick={handleAddSecret}
        >
          <AddIcon />
          Add Secret
        </button>
      </div>

      {secrets.length > 0 ? (
        <div className="secrets-list">
          {secrets.map((secret) => (
            <div key={secret.id} className="secret-item">
              <div className="secret-icon-wrapper">
                <LockIcon className="secret-lock-icon" />
              </div>

              <div className="secret-info">
                <h4 className="secret-title">{secret.title}</h4>
                <div className="secret-meta">
                  <div className="meta-item">
                    <PersonIcon className="meta-icon" />
                    <span>Created by {secret.created_by || "Unknown"}</span>
                  </div>
                  <div className="meta-item">
                    <TimeIcon className="meta-icon" />
                    <span>
                      {new Date(secret.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="secret-actions">
                <button
                  className="action-btn view-btn"
                  onClick={() => handleViewSecret(secret)}
                  title="View Secret"
                >
                  <ViewIcon />
                </button>
                <button
                  className="action-btn edit-btn"
                  onClick={() => handleEditSecret(secret)}
                  title="Edit Secret"
                >
                  <EditIcon />
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDeleteSecret(secret)}
                  title="Delete Secret"
                >
                  <DeleteIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="secrets-empty">
          <SecurityIcon className="empty-icon" />
          <h4>No Secrets Found</h4>
          <p>
            Start by adding your first secret to securely store sensitive
            information for this client.
          </p>
          <button className="btn btn-primary" onClick={handleAddSecret}>
            <AddIcon />
            Add Your First Secret
          </button>
        </div>
      )}

      {/* Secret Form Modal */}
      <SecretForm
        secret={editingSecret}
        clientId={clientId}
        clientName={clientName}
        isOpen={showSecretForm}
        onSave={handleSecretFormSave}
        onCancel={handleSecretFormCancel}
      />

      {/* Secret Viewer Modal */}
      <SecretViewer
        secret={viewingSecret}
        isOpen={showSecretViewer}
        onClose={handleSecretViewerClose}
      />
    </div>
  );
};

export default SecretsManager;
