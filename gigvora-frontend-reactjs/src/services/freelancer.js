import { apiClient } from './apiClient.js';

export async function fetchFreelancerDashboard(freelancerId, { signal } = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to load the freelancer dashboard.');
  }

  return apiClient.get('/freelancer/dashboard', {
    signal,
    params: { freelancerId },
  });
}

export default {
  fetchFreelancerDashboard,
};

