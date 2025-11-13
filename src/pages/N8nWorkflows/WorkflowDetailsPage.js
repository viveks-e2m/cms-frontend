import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Refresh as RefreshIcon,
  AccountTree as WorkflowIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Code as CodeIcon,
} from "@mui/icons-material";
import DashboardLayout from "../../components/Layout/DashboardLayout/DashboardLayout";
import LoadingSpinner from "../../components/UI/LoadingSpinner/LoadingSpinner";
import { n8nAPI } from "../../utils/apiServices";
import { useNotificationContext } from "../../contexts/NotificationContext";
import { NOTIFICATION_MESSAGES } from "../../utils/notifications";
import "./WorkflowDetailsPage.css";

const WorkflowDetailsPage = () => {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotificationContext();

  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeDialogOpen, setNodeDialogOpen] = useState(false);

  useEffect(() => {
    if (workflowId) {
      loadWorkflowDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

  const loadWorkflowDetails = async (forceRefresh = false) => {
    try {
      setLoading(true);

      // Get detailed workflow information using the new API
      const workflowDetailsData = await n8nAPI.getWorkflowDetails(
        workflowId,
        forceRefresh
      );

      if (!workflowDetailsData) {
        showError(NOTIFICATION_MESSAGES.WORKFLOW_NOT_FOUND);
        navigate("/n8n-workflows");
        return;
      }

      setWorkflow(workflowDetailsData);

      // Get executions for this workflow
      await n8nAPI.getWorkflowExecutions(workflowId);
    } catch (error) {
      console.error("Error loading workflow details:", error);

      // Fallback to the old method if the new API fails
      try {
        const workflowsData = await n8nAPI.getWorkflows();
        const workflows = workflowsData?.data || workflowsData || [];
        const foundWorkflow = workflows.find((w) => w.id === workflowId);

        if (foundWorkflow) {
          setWorkflow(foundWorkflow);
        } else {
          showError(NOTIFICATION_MESSAGES.WORKFLOW_NOT_FOUND);
          navigate("/n8n-workflows");
          return;
        }
      } catch (fallbackError) {
        console.error("Fallback method also failed:", fallbackError);
        showError(NOTIFICATION_MESSAGES.WORKFLOW_DETAILS_ERROR);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      // Force refresh from N8N API to get latest data
      await loadWorkflowDetails(true);
      showSuccess(NOTIFICATION_MESSAGES.WORKFLOW_DETAILS_REFRESHED);
    } catch (error) {
      showError(NOTIFICATION_MESSAGES.WORKFLOW_DETAILS_ERROR);
    } finally {
      setRefreshing(false);
    }
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    setNodeDialogOpen(true);
  };

  const handleCloseNodeDialog = () => {
    setNodeDialogOpen(false);
    setSelectedNode(null);
  };

  const renderParameterValue = (value) => {
    if (typeof value === "object" && value !== null) {
      return (
        <pre
          style={{
            fontSize: "0.75rem",
            background: "#f5f5f5",
            padding: "0.5rem",
            borderRadius: "4px",
            overflow: "auto",
            maxHeight: "200px",
          }}
        >
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }
    return String(value);
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
              onClick={() => navigate("/n8n-workflows")}
              className="back-btn"
            >
              <BackIcon />
            </IconButton>
            <WorkflowIcon className="page-icon" />
            <Box>
              <Typography variant="h4" className="page-title">
                {workflow.name || "Unnamed Workflow"}
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
                <RefreshIcon className={refreshing ? "spinning" : ""} />
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
                    label={workflow.active ? "Active" : "Inactive"}
                    color={workflow.active ? "success" : "default"}
                    size="small"
                  />
                </Box>

                <Box className="info-item">
                  <Typography variant="body2" className="info-label">
                    Archived
                  </Typography>
                  <Chip
                    label={workflow.isArchived ? "Yes" : "No"}
                    color={workflow.isArchived ? "warning" : "success"}
                    size="small"
                  />
                </Box>

                <Box className="info-item">
                  <Typography variant="body2" className="info-label">
                    Created
                  </Typography>
                  <Typography variant="body2" className="info-value">
                    {workflow.createdAt
                      ? new Date(workflow.createdAt).toLocaleString()
                      : "Unknown"}
                  </Typography>
                </Box>

                <Box className="info-item">
                  <Typography variant="body2" className="info-label">
                    Last Updated
                  </Typography>
                  <Typography variant="body2" className="info-value">
                    {workflow.updatedAt
                      ? new Date(workflow.updatedAt).toLocaleString()
                      : "Unknown"}
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

                {workflow.connections && (
                  <Box className="info-item">
                    <Typography variant="body2" className="info-label">
                      Connections
                    </Typography>
                    <Typography variant="body2" className="info-value">
                      {Object.keys(workflow.connections).length} connection
                      points
                    </Typography>
                  </Box>
                )}

                {workflow.settings && (
                  <Box className="info-item">
                    <Typography variant="body2" className="info-label">
                      Settings
                    </Typography>
                    <Typography variant="body2" className="info-value">
                      {Object.keys(workflow.settings).length} configuration
                      items
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Workflow Nodes */}
          <Grid item xs={12} lg={8}>
            <Card className="workflow-nodes-card">
              <CardContent>
                <Typography variant="h6" className="section-title">
                  Workflow Nodes ({workflow.nodes?.length || 0})
                </Typography>

                {workflow.nodes && workflow.nodes.length > 0 ? (
                  <TableContainer component={Paper} className="nodes-table">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Node Name</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Version</TableCell>
                          <TableCell>Position</TableCell>
                          <TableCell>Parameters</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {workflow.nodes.map((node, index) => (
                          <TableRow
                            key={node.id || index}
                            hover
                            style={{ cursor: "pointer" }}
                            onClick={() => handleNodeClick(node)}
                          >
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography
                                  variant="body2"
                                  className="node-name"
                                >
                                  {node.name || `Node ${index + 1}`}
                                </Typography>
                                <InfoIcon fontSize="small" color="action" />
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={node.type?.split(".").pop() || "Unknown"}
                                size="small"
                                variant="outlined"
                                className="node-type-chip"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                v{node.typeVersion || "N/A"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                className="node-position"
                              >
                                {node.position
                                  ? `(${node.position[0]}, ${node.position[1]})`
                                  : "N/A"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2">
                                  {node.parameters
                                    ? Object.keys(node.parameters).length
                                    : 0}{" "}
                                  params
                                </Typography>
                                {node.credentials && (
                                  <Chip
                                    label="Has Credentials"
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No nodes found in this workflow
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Workflow Connections */}
          {workflow.connections &&
            Object.keys(workflow.connections).length > 0 && (
              <Grid item xs={12}>
                <Card className="workflow-connections-card">
                  <CardContent>
                    <Typography variant="h6" className="section-title">
                      Node Connections
                    </Typography>

                    <TableContainer
                      component={Paper}
                      className="connections-table"
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Source Node</TableCell>
                            <TableCell>Target Node</TableCell>
                            <TableCell>Connection Type</TableCell>
                            <TableCell>Index</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(workflow.connections).map(
                            ([sourceNode, connections]) =>
                              Object.entries(connections).map(
                                ([connectionType, targets]) =>
                                  targets.map((targetList, listIndex) =>
                                    targetList.map((target, targetIndex) => (
                                      <TableRow
                                        key={`${sourceNode}-${connectionType}-${listIndex}-${targetIndex}`}
                                      >
                                        <TableCell>
                                          <Typography
                                            variant="body2"
                                            className="source-node"
                                          >
                                            {sourceNode}
                                          </Typography>
                                        </TableCell>
                                        <TableCell>
                                          <Typography
                                            variant="body2"
                                            className="target-node"
                                          >
                                            {target.node}
                                          </Typography>
                                        </TableCell>
                                        <TableCell>
                                          <Chip
                                            label={
                                              target.type || connectionType
                                            }
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Typography variant="body2">
                                            {target.index !== undefined
                                              ? target.index
                                              : "N/A"}
                                          </Typography>
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )
                              )
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            )}

          {/* Workflow Settings */}
          {workflow.settings && Object.keys(workflow.settings).length > 0 && (
            <Grid item xs={12} md={6}>
              <Card className="workflow-settings-card">
                <CardContent>
                  <Typography variant="h6" className="section-title">
                    Workflow Settings
                  </Typography>

                  <Box className="settings-list">
                    {Object.entries(workflow.settings).map(([key, value]) => (
                      <Box key={key} className="setting-item">
                        <Typography variant="body2" className="setting-key">
                          {key}:
                        </Typography>
                        <Typography variant="body2" className="setting-value">
                          {typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Workflow Statistics */}
          <Grid item xs={12} md={6}>
            <Card className="workflow-stats-card">
              <CardContent>
                <Typography variant="h6" className="section-title">
                  Workflow Statistics
                </Typography>

                <Box className="workflow-details-stats-grid">
                  <Box className="workflow-details-stat-item">
                    <Typography
                      variant="h4"
                      className="workflow-details-stat-number"
                    >
                      {workflow.nodes?.length || 0}
                    </Typography>
                    <Typography
                      variant="body2"
                      className="workflow-details-stat-label"
                    >
                      Total Nodes
                    </Typography>
                  </Box>

                  <Box className="workflow-details-stat-item">
                    <Typography
                      variant="h4"
                      className="workflow-details-stat-number"
                    >
                      {workflow.connections
                        ? Object.keys(workflow.connections).length
                        : 0}
                    </Typography>
                    <Typography
                      variant="body2"
                      className="workflow-details-stat-label"
                    >
                      Connection Points
                    </Typography>
                  </Box>

                  <Box className="workflow-details-stat-item">
                    <Typography
                      variant="h4"
                      className="workflow-details-stat-number"
                    >
                      {workflow.nodes?.filter((node) => node.credentials)
                        .length || 0}
                    </Typography>
                    <Typography
                      variant="body2"
                      className="workflow-details-stat-label"
                    >
                      Nodes with Credentials
                    </Typography>
                  </Box>

                  <Box className="workflow-details-stat-item">
                    <Typography
                      variant="h4"
                      className="workflow-details-stat-number"
                    >
                      {workflow.nodes?.reduce(
                        (count, node) =>
                          count +
                          (node.parameters
                            ? Object.keys(node.parameters).length
                            : 0),
                        0
                      ) || 0}
                    </Typography>
                    <Typography
                      variant="body2"
                      className="workflow-details-stat-label"
                    >
                      Total Parameters
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Node Details Dialog */}
        <Dialog
          open={nodeDialogOpen}
          onClose={handleCloseNodeDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            style: {
              borderRadius: "16px",
              maxHeight: "80vh",
            },
          }}
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={2}>
              <CodeIcon color="primary" />
              <Box>
                <Typography variant="h6">
                  {selectedNode?.name || "Node Details"}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedNode?.type}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>

          <DialogContent dividers>
            {selectedNode && (
              <Box>
                {/* Basic Node Information */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Basic Information</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary">
                          Node ID
                        </Typography>
                        <Typography
                          variant="body1"
                          style={{ fontFamily: "monospace" }}
                        >
                          {selectedNode.id}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary">
                          Type Version
                        </Typography>
                        <Typography variant="body1">
                          v{selectedNode.typeVersion || "N/A"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary">
                          Position
                        </Typography>
                        <Typography
                          variant="body1"
                          style={{ fontFamily: "monospace" }}
                        >
                          {selectedNode.position
                            ? `(${selectedNode.position[0]}, ${selectedNode.position[1]})`
                            : "N/A"}
                        </Typography>
                      </Grid>
                      {selectedNode.webhookId && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="textSecondary">
                            Webhook ID
                          </Typography>
                          <Typography
                            variant="body1"
                            style={{ fontFamily: "monospace" }}
                          >
                            {selectedNode.webhookId}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                {/* Node Parameters */}
                {selectedNode.parameters &&
                  Object.keys(selectedNode.parameters).length > 0 && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">
                          Parameters (
                          {Object.keys(selectedNode.parameters).length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box>
                          {Object.entries(selectedNode.parameters).map(
                            ([key, value]) => (
                              <Box key={key} mb={2}>
                                <Typography
                                  variant="body2"
                                  color="textSecondary"
                                  gutterBottom
                                >
                                  {key}
                                </Typography>
                                <Box>{renderParameterValue(value)}</Box>
                              </Box>
                            )
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  )}

                {/* Node Credentials */}
                {selectedNode.credentials && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6">Credentials</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box>
                        {Object.entries(selectedNode.credentials).map(
                          ([key, credential]) => (
                            <Box key={key} mb={2}>
                              <Typography variant="body2" color="textSecondary">
                                {key}
                              </Typography>
                              <Box mt={1}>
                                <Chip
                                  label={`ID: ${credential.id}`}
                                  size="small"
                                  variant="outlined"
                                  style={{ marginRight: "0.5rem" }}
                                />
                                <Chip
                                  label={`Name: ${credential.name}`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              </Box>
                            </Box>
                          )
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Raw Node Data */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Raw Node Data (JSON)</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <pre
                      style={{
                        fontSize: "0.75rem",
                        background: "#f5f5f5",
                        padding: "1rem",
                        borderRadius: "8px",
                        overflow: "auto",
                        maxHeight: "400px",
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      {JSON.stringify(selectedNode, null, 2)}
                    </pre>
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={handleCloseNodeDialog} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default WorkflowDetailsPage;
