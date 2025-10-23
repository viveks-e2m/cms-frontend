import React from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout/DashboardLayout';
import { PermissionGuard } from '../../components/PermissionGuard';
import '../../styles/pages.css';

const MeetingsPage = () => {
  return (
    <DashboardLayout>
      <PermissionGuard 
        permissions={['create_meeting', 'read_meeting']}
        fallback={
          <div className="page-container">
            <div className="access-denied-message">
              <p>You don't have permission to access meeting upload functionality.</p>
            </div>
          </div>
        }
      >
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
      </PermissionGuard>
    </DashboardLayout>
  );
};

export default MeetingsPage;