import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { PermissionGuard } from '../../PermissionGuard';
import {
  VideoCall as VideoCallIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Notes as NotesIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import './MeetingsList.css';

const MeetingsList = ({ 
  meetings = [], 
  onMeetingSelect, 
  onAddMeeting, 
  onEditMeeting, 
  onDeleteMeeting,
  loading = false 
}) => {
  const [activeDropdown, setActiveDropdown] = useState(null);

  const handleDropdownToggle = (meetingId, event) => {
    event.stopPropagation();
    setActiveDropdown(activeDropdown === meetingId ? null : meetingId);
  };

  const handleActionClick = (action, meeting, event) => {
    event.stopPropagation();
    setActiveDropdown(null);
    
    switch (action) {
      case 'view':
        onMeetingSelect(meeting);
        break;
      case 'edit':
        onEditMeeting(meeting);
        break;
      case 'delete':
        onDeleteMeeting(meeting);
        break;
      default:
        break;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
      <div className="meetings-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading meetings...</p>
      </div>
    );
  }

  return (
    <div className="meetings-list">
      <div className="meetings-list-header">
        <h3>Client Meetings</h3>
        <PermissionGuard permissions={['create_meeting']}>
          <button className="btn btn-primary" onClick={onAddMeeting}>
            <AddIcon />
            Add Meeting
          </button>
        </PermissionGuard>
      </div>

      <div className="meetings-list-content">
        {meetings.length > 0 ? (
          <div className="meetings-list-container">
            {meetings.map((meeting) => (
              <div 
                key={meeting.id} 
                className="meeting-card horizontal"
                onClick={() => onMeetingSelect(meeting)}
              >
                <div className="meeting-card-left">
                  <div className="meeting-icon-wrapper">
                    <VideoCallIcon className="meeting-icon" />
                  </div>
                  
                  <div className="meeting-card-content">
                    <h4 className="meeting-title">
                      {meeting.meeting_name || `Meeting #${meeting.id?.slice(-8) || 'Unknown'}`}
                    </h4>
                    
                    <div className="meeting-meta">
                      <div className="meeting-date">
                        <CalendarIcon className="meta-icon" />
                        <span>{formatDate(meeting.created_at)}</span>
                      </div>
                      {meeting.recording_url && (
                        <div className="meeting-recording">
                          <span>Has Recording</span>
                        </div>
                      )}
                    </div>

                    <div className="meeting-status">
                      <span className="status-badge completed">
                        Recorded
                      </span>
                      {meeting.transcript && (
                        <div className="notes-indicator">
                          <NotesIcon className="notes-icon" />
                          <span>Has Transcript</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="meeting-card-right">
                  <div className="meeting-actions">
                    <PermissionGuard permissions={['update_meeting']}>
                      <button 
                        className="action-btn edit"
                        onClick={(e) => handleActionClick('edit', meeting, e)}
                        title="Edit Meeting"
                      >
                        <EditIcon />
                      </button>
                    </PermissionGuard>
                    <PermissionGuard permissions={['delete_meeting']}>
                      <button 
                        className="action-btn delete"
                        onClick={(e) => handleActionClick('delete', meeting, e)}
                        title="Delete Meeting"
                      >
                        <DeleteIcon />
                      </button>
                    </PermissionGuard>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-meetings-state">
            <VideoCallIcon className="empty-icon" />
            <h4>No meetings found</h4>
            <p>Start by adding a meeting for this client.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingsList;