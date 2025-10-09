import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  AccountTree as WorkflowIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/Layout/DashboardLayout/DashboardLayout';
import LoadingSpinner from '../../components/UI/LoadingSpinner/LoadingSpinner';
import ExecutionStats from '../../components/N8nWorkflows/ExecutionStats';
import WorkflowSkeleton, { ExecutionSkeleton, StatsSkeleton } from '../../components/N8nWorkflows/WorkflowSkeleton';
import { WorkflowsEmptyState, ExecutionsEmptyState } from '../../components/N8nWorkflows/EmptyState';
import { n8nAPI } from '../../utils/apiServices';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { NOTIFICATION_MESSAGES } from '../../utils/notifications';
import './N8nWorkflowsPage.css';
import '../../components/N8nWorkflows/ExecutionStats.css';
import '../../components/N8nWorkflows/WorkflowSkeleton.css';
import '../../components/N8nWorkflows/EmptyState.css';

const N8nWorkflowsPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotificationContext();
  
  const [workflows, setWorkflows] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [workflowsData, executionsData] = await Promise.all([
        n8nAPI.getWorkflows(),
        n8nAPI.getExecutions()
      ]);
      
      setWorkflows(workflowsData?.data || workflowsData || []);
      setExecutions(executionsData || []);
    } catch (error) {
      console.error('Error loading n8n data:', error);
      showError(NOTIFICATION_MESSAGES.N8N_WORKFLOWS_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadData();
      showSuccess(NOTIFICATION_MESSAGES.DATA_REFRESHED);
    } catch (error) {
      showError(NOTIFICATION_MESSAGES.DATA_REFRESH_ERROR);
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setActiveFilter('all');
    setStatusFilter('all');
  };

  const hasWorkflowFilters = searchTerm || activeFilter !== 'all';
  const hasExecutionFilters = statusFilter !== 'all';

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
        return <SuccessIcon color="success" />;
      case 'error':
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'running':
      case 'waiting':
        return <PendingIcon color="warning" />;
      default:
        return <PendingIcon color="disabled" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
        return 'success';
      case 'error':
      case 'failed':
        return 'error';
      case 'running':
      case 'waiting':
        return 'warning';
      default:
        return 'default';
    }
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActive = activeFilter === 'all' || 
                         (activeFilter === 'active' && workflow.active) ||
                         (activeFilter === 'inactive' && !workflow.active);
    return matchesSearch && matchesActive;
  });

  const filteredExecutions = executions.filter(execution => {
    const matchesStatus = statusFilter === 'all' || execution.status === statusFilter;
    return matchesStatus;
  }).slice(0, 10); // Show only recent 10 executions

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="n8n-workflows-page">
        {/* Header */}
        <Box className="page-header">
          <Box className="header-content">
            <WorkflowIcon className="page-icon" />
            <Box>
              <Typography variant="h4" className="page-title">
                n8n Workflows
              </Typography>
              <Typography variant="body2" className="page-subtitle">
                Manage and monitor your automation workflows
              </Typography>
            </Box>
          </Box>
          <Box className="header-actions">
            <Tooltip title="Refresh Data">
              <IconButton 
                onClick={handleRefresh} 
                disabled={refreshing}
                className="refresh-btn"
              >
                <RefreshIcon className={refreshing ? 'spinning' : ''} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Filters */}
        <Card className="filters-card">
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search workflows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon className="search-icon" />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Workflow Status</InputLabel>
                  <Select
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                    label="Workflow Status"
                  >
                    <MenuItem value="all">All Workflows</MenuItem>
                    <MenuItem value="active">Active Only</MenuItem>
                    <MenuItem value="inactive">Inactive Only</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Execution Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Execution Status"
                  >
                    <MenuItem value="all">All Executions</MenuItem>
                    <MenuItem value="success">Success</MenuItem>
                    <MenuItem value="error">Error</MenuItem>
                    <MenuItem value="running">Running</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Execution Statistics */}
        {loading ? <StatsSkeleton /> : <ExecutionStats executions={executions} />}

        <Grid container spacing={3}>
          {/* Workflows Section */}
          <Grid item xs={12} lg={8}>
            <Card className="workflows-card">
              <CardContent>
                <Typography variant="h6" className="section-title">
                  Workflows ({filteredWorkflows.length})
                </Typography>
                
                {loading ? (
                  <WorkflowSkeleton count={5} />
                ) : filteredWorkflows.length === 0 ? (
                  <WorkflowsEmptyState 
                    onRefresh={handleRefresh}
                    hasFilters={hasWorkflowFilters}
                    onClearFilters={handleClearFilters}
                  />
                ) : (
                  <div className="workflows-list">
                    {filteredWorkflows.map((workflow) => (
                      <Card 
                        key={workflow.id} 
                        className="workflow-item"
                        onClick={() => navigate(`/n8n-workflows/${workflow.id}`)}
                      >
                        <CardContent>
                          <Box className="workflow-header">
                            <Box className="workflow-info">
                              <Typography variant="h6" className="workflow-name">
                                {workflow.name || 'Unnamed Workflow'}
                              </Typography>
                              <Typography variant="body2" className="workflow-id">
                                ID: {workflow.id}
                              </Typography>
                            </Box>
                            <Box className="workflow-status">
                              <Chip
                                label={workflow.active ? 'Active' : 'Inactive'}
                                color={workflow.active ? 'success' : 'default'}
                                size="small"
                              />
                            </Box>
                          </Box>
                          
                          {workflow.tags && workflow.tags.length > 0 && (
                            <Box className="workflow-tags">
                              {workflow.tags.map((tag, index) => (
                                <Chip
                                  key={index}
                                  label={tag.name}
                                  size="small"
                                  variant="outlined"
                                  className="tag-chip"
                                />
                              ))}
                            </Box>
                          )}
                          
                          <Box className="workflow-meta">
                            <Typography variant="caption" className="workflow-updated">
                              Updated: {workflow.updatedAt ? 
                                new Date(workflow.updatedAt).toLocaleDateString() : 
                                'Unknown'
                              }
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Executions Section */}
          <Grid item xs={12} lg={4}>
            <Card className="executions-card">
              <CardContent>
                <Typography variant="h6" className="section-title">
                  Recent Executions
                </Typography>
                
                {loading ? (
                  <ExecutionSkeleton count={5} />
                ) : filteredExecutions.length === 0 ? (
                  <ExecutionsEmptyState 
                    onRefresh={handleRefresh}
                    hasFilters={hasExecutionFilters}
                    onClearFilters={handleClearFilters}
                  />
                ) : (
                  <div className="executions-list">
                    {filteredExecutions.map((execution) => (
                      <Box key={execution.id} className="execution-item">
                        <Box className="execution-header">
                          {getStatusIcon(execution.status)}
                          <Box className="execution-info">
                            <Typography variant="body2" className="execution-workflow">
                              {execution.workflowData?.name || 'Unknown Workflow'}
                            </Typography>
                            <Typography variant="caption" className="execution-time">
                              {execution.startedAt ? 
                                new Date(execution.startedAt).toLocaleString() : 
                                'Unknown time'
                              }
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={execution.status || 'Unknown'}
                          color={getStatusColor(execution.status)}
                          size="small"
                        />
                      </Box>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </div>
    </DashboardLayout>
  );
};

export default N8nWorkflowsPage;