import apiClient from './apiClient.js';

function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
      .filter(([, value]) =>
        typeof value === 'number' || typeof value === 'boolean' || (typeof value === 'string' && value.length > 0),
      ),
  );
}

function ensureId(value, message) {
  if (value === undefined || value === null || `${value}`.trim().length === 0) {
    throw new Error(message);
  }
  return typeof value === 'string' ? value.trim() : value;
}

function serialiseBoolean(value) {
  return value ? 'true' : undefined;
}

function serialiseDate(value) {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return `${value}`;
}

export function fetchBlogPosts(
  { page = 1, pageSize = 9, status, category, tag, search, includeUnpublished = false } = {},
  { signal } = {},
) {
  const params = cleanParams({
    page,
    pageSize,
    status,
    category,
    tag,
    search,
    includeUnpublished: serialiseBoolean(includeUnpublished),
  });
  return apiClient.get('/blog/posts', { params, signal });
}

export function fetchBlogPost(slug, { signal, includeUnpublished = false } = {}) {
  const resolvedSlug = ensureId(slug, 'A blog identifier is required.');
  const params = cleanParams({ includeUnpublished: serialiseBoolean(includeUnpublished) });
  return apiClient.get(`/blog/posts/${resolvedSlug}`, { params, signal });
}

export async function fetchBlogCategories({ signal } = {}) {
  const data = await apiClient.get('/blog/categories', { signal });
  return data?.results ?? [];
}

export async function fetchBlogTags({ signal } = {}) {
  const data = await apiClient.get('/blog/tags', { signal });
  return data?.results ?? [];
}

export function fetchAdminBlogPosts(
  { page = 1, pageSize = 20, status, category, tag, search } = {},
  { signal } = {},
) {
  const params = cleanParams({
    page,
    pageSize,
    status,
    category,
    tag,
    search,
    includeUnpublished: 'true',
  });
  return apiClient.get('/admin/blog/posts', { params, signal });
}

export function fetchAdminBlogPost(postId, { signal } = {}) {
  const resolvedId = ensureId(postId, 'A blog post id is required.');
  return apiClient.get(`/admin/blog/posts/${resolvedId}`, { signal });
}

export function createAdminBlogPost(payload = {}, { signal } = {}) {
  return apiClient.post('/admin/blog/posts', payload, { signal });
}

export function updateAdminBlogPost(postId, payload = {}, { signal } = {}) {
  const resolvedId = ensureId(postId, 'A blog post id is required.');
  return apiClient.put(`/admin/blog/posts/${resolvedId}`, payload, { signal });
}

export function deleteAdminBlogPost(postId, { signal } = {}) {
  const resolvedId = ensureId(postId, 'A blog post id is required.');
  return apiClient.delete(`/admin/blog/posts/${resolvedId}`, { signal });
}

export function createBlogCategory(payload = {}, { signal } = {}) {
  if (!payload.name || `${payload.name}`.trim().length === 0) {
    throw new Error('A category name is required.');
  }
  return apiClient.post('/admin/blog/categories', payload, { signal });
}

export function updateBlogCategory(categoryId, payload = {}, { signal } = {}) {
  const resolvedId = ensureId(categoryId, 'A category id is required.');
  if (payload.name != null && `${payload.name}`.trim().length === 0) {
    throw new Error('Category name cannot be empty.');
  }
  return apiClient.put(`/admin/blog/categories/${resolvedId}`, payload, { signal });
}

export function deleteBlogCategory(categoryId, { signal } = {}) {
  const resolvedId = ensureId(categoryId, 'A category id is required.');
  return apiClient.delete(`/admin/blog/categories/${resolvedId}`, { signal });
}

export function createBlogTag(payload = {}, { signal } = {}) {
  if (!payload.name || `${payload.name}`.trim().length === 0) {
    throw new Error('A tag name is required.');
  }
  return apiClient.post('/admin/blog/tags', payload, { signal });
}

export function updateBlogTag(tagId, payload = {}, { signal } = {}) {
  const resolvedId = ensureId(tagId, 'A tag id is required.');
  if (payload.name != null && `${payload.name}`.trim().length === 0) {
    throw new Error('Tag name cannot be empty.');
  }
  return apiClient.put(`/admin/blog/tags/${resolvedId}`, payload, { signal });
}

export function deleteBlogTag(tagId, { signal } = {}) {
  const resolvedId = ensureId(tagId, 'A tag id is required.');
  return apiClient.delete(`/admin/blog/tags/${resolvedId}`, { signal });
}

export function createBlogMedia(payload = {}, { signal } = {}) {
  return apiClient.post('/admin/blog/media', payload, { signal });
}

export function fetchAdminBlogMetrics({ start, end } = {}, { signal } = {}) {
  const params = cleanParams({ start: serialiseDate(start), end: serialiseDate(end) });
  return apiClient.get('/admin/blog/metrics/overview', { params, signal });
}

export function fetchAdminBlogPostMetrics(postId, { signal } = {}) {
  const resolvedId = ensureId(postId, 'A blog post id is required.');
  return apiClient.get(`/admin/blog/posts/${resolvedId}/metrics`, { signal });
}

export function updateAdminBlogPostMetrics(postId, payload = {}, { signal } = {}) {
  const resolvedId = ensureId(postId, 'A blog post id is required.');
  return apiClient.put(`/admin/blog/posts/${resolvedId}/metrics`, payload, { signal });
}

export function fetchAdminBlogComments({ postId, status, page = 1, pageSize = 25 } = {}, { signal } = {}) {
  const pagination = cleanParams({ status, page, pageSize });
  if (postId) {
    const resolvedPostId = ensureId(postId, 'A blog post id is required.');
    return apiClient.get(`/admin/blog/posts/${resolvedPostId}/comments`, { params: pagination, signal });
  }
  return apiClient.get('/admin/blog/comments', { params: pagination, signal });
}

export function createAdminBlogComment(postId, payload = {}, { signal } = {}) {
  const resolvedId = ensureId(postId, 'A blog post id is required.');
  return apiClient.post(`/admin/blog/posts/${resolvedId}/comments`, payload, { signal });
}

export function updateAdminBlogComment(commentId, payload = {}, { signal } = {}) {
  const resolvedId = ensureId(commentId, 'A comment id is required.');
  return apiClient.put(`/admin/blog/comments/${resolvedId}`, payload, { signal });
}

export function deleteAdminBlogComment(commentId, { signal } = {}) {
  const resolvedId = ensureId(commentId, 'A comment id is required.');
  return apiClient.delete(`/admin/blog/comments/${resolvedId}`, { signal });
}

export async function fetchAgencyBlogWorkspaces({ signal } = {}) {
  const data = await apiClient.get('/agency/blog/workspaces', { signal });
  return data?.results ?? [];
}

export function fetchAgencyBlogPosts(
  { workspaceId, page = 1, pageSize = 20, status, search } = {},
  { signal } = {},
) {
  const resolvedWorkspaceId = ensureId(workspaceId, 'workspaceId is required.');
  const params = cleanParams({
    workspaceId: resolvedWorkspaceId,
    page,
    pageSize,
    status,
    search,
  });
  return apiClient.get('/agency/blog/posts', { params, signal });
}

export function createAgencyBlogPost(workspaceId, payload = {}, { signal } = {}) {
  const resolvedWorkspaceId = ensureId(workspaceId, 'workspaceId is required.');
  return apiClient.post('/agency/blog/posts', { ...payload, workspaceId: resolvedWorkspaceId }, { signal });
}

export function updateAgencyBlogPost(postId, workspaceId, payload = {}, { signal } = {}) {
  const resolvedPostId = ensureId(postId, 'postId and workspaceId are required.');
  const resolvedWorkspaceId = ensureId(workspaceId, 'postId and workspaceId are required.');
  return apiClient.put(`/agency/blog/posts/${resolvedPostId}`, { ...payload, workspaceId: resolvedWorkspaceId }, { signal });
}

export function deleteAgencyBlogPost(postId, workspaceId, { signal } = {}) {
  const resolvedPostId = ensureId(postId, 'postId and workspaceId are required.');
  const resolvedWorkspaceId = ensureId(workspaceId, 'postId and workspaceId are required.');
  return apiClient.delete(`/agency/blog/posts/${resolvedPostId}`, { params: { workspaceId: resolvedWorkspaceId }, signal });
}

export async function fetchAgencyBlogCategories(workspaceId, { signal } = {}) {
  const resolvedWorkspaceId = ensureId(workspaceId, 'workspaceId is required.');
  const data = await apiClient.get('/agency/blog/categories', {
    params: { workspaceId: resolvedWorkspaceId },
    signal,
  });
  return data?.results ?? [];
}

export async function fetchAgencyBlogTags(workspaceId, { signal } = {}) {
  const resolvedWorkspaceId = ensureId(workspaceId, 'workspaceId is required.');
  const data = await apiClient.get('/agency/blog/tags', {
    params: { workspaceId: resolvedWorkspaceId },
    signal,
  });
  return data?.results ?? [];
}

export function createAgencyBlogCategory(workspaceId, payload = {}, { signal } = {}) {
  const resolvedWorkspaceId = ensureId(workspaceId, 'workspaceId is required.');
  if (!payload.name || `${payload.name}`.trim().length === 0) {
    throw new Error('A category name is required.');
  }
  return apiClient.post('/agency/blog/categories', { ...payload, workspaceId: resolvedWorkspaceId }, { signal });
}

export function updateAgencyBlogCategory(categoryId, workspaceId, payload = {}, { signal } = {}) {
  const resolvedCategoryId = ensureId(categoryId, 'categoryId and workspaceId are required.');
  const resolvedWorkspaceId = ensureId(workspaceId, 'categoryId and workspaceId are required.');
  if (payload.name != null && `${payload.name}`.trim().length === 0) {
    throw new Error('Category name cannot be empty.');
  }
  return apiClient.put(
    `/agency/blog/categories/${resolvedCategoryId}`,
    { ...payload, workspaceId: resolvedWorkspaceId },
    { signal },
  );
}

export function deleteAgencyBlogCategory(categoryId, workspaceId, { signal } = {}) {
  const resolvedCategoryId = ensureId(categoryId, 'categoryId and workspaceId are required.');
  const resolvedWorkspaceId = ensureId(workspaceId, 'categoryId and workspaceId are required.');
  return apiClient.delete(`/agency/blog/categories/${resolvedCategoryId}`, {
    params: { workspaceId: resolvedWorkspaceId },
    signal,
  });
}

export function createAgencyBlogTag(workspaceId, payload = {}, { signal } = {}) {
  const resolvedWorkspaceId = ensureId(workspaceId, 'workspaceId is required.');
  if (!payload.name || `${payload.name}`.trim().length === 0) {
    throw new Error('A tag name is required.');
  }
  return apiClient.post('/agency/blog/tags', { ...payload, workspaceId: resolvedWorkspaceId }, { signal });
}

export function createAgencyBlogMedia(workspaceId, payload = {}, { signal } = {}) {
  const resolvedWorkspaceId = ensureId(workspaceId, 'workspaceId is required.');
  return apiClient.post('/agency/blog/media', { ...payload, workspaceId: resolvedWorkspaceId }, { signal });
}

export function updateAgencyBlogTag(tagId, workspaceId, payload = {}, { signal } = {}) {
  const resolvedTagId = ensureId(tagId, 'tagId and workspaceId are required.');
  const resolvedWorkspaceId = ensureId(workspaceId, 'tagId and workspaceId are required.');
  if (payload.name != null && `${payload.name}`.trim().length === 0) {
    throw new Error('Tag name cannot be empty.');
  }
  return apiClient.put(`/agency/blog/tags/${resolvedTagId}`, { ...payload, workspaceId: resolvedWorkspaceId }, { signal });
}

export function deleteAgencyBlogTag(tagId, workspaceId, { signal } = {}) {
  const resolvedTagId = ensureId(tagId, 'tagId and workspaceId are required.');
  const resolvedWorkspaceId = ensureId(workspaceId, 'tagId and workspaceId are required.');
  return apiClient.delete(`/agency/blog/tags/${resolvedTagId}`, {
    params: { workspaceId: resolvedWorkspaceId },
    signal,
  });
}

export default {
  fetchBlogPosts,
  fetchBlogPost,
  fetchBlogCategories,
  fetchBlogTags,
  fetchAdminBlogPosts,
  fetchAdminBlogPost,
  createAdminBlogPost,
  updateAdminBlogPost,
  deleteAdminBlogPost,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  createBlogTag,
  updateBlogTag,
  deleteBlogTag,
  createBlogMedia,
  fetchAdminBlogMetrics,
  fetchAdminBlogPostMetrics,
  updateAdminBlogPostMetrics,
  fetchAdminBlogComments,
  createAdminBlogComment,
  updateAdminBlogComment,
  deleteAdminBlogComment,
  fetchAgencyBlogWorkspaces,
  fetchAgencyBlogPosts,
  createAgencyBlogPost,
  updateAgencyBlogPost,
  deleteAgencyBlogPost,
  fetchAgencyBlogCategories,
  fetchAgencyBlogTags,
  createAgencyBlogCategory,
  updateAgencyBlogCategory,
  deleteAgencyBlogCategory,
  createAgencyBlogTag,
  createAgencyBlogMedia,
  updateAgencyBlogTag,
  deleteAgencyBlogTag,
};
