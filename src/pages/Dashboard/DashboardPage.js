import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { clientAPI, meetingAPI, openPointsAPI } from '../../utils/apiServices';
import Header from '../../components/Layout/Header/Header';
import LoadingSpinner from '../../components/UI/LoadingSpinner/LoadingSpinner';
import ApiTest from '../../components/Debug/ApiTest';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const { showError, showSuccess, showInfo } = useNotificationContext();
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    clients: [],
    recentMeetings: [],
    openTasks: [],
    stats: {
      totalClients: 0,
      totalMeetings: 0,
      openTasks: 0,
      completedTasks: 0
    }
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
        completedTasks: 0
      };

      // Load recent meetings and tasks for each client
      let allMeetings = [];
      let allTasks = [];
      
      for (const client of clients.slice(0, 5)) { // Limit to first 5 clients for performance
        try {
          const meetings = await meetingAPI.getByClient(client.id);
          const tasks = await openPointsAPI.getByClient(client.id);
          
          allMeetings = [...allMeetings, ...meetings];
          allTasks = [...allTasks, ...tasks];
          
          stats.totalMeetings += meetings.length;
          stats.openTasks += tasks.filter(task => task.status === 'open' || task.status === 'in_progress').length;
          stats.completedTasks += tasks.filter(task => task.status === 'completed').length;
        } catch (error) {
          console.warn(`Failed to load data for client ${client.id}:`, error);
        }
      }

      setDashboardData({
        clients,
        recentMeetings: allMeetings.slice(0, 5), // Show 5 most recent
        openTasks: allTasks.filter(task => task.status !== 'completed').slice(0, 5),
        stats
      });
      
    } catch (error) {
      showError('Failed to load dashboard data. Please try again.');
      console.error('Dashboard data loading failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const actions = [
    {
      icon: '👥',
      title: 'Manage Clients',
      description: 'Add, edit, or view your client information and assignments',
      action: () => showInfo('Client management feature coming soon!')
    },
    {
      icon: '📹',
      title: 'Upload Meeting',
      description: 'Upload meeting recordings and generate transcripts',
      action: () => showInfo('Meeting upload feature coming soon!')
    },
    {
      icon: '📋',
      title: 'View Tasks',
      description: 'Manage open points and track task completion',
      action: () => showInfo('Task management feature coming soon!')
    },
    {
      icon: '🔐',
      title: 'Manage Secrets',
      description: 'Securely store and manage client credentials',
      action: () => showInfo('Secrets management feature coming soon!')
    }
  ];

  if (loading) {
    return (
      <div className="dashboard-page">
        <Header />
        <div className="dashboard-loading">
          <LoadingSpinner message="Loading dashboard..." />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Header />
      
      <main className="dashboard-content">
        <div className="container">
          <div className="dashboard-welcome">
            <h2 className="welcome-title">
              Welcome back, {user?.name || user?.email || 'User'}!
            </h2>
            <p className="welcome-subtitle">
              Here's what's happening with your CMS today.
            </p>
          </div>

          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-number">{dashboardData.stats.totalClients}</div>
              <p className="stat-label">Total Clients</p>
            </div>
            <div className="stat-card">
              <div className="stat-number">{dashboardData.stats.totalMeetings}</div>
              <p className="stat-label">Total Meetings</p>
            </div>
            <div className="stat-card">
              <div className="stat-number">{dashboardData.stats.openTasks}</div>
              <p className="stat-label">Open Tasks</p>
            </div>
            <div className="stat-card">
              <div className="stat-number">{dashboardData.stats.completedTasks}</div>
              <p className="stat-label">Completed Tasks</p>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="dashboard-sections">
            <div className="dashboard-section">
              <h3 className="section-title">Recent Clients</h3>
              <div className="section-content">
                {dashboardData.clients.length > 0 ? (
                  dashboardData.clients.slice(0, 5).map((client) => (
                    <div key={client.id} className="client-item">
                      <div className="client-info">
                        <h4 className="client-name">{client.name}</h4>
                        <p className="client-email">{client.email}</p>
                      </div>
                      <div className="client-status">
                        <span className="status-badge status-active">Active</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">No clients found. Start by adding your first client!</p>
                )}
              </div>
            </div>

            <div className="dashboard-section">
              <h3 className="section-title">Open Tasks</h3>
              <div className="section-content">
                {dashboardData.openTasks.length > 0 ? (
                  dashboardData.openTasks.map((task) => (
                    <div key={task.id} className="task-item">
                      <div className="task-info">
                        <h4 className="task-title">{task.title}</h4>
                        <p className="task-description">{task.description}</p>
                      </div>
                      <div className="task-status">
                        <span className={`status-badge status-${task.status}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">No open tasks. Great job staying on top of everything!</p>
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-actions">
            {actions.map((action, index) => (
              <div key={index} className="action-card">
                <div className="action-icon">{action.icon}</div>
                <h3 className="action-title">{action.title}</h3>
                <p className="action-description">{action.description}</p>
                <button 
                  className="btn btn-primary"
                  onClick={action.action}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>

          {/* API Test Component - Remove in production */}
          {process.env.NODE_ENV === 'development' && <ApiTest />}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;