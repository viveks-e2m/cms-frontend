import React, { useState, useEffect } from "react";
import {
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Schedule as ScheduleIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Notes as NotesIcon,
} from "@mui/icons-material";
import {
  openPointsAPI,
  meetingAPI,
  clientAPI,
} from "../../../utils/apiServices";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import LoadingSpinner from "../../UI/LoadingSpinner/LoadingSpinner";
import "./ActionItems.css";

const ActionItems = ({ meetingId, meeting, onRefresh }) => {
  const [actionItems, setActionItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generationStatus, setGenerationStatus] = useState(null);
  const [polling, setPolling] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    message: "",
    due_date: "",
    assignee: null,
    notes: "",
  });

  const { showSuccess, showError, showInfo } = useNotificationContext();

  const getUserName = (userId) => {
    if (!userId) return null;
    const user = users.find((u) => u.id === userId);
    return user ? user.full_name || user.name || user.email : "Unknown User";
  };

  useEffect(() => {
    if (meetingId) {
      loadActionItems();
      loadUsers();

      // Start polling if this is a Fathom meeting and might have background generation
      if (meeting?.source === "fathom") {
        checkGenerationStatus();
      }
    }
  }, [meetingId, meeting]);

  const loadUsers = async () => {
    try {
      const usersData = await clientAPI.getAllUsers();
      setUsers(usersData || []);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const checkGenerationStatus = async () => {
    try {
      const status = await meetingAPI.getActionItemsStatus(meetingId);
      setGenerationStatus(status);

      if (status.status === "pending") {
        // Start polling every 5 seconds
        setPolling(true);
        const pollInterval = setInterval(async () => {
          try {
            const updatedStatus = await meetingAPI.getActionItemsStatus(
              meetingId
            );
            setGenerationStatus(updatedStatus);

            if (updatedStatus.status === "completed") {
              clearInterval(pollInterval);
              setPolling(false);
              showInfo("Action items have been generated!");
              await loadActionItems();
            } else if (updatedStatus.status === "error") {
              clearInterval(pollInterval);
              setPolling(false);
            }
          } catch (error) {
            console.error("Error polling action items status:", error);
          }
        }, 5000);

        // Stop polling after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          setPolling(false);
        }, 300000);
      }
    } catch (error) {
      console.error("Error checking action items generation status:", error);
    }
  };

  const loadActionItems = async () => {
    try {
      setLoading(true);
      const items = await openPointsAPI.getByMeeting(meetingId);
      setActionItems(Array.isArray(items) ? items : []);
    } catch (error) {
      showError("Failed to load action items");
      console.error("Error loading action items:", error);
      setActionItems([]);
    } finally {
      setLoading(false);
    }
  };

  const updateItemStatus = async (itemId, newStatus) => {
    try {
      await openPointsAPI.updateStatus(itemId, { status: newStatus });
      showSuccess(`Action item marked as ${newStatus}`);
      await loadActionItems();
    } catch (error) {
      showError("Failed to update action item status");
      console.error("Error updating status:", error);
    }
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this action item?")) {
      return;
    }

    try {
      await openPointsAPI.delete(itemId);
      showSuccess("Action item deleted successfully");
      await loadActionItems();
    } catch (error) {
      showError("Failed to delete action item");
      console.error("Error deleting item:", error);
    }
  };

  const startEditing = (item) => {
    setEditingItem(item.id);
    setEditForm({
      message: item.message || "",
      due_date: item.due_date ? item.due_date.split("T")[0] : "", // Format for date input
      assignee: item.assignee || null,
      notes: item.notes || "",
    });
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditForm({
      message: "",
      due_date: "",
      assignee: null,
      notes: "",
    });
  };

  const saveItem = async (itemId) => {
    try {
      const updateData = {
        message: editForm.message.trim(),
        due_date: editForm.due_date || null,
        assignee: editForm.assignee || null,
        notes: editForm.notes.trim() || null,
      };

      await openPointsAPI.updateStatus(itemId, updateData);
      showSuccess("Action item updated successfully");
      setEditingItem(null);
      await loadActionItems();
    } catch (error) {
      showError("Failed to update action item");
      console.error("Error updating item:", error);
    }
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No due date";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="status-icon completed" />;
      case "in_progress":
        return <ScheduleIcon className="status-icon in-progress" />;
      default:
        return <RadioButtonUncheckedIcon className="status-icon open" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "completed":
        return "completed";
      case "in_progress":
        return "in-progress";
      default:
        return "open";
    }
  };

  if (loading) {
    return (
      <div className="action-items-loading">
        <LoadingSpinner message="Loading action items..." />
      </div>
    );
  }

  return (
    <div className="action-items">
      <div className="action-items-header">
        <div className="header-info">
          <h3>Action Items</h3>
          <span className="items-count">
            {actionItems.length} {actionItems.length === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={loadActionItems}
            disabled={loading}
          >
            <RefreshIcon />
            Refresh
          </button>
        </div>
      </div>

      {/* Generation Status Indicator */}
      {generationStatus && generationStatus.status === "pending" && (
        <div className="generation-status pending">
          <div className="status-indicator">
            <div className="spinner"></div>
            <span>Generating action items in background...</span>
          </div>
          <p className="status-message">
            Action items are being generated from the meeting transcript. This
            usually takes 1-2 minutes.
          </p>
        </div>
      )}

      {generationStatus && generationStatus.status === "error" && (
        <div className="generation-status error">
          <div className="status-indicator">
            <span>⚠️ Action items generation failed</span>
          </div>
          <p className="status-message">
            {generationStatus.message ||
              "There was an error generating action items from the meeting transcript."}
          </p>
        </div>
      )}

      {actionItems.length === 0 ? (
        <div className="no-action-items">
          <div className="no-items-icon">
            <AssignmentIcon />
          </div>
          <h4>No Action Items</h4>
          <p>
            {meeting?.source === "fathom"
              ? "Action items are automatically generated when creating Fathom meetings. If none appear, they may not have been available in the webhook response."
              : "No action items have been created for this meeting yet."}
          </p>
        </div>
      ) : (
        <div className="action-items-list">
          {actionItems.map((item) => (
            <div
              key={item.id}
              className={`action-item ${getStatusClass(item.status)}`}
            >
              <div className="item-header">
                <div className="item-status">{getStatusIcon(item.status)}</div>
                <div className="item-content">
                  {editingItem === item.id ? (
                    <div className="item-edit-form">
                      <div className="edit-field">
                        <label>Action Item:</label>
                        <input
                          type="text"
                          value={editForm.message}
                          onChange={(e) =>
                            handleEditFormChange("message", e.target.value)
                          }
                          className="edit-input"
                          placeholder="Enter action item description"
                        />
                      </div>
                      <div className="edit-field">
                        <label>Assigned To:</label>
                        <select
                          value={editForm.assignee || ""}
                          onChange={(e) =>
                            handleEditFormChange(
                              "assignee",
                              e.target.value || null
                            )
                          }
                          className="edit-input"
                        >
                          <option value="">Select assignee...</option>
                          {users.length === 0 && (
                            <option value="" disabled>
                              Loading users...
                            </option>
                          )}
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.full_name || user.name || user.email}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="edit-field">
                        <label>Due Date:</label>
                        <input
                          type="date"
                          value={editForm.due_date}
                          onChange={(e) =>
                            handleEditFormChange("due_date", e.target.value)
                          }
                          className="edit-input"
                        />
                      </div>
                      <div className="edit-field">
                        <label>Notes:</label>
                        <textarea
                          value={editForm.notes}
                          onChange={(e) =>
                            handleEditFormChange("notes", e.target.value)
                          }
                          className="edit-textarea"
                          placeholder="Add notes or additional details..."
                          rows={3}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="item-display">
                      <div className="item-header">
                        <div className="item-message">{item.message}</div>
                        <div
                          className={`status-badge status-${
                            item.status || "open"
                          }`}
                        >
                          {item.status === "in_progress"
                            ? "In Progress"
                            : item.status === "completed"
                            ? "Completed"
                            : "Open"}
                        </div>
                      </div>

                      {item.notes && (
                        <div className="item-notes">
                          <NotesIcon className="notes-icon" />
                          <span>{item.notes}</span>
                        </div>
                      )}

                      <div className="item-metadata">
                        <div className="metadata-grid">
                          {item.task_owner && (
                            <div className="metadata-item">
                              <div className="metadata-icon">
                                <PersonIcon />
                              </div>
                              <div className="metadata-content">
                                <span className="metadata-label">Owner</span>
                                <span className="metadata-value">
                                  {getUserName(item.task_owner)}
                                </span>
                              </div>
                            </div>
                          )}

                          {item.assignee && (
                            <div className="metadata-item">
                              <div className="metadata-icon">
                                <PersonIcon />
                              </div>
                              <div className="metadata-content">
                                <span className="metadata-label">Assigned</span>
                                <span className="metadata-value">
                                  {getUserName(item.assignee)}
                                </span>
                              </div>
                            </div>
                          )}

                          {item.due_date && (
                            <div className="metadata-item">
                              <div className="metadata-icon">
                                <CalendarIcon />
                              </div>
                              <div className="metadata-content">
                                <span className="metadata-label">Due Date</span>
                                <span className="metadata-value">
                                  {formatDate(item.due_date)}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="metadata-item">
                            <div className="metadata-icon">
                              <CalendarIcon />
                            </div>
                            <div className="metadata-content">
                              <span className="metadata-label">Created</span>
                              <span className="metadata-value">
                                {formatDate(item.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="item-actions">
                  {editingItem === item.id ? (
                    <div className="edit-actions">
                      <button
                        className="btn-icon btn-success"
                        onClick={() => saveItem(item.id)}
                        title="Save changes"
                      >
                        <SaveIcon />
                      </button>
                      <button
                        className="btn-icon btn-secondary"
                        onClick={cancelEditing}
                        title="Cancel editing"
                      >
                        <CancelIcon />
                      </button>
                    </div>
                  ) : (
                    <div className="display-actions">
                      <div className="status-dropdown">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            updateItemStatus(item.id, e.target.value)
                          }
                          className="status-select"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => startEditing(item)}
                        title="Edit action item"
                      >
                        <EditIcon />
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => deleteItem(item.id)}
                        title="Delete action item"
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionItems;
