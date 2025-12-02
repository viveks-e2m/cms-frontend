import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { CalendarMonth as CalendarIcon } from "@mui/icons-material";
import "./StatisticsChart.css";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const StatisticsChart = ({ statistics = {} }) => {
  const [selectedYear, setSelectedYear] = useState(() => {
    const currentYear = new Date().getFullYear();
    return currentYear.toString();
  });

  // Transform action items data into chart format
  const actionItemsChartData = useMemo(() => {
    const actionItems = statistics?.action_items || {};
    const yearData = actionItems[selectedYear];
    
    if (!yearData || !yearData.months) {
      return [];
    }

    const data = [];

    // Create data points for all 12 months
    for (let month = 1; month <= 12; month++) {
      const monthKey = month.toString();
      const actionItemData = actionItems[selectedYear]?.months?.[monthKey] || {};

      data.push({
        month: MONTH_NAMES[month - 1],
        monthNumber: month,
        open: actionItemData.open || 0,
        inProgress: actionItemData.in_progress || 0,
        completed: actionItemData.completed || 0,
        overdue: actionItemData.overdue || 0,
        total:
          (actionItemData.open || 0) +
          (actionItemData.in_progress || 0) +
          (actionItemData.completed || 0),
      });
    }

    return data;
  }, [statistics, selectedYear]);

  // Transform meetings data into chart format
  const meetingsChartData = useMemo(() => {
    const meetings = statistics?.meetings || {};
    const yearData = meetings[selectedYear];
    
    if (!yearData || !yearData.months) {
      return [];
    }

    const data = [];

    // Create data points for all 12 months
    for (let month = 1; month <= 12; month++) {
      const monthKey = month.toString();
      const meetingData = meetings[selectedYear]?.months?.[monthKey] || {};

      data.push({
        month: MONTH_NAMES[month - 1],
        monthNumber: month,
        total: meetingData.total || 0,
      });
    }

    return data;
  }, [statistics, selectedYear]);

  // Get available years from statistics
  const availableYears = useMemo(() => {
    const years = new Set();
    
    // Get years from action items
    Object.keys(statistics?.action_items || {}).forEach((year) => {
      years.add(year);
    });
    
    // Get years from meetings
    Object.keys(statistics?.meetings || {}).forEach((year) => {
      years.add(year);
    });

    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [statistics]);

  // Custom tooltip for action items
  const ActionItemsTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="statistics-chart-tooltip">
          <div className="tooltip-header">
            {data.month} {selectedYear}
          </div>
          <div className="tooltip-content">
            {payload.map((entry, index) => (
              <div key={index} className="tooltip-item">
                <span
                  className="tooltip-dot"
                  style={{ backgroundColor: entry.color }}
                ></span>
                <span className="tooltip-label">{entry.name}:</span>
                <span className="tooltip-value">{entry.value}</span>
              </div>
            ))}
            <div className="tooltip-item tooltip-item-total">
              <span className="tooltip-label">Total:</span>
              <span className="tooltip-value">{data.total}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for meetings
  const MeetingsTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="statistics-chart-tooltip">
          <div className="tooltip-header">
            {data.month} {selectedYear}
          </div>
          <div className="tooltip-content">
            <div className="tooltip-item">
              <span
                className="tooltip-dot"
                style={{ backgroundColor: payload[0].color }}
              ></span>
              <span className="tooltip-label">Meetings:</span>
              <span className="tooltip-value">{data.total}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate max value for action items Y-axis
  const actionItemsMaxValue = useMemo(() => {
    const values = actionItemsChartData.flatMap((d) => [
      d.open,
      d.inProgress,
      d.completed,
      d.overdue,
      d.total,
    ]);
    const max = Math.max(...values, 0);
    return max > 0 ? Math.ceil(max / 10) * 10 : 10;
  }, [actionItemsChartData]);

  // Calculate max value for meetings Y-axis
  const meetingsMaxValue = useMemo(() => {
    const values = meetingsChartData.map((d) => d.total);
    const max = Math.max(...values, 0);
    return max > 0 ? Math.ceil(max / 10) * 10 : 10;
  }, [meetingsChartData]);

  if (!statistics || Object.keys(statistics).length === 0) {
    return (
      <Card className="statistics-chart-card">
        <CardContent>
          <Typography variant="body2" color="text.secondary" align="center">
            No statistics data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="statistics-charts-container">
      <div className="statistics-chart-header">
        <div>
          <Typography 
            variant="h6" 
            className="statistics-chart-title"
            sx={{
              fontWeight: 700,
              color: '#101828',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '4px',
            }}
          >
            Client Statistics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monthly trends for action items and meetings
          </Typography>
        </div>
        <FormControl size="small" className="year-selector">
          <InputLabel id="year-select-label">
            <CalendarIcon sx={{ fontSize: 18, mr: 0.5 }} />
            Year
          </InputLabel>
          <Select
            labelId="year-select-label"
            value={selectedYear}
            label="Year"
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {availableYears.length > 0 ? (
              availableYears.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))
            ) : (
              <MenuItem value={selectedYear}>{selectedYear}</MenuItem>
            )}
          </Select>
        </FormControl>
      </div>

      <div className="charts-grid">
        {/* Action Items Chart */}
        <div className="chart-cell">
          <Card 
            className="statistics-chart-card"
            sx={{
              boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
              borderRadius: '18px',
              border: '1px solid #e4e7ec',
              background: '#ffffff',
              '&:hover': {
                boxShadow: '0 20px 45px rgba(15, 23, 42, 0.12)',
                transform: 'translateY(-4px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <CardContent sx={{ padding: '1.75rem' }}>
              <div className="chart-header">
                <Typography 
                  variant="h6" 
                  className="chart-title"
                  sx={{
                    fontWeight: 700,
                    color: '#101828',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  Action Items
                </Typography>
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-dot legend-dot-open"></span>
                    <span className="legend-label">Open</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot legend-dot-in-progress"></span>
                    <span className="legend-label">In Progress</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot legend-dot-completed"></span>
                    <span className="legend-label">Completed</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot legend-dot-overdue"></span>
                    <span className="legend-label">Overdue</span>
                  </div>
                </div>
              </div>
              {actionItemsChartData.length === 0 || actionItemsChartData.every(d => d.total === 0) ? (
                <div className="chart-empty-message">
                  <Typography variant="body2" color="text.secondary" align="center">
                    No data to display
                  </Typography>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart
                    data={actionItemsChartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="month"
                      stroke="#666"
                      tick={{ fill: "#666", fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#666"
                      tick={{ fill: "#666", fontSize: 12 }}
                      domain={[0, actionItemsMaxValue]}
                    />
                    <Tooltip content={<ActionItemsTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="open"
                      name="Open"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ fill: "#6366f1", r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="inProgress"
                      name="In Progress"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: "#f59e0b", r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      name="Completed"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#10b981", r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="overdue"
                      name="Overdue"
                      stroke="#dc2626"
                      strokeWidth={2}
                      dot={{ fill: "#dc2626", r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Meetings Chart */}
        <div className="chart-cell">
          <Card 
            className="statistics-chart-card"
            sx={{
              boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
              borderRadius: '18px',
              border: '1px solid #e4e7ec',
              background: '#ffffff',
              '&:hover': {
                boxShadow: '0 20px 45px rgba(15, 23, 42, 0.12)',
                transform: 'translateY(-4px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <CardContent sx={{ padding: '1.75rem' }}>
              <div className="chart-header">
                <Typography 
                  variant="h6" 
                  className="chart-title"
                  sx={{
                    fontWeight: 700,
                    color: '#101828',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  Meetings
                </Typography>
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-dot legend-dot-meetings"></span>
                    <span className="legend-label">Total Meetings</span>
                  </div>
                </div>
              </div>
              {meetingsChartData.length === 0 || meetingsChartData.every(d => d.total === 0) ? (
                <div className="chart-empty-message">
                  <Typography variant="body2" color="text.secondary" align="center">
                    No data to display
                  </Typography>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart
                    data={meetingsChartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="month"
                      stroke="#666"
                      tick={{ fill: "#666", fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#666"
                      tick={{ fill: "#666", fontSize: 12 }}
                      domain={[0, meetingsMaxValue]}
                    />
                    <Tooltip content={<MeetingsTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Meetings"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StatisticsChart;

