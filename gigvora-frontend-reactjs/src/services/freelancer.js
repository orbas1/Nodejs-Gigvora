import { apiClient } from './apiClient.js';

export async function fetchFreelancerDashboard({ freelancerId, limit } = {}, options = {}) {
  return apiClient.get('/freelancer/dashboard', {
    params: {
      freelancerId: freelancerId ?? undefined,
      limit: limit ?? undefined,
    },
    signal: options.signal,
  });
}

export async function createFreelancerGig(payload, options = {}) {
  return apiClient.post('/freelancer/gigs', payload, options);
}

export async function updateFreelancerGig(gigId, payload, options = {}) {
  return apiClient.put(`/freelancer/gigs/${gigId}`, payload, options);
}

export async function publishFreelancerGig(gigId, payload = {}, options = {}) {
  return apiClient.post(`/freelancer/gigs/${gigId}/publish`, payload, options);
}

export async function getFreelancerGig(gigId, options = {}) {
  return apiClient.get(`/freelancer/gigs/${gigId}`, options);
}

export default {
  fetchFreelancerDashboard,
  createFreelancerGig,
  updateFreelancerGig,
  publishFreelancerGig,
  getFreelancerGig,
export async function fetchFreelancerPurchasedGigWorkspace(freelancerId, { signal, fresh = false } = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to load purchased gigs workspace.');
  }
  const params = fresh ? { fresh: 'true' } : undefined;
  return apiClient.get(`/freelancers/${freelancerId}/purchased-gigs`, { signal, params });
}

export default {
  fetchFreelancerPurchasedGigWorkspace,
};
