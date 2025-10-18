import { apiClient } from './apiClient.js';

export function buildTimelineUrl(freelancerId, suffix = '') {
  if (!freelancerId) {
    throw new Error('freelancerId is required for freelancer timeline requests.');
  }
  const trimmedSuffix = suffix ? `/${suffix.replace(/^\/+/, '')}` : '';
  return `/freelancers/${freelancerId}/timeline${trimmedSuffix}`;
}

export async function fetchFreelancerTimelineWorkspace(freelancerId, { signal } = {}) {
  return apiClient.get(buildTimelineUrl(freelancerId), { signal });
}

export async function updateFreelancerTimelineSettings(freelancerId, settings, options = {}) {
  return apiClient.put(buildTimelineUrl(freelancerId, 'settings'), settings, options);
}

export async function createFreelancerTimelineEntry(freelancerId, payload, options = {}) {
  return apiClient.post(buildTimelineUrl(freelancerId, 'entries'), payload, options);
}

export async function updateFreelancerTimelineEntry(freelancerId, entryId, payload, options = {}) {
  if (!entryId) {
    throw new Error('entryId is required to update a timeline entry.');
  }
  return apiClient.put(buildTimelineUrl(freelancerId, `entries/${entryId}`), payload, options);
}

export async function deleteFreelancerTimelineEntry(freelancerId, entryId, options = {}) {
  if (!entryId) {
    throw new Error('entryId is required to delete a timeline entry.');
  }
  return apiClient.delete(buildTimelineUrl(freelancerId, `entries/${entryId}`), options);
}

export async function createFreelancerTimelinePost(freelancerId, payload, options = {}) {
  return apiClient.post(buildTimelineUrl(freelancerId, 'posts'), payload, options);
}

export async function updateFreelancerTimelinePost(freelancerId, postId, payload, options = {}) {
  if (!postId) {
    throw new Error('postId is required to update a timeline post.');
  }
  return apiClient.put(buildTimelineUrl(freelancerId, `posts/${postId}`), payload, options);
}

export async function deleteFreelancerTimelinePost(freelancerId, postId, options = {}) {
  if (!postId) {
    throw new Error('postId is required to delete a timeline post.');
  }
  return apiClient.delete(buildTimelineUrl(freelancerId, `posts/${postId}`), options);
}

export async function publishFreelancerTimelinePost(freelancerId, postId, payload = {}, options = {}) {
  if (!postId) {
    throw new Error('postId is required to publish a timeline post.');
  }
  return apiClient.post(buildTimelineUrl(freelancerId, `posts/${postId}/publish`), payload, options);
}

export async function recordFreelancerTimelinePostMetrics(freelancerId, postId, payload, options = {}) {
  if (!postId) {
    throw new Error('postId is required to record post metrics.');
  }
  return apiClient.post(buildTimelineUrl(freelancerId, `posts/${postId}/metrics`), payload, options);
}

export default {
  fetchFreelancerTimelineWorkspace,
  updateFreelancerTimelineSettings,
  createFreelancerTimelineEntry,
  updateFreelancerTimelineEntry,
  deleteFreelancerTimelineEntry,
  createFreelancerTimelinePost,
  updateFreelancerTimelinePost,
  deleteFreelancerTimelinePost,
  publishFreelancerTimelinePost,
  recordFreelancerTimelinePostMetrics,
};
