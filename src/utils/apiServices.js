import api from "./api";
import { API_CONFIG } from "../constants/api";

// Helper function to handle API responses
const handleApiResponse = (response) => {
  const { success, data, error } = response.data;

  if (!success) {
    // Extract the most specific error message available
    let errorMessage = "API request failed";
    
    if (error) {
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.details && typeof error.details === 'string') {
        errorMessage = error.details;
      }
    }
    
    throw new Error(errorMessage);
  }

  return data;
};

// Client API services
export const clientAPI = {
  // Create a new client
  create: async (clientData) => {
    const response = await api.post("/clients", clientData);
    return handleApiResponse(response);
  },

  // Get all clients
  getAll: async () => {
    const response = await api.get("/clients");
    return handleApiResponse(response);
  },

  // Get recent clients for dashboard (optimized)
  getRecent: async (limit = 5) => {
    const queryParams = limit ? `?limit=${limit}` : '';
    const response = await api.post(`/clients/recent${queryParams}`);
    return handleApiResponse(response);
  },

  // Get client by ID
  getById: async (clientId) => {
    const response = await api.get(`/clients/${clientId}`, {
      timeout: API_CONFIG.LONG_TIMEOUT, // 2 minutes timeout for client details
    });
    return handleApiResponse(response);
  },

  // Get consolidated client overview (meetings, action items, notes)
  getOverview: async (clientId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.action_items_page_size) {
      queryParams.append("action_items_page_size", params.action_items_page_size);
    }

    const queryString = queryParams.toString()
      ? `?${queryParams.toString()}`
      : "";

    const response = await api.get(`/clients/${clientId}/overview${queryString}`, {
      timeout: API_CONFIG.LONG_TIMEOUT,
    });
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
    const params = forceRefresh ? "?force_refresh=true" : "";
    const response = await api.get(
      `/clients/${clientId}/fetch_pre_onboarding_info${params}`,
      {
        timeout: 300000, // 5 minutes timeout for onboarding fetch (keep longer for this heavy operation)
      }
    );
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
  },

  // Get all users for dropdowns
  getAllUsers: async () => {
    const response = await api.get("/clients/users/all");
    return handleApiResponse(response);
  },

  // Get client statistics for dashboard (optimized)
  getStatistics: async () => {
    const response = await api.post("/clients/statistics");
    return handleApiResponse(response);
  },

  // Client notes
  updateNotes: async (clientId, notes) => {
    const response = await api.put(`/clients/${clientId}/notes`, { client_notes: notes });
    return handleApiResponse(response);
  },

  getNotes: async (clientId) => {
    const response = await api.get(`/clients/${clientId}/notes`);
    return handleApiResponse(response);
  },
};

// Meeting API services
export const meetingAPI = {
  // Search meetings across clients
  searchAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.search) queryParams.append("search", filters.search);
    if (filters.client_id) queryParams.append("client_id", filters.client_id);
    if (filters.time_range) queryParams.append("time_range", filters.time_range);
    if (typeof filters.limit === "number") queryParams.append("limit", filters.limit);
    if (typeof filters.offset === "number") queryParams.append("offset", filters.offset);
    if (filters.lightweight === false) queryParams.append("lightweight", "false");

    const queryString = queryParams.toString();
    const response = await api.get(
      `/meetings${queryString ? `?${queryString}` : ""}`,
      {
        timeout: API_CONFIG.DEFAULT_TIMEOUT,
      }
    );
    return handleApiResponse(response);
  },

  // Create meeting for client
  create: async (clientId, meetingData) => {
    const response = await api.post(
      `/clients/${clientId}/meetings`,
      meetingData,
      {
        timeout: 300000, // 5 minutes timeout for Fathom data fetching
      }
    );
    return handleApiResponse(response);
  },

  // Get all meetings for client
  getByClient: async (clientId, lightweight = false) => {
    const params = lightweight ? "?lightweight=true" : "";
    const response = await api.get(`/clients/${clientId}/meetings${params}`, {
      timeout: lightweight ? API_CONFIG.DEFAULT_TIMEOUT : API_CONFIG.LONG_TIMEOUT,
    });
    return handleApiResponse(response);
  },

  // Get lightweight meeting list for client (optimized for performance)
  getSummaryByClient: async (clientId) => {
    const response = await api.get(`/clients/${clientId}/meetings/basic`, {
      timeout: API_CONFIG.DEFAULT_TIMEOUT,
    });
    return handleApiResponse(response);
  },

  // Get meeting details
  getById: async (meetingId) => {
    const response = await api.get(`/meetings/${meetingId}`, {
      timeout: API_CONFIG.LONG_TIMEOUT, // 2 minutes timeout for meeting details
    });
    return handleApiResponse(response);
  },

  // Get meeting transcript (heavy payload)
  getTranscript: async (meetingId) => {
    const response = await api.get(`/meetings/${meetingId}/transcript`, {
      timeout: API_CONFIG.LONG_TIMEOUT,
    });
    return handleApiResponse(response);
  },

  // Update meeting
  update: async (meetingId, meetingData) => {
    const response = await api.put(`/meetings/${meetingId}`, meetingData, {
      timeout: 300000, // 5 minutes timeout for Fathom data fetching
    });
    return handleApiResponse(response);
  },

  // Delete meeting
  delete: async (meetingId) => {
    const response = await api.delete(`/meetings/${meetingId}`);
    return handleApiResponse(response);
  },

  // Get meeting statistics for dashboard (optimized)
  getStatistics: async () => {
    const response = await api.post("/meetings/statistics");
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
    const response = await api.get(
      `/meetings/${meetingId}/action-items-status`
    );
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

  // Create manual action item
  createManual: async (actionItemData) => {
    const response = await api.post('/open-points/manual', actionItemData);
    return handleApiResponse(response);
  },

  // Generate open points from Fathom webhook
  generateFromFathomWebhook: async (meetingId, webhookUrl, clientId) => {
    const response = await api.post(
      `/meetings/${meetingId}/fathom-open-points`,
      {
        webhook_url: webhookUrl,
        client_id: clientId,
      }
    );
    return handleApiResponse(response);
  },

  // Get all open points for client (without pagination - legacy)
  getByClient: async (clientId) => {
    const response = await api.get(`/clients/${clientId}/open-points`);
    return handleApiResponse(response);
  },

  // Get open points for client with pagination support
  getByClientPaginated: async (clientId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.page_size) queryParams.append("page_size", params.page_size);

    const url = `/clients/${clientId}/open-points${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    console.log('API Request URL for client action items:', url);
    const response = await api.get(url);
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
  },

  // Get open points statistics for dashboard (optimized)
  getStatistics: async () => {
    const response = await api.post("/open-points/statistics");
    return handleApiResponse(response);
  },

  // Get recent open points with pagination support
  // Note: Backend only supports status and client_id filters
  // task_owner and assignee should be filtered client-side
  getRecentOptimized: async (params = {}) => {
    const queryParams = new URLSearchParams();
    // Add view parameter (list or kanban)
    if (params.view) {
      queryParams.append("view", params.view);
    }
    if (params.status && params.status !== "all") queryParams.append("status", params.status);
    if (params.client_id && params.client_id !== "all") queryParams.append("client_id", params.client_id);
    // task_owner and assignee are NOT sent - backend doesn't support them
    if (params.page) queryParams.append("page", params.page);
    if (params.page_size) queryParams.append("page_size", params.page_size);

    const url = `/open-points/recent${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    console.log('API Request URL:', url);
    console.log('Query params:', params);
    const response = await api.post(url, {}, {
      timeout: API_CONFIG.DEFAULT_TIMEOUT, // Faster timeout for optimized endpoint
    });
    return handleApiResponse(response);
  },
};

// Workflow API services
export const workflowAPI = {
  // Create workflow for client
  create: async (clientId, workflowData) => {
    const response = await api.post(
      `/clients/${clientId}/workflows`,
      workflowData
    );
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
  },
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
  },
};

// N8N Workflows API services
export const n8nAPI = {
  // Get all workflows from n8n (database by default, API with force_refresh=true)
  getWorkflows: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.active !== undefined)
      queryParams.append("active", params.active);
    if (params.name) queryParams.append("name", params.name);
    if (params.tags) queryParams.append("tags", params.tags);
    if (params.force_refresh) queryParams.append("force_refresh", "true");

    const url = `/n8n/workflows${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    const response = await api.get(url);
    return handleApiResponse(response);
  },

  // Get all executions from n8n
  getExecutions: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.workflow_id)
      queryParams.append("workflow_id", params.workflow_id);
    if (params.status) queryParams.append("status", params.status);

    const url = `/n8n/executions${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
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
    const queryParams = forceRefresh ? "?force_refresh=true" : "";
    const response = await api.get(
      `/n8n/workflows/${workflowId}/details${queryParams}`
    );
    return handleApiResponse(response);
  },

  // Create or update workflow details
  createOrUpdateWorkflowDetails: async (workflowId, workflowDetails) => {
    const payload = {
      n8n_workflow_id: workflowId,
      n8n_workflow_details: workflowDetails,
    };
    const response = await api.post(
      `/n8n/workflows/${workflowId}/details`,
      payload
    );
    return handleApiResponse(response);
  },

  // Get all cached workflow details
  getCachedWorkflowDetails: async () => {
    const response = await api.get("/n8n/workflows/details/cached");
    return handleApiResponse(response);
  },
};

// Minutes of Meeting (MoM) API services
export const momAPI = {
  // Get MoM by meeting ID
  getByMeetingId: async (meetingId) => {
    const response = await api.get(`/meetings/${meetingId}/mom`);
    return handleApiResponse(response);
  },

  // Save MoM content
  save: async (meetingId, momData) => {
    const response = await api.post(`/meetings/${meetingId}/mom`, momData);
    return handleApiResponse(response);
  },

  // Update MoM content
  update: async (meetingId, momData) => {
    const response = await api.put(`/meetings/${meetingId}/mom`, momData);
    return handleApiResponse(response);
  },

  // Delete MoM
  delete: async (meetingId) => {
    const response = await api.delete(`/meetings/${meetingId}/mom`);
    return handleApiResponse(response);
  },

  // Generate MoM from transcript
  generateFromTranscript: async (meetingId) => {
    const response = await api.post(`/meetings/${meetingId}/mom/generate`, null, {
      timeout: 600000, // allow up to 10 minutes for webhook-based generation
    });
    return handleApiResponse(response);
  },
};

// Auth/Profile API services
export const authAPI = {
  // Get user profile
  getProfile: async () => {
    const response = await api.get("/auth/profile");
    return handleApiResponse(response);
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put("/auth/profile", profileData);
    return handleApiResponse(response);
  },

  // Upload profile image
  uploadProfileImage: async (file) => {
    if (!file) {
      throw new Error("Please select an image to upload");
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/auth/profile/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return handleApiResponse(response);
  },
};

// Fathom API services
export const fathomAPI = {
  // Fetch recent meetings from Fathom
  getMeetings: async (limit = 10) => {
    const response = await api.get(`/fathom/meetings?limit=${limit}`);
    return handleApiResponse(response);
  },
};
