import { apiClient } from './apiClient.js';

export async function fetchCatalogInsights(freelancerId, { signal } = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to load catalog insights.');
  }
  return apiClient.get(`/users/${freelancerId}/catalog-insights`, { signal });
}

export default {
  fetchCatalogInsights,
};
