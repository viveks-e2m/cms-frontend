import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNotificationContext } from "../../contexts/NotificationContext";
import {
  useClientStats,
  useMeetingStats,
  useActionItemStats,
  useClients,
} from "../../hooks/useQueries";
import DashboardLayout from "../../components/Layout/DashboardLayout/DashboardLayout";
import DashboardSkeleton from "../../components/Dashboard/DashboardSkeleton";
import { PermissionGuard } from "../../components/PermissionGuard";
import { PERMISSIONS } from "../../constants/permissions";
import {
  People as PeopleIcon,
  VideoCall as VideoCallIcon,
  Assignment as AssignmentIcon,
  WavingHand as WavingHandIcon,
  CalendarMonth as CalendarMonthIcon,
} from "@mui/icons-material";
import ClientRenewalCalendar from "../../components/Clients/ClientRenewalCalendar/ClientRenewalCalendar";
import ProjectedRenewalsChart from "../../components/Dashboard/ProjectedRenewalsChart";
import AccountManagerRenewalsChart from "../../components/Dashboard/AccountManagerRenewalsChart";
import "./DashboardPage.css";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError } = useNotificationContext();

  const {
    data: allClientsData,
    isLoading: loadingAllClients,
    error: allClientsError,
  } = useClients();

  // Use cached queries
  const {
    data: clientStats,
    isLoading: loadingClientStats,
    error: clientStatsError,
  } = useClientStats();

  const {
    data: meetingStats,
    isLoading: loadingMeetingStats,
    error: meetingStatsError,
  } = useMeetingStats();

  const {
    data: openPointsStats,
    isLoading: loadingActionItemStats,
    error: actionItemStatsError,
  } = useActionItemStats();

  const loading =
    loadingClientStats ||
    loadingMeetingStats ||
    loadingActionItemStats ||
    loadingAllClients;

  // Handle errors
  React.useEffect(() => {
    if (
      clientStatsError ||
      meetingStatsError ||
      actionItemStatsError ||
      allClientsError
    ) {
      showError("Failed to load dashboard data. Please try again.");
    }
  }, [
    clientStatsError,
    meetingStatsError,
    actionItemStatsError,
    allClientsError,
    showError,
  ]);

  // Prepare dashboard data
  const dashboardData = React.useMemo(() => {
    const stats = clientStats || {};
    const meetings = meetingStats || {};
    const actionItems = openPointsStats || {};

    // Calculate total excluding inactive clients
    const inactiveCount = stats.inactive_clients || 0;
    const totalWithInactive = stats.total_clients || 0;
    const totalClientsExcludingInactive = Math.max(0, totalWithInactive - inactiveCount);

    return {
      recentMeetings: [],
      clientStats: {
        total_clients: totalClientsExcludingInactive,
        active_clients: stats.active_clients || 0,
        pre_boarding_clients: stats.pre_boarding_clients || 0,
        onboarding_clients: stats.onboarding_clients || 0,
        assessment_clients: stats.assessment_clients || 0,
        paused_clients: stats.paused_clients || 0,
        inactive_clients: stats.inactive_clients || 0,
      },
      actionItemStats: {
        total_open_points: actionItems.total_open_points || 0,
        in_progress_tasks: actionItems.in_progress_tasks || 0,
        completed_tasks: actionItems.completed_tasks || 0,
        total_tasks: actionItems.total_tasks || 0,
        completion_rate: actionItems.completion_rate || 0,
        due_today: actionItems.due_today || 0,
        due_next_7_days: actionItems.due_next_7_days || 0,
      },
      meetingStats: {
        total_meetings: meetings.total_meetings || 0,
        this_month: meetings.this_month || 0,
        last_month: meetings.last_month || 0,
        this_week: meetings.this_week || 0,
        last_week: meetings.last_week || 0,
      },
    };
  }, [clientStats, meetingStats, openPointsStats]);

  const getUserDisplayName = () => {
    return user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.name || user?.email?.split("@")[0] || "User";
  };

  const clientsForCalendar = React.useMemo(() => {
    if (!Array.isArray(allClientsData)) {
      console.log('[Calendar] allClientsData is not an array:', typeof allClientsData, allClientsData);
      return [];
    }
    console.log(`[Calendar] Processing ${allClientsData.length} clients for calendar`);
    // Log clients with renewal dates
    const clientsWithRenewals = allClientsData.filter(c => c.next_renewal_date);
    console.log(`[Calendar] Clients with renewal dates: ${clientsWithRenewals.length}`, 
      clientsWithRenewals.map(c => ({
        id: c.id,
        name: c.name,
        next_renewal_date: c.next_renewal_date
      }))
    );
    return allClientsData;
  }, [allClientsData]);

  const renewalEvents = React.useMemo(() => {
    if (!clientsForCalendar.length) {
      console.log('[Calendar] No clients available for calendar');
      return [];
    }

    // Get today's date in local timezone, normalized to midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = clientsForCalendar
      .filter((client) => {
        const hasDate = Boolean(client.next_renewal_date);
        if (!hasDate) {
          console.log(`[Calendar] Client ${client.id} (${client.name}) has no next_renewal_date`);
        }
        return hasDate;
      })
      .map((client) => {
        try {
          // Handle different date formats from the API
          let renewalDate;
          const dateValue = client.next_renewal_date;
          
          console.log(`[Calendar] Processing date for client ${client.id}:`, {
            raw: dateValue,
            type: typeof dateValue
          });

          // If it's already a Date object, use it
          if (dateValue instanceof Date) {
            renewalDate = new Date(dateValue);
          } 
          // If it's a string, parse it
          else if (typeof dateValue === 'string') {
            // Handle PostgreSQL timestamp format: "2025-11-20 00:00:00+00"
            // Replace space before timezone with 'T' for ISO format
            const isoString = dateValue.replace(' ', 'T');
            renewalDate = new Date(isoString);
          } 
          else {
            renewalDate = new Date(dateValue);
          }
          
          if (Number.isNaN(renewalDate.getTime())) {
            console.warn(`[Calendar] Invalid date for client ${client.id}:`, {
              raw: dateValue,
              parsed: renewalDate
            });
            return null;
          }

          // Create a new date object and normalize to local midnight
          // This ensures we're comparing dates, not times
          const normalizedDate = new Date(
            renewalDate.getFullYear(),
            renewalDate.getMonth(),
            renewalDate.getDate()
          );

          // Compare dates (not times) for overdue check
          const isOverdue = normalizedDate < today;

          const event = {
            id: `renewal-${client.id}`,
            title: client.name || client.company || "Unnamed Client",
            start: normalizedDate,
            end: normalizedDate,
            allDay: true,
            isOverdue: isOverdue,
            clientId: client.id,
            company: client.company,
          };
          
          console.log(`[Calendar] Created event for client ${client.id}:`, {
            name: event.title,
            rawDate: dateValue,
            parsedDate: renewalDate.toISOString(),
            normalizedDate: normalizedDate.toISOString(),
            localDate: normalizedDate.toLocaleDateString(),
            today: today.toLocaleDateString(),
            isOverdue: event.isOverdue,
          });
          
          return event;
        } catch (error) {
          console.error(`[Calendar] Error parsing date for client ${client.id}:`, error, {
            dateValue: client.next_renewal_date
          });
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);
    
    console.log(`[Calendar] Total renewal events: ${events.length}`, events);
    return events;
  }, [clientsForCalendar]);

  const overdueRenewalCount = React.useMemo(
    () => renewalEvents.filter((event) => event.isOverdue).length,
    [renewalEvents]
  );

  // Navigation handlers
  const formatStatusForClientsPage = (value) => {
    if (!value || typeof value !== "string") return "";
    return value.replace(/_/g, "-").toLowerCase();
  };

  const handleClientStatClick = (status) => {
    if (status === 'total') {
      navigate('/clients');
    } else {
      const formattedStatus = formatStatusForClientsPage(status);
      navigate(`/clients?status=${formattedStatus}`);
    }
  };

  const handleActionItemStatClick = (status) => {
    if (status === 'total') {
      navigate('/action-items');
    } else {
      navigate(`/action-items?status=${status}`);
    }
  };

  const handleActionItemsDueShortcut = (preset) => {
    const params = new URLSearchParams();
    params.set("due_preset", preset);
    navigate(`/action-items?${params.toString()}`);
  };

  const handleClientClick = (clientId) => {
    navigate(`/clients?clientId=${clientId}`);
  };

  const handleMeetingStatClick = (range) => {
    if (range && range !== "all") {
      navigate(`/meetings?range=${range}`);
    } else {
      navigate("/meetings");
    }
  };

  const handleRenewalSelect = (event) => {
    if (event?.clientId) {
      handleClientClick(event.clientId);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="dashboard-page">
        {/* Welcome Section */}
        <div className="dashboard-header">
          <div className="welcome-section">
            <div className="welcome-icon-wrapper">
              <WavingHandIcon className="welcome-icon" />
            </div>
            <div className="welcome-content">
              <h1 className="welcome-title">
                Welcome back, <span className="welcome-name">{getUserDisplayName()}</span>
              </h1>
              <p className="welcome-subtitle">
                Here's what's happening with your CMS today
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards - Compact Design */}
        <div className="metrics-grid-compact">
          {/* Clients Card - Enhanced with breakdown */}
          <PermissionGuard permissions={[PERMISSIONS.READ_CLIENT]}>
            <div className="metric-card-enhanced metric-card-clients">
              <div className="metric-card-header-compact metric-card-header-clickable" onClick={() => handleClientStatClick('total')}>
                <div className="metric-icon-wrapper-compact metric-icon-clients">
                  <PeopleIcon className="metric-icon" />
                </div>
                <div className="metric-header-content-compact">
                  <h3 className="metric-title-compact">Active Clients</h3>
                  <div className="metric-value-compact">{dashboardData.clientStats.total_clients}</div>
                </div>
              </div>
              <div className="metric-breakdown">
                <div className="breakdown-item breakdown-item-clickable" onClick={() => handleClientStatClick('pre_boarding')}>
                  <span className="breakdown-label">Pre-boarding</span>
                  <span className="breakdown-value breakdown-warning">{dashboardData.clientStats.pre_boarding_clients}</span>
                </div>
                <div className="breakdown-item breakdown-item-clickable" onClick={() => handleClientStatClick('onboarding')}>
                  <span className="breakdown-label">Onboarding</span>
                  <span className="breakdown-value breakdown-info">{dashboardData.clientStats.onboarding_clients}</span>
                </div>
                <div className="breakdown-item breakdown-item-clickable" onClick={() => handleClientStatClick('assessment')}>
                  <span className="breakdown-label">Assessment</span>
                  <span className="breakdown-value breakdown-secondary">{dashboardData.clientStats.assessment_clients}</span>
                </div>
                <div className="breakdown-item breakdown-item-clickable" onClick={() => handleClientStatClick('active')}>
                  <span className="breakdown-label">Execution</span>
                  <span className="breakdown-value breakdown-success">{dashboardData.clientStats.active_clients}</span>
                </div>
                <div className="breakdown-item breakdown-item-clickable" onClick={() => handleClientStatClick('paused')}>
                  <span className="breakdown-label">Paused</span>
                  <span className="breakdown-value breakdown-muted">{dashboardData.clientStats.paused_clients}</span>
                </div>
                <div className="breakdown-item breakdown-item-clickable" onClick={() => handleClientStatClick('inactive')}>
                  <span className="breakdown-label">Inactive</span>
                  <span className="breakdown-value breakdown-secondary">{dashboardData.clientStats.inactive_clients}</span>
                </div>
              </div>
            </div>
          </PermissionGuard>

          {/* Action Items Card - Enhanced with breakdown */}
          <PermissionGuard permissions={[PERMISSIONS.READ_TASK]}>
            <div className="metric-card-enhanced metric-card-tasks">
              <div className="metric-card-header-compact metric-card-header-clickable" onClick={() => handleActionItemStatClick('total')}>
                <div className="metric-icon-wrapper-compact metric-icon-tasks">
                  <AssignmentIcon className="metric-icon" />
                </div>
                <div className="metric-header-content-compact">
                  <h3 className="metric-title-compact">Action Items</h3>
                  <div className="metric-value-compact">{dashboardData.actionItemStats.total_tasks}</div>
                </div>
              </div>
              <div className="metric-breakdown">
                <div className="breakdown-item breakdown-item-clickable" onClick={() => handleActionItemStatClick('open')}>
                  <span className="breakdown-label">To Do</span>
                  <span className="breakdown-value breakdown-danger">{dashboardData.actionItemStats.total_open_points}</span>
                </div>
                <div className="breakdown-item breakdown-item-clickable" onClick={() => handleActionItemStatClick('in_progress')}>
                  <span className="breakdown-label">In Progress</span>
                  <span className="breakdown-value breakdown-warning">{dashboardData.actionItemStats.in_progress_tasks}</span>
                </div>
                <div className="breakdown-item breakdown-item-clickable" onClick={() => handleActionItemStatClick('completed')}>
                  <span className="breakdown-label">Completed</span>
                  <span className="breakdown-value breakdown-success">{dashboardData.actionItemStats.completed_tasks}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Completion Rate</span>
                  <span className="breakdown-value breakdown-success">{dashboardData.actionItemStats.completion_rate}%</span>
                </div>
                <div className="breakdown-item breakdown-item-clickable" onClick={() => handleActionItemsDueShortcut('today')}>
                  <span className="breakdown-label">Due Today</span>
                  <span className="breakdown-value breakdown-danger">{dashboardData.actionItemStats.due_today}</span>
                </div>
                <div className="breakdown-item breakdown-item-clickable" onClick={() => handleActionItemsDueShortcut('next7')}>
                  <span className="breakdown-label">Due Next 7 Days</span>
                  <span className="breakdown-value breakdown-muted">{dashboardData.actionItemStats.due_next_7_days}</span>
                </div>
              </div>
            </div>
          </PermissionGuard>

          {/* Meetings Card - Enhanced with breakdown */}
          <PermissionGuard permissions={[PERMISSIONS.READ_MEETING]}>
            <div className="metric-card-enhanced metric-card-meetings">
              <div
                className="metric-card-header-compact metric-card-header-clickable"
                onClick={() => handleMeetingStatClick("all")}
              >
                <div className="metric-icon-wrapper-compact metric-icon-meetings">
                  <VideoCallIcon className="metric-icon" />
                </div>
                <div className="metric-header-content-compact">
                  <h3 className="metric-title-compact">Meetings</h3>
                  <div className="metric-value-compact">{dashboardData.meetingStats.total_meetings}</div>
                </div>
              </div>
              <div className="metric-breakdown">
                <div
                  className="breakdown-item breakdown-item-clickable"
                  onClick={() => handleMeetingStatClick("this_month")}
                >
                  <span className="breakdown-label">This Month</span>
                  <span className="breakdown-value breakdown-info">{dashboardData.meetingStats.this_month}</span>
                </div>
                <div
                  className="breakdown-item breakdown-item-clickable"
                  onClick={() => handleMeetingStatClick("last_month")}
                >
                  <span className="breakdown-label">Last Month</span>
                  <span className="breakdown-value breakdown-secondary">{dashboardData.meetingStats.last_month}</span>
                </div>
                <div
                  className="breakdown-item breakdown-item-clickable"
                  onClick={() => handleMeetingStatClick("this_week")}
                >
                  <span className="breakdown-label">This Week</span>
                  <span className="breakdown-value breakdown-success">{dashboardData.meetingStats.this_week}</span>
                </div>
                <div
                  className="breakdown-item breakdown-item-clickable"
                  onClick={() => handleMeetingStatClick("last_week")}
                >
                  <span className="breakdown-label">Last Week</span>
                  <span className="breakdown-value breakdown-warning">{dashboardData.meetingStats.last_week}</span>
                </div>
              </div>
            </div>
          </PermissionGuard>

          {/* Projected Renewals Chart - First column in new row */}
          <PermissionGuard permissions={[PERMISSIONS.READ_CLIENT]}>
            <ProjectedRenewalsChart clients={allClientsData || []} />
          </PermissionGuard>

          {/* Account Manager Renewals Chart - Spans 2 columns */}
          <PermissionGuard permissions={[PERMISSIONS.READ_ALL_CLIENTS]}>
            <AccountManagerRenewalsChart clients={allClientsData || []} />
          </PermissionGuard>
        </div>

        <PermissionGuard
          permissions={[PERMISSIONS.READ_CLIENT]}
          fallback={
            <div className="dashboard-section">
              <div className="access-denied-message">
                <p>You don't have permission to view client information.</p>
              </div>
            </div>
          }
        >
          <div className="dashboard-section calendar-section">
            <div className="section-header-modern">
              <div className="section-header-content">
                <CalendarMonthIcon className="section-title-icon" />
                <h3 className="section-title-modern">Client Renewal Calendar</h3>
              </div>
              <div className="calendar-overdue-pill">
                {overdueRenewalCount} overdue
              </div>
            </div>
            <div className="section-content-modern calendar-section-content">
              <ClientRenewalCalendar
                events={renewalEvents}
                onSelectEvent={handleRenewalSelect}
              />
            </div>
          </div>
        </PermissionGuard>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
