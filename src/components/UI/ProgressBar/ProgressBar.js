import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({ progress, message, showPercentage = true }) => {
  return (
    <div className="progress-bar-container">
      <div className="progress-bar-wrapper">
        <div className="progress-bar-header">
          {message && <div className="progress-bar-message">{message}</div>}
          {showPercentage && (
            <div className="progress-bar-percentage">{Math.round(progress)}%</div>
          )}
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;

