import React from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout/DashboardLayout';
import '../../styles/pages.css';

const TasksPage = () => {
  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <div className="page-title-section">
            <h1 className="page-title">📋 View Tasks</h1>
            <p className="page-subtitle">
              Manage open points and track task completion
            </p>
          </div>
        </div>
        
        <div className="coming-soon">
          <div className="coming-soon-icon">📋</div>
          <h2>Task Management Coming Soon</h2>
          <p>This feature is currently under development. You'll be able to manage tasks, track progress, and collaborate with your team.</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TasksPage;