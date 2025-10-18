import { apiClient } from './apiClient.js';

export function buildUserTimelineUrl(userId, suffix = '') {
  if (!userId) {
    throw new Error('userId is required for user timeline requests.');
  }
  const trimmedSuffix = suffix ? `/${suffix.replace(/^\/+/, '')}` : '';
  return `/users/${userId}/timeline${trimmedSuffix}`;
}

export async function fetchUserTimelineWorkspace(userId, { signal } = {}) {
  return apiClient.get(buildUserTimelineUrl(userId), { signal });
}

export async function updateUserTimelineSettings(userId, settings, options = {}) {
  return apiClient.put(buildUserTimelineUrl(userId, 'settings'), settings, options);
}

export async function createUserTimelineEntry(userId, payload, options = {}) {
  return apiClient.post(buildUserTimelineUrl(userId, 'entries'), payload, options);
}

export async function updateUserTimelineEntry(userId, entryId, payload, options = {}) {
  if (!entryId) {
    throw new Error('entryId is required to update a timeline entry.');
  }
  return apiClient.put(buildUserTimelineUrl(userId, `entries/${entryId}`), payload, options);
}

export async function deleteUserTimelineEntry(userId, entryId, options = {}) {
  if (!entryId) {
    throw new Error('entryId is required to delete a timeline entry.');
  }
  return apiClient.delete(buildUserTimelineUrl(userId, `entries/${entryId}`), options);
}

export async function createUserTimelinePost(userId, payload, options = {}) {
  return apiClient.post(buildUserTimelineUrl(userId, 'posts'), payload, options);
}

export async function updateUserTimelinePost(userId, postId, payload, options = {}) {
  if (!postId) {
    throw new Error('postId is required to update a timeline post.');
  }
  return apiClient.put(buildUserTimelineUrl(userId, `posts/${postId}`), payload, options);
}

export async function deleteUserTimelinePost(userId, postId, options = {}) {
  if (!postId) {
    throw new Error('postId is required to delete a timeline post.');
  }
  return apiClient.delete(buildUserTimelineUrl(userId, `posts/${postId}`), options);
}

export async function publishUserTimelinePost(userId, postId, payload = {}, options = {}) {
  if (!postId) {
    throw new Error('postId is required to publish a timeline post.');
  }
  return apiClient.post(buildUserTimelineUrl(userId, `posts/${postId}/publish`), payload, options);
}

export async function recordUserTimelinePostMetrics(userId, postId, payload, options = {}) {
  if (!postId) {
    throw new Error('postId is required to record post metrics.');
  }
  return apiClient.post(buildUserTimelineUrl(userId, `posts/${postId}/metrics`), payload, options);
}

export default {
  fetchUserTimelineWorkspace,
  updateUserTimelineSettings,
  createUserTimelineEntry,
  updateUserTimelineEntry,
  deleteUserTimelineEntry,
  createUserTimelinePost,
  updateUserTimelinePost,
  deleteUserTimelinePost,
  publishUserTimelinePost,
  recordUserTimelinePostMetrics,
};
