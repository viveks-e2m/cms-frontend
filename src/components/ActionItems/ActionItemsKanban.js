import React, { useState } from "react";
import {
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Event as MeetingIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { openPointsAPI } from "../../utils/apiServices";
import { useNotificationContext } from "../../contexts/NotificationContext";
import { PermissionGuard } from "../PermissionGuard";
import { useAuth } from "../../hooks/useAuth";
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
    status: "open",
  });
  const [draggedItem, setDraggedItem] = useState(null);

  const { showSuccess, showError } = useNotificationContext();

  const columns = [
    { id: "open", title: "Open", count: 0, color: "#3B82F6" },
    { id: "in_progress", title: "In Progress", count: 0, color: "#F59E0B" },
    { id: "completed", title: "Completed", count: 0, color: "#10B981" },
  ];

  // Group items by status
  const groupedItems = actionItems.reduce((acc, item) => {
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

  const getClientName = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.name || "Unknown Client";
  };

  const getUserName = (userId) => {
    if (!userId) return null;
    const user = users.find((u) => u.id === userId);
    return user ? user.full_name || user.name || user.email : "Unknown User";
  };

  const updateItemStatus = async (itemId, newStatus) => {
    try {
      await openPointsAPI.updateStatus(itemId, { status: newStatus });
      showSuccess(`Action item moved to ${newStatus.replace("_", " ")}`);
      if (onRefresh) onRefresh();
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
      draggable={hasPermission('update_open_point')}
      onDragStart={hasPermission('update_open_point') ? (e) => handleDragStart(e, item) : undefined}
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
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
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
          </div>

          <div className="card-details">
            <div className="detail-row">
              <div className="detail-item">
                <div className="detail-left">
                  <PersonIcon className="detail-icon" />
                  <span className="detail-label">Client:</span>
                </div>
                <span className="detail-value">
                  {getClientName(item.client_id)}
                </span>
              </div>
            </div>

            {item.task_owner && (
              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-left">
                    <PersonIcon className="detail-icon" />
                    <span className="detail-label">Owner:</span>
                  </div>
                  <span className="detail-value">
                    {getUserName(item.task_owner)}
                  </span>
                </div>
              </div>
            )}

            {item.assignee && (
              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-left">
                    <PersonIcon className="detail-icon" />
                    <span className="detail-label">Assigned:</span>
                  </div>
                  <span className="detail-value">
                    {getUserName(item.assignee)}
                  </span>
                </div>
              </div>
            )}

            {item.due_date && (
              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-left">
                    <CalendarIcon className="detail-icon" />
                    <span className="detail-label">Due:</span>
                  </div>
                  <span
                    className={`detail-value ${
                      new Date(item.due_date) < new Date()
                        ? "overdue"
                        : new Date(item.due_date) <=
                          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                        ? "due-soon"
                        : ""
                    }`}
                  >
                    {new Date(item.due_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="card-footer">
            <div className="footer-left">
              <MeetingIcon className="meeting-icon" />
              <span className="meeting-name">
                Meeting: {item.meeting_id || "Unknown"}
              </span>
            </div>
            <div className="footer-right">
              <span className="created-date">
                {item.created_at
                  ? new Date(item.created_at).toLocaleDateString()
                  : "Unknown"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (actionItems.length === 0) {
    return (
      <div className="kanban-empty">
        <div className="empty-icon">📋</div>
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
