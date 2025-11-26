import React from "react";
import {
  TrendingUp as TrendingUpIcon,
  WarningAmber as WarningAmberIcon,
  CalendarMonth as CalendarMonthIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import "./MonthlySummaryCueCard.css";

const DEFAULT_SUMMARY = {
  monthLabel: "",
  statusLabel: "",
  statusKey: "pre-boarding",
  actionItems: {
    total: 0,
    open: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    completionRate: 0,
    scopeLabel: "This month",
    isMonthlyScope: true,
  },
  meetings: {
    thisMonth: 0,
    lastMonth: 0,
    trend: 0,
  },
};

const MonthlySummaryCueCard = ({
  summary = DEFAULT_SUMMARY,
  onActionItemsClick,
  onMeetingsClick,
}) => {
  const {
    monthLabel,
    statusLabel,
    statusKey,
    actionItems,
    meetings,
  } = { ...DEFAULT_SUMMARY, ...summary };

  const completionRate = Math.min(
    100,
    Math.max(0, actionItems?.completionRate ?? 0)
  );
  const gaugeRadius = 46;
  const circumference = 2 * Math.PI * gaugeRadius;
  const dashOffset =
    circumference - (completionRate / 100) * circumference || circumference;

  const meetingTrend = meetings?.trend ?? 0;
  const trendPositive = meetingTrend > 0;
  const trendNeutral = meetingTrend === 0;

  const handleActionClick = () => {
    if (typeof onActionItemsClick === "function") {
      onActionItemsClick();
    }
  };

  const handleMeetingsClick = () => {
    if (typeof onMeetingsClick === "function") {
      onMeetingsClick();
    }
  };

  const statusClass = `client-monthly-summary-card__status-pill status-${
    statusKey || "pre-boarding"
  }`;

  return (
    <div className="client-monthly-summary-card">
      <div className="client-monthly-summary-card__header">
        <div>
          <p className="client-monthly-summary-card__label">Monthly Summary</p>
          <h3 className="client-monthly-summary-card__title">
            {monthLabel || "—"}
          </h3>
        </div>
        {statusLabel && <span className={statusClass}>{statusLabel}</span>}
      </div>

      <div className="client-monthly-summary-card__body">
        <div className="client-monthly-summary-card__gauge">
          <svg viewBox="0 0 120 120">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <circle
              className="client-monthly-summary-card__gauge-track"
              cx="60"
              cy="60"
              r={gaugeRadius}
              strokeWidth="10"
            />
            <circle
              className="client-monthly-summary-card__gauge-progress"
              cx="60"
              cy="60"
              r={gaugeRadius}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
            <text
              x="60"
              y="56"
              className="client-monthly-summary-card__gauge-value"
            >
              {completionRate}%
            </text>
            <text
              x="60"
              y="72"
              className="client-monthly-summary-card__gauge-subtitle"
            >
              Completion
            </text>
          </svg>
          <div className="client-monthly-summary-card__gauge-caption">
            <span className="client-monthly-summary-card__gauge-caption-label">
              Latest Activity
            </span>
            <p className="client-monthly-summary-card__gauge-caption-value">
              {actionItems?.completed ?? 0} of {actionItems?.total ?? 0} closed
            </p>
          </div>
        </div>

        <div className="client-monthly-summary-card__metrics">
          <div className="client-monthly-summary-card__metric-panel client-monthly-summary-card__metric-panel--actions">
            <div className="client-monthly-summary-card__metric-panel-header">
              <AssignmentIcon className="client-monthly-summary-card__metric-icon" />
              <div>
                <p className="client-monthly-summary-card__metric-label">
                  Action items
                </p>
                <span className="client-monthly-summary-card__metric-total">
                  {actionItems?.total ?? 0} tracked
                </span>
              </div>
            </div>
            <div className="client-monthly-summary-card__status-grid">
              <div className="client-monthly-summary-card__status-chip status-open">
                <span>Open</span>
                <strong>{actionItems?.open ?? 0}</strong>
              </div>
              <div className="client-monthly-summary-card__status-chip status-progress">
                <span>In progress</span>
                <strong>{actionItems?.inProgress ?? 0}</strong>
              </div>
              <div className="client-monthly-summary-card__status-chip status-done">
                <span>Done</span>
                <strong>{actionItems?.completed ?? 0}</strong>
              </div>
            </div>
            <div className="client-monthly-summary-card__overdue-banner">
              <WarningAmberIcon className="client-monthly-summary-card__overdue-icon" />
              <div>
                <p className="client-monthly-summary-card__overdue-label">
                  {actionItems?.overdue ?? 0} overdue
                </p>
                <span>
                  Resolve overdue items to keep the plan on track
                </span>
              </div>
            </div>
          </div>

          <div className="client-monthly-summary-card__metric-panel client-monthly-summary-card__metric-panel--meetings">
            <div className="client-monthly-summary-card__metric-panel-header">
              <CalendarMonthIcon className="client-monthly-summary-card__metric-icon" />
              <div>
                <p className="client-monthly-summary-card__metric-label">
                  Meetings
                </p>
                <span className="client-monthly-summary-card__metric-total">
                  {meetings?.thisMonth ?? 0} this month
                </span>
              </div>
            </div>
            <div className="client-monthly-summary-card__meeting-trend">
              <div className="client-monthly-summary-card__trend-overview">
                <TrendingUpIcon
                  className={`client-monthly-summary-card__trend-icon ${
                    trendNeutral
                      ? "neutral"
                      : trendPositive
                      ? "up"
                      : "down"
                  }`}
                />
                <div>
                  <p className="client-monthly-summary-card__trend-value">
                    {trendNeutral
                      ? "No change"
                      : `${meetingTrend > 0 ? "+" : ""}${meetingTrend}`}
                  </p>
                  <span className="client-monthly-summary-card__trend-label">
                    vs last month ({meetings?.lastMonth ?? 0})
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="client-monthly-summary-card__link-btn"
                onClick={handleMeetingsClick}
              >
                Review meetings
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="client-monthly-summary-card__footer">
        <button
          type="button"
          className="client-monthly-summary-card__primary-btn"
          onClick={handleActionClick}
        >
          Go to action items
        </button>
        <button
          type="button"
          className="client-monthly-summary-card__secondary-btn"
          onClick={handleMeetingsClick}
        >
          View meetings
        </button>
      </div>
    </div>
  );
};

export default MonthlySummaryCueCard;



