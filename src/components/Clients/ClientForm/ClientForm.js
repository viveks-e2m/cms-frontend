import React, { useState, useEffect, useRef, useCallback } from "react";
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
  School as InternIcon,
  DateRange as DateIcon,
  Link as LinkIcon,
  Assessment as AuditIcon,
  Cancel as CancelIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from "@mui/icons-material";
import "./ClientForm.css";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const normalizeUserValue = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    return trimmed;
  }
  if (typeof value === "object") {
    return value?.id || value?.value || value?.name || "";
  }
  return "";
};

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
    interns: [],
    assessment_start_date: "",
    assessment_end_date: "",
    document_link: "",
    task_audit_sheet_link: "",
    last_renewal_date: "",
    next_renewal_date: "",
  });
  const [errors, setErrors] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersByRole, setUsersByRole] = useState({
    account_manager: [],
    adoption_specialist: [],
    ai_executor: [],
    ai_intern: [],
  });
  const [internsDropdownOpen, setInternsDropdownOpen] = useState(false);
  const multiSelectRef = useRef(null);
  const { showError } = useNotificationContext();
  
  // Use mutation hooks for proper cache invalidation
  const createClientMutation = useCreateClient();
  const updateClientMutation = useUpdateClient();

  const resolveUserIdForRole = useCallback(
    (value, roleKey) => {
      if (!value) return "";
      const normalized = value.trim();
      if (!normalized) return "";
      if (UUID_REGEX.test(normalized)) {
        return normalized;
      }
      const candidates = usersByRole[roleKey] || [];
      const lower = normalized.toLowerCase();
      const match = candidates.find((user) =>
        [user.full_name, user.name, user.email].some(
          (field) => field && field.trim().toLowerCase() === lower
        )
      );
      return match?.id || "";
    },
    [usersByRole]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (multiSelectRef.current && !multiSelectRef.current.contains(event.target)) {
        setInternsDropdownOpen(false);
      }
    };

    if (internsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [internsDropdownOpen]);

  useEffect(() => {
    if (isOpen) {
      // Load users for dropdowns
      loadUsers();
      // Close dropdown when modal opens/closes
      setInternsDropdownOpen(false);

      if (client) {
        const accountManagerId = normalizeUserValue(client.account_manager_id ?? client.account_manager);
        const adoptionSpecialistId = normalizeUserValue(client.adoption_specialist_id ?? client.adoption_specialist);
        // Editing existing client
        setFormData({
          name: client.name || "",
          website: client.website || "",
          status: client.status || "pre-boarding",
          account_manager: accountManagerId,
          adoption_specialist: adoptionSpecialistId,
          plan_details: client.plan_details || "",
          communication_tool: client.communication_tool || "",
          ai_executor: normalizeUserValue(client.ai_executor) || "",
          interns: Array.isArray(client.interns)
            ? client.interns.filter(Boolean)
            : [],
          assessment_start_date: client.assessment_start_date
            ? client.assessment_start_date.split("T")[0]
            : "",
          assessment_end_date: client.assessment_end_date
            ? client.assessment_end_date.split("T")[0]
            : "",
          document_link: client.document_link || "",
          task_audit_sheet_link: client.task_audit_sheet_link || "",
          last_renewal_date: client.last_renewal_date
            ? client.last_renewal_date.split("T")[0]
            : "",
          next_renewal_date: client.next_renewal_date
            ? client.next_renewal_date.split("T")[0]
            : "",
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
          interns: [],
          assessment_start_date: "",
          assessment_end_date: "",
          document_link: "",
          task_audit_sheet_link: "",
          last_renewal_date: "",
          next_renewal_date: "",
        });
      }
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, isOpen]);

  useEffect(() => {
    if (!isOpen || !client) return;
    setFormData((prev) => {
      let changed = false;
      const updated = { ...prev };

      const ensureFieldId = (field, roleKey) => {
        const currentValue = prev[field];
        if (!currentValue) return;
        if (UUID_REGEX.test(currentValue.trim())) return;
        const resolved = resolveUserIdForRole(currentValue, roleKey);
        if (resolved && resolved !== currentValue) {
          updated[field] = resolved;
          changed = true;
        }
      };

      ensureFieldId("account_manager", "account_manager");
      ensureFieldId("adoption_specialist", "adoption_specialist");
      ensureFieldId("ai_executor", "ai_executor");

      return changed ? updated : prev;
    });
  }, [usersByRole, isOpen, client, resolveUserIdForRole]);

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
        ai_intern: [],
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

    // Ensure interns is always an array (never undefined or null)
    const internsArray = Array.isArray(formData.interns) 
      ? formData.interns.filter(id => id) // Filter out any falsy values
      : [];

    const accountManagerId = resolveUserIdForRole(formData.account_manager || "", "account_manager");
    const adoptionSpecialistId = resolveUserIdForRole(formData.adoption_specialist || "", "adoption_specialist");
    const aiExecutorId = resolveUserIdForRole(formData.ai_executor || "", "ai_executor");

    const clientData = {
      name: formData.name.trim(),
      website: website,
      status: formData.status,
      account_manager: accountManagerId || "",
      adoption_specialist: adoptionSpecialistId || "",
      plan_details: formData.plan_details || null,
      communication_tool: formData.communication_tool.trim() || null,
      ai_executor: aiExecutorId || null,
      interns: internsArray, // Always include interns field, even if empty array
      assessment_start_date: formData.assessment_start_date || null,
      assessment_end_date: formData.assessment_end_date || null,
      document_link: formData.document_link.trim() || null,
      task_audit_sheet_link: formData.task_audit_sheet_link.trim() || null,
      last_renewal_date: formData.last_renewal_date || null,
      next_renewal_date: formData.next_renewal_date || null,
    };

    // Debug log to verify interns are being sent
    console.log("Creating client with interns:", internsArray);

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

  const handleInternsChange = (internId) => {
    const currentInterns = formData.interns || [];
    const isSelected = currentInterns.includes(internId);
    
    if (isSelected) {
      // Remove intern
      handleInputChange("interns", currentInterns.filter(id => id !== internId));
    } else {
      // Add intern
      handleInputChange("interns", [...currentInterns, internId]);
    }
  };

  const removeIntern = (internId, e) => {
    e.stopPropagation();
    const currentInterns = formData.interns || [];
    handleInputChange("interns", currentInterns.filter(id => id !== internId));
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

        <form onSubmit={handleSubmit} className="client-form client-form-scoped">
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
              <option value="active">Execution</option>
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

          <div className="form-group">
            <label htmlFor="interns" className="form-label">
              <InternIcon className="label-icon" />
              Interns
            </label>
            <div className="multi-select-wrapper" ref={multiSelectRef}>
              <div 
                className={`multi-select-input ${internsDropdownOpen ? 'open' : ''} ${errors.interns ? 'error' : ''} ${loadingUsers || createClientMutation.isPending || updateClientMutation.isPending ? 'disabled' : ''}`}
                onClick={() => {
                  if (!loadingUsers && !createClientMutation.isPending && !updateClientMutation.isPending) {
                    setInternsDropdownOpen(!internsDropdownOpen);
                  }
                }}
              >
                <div className="multi-select-value">
                  {formData.interns?.length > 0 ? (
                    <span className="multi-select-placeholder-selected">
                      {formData.interns.length} {formData.interns.length === 1 ? 'intern' : 'interns'} selected
                    </span>
                  ) : (
                    <span className="multi-select-placeholder">
                      Select one or more interns to assign to this client
                    </span>
                  )}
                </div>
                <KeyboardArrowDownIcon className={`multi-select-arrow ${internsDropdownOpen ? 'open' : ''}`} />
              </div>
              
              {internsDropdownOpen && (
                <>
                  <div 
                    className="multi-select-backdrop"
                    onClick={() => setInternsDropdownOpen(false)}
                  />
                  <div className="multi-select-dropdown">
                    {usersByRole.ai_intern.length === 0 ? (
                      <div className="multi-select-empty">
                        {loadingUsers ? 'Loading interns...' : 'No interns found'}
                      </div>
                    ) : (
                      usersByRole.ai_intern.map((user) => {
                        const isSelected = formData.interns?.includes(user.id);
                        return (
                          <div
                            key={user.id}
                            className={`multi-select-option ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleInternsChange(user.id)}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleInternsChange(user.id)}
                              className="multi-select-checkbox"
                            />
                            <span className="multi-select-option-label">
                              {user.full_name || user.name || user.email}
                              {user.roles?.display_name && (
                                <span className="multi-select-option-role">
                                  {' '}({user.roles.display_name})
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
            
            {formData.interns?.length > 0 && (
              <div className="selected-chips-container">
                {formData.interns.map((internId) => {
                  const intern = usersByRole.ai_intern.find((user) => user.id === internId);
                  const internName = intern?.full_name || intern?.name || intern?.email || `Unknown (${internId.slice(0, 8)}...)`;
                  return (
                    <div key={internId} className="selected-chip">
                      <span className="chip-label">{internName}</span>
                      <button
                        type="button"
                        className="chip-remove"
                        onClick={(e) => removeIntern(internId, e)}
                        disabled={createClientMutation.isPending || updateClientMutation.isPending}
                        title="Remove intern"
                      >
                        <CancelIcon />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="form-help">
              Select one or more interns to assign to this client
              {usersByRole.ai_intern.length === 0 && !loadingUsers && (
                <span className="text-warning"> - No interns found</span>
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

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="last_renewal_date" className="form-label">
                <DateIcon className="label-icon" />
                Last Renewal Date
              </label>
              <input
                id="last_renewal_date"
                type="date"
                className="form-input"
                value={formData.last_renewal_date}
                onChange={(e) =>
                  handleInputChange("last_renewal_date", e.target.value)
                }
                disabled={createClientMutation.isPending || updateClientMutation.isPending}
              />
              <div className="form-help">Date when the contract was last renewed</div>
            </div>
            <div className="form-group">
              <label htmlFor="next_renewal_date" className="form-label">
                <DateIcon className="label-icon" />
                Next Renewal Date
              </label>
              <input
                id="next_renewal_date"
                type="date"
                className="form-input"
                value={formData.next_renewal_date}
                onChange={(e) =>
                  handleInputChange("next_renewal_date", e.target.value)
                }
                disabled={createClientMutation.isPending || updateClientMutation.isPending}
              />
              <div className="form-help">Date when the contract is scheduled for renewal</div>
            </div>
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
