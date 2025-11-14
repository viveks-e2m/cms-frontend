import React, { useState } from "react";
import { fathomAPI } from "../../../utils/apiServices";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import "./FathomMeetingSelector.css";

// Helper function to calculate duration
const calculateDuration = (start, end) => {
  const startTime = new Date(start);
  const endTime = new Date(end);
  const durationMs = endTime - startTime;
  const minutes = Math.floor(durationMs / 60000);
  
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

const FathomMeetingSelector = ({ onSelectMeeting, disabled = false }) => {
  const [loading, setLoading] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [showList, setShowList] = useState(false);
  const { showError, showInfo } = useNotificationContext();

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      showInfo("Fetching your recent Fathom meetings...");
      
      const data = await fathomAPI.getMeetings(10);
      
      if (data.meetings && data.meetings.length > 0) {
        setMeetings(data.meetings);
        setShowList(true);
      } else {
        showInfo("No recent meetings found in your Fathom account");
        setMeetings([]);
        setShowList(false);
      }
    } catch (error) {
      console.error("Error fetching Fathom meetings:", error);
      
      // Handle specific error cases
      if (error.message && error.message.includes("API key not found")) {
        showError(
          "Fathom API key not configured. Please add your API key in your profile settings first."
        );
      } else if (error.message && error.message.includes("Invalid or expired")) {
        showError(
          "Invalid Fathom API key. Please update your API key in your profile settings."
        );
      } else if (error.message && error.message.includes("Connection error")) {
        showError(
          "Connection error while fetching meetings from Fathom. Please check your internet connection and try again."
        );
      } else if (error.message && error.message.includes("Rate limit exceeded")) {
        showError(
          "Rate limit exceeded. Please wait a moment and try again."
        );
      } else if (error.message && error.message.includes("Access forbidden")) {
        showError(
          "Access forbidden. Please check your Fathom API key permissions."
        );
      } else if (error.message) {
        showError(`Error fetching Fathom meetings: ${error.message}`);
      } else {
        showError("Failed to fetch Fathom meetings. Please try again.");
      }
      
      setMeetings([]);
      setShowList(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMeeting = (meeting) => {
    onSelectMeeting({
      meeting_name: meeting.title || meeting.meeting_title || "Untitled Meeting",
      recording_url: meeting.share_url || meeting.url,
      fathom_recording_id: meeting.recording_id,
    });
    setShowList(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fathom-meeting-selector">
      <button
        type="button"
        className="fetch-fathom-btn"
        onClick={fetchMeetings}
        disabled={disabled || loading}
      >
        {loading ? (
          <>
            <span className="spinner"></span>
            Fetching meetings...
          </>
        ) : (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Import from Fathom
          </>
        )}
      </button>

      {showList && meetings.length > 0 && (
        <div className="meetings-list-container">
          <div className="meetings-list-header">
            <h4>Select a meeting</h4>
            <button
              type="button"
              className="close-list-btn"
              onClick={() => setShowList(false)}
            >
              ×
            </button>
          </div>
          <div className="meetings-list">
            {meetings.map((meeting) => (
              <div
                key={meeting.recording_id || meeting.id}
                className="meeting-item"
                onClick={() => handleSelectMeeting(meeting)}
              >
                <div className="meeting-item-header">
                  <h5 className="meeting-title">
                    {meeting.title || meeting.meeting_title || "Untitled Meeting"}
                  </h5>
                  <span className="meeting-language">
                    {meeting.transcript_language?.toUpperCase() || "EN"}
                  </span>
                </div>
                <div className="meeting-item-meta">
                  <span className="meeting-date">
                    {formatDate(meeting.recording_start_time || meeting.created_at)}
                  </span>
                  {meeting.recording_end_time && meeting.recording_start_time && (
                    <span className="meeting-duration">
                      {calculateDuration(
                        meeting.recording_start_time,
                        meeting.recording_end_time
                      )}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FathomMeetingSelector;