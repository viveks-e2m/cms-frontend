import React, { useState, useEffect } from 'react';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  VideoCall as VideoCallIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Link as LinkIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
  Source as SourceIcon,
  RadioButtonChecked as RadioCheckedIcon,
  RadioButtonUnchecked as RadioUncheckedIcon
} from '@mui/icons-material';
import { meetingAPI } from '../../../utils/apiServices';
import { useNotificationContext } from '../../../contexts/NotificationContext';
import './MeetingForm.css';

const MeetingForm = ({ 
  meeting = null, 
  clientId, 
  clientName,
  onSave, 
  onCancel,
  isOpen = false 
}) => {
  const [formData, setFormData] = useState({
    recording_url: '',
    transcript: '',
    summary: '',
    source: 'fathom'
  });
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useNotificationContext();

  useEffect(() => {
    if (meeting) {
      // Editing existing meeting
      setFormData({
        recording_url: meeting.recording_url || '',
        transcript: meeting.transcript || '',
        summary: meeting.summary || '',
        source: meeting.source || 'other'
      });
    } else {
      // Creating new meeting
      setFormData({
        recording_url: '',
        transcript: '',
        summary: '',
        source: 'fathom'
      });
    }
  }, [meeting, isOpen]);

  const formatDateTimeForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSourceChange = (source) => {
    setFormData(prev => ({
      ...prev,
      source,
      // Clear transcript and summary when switching to Fathom
      ...(source === 'fathom' ? { transcript: '', summary: '' } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      
      const meetingData = {
        recording_url: formData.recording_url.trim() || null,
        transcript: formData.transcript.trim() || null,
        summary: formData.summary.trim() || null,
        source: formData.source
      };

      // Validate required fields
      if (!meetingData.recording_url) {
        showError('Recording URL is required');
        return;
      }

      // Remove null values
      Object.keys(meetingData).forEach(key => {
        if (meetingData[key] === null || meetingData[key] === '') {
          delete meetingData[key];
        }
      });

      if (meeting) {
        // Update existing meeting
        await meetingAPI.update(meeting.id, meetingData);
        showSuccess('Meeting updated successfully');
      } else {
        // Create new meeting
        await meetingAPI.create(clientId, meetingData);
        showSuccess('Meeting created successfully');
      }
      
      onSave();
    } catch (error) {
      showError(meeting ? 'Failed to update meeting' : 'Failed to create meeting');
      console.error('Error saving meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      recording_url: '',
      transcript: '',
      summary: '',
      source: 'fathom'
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
              <h2>{meeting ? 'Edit Meeting' : 'Add New Meeting'}</h2>
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
                  className={`source-option ${formData.source === 'fathom' ? 'selected' : ''}`}
                  onClick={() => handleSourceChange('fathom')}
                >
                  {formData.source === 'fathom' ? 
                    <RadioCheckedIcon className="radio-icon" /> : 
                    <RadioUncheckedIcon className="radio-icon" />
                  }
                  <div className="source-info">
                    <span className="source-title">Fathom</span>
                    <span className="source-description">Import from Fathom recording</span>
                  </div>
                </div>
                <div 
                  className={`source-option ${formData.source === 'other' ? 'selected' : ''}`}
                  onClick={() => handleSourceChange('other')}
                >
                  {formData.source === 'other' ? 
                    <RadioCheckedIcon className="radio-icon" /> : 
                    <RadioUncheckedIcon className="radio-icon" />
                  }
                  <div className="source-info">
                    <span className="source-title">Other</span>
                    <span className="source-description">Manual input with transcript and summary</span>
                  </div>
                </div>
              </div>
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
                placeholder={formData.source === 'fathom' ? 
                  "https://app.fathom.video/call/..." : 
                  "https://example.com/recording.mp4"
                }
                className="form-input"
                required
              />
              <small className="field-hint">
                {formData.source === 'fathom' ? 
                  'Paste the Fathom recording URL' : 
                  'Provide the URL to the meeting recording'
                }
              </small>
            </div>

            {/* Conditional Fields for 'Other' Source */}
            {formData.source === 'other' && (
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
            {formData.source === 'fathom' && (
              <div className="fathom-info">
                <div className="info-box">
                  <VideoCallIcon className="info-icon" />
                  <div className="info-content">
                    <h4>Fathom Integration</h4>
                    <p>When using Fathom as the source, the transcript and summary will be automatically imported from the Fathom recording. You only need to provide the recording URL.</p>
                  </div>
                </div>
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
              {loading ? 'Saving...' : (meeting ? 'Update Meeting' : 'Create Meeting')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MeetingForm;