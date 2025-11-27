import React from "react";
import Skeleton from "@mui/material/Skeleton";
import "./DashboardSkeleton.css";

const DashboardSkeleton = () => {
  const metricCards = Array.from({ length: 3 });
  const calendarRows = Array.from({ length: 5 });

  return (
    <div className="dashboard-skeleton">
      <div className="dashboard-skeleton-header">
        <Skeleton variant="circular" width={64} height={64} />
        <div className="dashboard-skeleton-header-text">
          <Skeleton variant="text" width={220} height={36} />
          <Skeleton variant="text" width={320} height={24} />
        </div>
      </div>

      <div className="dashboard-skeleton-metrics">
        {metricCards.map((_, index) => (
          <div className="dashboard-skeleton-card" key={`metric-${index}`}>
            <div className="dashboard-skeleton-card-header">
              <Skeleton variant="circular" width={44} height={44} />
              <div className="dashboard-skeleton-card-text">
                <Skeleton variant="text" width={120} height={18} />
                <Skeleton variant="text" width={80} height={34} />
              </div>
            </div>
            <div className="dashboard-skeleton-card-breakdown">
              {Array.from({ length: 6 }).map((__, breakdownIndex) => (
                <Skeleton
                  key={`breakdown-${index}-${breakdownIndex}`}
                  variant="rectangular"
                  height={32}
                  className="dashboard-skeleton-breakdown-item"
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-skeleton-calendar">
        <div className="dashboard-skeleton-calendar-header">
          <Skeleton variant="text" width={220} height={28} />
          <Skeleton variant="rectangular" width={120} height={30} />
        </div>
        <div className="dashboard-skeleton-calendar-body">
          {calendarRows.map((_, index) => (
            <Skeleton
              key={`calendar-row-${index}`}
              variant="rectangular"
              height={52}
              className="dashboard-skeleton-calendar-row"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;

