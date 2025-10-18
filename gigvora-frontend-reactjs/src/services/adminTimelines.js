import { apiClient } from './apiClient.js';

export async function fetchAdminTimelines(params = {}) {
  return apiClient.get('/admin/timelines', { params });
}

export async function fetchAdminTimeline(timelineId) {
  if (!timelineId) {
    throw new Error('timelineId is required');
  }
  return apiClient.get(`/admin/timelines/${timelineId}`);
}

export async function createAdminTimeline(payload) {
  return apiClient.post('/admin/timelines', payload);
}

export async function updateAdminTimeline(timelineId, payload) {
  if (!timelineId) {
    throw new Error('timelineId is required');
  }
  return apiClient.put(`/admin/timelines/${timelineId}`, payload);
}

export async function deleteAdminTimeline(timelineId) {
  if (!timelineId) {
    throw new Error('timelineId is required');
  }
  await apiClient.delete(`/admin/timelines/${timelineId}`);
}

export async function createAdminTimelineEvent(timelineId, payload) {
  if (!timelineId) {
    throw new Error('timelineId is required');
  }
  return apiClient.post(`/admin/timelines/${timelineId}/events`, payload);
}

export async function updateAdminTimelineEvent(timelineId, eventId, payload) {
  if (!timelineId || !eventId) {
    throw new Error('timelineId and eventId are required');
  }
  return apiClient.put(`/admin/timelines/${timelineId}/events/${eventId}`, payload);
}

export async function deleteAdminTimelineEvent(timelineId, eventId) {
  if (!timelineId || !eventId) {
    throw new Error('timelineId and eventId are required');
  }
  await apiClient.delete(`/admin/timelines/${timelineId}/events/${eventId}`);
}

export async function reorderAdminTimelineEvents(timelineId, order = []) {
  if (!timelineId) {
    throw new Error('timelineId is required');
  }
  return apiClient.post(`/admin/timelines/${timelineId}/events/reorder`, { order });
}

export default {
  fetchAdminTimelines,
  fetchAdminTimeline,
  createAdminTimeline,
  updateAdminTimeline,
  deleteAdminTimeline,
  createAdminTimelineEvent,
  updateAdminTimelineEvent,
  deleteAdminTimelineEvent,
  reorderAdminTimelineEvents,
};
