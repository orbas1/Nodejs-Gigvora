import { apiClient } from './apiClient.js';

function serializeTypes(types) {
  if (!types || !types.length) {
    return undefined;
  }
  return types.join(',');
}

export async function fetchCompanyCalendar({ workspaceId, from, to, types, limit, search, signal } = {}) {
  if (!workspaceId) {
    throw new Error('workspaceId is required to load company calendar events.');
  }
  const params = {
    workspaceId,
    from,
    to,
    limit,
    search,
  };
  const serializedTypes = serializeTypes(types);
  if (serializedTypes) {
    params.types = serializedTypes;
  }
  return apiClient.get('/company/calendar/events', { params, signal });
}

export async function createCompanyCalendarEvent(payload) {
  return apiClient.post('/company/calendar/events', payload);
}

export async function updateCompanyCalendarEvent(eventId, payload) {
  if (!eventId) {
    throw new Error('eventId is required to update a calendar event.');
  }
  return apiClient.patch(`/company/calendar/events/${eventId}`, payload);
}

export async function deleteCompanyCalendarEvent(eventId) {
  if (!eventId) {
    throw new Error('eventId is required to delete a calendar event.');
  }
  return apiClient.delete(`/company/calendar/events/${eventId}`);
}

export default {
  fetchCompanyCalendar,
  createCompanyCalendarEvent,
  updateCompanyCalendarEvent,
  deleteCompanyCalendarEvent,
};
