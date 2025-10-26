import { apiClient } from './apiClient.js';

function assertUserId(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }
  return userId;
}

export function fetchUserQuickActions(userId, { signal, fresh = false } = {}) {
  const id = assertUserId(userId);
  const params = {};
  if (fresh) {
    params.fresh = 'true';
  }
  return apiClient.get(`/users/${id}/quick-actions`, { signal, params });
}

export default {
  fetchUserQuickActions,
};
