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
} from "recharts";
import { TrendingUp as TrendingUpIcon } from "@mui/icons-material";
import "./ProjectedRenewalsChart.css";

const ProjectedRenewalsChart = ({ clients = [] }) => {
  // Calculate projected renewals and churn counts
  const chartData = useMemo(() => {
    if (!Array.isArray(clients)) {
      return [
        { name: "Projected Renewals", value: 0, color: "#10b981" },
        { name: "Projected Churn", value: 0, color: "#ef4444" },
      ];
    }

    let projectedRenewals = 0;
    let projectedChurn = 0;

    clients.forEach((client) => {
      if (client.projected_renewals === true) {
        projectedRenewals++;
      } else {
        projectedChurn++;
      }
    });

    return [
      { name: "Projected Renewals", value: projectedRenewals, color: "#10b981" },
      { name: "Projected Churn", value: projectedChurn, color: "#ef4444" },
    ];
  }, [clients]);

  const totalClients = chartData[0].value + chartData[1].value;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalClients > 0 
        ? ((data.value / totalClients) * 100).toFixed(1) 
        : 0;
      
      return (
        <div className="projected-renewals-tooltip">
          <div className="tooltip-header">{data.name}</div>
          <div className="tooltip-content">
            <div className="tooltip-item">
              <span className="tooltip-label">Count:</span>
              <span className="tooltip-value">{data.value}</span>
            </div>
            <div className="tooltip-item">
              <span className="tooltip-label">Percentage:</span>
              <span className="tooltip-value">{percentage}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="projected-renewals-chart-container">
      <div className="projected-renewals-chart-header">
        <div className="chart-header-title">
          <TrendingUpIcon className="chart-header-icon renewals-icon" />
          <h3 className="chart-title">Projected Renewals</h3>
        </div>
      </div>
      
      <div className="chart-stats-summary">
        <div className="breakdown-item">
          <span className="breakdown-label">Renewals</span>
          <span className="breakdown-value breakdown-success">{chartData[0].value}</span>
        </div>
        <div className="breakdown-item">
          <span className="breakdown-label">Churn</span>
          <span className="breakdown-value breakdown-danger">{chartData[1].value}</span>
        </div>
      </div>
      
      <div className="projected-renewals-chart-content">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              stroke="#6b7280"
              tick={{ fill: "#6b7280", fontSize: 12, fontWeight: 500 }}
              tickLine={{ stroke: "#6b7280" }}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickLine={{ stroke: "#6b7280" }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              radius={[8, 8, 0, 0]}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProjectedRenewalsChart;

