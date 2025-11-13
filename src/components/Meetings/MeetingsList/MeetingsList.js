import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { PermissionGuard } from '../../PermissionGuard';
import { PERMISSIONS } from '../../../constants/permissions';
import {
  VideoCall as VideoCallIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Sort as SortIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
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
  const { hasAnyPermission } = useAuth();
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' or 'list'
  const [collapsedMonths, setCollapsedMonths] = useState(new Set());
  
  // Check if user has any action permissions
  const hasActionPermissions = hasAnyPermission([PERMISSIONS.UPDATE_MEETING, PERMISSIONS.DELETE_MEETING]);
  const handleActionClick = (action, meeting, event) => {
    event.stopPropagation();
    
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

  const formatMonthYear = (dateString) => {
    if (!dateString) return 'Unknown Date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  // Sort and group meetings
  const { sortedMeetings, groupedMeetings } = useMemo(() => {
    // Sort meetings by date
    const sorted = [...meetings].sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    // Group meetings by month
    const grouped = sorted.reduce((groups, meeting) => {
      const monthYear = formatMonthYear(meeting.created_at);
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(meeting);
      return groups;
    }, {});

    return { sortedMeetings: sorted, groupedMeetings: grouped };
  }, [meetings, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grouped' ? 'list' : 'grouped');
  };

  const toggleMonthCollapse = (monthYear) => {
    setCollapsedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(monthYear)) {
        newSet.delete(monthYear);
      } else {
        newSet.add(monthYear);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="meetings-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading meetings... This may take up to 2 minutes for clients with extensive meeting data.</p>
      </div>
    );
  }

  return (
    <div className="meetings-list">
      <div className="meetings-list-header">
        <div className="header-left">
          <h3>Client Meetings</h3>
          <span className="meetings-count">
            {meetings.length} {meetings.length === 1 ? 'meeting' : 'meetings'}
          </span>
        </div>
        <div className="header-controls">
          <div className="sort-controls">
            <button 
              className="control-btn"
              onClick={toggleSortOrder}
              title={`Sort ${sortOrder === 'desc' ? 'Oldest First' : 'Newest First'}`}
            >
              <SortIcon />
              {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
            </button>
            <button 
              className="control-btn"
              onClick={toggleViewMode}
              title={`Switch to ${viewMode === 'grouped' ? 'List' : 'Grouped'} View`}
            >
              <CalendarIcon />
              {viewMode === 'grouped' ? 'Group by Month' : 'List View'}
            </button>
          </div>
          <PermissionGuard permissions={[PERMISSIONS.CREATE_MEETING]}>
            <button className="btn btn-primary" onClick={onAddMeeting}>
              <AddIcon />
              Add Meeting
            </button>
          </PermissionGuard>
        </div>
      </div>

      <div className="meetings-list-content">
        {meetings.length > 0 ? (
          viewMode === 'grouped' ? (
            // Grouped by Month View
            <div className="meetings-grouped-view">
              {Object.entries(groupedMeetings).map(([monthYear, monthMeetings]) => (
                <div key={monthYear} className="month-group">
                  <div 
                    className="month-header"
                    onClick={() => toggleMonthCollapse(monthYear)}
                  >
                    <div className="month-info">
                      <h4>{monthYear}</h4>
                      <span className="month-count">
                        {monthMeetings.length} {monthMeetings.length === 1 ? 'meeting' : 'meetings'}
                      </span>
                    </div>
                    <button className="collapse-btn">
                      {collapsedMonths.has(monthYear) ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                    </button>
                  </div>
                  
                  {!collapsedMonths.has(monthYear) && (
                    <div className="month-meetings">
                      <div className="meetings-table-wrapper">
                        <table className="meetings-table">
                          <thead>
                            <tr>
                              <th className="table-header-title">Title</th>
                              <th className="table-header-date">Date</th>
                              {hasActionPermissions && (
                                <th className="table-header-actions">Actions</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {monthMeetings.map((meeting) => (
                              <tr 
                                key={meeting.id} 
                                className="meeting-table-row"
                                onClick={() => onMeetingSelect(meeting)}
                              >
                                <td className="meeting-title-cell">
                                  <div className="meeting-title-content">
                                    <VideoCallIcon className="meeting-title-icon" />
                                    <span className="meeting-title-text">
                                      {meeting.meeting_name || meeting.title || `Meeting #${meeting.id?.slice(-8) || 'Unknown'}`}
                                    </span>
                                  </div>
                                </td>
                                <td className="meeting-date-cell">
                                  <div className="meeting-date-content">
                                    <CalendarIcon className="meeting-date-icon" />
                                    <span>{formatDate(meeting.created_at)}</span>
                                  </div>
                                </td>
                                {hasActionPermissions && (
                                  <td className="meeting-actions-cell">
                                    <div className="meeting-actions" onClick={(e) => e.stopPropagation()}>
                                      <PermissionGuard permissions={[PERMISSIONS.UPDATE_MEETING]}>
                                        <button 
                                          className="action-btn edit"
                                          onClick={(e) => handleActionClick('edit', meeting, e)}
                                          title="Edit Meeting"
                                        >
                                          <EditIcon />
                                        </button>
                                      </PermissionGuard>
                                      <PermissionGuard permissions={[PERMISSIONS.DELETE_MEETING]}>
                                        <button 
                                          className="action-btn delete"
                                          onClick={(e) => handleActionClick('delete', meeting, e)}
                                          title="Delete Meeting"
                                        >
                                          <DeleteIcon />
                                        </button>
                                      </PermissionGuard>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // List View (Original)
            <div className="meetings-table-wrapper">
              <table className="meetings-table">
                <thead>
                  <tr>
                    <th className="table-header-title">Title</th>
                    <th className="table-header-date">Date</th>
                    {hasActionPermissions && (
                      <th className="table-header-actions">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sortedMeetings.map((meeting) => (
                    <tr 
                      key={meeting.id} 
                      className="meeting-table-row"
                      onClick={() => onMeetingSelect(meeting)}
                    >
                      <td className="meeting-title-cell">
                        <div className="meeting-title-content">
                          <VideoCallIcon className="meeting-title-icon" />
                          <span className="meeting-title-text">
                            {meeting.meeting_name || meeting.title || `Meeting #${meeting.id?.slice(-8) || 'Unknown'}`}
                          </span>
                        </div>
                      </td>
                      <td className="meeting-date-cell">
                        <div className="meeting-date-content">
                          <CalendarIcon className="meeting-date-icon" />
                          <span>{formatDate(meeting.created_at)}</span>
                        </div>
                      </td>
                      {hasActionPermissions && (
                        <td className="meeting-actions-cell">
                          <div className="meeting-actions" onClick={(e) => e.stopPropagation()}>
                            <PermissionGuard permissions={[PERMISSIONS.UPDATE_MEETING]}>
                              <button 
                                className="action-btn edit"
                                onClick={(e) => handleActionClick('edit', meeting, e)}
                                title="Edit Meeting"
                              >
                                <EditIcon />
                              </button>
                            </PermissionGuard>
                            <PermissionGuard permissions={[PERMISSIONS.DELETE_MEETING]}>
                              <button 
                                className="action-btn delete"
                                onClick={(e) => handleActionClick('delete', meeting, e)}
                                title="Delete Meeting"
                              >
                                <DeleteIcon />
                              </button>
                            </PermissionGuard>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
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