/**
 * Data Prefetching Service
 * Prefetches all relevant API data on first login and stores in cache
 */

import { queryClient, queryKeys } from './queryClient';
import {
  clientAPI,
  meetingAPI,
  openPointsAPI,
  workflowAPI,
  secretsAPI,
  n8nAPI,
} from './apiServices';
import { setCache } from './cacheStorage';

/**
 * Prefetch all dashboard data
 */
const prefetchDashboardData = async (onProgress) => {
  const tasks = [
    {
      name: 'Recent Clients',
      fn: async () => {
        const data = await clientAPI.getRecent(6);
        await setCache(queryKeys.clients.recent(6), data, 60 * 24); // 24 hours
        queryClient.setQueryData(queryKeys.clients.recent(6), data);
        return data;
      },
    },
    {
      name: 'Client Statistics',
      fn: async () => {
        const data = await clientAPI.getStatistics();
        await setCache(queryKeys.clients.statistics(), data, 60 * 2); // 2 hours
        queryClient.setQueryData(queryKeys.clients.statistics(), data);
        return data;
      },
    },
    {
      name: 'Meeting Statistics',
      fn: async () => {
        const data = await meetingAPI.getStatistics();
        await setCache(queryKeys.meetings.statistics(), data, 60 * 2); // 2 hours
        queryClient.setQueryData(queryKeys.meetings.statistics(), data);
        return data;
      },
    },
    {
      name: 'Action Item Statistics',
      fn: async () => {
        const data = await openPointsAPI.getStatistics();
        await setCache(queryKeys.actionItems.statistics(), data, 60 * 2); // 2 hours
        queryClient.setQueryData(queryKeys.actionItems.statistics(), data);
        return data;
      },
    },
  ];

  return executeTasks(tasks, onProgress);
};

/**
 * Prefetch all clients data
 */
const prefetchClientsData = async (onProgress) => {
  const tasks = [
    {
      name: 'All Clients',
      fn: async () => {
        const data = await clientAPI.getAll();
        await setCache(queryKeys.clients.list(), data, 60 * 12); // 12 hours
        queryClient.setQueryData(queryKeys.clients.list(), data);
        return data;
      },
    },
    {
      name: 'All Users',
      fn: async () => {
        const data = await clientAPI.getAllUsers();
        await setCache(queryKeys.users.list(), data, 60 * 24); // 24 hours
        queryClient.setQueryData(queryKeys.users.list(), data);
        return data;
      },
    },
  ];

  return executeTasks(tasks, onProgress);
};

/**
 * Prefetch action items data
 */
const prefetchActionItemsData = async (onProgress) => {
  const tasks = [
    {
      name: 'Recent Action Items',
      fn: async () => {
        const data = await openPointsAPI.getRecentOptimized({});
        await setCache(queryKeys.actionItems.list({}), data, 60 * 3); // 3 hours
        queryClient.setQueryData(queryKeys.actionItems.list({}), data);
        return data;
      },
    },
  ];

  return executeTasks(tasks, onProgress);
};

/**
 * Prefetch N8N workflows data
 */
const prefetchN8nData = async (onProgress) => {
  const tasks = [
    {
      name: 'N8N Workflows',
      fn: async () => {
        const data = await n8nAPI.getWorkflows({});
        await setCache(queryKeys.n8n.workflows({}), data, 60 * 6); // 6 hours
        queryClient.setQueryData(queryKeys.n8n.workflows({}), data);
        return data;
      },
    },
  ];

  return executeTasks(tasks, onProgress);
};

/**
 * Execute tasks with progress tracking
 */
const executeTasks = async (tasks, onProgress) => {
  const results = [];
  const totalTasks = tasks.length;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    try {
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: totalTasks,
          percentage: Math.round(((i + 1) / totalTasks) * 100),
          message: `Loading ${task.name}...`,
        });
      }

      const result = await task.fn();
      results.push({ name: task.name, success: true, data: result });
    } catch (error) {
      console.error(`Error prefetching ${task.name}:`, error);
      results.push({ name: task.name, success: false, error: error.message });
    }
  }

  return results;
};

/**
 * Prefetch all relevant data on first login
 */
export const prefetchAllData = async (onProgress) => {
  const allTasks = [
    {
      name: 'Dashboard Data',
      tasks: [
        {
          name: 'Recent Clients',
          fn: async () => {
            const data = await clientAPI.getRecent(6);
            await setCache(queryKeys.clients.recent(6), data, 60 * 24);
            queryClient.setQueryData(queryKeys.clients.recent(6), data);
            return data;
          },
        },
        {
          name: 'Client Statistics',
          fn: async () => {
            const data = await clientAPI.getStatistics();
            await setCache(queryKeys.clients.statistics(), data, 60 * 2);
            queryClient.setQueryData(queryKeys.clients.statistics(), data);
            return data;
          },
        },
        {
          name: 'Meeting Statistics',
          fn: async () => {
            const data = await meetingAPI.getStatistics();
            await setCache(queryKeys.meetings.statistics(), data, 60 * 2);
            queryClient.setQueryData(queryKeys.meetings.statistics(), data);
            return data;
          },
        },
        {
          name: 'Action Item Statistics',
          fn: async () => {
            const data = await openPointsAPI.getStatistics();
            await setCache(queryKeys.actionItems.statistics(), data, 60 * 2);
            queryClient.setQueryData(queryKeys.actionItems.statistics(), data);
            return data;
          },
        },
      ],
    },
    {
      name: 'Clients & Users',
      tasks: [
        {
          name: 'All Clients',
          fn: async () => {
            const data = await clientAPI.getAll();
            await setCache(queryKeys.clients.list(), data, 60 * 12);
            queryClient.setQueryData(queryKeys.clients.list(), data);
            return data;
          },
        },
        {
          name: 'All Users',
          fn: async () => {
            const data = await clientAPI.getAllUsers();
            await setCache(queryKeys.users.list(), data, 60 * 24);
            queryClient.setQueryData(queryKeys.users.list(), data);
            return data;
          },
        },
      ],
    },
    {
      name: 'Action Items',
      tasks: [
        {
          name: 'Recent Action Items',
          fn: async () => {
            const data = await openPointsAPI.getRecentOptimized({});
            await setCache(queryKeys.actionItems.list({}), data, 60 * 3);
            queryClient.setQueryData(queryKeys.actionItems.list({}), data);
            return data;
          },
        },
      ],
    },
    {
      name: 'N8N Workflows',
      tasks: [
        {
          name: 'N8N Workflows',
          fn: async () => {
            const data = await n8nAPI.getWorkflows({});
            await setCache(queryKeys.n8n.workflows({}), data, 60 * 6);
            queryClient.setQueryData(queryKeys.n8n.workflows({}), data);
            return data;
          },
        },
      ],
    },
  ];

  const allTaskList = allTasks.flatMap(group => group.tasks);
  const results = await executeTasks(allTaskList, onProgress);

  return {
    success: results.every(r => r.success),
    results: results,
    total: allTaskList.length,
    successful: results.filter(r => r.success).length,
  };
};

/**
 * Prefetch data for specific client (when client is selected)
 */
export const prefetchClientData = async (clientId, onProgress) => {
  const tasks = [
    {
      name: 'Client Details',
      fn: async () => {
        const data = await clientAPI.getById(clientId);
        await setCache(queryKeys.clients.detail(clientId), data, 60 * 12);
        queryClient.setQueryData(queryKeys.clients.detail(clientId), data);
        return data;
      },
    },
    {
      name: 'Client Meetings',
      fn: async () => {
        const data = await meetingAPI.getByClient(clientId, true);
        await setCache(queryKeys.meetings.list(clientId), data, 60 * 6);
        queryClient.setQueryData(queryKeys.meetings.list(clientId), data);
        return data;
      },
    },
    {
      name: 'Client Action Items',
      fn: async () => {
        const data = await openPointsAPI.getByClient(clientId);
        await setCache(queryKeys.actionItems.byClient(clientId), data, 60 * 6);
        queryClient.setQueryData(queryKeys.actionItems.byClient(clientId), data);
        return data;
      },
    },
    {
      name: 'Client Workflows',
      fn: async () => {
        const data = await workflowAPI.getByClient(clientId);
        await setCache(queryKeys.workflows.list(clientId), data, 60 * 12);
        queryClient.setQueryData(queryKeys.workflows.list(clientId), data);
        return data;
      },
    },
    {
      name: 'Client Secrets',
      fn: async () => {
        const data = await secretsAPI.getByClient(clientId);
        await setCache(queryKeys.secrets.list(clientId), data, 60 * 12);
        queryClient.setQueryData(queryKeys.secrets.list(clientId), data);
        return data;
      },
    },
  ];

  return executeTasks(tasks, onProgress);
};

export default {
  prefetchAllData,
  prefetchClientData,
  prefetchDashboardData,
  prefetchClientsData,
  prefetchActionItemsData,
  prefetchN8nData,
};

