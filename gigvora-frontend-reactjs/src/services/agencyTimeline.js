import { apiClient } from './apiClient.js';

export function buildTimelineQuery(params = {}) {
  const query = {};
  if (params.workspaceId != null && `${params.workspaceId}`.length > 0) {
    query.workspaceId = params.workspaceId;
  }
  if (params.workspaceSlug != null && `${params.workspaceSlug}`.length > 0) {
    query.workspaceSlug = params.workspaceSlug;
  }
  if (params.lookbackDays != null) {
    query.lookbackDays = params.lookbackDays;
  }
  if (params.status != null && `${params.status}`.length > 0) {
    query.status = params.status;
  }
  if (params.search != null && `${params.search}`.length > 0) {
    query.search = params.search;
  }
  if (params.limit != null) {
    query.limit = params.limit;
  }
  if (params.offset != null) {
    query.offset = params.offset;
  }
  return query;
}

export async function fetchAgencyTimelineDashboard({ workspaceId, workspaceSlug, lookbackDays, signal } = {}) {
  return apiClient.get('/agency/timeline/dashboard', {
    params: buildTimelineQuery({ workspaceId, workspaceSlug, lookbackDays }),
    signal,
  });
}

export async function fetchAgencyTimelinePosts({
  workspaceId,
  workspaceSlug,
  status,
  search,
  limit,
  offset,
  lookbackDays,
  signal,
} = {}) {
  return apiClient.get('/agency/timeline/posts', {
    params: buildTimelineQuery({ workspaceId, workspaceSlug, status, search, limit, offset, lookbackDays }),
    signal,
  });
}

export async function fetchAgencyTimelinePost(postId, { signal } = {}) {
  return apiClient.get(`/agency/timeline/posts/${postId}`, { signal });
}

export async function createAgencyTimelinePost(body, { signal } = {}) {
  return apiClient.post('/agency/timeline/posts', body, { signal });
}

export async function updateAgencyTimelinePost(postId, body, { signal } = {}) {
  return apiClient.put(`/agency/timeline/posts/${postId}`, body, { signal });
}

export async function updateAgencyTimelinePostStatus(postId, body, { signal } = {}) {
  return apiClient.patch(`/agency/timeline/posts/${postId}/status`, body, { signal });
}

export async function deleteAgencyTimelinePost(postId, { signal } = {}) {
  return apiClient.delete(`/agency/timeline/posts/${postId}`, { signal });
}

export async function fetchAgencyTimelinePostAnalytics(postId, { lookbackDays, signal } = {}) {
  return apiClient.get(`/agency/timeline/posts/${postId}/analytics`, {
    params: buildTimelineQuery({ lookbackDays }),
    signal,
  });
}

export default {
  fetchAgencyTimelineDashboard,
  fetchAgencyTimelinePosts,
  fetchAgencyTimelinePost,
  createAgencyTimelinePost,
  updateAgencyTimelinePost,
  updateAgencyTimelinePostStatus,
  deleteAgencyTimelinePost,
  fetchAgencyTimelinePostAnalytics,
};
