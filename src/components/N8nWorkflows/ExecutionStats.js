import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  TrendingUp as TrendIcon,
} from '@mui/icons-material';

const ExecutionStats = ({ executions = [] }) => {
  const stats = React.useMemo(() => {
    const total = executions.length;
    const success = executions.filter(e => e.status === 'success').length;
    const error = executions.filter(e => e.status === 'error' || e.status === 'failed').length;
    const running = executions.filter(e => e.status === 'running' || e.status === 'waiting').length;
    const successRate = total > 0 ? ((success / total) * 100).toFixed(1) : 0;

    return { total, success, error, running, successRate };
  }, [executions]);

  const statItems = [
    {
      label: 'Total Executions',
      value: stats.total,
      icon: <TrendIcon />,
      color: 'primary',
    },
    {
      label: 'Successful',
      value: stats.success,
      icon: <SuccessIcon />,
      color: 'success',
    },
    {
      label: 'Failed',
      value: stats.error,
      icon: <ErrorIcon />,
      color: 'error',
    },
    {
      label: 'Running',
      value: stats.running,
      icon: <PendingIcon />,
      color: 'warning',
    },
  ];

  return (
    <Card className="execution-stats-card">
      <CardContent>
        <Typography variant="h6" className="stats-title">
          Execution Statistics
        </Typography>
        
        <Grid container spacing={2}>
          {statItems.map((item, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <Box className="stat-item">
                <Box className="stat-icon" style={{ color: `var(--mui-palette-${item.color}-main)` }}>
                  {item.icon}
                </Box>
                <Typography variant="h4" className="stat-value">
                  {item.value}
                </Typography>
                <Typography variant="body2" className="stat-label">
                  {item.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {stats.total > 0 && (
          <Box className="success-rate">
            <Typography variant="body2" className="success-rate-label">
              Success Rate
            </Typography>
            <Chip
              label={`${stats.successRate}%`}
              color={stats.successRate >= 80 ? 'success' : stats.successRate >= 60 ? 'warning' : 'error'}
              size="small"
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ExecutionStats;