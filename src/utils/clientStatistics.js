/**
 * Utility function to calculate client statistics from clients array
 * This eliminates the need for a separate /clients/statistics API call
 */

/**
 * Calculate client statistics from an array of clients
 * @param {Array} clients - Array of client objects
 * @returns {Object} Statistics object with counts by status
 */
export const calculateClientStatistics = (clients = []) => {
  if (!Array.isArray(clients)) {
    return {
      total_clients: 0,
      active_clients: 0,
      pre_boarding_clients: 0,
      onboarding_clients: 0,
      assessment_clients: 0,
      paused_clients: 0,
      inactive_clients: 0,
    };
  }

  const stats = {
    total_clients: 0,
    active_clients: 0,
    pre_boarding_clients: 0,
    onboarding_clients: 0,
    assessment_clients: 0,
    paused_clients: 0,
    inactive_clients: 0,
  };

  clients.forEach((client) => {
    const status = client.status?.toLowerCase() || 'inactive';

    // Count all clients in total (including inactive)
    stats.total_clients++;

    switch (status) {
      case 'active':
        stats.active_clients++;
        break;
      case 'pre_boarding':
      case 'pre-boarding':
        stats.pre_boarding_clients++;
        break;
      case 'onboarding':
        stats.onboarding_clients++;
        break;
      case 'assessment':
        stats.assessment_clients++;
        break;
      case 'paused':
        stats.paused_clients++;
        break;
      case 'inactive':
        stats.inactive_clients++;
        break;
      default:
        // For unknown statuses, count as inactive
        stats.inactive_clients++;
        break;
    }
  });

  return stats;
};

