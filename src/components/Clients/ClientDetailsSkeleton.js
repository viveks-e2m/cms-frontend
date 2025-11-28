import React from "react";
import { Skeleton } from "@mui/material";
import "./ClientDetailsSkeleton.css";

const ClientDetailsSkeleton = ({ activeTab = "overview" }) => {
  // Overview/Dashboard Tab Skeleton
  const OverviewSkeleton = () => (
    <div className="client-details-skeleton">
      <div className="skeleton-overview-layout">
        <div className="skeleton-overview-row">
          <div className="skeleton-overview-column">
            {/* Monthly Summary Card Skeleton */}
            <div className="skeleton-monthly-summary-card">
              <div className="skeleton-card-header">
                <div>
                  <Skeleton variant="text" width={120} height={14} />
                  <Skeleton variant="text" width={180} height={32} />
                </div>
                <Skeleton variant="rectangular" width={100} height={32} className="skeleton-status-badge" />
              </div>
              <div className="skeleton-card-body">
                <div className="skeleton-gauge-section">
                  <Skeleton variant="circular" width={130} height={130} className="skeleton-gauge" />
                  <div className="skeleton-gauge-caption">
                    <Skeleton variant="text" width={80} height={14} />
                    <Skeleton variant="text" width={60} height={20} />
                  </div>
                </div>
                <div className="skeleton-metrics-grid">
                  <div className="skeleton-metric-panel">
                    <Skeleton variant="text" width={60} height={12} />
                    <Skeleton variant="text" width={40} height={18} />
                  </div>
                  <div className="skeleton-metric-panel">
                    <Skeleton variant="text" width={60} height={12} />
                    <Skeleton variant="text" width={40} height={18} />
                  </div>
                  <div className="skeleton-metric-panel">
                    <Skeleton variant="text" width={60} height={12} />
                    <Skeleton variant="text" width={40} height={18} />
                  </div>
                  <div className="skeleton-metric-panel">
                    <Skeleton variant="text" width={60} height={12} />
                    <Skeleton variant="text" width={40} height={18} />
                  </div>
                </div>
                <div className="skeleton-trend-section">
                  <Skeleton variant="circular" width={32} height={32} />
                  <div>
                    <Skeleton variant="text" width={80} height={18} />
                    <Skeleton variant="text" width={120} height={14} />
                  </div>
                </div>
              </div>
              <div className="skeleton-card-footer">
                <Skeleton variant="rectangular" width={140} height={40} />
                <Skeleton variant="rectangular" width={120} height={40} />
              </div>
            </div>
          </div>
        </div>
        <div className="skeleton-overview-row">
          <div className="skeleton-overview-column">
            {/* Recent Activity Card Skeleton */}
            <div className="skeleton-activity-card">
              <div className="skeleton-card-header">
                <Skeleton variant="circular" width={24} height={24} />
                <Skeleton variant="text" width={150} height={24} />
                <Skeleton variant="rectangular" width={80} height={32} />
              </div>
              <div className="skeleton-activity-content">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="skeleton-activity-item">
                    <Skeleton variant="circular" width={8} height={8} className="skeleton-bullet" />
                    <div className="skeleton-activity-content-text">
                      <Skeleton variant="text" width={200} height={18} />
                      <Skeleton variant="text" width={100} height={14} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="skeleton-overview-column">
            {/* Recent Action Items Card Skeleton */}
            <div className="skeleton-activity-card">
              <div className="skeleton-card-header">
                <Skeleton variant="circular" width={24} height={24} />
                <Skeleton variant="text" width={180} height={24} />
                <Skeleton variant="rectangular" width={80} height={32} />
              </div>
              <div className="skeleton-activity-content">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="skeleton-activity-item">
                    <Skeleton variant="circular" width={8} height={8} className="skeleton-bullet" />
                    <div className="skeleton-activity-content-text">
                      <Skeleton variant="text" width={200} height={18} />
                      <div className="skeleton-task-meta">
                        <Skeleton variant="rectangular" width={80} height={20} className="skeleton-status-badge-small" />
                        <Skeleton variant="text" width={100} height={14} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Meetings Tab Skeleton
  const MeetingsSkeleton = () => (
    <div className="client-details-skeleton">
      <div className="skeleton-meetings-container">
        <div className="skeleton-meetings-header">
          <Skeleton variant="text" width={150} height={28} />
          <Skeleton variant="rectangular" width={120} height={40} />
        </div>
        <div className="skeleton-meetings-list">
          {[1, 2, 3, 4, 5].map((index) => (
            <div key={index} className="skeleton-meeting-item">
              <div className="skeleton-meeting-item-left">
                <Skeleton variant="circular" width={48} height={48} />
                <div className="skeleton-meeting-item-info">
                  <Skeleton variant="text" width={200} height={20} />
                  <Skeleton variant="text" width={150} height={16} />
                  <Skeleton variant="text" width={100} height={14} />
                </div>
              </div>
              <div className="skeleton-meeting-item-right">
                <Skeleton variant="rectangular" width={80} height={24} className="skeleton-status-badge" />
                <Skeleton variant="rectangular" width={60} height={32} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Action Items Tab Skeleton (reuse existing)
  const ActionItemsSkeleton = () => (
    <div className="client-details-skeleton">
      <div className="skeleton-action-items-container">
        <div className="skeleton-action-items-table">
          <div className="skeleton-table-header">
            {["Task Name", "Task Owner", "Assignee", "Status", "Priority", "Due Date", "Actions"].map((header, index) => (
              <Skeleton key={index} variant="text" width={index === 0 ? 200 : 100} height={20} />
            ))}
          </div>
          <div className="skeleton-table-body">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((rowIndex) => (
              <div key={rowIndex} className="skeleton-table-row">
                <Skeleton variant="text" width={200} height={18} />
                <Skeleton variant="text" width={120} height={18} />
                <Skeleton variant="text" width={120} height={18} />
                <Skeleton variant="rectangular" width={80} height={24} className="skeleton-status-badge" />
                <Skeleton variant="text" width={80} height={18} />
                <Skeleton variant="text" width={100} height={18} />
                <Skeleton variant="rectangular" width={60} height={32} />
              </div>
            ))}
          </div>
        </div>
        <div className="skeleton-pagination">
          <Skeleton variant="text" width={200} height={20} />
          <Skeleton variant="rectangular" width={300} height={40} />
        </div>
      </div>
    </div>
  );

  // Company Information (Onboarding) Tab Skeleton
  const OnboardingSkeleton = () => (
    <div className="client-details-skeleton">
      <div className="skeleton-onboarding-container">
        <div className="skeleton-onboarding-header">
          <div className="skeleton-onboarding-title">
            <Skeleton variant="circular" width={28} height={28} />
            <Skeleton variant="text" width={200} height={28} />
          </div>
          <Skeleton variant="rectangular" width={100} height={40} />
        </div>
        <div className="skeleton-onboarding-content">
          {[1, 2].map((sectionIndex) => (
            <div key={sectionIndex} className="skeleton-onboarding-section">
              <div className="skeleton-section-header">
                <div className="skeleton-section-header-left">
                  <Skeleton variant="rectangular" width={48} height={48} className="skeleton-icon-wrapper" />
                  <Skeleton variant="text" width={180} height={24} />
                </div>
              </div>
              <div className="skeleton-section-content">
                {[1, 2, 3, 4].map((rowIndex) => (
                  <div key={rowIndex} className="skeleton-info-row">
                    <Skeleton variant="rectangular" width={40} height={40} className="skeleton-info-icon" />
                    <div className="skeleton-info-content">
                      <Skeleton variant="text" width={100} height={12} />
                      <Skeleton variant="text" width={200} height={16} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Notes Tab Skeleton
  const NotesSkeleton = () => (
    <div className="client-details-skeleton">
      <div className="skeleton-notes-container">
        <div className="skeleton-notes-header">
          <div className="skeleton-notes-title">
            <Skeleton variant="circular" width={20} height={20} />
            <Skeleton variant="text" width={120} height={20} />
          </div>
          <Skeleton variant="rectangular" width={80} height={32} />
        </div>
        <div className="skeleton-notes-editor">
          <Skeleton variant="rectangular" width="100%" height={450} className="skeleton-editor-content" />
        </div>
      </div>
    </div>
  );

  // Render appropriate skeleton based on active tab
  switch (activeTab) {
    case "overview":
      return <OverviewSkeleton />;
    case "meetings":
      return <MeetingsSkeleton />;
    case "action-items":
      return <ActionItemsSkeleton />;
    case "onboarding":
      return <OnboardingSkeleton />;
    case "notes":
      return <NotesSkeleton />;
    default:
      return <OverviewSkeleton />;
  }
};

export default ClientDetailsSkeleton;

