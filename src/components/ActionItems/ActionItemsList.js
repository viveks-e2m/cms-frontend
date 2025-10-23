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
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { openPointsAPI } from "../../utils/apiServices";
import { useNotificationContext } from "../../contexts/NotificationContext";
import { PermissionGuard } from "../PermissionGuard";
import { useAuth } from "../../hooks/useAuth";
import "./ActionItemsList.css";

const ActionItemsList = ({
  actionItems,
  onRefresh,
  meetings,
  clients,
  users = [],
  hideClientColumn = false,
}) => {
  console.log("ActionItemsList received users:", users);
  const { hasPermission } = useAuth();
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    message: "",
    due_date: "",
    assignee: null,
    status: "open",
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

  const getUserName = (userId) => {
    if (!userId) return null;
    console.log("Looking for user ID:", userId, "in users:", users);
    const user = users.find((u) => u.id === userId);
    console.log("Found user:", user);
    return user ? user.full_name || user.name || user.email : "Unknown User";
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
      message: item.message || item.task || "",
      due_date: item.due_date ? item.due_date.split("T")[0] : "",
      assignee: item.assignee || null,
      status: item.status || "open",
    });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditForm({
      message: "",
      due_date: "",
      assignee: null,
      status: "open",
    });
  };

  const saveEdit = async (itemId) => {
    try {
      const updateData = {
        message: editForm.message,
        status: editForm.status,
        assignee: editForm.assignee || null,
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
    <div className="action-items-table-container">
      <table className={`action-items-table ${hideClientColumn ? 'hide-client-column' : ''}`}>
        <thead>
          <tr>
            <th className="col-task">Task Name</th>
            {!hideClientColumn && <th className="col-client">Client</th>}
            <th className="col-owner">Task Owner</th>
            <th className="col-assignee">Assignee</th>
            <th className="col-status">Status</th>
            <th className="col-priority">Priority</th>
            <th className="col-due">Due Date</th>
            <th className="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {actionItems.map((item) => (
            <tr
              key={item.id}
              className={`action-item-row ${getStatusClass(item.status)}`}
            >
              {editingItem === item.id ? (
                // Edit Form
                <>
                  <td className="col-task">
                    <textarea
                      className="edit-textarea"
                      value={editForm.message}
                      onChange={(e) =>
                        setEditForm({ ...editForm, message: e.target.value })
                      }
                      rows={2}
                      placeholder="Task description..."
                    />
                  </td>
                  {!hideClientColumn && (
                    <td className="col-client">
                      {getClientName(item.client_id)}
                    </td>
                  )}
                  <td className="col-owner">
                    {item.task_owner ? getUserName(item.task_owner) : "—"}
                  </td>
                  <td className="col-assignee">
                    <select
                      className="edit-select"
                      value={editForm.assignee || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          assignee: e.target.value || null,
                        })
                      }
                    >
                      <option value="">Select assignee...</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.full_name || user.name || user.email}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="col-status">
                    <select
                      className="edit-select"
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm({ ...editForm, status: e.target.value })
                      }
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  <td className="col-priority">—</td>
                  <td className="col-due">
                    <input
                      type="date"
                      className="edit-input"
                      value={editForm.due_date}
                      onChange={(e) =>
                        setEditForm({ ...editForm, due_date: e.target.value })
                      }
                    />
                  </td>
                  <td className="col-actions">
                    <div className="actions-cell">
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
                  </td>
                </>
              ) : (
                // Display Mode
                <>
                  <td className="col-task">
                    <div className="task-cell">
                      <div className="task-name">
                        {item.message || item.task}
                      </div>
                      <div className="task-meta">
                        Meeting: {item.meeting_id}
                      </div>
                    </div>
                  </td>

                  {!hideClientColumn && (
                    <td className="col-client">
                      <div className="client-cell">
                        {getClientName(item.client_id)}
                      </div>
                    </td>
                  )}

                  <td className="col-owner">
                    <div className="owner-cell">
                      {item.task_owner ? getUserName(item.task_owner) : "—"}
                    </div>
                  </td>

                  <td className="col-assignee">
                    {item.assignee ? getUserName(item.assignee) : "Unassigned"}
                  </td>

                  <td className="col-status">
                    <PermissionGuard 
                      permissions={['update_open_point']}
                      fallback={
                        <span className={`status-badge status-${item.status || "open"}`}>
                          {item.status === 'in_progress' ? 'In Progress' : 
                           item.status === 'completed' ? 'Completed' : 'Open'}
                        </span>
                      }
                    >
                      <select
                        className={`status-select status-${
                          item.status || "open"
                        }`}
                        value={item.status || "open"}
                        onChange={(e) =>
                          updateItemStatus(item.id, e.target.value)
                        }
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </PermissionGuard>
                  </td>

                  <td className="col-priority">
                    <div className="priority-cell">
                      {item.due_date && new Date(item.due_date) < new Date() ? (
                        <span className="priority-high">High</span>
                      ) : item.due_date &&
                        new Date(item.due_date) <=
                          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? (
                        <span className="priority-medium">⚡ Medium</span>
                      ) : (
                        <span className="priority-low">— Low</span>
                      )}
                    </div>
                  </td>

                  <td className="col-due">
                    <div className="due-cell">
                      {item.due_date ? (
                        <span
                          className={`due-date ${
                            new Date(item.due_date) < new Date()
                              ? "overdue"
                              : new Date(item.due_date) <=
                                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                              ? "due-soon"
                              : ""
                          }`}
                        >
                          {new Date(item.due_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      ) : (
                        <span className="no-due-date">—</span>
                      )}
                    </div>
                  </td>

                  <td className="col-actions">
                    <div className="actions-cell">
                      <PermissionGuard permissions={['update_open_point']}>
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => startEdit(item)}
                          title="Edit"
                        >
                          <EditIcon />
                        </button>
                      </PermissionGuard>
                      <PermissionGuard permissions={['delete_open_point']}>
                        <button
                          className="btn-icon btn-danger"
                          onClick={() => deleteItem(item.id)}
                          title="Delete"
                        >
                          <DeleteIcon />
                        </button>
                      </PermissionGuard>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ActionItemsList;
