import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import {
  AccountTree as WorkflowIcon,
  PlayArrow as ExecutionIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import './EmptyState.css';

export const WorkflowsEmptyState = ({ onRefresh, hasFilters, onClearFilters }) => {
  return (
    <Card className="empty-state-card">
      <CardContent className="empty-state-content">
        <Box className="empty-state-icon">
          <WorkflowIcon />
        </Box>
        <Typography variant="h6" className="empty-state-title">
          {hasFilters ? 'No workflows match your filters' : 'No workflows found'}
        </Typography>
        <Typography variant="body2" className="empty-state-description">
          {hasFilters 
            ? 'Try adjusting your search criteria or clearing filters to see more workflows.'
            : 'It looks like there are no n8n workflows available at the moment. Try refreshing to check for updates.'
          }
        </Typography>
        <Box className="empty-state-actions">
          {hasFilters ? (
            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={onClearFilters}
              className="empty-state-button"
            >
              Clear Filters
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={onRefresh}
              className="empty-state-button"
            >
              Refresh Data
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export const ExecutionsEmptyState = ({ onRefresh, hasFilters, onClearFilters }) => {
  return (
    <Card className="empty-state-card">
      <CardContent className="empty-state-content">
        <Box className="empty-state-icon">
          <ExecutionIcon />
        </Box>
        <Typography variant="h6" className="empty-state-title">
          {hasFilters ? 'No executions match your filters' : 'No recent executions'}
        </Typography>
        <Typography variant="body2" className="empty-state-description">
          {hasFilters 
            ? 'Try adjusting your execution status filter to see more results.'
            : 'There are no recent workflow executions to display. Executions will appear here once workflows start running.'
          }
        </Typography>
        <Box className="empty-state-actions">
          {hasFilters ? (
            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={onClearFilters}
              className="empty-state-button"
            >
              Clear Filters
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={onRefresh}
              className="empty-state-button"
            >
              Refresh Data
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

const EmptyState = WorkflowsEmptyState;
export default EmptyState;