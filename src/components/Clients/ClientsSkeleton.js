import React from "react";
import { Skeleton, Box } from "@mui/material";
import "./ClientsSkeleton.css";

const ClientsSkeleton = ({ viewMode = "grid" }) => {
  return (
    <div className="clients-skeleton">
      {/* Controls Bar Skeleton */}
      <div className="skeleton-controls-bar">
        <div className="skeleton-controls-left">
          <Skeleton
            variant="rectangular"
            width={300}
            height={40}
            className="skeleton-search"
          />
          <Skeleton
            variant="rectangular"
            width={100}
            height={40}
            className="skeleton-filter-btn"
          />
          <Skeleton
            variant="rectangular"
            width={150}
            height={40}
            className="skeleton-sort"
          />
        </div>
        <div className="skeleton-controls-right">
          <Skeleton
            variant="text"
            width={120}
            height={24}
            className="skeleton-results"
          />
          <Skeleton
            variant="rectangular"
            width={80}
            height={40}
            className="skeleton-view-toggle"
          />
          <Skeleton
            variant="rectangular"
            width={100}
            height={40}
            className="skeleton-add-btn"
          />
        </div>
      </div>

      {/* Content Skeleton */}
      {viewMode === "grid" ? (
        <div className="skeleton-grid-container">
          {/* Status Groups Skeleton */}
          {[1, 2, 3].map((groupIndex) => (
            <div key={groupIndex} className="skeleton-status-group">
              <div className="skeleton-status-group-header">
                <Skeleton
                  variant="text"
                  width={150}
                  height={28}
                  className="skeleton-status-title"
                />
                <Skeleton
                  variant="circular"
                  width={24}
                  height={24}
                  className="skeleton-status-count"
                />
              </div>
              <div className="skeleton-clients-grid">
                {[1, 2, 3, 4].map((cardIndex) => (
                  <div key={cardIndex} className="skeleton-client-card">
                    <div className="skeleton-card-header">
                      <div className="skeleton-card-header-left">
                        <Skeleton
                          variant="circular"
                          width={48}
                          height={48}
                          className="skeleton-avatar"
                        />
                        <div className="skeleton-card-title-section">
                          <Skeleton
                            variant="text"
                            width={120}
                            height={20}
                            className="skeleton-client-name"
                          />
                          <Skeleton
                            variant="text"
                            width={100}
                            height={16}
                            className="skeleton-client-company"
                          />
                        </div>
                      </div>
                      <Skeleton
                        variant="rectangular"
                        width={80}
                        height={24}
                        className="skeleton-status-badge"
                      />
                    </div>
                    <div className="skeleton-card-body">
                      <Skeleton
                        variant="text"
                        width={140}
                        height={16}
                        className="skeleton-assignment"
                      />
                      <Skeleton
                        variant="text"
                        width={140}
                        height={16}
                        className="skeleton-assignment"
                      />
                    </div>
                    <div className="skeleton-card-footer">
                      <Skeleton
                        variant="text"
                        width={100}
                        height={16}
                        className="skeleton-date"
                      />
                      <Skeleton
                        variant="rectangular"
                        width={60}
                        height={32}
                        className="skeleton-actions"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="skeleton-table-container">
          <table className="skeleton-table">
            <thead>
              <tr>
                <th>
                  <Skeleton variant="text" width={100} height={20} />
                </th>
                <th>
                  <Skeleton variant="text" width={120} height={20} />
                </th>
                <th>
                  <Skeleton variant="text" width={120} height={20} />
                </th>
                <th>
                  <Skeleton variant="text" width={80} height={20} />
                </th>
                <th>
                  <Skeleton variant="text" width={100} height={20} />
                </th>
                <th>
                  <Skeleton variant="text" width={80} height={20} />
                </th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((rowIndex) => (
                <tr key={rowIndex} className="skeleton-table-row">
                  <td>
                    <div className="skeleton-table-cell-content">
                      <Skeleton
                        variant="circular"
                        width={40}
                        height={40}
                        className="skeleton-table-avatar"
                      />
                      <div className="skeleton-table-text">
                        <Skeleton
                          variant="text"
                          width={120}
                          height={18}
                          className="skeleton-table-name"
                        />
                        <Skeleton
                          variant="text"
                          width={100}
                          height={14}
                          className="skeleton-table-company"
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <Skeleton variant="text" width={100} height={16} />
                  </td>
                  <td>
                    <Skeleton variant="text" width={100} height={16} />
                  </td>
                  <td>
                    <Skeleton
                      variant="rectangular"
                      width={80}
                      height={24}
                      className="skeleton-table-status"
                    />
                  </td>
                  <td>
                    <Skeleton variant="text" width={90} height={16} />
                  </td>
                  <td>
                    <Skeleton
                      variant="rectangular"
                      width={60}
                      height={32}
                      className="skeleton-table-actions"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClientsSkeleton;


