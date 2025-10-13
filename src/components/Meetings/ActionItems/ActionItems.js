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
} from "@mui/icons-material";
import { openPointsAPI, meetingAPI } from "../../../utils/apiServices";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import LoadingSpinner from "../../UI/LoadingSpinner/LoadingSpinner";
import "./ActionItems.css";

const ActionItems = ({ meetingId, meeting, onRefresh }) => {
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generationStatus, setGenerationStatus] = useState(null);
  const [polling, setPolling] = useState(false);

  const { showSuccess, showError, showInfo } = useNotificationContext();

  useEffect(() => {
    if (meetingId) {
      loadActionItems();
      
      // Start polling if this is a Fathom meeting and might have background generation
      if (meeting?.source === "fathom") {
        checkGenerationStatus();
      }
    }
  }, [meetingId, meeting]);

  const checkGenerationStatus = async () => {
    try {
      const status = await meetingAPI.getActionItemsStatus(meetingId);
      setGenerationStatus(status);
      
      if (status.status === "pending") {
        // Start polling every 5 seconds
        setPolling(true);
        const pollInterval = setInterval(async () => {
          try {
            const updatedStatus = await meetingAPI.getActionItemsStatus(meetingId);
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
            Action items are being generated from the meeting transcript. This usually takes 1-2 minutes.
          </p>
        </div>
      )}

      {generationStatus && generationStatus.status === "error" && (
        <div className="generation-status error">
          <div className="status-indicator">
            <span>⚠️ Action items generation failed</span>
          </div>
          <p className="status-message">
            {generationStatus.message || "There was an error generating action items from the meeting transcript."}
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
                <div className="item-status">
                  {getStatusIcon(item.status)}
                </div>
                <div className="item-content">
                  <h4 className="item-message">{item.message}</h4>
                  <div className="item-meta">
                    {item.assignee && (
                      <span className="item-assignee">
                        <PersonIcon />
                        Assigned to: {item.assignee}
                      </span>
                    )}
                    {item.due_date && (
                      <span className="item-due-date">
                        <CalendarIcon />
                        Due: {formatDate(item.due_date)}
                      </span>
                    )}
                    <span className="item-created">
                      Created: {formatDate(item.created_at)}
                    </span>
                  </div>
                </div>
                <div className="item-actions">
                  <div className="status-dropdown">
                    <select
                      value={item.status}
                      onChange={(e) => updateItemStatus(item.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => deleteItem(item.id)}
                    title="Delete action item"
                  >
                    <DeleteIcon />
                  </button>
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