import React, { useState, useEffect, useCallback } from "react";
import { fathomAPI } from "../../../utils/apiServices";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import "./FathomMeetingSelector.css";

const FathomMeetingSelector = ({ onSelectMeeting, disabled = false }) => {
  const [loading, setLoading] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const { showError } = useNotificationContext();

  const fetchMeetings = useCallback(async () => {
    if (disabled) return;

    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await fathomAPI.getMeetings(10);

      if (data.meetings && data.meetings.length > 0) {
        setMeetings(data.meetings);
      } else {
        setMeetings([]);
      }
    } catch (error) {
      console.error("Error fetching Fathom meetings:", error);
      setMeetings([]);
      setErrorMessage("Failed to fetch Fathom meetings. Please try again.");

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
        showError("Rate limit exceeded. Please wait a moment and try again.");
      } else if (error.message && error.message.includes("Access forbidden")) {
        showError(
          "Access forbidden. Please check your Fathom API key permissions."
        );
      } else if (error.message) {
        showError(`Error fetching Fathom meetings: ${error.message}`);
      } else {
        showError("Failed to fetch Fathom meetings. Please try again.");
      }
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  }, [disabled, showError]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleSelectMeeting = (meeting) => {
    onSelectMeeting({
      meeting_name: meeting.title || meeting.meeting_title || "Untitled Meeting",
      recording_url: meeting.share_url || meeting.url,
      fathom_recording_id: meeting.recording_id,
    });
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
      <div className="meetings-list-container">
        <div className="meetings-list-header">
          <h4>Select a meeting</h4>
          <button
            type="button"
            className="refresh-meetings-btn"
            onClick={fetchMeetings}
            disabled={loading || disabled}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loading && (
          <div className="meetings-loading-state">
            <span className="spinner"></span>
            <span>Loading recent meetings...</span>
          </div>
        )}

        {!loading && hasFetched && errorMessage && (
          <div className="meetings-empty-state error">
            <p>{errorMessage}</p>
            <p className="hint">Check your Fathom integration and try again.</p>
          </div>
        )}

        {!loading && hasFetched && !errorMessage && meetings.length === 0 && (
          <div className="meetings-empty-state">
            <p>No recent meetings found.</p>
            <p className="hint">Once you have meetings in Fathom, they will appear here.</p>
          </div>
        )}

        {meetings.length > 0 && (
          <div className="meetings-list">
            {meetings.map((meeting) => {
              const meetingTitle =
                meeting.title || meeting.meeting_title || "Untitled Meeting";
              const recordingDate = formatDate(
                meeting.recording_start_time || meeting.created_at
              );

              return (
                <div
                  key={meeting.recording_id || meeting.id}
                  className="meeting-item"
                  onClick={() => handleSelectMeeting(meeting)}
                >
                  <h5 className="meeting-title">{meetingTitle}</h5>
                  <span className="meeting-date">{recordingDate}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FathomMeetingSelector;