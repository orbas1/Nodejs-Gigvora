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

  const suggestions =
    source.suggestions ??
    source.recommendations ??
    source.meta?.suggestions ??
    source.data?.suggestions ??
    null;

  const signals = source.liveMoments ?? source.signals ?? null;

  return {
    items,
    nextCursor: nextCursor ?? null,
    nextPage: nextPage ?? null,
    hasMore,
    total,
    suggestions: suggestions ?? (signals ? { liveMoments: signals } : null),
  };
}

export async function listFeedPosts({ signal, params, headers } = {}) {
  const response = await apiClient.get('/feed', {
    signal,
    params,
    headers,
  });
  return normaliseListPayload(response);
}

export async function listFeedComments(postId, { signal, params, headers } = {}) {
  if (!postId) {
    throw new Error('A post identifier is required to list feed comments.');
  }
  const response = await apiClient.get(`/feed/${postId}/comments`, {
    signal,
    params,
    headers,
  });
  return normaliseListPayload(response);
}

export async function createFeedComment(postId, payload = {}, options = {}) {
  if (!postId) {
    throw new Error('A post identifier is required to create a feed comment.');
  }
  if (!payload || typeof payload !== 'object' || !payload.message) {
    throw new Error('A message is required to create a feed comment.');
  }
  const requestBody = { message: payload.message, context: payload.context ?? null };
  return apiClient.post(`/feed/${postId}/comments`, requestBody, options);
}

export async function createFeedReply(postId, commentId, payload = {}, options = {}) {
  if (!postId) {
    throw new Error('A post identifier is required to create a feed reply.');
  }
  if (!commentId) {
    throw new Error('A comment identifier is required to create a feed reply.');
  }
  if (!payload || typeof payload !== 'object' || !payload.message) {
    throw new Error('A message is required to create a feed reply.');
  }
  const requestBody = { message: payload.message, context: payload.context ?? null };
  return apiClient.post(`/feed/${postId}/comments/${commentId}/replies`, requestBody, options);
}

export async function createFeedPost(payload, options = {}) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('A payload is required to create a feed post.');
  }
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

export async function reactToFeedPost(postId, reaction, options = {}) {
  if (!postId) {
    throw new Error('A post identifier is required to react to the feed entry.');
  }
  if (!reaction) {
    throw new Error('A reaction is required to react to the feed entry.');
  }
  const { active = true, ...rest } = options;
  const payload = { reaction, active };
  return apiClient.post(`/feed/${postId}/reactions`, payload, rest);
}

export async function shareFeedPost(postId, payload = {}, options = {}) {
  if (!postId) {
    throw new Error('A post identifier is required to share the feed entry.');
  }
  if (!payload || typeof payload !== 'object') {
    throw new Error('A payload is required to share the feed entry.');
  }
  const body = {
    audience: payload.audience ?? 'internal',
    channel: payload.channel ?? 'copy',
    message: payload.message,
    link: payload.link ?? null,
  };
  return apiClient.post(`/feed/${postId}/shares`, body, options);
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
  shareFeedPost,
};
