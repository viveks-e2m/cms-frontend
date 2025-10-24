import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Grid,
} from '@mui/material';
import './WorkflowSkeleton.css';

const WorkflowSkeleton = ({ count = 3 }) => {
  return (
    <div className="workflow-skeleton-container">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="workflow-skeleton-item">
          <CardContent>
            <Box className="skeleton-header">
              <Box className="skeleton-info">
                <Skeleton 
                  variant="text" 
                  width="60%" 
                  height={28} 
                  className="skeleton-title"
                />
                <Skeleton 
                  variant="text" 
                  width="40%" 
                  height={20} 
                  className="skeleton-subtitle"
                />
              </Box>
              <Skeleton 
                variant="rectangular" 
                width={80} 
                height={24} 
                className="skeleton-chip"
              />
            </Box>
            
            <Box className="skeleton-tags">
              <Skeleton variant="rectangular" width={60} height={24} />
              <Skeleton variant="rectangular" width={80} height={24} />
              <Skeleton variant="rectangular" width={70} height={24} />
            </Box>
            
            <Box className="skeleton-meta">
              <Skeleton variant="text" width="30%" height={16} />
            </Box>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export const ExecutionSkeleton = ({ count = 5 }) => {
  return (
    <div className="execution-skeleton-container">
      {Array.from({ length: count }).map((_, index) => (
        <Box key={index} className="execution-skeleton-item">
          <Box className="execution-skeleton-header">
            <Skeleton variant="circular" width={24} height={24} />
            <Box className="execution-skeleton-info">
              <Skeleton variant="text" width="70%" height={20} />
              <Skeleton variant="text" width="50%" height={16} />
            </Box>
          </Box>
          <Skeleton variant="rectangular" width={60} height={24} />
        </Box>
      ))}
    </div>
  );
};

export const StatsSkeleton = () => {
  return (
    <Card className="stats-skeleton-card">
      <CardContent>
        <Skeleton variant="text" width="40%" height={32} className="stats-skeleton-title" />
        <Grid container spacing={2}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <Box className="stat-skeleton-item">
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="text" width="60%" height={32} />
                <Skeleton variant="text" width="80%" height={16} />
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default WorkflowSkeleton;