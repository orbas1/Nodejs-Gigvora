import { apiClient } from './apiClient.js';

export async function fetchAdminCalendarConsole(params = {}) {
  const response = await apiClient.get('/admin/calendar', { params });
  return response;
}

export async function createAdminCalendarAccount(payload = {}) {
  return apiClient.post('/admin/calendar/accounts', payload);
}

export async function updateAdminCalendarAccount(accountId, payload = {}) {
  if (!accountId) {
    throw new Error('accountId is required');
  }
  return apiClient.put(`/admin/calendar/accounts/${accountId}`, payload);
}

export async function deleteAdminCalendarAccount(accountId) {
  if (!accountId) {
    throw new Error('accountId is required');
  }
  return apiClient.delete(`/admin/calendar/accounts/${accountId}`);
}

export async function updateAdminCalendarAvailability(accountId, payload = {}) {
  if (!accountId) {
    throw new Error('accountId is required');
  }
  return apiClient.put(`/admin/calendar/accounts/${accountId}/availability`, payload);
}

export async function createAdminCalendarTemplate(payload = {}) {
  return apiClient.post('/admin/calendar/templates', payload);
}

export async function updateAdminCalendarTemplate(templateId, payload = {}) {
  if (!templateId) {
    throw new Error('templateId is required');
  }
  return apiClient.put(`/admin/calendar/templates/${templateId}`, payload);
}

export async function deleteAdminCalendarTemplate(templateId) {
  if (!templateId) {
    throw new Error('templateId is required');
  }
  return apiClient.delete(`/admin/calendar/templates/${templateId}`);
}

export async function createAdminCalendarEvent(payload = {}) {
  return apiClient.post('/admin/calendar/events', payload);
}

export async function updateAdminCalendarEvent(eventId, payload = {}) {
  if (!eventId) {
    throw new Error('eventId is required');
  }
  return apiClient.put(`/admin/calendar/events/${eventId}`, payload);
}

export async function deleteAdminCalendarEvent(eventId) {
  if (!eventId) {
    throw new Error('eventId is required');
  }
  return apiClient.delete(`/admin/calendar/events/${eventId}`);
}

export default {
  fetchAdminCalendarConsole,
  createAdminCalendarAccount,
  updateAdminCalendarAccount,
  deleteAdminCalendarAccount,
  updateAdminCalendarAvailability,
  createAdminCalendarTemplate,
  updateAdminCalendarTemplate,
  deleteAdminCalendarTemplate,
  createAdminCalendarEvent,
  updateAdminCalendarEvent,
  deleteAdminCalendarEvent,
};
