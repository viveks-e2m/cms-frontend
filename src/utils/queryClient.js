import { QueryClient } from '@tanstack/react-query';
import { getCache } from './cacheStorage';

// Cache time constants (in milliseconds)
export const CACHE_TIMES = {
  STATISTICS: 2 * 60 * 1000,      // 2 minutes staleTime
  STATISTICS_CACHE: 5 * 60 * 1000, // 5 minutes cacheTime
  LISTS: 5 * 60 * 1000,            // 5 minutes staleTime
  LISTS_CACHE: 10 * 60 * 1000,     // 10 minutes cacheTime
  DETAILS: 10 * 60 * 1000,         // 10 minutes staleTime
  DETAILS_CACHE: 30 * 60 * 1000,   // 30 minutes cacheTime
  USERS: 10 * 60 * 1000,            // 10 minutes staleTime
  USERS_CACHE: 15 * 60 * 1000,     // 15 minutes cacheTime
};

// Query keys factory for consistent cache key management
export const queryKeys = {
  clients: {
    all: ['clients'],
    lists: () => [...queryKeys.clients.all, 'list'],
    list: (filters) => [...queryKeys.clients.lists(), { filters }],
    details: () => [...queryKeys.clients.all, 'detail'],
    detail: (id) => [...queryKeys.clients.details(), id],
    recent: (limit) => [...queryKeys.clients.all, 'recent', limit],
    statistics: () => [...queryKeys.clients.all, 'statistics'],
    users: (clientId) => [...queryKeys.clients.all, 'users', clientId],
    meetings: (clientId) => [...queryKeys.clients.all, 'meetings', clientId],
    workflows: (clientId) => [...queryKeys.clients.all, 'workflows', clientId],
    secrets: (clientId) => [...queryKeys.clients.all, 'secrets', clientId],
    notes: (clientId) => [...queryKeys.clients.all, 'notes', clientId],
  },
  users: {
    all: ['users'],
    lists: () => [...queryKeys.users.all, 'list'],
    list: () => [...queryKeys.users.lists()],
  },
  meetings: {
    all: ['meetings'],
    lists: () => [...queryKeys.meetings.all, 'list'],
    list: (clientId) => [...queryKeys.meetings.lists(), clientId],
    details: () => [...queryKeys.meetings.all, 'detail'],
    detail: (id) => [...queryKeys.meetings.details(), id],
    statistics: () => [...queryKeys.meetings.all, 'statistics'],
    notes: (meetingId) => [...queryKeys.meetings.all, 'notes', meetingId],
    actionItems: (meetingId) => [...queryKeys.meetings.all, 'action-items', meetingId],
    mom: (meetingId) => [...queryKeys.meetings.all, 'mom', meetingId],
  },
  actionItems: {
    all: ['actionItems'],
    lists: () => [...queryKeys.actionItems.all, 'list'],
    list: (filters) => [...queryKeys.actionItems.lists(), filters],
    details: () => [...queryKeys.actionItems.all, 'detail'],
    detail: (id) => [...queryKeys.actionItems.details(), id],
    statistics: () => [...queryKeys.actionItems.all, 'statistics'],
    byClient: (clientId) => [...queryKeys.actionItems.all, 'client', clientId],
    byMeeting: (meetingId) => [...queryKeys.actionItems.all, 'meeting', meetingId],
  },
  workflows: {
    all: ['workflows'],
    lists: () => [...queryKeys.workflows.all, 'list'],
    list: (clientId) => [...queryKeys.workflows.lists(), clientId],
    details: () => [...queryKeys.workflows.all, 'detail'],
    detail: (id) => [...queryKeys.workflows.details(), id],
  },
  secrets: {
    all: ['secrets'],
    lists: () => [...queryKeys.secrets.all, 'list'],
    list: (clientId) => [...queryKeys.secrets.lists(), clientId],
    details: () => [...queryKeys.secrets.all, 'detail'],
    detail: (id) => [...queryKeys.secrets.details(), id],
  },
  n8n: {
    all: ['n8n'],
    workflows: (params) => [...queryKeys.n8n.all, 'workflows', params],
    workflow: (id, forceRefresh) => [...queryKeys.n8n.all, 'workflow', id, forceRefresh],
    executions: (params) => [...queryKeys.n8n.all, 'executions', params],
    workflowExecutions: (workflowId) => [...queryKeys.n8n.all, 'workflow-executions', workflowId],
  },
};

// Create QueryClient with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 2,
      staleTime: CACHE_TIMES.LISTS, // Default to 5 minutes
      gcTime: CACHE_TIMES.LISTS_CACHE, // Garbage collection time (previously cacheTime)
    },
    mutations: {
      retry: 1,
    },
  },
});

// Hydrate query client from persistent cache on initialization
export const hydrateQueryClient = async () => {
  try {
    // Common query keys to hydrate
    const commonQueries = [
      queryKeys.clients.recent(6),
      queryKeys.clients.statistics(),
      queryKeys.clients.list(),
      queryKeys.meetings.statistics(),
      queryKeys.actionItems.statistics(),
      queryKeys.actionItems.list({}),
      queryKeys.users.list(),
      queryKeys.n8n.workflows({}),
    ];

    for (const queryKey of commonQueries) {
      try {
        const cachedData = await getCache(queryKey);
        if (cachedData) {
          queryClient.setQueryData(queryKey, cachedData);
        }
      } catch (error) {
        // Ignore errors for individual cache entries
        console.debug('Error hydrating cache for', queryKey, error);
      }
    }
  } catch (error) {
    console.error('Error hydrating query client:', error);
  }
};

// Initialize hydration
if (typeof window !== 'undefined') {
  hydrateQueryClient();
}

