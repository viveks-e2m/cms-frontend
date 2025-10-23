import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNotificationContext } from "../../contexts/NotificationContext";
import { clientAPI, meetingAPI, openPointsAPI } from "../../utils/apiServices";
import DashboardLayout from "../../components/Layout/DashboardLayout/DashboardLayout";
import LoadingSpinner from "../../components/UI/LoadingSpinner/LoadingSpinner";
import ClientAvatar from "../../components/UI/ClientAvatar";
import { PermissionGuard } from "../../components/PermissionGuard";
import {
  People as PeopleIcon,
  VideoCall as VideoCallIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  WavingHand as WavingHandIcon,
} from "@mui/icons-material";
import "./DashboardPage.css";

const DashboardPage = () => {
  const { user, hasPermission } = useAuth();
  const { showError } = useNotificationContext();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    clients: [],
    recentMeetings: [],
    stats: {
      totalClients: 0,
      totalMeetings: 0,
      openTasks: 0,
      completedTasks: 0,
    },
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load clients data
      const clients = await clientAPI.getAll();

      // Calculate stats
      const stats = {
        totalClients: clients.length,
        totalMeetings: 0,
        openTasks: 0,
        completedTasks: 0,
      };

      // Load recent meetings and tasks for each client (for stats only)
      let allMeetings = [];
      let allTasks = [];

      for (const client of clients.slice(0, 5)) {
        // Limit to first 5 clients for performance
        try {
          const meetings = await meetingAPI.getByClient(client.id);
          const tasks = await openPointsAPI.getByClient(client.id);

          allMeetings = [...allMeetings, ...meetings];
          allTasks = [...allTasks, ...tasks];

          stats.totalMeetings += meetings.length;
          stats.openTasks += tasks.filter(
            (task) => task.status === "open" || task.status === "in_progress"
          ).length;
          stats.completedTasks += tasks.filter(
            (task) => task.status === "completed"
          ).length;
        } catch (error) {
          console.warn(`Failed to load data for client ${client.id}:`, error);
        }
      }

      setDashboardData({
        clients,
        recentMeetings: allMeetings.slice(0, 5), // Show 5 most recent
        stats,
      });
    } catch (error) {
      showError("Failed to load dashboard data. Please try again.");
      console.error("Dashboard data loading failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Removed actions array - now using sidebar navigation

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
        {/* Welcome Message */}
        <div className="dashboard-welcome">
          <h1 className="welcome-title">
            <WavingHandIcon className="welcome-icon" />
            Welcome back, {user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.name || user?.email?.split("@")[0] || "User"}!
          </h1>
          <p className="welcome-subtitle">
            Here's an overview of your CMS activities and recent updates.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="dashboard-stats">
          <PermissionGuard permissions={['read_client']}>
            <div className="stat-card clients">
              <div className="stat-icon">
                <PeopleIcon />
              </div>
              <div className="stat-content">
                <div className="stat-number">
                  {dashboardData.stats.totalClients}
                </div>
                <p className="stat-label">Total Clients</p>
                <div className="stat-trend positive">+12% this month</div>
              </div>
            </div>
          </PermissionGuard>
          <PermissionGuard permissions={['read_meeting']}>
            <div className="stat-card meetings">
              <div className="stat-icon">
                <VideoCallIcon />
              </div>
              <div className="stat-content">
                <div className="stat-number">
                  {dashboardData.stats.totalMeetings}
                </div>
                <p className="stat-label">Total Meetings</p>
                <div className="stat-trend positive">+8% this week</div>
              </div>
            </div>
          </PermissionGuard>
          <PermissionGuard permissions={['read_open_point']}>
            <div className="stat-card tasks-open">
              <div className="stat-icon">
                <AssignmentIcon />
              </div>
              <div className="stat-content">
                <div className="stat-number">{dashboardData.stats.openTasks}</div>
                <p className="stat-label">Open Tasks</p>
                <div className="stat-trend neutral">No change</div>
              </div>
            </div>
          </PermissionGuard>
          <PermissionGuard permissions={['read_open_point']}>
            <div className="stat-card tasks-completed">
              <div className="stat-icon">
                <CheckCircleIcon />
              </div>
              <div className="stat-content">
                <div className="stat-number">
                  {dashboardData.stats.completedTasks}
                </div>
                <p className="stat-label">Completed Tasks</p>
                <div className="stat-trend positive">+15% this week</div>
              </div>
            </div>
          </PermissionGuard>
        </div>

        {/* Recent Clients Section */}
        <div className="dashboard-sections">
          <PermissionGuard 
            permissions={['read_client']}
            fallback={
              <div className="dashboard-section">
                <div className="access-denied-message">
                  <p>You don't have permission to view client information.</p>
                </div>
              </div>
            }
          >
            <div className="dashboard-section recent-clients-section">
              <div className="section-header">
                <h3 className="section-title">Recent Clients</h3>
              </div>
              <div className="section-content">
                {dashboardData.clients.length > 0 ? (
                  <div className="clients-grid">
                    {dashboardData.clients.slice(0, 6).map((client) => (
                      <div key={client.id} className="client-card">
                        <div className="client-card-header">
                          <ClientAvatar 
                            client={client} 
                            size="medium"
                          />
                        </div>
                        <div className="client-card-body">
                          <h4 className="client-name">{client.name}</h4>
                          <div className="client-details">
                            {client.company && (
                              <div className="client-detail-item">
                                <span className="detail-label">Company:</span>
                                <span className="detail-value">
                                  {client.company}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                          <span className="client-date">
                            Added{" "}
                            {new Date(
                              client.created_at || Date.now()
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-card">
                    <PeopleIcon className="empty-state-icon" />
                    <h4 className="empty-state-title">No clients yet</h4>
                    <p className="empty-state-description">
                      Start by adding your first client to see them here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </PermissionGuard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
