import React, { useState, useEffect } from "react";
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  VideoCall as VideoCallIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Notes as NotesIcon,
  RecordVoiceOver as TranscriptIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { meetingAPI } from "../../../utils/apiServices";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import LoadingSpinner from "../../UI/LoadingSpinner/LoadingSpinner";
import MeetingNotes from "../MeetingNotes/MeetingNotes";
import TranscriptDisplay from "../TranscriptDisplay/TranscriptDisplay";
import MarkdownSummary from "../MarkdownSummary/MarkdownSummary";
import ActionItems from "../ActionItems/ActionItems";
import "./MeetingDetails.css";

const MeetingDetails = ({
  meetingId,
  onBack,
  onEdit,
  onDelete,
  clientName,
}) => {
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const { showError } = useNotificationContext();

  useEffect(() => {
    if (meetingId) {
      loadMeetingDetails();
    }
  }, [meetingId]);

  const loadMeetingDetails = async () => {
    try {
      setLoading(true);
      const meetingData = await meetingAPI.getById(meetingId);
      setMeeting(meetingData);
    } catch (error) {
      showError("Failed to load meeting details");
      console.error("Error loading meeting details:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date set";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "No time set";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (duration) => {
    if (!duration) return "Unknown duration";
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="meeting-details-loading">
        <LoadingSpinner message="Loading meeting details..." />
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
            <h1>{meeting.meeting_name || `Meeting #${meeting.id?.slice(-8) || "Unknown"}`}</h1>
            <p className="meeting-client">with {clientName}</p>
          </div>
        </div>

        <div className="meeting-actions-header">
          <button
            className="btn btn-secondary btn-xs"
            onClick={() => onEdit(meeting)}
          >
            <EditIcon />
            Edit
          </button>
          {meeting.recording_url && (
            <button
              className="btn btn-primary btn-xs"
              onClick={() => window.open(meeting.recording_url, '_blank')}
            >
              <VideoCallIcon />
              View Recording
            </button>
          )}
          <button
            className="btn btn-danger btn-xs"
            onClick={() => onDelete(meeting)}
          >
            <DeleteIcon />
            Delete
          </button>
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
            <TranscriptDisplay 
              transcript={meeting.transcript} 
              rawTranscript={meeting.raw_transcript}
            />
          </div>
        )}

        {activeTab === "action-items" && (
          <ActionItems
            meetingId={meetingId}
            meeting={meeting}
            onRefresh={loadMeetingDetails}
          />
        )}

        {activeTab === "notes" && (
          <MeetingNotes
            meetingId={meetingId}
            onNotesUpdate={loadMeetingDetails}
          />
        )}
      </div>
    </div>
  );
};

export default MeetingDetails;
