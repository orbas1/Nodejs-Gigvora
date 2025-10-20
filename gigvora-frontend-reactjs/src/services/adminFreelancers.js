import { apiClient } from './apiClient.js';

export function listAdminFreelancers(params = {}, options = {}) {
  return apiClient.get('/admin/freelancers', { params, ...options });
}

export function fetchAdminFreelancerStats(options = {}) {
  return apiClient.get('/admin/freelancers/stats', options);
}

export function createAdminFreelancer(payload = {}, options = {}) {
  return apiClient.post('/admin/freelancers', payload, options);
}

export function updateAdminFreelancer(freelancerId, payload = {}, options = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required');
  }
  return apiClient.put(`/admin/freelancers/${freelancerId}`, payload, options);
}

export function archiveAdminFreelancer(freelancerId, options = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required');
  }
  return apiClient.delete(`/admin/freelancers/${freelancerId}`, options);
}

export function reactivateAdminFreelancer(freelancerId, options = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required');
  }
  return apiClient.post(`/admin/freelancers/${freelancerId}/reactivate`, {}, options);
}

export function sendAdminFreelancerInvite(freelancerId, payload = {}, options = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required');
  }
  return apiClient.post(`/admin/freelancers/${freelancerId}/invite`, payload, options);
}

export default {
  listAdminFreelancers,
  fetchAdminFreelancerStats,
  createAdminFreelancer,
  updateAdminFreelancer,
  archiveAdminFreelancer,
  reactivateAdminFreelancer,
  sendAdminFreelancerInvite,
};
