import React, { useState, useEffect } from "react";
import { secretsAPI } from "../../../utils/apiServices";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import {
  Close as CloseIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import "./SecretForm.css";

const SecretForm = ({ clientId, clientName, isOpen, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: "",
    value: ""
  });
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { showError, showSuccess } = useNotificationContext();

  useEffect(() => {
    if (isOpen) {
      // Only for adding new secrets
      setFormData({
        title: "",
        value: ""
      });
      setErrors({});
      setShowSecret(false);
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }

    if (!formData.value.trim()) {
      newErrors.value = "Secret value is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Create new secret (backend handles encryption)
      await secretsAPI.create(clientId, {
        title: formData.title.trim(),
        value: formData.value
      });
      
      showSuccess("Secret created successfully");
      onSave();
    } catch (error) {
      showError("Failed to create secret");
      console.error("Error saving secret:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const toggleSecretVisibility = () => {
    setShowSecret(!showSecret);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="secret-form-modal">
        <div className="modal-header">
          <div className="modal-title">
            <SecurityIcon className="modal-icon" />
            <div>
              <h3>Add New Secret</h3>
              <p>For client: {clientName}</p>
            </div>
          </div>
          <button 
            className="close-btn"
            onClick={onCancel}
            disabled={loading}
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="secret-form">
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Secret Title *
            </label>
            <input
              id="title"
              type="text"
              className={`form-input ${errors.title ? "error" : ""}`}
              placeholder="e.g., API Key, Database Password, etc."
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              disabled={loading}
              maxLength={100}
            />
            {errors.title && (
              <span className="error-message">{errors.title}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="value" className="form-label">
              Secret Value *
            </label>
            <div className="secret-input-wrapper">
              <input
                id="value"
                type={showSecret ? "text" : "password"}
                className={`form-input secret-input ${errors.value ? "error" : ""}`}
                placeholder="Enter secret value"
                value={formData.value}
                onChange={(e) => handleInputChange("value", e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-visibility-btn"
                onClick={toggleSecretVisibility}
                disabled={loading}
              >
                {showSecret ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </button>
            </div>
            {errors.value && (
              <span className="error-message">{errors.value}</span>
            )}
            <div className="form-help">
              This value will be encrypted and stored securely
            </div>
          </div>

          <div className="security-notice">
            <SecurityIcon className="notice-icon" />
            <div className="notice-text">
              <strong>Security Notice:</strong> This secret will be encrypted before storage. 
              Make sure you're in a secure environment when entering sensitive information.
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="btn-spinner" />
                  Creating...
                </>
              ) : (
                <>
                  <SaveIcon />
                  Create Secret
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SecretForm;