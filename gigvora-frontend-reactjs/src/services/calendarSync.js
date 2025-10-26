import apiClient from './apiClient.js';

export function fetchCalendarSyncStatus(userId, { signal } = {}) {
  if (!userId) {
    throw new Error('userId is required to load calendar sync status.');
  }
  return apiClient.get(`/users/${userId}/calendar/sync`, { signal });
}

export function triggerCalendarSync(userId) {
  if (!userId) {
    throw new Error('userId is required to trigger calendar sync.');
  }
  return apiClient.post(`/users/${userId}/calendar/sync/refresh`);
}

export default {
  fetchCalendarSyncStatus,
  triggerCalendarSync,
};
