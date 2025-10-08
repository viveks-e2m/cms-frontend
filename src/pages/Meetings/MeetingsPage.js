import React from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout/DashboardLayout';
import '../../styles/pages.css';

const MeetingsPage = () => {
  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <div className="page-title-section">
            <h1 className="page-title">📹 Upload Meeting</h1>
            <p className="page-subtitle">
              Upload meeting recordings and generate transcripts
            </p>
          </div>
        </div>
        
        <div className="coming-soon">
          <div className="coming-soon-icon">📹</div>
          <h2>Meeting Upload Coming Soon</h2>
          <p>This feature is currently under development. You'll be able to upload meeting recordings and generate automatic transcripts.</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MeetingsPage;