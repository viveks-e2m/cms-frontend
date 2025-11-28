import React from "react";
import Skeleton from "@mui/material/Skeleton";
import "./ActionItemsSkeleton.css";

const ActionItemsSkeleton = ({ viewMode = "kanban" }) => {
  const listRows = Array.from({ length: 5 });
  const kanbanColumns = [
    { key: "open", title: "To Do" },
    { key: "in_progress", title: "In Progress" },
    { key: "completed", title: "Completed" },
  ];

  return (
    <div className="action-items-skeleton">
      <div className="skeleton-controls-bar">
        <div className="skeleton-controls-left">
          <Skeleton variant="rectangular" className="skeleton-search" height={44} />
          <Skeleton variant="rectangular" className="skeleton-filter-btn" height={44} />
        </div>
        <div className="skeleton-controls-right">
          <Skeleton variant="rectangular" className="skeleton-view-toggle" height={44} />
          <Skeleton variant="rectangular" className="skeleton-primary-btn" height={44} />
          <Skeleton variant="circular" width={44} height={44} />
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="skeleton-table">
          <div className="skeleton-table-header">
            {Array.from({ length: 7 }).map((_, idx) => (
              <Skeleton
                key={`header-${idx}`}
                variant="text"
                width="100%"
                height={20}
                className="skeleton-table-cell"
              />
            ))}
          </div>
          <div className="skeleton-table-body">
            {listRows.map((_, rowIdx) => (
              <div key={`row-${rowIdx}`} className="skeleton-row">
                <div className="skeleton-row-main">
                  <Skeleton variant="text" width="80%" height={22} />
                  <Skeleton variant="text" width="40%" height={16} />
                </div>
                <div className="skeleton-row-meta">
                  <Skeleton variant="text" width="50%" height={18} />
                  <Skeleton variant="text" width="40%" height={18} />
                  <Skeleton variant="rectangular" width={80} height={24} />
                  <Skeleton variant="rectangular" width={70} height={24} />
                  <Skeleton variant="rectangular" width={90} height={24} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="skeleton-kanban">
          {kanbanColumns.map((column) => (
            <div key={column.key} className="skeleton-kanban-column">
              <div className="skeleton-column-header">
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="rectangular" width={36} height={24} />
              </div>
              <div className="skeleton-column-cards">
                {listRows.map((_, idx) => (
                  <div key={`${column.key}-${idx}`} className="skeleton-kanban-card">
                    <Skeleton variant="text" width="70%" height={20} />
                    <Skeleton variant="text" width="40%" height={16} />
                    <div className="skeleton-card-meta">
                      <Skeleton variant="rectangular" width={80} height={20} />
                      <Skeleton variant="rectangular" width={70} height={20} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionItemsSkeleton;


