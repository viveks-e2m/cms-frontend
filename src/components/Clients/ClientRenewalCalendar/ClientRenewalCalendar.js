import React from "react";
import PropTypes from "prop-types";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./ClientRenewalCalendar.css";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

const ClientRenewalCalendar = ({ events, onSelectEvent }) => {
  const hasEvents = events && events.length > 0;

  // Debug logging
  React.useEffect(() => {
    console.log('[Calendar Component] Received events:', {
      count: events?.length || 0,
      events: events,
      hasEvents: hasEvents
    });
  }, [events, hasEvents]);

  const eventPropGetter = React.useCallback((event) => {
    if (!event) return {};

    return {
      className: [
        "renewal-calendar-event",
        event.isOverdue ? "renewal-calendar-event-overdue" : "renewal-calendar-event-upcoming",
      ].join(" "),
    };
  }, []);

  const handleSelectEvent = React.useCallback(
    (event) => {
      if (event?.clientId) {
        onSelectEvent?.(event);
      }
    },
    [onSelectEvent]
  );

  return (
    <div className="client-renewal-calendar">
      <div className="calendar-info-bar">
        <div className="calendar-legend">
          <div className="legend-item">
            <span className="legend-dot legend-dot-overdue" />
            <span>Overdue renewal</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot legend-dot-upcoming" />
            <span>Upcoming renewal</span>
          </div>
        </div>
      </div>

      <Calendar
        localizer={localizer}
        events={events || []}
        startAccessor="start"
        endAccessor="end"
        views={["month"]}
        defaultView="month"
        components={{}}
        popup
        selectable={false}
        toolbar
        step={60}
        showMultiDayTimes={false}
        eventPropGetter={eventPropGetter}
        onSelectEvent={handleSelectEvent}
        className="renewal-calendar-instance"
      />
      
      {!hasEvents && (
        <div className="renewal-calendar-empty-message">
          <p>No upcoming renewals yet. Add next renewal dates to clients to see them here.</p>
        </div>
      )}
    </div>
  );
};

ClientRenewalCalendar.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      start: PropTypes.instanceOf(Date).isRequired,
      end: PropTypes.instanceOf(Date).isRequired,
      isOverdue: PropTypes.bool,
      clientId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ),
  onSelectEvent: PropTypes.func,
};

ClientRenewalCalendar.defaultProps = {
  events: [],
  onSelectEvent: undefined,
};

export default ClientRenewalCalendar;

