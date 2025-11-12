import React, { useState, useEffect, useMemo } from "react";
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import {
  useActionItemsByMeeting,
  useUsers,
  useClients,
} from "../../../hooks/useQueries";
import { useQueryClient } from "@tanstack/react-query";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import LoadingSpinner from "../../UI/LoadingSpinner/LoadingSpinner";
import { ActionItemsList, ActionItemForm } from "../../ActionItems";
import { PermissionGuard } from "../../PermissionGuard";
import { PERMISSIONS } from "../../../constants/permissions";
import "./ActionItems.css";

const ActionItems = ({ meetingId, meeting, onRefresh }) => {
  const [generationStatus, setGenerationStatus] = useState(null);
  const [showActionItemForm, setShowActionItemForm] = useState(false);
  const queryClient = useQueryClient();

  const { showError, showInfo } = useNotificationContext();

  // Use cached queries
  const {
    data: actionItemsData,
    isLoading: loadingActionItems,
    error: actionItemsError,
    refetch: refetchActionItems,
  } = useActionItemsByMeeting(meetingId, { enabled: !!meetingId });

  const {
    data: usersData,
    isLoading: loadingUsers,
  } = useUsers();

  const {
    data: clientsData,
    isLoading: loadingClients,
  } = useClients();

  const loading = loadingActionItems || loadingUsers || loadingClients;

  // Process action items with client info
  const actionItems = useMemo(() => {
    const items = actionItemsData || [];
    return items.map((item) => ({
      ...item,
      client_name: meeting?.client_name || "Unknown Client",
      client_id: meeting?.client_id,
    }));
  }, [actionItemsData, meeting]);

  const meetings = useMemo(() => {
    return meeting ? [meeting] : [];
  }, [meeting]);

  useEffect(() => {
    if (actionItemsError) {
      showError("Failed to load action items");
    }
  }, [actionItemsError, showError]);

  useEffect(() => {
    if (meetingId && meeting?.source === "fathom") {
      checkGenerationStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId, meeting]);

  const checkGenerationStatus = async () => {
    // This would need to be implemented as a query hook if needed
    // For now, keeping the original logic
    try {
      const { meetingAPI } = await import("../../../utils/apiServices");
      const status = await meetingAPI.getActionItemsStatus(meetingId);
      setGenerationStatus(status);

      if (status.status === "pending") {
        const pollInterval = setInterval(async () => {
          try {
            const updatedStatus = await meetingAPI.getActionItemsStatus(meetingId);
            setGenerationStatus(updatedStatus);

            if (updatedStatus.status === "completed") {
              clearInterval(pollInterval);
              showInfo("Action items have been generated!");
              await refetchActionItems();
            } else if (updatedStatus.status === "error") {
              clearInterval(pollInterval);
            }
          } catch (error) {
            console.error("Error polling action items status:", error);
          }
        }, 5000);

        setTimeout(() => {
          clearInterval(pollInterval);
        }, 300000);
      }
    } catch (error) {
      console.error("Error checking action items generation status:", error);
    }
  };

  const handleAddActionItem = () => {
    setShowActionItemForm(true);
  };

  const handleActionItemFormSave = () => {
    setShowActionItemForm(false);
    // React Query will automatically refetch due to cache invalidation
    refetchActionItems();
  };

  const handleActionItemFormCancel = () => {
    setShowActionItemForm(false);
  };

  const handleRefresh = () => {
    refetchActionItems();
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['clients'] });
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
          <PermissionGuard permissions={[PERMISSIONS.CREATE_TASK]}>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleAddActionItem}
              disabled={loading}
            >
              <AddIcon />
              Add Action Item
            </button>
          </PermissionGuard>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleRefresh}
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
        onRefresh={handleRefresh}
        meetings={meetings}
        clients={clientsData || []}
        users={usersData || []}
        hideClientColumn={true}
      />

      {/* Action Item Form Modal */}
      <ActionItemForm
        isOpen={showActionItemForm}
        onSave={handleActionItemFormSave}
        onCancel={handleActionItemFormCancel}
        prefilledData={{
          client_id: meeting?.client_id,
          meeting_id: meetingId
        }}
        clients={clientsData || []}
        meetings={meetings}
        users={usersData || []}
      />
    </div>
  );
};

export default ActionItems;
