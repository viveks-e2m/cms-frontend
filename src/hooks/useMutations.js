import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../utils/queryClient';
import {
  clientAPI,
  meetingAPI,
  openPointsAPI,
  workflowAPI,
  secretsAPI,
  n8nAPI,
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
      // Invalidate clients list and statistics
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.statistics() });
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
      // Invalidate specific client, list, and statistics
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(variables.clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.statistics() });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.notes(variables.clientId) });
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
export const useCreateMeeting = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationContext();

  return useMutation({
    mutationFn: ({ clientId, meetingData }) => meetingAPI.create(clientId, meetingData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.list(variables.clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.statistics() });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
      showSuccess('Meeting created successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to create meeting');
    },
  });
};

export const useUpdateMeeting = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationContext();

  return useMutation({
    mutationFn: ({ meetingId, meetingData }) => meetingAPI.update(meetingId, meetingData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.detail(variables.meetingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.all });
      showSuccess('Meeting updated successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to update meeting');
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
      queryClient.invalidateQueries({ queryKey: queryKeys.actionItems.detail(variables.actionItemId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.actionItems.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.actionItems.statistics() });
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
  const { showSuccess, showError, showInfo } = useNotificationContext();

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
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.detail(variables.workflowId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all });
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

