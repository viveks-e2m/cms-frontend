import React, { useState, useEffect } from "react";
import { clientAPI } from "../../../utils/apiServices";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Language as WebsiteIcon,
  AccountCircle as AccountManagerIcon,
  Support as AdoptionSpecialistIcon,
} from "@mui/icons-material";
import "./ClientForm.css";

const ClientForm = ({ client, isOpen, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    status: "pre-boarding",
    account_manager: "",
    adoption_specialist: ""
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const { showError, showSuccess } = useNotificationContext();

  useEffect(() => {
    if (isOpen) {
      // Load users for dropdowns
      loadUsers();
      
      if (client) {
        // Editing existing client
        setFormData({
          name: client.name || "",
          website: client.website || "",
          status: client.status || "pre-boarding",
          account_manager: client.account_manager || "",
          adoption_specialist: client.adoption_specialist || ""
        });
      } else {
        // Adding new client - account_manager will default to current user on backend
        setFormData({
          name: "",
          website: "",
          status: "pre-boarding",
          account_manager: "", // Will be set to current user by backend
          adoption_specialist: ""
        });
      }
      setErrors({});
    }
  }, [client, isOpen]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await clientAPI.getAllUsers();
      setUsers(response || []);
    } catch (error) {
      console.error("Error loading users:", error);
      showError("Failed to load users for selection");
    } finally {
      setLoadingUsers(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Client name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Client name must be at least 2 characters";
    }

    if (!formData.website.trim()) {
      newErrors.website = "Website is required";
    } else {
      // Basic URL validation
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlPattern.test(formData.website)) {
        newErrors.website = "Please enter a valid website URL";
      }
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

      // Ensure website has protocol
      let website = formData.website.trim();
      if (!website.startsWith('http://') && !website.startsWith('https://')) {
        website = 'https://' + website;
      }

      const clientData = {
        name: formData.name.trim(),
        website: website,
        status: formData.status,
        account_manager: formData.account_manager || "",
        adoption_specialist: formData.adoption_specialist || ""
      };

      if (client) {
        // Update existing client
        await clientAPI.update(client.id, clientData);
        showSuccess("Client updated successfully");
      } else {
        // Create new client
        await clientAPI.create(clientData);
        showSuccess("Client created successfully");
      }

      onSave();
    } catch (error) {
      showError(client ? "Failed to update client" : "Failed to create client");
      console.error("Error saving client:", error);
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

  console.log("ClientForm render - isOpen:", isOpen); // Debug log
  
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="client-form-modal">
        <div className="modal-header">
          <div className="modal-title">
            <BusinessIcon className="modal-icon" />
            <div>
              <h3>{client ? "Edit Client" : "Add New Client"}</h3>
              <p>Enter client information below</p>
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

        <form onSubmit={handleSubmit} className="client-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              <PersonIcon className="label-icon" />
              Client Name *
            </label>
            <input
              id="name"
              type="text"
              className={`form-input ${errors.name ? "error" : ""}`}
              placeholder="Enter client name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              disabled={loading}
              maxLength={100}
            />
            {errors.name && (
              <span className="error-message">{errors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="website" className="form-label">
              <WebsiteIcon className="label-icon" />
              Website *
            </label>
            <input
              id="website"
              type="url"
              className={`form-input ${errors.website ? "error" : ""}`}
              placeholder="https://example.com"
              value={formData.website}
              onChange={(e) => handleInputChange("website", e.target.value)}
              disabled={loading}
            />
            {errors.website && (
              <span className="error-message">{errors.website}</span>
            )}
            <div className="form-help">
              Enter the client's website URL (e.g., example.com or https://example.com)
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="status" className="form-label">
              Status
            </label>
            <select
              id="status"
              className="form-select"
              value={formData.status}
              onChange={(e) => handleInputChange("status", e.target.value)}
              disabled={loading}
            >
              <option value="pre-boarding">Pre-boarding</option>
              <option value="onboarding">Onboarding</option>
              <option value="assessment">Assessment</option>
              <option value="active">Active</option>
            </select>
            <div className="form-help">
              Set the client status (defaults to Pre-boarding)
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="account_manager" className="form-label">
              <AccountManagerIcon className="label-icon" />
              Account Manager
            </label>
            <select
              id="account_manager"
              className="form-select"
              value={formData.account_manager}
              onChange={(e) => handleInputChange("account_manager", e.target.value)}
              disabled={loading || loadingUsers}
            >
              <option value="">
                {client ? "Select Account Manager" : "Default to Current User"}
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
            <div className="form-help">
              {client 
                ? "Select the account manager for this client"
                : "Leave empty to default to current user"
              }
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="adoption_specialist" className="form-label">
              <AdoptionSpecialistIcon className="label-icon" />
              Adoption Specialist
            </label>
            <select
              id="adoption_specialist"
              className="form-select"
              value={formData.adoption_specialist}
              onChange={(e) => handleInputChange("adoption_specialist", e.target.value)}
              disabled={loading || loadingUsers}
            >
              <option value="">Select Adoption Specialist (Optional)</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
            <div className="form-help">
              Optionally assign an adoption specialist to this client
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
                  {client ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <SaveIcon />
                  {client ? "Update Client" : "Create Client"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;