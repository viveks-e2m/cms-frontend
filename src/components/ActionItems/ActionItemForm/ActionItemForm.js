import React, { useState, useEffect, useRef } from "react";
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Assignment as TaskIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Business as ClientIcon,
  VideoCall as MeetingIcon,
} from "@mui/icons-material";
import { openPointsAPI, clientAPI } from "../../../utils/apiServices";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import LoadingSpinner from "../../UI/LoadingSpinner/LoadingSpinner";
import "./ActionItemForm.css";

const ActionItemForm = ({ 
  isOpen, 
  onSave, 
  onCancel, 
  prefilledData = {},
  clients = [],
  meetings = [],
  users = []
}) => {
  const [formData, setFormData] = useState({
    message: "",
    client_id: "",
    meeting_id: "",
    assignee: "",
    task_owner: "",
    due_date: "",
    status: "open"
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [loadingData, setLoadingData] = useState(false);
  const [clientMeetings, setClientMeetings] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const initializedRef = useRef(false);
  
  const { showSuccess, showError } = useNotificationContext();

  // Load additional data if not provided
  useEffect(() => {
    if (isOpen && (clients.length === 0 || users.length === 0)) {
      loadRequiredData();
    }
  }, [isOpen, clients.length, users.length]);

  // Set prefilled data when modal opens (only once per modal open)
  useEffect(() => {
    console.log('ActionItemForm - useEffect triggered:', { isOpen, initialized: initializedRef.current, prefilledData }); // Debug log
    
    if (isOpen && !initializedRef.current) {
      const initialData = {
        message: prefilledData.message || "",
        client_id: prefilledData.client_id || "",
        meeting_id: prefilledData.meeting_id || "",
        assignee: prefilledData.assignee || "",
        task_owner: prefilledData.task_owner || "",
        due_date: prefilledData.due_date || "",
        status: prefilledData.status || "open"
      };
      
      console.log('ActionItemForm - setting initial formData:', initialData); // Debug log
      setFormData(initialData);
      setErrors({});
      initializedRef.current = true;
    } else if (!isOpen) {
      // Reset initialization flag when modal closes
      initializedRef.current = false;
    }
  }, [isOpen, prefilledData]);

  // Load meetings when client is selected
  useEffect(() => {
    if (formData.client_id && formData.client_id !== prefilledData.client_id) {
      loadClientMeetings(formData.client_id);
    }
  }, [formData.client_id, prefilledData.client_id]);

  // Set initial meetings if provided or from prefilled data
  useEffect(() => {
    if (meetings && meetings.length > 0) {
      setClientMeetings(meetings);
    } else if (prefilledData.client_id) {
      loadClientMeetings(prefilledData.client_id);
    }
  }, [meetings, prefilledData.client_id]);

  const loadClientMeetings = async (clientId) => {
    if (!clientId) {
      setClientMeetings([]);
      return;
    }

    try {
      setLoadingMeetings(true);
      const { meetingAPI } = await import("../../../utils/apiServices");
      const meetingsData = await meetingAPI.getSummaryByClient(clientId);
      setClientMeetings(meetingsData || []);
    } catch (error) {
      console.error("Error loading client meetings:", error);
      setClientMeetings([]);
    } finally {
      setLoadingMeetings(false);
    }
  };

  const loadRequiredData = async () => {
    try {
      setLoadingData(true);
      
      // Load clients and users if not provided by parent
      const promises = [];
      
      if (clients.length === 0) {
        promises.push(clientAPI.getAll());
      }
      
      if (users.length === 0) {
        promises.push(clientAPI.getAllUsers());
      }
      
      if (promises.length > 0) {
        const results = await Promise.all(promises);
        // Note: This would require state management in the component
        // For now, we'll rely on parent components to provide the data
        console.log("Loaded additional data:", results);
      }
    } catch (error) {
      console.error("Error loading required data:", error);
      showError("Failed to load form data");
    } finally {
      setLoadingData(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.message.trim()) {
      newErrors.message = "Task description is required";
    } else if (formData.message.length < 10) {
      newErrors.message = "Task description must be at least 10 characters";
    } else if (formData.message.length > 500) {
      newErrors.message = "Task description must be less than 500 characters";
    }

    if (!formData.client_id) {
      newErrors.client_id = "Client selection is required";
    }

    // Optional due date validation
    if (formData.due_date) {
      const selectedDate = new Date(formData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.due_date = "Due date cannot be in the past";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    console.log('ActionItemForm - handleInputChange:', field, value); // Debug log
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Clear meeting selection when client changes
      if (field === "client_id" && value !== prev.client_id) {
        newData.meeting_id = "";
      }
      
      // Clear and disable assignee when a client is selected as task owner
      if (field === "task_owner" && value) {
        const isClient = clients.some(client => client.id === value);
        if (isClient) {
          newData.assignee = "";
        }
      }
      
      console.log('ActionItemForm - new formData:', newData); // Debug log
      return newData;
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Prepare data for API
      const actionItemData = {
        message: formData.message.trim(),
        client_id: formData.client_id,
        status: formData.status
      };

      // Add optional fields if provided
      if (formData.meeting_id) {
        actionItemData.meeting_id = formData.meeting_id;
      }
      
      if (formData.assignee) {
        actionItemData.assignee = formData.assignee;
      }
      
      if (formData.task_owner) {
        actionItemData.task_owner = formData.task_owner;
      }
      
      if (formData.due_date) {
        actionItemData.due_date = formData.due_date;
      }

      await openPointsAPI.createManual(actionItemData);
      showSuccess("Action item created successfully");
      onSave();
    } catch (error) {
      showError("Failed to create action item");
      console.error("Error creating action item:", error);
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : "Unknown Client";
  };

  const getMeetingName = (meetingId) => {
    const meeting = clientMeetings.find(m => m.id === meetingId) || meetings.find(m => m.id === meetingId);
    return meeting ? (meeting.meeting_name || meeting.title || `Meeting ${meetingId.slice(-8)}`) : "Unknown Meeting";
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? (user.full_name || user.name || user.email) : "Unknown User";
  };

  // Check if the selected task owner is a client
  const isTaskOwnerClient = () => {
    if (!formData.task_owner) return false;
    return clients.some(client => client.id === formData.task_owner);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="action-item-form-modal">
        <div className="modal-header">
          <div className="modal-title">
            <TaskIcon className="modal-icon" />
            <div>
              <h3>Create Action Item</h3>
              <p>Add a new task or action item</p>
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

        {loadingData ? (
          <div className="modal-loading">
            <LoadingSpinner message="Loading form data..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="action-item-form">
            {/* Task Description */}
            <div className="form-group">
              <label htmlFor="message" className="form-label">
                <TaskIcon className="label-icon" />
                Task Description *
              </label>
              <textarea
                id="message"
                className={`form-textarea ${errors.message ? "error" : ""}`}
                placeholder="Describe the task or action item in detail..."
                value={formData.message}
                onChange={(e) => handleInputChange("message", e.target.value)}
                disabled={loading}
                rows={4}
                maxLength={500}
              />
              {errors.message && (
                <span className="error-message">{errors.message}</span>
              )}
              <div className="form-help">
                {formData.message.length}/500 characters
              </div>
            </div>

            {/* Client Selection */}
            <div className="form-group">
              <label htmlFor="client_id" className="form-label">
                <ClientIcon className="label-icon" />
                Client *
              </label>
              <select
                id="client_id"
                className={`form-select ${errors.client_id ? "error" : ""}`}
                value={formData.client_id}
                onChange={(e) => handleInputChange("client_id", e.target.value)}
                disabled={loading || prefilledData.client_id}
              >
                <option value="">Select a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              {errors.client_id && (
                <span className="error-message">{errors.client_id}</span>
              )}
              {prefilledData.client_id && (
                <div className="form-help">
                  Pre-selected: {getClientName(prefilledData.client_id)}
                </div>
              )}
            </div>

            {/* Meeting Selection (Optional) */}
            <div className="form-group">
              <label htmlFor="meeting_id" className="form-label">
                <MeetingIcon className="label-icon" />
                Meeting (Optional)
              </label>
              <select
                id="meeting_id"
                className="form-select"
                value={formData.meeting_id}
                onChange={(e) => handleInputChange("meeting_id", e.target.value)}
                disabled={loading || prefilledData.meeting_id}
              >
                <option value="">No meeting association</option>
                {loadingMeetings ? (
                  <option disabled>Loading meetings...</option>
                ) : (
                  clientMeetings.map((meeting) => (
                    <option key={meeting.id} value={meeting.id}>
                      {meeting.meeting_name || meeting.title || `Meeting ${meeting.id.slice(-8)}`}
                    </option>
                  ))
                )}
              </select>
              {prefilledData.meeting_id && (
                <div className="form-help">
                  Pre-selected: {getMeetingName(prefilledData.meeting_id)}
                </div>
              )}
            </div>

            {/* Task Owner and Assignee Row */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="task_owner" className="form-label">
                  <PersonIcon className="label-icon" />
                  Task Owner
                </label>
                <select
                  id="task_owner"
                  className="form-select"
                  value={formData.task_owner}
                  onChange={(e) => handleInputChange("task_owner", e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select task owner...</option>
                  <optgroup label="Users">
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name || user.name || user.email}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Clients">
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <div className="form-help">
                  Defaults to current user if not selected
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="assignee" className="form-label">
                  <PersonIcon className="label-icon" />
                  Assignee
                </label>
                <select
                  id="assignee"
                  className="form-select"
                  value={formData.assignee}
                  onChange={(e) => handleInputChange("assignee", e.target.value)}
                  disabled={loading || isTaskOwnerClient()}
                >
                  <option value="">Select assignee...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.name || user.email}
                    </option>
                  ))}
                </select>
                <div className="form-help">
                  {isTaskOwnerClient() ? "Not applicable when client is task owner" : "Who will work on this task"}
                </div>
              </div>
            </div>

            {/* Status and Due Date Row */}
            <div className="form-row">
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
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="due_date" className="form-label">
                  <CalendarIcon className="label-icon" />
                  Due Date
                </label>
                <input
                  id="due_date"
                  type="date"
                  className={`form-input ${errors.due_date ? "error" : ""}`}
                  value={formData.due_date}
                  onChange={(e) => handleInputChange("due_date", e.target.value)}
                  disabled={loading}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.due_date && (
                  <span className="error-message">{errors.due_date}</span>
                )}
              </div>
            </div>

            {/* Form Actions */}
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
                    Create Action Item
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ActionItemForm;