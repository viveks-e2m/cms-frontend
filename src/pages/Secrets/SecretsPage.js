import React from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout/DashboardLayout';

const SecretsPage = () => {
  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <div className="page-title-section">
            <h1 className="page-title">🔐 Manage Secrets</h1>
            <p className="page-subtitle">
              Securely store and manage client credentials
            </p>
          </div>
        </div>
        
        <div className="coming-soon">
          <div className="coming-soon-icon">🔐</div>
          <h2>Secrets Management Coming Soon</h2>
          <p>This feature is currently under development. You'll be able to securely store and manage sensitive client information and credentials.</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SecretsPage;