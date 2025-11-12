import React, { useState, useEffect } from "react";
import { clientAPI } from "../../../utils/apiServices";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import { useCreateClient, useUpdateClient } from "../../../hooks/useMutations";
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Language as WebsiteIcon,
  AccountCircle as AccountManagerIcon,
  Support as AdoptionSpecialistIcon,
  Assignment as PlanIcon,
  Chat as CommunicationIcon,
  SmartToy as AIExecutorIcon,
  DateRange as DateIcon,
  Link as LinkIcon,
  Assessment as AuditIcon,
} from "@mui/icons-material";
import "./ClientForm.css";

const ClientForm = ({ client, isOpen, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    status: "pre-boarding",
    account_manager: "",
    adoption_specialist: "",
    plan_details: "",
    communication_tool: "",
    ai_executor: "",
    assessment_start_date: "",
    assessment_end_date: "",
    document_link: "",
    task_audit_sheet_link: "",
  });
  const [errors, setErrors] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersByRole, setUsersByRole] = useState({
    account_manager: [],
    adoption_specialist: [],
    ai_executor: [],
  });
  const { showError } = useNotificationContext();
  
  // Use mutation hooks for proper cache invalidation
  const createClientMutation = useCreateClient();
  const updateClientMutation = useUpdateClient();

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
          adoption_specialist: client.adoption_specialist || "",
          plan_details: client.plan_details || "",
          communication_tool: client.communication_tool || "",
          ai_executor: client.ai_executor || "",
          assessment_start_date: client.assessment_start_date
            ? client.assessment_start_date.split("T")[0]
            : "",
          assessment_end_date: client.assessment_end_date
            ? client.assessment_end_date.split("T")[0]
            : "",
          document_link: client.document_link || "",
          task_audit_sheet_link: client.task_audit_sheet_link || "",
        });
      } else {
        // Adding new client - account_manager will default to current user on backend
        setFormData({
          name: "",
          website: "",
          status: "pre-boarding",
          account_manager: "", // Will be set to current user by backend
          adoption_specialist: "",
          plan_details: "",
          communication_tool: "",
          ai_executor: "",
          assessment_start_date: "",
          assessment_end_date: "",
          document_link: "",
          task_audit_sheet_link: "",
        });
      }
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, isOpen]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await clientAPI.getAllUsers();
      const allUsers = response || [];
      
      // Filter users by role for dropdowns
      const roleGroups = {
        account_manager: [],
        adoption_specialist: [],
        ai_executor: [],
      };
      
      allUsers.forEach(user => {
        const roleName = user.roles?.name; // Note: backend returns 'roles' object with role data
        if (roleName && roleGroups.hasOwnProperty(roleName)) {
          roleGroups[roleName].push(user);
        }
      });
      
      setUsersByRole(roleGroups);
      console.log("Users grouped by role:", roleGroups);
      
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
      const urlPattern =
        /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      if (!urlPattern.test(formData.website)) {
        newErrors.website = "Please enter a valid website URL";
      }
    }

    // Validate assessment dates
    if (formData.assessment_start_date && formData.assessment_end_date) {
      const startDate = new Date(formData.assessment_start_date);
      const endDate = new Date(formData.assessment_end_date);
      if (startDate >= endDate) {
        newErrors.assessment_end_date = "End date must be after start date";
      }
    }

    // Validate URLs if provided
    const urlFields = ["document_link", "task_audit_sheet_link"];
    urlFields.forEach((field) => {
      if (formData[field] && formData[field].trim()) {
        const urlPattern = /^https?:\/\/.+/;
        if (!urlPattern.test(formData[field].trim())) {
          newErrors[field] =
            "Please enter a valid URL starting with http:// or https://";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Ensure website has protocol
    let website = formData.website.trim();
    if (!website.startsWith("http://") && !website.startsWith("https://")) {
      website = "https://" + website;
    }

    const clientData = {
      name: formData.name.trim(),
      website: website,
      status: formData.status,
      account_manager: formData.account_manager || "",
      adoption_specialist: formData.adoption_specialist || "",
      plan_details: formData.plan_details || null,
      communication_tool: formData.communication_tool.trim() || null,
      ai_executor: formData.ai_executor || null,
      assessment_start_date: formData.assessment_start_date || null,
      assessment_end_date: formData.assessment_end_date || null,
      document_link: formData.document_link.trim() || null,
      task_audit_sheet_link: formData.task_audit_sheet_link.trim() || null,
    };

    if (client) {
      // Update existing client using mutation hook
      updateClientMutation.mutate(
        { clientId: client.id, clientData },
        {
          onSuccess: () => {
            onSave();
          },
          onError: (error) => {
            showError(error.message || "Failed to update client");
            console.error("Error updating client:", error);
          },
        }
      );
    } else {
      // Create new client using mutation hook
      createClientMutation.mutate(clientData, {
        onSuccess: () => {
          onSave();
        },
        onError: (error) => {
          showError(error.message || "Failed to create client");
          console.error("Error creating client:", error);
        },
      });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
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
          <button className="close-btn" onClick={onCancel} disabled={createClientMutation.isPending || updateClientMutation.isPending}>
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
              disabled={createClientMutation.isPending || updateClientMutation.isPending}
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
              disabled={createClientMutation.isPending || updateClientMutation.isPending}
            />
            {errors.website && (
              <span className="error-message">{errors.website}</span>
            )}
            <div className="form-help">
              Enter the client's website URL (e.g., example.com or
              https://example.com)
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
              disabled={createClientMutation.isPending || updateClientMutation.isPending}
            >
              <option value="pre-boarding">Pre-boarding</option>
              <option value="onboarding">Onboarding</option>
              <option value="assessment">Assessment</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
              onChange={(e) =>
                handleInputChange("account_manager", e.target.value)
              }
              disabled={loadingUsers || createClientMutation.isPending || updateClientMutation.isPending}
            >
              <option value="">
                {client ? "Select Account Manager" : "Default to Current User"}
              </option>
              {usersByRole.account_manager.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.name || user.email}
                  {user.roles?.display_name && ` (${user.roles.display_name})`}
                </option>
              ))}
            </select>
            <div className="form-help">
              {client
                ? "Select the account manager for this client"
                : "Leave empty to default to current user"}
              {usersByRole.account_manager.length === 0 && !loadingUsers && (
                <span className="text-warning"> - No account managers found</span>
              )}
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
              onChange={(e) =>
                handleInputChange("adoption_specialist", e.target.value)
              }
              disabled={loadingUsers || createClientMutation.isPending || updateClientMutation.isPending}
            >
              <option value="">Select Adoption Specialist (Optional)</option>
              {usersByRole.adoption_specialist.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.name || user.email}
                  {user.roles?.display_name && ` (${user.roles.display_name})`}
                </option>
              ))}
            </select>
            <div className="form-help">
              Optionally assign an adoption specialist to this client
              {usersByRole.adoption_specialist.length === 0 && !loadingUsers && (
                <span className="text-warning"> - No adoption specialists found</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="plan_details" className="form-label">
              <PlanIcon className="label-icon" />
              Plan Details
            </label>
            <select
              id="plan_details"
              className="form-select"
              value={formData.plan_details}
              onChange={(e) =>
                handleInputChange("plan_details", e.target.value)
              }
              disabled={createClientMutation.isPending || updateClientMutation.isPending}
            >
              <option value="">Select Plan (Optional)</option>
              <option value="AI_OLD_PLAN">AI Old Plan (5 hours/week)</option>
              <option value="AI_ASSESSMENT_DISCOVERY_BLUEPRINT">
                AI Assessment Discovery Blueprint
              </option>
              <option value="AI_PART_TIME_STRATEGIST">
                AI Part Time Strategist (USD 1799/month)
              </option>
              <option value="AI_FULL_TIME_STRATEGIST">
                AI Full Time Strategist (USD 3599/month)
              </option>
              <option value="AI_FULL_TIME_STRATEGIST_VISTARA_PLAN">
                AI Full Time Strategist Vistara Plan
              </option>
            </select>
            <div className="form-help">Select the client's plan type</div>
          </div>

          <div className="form-group">
            <label htmlFor="communication_tool" className="form-label">
              <CommunicationIcon className="label-icon" />
              Communication Tool
            </label>
            <input
              id="communication_tool"
              type="text"
              className="form-input"
              placeholder="e.g., Slack, Microsoft Teams, Discord"
              value={formData.communication_tool}
              onChange={(e) =>
                handleInputChange("communication_tool", e.target.value)
              }
              disabled={createClientMutation.isPending || updateClientMutation.isPending}
              maxLength={100}
            />
            <div className="form-help">
              Preferred communication tool for this client
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="ai_executor" className="form-label">
              <AIExecutorIcon className="label-icon" />
              AI Executor
            </label>
            <select
              id="ai_executor"
              className="form-select"
              value={formData.ai_executor}
              onChange={(e) => handleInputChange("ai_executor", e.target.value)}
              disabled={loadingUsers || createClientMutation.isPending || updateClientMutation.isPending}
            >
              <option value="">Select AI Executor (Optional)</option>
              {usersByRole.ai_executor.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.name || user.email}
                  {user.roles?.display_name && ` (${user.roles.display_name})`}
                </option>
              ))}
            </select>
            <div className="form-help">
              Assign an AI executor to this client
              {usersByRole.ai_executor.length === 0 && !loadingUsers && (
                <span className="text-warning"> - No AI executors found</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="assessment_start_date" className="form-label">
                <DateIcon className="label-icon" />
                Assessment Start Date
              </label>
              <input
                id="assessment_start_date"
                type="date"
                className="form-input"
                value={formData.assessment_start_date}
                onChange={(e) =>
                  handleInputChange("assessment_start_date", e.target.value)
                }
                disabled={createClientMutation.isPending || updateClientMutation.isPending}
              />
              <div className="form-help">
                Start date of the assessment period
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="assessment_end_date" className="form-label">
                <DateIcon className="label-icon" />
                Assessment End Date
              </label>
              <input
                id="assessment_end_date"
                type="date"
                className={`form-input ${
                  errors.assessment_end_date ? "error" : ""
                }`}
                value={formData.assessment_end_date}
                onChange={(e) =>
                  handleInputChange("assessment_end_date", e.target.value)
                }
                disabled={createClientMutation.isPending || updateClientMutation.isPending}
              />
              {errors.assessment_end_date && (
                <span className="error-message">
                  {errors.assessment_end_date}
                </span>
              )}
              <div className="form-help">End date of the assessment period</div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="document_link" className="form-label">
              <LinkIcon className="label-icon" />
              Drive Link
            </label>
            <input
              id="document_link"
              type="url"
              className={`form-input ${errors.document_link ? "error" : ""}`}
              placeholder="https://drive.google.com/"
              value={formData.document_link}
              onChange={(e) =>
                handleInputChange("document_link", e.target.value)
              }
              disabled={createClientMutation.isPending || updateClientMutation.isPending}
            />
            {errors.document_link && (
              <span className="error-message">{errors.document_link}</span>
            )}
            <div className="form-help">Link to client documents</div>
          </div>

          <div className="form-group">
            <label htmlFor="task_audit_sheet_link" className="form-label">
              <AuditIcon className="label-icon" />
              Task Audit Sheet Link
            </label>
            <input
              id="task_audit_sheet_link"
              type="url"
              className={`form-input ${
                errors.task_audit_sheet_link ? "error" : ""
              }`}
              placeholder="https://example.com/audit-sheet"
              value={formData.task_audit_sheet_link}
              onChange={(e) =>
                handleInputChange("task_audit_sheet_link", e.target.value)
              }
              disabled={createClientMutation.isPending || updateClientMutation.isPending}
            />
            {errors.task_audit_sheet_link && (
              <span className="error-message">
                {errors.task_audit_sheet_link}
              </span>
            )}
            <div className="form-help">Link to task audit sheet</div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={createClientMutation.isPending || updateClientMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createClientMutation.isPending || updateClientMutation.isPending}
            >
              {(createClientMutation.isPending || updateClientMutation.isPending) ? (
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
