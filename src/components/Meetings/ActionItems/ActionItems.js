import React, { useState, useEffect } from "react";
import {
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  openPointsAPI,
  meetingAPI,
  clientAPI,
} from "../../../utils/apiServices";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import LoadingSpinner from "../../UI/LoadingSpinner/LoadingSpinner";
import { ActionItemsList } from "../../ActionItems";
import "./ActionItems.css";

const ActionItems = ({ meetingId, meeting, onRefresh }) => {
  const [actionItems, setActionItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generationStatus, setGenerationStatus] = useState(null);
  const [polling, setPolling] = useState(false);

  const { showSuccess, showError, showInfo } = useNotificationContext();

  useEffect(() => {
    if (meetingId) {
      loadActionItems();
      loadUsers();
      loadClients();
      loadMeetings();

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

  const loadClients = async () => {
    try {
      const clientsData = await clientAPI.getAll();
      setClients(clientsData || []);
    } catch (error) {
      console.error("Error loading clients:", error);
    }
  };

  const loadMeetings = async () => {
    try {
      // For the meeting context, we just need the current meeting
      if (meeting) {
        setMeetings([meeting]);
      }
    } catch (error) {
      console.error("Error loading meetings:", error);
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
      // Add client info to action items for consistency with main ActionItems page
      const itemsWithClientInfo = (Array.isArray(items) ? items : []).map(
        (item) => ({
          ...item,
          client_name: meeting?.client_name || "Unknown Client",
          client_id: meeting?.client_id,
        })
      );
      setActionItems(itemsWithClientInfo);
    } catch (error) {
      showError("Failed to load action items");
      console.error("Error loading action items:", error);
      setActionItems([]);
    } finally {
      setLoading(false);
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

      {/* Use the professional ActionItemsList component */}
      <ActionItemsList
        actionItems={actionItems}
        onRefresh={loadActionItems}
        meetings={meetings}
        clients={clients}
        users={users}
        hideClientColumn={true}
      />
    </div>
  );
};

export default ActionItems;
