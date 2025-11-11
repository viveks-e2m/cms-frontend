import React, { useState, useEffect } from "react";
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
import { PERMISSIONS } from "../../constants/permissions";
import { getStatusDisplayName, getStatusOptions } from "../../utils/statusUtils";

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
  
  // Check if user has any action permissions to determine if Actions column should be shown
  const hasAnyActionPermission = hasPermission(PERMISSIONS.UPDATE_TASK) || hasPermission(PERMISSIONS.DELETE_TASK);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    message: "",
    due_date: "",
    assignee: null,
    task_owner: null,
    status: "open",
  });

  // Local state for optimistic updates
  const [localActionItems, setLocalActionItems] = useState(actionItems);

  const { showSuccess, showError } = useNotificationContext();

  // Sync local state with props when actionItems change
  useEffect(() => {
    setLocalActionItems(actionItems);
  }, [actionItems]);

  const getMeetingTitle = (meetingId) => {
    console.log("Looking for meeting ID:", meetingId, "in meetings:", meetings);
    const meeting = meetings.find((m) => m.id === meetingId);
    console.log("Found meeting:", meeting);
    return meeting?.meeting_name || meeting?.name || "Unknown Meeting";
  };

  const getClientName = (item) => {
    // First, try to use the client_name from the backend response
    if (item.client_name) {
      return item.client_name;
    }
    
    // Fallback to looking up in the clients list
    console.log("Looking for client ID:", item.client_id, "in clients:", clients);
    const client = clients.find((c) => c.id === item.client_id);
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

  // Check if the task owner is a client
  const isTaskOwnerClient = (taskOwnerId) => {
    if (!taskOwnerId) return false;
    return clients.some(client => client.id === taskOwnerId);
  };

  // Get task owner display name (could be user or client)
  const getTaskOwnerName = (taskOwnerId) => {
    if (!taskOwnerId) return null;
    
    // Check if it's a user
    const user = users.find((u) => u.id === taskOwnerId);
    if (user) {
      return user.full_name || user.name || user.email;
    }
    
    // Check if it's a client
    const client = clients.find((c) => c.id === taskOwnerId);
    if (client) {
      return client.name;
    }
    
    return "Unknown";
  };

  const updateItemStatus = async (itemId, newStatus) => {
    console.log("Updating item status:", itemId, "to:", newStatus);
    
    // Optimistic update - update UI immediately
    const previousItems = localActionItems;
    setLocalActionItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, status: newStatus } : item
      )
    );

    try {
      const result = await openPointsAPI.updateStatus(itemId, {
        status: newStatus,
      });
      console.log("Update result:", result);
      showSuccess(`Action item marked as ${getStatusDisplayName(newStatus)}`);
      
      // Sync with server in background
      if (onRefresh) onRefresh();
    } catch (error) {
      // Revert optimistic update on error
      setLocalActionItems(previousItems);
      showError("Failed to update action item status");
      console.error("Error updating status:", error);
      console.error("Full error details:", error.response || error);
    }
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this action item?")) {
      return;
    }

    // Optimistic update - remove item from UI immediately
    const previousItems = localActionItems;
    setLocalActionItems(prev => prev.filter(item => item.id !== itemId));

    try {
      await openPointsAPI.delete(itemId);
      showSuccess("Action item deleted successfully");
      
      // Sync with server in background
      if (onRefresh) onRefresh();
    } catch (error) {
      // Revert optimistic update on error
      setLocalActionItems(previousItems);
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
      task_owner: item.task_owner || null,
      status: item.status || "open",
    });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditForm({
      message: "",
      due_date: "",
      assignee: null,
      task_owner: null,
      status: "open",
    });
  };

  const saveEdit = async (itemId) => {
    const updateData = {
      message: editForm.message,
      status: editForm.status,
      assignee: editForm.assignee || null,
      task_owner: editForm.task_owner || null,
      due_date: editForm.due_date || null,
    };

    // Optimistic update - update UI immediately
    const previousItems = localActionItems;
    setLocalActionItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, ...updateData } : item
      )
    );

    try {
      await openPointsAPI.updateStatus(itemId, updateData);
      showSuccess("Action item updated successfully");
      setEditingItem(null);
      
      // Sync with server in background
      if (onRefresh) onRefresh();
    } catch (error) {
      // Revert optimistic update on error
      setLocalActionItems(previousItems);
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

  if (localActionItems.length === 0) {
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
      <table className={`action-items-table ${hideClientColumn ? 'hide-client-column' : ''} ${!hasAnyActionPermission ? 'hide-actions-column' : ''}`}>
        <thead>
          <tr>
            <th className="col-task">Task Name</th>
            {!hideClientColumn && <th className="col-client">Client</th>}
            <th className="col-owner">Task Owner</th>
            <th className="col-assignee">Assignee</th>
            <th className="col-status">Status</th>
            <th className="col-priority">Priority</th>
            <th className="col-due">Due Date</th>
            {hasAnyActionPermission && <th className="col-actions">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {localActionItems.map((item) => (
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
                      {getClientName(item)}
                    </td>
                  )}
                  <td className="col-owner">
                    <select
                      className="edit-select"
                      value={editForm.task_owner || ""}
                      onChange={(e) => {
                        const newTaskOwner = e.target.value || null;
                        const isClient = newTaskOwner && clients.some(client => client.id === newTaskOwner);
                        setEditForm({
                          ...editForm,
                          task_owner: newTaskOwner,
                          assignee: isClient ? null : editForm.assignee, // Clear assignee if client selected
                        });
                      }}
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
                      disabled={isTaskOwnerClient(editForm.task_owner)}
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
                      {getStatusOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
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
                  {hasAnyActionPermission && (
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
                  )}
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
                        {getClientName(item)}
                      </div>
                    </td>
                  )}

                  <td className="col-owner">
                    <div className="owner-cell">
                      {item.task_owner ? getTaskOwnerName(item.task_owner) : "—"}
                    </div>
                  </td>

                  <td className="col-assignee">
                    {item.assignee ? getUserName(item.assignee) : "Unassigned"}
                  </td>

                  <td className="col-status">
                    <PermissionGuard 
                      permissions={[PERMISSIONS.UPDATE_TASK]}
                      fallback={
                        <span className={`status-badge status-${item.status || "open"}`}>
                          {getStatusDisplayName(item.status)}
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
                        {getStatusOptions().map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
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
                        <span className="priority-medium">Medium</span>
                      ) : (
                        <span className="priority-low"> Low</span>
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

                  {hasAnyActionPermission && (
                    <td className="col-actions">
                      <div className="actions-cell">
                        <PermissionGuard permissions={[PERMISSIONS.UPDATE_TASK]}>
                          <button
                            className="btn-icon btn-edit"
                            onClick={() => startEdit(item)}
                            title="Edit"
                          >
                            <EditIcon />
                          </button>
                        </PermissionGuard>
                        <PermissionGuard permissions={[PERMISSIONS.DELETE_TASK]}>
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
                  )}
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
