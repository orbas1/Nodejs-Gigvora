import apiClient from './apiClient.js';

export async function fetchBlogPosts(
  { page = 1, pageSize = 9, status, category, tag, search, includeUnpublished = false } = {},
  { signal } = {},
) {
  const params = {
    page,
    pageSize,
    status,
    category,
    tag,
    search,
    includeUnpublished: includeUnpublished ? 'true' : undefined,
  };
  return apiClient.get('/blog/posts', { params, signal });
}

export async function fetchBlogPost(slug, { signal, includeUnpublished = false } = {}) {
  if (!slug) {
    throw new Error('A blog identifier is required.');
  }
  const params = includeUnpublished ? { includeUnpublished: 'true' } : undefined;
  return apiClient.get(`/blog/posts/${slug}`, { params, signal });
}

export async function fetchBlogCategories({ signal } = {}) {
  const data = await apiClient.get('/blog/categories', { signal });
  return data?.results ?? [];
}

export async function fetchBlogTags({ signal } = {}) {
  const data = await apiClient.get('/blog/tags', { signal });
  return data?.results ?? [];
}

export async function fetchAdminBlogPosts(
  { page = 1, pageSize = 20, status, category, tag, search } = {},
  { signal } = {},
) {
  const params = {
    page,
    pageSize,
    status,
    category,
    tag,
    search,
    includeUnpublished: 'true',
  };
  return apiClient.get('/admin/blog/posts', { params, signal });
}

export async function fetchAdminBlogPost(postId, { signal } = {}) {
  if (!postId) {
    throw new Error('A blog post id is required.');
  }
  return apiClient.get(`/admin/blog/posts/${postId}`, { signal });
}

export async function createAdminBlogPost(payload, { signal } = {}) {
  return apiClient.post('/admin/blog/posts', payload, { signal });
}

export async function updateAdminBlogPost(postId, payload, { signal } = {}) {
  if (!postId) {
    throw new Error('A blog post id is required.');
  }
  return apiClient.put(`/admin/blog/posts/${postId}`, payload, { signal });
}

export async function deleteAdminBlogPost(postId, { signal } = {}) {
  if (!postId) {
    throw new Error('A blog post id is required.');
  }
  return apiClient.delete(`/admin/blog/posts/${postId}`, { signal });
}

export async function createBlogCategory(payload, { signal } = {}) {
  return apiClient.post('/admin/blog/categories', payload, { signal });
}

export async function updateBlogCategory(categoryId, payload, { signal } = {}) {
  if (!categoryId) {
    throw new Error('A category id is required.');
  }
  return apiClient.put(`/admin/blog/categories/${categoryId}`, payload, { signal });
}

export async function deleteBlogCategory(categoryId, { signal } = {}) {
  if (!categoryId) {
    throw new Error('A category id is required.');
  }
  return apiClient.delete(`/admin/blog/categories/${categoryId}`, { signal });
}

export async function createBlogTag(payload, { signal } = {}) {
  return apiClient.post('/admin/blog/tags', payload, { signal });
}

export async function updateBlogTag(tagId, payload, { signal } = {}) {
  if (!tagId) {
    throw new Error('A tag id is required.');
  }
  return apiClient.put(`/admin/blog/tags/${tagId}`, payload, { signal });
}

export async function deleteBlogTag(tagId, { signal } = {}) {
  if (!tagId) {
    throw new Error('A tag id is required.');
  }
  return apiClient.delete(`/admin/blog/tags/${tagId}`, { signal });
}

export async function createBlogMedia(payload, { signal } = {}) {
  return apiClient.post('/admin/blog/media', payload, { signal });
}

export async function fetchAdminBlogMetrics({ start, end } = {}, { signal } = {}) {
  const params = { start, end };
  return apiClient.get('/admin/blog/metrics/overview', { params, signal });
}

export async function fetchAdminBlogPostMetrics(postId, { signal } = {}) {
  if (!postId) {
    throw new Error('A blog post id is required.');
  }
  return apiClient.get(`/admin/blog/posts/${postId}/metrics`, { signal });
}

export async function updateAdminBlogPostMetrics(postId, payload, { signal } = {}) {
  if (!postId) {
    throw new Error('A blog post id is required.');
  }
  return apiClient.put(`/admin/blog/posts/${postId}/metrics`, payload, { signal });
}

export async function fetchAdminBlogComments(
  { postId, status, page = 1, pageSize = 25 } = {},
  { signal } = {},
) {
  const params = {
    postId,
    status,
    page,
    pageSize,
  };
  if (postId) {
    return apiClient.get(`/admin/blog/posts/${postId}/comments`, { params: { status, page, pageSize }, signal });
  }
  return apiClient.get('/admin/blog/comments', { params, signal });
}

export async function createAdminBlogComment(postId, payload, { signal } = {}) {
  if (!postId) {
    throw new Error('A blog post id is required.');
  }
  return apiClient.post(`/admin/blog/posts/${postId}/comments`, payload, { signal });
}

export async function updateAdminBlogComment(commentId, payload, { signal } = {}) {
  if (!commentId) {
    throw new Error('A comment id is required.');
  }
  return apiClient.put(`/admin/blog/comments/${commentId}`, payload, { signal });
}

export async function deleteAdminBlogComment(commentId, { signal } = {}) {
  if (!commentId) {
    throw new Error('A comment id is required.');
  }
  return apiClient.delete(`/admin/blog/comments/${commentId}`, { signal });
}

export async function fetchAgencyBlogWorkspaces({ signal } = {}) {
  const data = await apiClient.get('/agency/blog/workspaces', { signal });
  return data?.results ?? [];
}

export async function fetchAgencyBlogPosts(
  { workspaceId, page = 1, pageSize = 20, status, search } = {},
  { signal } = {},
) {
  if (!workspaceId) {
    throw new Error('workspaceId is required.');
  }
  const params = {
    workspaceId,
    page,
    pageSize,
    status,
    search,
  };
  return apiClient.get('/agency/blog/posts', { params, signal });
}

export async function createAgencyBlogPost(workspaceId, payload, { signal } = {}) {
  if (!workspaceId) {
    throw new Error('workspaceId is required.');
  }
  return apiClient.post('/agency/blog/posts', { ...payload, workspaceId }, { signal });
}

export async function updateAgencyBlogPost(postId, workspaceId, payload, { signal } = {}) {
  if (!postId || !workspaceId) {
    throw new Error('postId and workspaceId are required.');
  }
  return apiClient.put(`/agency/blog/posts/${postId}`, { ...payload, workspaceId }, { signal });
}

export async function deleteAgencyBlogPost(postId, workspaceId, { signal } = {}) {
  if (!postId || !workspaceId) {
    throw new Error('postId and workspaceId are required.');
  }
  return apiClient.delete(`/agency/blog/posts/${postId}`, { params: { workspaceId }, signal });
}

export async function fetchAgencyBlogCategories(workspaceId, { signal } = {}) {
  if (!workspaceId) {
    throw new Error('workspaceId is required.');
  }
  const data = await apiClient.get('/agency/blog/categories', { params: { workspaceId }, signal });
  return data?.results ?? [];
}

export async function fetchAgencyBlogTags(workspaceId, { signal } = {}) {
  if (!workspaceId) {
    throw new Error('workspaceId is required.');
  }
  const data = await apiClient.get('/agency/blog/tags', { params: { workspaceId }, signal });
  return data?.results ?? [];
}

export async function createAgencyBlogCategory(workspaceId, payload, { signal } = {}) {
  if (!workspaceId) {
    throw new Error('workspaceId is required.');
  }
  return apiClient.post('/agency/blog/categories', { ...payload, workspaceId }, { signal });
}

export async function createAgencyBlogTag(workspaceId, payload, { signal } = {}) {
  if (!workspaceId) {
    throw new Error('workspaceId is required.');
  }
  return apiClient.post('/agency/blog/tags', { ...payload, workspaceId }, { signal });
}

export async function createAgencyBlogMedia(payload, { signal } = {}) {
  return apiClient.post('/agency/blog/media', payload, { signal });
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
  createAgencyBlogTag,
  createAgencyBlogMedia,
};
