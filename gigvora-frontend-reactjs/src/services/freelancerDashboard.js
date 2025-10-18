import { apiClient } from './apiClient.js';

function assertFreelancerId(freelancerId) {
  if (!freelancerId) {
    throw new Error('freelancerId is required');
  }
  return freelancerId;
}

export function fetchFreelancerDashboardOverview(freelancerId) {
  const id = assertFreelancerId(freelancerId);
  return apiClient.get(`/freelancers/${id}/dashboard-overview`);
}

export function saveFreelancerDashboardOverview(freelancerId, payload) {
  const id = assertFreelancerId(freelancerId);
  return apiClient.put(`/freelancers/${id}/dashboard-overview`, payload ?? {});
}

export default {
  fetchFreelancerDashboardOverview,
  saveFreelancerDashboardOverview,
};
