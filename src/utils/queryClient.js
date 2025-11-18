import { QueryClient } from '@tanstack/react-query';

// Cache times in milliseconds
export const CACHE_TIMES = {
  STATISTICS: 5 * 60 * 1000, // 5 minutes
  STATISTICS_CACHE: 10 * 60 * 1000, // 10 minutes
  LISTS: 2 * 60 * 1000, // 2 minutes
  LISTS_CACHE: 5 * 60 * 1000, // 5 minutes
  DETAILS: 5 * 60 * 1000, // 5 minutes
  DETAILS_CACHE: 10 * 60 * 1000, // 10 minutes
  USERS: 5 * 60 * 1000, // 5 minutes
  USERS_CACHE: 10 * 60 * 1000, // 10 minutes
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
    overview: (clientId, actionItemsPageSize = 20) => [
      ...queryKeys.clients.all,
      'overview',
      clientId,
      actionItemsPageSize,
    ],
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
    transcript: (id) => [...queryKeys.meetings.details(), 'transcript', id],
    statistics: () => [...queryKeys.meetings.all, 'statistics'],
    notes: (meetingId) => [...queryKeys.meetings.all, 'notes', meetingId],
    actionItems: (meetingId) => [...queryKeys.meetings.all, 'action-items', meetingId],
    mom: (meetingId) => [...queryKeys.meetings.all, 'mom', meetingId],
  },
  actionItems: {
    all: ['action-items'],
    lists: () => [...queryKeys.actionItems.all, 'list'],
    list: (filters) => [...queryKeys.actionItems.lists(), filters],
    details: () => [...queryKeys.actionItems.all, 'detail'],
    detail: (id) => [...queryKeys.actionItems.details(), id],
    statistics: () => [...queryKeys.actionItems.all, 'statistics'],
    byClient: (clientId, filters) => [...queryKeys.actionItems.all, 'byClient', clientId, filters],
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
      refetchOnWindowFocus: false, // Prevent refetch on window focus to reduce duplicate calls
      refetchOnReconnect: true,
      retry: 2,
      staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh for 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes - keep unused data in cache for 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

