import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNotificationContext } from "../../contexts/NotificationContext";
import {
  useRecentClients,
  useClientStats,
  useMeetingStats,
  useActionItemStats,
} from "../../hooks/useQueries";
import DashboardLayout from "../../components/Layout/DashboardLayout/DashboardLayout";
import LoadingSpinner from "../../components/UI/LoadingSpinner/LoadingSpinner";
import ClientAvatar from "../../components/UI/ClientAvatar";
import { PermissionGuard } from "../../components/PermissionGuard";
import { PERMISSIONS } from "../../constants/permissions";
import {
  People as PeopleIcon,
  VideoCall as VideoCallIcon,
  Assignment as AssignmentIcon,
  WavingHand as WavingHandIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import "./DashboardPage.css";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError } = useNotificationContext();

  // Use cached queries
  const {
    data: recentClientsData,
    isLoading: loadingClients,
    error: clientsError,
  } = useRecentClients(10);

  const {
    data: clientStats,
    isLoading: loadingClientStats,
    error: clientStatsError,
  } = useClientStats();

  const {
    data: meetingStats,
    isLoading: loadingMeetingStats,
    error: meetingStatsError,
  } = useMeetingStats();

  const {
    data: openPointsStats,
    isLoading: loadingActionItemStats,
    error: actionItemStatsError,
  } = useActionItemStats();

  const loading =
    loadingClients ||
    loadingClientStats ||
    loadingMeetingStats ||
    loadingActionItemStats;

  // Handle errors
  React.useEffect(() => {
    if (clientsError || clientStatsError || meetingStatsError || actionItemStatsError) {
      showError("Failed to load dashboard data. Please try again.");
    }
  }, [clientsError, clientStatsError, meetingStatsError, actionItemStatsError, showError]);

  // Prepare dashboard data
  const dashboardData = React.useMemo(() => {
    const clients = recentClientsData?.recent_clients || recentClientsData || [];
    const stats = clientStats || {};
    const meetings = meetingStats || {};
    const actionItems = openPointsStats || {};

    // Calculate total excluding inactive clients
    const inactiveCount = stats.inactive_clients || 0;
    const totalWithInactive = stats.total_clients || 0;
    const totalClientsExcludingInactive = Math.max(0, totalWithInactive - inactiveCount);

    return {
      clients,
      recentMeetings: [],
      clientStats: {
        total_clients: totalClientsExcludingInactive,
        active_clients: stats.active_clients || 0,
        pre_boarding_clients: stats.pre_boarding_clients || 0,
        onboarding_clients: stats.onboarding_clients || 0,
        assessment_clients: stats.assessment_clients || 0,
        inactive_clients: stats.inactive_clients || 0,
      },
      actionItemStats: {
        total_open_points: actionItems.total_open_points || 0,
        in_progress_tasks: actionItems.in_progress_tasks || 0,
        completed_tasks: actionItems.completed_tasks || 0,
        total_tasks: actionItems.total_tasks || 0,
        completion_rate: actionItems.completion_rate || 0,
      },
      meetingStats: {
        total_meetings: meetings.total_meetings || 0,
        recent_meetings: meetings.recent_meetings || 0,
      },
    };
  }, [recentClientsData, clientStats, meetingStats, openPointsStats]);

  const getUserDisplayName = () => {
    return user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.name || user?.email?.split("@")[0] || "User";
  };

  // Navigation handlers
  const handleClientStatClick = (status) => {
    if (status === 'total') {
      navigate('/clients');
    } else {
      navigate(`/clients?status=${status}`);
    }
  };

  const handleActionItemStatClick = (status) => {
    if (status === 'total') {
      navigate('/action-items');
    } else {
      navigate(`/action-items?status=${status}`);
    }
  };

  const handleClientClick = (clientId) => {
    navigate(`/clients?clientId=${clientId}`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="dashboard-loading">
          <LoadingSpinner message="Loading dashboard..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="dashboard-page">
        {/* Welcome Section */}
        <div className="dashboard-header">
          <div className="welcome-section">
            <div className="welcome-icon-wrapper">
              <WavingHandIcon className="welcome-icon" />
            </div>
            <div className="welcome-content">
              <h1 className="welcome-title">
                Welcome back, <span className="welcome-name">{getUserDisplayName()}</span>
              </h1>
              <p className="welcome-subtitle">
                Here's what's happening with your CMS today
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards - Compact Design */}
        <div className="metrics-grid-compact">
          {/* Clients Card - Enhanced with breakdown */}
          <PermissionGuard permissions={[PERMISSIONS.READ_CLIENT]}>
            <div className="metric-card-enhanced metric-card-clients">
              <div className="metric-card-header-compact metric-card-header-clickable" onClick={() => handleClientStatClick('total')}>
                <div className="metric-icon-wrapper-compact metric-icon-clients">
                  <PeopleIcon className="metric-icon" />
                </div>
                <div className="metric-header-content-compact">
                  <h3 className="metric-title-compact">Clients</h3>
                  <div className="metric-value-compact">{dashboardData.clientStats.total_clients}</div>
                </div>
              </div>
              <div className="metric-breakdown">
                <div className="breakdown-item breakdown-item-clickable" onClick={() => handleClientStatClick('active')}>
                  <span className="breakdown-label">Active</span>
                  <span className="breakdown-value breakdown-success">{dashboardData.clientStats.active_clients}</span>
                </div>
                <div className="breakdown-item breakdown-item-clickable" onClick={() => handleClientStatClick('pre_boarding')}>
                  <span className="breakdown-label">Pre-boarding</span>
                  <span className="breakdown-value breakdown-warning">{dashboardData.clientStats.pre_boarding_clients}</span>
                </div>
                <div className="breakdown-item breakdown-item-clickable" onClick={() => handleClientStatClick('onboarding')}>
                  <span className="breakdown-label">Onboarding</span>
                  <span className="breakdown-value breakdown-info">{dashboardData.clientStats.onboarding_clients}</span>
                </div>
                <div className="breakdown-item breakdown-item-clickable" onClick={() => handleClientStatClick('assessment')}>
                  <span className="breakdown-label">Assessment</span>
                  <span className="breakdown-value breakdown-secondary">{dashboardData.clientStats.assessment_clients}</span>
                </div>
              </div>
            </div>
          </PermissionGuard>

          {/* Action Items Card - Enhanced with breakdown */}
          <PermissionGuard permissions={[PERMISSIONS.READ_TASK]}>
            <div className="metric-card-enhanced metric-card-tasks">
              <div className="metric-card-header-compact metric-card-header-clickable" onClick={() => handleActionItemStatClick('total')}>
                <div className="metric-icon-wrapper-compact metric-icon-tasks">
                  <AssignmentIcon className="metric-icon" />
                </div>
                <div className="metric-header-content-compact">
                  <h3 className="metric-title-compact">Action Items</h3>
                  <div className="metric-value-compact">{dashboardData.actionItemStats.total_tasks}</div>
                </div>
              </div>
              <div className="metric-breakdown">
                <div className="breakdown-item breakdown-item-clickable" onClick={() => handleActionItemStatClick('open')}>
                  <span className="breakdown-label">To Do</span>
                  <span className="breakdown-value breakdown-danger">{dashboardData.actionItemStats.total_open_points}</span>
                </div>
                <div className="breakdown-item breakdown-item-clickable" onClick={() => handleActionItemStatClick('in_progress')}>
                  <span className="breakdown-label">In Progress</span>
                  <span className="breakdown-value breakdown-warning">{dashboardData.actionItemStats.in_progress_tasks}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Completion Rate</span>
                  <span className="breakdown-value breakdown-success">{dashboardData.actionItemStats.completion_rate}%</span>
                </div>
                <div className="breakdown-item breakdown-item-clickable" onClick={() => handleActionItemStatClick('completed')}>
                  <span className="breakdown-label">Completed</span>
                  <span className="breakdown-value breakdown-success">{dashboardData.actionItemStats.completed_tasks}</span>
                </div>
              </div>
            </div>
          </PermissionGuard>

          {/* Meetings Card - Compact */}
          <PermissionGuard permissions={[PERMISSIONS.READ_MEETING]}>
            <div className="metric-card-enhanced metric-card-meetings">
              <div className="metric-card-header-compact">
                <div className="metric-icon-wrapper-compact metric-icon-meetings">
                  <VideoCallIcon className="metric-icon" />
                </div>
                <div className="metric-header-content-compact">
                  <h3 className="metric-title-compact">Meetings</h3>
                  <div className="metric-value-compact">{dashboardData.meetingStats.total_meetings}</div>
                </div>
              </div>
              <div className="metric-secondary-compact">
                <div className="secondary-item">
                  <span className="secondary-label">Recent</span>
                  <span className="secondary-value">{dashboardData.meetingStats.recent_meetings}</span>
                </div>
              </div>
            </div>
          </PermissionGuard>
        </div>

        {/* Recent Clients Section */}
        <PermissionGuard 
          permissions={[PERMISSIONS.READ_CLIENT]}
          fallback={
            <div className="dashboard-section">
              <div className="access-denied-message">
                <p>You don't have permission to view client information.</p>
              </div>
            </div>
          }
        >
          <div className="dashboard-section recent-clients-section">
            <div className="section-header-modern">
              <div className="section-header-content">
                <PeopleIcon className="section-title-icon" />
                <h3 className="section-title-modern">Recent Clients</h3>
              </div>
            </div>
            <div className="section-content-modern">
              {dashboardData.clients.length > 0 ? (
                <div className="clients-grid-modern">
                  {dashboardData.clients.map((client) => (
                    <div 
                      key={client.id} 
                      className="client-card-modern client-card-clickable" 
                      onClick={() => handleClientClick(client.id)}
                    >
                      <div className="client-card-avatar">
                        <ClientAvatar 
                          client={client} 
                          size="medium"
                        />
                      </div>
                      <div className="client-card-info">
                        <h4 className="client-card-name">{client.name || "Unnamed Client"}</h4>
                        {client.company && (
                          <p className="client-card-company">{client.company}</p>
                        )}
                        <div className="client-card-footer">
                          <ScheduleIcon className="client-card-date-icon" />
                          <span className="client-card-date">
                            Added {new Date(client.created_at || Date.now()).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state-modern">
                  <PeopleIcon className="empty-state-icon-modern" />
                  <h4 className="empty-state-title-modern">No clients yet</h4>
                  <p className="empty-state-description-modern">
                    Start by adding your first client to see them here
                  </p>
                </div>
              )}
            </div>
          </div>
        </PermissionGuard>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
