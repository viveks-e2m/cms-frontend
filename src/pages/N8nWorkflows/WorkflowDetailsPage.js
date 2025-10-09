import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  AccountTree as WorkflowIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/Layout/DashboardLayout/DashboardLayout';
import LoadingSpinner from '../../components/UI/LoadingSpinner/LoadingSpinner';
import { n8nAPI } from '../../utils/apiServices';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { NOTIFICATION_MESSAGES } from '../../utils/notifications';
import './WorkflowDetailsPage.css';

const WorkflowDetailsPage = () => {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotificationContext();
  
  const [workflow, setWorkflow] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (workflowId) {
      loadWorkflowDetails();
    }
  }, [workflowId]);

  const loadWorkflowDetails = async () => {
    try {
      setLoading(true);
      
      // Get all workflows to find the specific one
      const workflowsData = await n8nAPI.getWorkflows();
      const workflows = workflowsData?.data || workflowsData || [];
      const foundWorkflow = workflows.find(w => w.id === workflowId);
      
      if (!foundWorkflow) {
        showError(NOTIFICATION_MESSAGES.WORKFLOW_NOT_FOUND);
        navigate('/n8n-workflows');
        return;
      }
      
      setWorkflow(foundWorkflow);
      
      // Get executions for this workflow
      const executionsData = await n8nAPI.getWorkflowExecutions(workflowId);
      setExecutions(executionsData || []);
      
    } catch (error) {
      console.error('Error loading workflow details:', error);
      showError(NOTIFICATION_MESSAGES.WORKFLOW_DETAILS_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadWorkflowDetails();
      showSuccess(NOTIFICATION_MESSAGES.WORKFLOW_DETAILS_REFRESHED);
    } catch (error) {
      showError(NOTIFICATION_MESSAGES.WORKFLOW_DETAILS_ERROR);
    } finally {
      setRefreshing(false);
    }
  };

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

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = end - start;
    
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${(duration / 60000).toFixed(1)}m`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  if (!workflow) {
    return (
      <DashboardLayout>
        <Alert severity="error">Workflow not found</Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="workflow-details-page">
        {/* Header */}
        <Box className="page-header">
          <Box className="header-content">
            <IconButton 
              onClick={() => navigate('/n8n-workflows')}
              className="back-btn"
            >
              <BackIcon />
            </IconButton>
            <WorkflowIcon className="page-icon" />
            <Box>
              <Typography variant="h4" className="page-title">
                {workflow.name || 'Unnamed Workflow'}
              </Typography>
              <Typography variant="body2" className="page-subtitle">
                Workflow ID: {workflow.id}
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

        <Grid container spacing={3}>
          {/* Workflow Information */}
          <Grid item xs={12} lg={4}>
            <Card className="workflow-info-card">
              <CardContent>
                <Typography variant="h6" className="section-title">
                  Workflow Information
                </Typography>
                
                <Box className="info-item">
                  <Typography variant="body2" className="info-label">
                    Status
                  </Typography>
                  <Chip
                    label={workflow.active ? 'Active' : 'Inactive'}
                    color={workflow.active ? 'success' : 'default'}
                    size="small"
                  />
                </Box>

                <Box className="info-item">
                  <Typography variant="body2" className="info-label">
                    Created
                  </Typography>
                  <Typography variant="body2" className="info-value">
                    {workflow.createdAt ? 
                      new Date(workflow.createdAt).toLocaleString() : 
                      'Unknown'
                    }
                  </Typography>
                </Box>

                <Box className="info-item">
                  <Typography variant="body2" className="info-label">
                    Last Updated
                  </Typography>
                  <Typography variant="body2" className="info-value">
                    {workflow.updatedAt ? 
                      new Date(workflow.updatedAt).toLocaleString() : 
                      'Unknown'
                    }
                  </Typography>
                </Box>

                {workflow.tags && workflow.tags.length > 0 && (
                  <Box className="info-item">
                    <Typography variant="body2" className="info-label">
                      Tags
                    </Typography>
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
                  </Box>
                )}

                {workflow.nodes && (
                  <Box className="info-item">
                    <Typography variant="body2" className="info-label">
                      Nodes
                    </Typography>
                    <Typography variant="body2" className="info-value">
                      {workflow.nodes.length} nodes
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Executions */}
          <Grid item xs={12} lg={8}>
            <Card className="executions-card">
              <CardContent>
                <Typography variant="h6" className="section-title">
                  Execution History ({executions.length})
                </Typography>
                
                {executions.length === 0 ? (
                  <Alert severity="info" className="no-data-alert">
                    No executions found for this workflow
                  </Alert>
                ) : (
                  <TableContainer component={Paper} className="executions-table">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Status</TableCell>
                          <TableCell>Started</TableCell>
                          <TableCell>Finished</TableCell>
                          <TableCell>Duration</TableCell>
                          <TableCell>Mode</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {executions.map((execution) => (
                          <TableRow key={execution.id} className="execution-row">
                            <TableCell>
                              <Box className="status-cell">
                                {getStatusIcon(execution.status)}
                                <Chip
                                  label={execution.status || 'Unknown'}
                                  color={getStatusColor(execution.status)}
                                  size="small"
                                />
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {execution.startedAt ? 
                                  new Date(execution.startedAt).toLocaleString() : 
                                  'N/A'
                                }
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {execution.stoppedAt ? 
                                  new Date(execution.stoppedAt).toLocaleString() : 
                                  execution.status === 'running' ? 'Running...' : 'N/A'
                                }
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box className="duration-cell">
                                <TimeIcon className="duration-icon" />
                                <Typography variant="body2">
                                  {formatDuration(execution.startedAt, execution.stoppedAt)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" className="execution-mode">
                                {execution.mode || 'manual'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </div>
    </DashboardLayout>
  );
};

export default WorkflowDetailsPage;