import apiClient from './apiClient.js';

function normaliseListPayload(payload) {
  const source = payload ?? {};
  if (Array.isArray(source)) {
    return {
      items: source,
      nextCursor: null,
      nextPage: null,
      hasMore: false,
      total: source.length,
    };
  }

  const items = Array.isArray(source.items)
    ? source.items
    : Array.isArray(source.data)
    ? source.data
    : Array.isArray(source.results)
    ? source.results
    : Array.isArray(source.feed)
    ? source.feed
    : [];

  const meta = source.meta ?? source.pagination ?? {};

  const nextCursor =
    source.nextCursor ??
    meta.nextCursor ??
    (typeof meta.next === 'string' && meta.next ? meta.next : null);

  const nextPage =
    source.nextPage ??
    meta.nextPage ??
    (typeof meta.next === 'number' ? meta.next : null);

  const hasMore =
    typeof source.hasMore === 'boolean'
      ? source.hasMore
      : typeof meta.hasMore === 'boolean'
      ? meta.hasMore
      : Boolean(nextCursor ?? nextPage);

  const total =
    source.total ??
    meta.total ??
    (typeof source.count === 'number' ? source.count : items.length ?? 0);

  return {
    items,
    nextCursor: nextCursor ?? null,
    nextPage: nextPage ?? null,
    hasMore,
    total,
  };
}

export async function listFeedPosts({ signal, params } = {}) {
  const response = await apiClient.get('/feed', { signal, params });
  return normaliseListPayload(response);
}

export async function listFeedComments(postId, { signal, params } = {}) {
  if (!postId) {
    throw new Error('A post identifier is required to list feed comments.');
  }
  const response = await apiClient.get(`/feed/${postId}/comments`, { signal, params });
  return normaliseListPayload(response);
}

export async function createFeedComment(postId, payload = {}, { signal } = {}) {
  if (!postId) {
    throw new Error('A post identifier is required to create a feed comment.');
  }
  if (!payload || typeof payload !== 'object' || !payload.message) {
    throw new Error('A message is required to create a feed comment.');
  }
  return apiClient.post(
    `/feed/${postId}/comments`,
    { message: payload.message, context: payload.context ?? null },
    { signal },
  );
}

export async function createFeedReply(postId, commentId, payload = {}, { signal } = {}) {
  if (!postId) {
    throw new Error('A post identifier is required to create a feed reply.');
  }
  if (!commentId) {
    throw new Error('A comment identifier is required to create a feed reply.');
  }
  if (!payload || typeof payload !== 'object' || !payload.message) {
    throw new Error('A message is required to create a feed reply.');
  }
  return apiClient.post(
    `/feed/${postId}/comments/${commentId}/replies`,
    { message: payload.message, context: payload.context ?? null },
    { signal },
  );
}

export async function createFeedPost(payload, { signal } = {}) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('A payload is required to create a feed post.');
  }
  const response = await apiClient.post('/feed', payload, { signal });
  return response?.data ?? response;
}

export async function updateFeedPost(postId, payload, { signal } = {}) {
  if (!postId) {
    throw new Error('A post identifier is required to update the feed entry.');
  }
  const response = await apiClient.patch(`/feed/${postId}`, payload, { signal });
  return response?.data ?? response;
}

export async function deleteFeedPost(postId, { signal } = {}) {
  if (!postId) {
    throw new Error('A post identifier is required to delete the feed entry.');
  }
  return apiClient.delete(`/feed/${postId}`, { signal });
}

export async function reactToFeedPost(postId, reaction, { active = true, signal } = {}) {
  if (!postId) {
    throw new Error('A post identifier is required to react to the feed entry.');
  }
  if (!reaction) {
    throw new Error('A reaction is required to react to the feed entry.');
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
  listFeedComments,
  createFeedComment,
  createFeedReply,
};
