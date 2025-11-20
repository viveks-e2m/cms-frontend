import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../utils/queryClient';
import {
  clientAPI,
  meetingAPI,
  openPointsAPI,
  workflowAPI,
  secretsAPI,
  momAPI,
} from '../utils/apiServices';
import { useNotificationContext } from '../contexts/NotificationContext';

// Client mutations
export const useCreateClient = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationContext();

  return useMutation({
    mutationFn: (clientData) => clientAPI.create(clientData),
    onSuccess: () => {
      // Invalidate all client-related queries and force refetch
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.clients.all,
        refetchType: 'active' 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.clients.statistics(),
        refetchType: 'active' 
      });
      showSuccess('Client created successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to create client');
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationContext();

  return useMutation({
    mutationFn: ({ clientId, clientData }) => clientAPI.update(clientId, clientData),
    onSuccess: (data, variables) => {
      // Optimistically update the client detail cache with the returned data
      if (data) {
        queryClient.setQueryData(queryKeys.clients.detail(variables.clientId), data);
        
        // Also update the client in all list caches
        queryClient.setQueriesData(
          { queryKey: queryKeys.clients.all, exact: false },
          (oldData) => {
            if (!oldData) return oldData;
            
            // Handle array of clients (list queries)
            if (Array.isArray(oldData)) {
              return oldData.map((client) =>
                client.id === variables.clientId ? { ...client, ...data } : client
              );
            }
            
            return oldData;
          }
        );
      }
      
      // Invalidate all related queries to ensure UI updates (forces refetch of active queries)
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.clients.detail(variables.clientId),
        refetchType: 'active' 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.clients.lists(),
        refetchType: 'active' 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.clients.all,
        refetchType: 'active' 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.clients.statistics(),
        refetchType: 'active' 
      });
      showSuccess('Client updated successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to update client');
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationContext();

  return useMutation({
    mutationFn: (clientId) => clientAPI.delete(clientId),
    onSuccess: () => {
      // Invalidate all client-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.statistics() });
      showSuccess('Client deleted successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to delete client');
    },
  });
};

export const useUpdateClientNotes = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationContext();

  return useMutation({
    mutationFn: ({ clientId, notes }) => clientAPI.updateNotes(clientId, notes),
    onSuccess: (data, variables) => {
      // Optimistically update the notes cache
      if (data) {
        queryClient.setQueryData(queryKeys.clients.notes(variables.clientId), data);
      }
      
      // Invalidate related queries and force refetch
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.clients.notes(variables.clientId),
        refetchType: 'active' 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.clients.detail(variables.clientId),
        refetchType: 'active' 
      });
      showSuccess('Notes updated successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to update notes');
    },
  });
};

export const useAssignUserToClient = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationContext();

  return useMutation({
    mutationFn: ({ clientId, userData }) => clientAPI.assignUser(clientId, userData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.users(variables.clientId) });
      showSuccess('User assigned successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to assign user');
    },
  });
};

export const useRemoveUserFromClient = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationContext();

  return useMutation({
    mutationFn: ({ clientId, userId }) => clientAPI.removeUserAssignment(clientId, userId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.users(variables.clientId) });
      showSuccess('User removed successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to remove user');
    },
  });
};

// Meeting mutations
export const useCreateMeeting = (options = {}) => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationContext();
  const { suppressNotifications = false } = options;

  return useMutation({
    mutationFn: ({ clientId, meetingData }) => meetingAPI.create(clientId, meetingData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.list(variables.clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.statistics() });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
      if (!suppressNotifications) {
        showSuccess('Meeting created successfully');
      }
    },
    onError: (error) => {
      if (!suppressNotifications) {
        showError(error.message || 'Failed to create meeting');
      }
    },
  });
};

export const useUpdateMeeting = (options = {}) => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationContext();
  const { suppressNotifications = false } = options;

  return useMutation({
    mutationFn: ({ meetingId, meetingData }) => meetingAPI.update(meetingId, meetingData),
    onSuccess: (data, variables) => {
      // Optimistically update the meeting detail cache
      if (data) {
        queryClient.setQueryData(queryKeys.meetings.detail(variables.meetingId), data);
      }
      
      // Invalidate all related queries and force refetch
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.meetings.detail(variables.meetingId),
        refetchType: 'active' 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.meetings.all,
        refetchType: 'active' 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.meetings.statistics(),
        refetchType: 'active' 
      });
      if (!suppressNotifications) {
        showSuccess('Meeting updated successfully');
      }
    },
    onError: (error) => {
      if (!suppressNotifications) {
        showError(error.message || 'Failed to update meeting');
      }
    },
  });
};

export const useDeleteMeeting = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationContext();

  return useMutation({
    mutationFn: (meetingId) => meetingAPI.delete(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.statistics() });
      showSuccess('Meeting deleted successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to delete meeting');
    },
  });
};

export const useAddMeetingNote = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationContext();

  return useMutation({
    mutationFn: ({ meetingId, noteData }) => meetingAPI.addNote(meetingId, noteData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.notes(variables.meetingId) });
      showSuccess('Note added successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to add note');
    },
  });
};

export const useSaveMoM = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationContext();

  return useMutation({
    mutationFn: ({ meetingId, momData }) => momAPI.save(meetingId, momData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.mom(variables.meetingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.detail(variables.meetingId) });
      showSuccess('Minutes of Meeting saved successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to save MoM');
    },
  });
};

export const useUpdateMoM = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationContext();

  return useMutation({
    mutationFn: ({ meetingId, momData }) => momAPI.update(meetingId, momData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.mom(variables.meetingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.detail(variables.meetingId) });
      showSuccess('Minutes of Meeting updated successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to update MoM');
    },
  });
};

// Action Items mutations
export const useCreateActionItem = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationContext();

  return useMutation({
    mutationFn: (actionItemData) => openPointsAPI.createManual(actionItemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.actionItems.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.actionItems.statistics() });
      showSuccess('Action item created successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to create action item');
    },
  });
};

export const useUpdateActionItem = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationContext();

  return useMutation({
    mutationFn: ({ actionItemId, statusData }) => openPointsAPI.updateStatus(actionItemId, statusData),
    onSuccess: (data, variables) => {
      // Optimistically update the action item cache
      if (data) {
        queryClient.setQueryData(queryKeys.actionItems.detail(variables.actionItemId), data);
      }
      
      // Invalidate all related queries and force refetch
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.actionItems.detail(variables.actionItemId),
        refetchType: 'active' 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.actionItems.all,
        refetchType: 'active' 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.actionItems.statistics(),
        refetchType: 'active' 
      });
      showSuccess('Action item updated successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to update action item');
    },
  });
};

export const useDeleteActionItem = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationContext();

  return useMutation({
    mutationFn: (actionItemId) => openPointsAPI.delete(actionItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.actionItems.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.actionItems.statistics() });
      showSuccess('Action item deleted successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to delete action item');
    },
  });
};

export const useGenerateActionItems = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationContext();

  return useMutation({
    mutationFn: (meetingId) => openPointsAPI.generateFromMeeting(meetingId),
    onSuccess: (data, meetingId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.actionItems.byMeeting(meetingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.actionItems(meetingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.actionItems.all });
      showSuccess('Action items generated successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to generate action items');
    },
  });
};

// Workflow mutations
export const useCreateWorkflow = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationContext();

  return useMutation({
    mutationFn: ({ clientId, workflowData }) => workflowAPI.create(clientId, workflowData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.list(variables.clientId) });
      showSuccess('Workflow created successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to create workflow');
    },
  });
};

export const useUpdateWorkflow = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationContext();

  return useMutation({
    mutationFn: ({ workflowId, statusData }) => workflowAPI.updateStatus(workflowId, statusData),
    onSuccess: (data, variables) => {
      // Optimistically update the workflow cache
      if (data) {
        queryClient.setQueryData(queryKeys.workflows.detail(variables.workflowId), data);
      }
      
      // Invalidate all related queries and force refetch
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.workflows.detail(variables.workflowId),
        refetchType: 'active' 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.workflows.all,
        refetchType: 'active' 
      });
      showSuccess('Workflow updated successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to update workflow');
    },
  });
};

export const useDeleteWorkflow = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationContext();

  return useMutation({
    mutationFn: (workflowId) => workflowAPI.delete(workflowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all });
      showSuccess('Workflow deleted successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to delete workflow');
    },
  });
};

// Secrets mutations
export const useCreateSecret = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationContext();

  return useMutation({
    mutationFn: ({ clientId, secretData }) => secretsAPI.create(clientId, secretData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.secrets.list(variables.clientId) });
      showSuccess('Secret created successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to create secret');
    },
  });
};

export const useDeleteSecret = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationContext();

  return useMutation({
    mutationFn: (secretId) => secretsAPI.delete(secretId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.secrets.all });
      showSuccess('Secret deleted successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to delete secret');
    },
  });
};

