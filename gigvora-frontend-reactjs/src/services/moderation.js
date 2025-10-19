import apiClient from './apiClient.js';

export async function fetchModerationOverview(params = {}) {
  const response = await apiClient.get('/admin/moderation/overview', { params });
  return response;
}

export async function fetchModerationQueue(params = {}) {
  const response = await apiClient.get('/admin/moderation/queue', { params });
  return response;
}

export async function fetchModerationEvents(params = {}) {
  const response = await apiClient.get('/admin/moderation/events', { params });
  return response;
}

export async function resolveModerationEvent(eventId, payload = {}) {
  const response = await apiClient.post(`/admin/moderation/events/${eventId}/resolve`, payload);
  return response;
}

export default {
  fetchModerationOverview,
  fetchModerationQueue,
  fetchModerationEvents,
  resolveModerationEvent,
};
