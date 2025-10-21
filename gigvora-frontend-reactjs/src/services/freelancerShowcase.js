import apiClient from './apiClient.js';

function buildCacheKey(freelancerId) {
  return `freelancer:showcase:${freelancerId}`;
}

export async function fetchFreelancerShowcase(freelancerId, { signal, fresh = false } = {}) {
  if (!freelancerId) {
    throw new Error('Freelancer identifier is required to load the showcase.');
  }
  const params = fresh ? { fresh: 'true' } : undefined;
  return apiClient.get(`/freelancers/${freelancerId}/showcase`, { signal, params });
}

export async function updateFreelancerShowcaseModule(freelancerId, moduleId, payload) {
  if (!freelancerId || !moduleId) {
    throw new Error('Freelancer and module identifiers are required to update the showcase.');
  }
  const data = await apiClient.put(`/freelancers/${freelancerId}/showcase/modules/${moduleId}`, payload);
  apiClient.removeCache(buildCacheKey(freelancerId));
  return data;
}

export async function reorderFreelancerShowcaseModules(freelancerId, order) {
  if (!freelancerId) {
    throw new Error('Freelancer identifier is required to reorder showcase modules.');
  }
  const data = await apiClient.post(`/freelancers/${freelancerId}/showcase/modules/reorder`, { order });
  apiClient.removeCache(buildCacheKey(freelancerId));
  return data;
}

export async function updateFreelancerShowcaseHero(freelancerId, payload) {
  if (!freelancerId) {
    throw new Error('Freelancer identifier is required to update the showcase hero.');
  }
  const data = await apiClient.put(`/freelancers/${freelancerId}/showcase/hero`, payload);
  apiClient.removeCache(buildCacheKey(freelancerId));
  return data;
}

export default {
  fetchFreelancerShowcase,
  updateFreelancerShowcaseModule,
  reorderFreelancerShowcaseModules,
  updateFreelancerShowcaseHero,
};
