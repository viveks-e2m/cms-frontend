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
    title: '',
    description: '',
    agenda: '',
    scheduled_at: '',
    duration: '',
    location: '',
    meeting_url: '',
    status: 'scheduled'
  });
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useNotificationContext();

  useEffect(() => {
    if (meeting) {
      // Editing existing meeting
      setFormData({
        title: meeting.title || '',
        description: meeting.description || '',
        agenda: meeting.agenda || '',
        scheduled_at: meeting.scheduled_at ? formatDateTimeForInput(meeting.scheduled_at) : '',
        duration: meeting.duration || '',
        location: meeting.location || '',
        meeting_url: meeting.meeting_url || '',
        status: meeting.status || 'scheduled'
      });
    } else {
      // Creating new meeting
      setFormData({
        title: '',
        description: '',
        agenda: '',
        scheduled_at: '',
        duration: '',
        location: '',
        meeting_url: '',
        status: 'scheduled'
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
    
    if (!formData.title.trim()) {
      showError('Meeting title is required');
      return;
    }

    try {
      setLoading(true);
      
      const meetingData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        agenda: formData.agenda.trim(),
        location: formData.location.trim(),
        meeting_url: formData.meeting_url.trim(),
        duration: formData.duration ? parseInt(formData.duration) : null,
        scheduled_at: formData.scheduled_at || null
      };

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
      title: '',
      description: '',
      agenda: '',
      scheduled_at: '',
      duration: '',
      location: '',
      meeting_url: '',
      status: 'scheduled'
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
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="title">
                <VideoCallIcon className="label-icon" />
                Meeting Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter meeting title..."
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="scheduled_at">
                <CalendarIcon className="label-icon" />
                Date & Time
              </label>
              <input
                type="datetime-local"
                id="scheduled_at"
                name="scheduled_at"
                value={formData.scheduled_at}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="duration">
                <TimeIcon className="label-icon" />
                Duration (minutes)
              </label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="60"
                min="1"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">
                <AssignmentIcon className="label-icon" />
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="location">
                <LocationIcon className="label-icon" />
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Meeting location..."
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="meeting_url">
                <LinkIcon className="label-icon" />
                Meeting Link
              </label>
              <input
                type="url"
                id="meeting_url"
                name="meeting_url"
                value={formData.meeting_url}
                onChange={handleInputChange}
                placeholder="https://..."
                className="form-input"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="description">
                <DescriptionIcon className="label-icon" />
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Meeting description..."
                rows={3}
                className="form-textarea"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="agenda">
                <AssignmentIcon className="label-icon" />
                Agenda
              </label>
              <textarea
                id="agenda"
                name="agenda"
                value={formData.agenda}
                onChange={handleInputChange}
                placeholder="Meeting agenda items..."
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