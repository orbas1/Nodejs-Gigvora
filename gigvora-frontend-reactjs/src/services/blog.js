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
  return apiClient.put(`/admin/blog/categories/${categoryId}`, payload, { signal });
}

export async function deleteBlogCategory(categoryId, { signal } = {}) {
  return apiClient.delete(`/admin/blog/categories/${categoryId}`, { signal });
}

export async function createBlogTag(payload, { signal } = {}) {
  return apiClient.post('/admin/blog/tags', payload, { signal });
}

export async function updateBlogTag(tagId, payload, { signal } = {}) {
  return apiClient.put(`/admin/blog/tags/${tagId}`, payload, { signal });
}

export async function deleteBlogTag(tagId, { signal } = {}) {
  return apiClient.delete(`/admin/blog/tags/${tagId}`, { signal });
}

export async function createBlogMedia(payload, { signal } = {}) {
  return apiClient.post('/admin/blog/media', payload, { signal });
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
};
