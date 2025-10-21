import apiClient from './apiClient.js';

function sanitiseParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

function ensureEventId(eventId) {
  if (!eventId) {
    throw new Error('eventId is required for moderation actions.');
  }
  return eventId;
}

export async function fetchModerationOverview(params = {}, { signal } = {}) {
  return apiClient.get('/admin/moderation/overview', { params: sanitiseParams(params), signal });
}

export async function fetchModerationQueue(params = {}, { signal } = {}) {
  return apiClient.get('/admin/moderation/queue', { params: sanitiseParams(params), signal });
}

export async function fetchModerationEvents(params = {}, { signal } = {}) {
  return apiClient.get('/admin/moderation/events', { params: sanitiseParams(params), signal });
}

export async function resolveModerationEvent(eventId, payload = {}, { signal } = {}) {
  ensureEventId(eventId);
  if (!payload.resolution || !payload.resolution.status) {
    throw new Error('resolution status is required to resolve a moderation event.');
  }
  return apiClient.post(`/admin/moderation/events/${eventId}/resolve`, payload, { signal });
}

export default {
  fetchModerationOverview,
  fetchModerationQueue,
  fetchModerationEvents,
  resolveModerationEvent,
};
