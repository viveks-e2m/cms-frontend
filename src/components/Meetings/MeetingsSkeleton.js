import React from "react";
import { Skeleton } from "@mui/material";
import "./MeetingsSkeleton.css";

const MeetingsSkeleton = () => {
  return (
    <div className="meetings-skeleton">
      {/* Header Skeleton */}
      <header className="skeleton-header">
        <div>
          <Skeleton variant="text" width={250} height={40} className="skeleton-title" />
          <Skeleton variant="text" width={400} height={20} className="skeleton-subtitle" />
        </div>
        <Skeleton variant="rectangular" width={120} height={44} className="skeleton-refresh-btn" />
      </header>

      {/* Toolbar Skeleton */}
      <section className="skeleton-toolbar">
        <div className="skeleton-search">
          <Skeleton variant="circular" width={20} height={20} className="skeleton-search-icon" />
          <Skeleton variant="text" width="100%" height={20} className="skeleton-search-input" />
        </div>
        <Skeleton variant="rectangular" width={200} height={44} className="skeleton-filter" />
        <Skeleton variant="rectangular" width={200} height={44} className="skeleton-filter" />
      </section>

      {/* Content Skeleton - Two Column Layout */}
      <section className="skeleton-content">
        {/* Left Column - Meeting List */}
        <div className="skeleton-list">
          <div className="skeleton-meetings-list">
            {[1, 2, 3, 4, 5].map((index) => (
              <div key={index} className="skeleton-meeting-card">
                <div className="skeleton-meeting-header">
                  <div className="skeleton-meeting-info">
                    <Skeleton variant="text" width={200} height={20} className="skeleton-meeting-title" />
                    <div className="skeleton-meeting-client">
                      <Skeleton variant="circular" width={16} height={16} />
                      <Skeleton variant="text" width={120} height={16} />
                    </div>
                  </div>
                  <div className="skeleton-meeting-date">
                    <Skeleton variant="circular" width={16} height={16} />
                    <Skeleton variant="text" width={140} height={16} />
                  </div>
                </div>
                <Skeleton variant="text" width="100%" height={16} className="skeleton-meeting-snippet" />
                <Skeleton variant="text" width="90%" height={16} className="skeleton-meeting-snippet" />
                <Skeleton variant="text" width="80%" height={16} className="skeleton-meeting-snippet" />
                <div className="skeleton-meeting-meta">
                  <Skeleton variant="rectangular" width={80} height={24} className="skeleton-chip" />
                  <Skeleton variant="rectangular" width={120} height={24} className="skeleton-chip" />
                </div>
              </div>
            ))}
          </div>
          {/* Pagination Skeleton */}
          <div className="skeleton-pagination">
            <Skeleton variant="rectangular" width={100} height={40} className="skeleton-pagination-btn" />
            <Skeleton variant="text" width={150} height={20} />
            <Skeleton variant="rectangular" width={100} height={40} className="skeleton-pagination-btn" />
          </div>
        </div>

        {/* Right Column - Meeting Details */}
        <div className="skeleton-details">
          <div className="skeleton-details-card">
            {/* Details Header */}
            <div className="skeleton-details-header">
              <div>
                <Skeleton variant="text" width={300} height={32} className="skeleton-details-title" />
                <Skeleton variant="text" width={200} height={18} className="skeleton-details-date" />
              </div>
              <div className="skeleton-details-badges">
                <Skeleton variant="rectangular" width={80} height={24} className="skeleton-chip" />
                <Skeleton variant="rectangular" width={100} height={24} className="skeleton-chip" />
              </div>
            </div>

            {/* Meta Information Cards */}
            <div className="skeleton-details-meta">
              <div className="skeleton-meta-item">
                <Skeleton variant="circular" width={24} height={24} />
                <div>
                  <Skeleton variant="text" width={60} height={14} />
                  <Skeleton variant="text" width={150} height={18} />
                </div>
              </div>
              <div className="skeleton-meta-item">
                <Skeleton variant="circular" width={24} height={24} />
                <div>
                  <Skeleton variant="text" width={70} height={14} />
                  <Skeleton variant="text" width={180} height={18} />
                </div>
              </div>
            </div>

            {/* Summary Section */}
            <div className="skeleton-panel">
              <Skeleton variant="text" width={100} height={24} className="skeleton-panel-title" />
              <Skeleton variant="text" width="100%" height={16} className="skeleton-panel-text" />
              <Skeleton variant="text" width="95%" height={16} className="skeleton-panel-text" />
              <Skeleton variant="text" width="98%" height={16} className="skeleton-panel-text" />
              <Skeleton variant="text" width="90%" height={16} className="skeleton-panel-text" />
              <div className="skeleton-panel-list">
                <Skeleton variant="text" width="85%" height={16} className="skeleton-panel-text" />
                <Skeleton variant="text" width="90%" height={16} className="skeleton-panel-text" />
                <Skeleton variant="text" width="88%" height={16} className="skeleton-panel-text" />
              </div>
            </div>

            {/* Transcript Section */}
            <div className="skeleton-panel">
              <div className="skeleton-panel-header">
                <Skeleton variant="circular" width={20} height={20} />
                <Skeleton variant="text" width={100} height={20} />
              </div>
              <div className="skeleton-transcript-content">
                {[1, 2, 3, 4].map((index) => (
                  <div key={index} className="skeleton-transcript-cue">
                    <div className="skeleton-transcript-cue-header">
                      <Skeleton variant="text" width={100} height={16} />
                      <Skeleton variant="text" width={80} height={16} />
                    </div>
                    <Skeleton variant="text" width="100%" height={16} className="skeleton-transcript-text" />
                    <Skeleton variant="text" width="95%" height={16} className="skeleton-transcript-text" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MeetingsSkeleton;

