import apiClient from './apiClient.js';

function buildCacheKey(freelancerId) {
  return `freelancer:project-lab:${freelancerId}`;
}

export async function fetchProjectBlueprints(freelancerId, params = {}, { signal, fresh = false } = {}) {
  if (!freelancerId) {
    throw new Error('Freelancer identifier is required to load project blueprints.');
  }
  const query = { ...params };
  if (fresh) {
    query.fresh = 'true';
  }
  return apiClient.get(`/freelancers/${freelancerId}/project-blueprints`, { signal, params: query });
}

export async function createProjectBlueprint(freelancerId, payload = {}) {
  if (!freelancerId) {
    throw new Error('Freelancer identifier is required to create a blueprint.');
  }
  const data = await apiClient.post(`/freelancers/${freelancerId}/project-blueprints`, payload);
  apiClient.removeCache(buildCacheKey(freelancerId));
  return data;
}

export async function duplicateProjectBlueprint(freelancerId, blueprintId, payload = {}) {
  if (!freelancerId || !blueprintId) {
    throw new Error('Freelancer and blueprint identifiers are required to duplicate a blueprint.');
  }
  const data = await apiClient.post(
    `/freelancers/${freelancerId}/project-blueprints/${blueprintId}/duplicate`,
    payload,
  );
  apiClient.removeCache(buildCacheKey(freelancerId));
  return data;
}

export async function archiveProjectBlueprint(freelancerId, blueprintId) {
  if (!freelancerId || !blueprintId) {
    throw new Error('Freelancer and blueprint identifiers are required to archive a blueprint.');
  }
  const data = await apiClient.post(
    `/freelancers/${freelancerId}/project-blueprints/${blueprintId}/archive`,
    {},
  );
  apiClient.removeCache(buildCacheKey(freelancerId));
  return data;
}

export default {
  fetchProjectBlueprints,
  createProjectBlueprint,
  duplicateProjectBlueprint,
  archiveProjectBlueprint,
};
