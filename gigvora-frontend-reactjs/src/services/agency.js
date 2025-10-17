import { apiClient } from './apiClient.js';

export async function fetchAgencyDashboard(
  { workspaceSlug, workspaceId, lookbackDays } = {},
  { signal } = {},
) {
  return apiClient.get('/agency/dashboard', {
    params: {
      workspaceSlug: workspaceSlug ?? undefined,
      workspaceId: workspaceId ?? undefined,
      lookbackDays: lookbackDays ?? undefined,
    },
    signal,
  });
}

export async function fetchAgencyCalendar(
  { workspaceSlug, workspaceId, types, status, from, to } = {},
  { signal } = {},
) {
  const typeParam = Array.isArray(types) ? types.filter(Boolean).join(',') : types;
  return apiClient.get('/agency/calendar', {
    params: {
      workspaceSlug: workspaceSlug ?? undefined,
      workspaceId: workspaceId ?? undefined,
      types: typeParam && typeParam.length ? typeParam : undefined,
      status: status ?? undefined,
      from: from ?? undefined,
      to: to ?? undefined,
    },
    signal,
  });
}

export async function fetchAgencyCalendarEvent(eventId, { workspaceSlug, workspaceId } = {}, { signal } = {}) {
  return apiClient.get(`/agency/calendar/${eventId}`, {
    params: {
      workspaceSlug: workspaceSlug ?? undefined,
      workspaceId: workspaceId ?? undefined,
    },
    signal,
  });
}

export async function createAgencyCalendarEvent(payload = {}, { signal } = {}) {
  return apiClient.post('/agency/calendar', payload, { signal });
}

export async function updateAgencyCalendarEvent(eventId, payload = {}, { signal } = {}) {
  return apiClient.put(`/agency/calendar/${eventId}`, payload, { signal });
}

export async function deleteAgencyCalendarEvent(eventId, payload = {}, { signal } = {}) {
  return apiClient.delete(`/agency/calendar/${eventId}`, {
    params: {
      workspaceSlug: payload.workspaceSlug ?? undefined,
      workspaceId: payload.workspaceId ?? undefined,
    },
    signal,
  });
}

export default {
  fetchAgencyDashboard,
  fetchAgencyCalendar,
  fetchAgencyCalendarEvent,
  createAgencyCalendarEvent,
  updateAgencyCalendarEvent,
  deleteAgencyCalendarEvent,
};

