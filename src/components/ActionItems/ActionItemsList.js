import React, { useState } from "react";
import {
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Schedule as ScheduleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Event as MeetingIcon,
} from "@mui/icons-material";
import { openPointsAPI } from "../../utils/apiServices";
import { useNotificationContext } from "../../contexts/NotificationContext";
import "../Meetings/ActionItems/ActionItems.css";

const ActionItemsList = ({ actionItems, onRefresh, meetings, clients }) => {
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    task: "",
    due_date: "",
    assigned_to: "",
    status: "pending",
  });

  const { showSuccess, showError } = useNotificationContext();

  const getMeetingTitle = (meetingId) => {
    console.log("Looking for meeting ID:", meetingId, "in meetings:", meetings);
    const meeting = meetings.find((m) => m.id === meetingId);
    console.log("Found meeting:", meeting);
    return meeting?.meeting_name || meeting?.name || "Unknown Meeting";
  };

  const getClientName = (clientId) => {
    console.log("Looking for client ID:", clientId, "in clients:", clients);
    const client = clients.find((c) => c.id === clientId);
    console.log("Found client:", client);
    return client?.name || "Unknown Client";
  };

  const updateItemStatus = async (itemId, newStatus) => {
    try {
      console.log("Updating item status:", itemId, "to:", newStatus);
      const result = await openPointsAPI.updateStatus(itemId, {
        status: newStatus,
      });
      console.log("Update result:", result);
      showSuccess(`Action item marked as ${newStatus}`);
      if (onRefresh) onRefresh();
    } catch (error) {
      showError("Failed to update action item status");
      console.error("Error updating status:", error);
      console.error("Full error details:", error.response || error);
    }
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this action item?")) {
      return;
    }

    try {
      await openPointsAPI.delete(itemId);
      showSuccess("Action item deleted successfully");
      if (onRefresh) onRefresh();
    } catch (error) {
      showError("Failed to delete action item");
      console.error("Error deleting item:", error);
    }
  };

  const startEdit = (item) => {
    setEditingItem(item.id);
    setEditForm({
      task: item.message || item.task || "",
      due_date: item.due_date ? item.due_date.split("T")[0] : "",
      assigned_to: item.assigned_to || "",
      status: item.status || "pending",
    });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditForm({
      task: "",
      due_date: "",
      assigned_to: "",
      status: "pending",
    });
  };

  const saveEdit = async (itemId) => {
    try {
      const updateData = {
        message: editForm.task, // Use 'message' field like the original component
        status: editForm.status,
        assigned_to: editForm.assigned_to || null,
        due_date: editForm.due_date || null,
      };

      await openPointsAPI.updateStatus(itemId, updateData);
      showSuccess("Action item updated successfully");
      setEditingItem(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      showError("Failed to update action item");
      console.error("Error updating item:", error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <CheckCircleIcon className="status-icon completed" />;
      case "in_progress":
        return <ScheduleIcon className="status-icon in-progress" />;
      case "pending":
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

  if (actionItems.length === 0) {
    return (
      <div className="no-action-items">
        <div className="no-items-icon">
          <AssignmentIcon />
        </div>
        <h4>No Action Items Found</h4>
        <p>
          Action items will appear here when they are created from meetings.
        </p>
      </div>
    );
  }

  return (
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
                    <label>Task</label>
                    <textarea
                      className="edit-textarea"
                      value={editForm.task}
                      onChange={(e) =>
                        setEditForm({ ...editForm, task: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                  <div className="edit-field">
                    <label>Status</label>
                    <select
                      className="edit-input"
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm({ ...editForm, status: e.target.value })
                      }
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className="edit-field">
                    <label>Assigned To</label>
                    <input
                      type="text"
                      className="edit-input"
                      value={editForm.assigned_to}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          assigned_to: e.target.value,
                        })
                      }
                      placeholder="Enter assignee name"
                    />
                  </div>
                  <div className="edit-field">
                    <label>Due Date</label>
                    <input
                      type="date"
                      className="edit-input"
                      value={editForm.due_date}
                      onChange={(e) =>
                        setEditForm({ ...editForm, due_date: e.target.value })
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="item-display">
                  <div className="item-message">
                    {item.message || item.task}
                  </div>
                  <div className="item-meta">
                    <div className="item-client">
                      <PersonIcon />
                      <span>{getClientName(item.client_id)}</span>
                    </div>
                    <div className="item-meeting">
                      <MeetingIcon />
                      <span>{getMeetingTitle(item.meeting_id)}</span>
                    </div>
                    {item.assigned_to && (
                      <div className="item-assignee">
                        <PersonIcon />
                        <span>{item.assigned_to}</span>
                      </div>
                    )}
                    {item.due_date && (
                      <div className="item-due-date">
                        <CalendarIcon />
                        <span>
                          {new Date(item.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="item-created">
                      <span>
                        Created:{" "}
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString()
                          : "Unknown"}
                      </span>
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
                    onClick={() => saveEdit(item.id)}
                    title="Save"
                  >
                    <SaveIcon />
                  </button>
                  <button
                    className="btn-icon btn-secondary"
                    onClick={cancelEdit}
                    title="Cancel"
                  >
                    <CancelIcon />
                  </button>
                </div>
              ) : (
                <div className="display-actions">
                  <div className="status-dropdown">
                    <select
                      className="status-select"
                      value={item.status || "pending"}
                      onChange={(e) =>
                        updateItemStatus(item.id, e.target.value)
                      }
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <button
                    className="btn-icon btn-edit"
                    onClick={() => startEdit(item)}
                    title="Edit"
                  >
                    <EditIcon />
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => deleteItem(item.id)}
                    title="Delete"
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
  );
};

export default ActionItemsList;
