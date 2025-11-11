import { useQuery } from '@tanstack/react-query';
import { queryKeys, CACHE_TIMES } from '../utils/queryClient';
import { setCache, getCache } from '../utils/cacheStorage';
import { getTTLForQueryKey } from '../utils/queryHelpers';
import {
  clientAPI,
  meetingAPI,
  openPointsAPI,
  workflowAPI,
  secretsAPI,
  n8nAPI,
  momAPI,
} from '../utils/apiServices';

// Helper to create a cached query function
const createCachedQueryFn = (queryFn, queryKey) => {
  return async () => {
    // Try cache first
    const cached = await getCache(queryKey);
    if (cached) {
      // Return cached data immediately, but fetch fresh in background
      queryFn().then(async (freshData) => {
        const ttl = getTTLForQueryKey(queryKey);
        await setCache(queryKey, freshData, ttl);
      }).catch(() => {
        // Ignore background fetch errors
      });
      return cached;
    }
    
    // No cache, fetch and save
    const data = await queryFn();
    const ttl = getTTLForQueryKey(queryKey);
    await setCache(queryKey, data, ttl);
    return data;
  };
};

// Client queries
export const useClients = () => {
  const queryKey = queryKeys.clients.list();
  return useQuery({
    queryKey,
    queryFn: createCachedQueryFn(() => clientAPI.getAll(), queryKey),
    staleTime: CACHE_TIMES.LISTS,
    gcTime: CACHE_TIMES.LISTS_CACHE,
  });
};

export const useClient = (clientId, options = {}) => {
  const queryKey = queryKeys.clients.detail(clientId);
  return useQuery({
    queryKey,
    queryFn: createCachedQueryFn(() => clientAPI.getById(clientId), queryKey),
    enabled: !!clientId && (options.enabled !== false),
    staleTime: CACHE_TIMES.DETAILS,
    gcTime: CACHE_TIMES.DETAILS_CACHE,
  });
};

export const useRecentClients = (limit = 5) => {
  const queryKey = queryKeys.clients.recent(limit);
  return useQuery({
    queryKey,
    queryFn: createCachedQueryFn(() => clientAPI.getRecent(limit), queryKey),
    staleTime: CACHE_TIMES.LISTS,
    gcTime: CACHE_TIMES.LISTS_CACHE,
  });
};

export const useClientStats = () => {
  const queryKey = queryKeys.clients.statistics();
  return useQuery({
    queryKey,
    queryFn: createCachedQueryFn(() => clientAPI.getStatistics(), queryKey),
    staleTime: CACHE_TIMES.STATISTICS,
    gcTime: CACHE_TIMES.STATISTICS_CACHE,
  });
};

export const useClientUsers = (clientId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.clients.users(clientId),
    queryFn: () => clientAPI.getAssignedUsers(clientId),
    enabled: !!clientId && (options.enabled !== false),
    staleTime: CACHE_TIMES.LISTS,
    gcTime: CACHE_TIMES.LISTS_CACHE,
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
    queryFn: createCachedQueryFn(() => clientAPI.getAllUsers(), queryKey),
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

export const useMeetingSummary = (clientId, options = {}) => {
  return useQuery({
    queryKey: [...queryKeys.meetings.list(clientId), 'summary'],
    queryFn: () => meetingAPI.getSummaryByClient(clientId),
    enabled: !!clientId && (options.enabled !== false),
    staleTime: CACHE_TIMES.LISTS,
    gcTime: CACHE_TIMES.LISTS_CACHE,
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

export const useMeetingStats = () => {
  const queryKey = queryKeys.meetings.statistics();
  return useQuery({
    queryKey,
    queryFn: createCachedQueryFn(() => meetingAPI.getStatistics(), queryKey),
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
export const useActionItems = (filters = {}) => {
  const queryKey = queryKeys.actionItems.list(filters);
  return useQuery({
    queryKey,
    queryFn: createCachedQueryFn(() => openPointsAPI.getRecentOptimized(filters), queryKey),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useActionItemsByClient = (clientId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.actionItems.byClient(clientId),
    queryFn: () => openPointsAPI.getByClient(clientId),
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
    queryFn: createCachedQueryFn(() => openPointsAPI.getStatistics(), queryKey),
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
    staleTime: forceRefresh ? 0 : CACHE_TIMES.DETAILS,
    gcTime: CACHE_TIMES.DETAILS_CACHE,
  });
};

export const useN8nExecutions = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.n8n.executions(params),
    queryFn: () => n8nAPI.getExecutions(params),
    staleTime: CACHE_TIMES.STATISTICS,
    gcTime: CACHE_TIMES.STATISTICS_CACHE,
  });
};

export const useN8nWorkflowExecutions = (workflowId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.n8n.workflowExecutions(workflowId),
    queryFn: () => n8nAPI.getWorkflowExecutions(workflowId),
    enabled: !!workflowId && (options.enabled !== false),
    staleTime: CACHE_TIMES.STATISTICS,
    gcTime: CACHE_TIMES.STATISTICS_CACHE,
  });
};

