import React, { useState } from "react";
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  VideoCall as VideoCallIcon,
  Notes as NotesIcon,
  RecordVoiceOver as TranscriptIcon,
  Assignment as AssignmentIcon,
  Description as MomIcon,
} from "@mui/icons-material";
import { useQueryClient } from "@tanstack/react-query";
import { useMeeting, useMeetingTranscript } from "../../../hooks/useQueries";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import LoadingSpinner from "../../UI/LoadingSpinner/LoadingSpinner";
import MeetingNotes from "../MeetingNotes/MeetingNotes";
import TranscriptDisplay from "../TranscriptDisplay/TranscriptDisplay";
import MarkdownSummary from "../MarkdownSummary/MarkdownSummary";
import ActionItems from "../ActionItems/ActionItems";
import MinutesOfMeeting from "../MinutesOfMeeting/MinutesOfMeeting";
import { PermissionGuard } from "../../PermissionGuard";
import { PERMISSIONS } from "../../../constants/permissions";
import { queryKeys } from "../../../utils/queryClient";
import "./MeetingDetails.css";

const MeetingDetails = ({
  meetingId,
  meeting: propMeeting,
  onBack,
  onEdit,
  onDelete,
  clientName,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const { showError } = useNotificationContext();
  const queryClient = useQueryClient();

  // Use cached query for meeting details
  const {
    data: meetingData,
    isLoading: loading,
    error,
  } = useMeeting(meetingId, { enabled: !!meetingId });

  // Use prop meeting if available, otherwise use query data
  const meeting = propMeeting || meetingData;

  const transcriptEnabled = Boolean(
    meetingId &&
    meeting &&
    activeTab === "transcript" &&
    meeting.has_transcript !== false
  );

  const {
    data: transcriptData,
    isLoading: loadingTranscript,
    error: transcriptError,
  } = useMeetingTranscript(meetingId, { enabled: transcriptEnabled });

  React.useEffect(() => {
    if (error) {
      showError("Failed to load meeting details");
    }
  }, [error, showError]);

  React.useEffect(() => {
    if (transcriptError) {
      showError("Failed to load meeting transcript");
    }
  }, [transcriptError, showError]);

  if (loading) {
    return (
      <div className="meeting-details-loading">
        <LoadingSpinner message="Loading meeting details... Please wait, this may take up to 2 minutes." />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="meeting-details-error">
        <h3>Meeting not found</h3>
        <p>The requested meeting could not be loaded.</p>
        <button className="btn btn-primary" onClick={onBack}>
          <ArrowBackIcon />
        </button>
      </div>
    );
  }

  return (
    <div className="meeting-details">
      <div className="meeting-details-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowBackIcon />
        </button>

        <div className="meeting-header-info">
          <div className="meeting-icon-large">
            <VideoCallIcon />
          </div>
          <div className="meeting-title-section">
            <h1>
              {meeting.meeting_name ||
                `Meeting #${meeting.id?.slice(-8) || "Unknown"}`}
            </h1>
            <p className="meeting-client">with {clientName}</p>
          </div>
        </div>

        <div className="meeting-actions-header">
          <PermissionGuard permissions={[PERMISSIONS.UPDATE_MEETING]}>
            <button
              className="btn btn-secondary btn-xs"
              onClick={() => onEdit(meeting)}
            >
              <EditIcon />
              Edit
            </button>
          </PermissionGuard>
          {meeting.recording_url && (
            <button
              className="btn btn-primary btn-xs"
              onClick={() => window.open(meeting.recording_url, "_blank")}
            >
              <VideoCallIcon />
              View Recording
            </button>
          )}
          <PermissionGuard permissions={[PERMISSIONS.DELETE_MEETING]}>
            <button
              className="btn btn-danger btn-xs"
              onClick={() => onDelete(meeting)}
            >
              <DeleteIcon />
              Delete
            </button>
          </PermissionGuard>
        </div>
      </div>

      <div className="meeting-details-tabs">
        <button
          className={`tab-btn ${activeTab === "details" ? "active" : ""}`}
          onClick={() => setActiveTab("details")}
        >
          <VideoCallIcon />
          Details
        </button>
        <button
          className={`tab-btn ${activeTab === "transcript" ? "active" : ""}`}
          onClick={() => setActiveTab("transcript")}
        >
          <TranscriptIcon />
          Transcript
        </button>
        <button
          className={`tab-btn ${activeTab === "action-items" ? "active" : ""}`}
          onClick={() => setActiveTab("action-items")}
        >
          <AssignmentIcon />
          Action Items
        </button>
        <button
          className={`tab-btn ${activeTab === "mom" ? "active" : ""}`}
          onClick={() => setActiveTab("mom")}
        >
          <MomIcon />
          MoM
        </button>
        <button
          className={`tab-btn ${activeTab === "notes" ? "active" : ""}`}
          onClick={() => setActiveTab("notes")}
        >
          <NotesIcon />
          Notes
        </button>
      </div>

      <div className="meeting-details-content">
        {activeTab === "details" && (
          <div className="meeting-details-tab">
            <div className="meeting-info-grid">
              {meeting.summary && (
                <div className="meeting-summary-container full-width">
                  <MarkdownSummary
                    summary={meeting.summary}
                    title="Meeting Summary"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "transcript" && (
          <div className="meeting-transcript-tab">
            {meeting.has_transcript === false ? (
              <div className="meeting-details-error">
                <p>Transcript is not available for this meeting.</p>
              </div>
            ) : loadingTranscript ? (
              <LoadingSpinner message="Loading transcript..." />
            ) : (
              <TranscriptDisplay
                transcript={
                  transcriptData?.transcript ?? meeting.transcript ?? ""
                }
                rawTranscript={
                  transcriptData?.raw_transcript ?? meeting.raw_transcript ?? ""
                }
              />
            )}
          </div>
        )}

        {activeTab === "action-items" && (
          <ActionItems
            meetingId={meetingId}
            meeting={meeting}
            onRefresh={() => {
              if (meetingId) {
                // Ensure meeting details cache picks up latest action-item edits
                queryClient.invalidateQueries({
                  queryKey: queryKeys.meetings.detail(meetingId),
                });
                queryClient.invalidateQueries({
                  queryKey: queryKeys.meetings.actionItems(meetingId),
                  exact: false,
                });
              }
            }}
          />
        )}

        {activeTab === "mom" && (
          <MinutesOfMeeting
            meetingId={meetingId}
            onContentUpdate={() => {
              // React Query will automatically refetch
            }}
          />
        )}

        {activeTab === "notes" && (
          <MeetingNotes
            meetingId={meetingId}
            onNotesUpdate={() => {
              // React Query will automatically refetch
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MeetingDetails;
