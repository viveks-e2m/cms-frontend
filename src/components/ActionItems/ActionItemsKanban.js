import React, { useState, useEffect } from "react";
import {
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { openPointsAPI } from "../../utils/apiServices";
import { useNotificationContext } from "../../contexts/NotificationContext";
import { PermissionGuard } from "../PermissionGuard";
import { useAuth } from "../../hooks/useAuth";
import { PERMISSIONS } from "../../constants/permissions";
import { getStatusDisplayName, getStatusOptions } from "../../utils/statusUtils";

import "./ActionItemsKanban.css";

const ActionItemsKanban = ({
  actionItems,
  onRefresh,
  meetings,
  clients,
  users = [],
}) => {
  const { hasPermission } = useAuth();
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    message: "",
    due_date: "",
    assignee: null,
    task_owner: null,
    status: "open",
  });
  const [draggedItem, setDraggedItem] = useState(null);
  
  // Local state for optimistic updates
  const [localActionItems, setLocalActionItems] = useState(actionItems);

  const { showSuccess, showError } = useNotificationContext();

  // Sync local state with props when actionItems change
  useEffect(() => {
    setLocalActionItems(actionItems);
  }, [actionItems]);

  const columns = [
    { id: "open", title: getStatusDisplayName("open"), count: 0, color: "#3B82F6" },
    { id: "in_progress", title: getStatusDisplayName("in_progress"), count: 0, color: "#F59E0B" },
    { id: "completed", title: getStatusDisplayName("completed"), count: 0, color: "#10B981" },
  ];

  // Group items by status using local state for optimistic updates
  const groupedItems = localActionItems.reduce((acc, item) => {
    const status = item.status || "open";
    if (!acc[status]) acc[status] = [];
    acc[status].push(item);
    return acc;
  }, {});

  // Update column counts
  columns.forEach((column) => {
    column.count = groupedItems[column.id]?.length || 0;
  });

  const getMeetingTitle = (meetingId) => {
    const meeting = meetings.find((m) => m.id === meetingId);
    return meeting?.meeting_name || meeting?.name || "Unknown Meeting";
  };

  const getClientName = (item) => {
    // First, try to use the client_name from the backend response
    if (item.client_name) {
      return item.client_name;
    }
    
    // Fallback to looking up in the clients list
    const client = clients.find((c) => c.id === item.client_id);
    return client?.name || "Unknown Client";
  };

  const getUserName = (userId) => {
    if (!userId) return null;
    const user = users.find((u) => u.id === userId);
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
    // Optimistic update - update UI immediately
    const previousItems = localActionItems;
    setLocalActionItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, status: newStatus } : item
      )
    );

    try {
      await openPointsAPI.updateStatus(itemId, { status: newStatus });
      showSuccess(`Action item moved to ${getStatusDisplayName(newStatus)}`);
      
      // Sync with server in background
      if (onRefresh) onRefresh();
    } catch (error) {
      // Revert optimistic update on error
      setLocalActionItems(previousItems);
      showError("Failed to update action item status");
      console.error("Error updating status:", error);
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

  // Drag and Drop handlers
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", ""); // For Firefox compatibility
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      e.currentTarget.classList.remove("drag-over");
    }
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    if (draggedItem && draggedItem.status !== newStatus) {
      updateItemStatus(draggedItem.id, newStatus);
    }
    setDraggedItem(null);
  };

  const renderKanbanCard = (item) => (
    <div
      key={item.id}
      className={`kanban-card ${draggedItem?.id === item.id ? "dragging" : ""}`}
      draggable={hasPermission(PERMISSIONS.UPDATE_TASK)}
      onDragStart={hasPermission(PERMISSIONS.UPDATE_TASK) ? (e) => handleDragStart(e, item) : undefined}
    >
      {editingItem === item.id ? (
        <div className="card-edit-form">
          <div className="edit-field">
            <textarea
              className="edit-textarea"
              value={editForm.message}
              onChange={(e) =>
                setEditForm({ ...editForm, message: e.target.value })
              }
              rows={3}
              placeholder="Task description..."
            />
          </div>
          <div className="edit-field">
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
          </div>
          <div className="edit-field">
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
          </div>
          <div className="edit-field">
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
          </div>
          <div className="edit-field">
            <input
              type="date"
              className="edit-input"
              value={editForm.due_date}
              onChange={(e) =>
                setEditForm({ ...editForm, due_date: e.target.value })
              }
            />
          </div>
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
        </div>
      ) : (
        <div className="card-content">
          <div className="card-header">
            <div className="card-title">{item.message || item.task}</div>
            <div className="card-actions">
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
          </div>

          <div className="card-details">
            <div className="detail-row">
              <div className="detail-item">
                <PersonIcon className="detail-icon" />
                <span className="detail-value">
                  {getClientName(item)}
                </span>
              </div>
            </div>

            {(item.task_owner || item.assignee) && (
              <div className="detail-row">
                <div className="detail-item">
                  {item.assignee ? (
                    <>
                      <PersonIcon className="detail-icon" />
                      <span className="detail-value">
                        {getUserName(item.assignee)}
                      </span>
                    </>
                  ) : item.task_owner ? (
                    <>
                      <PersonIcon className="detail-icon" />
                      <span className="detail-value">
                        {getTaskOwnerName(item.task_owner)}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {item.due_date && (
            <div className="card-footer">
              <div className="due-date-wrapper">
                <CalendarIcon className="due-icon" />
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
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

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
    <div className="kanban-board">
      {columns.map((column) => (
        <div
          key={column.id}
          className="kanban-column"
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <div
            className="column-header"
            style={{ borderTopColor: column.color }}
          >
            <div className="column-title">
              <span className="column-name">{column.title}</span>
              <span
                className="column-count"
                style={{ backgroundColor: column.color }}
              >
                {column.count}
              </span>
            </div>
          </div>

          <div className="column-content">
            {(groupedItems[column.id] || []).map(renderKanbanCard)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActionItemsKanban;
