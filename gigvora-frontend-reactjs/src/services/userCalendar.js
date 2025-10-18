import { apiClient } from './apiClient.js';

function buildCalendarPath(userId, suffix = '') {
  const base = `/users/${userId}/calendar`;
  if (!suffix) {
    return base;
  }
  return `${base}${suffix.startsWith('/') ? suffix : `/${suffix}`}`;
}

export function fetchCalendarOverview(userId, { from, to, limit } = {}, options = {}) {
  return apiClient.get(buildCalendarPath(userId, '/overview'), {
    params: { from, to, limit },
    ...options,
  });
}

export function fetchCalendarEvents(userId, { from, to, limit } = {}, options = {}) {
  return apiClient.get(buildCalendarPath(userId, '/events'), {
    params: { from, to, limit },
    ...options,
  });
}

export function createCalendarEvent(userId, payload, options = {}) {
  return apiClient.post(buildCalendarPath(userId, '/events'), payload, options);
}

export function updateCalendarEvent(userId, eventId, payload, options = {}) {
  return apiClient.put(buildCalendarPath(userId, `/events/${eventId}`), payload, options);
}

export function deleteCalendarEvent(userId, eventId, options = {}) {
  return apiClient.delete(buildCalendarPath(userId, `/events/${eventId}`), options);
}

export function fetchFocusSessions(userId, { limit } = {}, options = {}) {
  return apiClient.get(buildCalendarPath(userId, '/focus-sessions'), {
    params: { limit },
    ...options,
  });
}

export function createFocusSession(userId, payload, options = {}) {
  return apiClient.post(buildCalendarPath(userId, '/focus-sessions'), payload, options);
}

export function updateFocusSession(userId, focusSessionId, payload, options = {}) {
  return apiClient.put(buildCalendarPath(userId, `/focus-sessions/${focusSessionId}`), payload, options);
}

export function deleteFocusSession(userId, focusSessionId, options = {}) {
  return apiClient.delete(buildCalendarPath(userId, `/focus-sessions/${focusSessionId}`), options);
}

export function fetchCalendarSettings(userId, options = {}) {
  return apiClient.get(buildCalendarPath(userId, '/settings'), options);
}

export function updateCalendarSettings(userId, payload, options = {}) {
  return apiClient.put(buildCalendarPath(userId, '/settings'), payload, options);
}

export default {
  fetchCalendarOverview,
  fetchCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  fetchFocusSessions,
  createFocusSession,
  updateFocusSession,
  deleteFocusSession,
  fetchCalendarSettings,
  updateCalendarSettings,
};
