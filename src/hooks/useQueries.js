import { useQuery } from '@tanstack/react-query';
import { queryKeys, CACHE_TIMES, queryClient } from '../utils/queryClient';
import { calculateClientStatistics } from '../utils/clientStatistics';
import {
  clientAPI,
  meetingAPI,
  openPointsAPI,
  workflowAPI,
  secretsAPI,
  n8nAPI,
  momAPI,
} from '../utils/apiServices';

// Client queries
export const useClients = () => {
  const queryKey = queryKeys.clients.list();
  return useQuery({
    queryKey,
    queryFn: () => clientAPI.getAll(),
    staleTime: CACHE_TIMES.LISTS,
    gcTime: CACHE_TIMES.LISTS_CACHE,
  });
};

export const useClient = (clientId, options = {}) => {
  const queryKey = queryKeys.clients.detail(clientId);
  return useQuery({
    queryKey,
    queryFn: () => clientAPI.getById(clientId),
    enabled: !!clientId && (options.enabled !== false),
    staleTime: CACHE_TIMES.DETAILS,
    gcTime: CACHE_TIMES.DETAILS_CACHE,
  });
};

export const useClientOverview = (clientId, options = {}) => {
  const {
    enabled = true,
    actionItemsPageSize = 20,
  } = options;

  return useQuery({
    queryKey: queryKeys.clients.overview(clientId, actionItemsPageSize),
    queryFn: () =>
      clientAPI.getOverview(clientId, {
        action_items_page_size: actionItemsPageSize,
      }),
    enabled: !!clientId && enabled,
    staleTime: CACHE_TIMES.DETAILS,
    gcTime: CACHE_TIMES.DETAILS_CACHE,
  });
};

export const useRecentClients = (limit = 5) => {
  // Use the same query as useClients to share cache
  const queryKey = queryKeys.clients.list();
  return useQuery({
    queryKey,
    queryFn: () => clientAPI.getAll(), // Fetch all clients
    select: (allClients) => {
      // Filter out inactive clients first, then sort and take limit
      const recentClients = Array.isArray(allClients)
        ? [...allClients]
            .filter(client => client.status?.toLowerCase() !== 'inactive') // Filter inactive first
            .sort((a, b) => {
              const dateA = new Date(a.created_at || 0);
              const dateB = new Date(b.created_at || 0);
              return dateB - dateA; // Descending order (newest first)
            })
            .slice(0, limit) // Take limit after filtering
        : [];
      
      // Return in the same format as the old API response
      return {
        recent_clients: recentClients,
        total_clients: Array.isArray(allClients) ? allClients.length : 0,
      };
    },
    staleTime: CACHE_TIMES.LISTS,
    gcTime: CACHE_TIMES.LISTS_CACHE,
  });
};

export const useClientStats = () => {
  // First load clients to ensure data is available
  const { data: clientsData, isLoading: clientsLoading } = useClients();
  
  // Use a separate query key for statistics but derive from clients
  return useQuery({
    queryKey: queryKeys.clients.statistics(),
    queryFn: async () => {
      // Get clients from cache or use the data we have
      const clients = clientsData || queryClient.getQueryData(queryKeys.clients.list());
      
      // If still no data, fetch it
      if (!clients || !Array.isArray(clients)) {
        const fetched = await clientAPI.getAll();
        queryClient.setQueryData(queryKeys.clients.list(), fetched);
        return calculateClientStatistics(Array.isArray(fetched) ? fetched : []);
      }
      
      // Calculate statistics
      if (!Array.isArray(clients)) {
        console.warn('Clients data is not an array:', typeof clients, clients);
        return calculateClientStatistics([]);
      }
      
      const stats = calculateClientStatistics(clients);
      console.log('Calculated client statistics:', stats, 'from', clients.length, 'clients');
      return stats;
    },
    enabled: !clientsLoading, // Only run when clients are loaded
    staleTime: CACHE_TIMES.STATISTICS,
    gcTime: CACHE_TIMES.STATISTICS_CACHE,
  });
};

export const useClientUsers = (clientId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.clients.users(clientId),
    queryFn: () => clientAPI.getAssignedUsers(clientId),
    enabled: !!clientId && (options.enabled !== false),
    staleTime: CACHE_TIMES.USERS,
    gcTime: CACHE_TIMES.USERS_CACHE,
  });
};

export const useClientNotes = (clientId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.clients.notes(clientId),
    queryFn: () => clientAPI.getNotes(clientId),
    enabled: !!clientId && (options.enabled !== false),
    staleTime: CACHE_TIMES.DETAILS,
    gcTime: CACHE_TIMES.DETAILS_CACHE,
  });
};

// User queries
export const useUsers = () => {
  const queryKey = queryKeys.users.list();
  return useQuery({
    queryKey,
    queryFn: () => clientAPI.getAllUsers(),
    staleTime: CACHE_TIMES.USERS,
    gcTime: CACHE_TIMES.USERS_CACHE,
  });
};

// Meeting queries
export const useMeetings = (clientId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.meetings.list(clientId),
    queryFn: () => meetingAPI.getByClient(clientId),
    enabled: !!clientId && (options.enabled !== false),
    staleTime: CACHE_TIMES.LISTS,
    gcTime: CACHE_TIMES.LISTS_CACHE,
  });
};

export const useMeetingsDirectory = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.meetings.search(filters),
    queryFn: () => meetingAPI.searchAll(filters),
    keepPreviousData: true,
    staleTime: CACHE_TIMES.LISTS,
    gcTime: CACHE_TIMES.LISTS_CACHE,
    ...options,
  });
};

export const useMeeting = (meetingId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.meetings.detail(meetingId),
    queryFn: () => meetingAPI.getById(meetingId),
    enabled: !!meetingId && (options.enabled !== false),
    staleTime: CACHE_TIMES.DETAILS,
    gcTime: CACHE_TIMES.DETAILS_CACHE,
  });
};

export const useMeetingTranscript = (meetingId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.meetings.transcript(meetingId),
    queryFn: () => meetingAPI.getTranscript(meetingId),
    enabled: !!meetingId && (options.enabled !== false),
    staleTime: CACHE_TIMES.DETAILS,
    gcTime: CACHE_TIMES.DETAILS_CACHE,
    ...options,
  });
};

export const useMeetingStats = () => {
  const queryKey = queryKeys.meetings.statistics();
  return useQuery({
    queryKey,
    queryFn: () => meetingAPI.getStatistics(),
    staleTime: CACHE_TIMES.STATISTICS,
    gcTime: CACHE_TIMES.STATISTICS_CACHE,
  });
};

export const useMeetingNotes = (meetingId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.meetings.notes(meetingId),
    queryFn: () => meetingAPI.getNotes(meetingId),
    enabled: !!meetingId && (options.enabled !== false),
    staleTime: CACHE_TIMES.DETAILS,
    gcTime: CACHE_TIMES.DETAILS_CACHE,
  });
};

export const useMeetingActionItems = (meetingId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.meetings.actionItems(meetingId),
    queryFn: () => openPointsAPI.getByMeeting(meetingId),
    enabled: !!meetingId && (options.enabled !== false),
    staleTime: CACHE_TIMES.LISTS,
    gcTime: CACHE_TIMES.LISTS_CACHE,
  });
};

export const useMoM = (meetingId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.meetings.mom(meetingId),
    queryFn: () => momAPI.getByMeetingId(meetingId),
    enabled: !!meetingId && (options.enabled !== false),
    staleTime: CACHE_TIMES.DETAILS,
    gcTime: CACHE_TIMES.DETAILS_CACHE,
  });
};

// Action Items queries
export const useActionItems = (filters = {}, options = {}) => {
  const queryKey = queryKeys.actionItems.list(filters);
  return useQuery({
    queryKey,
    queryFn: () => openPointsAPI.getRecentOptimized(filters),
    staleTime: CACHE_TIMES.LISTS,
    gcTime: CACHE_TIMES.LISTS_CACHE,
    ...options,
  });
};

export const useActionItemsByClient = (clientId, filters = {}, options = {}) => {
  const queryKey = queryKeys.actionItems.byClient(clientId, filters);
  return useQuery({
    queryKey,
    queryFn: () => openPointsAPI.getByClientPaginated(clientId, filters),
    enabled: !!clientId && (options.enabled !== false),
    staleTime: CACHE_TIMES.LISTS,
    gcTime: CACHE_TIMES.LISTS_CACHE,
  });
};

export const useActionItemsByMeeting = (meetingId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.actionItems.byMeeting(meetingId),
    queryFn: () => openPointsAPI.getByMeeting(meetingId),
    enabled: !!meetingId && (options.enabled !== false),
    staleTime: CACHE_TIMES.LISTS,
    gcTime: CACHE_TIMES.LISTS_CACHE,
  });
};

export const useActionItem = (actionItemId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.actionItems.detail(actionItemId),
    queryFn: () => openPointsAPI.getById(actionItemId),
    enabled: !!actionItemId && (options.enabled !== false),
    staleTime: CACHE_TIMES.DETAILS,
    gcTime: CACHE_TIMES.DETAILS_CACHE,
  });
};

export const useActionItemStats = () => {
  const queryKey = queryKeys.actionItems.statistics();
  return useQuery({
    queryKey,
    queryFn: () => openPointsAPI.getStatistics(),
    staleTime: CACHE_TIMES.STATISTICS,
    gcTime: CACHE_TIMES.STATISTICS_CACHE,
  });
};

// Workflow queries
export const useWorkflows = (clientId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.workflows.list(clientId),
    queryFn: () => workflowAPI.getByClient(clientId),
    enabled: !!clientId && (options.enabled !== false),
    staleTime: CACHE_TIMES.LISTS,
    gcTime: CACHE_TIMES.LISTS_CACHE,
  });
};

export const useWorkflow = (workflowId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.workflows.detail(workflowId),
    queryFn: () => workflowAPI.getById(workflowId),
    enabled: !!workflowId && (options.enabled !== false),
    staleTime: CACHE_TIMES.DETAILS,
    gcTime: CACHE_TIMES.DETAILS_CACHE,
  });
};

// Secrets queries
export const useSecrets = (clientId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.secrets.list(clientId),
    queryFn: () => secretsAPI.getByClient(clientId),
    enabled: !!clientId && (options.enabled !== false),
    staleTime: CACHE_TIMES.LISTS,
    gcTime: CACHE_TIMES.LISTS_CACHE,
  });
};

export const useSecret = (secretId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.secrets.detail(secretId),
    queryFn: () => secretsAPI.getById(secretId),
    enabled: !!secretId && (options.enabled !== false),
    staleTime: CACHE_TIMES.DETAILS,
    gcTime: CACHE_TIMES.DETAILS_CACHE,
  });
};

// N8N queries
export const useN8nWorkflows = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.n8n.workflows(params),
    queryFn: () => n8nAPI.getWorkflows(params),
    staleTime: CACHE_TIMES.LISTS,
    gcTime: CACHE_TIMES.LISTS_CACHE,
  });
};

export const useN8nWorkflow = (workflowId, forceRefresh = false) => {
  return useQuery({
    queryKey: queryKeys.n8n.workflow(workflowId, forceRefresh),
    queryFn: () => n8nAPI.getWorkflowDetails(workflowId, forceRefresh),
    enabled: !!workflowId,
    staleTime: forceRefresh ? 0 : CACHE_TIMES.DETAILS, // No cache if force refresh
    gcTime: CACHE_TIMES.DETAILS_CACHE,
  });
};

export const useN8nExecutions = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.n8n.executions(params),
    queryFn: () => n8nAPI.getExecutions(params),
    staleTime: CACHE_TIMES.LISTS,
    gcTime: CACHE_TIMES.LISTS_CACHE,
  });
};

export const useN8nWorkflowExecutions = (workflowId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.n8n.workflowExecutions(workflowId),
    queryFn: () => n8nAPI.getWorkflowExecutions(workflowId),
    enabled: !!workflowId && (options.enabled !== false),
    staleTime: CACHE_TIMES.LISTS,
    gcTime: CACHE_TIMES.LISTS_CACHE,
  });
};


