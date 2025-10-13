import { apiClient } from './apiClient.js';

export async function fetchFreelancerAllianceDashboard(freelancerId, { signal, force = false } = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to fetch alliance dashboard data.');
  }
  const params = {};
  if (force) {
    params.fresh = 'true';
  }
  return apiClient.get(`/users/${freelancerId}/alliances`, { signal, params });
}

export default {
  fetchFreelancerAllianceDashboard,
};
