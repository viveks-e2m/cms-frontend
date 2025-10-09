import React, { useState, useEffect } from 'react';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  VideoCall as VideoCallIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Notes as NotesIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { meetingAPI } from '../../../utils/apiServices';
import { useNotificationContext } from '../../../contexts/NotificationContext';
import LoadingSpinner from '../../UI/LoadingSpinner/LoadingSpinner';
import MeetingNotes from '../MeetingNotes/MeetingNotes';
import './MeetingDetails.css';

const MeetingDetails = ({ 
  meetingId, 
  onBack, 
  onEdit, 
  onDelete,
  clientName 
}) => {
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
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
      showError('Failed to load meeting details');
      console.error('Error loading meeting details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'No time set';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (duration) => {
    if (!duration) return 'Unknown duration';
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
            <h1>Meeting #{meeting.id?.slice(-8) || 'Unknown'}</h1>
            <p className="meeting-client">with {clientName}</p>
          </div>
        </div>

        <div className="meeting-actions-header">
          <button 
            className="btn btn-secondary"
            onClick={() => onEdit(meeting)}
          >
            <EditIcon />
            Edit Meeting
          </button>
          <button 
            className="btn btn-danger"
            onClick={() => onDelete(meeting)}
          >
            <DeleteIcon />
            Delete
          </button>
        </div>
      </div>

      <div className="meeting-details-tabs">
        <button 
          className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <VideoCallIcon />
          Details
        </button>
        <button 
          className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <NotesIcon />
          Notes
        </button>
      </div>

      <div className="meeting-details-content">
        {activeTab === 'details' && (
          <div className="meeting-details-tab">
            <div className="meeting-info-grid">
              <div className="meeting-info-card">
                <h3>Meeting Information</h3>
                <div className="info-items">
                  <div className="info-item">
                    <CalendarIcon className="info-icon" />
                    <div className="info-content">
                      <label>Created Date</label>
                      <span>{formatDate(meeting.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <PersonIcon className="info-icon" />
                    <div className="info-content">
                      <label>Meeting ID</label>
                      <span>{meeting.id}</span>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <PersonIcon className="info-icon" />
                    <div className="info-content">
                      <label>Client ID</label>
                      <span>{meeting.client_id}</span>
                    </div>
                  </div>
                </div>
              </div>

              {meeting.summary && (
                <div className="meeting-info-card">
                  <h3>Meeting Summary</h3>
                  <div className="meeting-summary">
                    <p>{meeting.summary}</p>
                  </div>
                </div>
              )}

              {meeting.transcript && (
                <div className="meeting-info-card">
                  <h3>Meeting Transcript</h3>
                  <div className="meeting-transcript">
                    <p>{meeting.transcript}</p>
                  </div>
                </div>
              )}

              {meeting.recording_url && (
                <div className="meeting-info-card">
                  <h3>Recording</h3>
                  <div className="meeting-recording">
                    <a 
                      href={meeting.recording_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="meeting-link"
                    >
                      View Recording
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
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