import apiClient from './apiClient.js';

export async function listFeedPosts({ signal, params } = {}) {
  return apiClient.get('/feed', { signal, params });
}

export async function createFeedPost(payload, options = {}) {
  const response = await apiClient.post('/feed', payload, options);
  return response?.data ?? response;
}

export async function updateFeedPost(postId, payload, options = {}) {
  if (!postId) {
    throw new Error('A post identifier is required to update the feed entry.');
  }
  const response = await apiClient.patch(`/feed/${postId}`, payload, options);
  return response?.data ?? response;
}

export async function deleteFeedPost(postId, options = {}) {
  if (!postId) {
    throw new Error('A post identifier is required to delete the feed entry.');
  }
  return apiClient.delete(`/feed/${postId}`, options);
}

export async function reactToFeedPost(postId, reaction, { active = true, signal } = {}) {
  if (!postId) {
    throw new Error('A post identifier is required to react to the feed entry.');
  }
  const payload = { reaction, active };
  return apiClient.post(`/feed/${postId}/reactions`, payload, { signal });
}

export default {
  listFeedPosts,
  createFeedPost,
  updateFeedPost,
  deleteFeedPost,
  reactToFeedPost,
};
