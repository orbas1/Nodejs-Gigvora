import { apiClient } from './apiClient.js';

export async function fetchTimelineSnapshot({ workspaceId, lookbackDays, signal } = {}) {
  const params = {};
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    params.workspaceId = workspaceId;
  }
  if (lookbackDays != null) {
    params.lookbackDays = lookbackDays;
  }
  return apiClient.get('/company/dashboard/timeline', { params, signal });
}

export async function createTimelineEvent({ workspaceId, ...payload }) {
  return apiClient.post('/company/dashboard/timeline/events', { workspaceId, ...payload });
}

export async function updateTimelineEvent(eventId, { workspaceId, ...payload }) {
  return apiClient.patch(`/company/dashboard/timeline/events/${eventId}`, { workspaceId, ...payload });
}

export async function deleteTimelineEvent(eventId, { workspaceId }) {
  return apiClient.delete(`/company/dashboard/timeline/events/${eventId}`, {
    body: { workspaceId },
  });
}

export async function createTimelinePost({ workspaceId, ...payload }) {
  return apiClient.post('/company/dashboard/timeline/posts', { workspaceId, ...payload });
}

export async function updateTimelinePost(postId, { workspaceId, ...payload }) {
  return apiClient.patch(`/company/dashboard/timeline/posts/${postId}`, { workspaceId, ...payload });
}

export async function changeTimelinePostStatus(postId, { workspaceId, ...payload }) {
  return apiClient.post(`/company/dashboard/timeline/posts/${postId}/status`, {
    workspaceId,
    ...payload,
  });
}

export async function deleteTimelinePost(postId, { workspaceId }) {
  return apiClient.delete(`/company/dashboard/timeline/posts/${postId}`, {
    body: { workspaceId },
  });
}

export async function recordTimelinePostMetrics(postId, { workspaceId, ...payload }) {
  return apiClient.post(`/company/dashboard/timeline/posts/${postId}/metrics`, {
    workspaceId,
    ...payload,
  });
}

export default {
  fetchTimelineSnapshot,
  createTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
  createTimelinePost,
  updateTimelinePost,
  changeTimelinePostStatus,
  deleteTimelinePost,
  recordTimelinePostMetrics,
};
