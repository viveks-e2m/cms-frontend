import React, { useState, useEffect } from "react";
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  VideoCall as VideoCallIcon,
  Link as LinkIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
  Source as SourceIcon,
  RadioButtonChecked as RadioCheckedIcon,
  RadioButtonUnchecked as RadioUncheckedIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useNotificationContext } from "../../../contexts/NotificationContext";
import { useCreateMeeting, useUpdateMeeting } from "../../../hooks/useMutations";
import FathomMeetingSelector from "../FathomMeetingSelector/FathomMeetingSelector";
import "./MeetingForm.css";

const MeetingForm = ({
  meeting = null,
  clientId,
  clientName,
  onSave,
  onCancel,
  isOpen = false,
}) => {
  const [formData, setFormData] = useState({
    recording_url: "",
    transcript: "",
    summary: "",
    meeting_name: "",
    source: "fathom",
  });
  const [loading, setLoading] = useState(false);
  const [fathomStatus, setFathomStatus] = useState({
    fetching: false,
    success: false,
    error: null,
    attempted: false,
  });
  const { showError, showSuccess, showInfo } = useNotificationContext();
  const createMeetingMutation = useCreateMeeting({ suppressNotifications: true });
  const updateMeetingMutation = useUpdateMeeting({ suppressNotifications: true });

  useEffect(() => {
    if (meeting) {
      // Editing existing meeting
      setFormData({
        recording_url: meeting.recording_url || "",
        transcript: meeting.transcript || "",
        summary: meeting.summary || "",
        meeting_name: meeting.meeting_name || "",
        source: meeting.source || "other",
      });
    } else {
      // Creating new meeting
      setFormData({
        recording_url: "",
        transcript: "",
        summary: "",
        meeting_name: "",
        source: "fathom",
      });
    }
  }, [meeting, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSourceChange = (source) => {
    setFormData((prev) => ({
      ...prev,
      source,
      // Clear transcript and summary when switching to Fathom
      ...(source === "fathom" ? { transcript: "", summary: "" } : {}),
    }));

    // Reset Fathom status when changing source
    setFathomStatus({
      fetching: false,
      success: false,
      error: null,
      attempted: false,
    });
  };

  const handleFathomMeetingSelect = (meetingData) => {
    setFormData((prev) => ({
      ...prev,
      meeting_name: meetingData.meeting_name,
      recording_url: meetingData.recording_url,
    }));
    showSuccess("Meeting details imported from Fathom");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.recording_url?.trim()) {
      showError("Recording URL is required");
      return;
    }

    const meetingData = {
      recording_url: formData.recording_url.trim() || null,
      transcript: formData.transcript.trim() || null,
      summary: formData.summary.trim() || null,
      meeting_name: formData.meeting_name.trim() || null,
      source: formData.source,
    };

    // Remove null values
    Object.keys(meetingData).forEach((key) => {
      if (meetingData[key] === null || meetingData[key] === "") {
        delete meetingData[key];
      }
    });

    // Show different loading message for Fathom when creating a new meeting
    if (!meeting && formData.source === "fathom") {
      setFathomStatus((prev) => ({ ...prev, fetching: true, error: null }));
      showInfo(
        "Creating meeting and fetching data from Fathom... This may take up to 5 minutes."
      );
    }

    setLoading(true);

    try {
      let result;
      if (meeting) {
        // Update existing meeting
        result = await updateMeetingMutation.mutateAsync({
          meetingId: meeting.id,
          meetingData,
        });
        showSuccess("Meeting updated successfully");
      } else {
        // Create new meeting
        result = await createMeetingMutation.mutateAsync({
          clientId,
          meetingData,
        });

        // Check if Fathom data was fetched successfully
        if (formData.source === "fathom") {
          const meetingResult = result;
          
          // Check for background action items generation
          if (meetingResult?.action_items_status === "generating_in_background") {
            setFathomStatus((prev) => ({
              ...prev,
              success: true,
              fetching: false,
              attempted: true,
            }));
            showSuccess(
              "Meeting created successfully! Action items are being generated in the background and will be available shortly."
            );
            showInfo("You can view the meeting details now. Action items will appear automatically once generated.");
          } else if (meetingResult?.fathom_fetch_success) {
            setFathomStatus((prev) => ({
              ...prev,
              success: true,
              fetching: false,
              attempted: true,
            }));
            showSuccess(
              "Meeting created successfully with Fathom data imported!"
            );
          } else if (meetingResult?.fathom_fetch_attempted) {
            setFathomStatus((prev) => ({
              ...prev,
              success: false,
              fetching: false,
              attempted: true,
              error:
                "Could not fetch data from Fathom URL. Meeting created with URL only.",
            }));
            showSuccess(
              "Meeting created successfully, but Fathom data could not be imported."
            );
          } else {
            showSuccess("Meeting created successfully");
          }
        } else {
          showSuccess("Meeting created successfully");
        }
      }

      onSave();
    } catch (error) {
      console.error("Error saving meeting:", error);

      // Check if this is a network error or actual API failure
      const errorMessage =
        error?.response?.data?.error?.message ||
        error?.message ||
        "Unknown error";

      if (formData.source === "fathom" && !meeting) {
        setFathomStatus((prev) => ({
          ...prev,
          fetching: false,
          success: false,
          attempted: true,
          error: `Failed to create meeting: ${errorMessage}`,
        }));
      }

      showError(
        meeting
          ? `Failed to update meeting: ${errorMessage}`
          : `Failed to create meeting: ${errorMessage}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      recording_url: "",
      transcript: "",
      summary: "",
      meeting_name: "",
      source: "fathom",
    });
    setFathomStatus({
      fetching: false,
      success: false,
      error: null,
      attempted: false,
    });
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="meeting-form-overlay">
      <div className="meeting-form-modal">
        <div className="meeting-form-header">
          <div className="form-title-section">
            <VideoCallIcon className="form-icon" />
            <div>
              <h2>{meeting ? "Edit Meeting" : "Add New Meeting"}</h2>
              <p>for {clientName}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="meeting-form">
          <div className="form-grid single-column">
            {/* Source Selection */}
            <div className="form-group">
              <label className="source-label">
                <SourceIcon className="label-icon" />
                Meeting Source
              </label>
              <div className="source-selection">
                <div
                  className={`source-option ${
                    formData.source === "fathom" ? "selected" : ""
                  }`}
                  onClick={() => handleSourceChange("fathom")}
                >
                  {formData.source === "fathom" ? (
                    <RadioCheckedIcon className="radio-icon" />
                  ) : (
                    <RadioUncheckedIcon className="radio-icon" />
                  )}
                  <div className="source-info">
                    <span className="source-title">Fathom</span>
                    <span className="source-description">
                      Import from Fathom recording
                    </span>
                  </div>
                </div>
                <div
                  className={`source-option ${
                    formData.source === "other" ? "selected" : ""
                  }`}
                  onClick={() => handleSourceChange("other")}
                >
                  {formData.source === "other" ? (
                    <RadioCheckedIcon className="radio-icon" />
                  ) : (
                    <RadioUncheckedIcon className="radio-icon" />
                  )}
                  <div className="source-info">
                    <span className="source-title">Other</span>
                    <span className="source-description">
                      Manual input with transcript and summary
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fathom Meeting Selector - Only show for Fathom source */}
            {formData.source === "fathom" and !meeting && (
              <div className="form-group">
                <FathomMeetingSelector
                  onSelectMeeting={handleFathomMeetingSelect}
                  disabled={loading}
                />
              </div>
            )}

            {/* Meeting Name - Optional */}
            <div className="form-group">
              <label htmlFor="meeting_name">
                <AssignmentIcon className="label-icon" />
                Meeting Name
              </label>
              <input
                type="text"
                id="meeting_name"
                name="meeting_name"
                value={formData.meeting_name}
                onChange={handleInputChange}
                placeholder="Enter a custom meeting name (optional)"
                className="form-input"
              />
              <small className="field-hint">
                If left empty, the meeting name will be automatically extracted
                from the summary
              </small>
            </div>

            {/* Recording URL - Always Required */}
            <div className="form-group">
              <label htmlFor="recording_url">
                <LinkIcon className="label-icon" />
                Recording URL *
              </label>
              <input
                type="url"
                id="recording_url"
                name="recording_url"
                value={formData.recording_url}
                onChange={handleInputChange}
                placeholder={
                  formData.source === "fathom"
                    ? "https://app.fathom.video/call/..."
                    : "https://example.com/recording.mp4"
                }
                className="form-input"
                required
              />
              <small className="field-hint">
                {formData.source === "fathom"
                  ? "Paste the Fathom recording URL"
                  : "Provide the URL to the meeting recording"}
              </small>
            </div>

            {/* Conditional Fields for 'Other' Source */}
            {formData.source === "other" and (
              <>
                <div className="form-group">
                  <label htmlFor="transcript">
                    <DescriptionIcon className="label-icon" />
                    Meeting Transcript
                  </label>
                  <textarea
                    id="transcript"
                    name="transcript"
                    value={formData.transcript}
                    onChange={handleInputChange}
                    placeholder="Enter the meeting transcript here..."
                    rows={6}
                    className="form-textarea"
                  />
                  <small className="field-hint">
                    Provide the full transcript of the meeting conversation
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="summary">
                    <AssignmentIcon className="label-icon" />
                    Meeting Summary
                  </label>
                  <textarea
                    id="summary"
                    name="summary"
                    value={formData.summary}
                    onChange={handleInputChange}
                    placeholder="Enter a summary of the meeting..."
                    rows={4}
                    className="form-textarea"
                  />
                  <small className="field-hint">
                    Summarize the key points and decisions from the meeting
                  </small>
                </div>
              </>
            )}

            {/* Info for Fathom Source */}
            {formData.source === "fathom" and (
              <div className="fathom-info">
                <div className="info-box">
                  <VideoCallIcon className="info-icon" />
                  <div className="info-content">
                    <h4>Fathom Integration</h4>
                    <p>
                      When using Fathom as the source, the transcript and
                      summary will be automatically fetched from Fathom. Action
                      items will also be automatically generated and available
                      in the Action Items tab. You only need to provide the
                      recording URL.
                    </p>
                  </div>
                </div>

                {/* Fathom Status Indicator */}
                {(fathomStatus.fetching || fathomStatus.attempted) and (
                  <div
                    className={`fathom-status ${
                      fathomStatus.success
                        ? "success"
                        : fathomStatus.error
                        ? "error"
                        : "loading"
                    }`}
                  >
                    <div className="status-icon">
                      {fathomStatus.fetching and (
                        <RefreshIcon className="spinning" />
                      )}
                      {fathomStatus.success and <SuccessIcon />}
                      {fathomStatus.error and <ErrorIcon />}
                    </div>
                    <div className="status-content">
                      {fathomStatus.fetching and (
                        <>
                          <span className="status-title">
                            Fetching Fathom Data...
                          </span>
                          <span className="status-description">
                            Fetching raw response from Fathom API
                          </span>
                        </>
                      )}
                      {fathomStatus.success and (
                        <>
                          <span className="status-title">
                            Fathom Data Imported
                          </span>
                          <span className="status-description">
                            Raw response successfully stored in transcript
                          </span>
                        </>
                      )}
                      {fathomStatus.error and (
                        <>
                          <span className="status-title">
                            Fathom Import Failed
                          </span>
                          <span className="status-description">
                            {fathomStatus.error}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-secondary"
              disabled={loading}
            >
              <CancelIcon />
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              <SaveIcon />
              {loading
                ? (!meeting and formData.source === "fathom")
                  ? "Creating & Fetching Fathom Data..."
                  : "Saving..."
                : meeting
                ? "Update Meeting"
                : "Create Meeting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MeetingForm;