import apiClient from './apiClient.js';

export function fetchGigManagerSnapshot(userId, { signal, fresh = false } = {}) {
  if (!userId) {
    throw new Error('userId is required to load the gig manager snapshot.');
  }

  const params = {};
  if (fresh) {
    params.fresh = 'true';
  }

  return apiClient.get(`/users/${userId}/gig-manager`, { signal, params });
}

export default {
  fetchGigManagerSnapshot,
};
