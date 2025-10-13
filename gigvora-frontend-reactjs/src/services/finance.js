import { apiClient } from './apiClient.js';

export async function fetchFreelancerFinanceInsights(freelancerId, { signal } = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to fetch finance insights.');
  }
  return apiClient.get(`/finance/freelancers/${freelancerId}/insights`, { signal });
}

export default {
  fetchFreelancerFinanceInsights,
};
