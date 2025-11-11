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
import { PermissionGuard } from '../../components/PermissionGuard';
import { PERMISSIONS } from '../../constants/permissions';
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
  const [dataSource, setDataSource] = useState('database'); // Track data source

  useEffect(() => {
    // Detect if this is a hard refresh (page reload)
    const isHardRefresh = window.performance.navigation.type === window.performance.navigation.TYPE_RELOAD ||
                         !window.history.state;
    
    loadData(isHardRefresh);
  }, []);

  const loadData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const [workflowsData, executionsData] = await Promise.all([
        n8nAPI.getWorkflows({ force_refresh: forceRefresh }),
        n8nAPI.getExecutions()
      ]);
      
      // Extract workflows data and source information
      const workflowsResult = workflowsData?.data || workflowsData || [];
      const workflowsList = workflowsResult.data || workflowsResult;
      const source = workflowsResult.source || (forceRefresh ? 'api' : 'database');
      
      setWorkflows(workflowsList);
      setExecutions(executionsData || []);
      setDataSource(source);
      
      // Show appropriate success message
      if (forceRefresh && workflowsResult.sync_stats) {
        const { new_workflows, updated_workflows, total_processed } = workflowsResult.sync_stats;
        showSuccess(`Workflows synced: ${new_workflows} new, ${updated_workflows} updated (${total_processed} total)`);
      } else if (source === 'database') {
        console.log('Workflows loaded from database cache');
      } else if (source === 'api_fallback') {
        showError('Database unavailable, showing live data from n8n API');
      }
      
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
      // Force refresh from API when user clicks refresh button
      await loadData(true);
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
      <PermissionGuard 
        permissions={[PERMISSIONS.READ_WORKFLOW]}
        fallback={
          <div className="n8n-workflows-page">
            <div className="access-denied-message">
              <p>You don't have permission to view n8n workflows.</p>
            </div>
          </div>
        }
      >
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
        </Box>

        {/* Coming Soon Message */}
        <Card className="coming-soon-card" style={{ marginTop: '2rem', textAlign: 'center', padding: '4rem 2rem' }}>
          <CardContent>
            <WorkflowIcon style={{ fontSize: '4rem', color: '#8B5CF6', marginBottom: '1rem' }} />
            <Typography variant="h4" style={{ marginBottom: '1rem', fontWeight: 600 }}>
              Coming Soon
            </Typography>
            <Typography variant="body1" color="textSecondary" style={{ maxWidth: '600px', margin: '0 auto' }}>
              The n8n Workflows feature is currently under development. We're working hard to bring you a comprehensive workflow management system that will help you automate and monitor your business processes.
            </Typography>
            <Chip 
              label="Under Development" 
              color="primary" 
              style={{ marginTop: '2rem' }}
            />
          </CardContent>
        </Card>

        {/* Commented out original functionality */}
        {/* <Box className="header-actions">
          <Tooltip title={refreshing ? "Syncing from n8n..." : "Sync from n8n API"}>
            <IconButton 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="refresh-btn"
            >
              <RefreshIcon className={refreshing ? 'spinning' : ''} />
            </IconButton>
          </Tooltip>
        </Box> */}

        {/* Filters */}
        {/* <Card className="filters-card">
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
        </Card> */}

        {/* Data Source Alert */}
        {/* {dataSource === 'database' && !loading && (
          <Alert severity="info" style={{ marginBottom: '1rem' }}>
            Showing cached workflow data. Click refresh to sync with n8n API for latest updates.
          </Alert>
        )} */}

        {/* Execution Statistics */}
        {/* {loading ? <StatsSkeleton /> : <ExecutionStats executions={executions} />} */}

        {/* <Grid container spacing={3}>
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
                  <Grid container spacing={2} className="workflows-grid">
                    {filteredWorkflows.map((workflow) => (
                      <Grid item xs={12} md={6} key={workflow.id}>
                        <Card 
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
                              {workflow.isArchived && (
                                <Chip
                                  label="Archived"
                                  color="warning"
                                  size="small"
                                  style={{ marginLeft: '0.5rem' }}
                                />
                              )}
                            </Box>
                          </Box>
                          
                          <Box className="workflow-stats" style={{ margin: '1rem 0' }}>
                            <Grid container spacing={1}>
                              <Grid item xs={6}>
                                <Box textAlign="center">
                                  <Typography variant="h6" color="primary" style={{ fontSize: '1.1rem' }}>
                                    {workflow.nodes?.length || 0}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    Nodes
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={6}>
                                <Box textAlign="center">
                                  <Typography variant="h6" color="primary" style={{ fontSize: '1.1rem' }}>
                                    {workflow.connections ? Object.keys(workflow.connections).length : 0}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    Connections
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={6}>
                                <Box textAlign="center">
                                  <Typography variant="h6" color="primary" style={{ fontSize: '1.1rem' }}>
                                    {workflow.nodes?.filter(node => node.credentials).length || 0}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    Credentials
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={6}>
                                <Box textAlign="center">
                                  <Typography variant="h6" color="primary" style={{ fontSize: '1.1rem' }}>
                                    {workflow.nodes?.filter(node => node.type?.includes('trigger')).length || 0}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    Triggers
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </Box>

                          {workflow.nodes && workflow.nodes.length > 0 && (
                            <Box className="node-types-summary" style={{ margin: '1rem 0' }}>
                              <Typography variant="body2" color="textSecondary" gutterBottom>
                                Node Types:
                              </Typography>
                              <Box display="flex" flexWrap="wrap" gap={0.5}>
                                {[...new Set(workflow.nodes.map(node => 
                                  node.type?.split('.').pop() || 'Unknown'
                                ))].slice(0, 5).map((nodeType, index) => (
                                  <Chip
                                    key={index}
                                    label={nodeType}
                                    size="small"
                                    variant="outlined"
                                    style={{ fontSize: '0.7rem' }}
                                  />
                                ))}
                                {[...new Set(workflow.nodes.map(node => 
                                  node.type?.split('.').pop() || 'Unknown'
                                ))].length > 5 && (
                                  <Chip
                                    label={`+${[...new Set(workflow.nodes.map(node => 
                                      node.type?.split('.').pop() || 'Unknown'
                                    ))].length - 5} more`}
                                    size="small"
                                    variant="outlined"
                                    style={{ fontSize: '0.7rem' }}
                                  />
                                )}
                              </Box>
                            </Box>
                          )}
                          
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
                            <Typography variant="caption" className="workflow-created">
                              Created: {workflow.createdAt ? 
                                new Date(workflow.createdAt).toLocaleDateString() : 
                                'Unknown'
                              }
                            </Typography>
                            <Typography variant="caption" className="workflow-updated">
                              Updated: {workflow.updatedAt ? 
                                new Date(workflow.updatedAt).toLocaleDateString() : 
                                'Unknown'
                              }
                            </Typography>
                          </Box>
                        </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid> */}
        </div>
      </PermissionGuard>
    </DashboardLayout>
  );
};

export default N8nWorkflowsPage;