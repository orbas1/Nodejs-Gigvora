import apiClient from './apiClient.js';

function normalizeResponse(response) {
  return response?.data ?? response;
}

export async function fetchAutoMatchOverview(freelancerId, { signal } = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required');
  }
  const response = await apiClient.get(`/freelancers/${freelancerId}/auto-match/overview`, { signal });
  return normalizeResponse(response);
}

export async function updateAutoMatchPreferences(freelancerId, payload, { signal } = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required');
  }
  const response = await apiClient.patch(`/freelancers/${freelancerId}/auto-match/preferences`, payload, { signal });
  return normalizeResponse(response)?.preference ?? normalizeResponse(response);
}

export async function fetchAutoMatchMatches(freelancerId, { page, pageSize, statuses, includeHistorical, signal } = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required');
  }
  const response = await apiClient.get(`/freelancers/${freelancerId}/auto-match/matches`, {
    params: {
      page,
      pageSize,
      statuses: Array.isArray(statuses) ? statuses.join(',') : statuses,
      includeHistorical,
    },
    signal,
  });
  return normalizeResponse(response);
}

export async function respondToAutoMatch(freelancerId, entryId, payload, { signal } = {}) {
  if (!freelancerId || !entryId) {
    throw new Error('freelancerId and entryId are required');
  }
  const response = await apiClient.post(
    `/freelancers/${freelancerId}/auto-match/matches/${entryId}/decision`,
    payload,
    { signal },
  );
  return normalizeResponse(response)?.entry ?? normalizeResponse(response);
}

export default {
  fetchAutoMatchOverview,
  updateAutoMatchPreferences,
  fetchAutoMatchMatches,
  respondToAutoMatch,
};
