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
  Assignment as AssignmentIcon
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
    summary: ''
  });
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useNotificationContext();

  useEffect(() => {
    if (meeting) {
      // Editing existing meeting
      setFormData({
        recording_url: meeting.recording_url || '',
        transcript: meeting.transcript || '',
        summary: meeting.summary || ''
      });
    } else {
      // Creating new meeting
      setFormData({
        recording_url: '',
        transcript: '',
        summary: ''
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      
      const meetingData = {
        recording_url: formData.recording_url.trim() || null,
        transcript: formData.transcript.trim() || null,
        summary: formData.summary.trim() || null
      };

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
      summary: ''
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
            <div className="form-group">
              <label htmlFor="recording_url">
                <LinkIcon className="label-icon" />
                Recording URL
              </label>
              <input
                type="url"
                id="recording_url"
                name="recording_url"
                value={formData.recording_url}
                onChange={handleInputChange}
                placeholder="https://example.com/recording.mp4"
                className="form-input"
              />
            </div>

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
            </div>
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