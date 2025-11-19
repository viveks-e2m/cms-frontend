import React from "react";
import {
  VideoCall as VideoCallIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import "./MeetingsDirectory.css";

const formatDate = (dateString) => {
  if (!dateString) {
    return "Not available";
  }
  try {
    return new Date(dateString).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return dateString;
  }
};

const MeetingCard = ({ meeting }) => (
  <article className="meeting-card">
    <header className="meeting-card__header">
      <div className="meeting-card__icon">
        <VideoCallIcon />
      </div>
      <div className="meeting-card__titles">
        <h3>{meeting.meeting_name || `Meeting #${meeting.id?.slice(-8) || "N/A"}`}</h3>
        <p>{meeting.client_name || "Unknown client"}</p>
      </div>
      {meeting.source && (
        <span className="meeting-card__source">{meeting.source}</span>
      )}
    </header>

    {meeting.summary && (
      <p className="meeting-card__summary">
        {meeting.summary.length > 200
          ? `${meeting.summary.slice(0, 200)}...`
          : meeting.summary}
      </p>
    )}

    <footer className="meeting-card__footer">
      <div className="meeting-card__meta">
        <CalendarIcon />
        <span>{formatDate(meeting.created_at)}</span>
      </div>
      <div className="meeting-card__meta">
        <BusinessIcon />
        <span>{meeting.client_name || "Unassigned"}</span>
      </div>
    </footer>
  </article>
);

const MeetingsTable = ({ meetings }) => (
  <div className="meetings-table-wrapper">
    <table className="meetings-table">
      <thead>
        <tr>
          <th>Meeting</th>
          <th>Client</th>
          <th>Source</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {meetings.map((meeting) => (
          <tr key={meeting.id}>
            <td>
              <div className="table-meeting-title">
                <VideoCallIcon />
                <span>
                  {meeting.meeting_name ||
                    meeting.title ||
                    `Meeting #${meeting.id?.slice(-8) || "N/A"}`}
                </span>
              </div>
            </td>
            <td>{meeting.client_name || "Unknown client"}</td>
            <td className="table-source">{meeting.source || "—"}</td>
            <td>{formatDate(meeting.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const MeetingsDirectory = ({ meetings = [], viewMode = "card", isFetching = false }) => {
  if (!meetings.length && !isFetching) {
    return (
      <div className="meetings-directory-empty">
        <VideoCallIcon />
        <h3>No meetings available</h3>
        <p>Meetings you have access to will appear here.</p>
      </div>
    );
  }

  return (
    <section className="meetings-directory">
      {viewMode === "card" ? (
        <div className="meetings-directory-grid">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      ) : (
        <MeetingsTable meetings={meetings} />
      )}
    </section>
  );
};

export default MeetingsDirectory;





