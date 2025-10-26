import apiClient from './apiClient.js';

export function fetchCommunityCalendar(params = {}, { signal } = {}) {
  return apiClient
    .get('/community/events', {
      params,
      signal,
    })
    .then((response) => response.data);
}

export function fetchCommunityEvent(eventId, { signal, timezone } = {}) {
  if (!eventId) {
    throw new Error('eventId is required to load the community event.');
  }
  return apiClient
    .get(`/community/events/${eventId}`, {
      params: timezone ? { timezone } : undefined,
      signal,
    })
    .then((response) => response.data);
}

export function fetchVolunteerRoster(params = {}, { signal } = {}) {
  return apiClient
    .get('/community/volunteers', {
      params,
      signal,
    })
    .then((response) => response.data);
}

export default {
  fetchCommunityCalendar,
  fetchCommunityEvent,
  fetchVolunteerRoster,
};
