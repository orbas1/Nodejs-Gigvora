import { apiClient } from './apiClient.js';

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
