/**
 * Utility functions for action item status handling
 */

/**
 * Get display name for status
 * @param {string} status - The status value (open, in_progress, completed)
 * @returns {string} - The display name
 */
export const getStatusDisplayName = (status) => {
  switch (status) {
    case 'open':
      return 'To Do';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Done';
    default:
      return 'To Do';
  }
};

/**
 * Get all status options for dropdowns
 * @returns {Array} - Array of status options with value and label
 */
export const getStatusOptions = () => [
  { value: 'open', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Done' }
];