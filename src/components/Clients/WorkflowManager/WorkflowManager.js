import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountTree as WorkflowIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  CheckCircle as ActiveIcon,
  Pause as InactiveIcon,
  Schedule as TimeIcon,
} from '@mui/icons-material';
import { workflowAPI, n8nAPI } from '../../../utils/apiServices';
import { useNotificationContext } from '../../../contexts/NotificationContext';
import { NOTIFICATION_MESSAGES } from '../../../utils/notifications';
import WorkflowSkeleton from '../../N8nWorkflows/WorkflowSkeleton';
import { WorkflowsEmptyState } from '../../N8nWorkflows/EmptyState';
import './WorkflowManager.css';

const WorkflowManager = ({ clientId, clientName }) => {
  const { showSuccess, showError } = useNotificationContext();
  
  const [workflows, setWorkflows] = useState([]);
  const [n8nWorkflows, setN8nWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [formData, setFormData] = useState({
    workflow_type: '',
    time_saved_minutes: '',
    n8n_flow_id: '',
    status: 'active'
  });

  useEffect(() => {
    if (clientId) {
      loadWorkflows();
      loadN8nWorkflows();
    }
  }, [clientId]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const data = await workflowAPI.getByClient(clientId);
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error loading client workflows:', error);
      showError(NOTIFICATION_MESSAGES.CLIENT_WORKFLOWS_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const loadN8nWorkflows = async () => {
    try {
      const data = await n8nAPI.getWorkflows();
      setN8nWorkflows(data?.data || data || []);
    } catch (error) {
      console.error('Error loading n8n workflows:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([loadWorkflows(), loadN8nWorkflows()]);
      showSuccess(NOTIFICATION_MESSAGES.DATA_REFRESHED);
    } catch (error) {
      showError(NOTIFICATION_MESSAGES.DATA_REFRESH_ERROR);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddWorkflow = () => {
    setEditingWorkflow(null);
    setFormData({
      workflow_type: '',
      time_saved_minutes: '',
      n8n_flow_id: '',
      status: 'active'
    });
    setShowAddDialog(true);
  };

  const handleEditWorkflow = (workflow) => {
    setEditingWorkflow(workflow);
    setFormData({
      workflow_type: workflow.workflow_type || '',
      time_saved_minutes: workflow.time_saved_minutes || '',
      n8n_flow_id: workflow.n8n_flow_id || '',
      status: workflow.status || 'active'
    });
    setShowAddDialog(true);
  };

  const handleFormSubmit = async () => {
    try {
      if (editingWorkflow) {
        await workflowAPI.updateStatus(editingWorkflow.id, formData);
        showSuccess(NOTIFICATION_MESSAGES.CLIENT_WORKFLOW_UPDATED);
      } else {
        await workflowAPI.create(clientId, formData);
        showSuccess(NOTIFICATION_MESSAGES.CLIENT_WORKFLOW_CREATED);
      }
      
      setShowAddDialog(false);
      await loadWorkflows();
    } catch (error) {
      console.error('Error saving workflow:', error);
      showError(editingWorkflow ? 'Failed to update workflow' : 'Failed to create workflow');
    }
  };

  const handleDeleteWorkflow = async (workflowId) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      try {
        await workflowAPI.delete(workflowId);
        showSuccess(NOTIFICATION_MESSAGES.CLIENT_WORKFLOW_DELETED);
        await loadWorkflows();
      } catch (error) {
        console.error('Error deleting workflow:', error);
        showError('Failed to delete workflow');
      }
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'default';
  };

  const getStatusIcon = (status) => {
    return status === 'active' ? <ActiveIcon /> : <InactiveIcon />;
  };

  const getN8nWorkflowName = (n8nFlowId) => {
    const n8nWorkflow = n8nWorkflows.find(w => w.id === n8nFlowId);
    return n8nWorkflow?.name || 'Unknown Workflow';
  };

  const formatTimeSaved = (minutes) => {
    if (!minutes) return 'Not specified';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hours`;
  };

  return (
    <div className="workflow-manager">
      {/* Header */}
      <Box className="workflow-manager-header">
        <Box className="header-content">
          <WorkflowIcon className="header-icon" />
          <Box>
            <Typography variant="h6" className="header-title">
              Client Workflows
            </Typography>
            <Typography variant="body2" className="header-subtitle">
              Manage automation workflows for {clientName}
            </Typography>
          </Box>
        </Box>
        <Box className="header-actions">
          <Tooltip title="Refresh">
            <IconButton 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="refresh-btn"
            >
              <RefreshIcon className={refreshing ? 'spinning' : ''} />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddWorkflow}
            className="add-workflow-btn"
          >
            Add Workflow
          </Button>
        </Box>
      </Box>

      {/* Workflows List */}
      <Box className="workflows-content">
        {loading ? (
          <WorkflowSkeleton count={3} />
        ) : workflows.length === 0 ? (
          <WorkflowsEmptyState 
            onRefresh={handleRefresh}
            hasFilters={false}
            onClearFilters={() => {}}
          />
        ) : (
          <Grid container spacing={3}>
            {workflows.map((workflow) => (
              <Grid item xs={12} md={6} lg={4} key={workflow.id}>
                <Card className="workflow-card">
                  <CardContent>
                    <Box className="workflow-card-header">
                      <Box className="workflow-info">
                        <Typography variant="h6" className="workflow-type">
                          {workflow.workflow_type || 'Unnamed Workflow'}
                        </Typography>
                        <Typography variant="body2" className="workflow-id">
                          ID: {workflow.id}
                        </Typography>
                      </Box>
                      <Box className="workflow-actions">
                        <IconButton
                          size="small"
                          onClick={() => handleEditWorkflow(workflow)}
                          className="edit-btn"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteWorkflow(workflow.id)}
                          className="delete-btn"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box className="workflow-status">
                      <Chip
                        icon={getStatusIcon(workflow.status)}
                        label={workflow.status === 'active' ? 'Active' : 'Inactive'}
                        color={getStatusColor(workflow.status)}
                        size="small"
                      />
                    </Box>

                    <Divider className="workflow-divider" />

                    <Box className="workflow-details">
                      {workflow.n8n_flow_id && (
                        <Box className="workflow-detail-item">
                          <Typography variant="caption" className="detail-label">
                            n8n Workflow
                          </Typography>
                          <Typography variant="body2" className="detail-value">
                            {getN8nWorkflowName(workflow.n8n_flow_id)}
                          </Typography>
                        </Box>
                      )}

                      {workflow.time_saved_minutes && (
                        <Box className="workflow-detail-item">
                          <Typography variant="caption" className="detail-label">
                            Time Saved
                          </Typography>
                          <Box className="time-saved">
                            <TimeIcon className="time-icon" />
                            <Typography variant="body2" className="detail-value">
                              {formatTimeSaved(workflow.time_saved_minutes)}
                            </Typography>
                          </Box>
                        </Box>
                      )}

                      <Box className="workflow-detail-item">
                        <Typography variant="caption" className="detail-label">
                          Created
                        </Typography>
                        <Typography variant="body2" className="detail-value">
                          {workflow.created_at ? 
                            new Date(workflow.created_at).toLocaleDateString() : 
                            'Unknown'
                          }
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Add/Edit Workflow Dialog */}
      <Dialog 
        open={showAddDialog} 
        onClose={() => setShowAddDialog(false)}
        maxWidth="sm"
        fullWidth
        className="workflow-dialog"
      >
        <DialogTitle>
          {editingWorkflow ? 'Edit Workflow' : 'Add New Workflow'}
        </DialogTitle>
        <DialogContent>
          <Box className="workflow-form">
            <TextField
              fullWidth
              label="Workflow Type"
              value={formData.workflow_type}
              onChange={(e) => setFormData({...formData, workflow_type: e.target.value})}
              margin="normal"
              required
              placeholder="e.g., Data Processing, Email Automation"
            />

            <TextField
              fullWidth
              label="Time Saved (minutes)"
              type="number"
              value={formData.time_saved_minutes}
              onChange={(e) => setFormData({...formData, time_saved_minutes: e.target.value})}
              margin="normal"
              placeholder="e.g., 30"
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>n8n Workflow</InputLabel>
              <Select
                value={formData.n8n_flow_id}
                onChange={(e) => setFormData({...formData, n8n_flow_id: e.target.value})}
                label="n8n Workflow"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {n8nWorkflows.map((n8nWorkflow) => (
                  <MenuItem key={n8nWorkflow.id} value={n8nWorkflow.id}>
                    {n8nWorkflow.name || `Workflow ${n8nWorkflow.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleFormSubmit}
            variant="contained"
            disabled={!formData.workflow_type}
          >
            {editingWorkflow ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default WorkflowManager;