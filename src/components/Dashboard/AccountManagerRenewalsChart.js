import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { Person as PersonIcon } from "@mui/icons-material";
import "./AccountManagerRenewalsChart.css";

const AccountManagerRenewalsChart = ({ clients = [] }) => {
  // Calculate renewals by account manager
  const chartData = useMemo(() => {
    if (!Array.isArray(clients) || clients.length === 0) {
      return [];
    }

    // Helper to get account manager name
    const getAccountManagerName = (client) => {
      // Check if account_manager is a name (string that's not a UUID)
      if (client?.account_manager && typeof client.account_manager === 'string') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(client.account_manager.trim())) {
          // It's a name, not an ID
          return client.account_manager.trim();
        }
      }
      
      // Try account_manager_name field
      if (client?.account_manager_name) {
        return client.account_manager_name;
      }
      
      // Fallback to "Unassigned"
      return "Unassigned";
    };

    // Group clients by account manager
    const managerGroups = {};
    
    clients.forEach((client) => {
      // Get account manager name
      const accountManager = getAccountManagerName(client);
      
      if (!managerGroups[accountManager]) {
        managerGroups[accountManager] = {
          name: accountManager,
          totalClients: 0,
          renewalsClients: 0,
          percentage: 0,
        };
      }
      
      managerGroups[accountManager].totalClients++;
      
      // Count clients with projected_renewals = true
      if (client.projected_renewals === true) {
        managerGroups[accountManager].renewalsClients++;
      }
    });

    // Calculate percentage for each manager
    const data = Object.values(managerGroups).map((manager) => {
      const percentage = manager.totalClients > 0
        ? Math.round((manager.renewalsClients / manager.totalClients) * 100)
        : 0;
      
      // Split name into first and last name for two-line display
      const nameParts = manager.name.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      const displayName = lastName ? `${firstName}\n${lastName}` : firstName;
      
      return {
        name: displayName,
        fullName: manager.name,
        percentage: percentage,
        renewalsClients: manager.renewalsClients,
        totalClients: manager.totalClients,
        color: getColorForPercentage(percentage),
      };
    });

    // Sort by percentage descending
    return data.sort((a, b) => b.percentage - a.percentage);
  }, [clients]);

  // Get color based on percentage (similar to the example image)
  function getColorForPercentage(percentage) {
    if (percentage >= 80) return "#f97316"; // Orange
    if (percentage >= 60) return "#ef4444"; // Red
    if (percentage >= 50) return "#f97316"; // Orange-red
    if (percentage >= 40) return "#a855f7"; // Purple
    return "#7c3aed"; // Dark purple
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="account-manager-tooltip">
          <div className="tooltip-header">{data.fullName}</div>
          <div className="tooltip-content">
            <div className="tooltip-item">
              <span className="tooltip-label">Renewals:</span>
              <span className="tooltip-value">{data.renewalsClients}</span>
            </div>
            <div className="tooltip-item">
              <span className="tooltip-label">Total Clients:</span>
              <span className="tooltip-value">{data.totalClients}</span>
            </div>
            <div className="tooltip-item">
              <span className="tooltip-label">Percentage:</span>
              <span className="tooltip-value">{data.percentage}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom label to show percentage on top of bars
  const CustomLabel = ({ x, y, width, value }) => {
    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill="#ffffff"
        textAnchor="middle"
        fontSize={12}
        fontWeight={600}
      >
        {value}%
      </text>
    );
  };

  // Custom tick to render two-line names
  const CustomTick = ({ x, y, payload }) => {
    const lines = payload.value.split('\n');
    return (
      <g transform={`translate(${x},${y})`}>
        {lines.map((line, index) => (
          <text
            key={index}
            x={0}
            y={0}
            dy={index * 12 + 3}
            textAnchor="middle"
            fill="#6b7280"
            fontSize={11}
            fontWeight={500}
          >
            {line}
          </text>
        ))}
      </g>
    );
  };

  // Custom Y-axis label to vertically center the "Percentage (%)" text
  const CustomYAxisLabel = ({ viewBox }) => {
    if (!viewBox) return null;
    // Calculate the vertical center of the Y-axis
    const centerY = viewBox.y + viewBox.height / 2;
    // Position the label close to the Y-axis, similar to X-axis label positioning
    const x = viewBox.x - 3; // Position close to the axis line
    
    return (
      <text
        x={x}
        y={centerY}
        fill="#6b7280"
        fontSize={11}
        fontWeight={500}
        textAnchor="middle"
        transform={`rotate(-90, ${x}, ${centerY})`}
      >
        Percentage (%)
      </text>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="account-manager-renewals-chart-container">
        <div className="account-manager-renewals-chart-header">
          <div className="chart-header-title">
            <PersonIcon className="chart-header-icon" />
            <h3 className="chart-title">Renewals by Account Manager</h3>
          </div>
        </div>
        <div className="chart-empty-state">
          <p>No account manager data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="account-manager-renewals-chart-container">
      <div className="account-manager-renewals-chart-header">
        <div className="chart-header-title">
          <PersonIcon className="chart-header-icon" />
          <h3 className="chart-title">Renewals by Account Manager</h3>
        </div>
      </div>
      
      <div className="account-manager-renewals-chart-content">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
            barCategoryGap="15%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              stroke="#6b7280"
              tickLine={{ stroke: "#6b7280" }}
              tick={<CustomTick />}
              height={40}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickLine={{ stroke: "#6b7280" }}
              domain={[0, 100]}
              label={<CustomYAxisLabel />}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="percentage"
              radius={[8, 8, 0, 0]}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <LabelList content={<CustomLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AccountManagerRenewalsChart;

