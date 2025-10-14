import api from './api';

// Helper function to handle API responses
const handleApiResponse = (response) => {
  const { success, data, error } = response.data;
  
  if (!success) {
    throw new Error(error?.message || 'API request failed');
  }
  
  return data;
};

// Client API services
export const clientAPI = {
  // Create a new client
  create: async (clientData) => {
    const response = await api.post('/clients', clientData);
    return handleApiResponse(response);
  },

  // Get all clients
  getAll: async () => {
    const response = await api.get('/clients');
    return handleApiResponse(response);
  },

  // Get client by ID
  getById: async (clientId) => {
    const response = await api.get(`/clients/${clientId}`);
    return handleApiResponse(response);
  },

  // Update client
  update: async (clientId, clientData) => {
    const response = await api.put(`/clients/${clientId}`, clientData);
    return handleApiResponse(response);
  },

  // Delete client
  delete: async (clientId) => {
    const response = await api.delete(`/clients/${clientId}`);
    return handleApiResponse(response);
  },

  // Fetch pre-onboarding info
  fetchPreOnboardingInfo: async (clientId, forceRefresh = false) => {
    const params = forceRefresh ? '?force_refresh=true' : '';
    const response = await api.get(`/clients/${clientId}/fetch_pre_onboarding_info${params}`, {
      timeout: 300000 // 5 minutes timeout for onboarding fetch
    });
    return handleApiResponse(response);
  },

  // Client-User assignments
  assignUser: async (clientId, userData) => {
    const response = await api.post(`/clients/${clientId}/users`, userData);
    return handleApiResponse(response);
  },

  getAssignedUsers: async (clientId) => {
    const response = await api.get(`/clients/${clientId}/users`);
    return handleApiResponse(response);
  },

  removeUserAssignment: async (clientId, userId) => {
    const response = await api.delete(`/clients/${clientId}/users/${userId}`);
    return handleApiResponse(response);
  }
};

// Meeting API services
export const meetingAPI = {
  // Create meeting for client
  create: async (clientId, meetingData) => {
    const response = await api.post(`/clients/${clientId}/meetings`, meetingData, {
      timeout: 300000 // 5 minutes timeout for Fathom data fetching
    });
    return handleApiResponse(response);
  },

  // Get all meetings for client
  getByClient: async (clientId) => {
    const response = await api.get(`/clients/${clientId}/meetings`);
    return handleApiResponse(response);
  },

  // Get meeting details
  getById: async (meetingId) => {
    const response = await api.get(`/meetings/${meetingId}`);
    return handleApiResponse(response);
  },

  // Update meeting
  update: async (meetingId, meetingData) => {
    const response = await api.put(`/meetings/${meetingId}`, meetingData, {
      timeout: 300000 // 5 minutes timeout for Fathom data fetching
    });
    return handleApiResponse(response);
  },

  // Delete meeting
  delete: async (meetingId) => {
    const response = await api.delete(`/meetings/${meetingId}`);
    return handleApiResponse(response);
  },

  // Meeting notes
  addNote: async (meetingId, noteData) => {
    const response = await api.post(`/meetings/${meetingId}/notes`, noteData);
    return handleApiResponse(response);
  },

  getNotes: async (meetingId) => {
    const response = await api.get(`/meetings/${meetingId}/notes`);
    return handleApiResponse(response);
  },

  // Action items status
  getActionItemsStatus: async (meetingId) => {
    const response = await api.get(`/meetings/${meetingId}/action-items-status`);
    return handleApiResponse(response);
  },

};

// Open Points (Tasks) API services
export const openPointsAPI = {
  // Generate tasks from meeting transcript
  generateFromMeeting: async (meetingId) => {
    const response = await api.post(`/meetings/${meetingId}/open-points`);
    return handleApiResponse(response);
  },

  // Generate open points from Fathom webhook
  generateFromFathomWebhook: async (meetingId, webhookUrl, clientId) => {
    const response = await api.post(`/meetings/${meetingId}/fathom-open-points`, {
      webhook_url: webhookUrl,
      client_id: clientId
    });
    return handleApiResponse(response);
  },

  // Get all open points for client
  getByClient: async (clientId) => {
    const response = await api.get(`/clients/${clientId}/open-points`);
    return handleApiResponse(response);
  },

  // Get all open points for a specific meeting
  getByMeeting: async (meetingId) => {
    const response = await api.get(`/meetings/${meetingId}/open-points`);
    return handleApiResponse(response);
  },

  // Get open point details
  getById: async (openPointId) => {
    const response = await api.get(`/open-points/${openPointId}`);
    return handleApiResponse(response);
  },

  // Update open point status
  updateStatus: async (openPointId, statusData) => {
    const response = await api.put(`/open-points/${openPointId}`, statusData);
    return handleApiResponse(response);
  },

  // Delete open point
  delete: async (openPointId) => {
    const response = await api.delete(`/open-points/${openPointId}`);
    return handleApiResponse(response);
  }
};

// Workflow API services
export const workflowAPI = {
  // Create workflow for client
  create: async (clientId, workflowData) => {
    const response = await api.post(`/clients/${clientId}/workflows`, workflowData);
    return handleApiResponse(response);
  },

  // Get workflows for client
  getByClient: async (clientId) => {
    const response = await api.get(`/clients/${clientId}/workflows`);
    return handleApiResponse(response);
  },

  // Get workflow details
  getById: async (workflowId) => {
    const response = await api.get(`/workflows/${workflowId}`);
    return handleApiResponse(response);
  },

  // Update workflow status
  updateStatus: async (workflowId, statusData) => {
    const response = await api.put(`/workflows/${workflowId}`, statusData);
    return handleApiResponse(response);
  },

  // Delete workflow
  delete: async (workflowId) => {
    const response = await api.delete(`/workflows/${workflowId}`);
    return handleApiResponse(response);
  }
};

// Secrets API services
export const secretsAPI = {
  // Add secret for client
  create: async (clientId, secretData) => {
    const response = await api.post(`/clients/${clientId}/secrets`, secretData);
    return handleApiResponse(response);
  },

  // Get secrets list for client (titles only)
  getByClient: async (clientId) => {
    const response = await api.get(`/clients/${clientId}/secrets`);
    return handleApiResponse(response);
  },

  // Get secret details (decrypt)
  getById: async (secretId) => {
    const response = await api.get(`/secrets/${secretId}`);
    return handleApiResponse(response);
  },

  // Delete secret
  delete: async (secretId) => {
    const response = await api.delete(`/secrets/${secretId}`);
    return handleApiResponse(response);
  }
};

// N8N Workflows API services
export const n8nAPI = {
  // Get all workflows from n8n
  getWorkflows: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.active !== undefined) queryParams.append('active', params.active);
    if (params.name) queryParams.append('name', params.name);
    if (params.tags) queryParams.append('tags', params.tags);
    
    const url = `/n8n/workflows${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get(url);
    return handleApiResponse(response);
  },

  // Get all executions from n8n
  getExecutions: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.workflow_id) queryParams.append('workflow_id', params.workflow_id);
    if (params.status) queryParams.append('status', params.status);
    
    const url = `/n8n/executions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get(url);
    return handleApiResponse(response);
  },

  // Get executions for a specific workflow
  getWorkflowExecutions: async (workflowId) => {
    const response = await api.get(`/n8n/workflows/${workflowId}/executions`);
    return handleApiResponse(response);
  },

  // New N8N Workflow Details API methods
  
  // Get specific workflow details (with caching)
  getWorkflowDetails: async (workflowId, forceRefresh = false) => {
    const queryParams = forceRefresh ? '?force_refresh=true' : '';
    const response = await api.get(`/n8n/workflows/${workflowId}/details${queryParams}`);
    return handleApiResponse(response);
  },

  // Create or update workflow details
  createOrUpdateWorkflowDetails: async (workflowId, workflowDetails) => {
    const payload = {
      n8n_workflow_id: workflowId,
      n8n_workflow_details: workflowDetails
    };
    const response = await api.post(`/n8n/workflows/${workflowId}/details`, payload);
    return handleApiResponse(response);
  },

  // Get all cached workflow details
  getCachedWorkflowDetails: async () => {
    const response = await api.get('/n8n/workflows/details/cached');
    return handleApiResponse(response);
  }
};