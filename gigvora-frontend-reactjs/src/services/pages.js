import { apiClient } from './apiClient.js';

function normaliseParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null),
  );
}

export function listUserPages(userId, params = {}) {
  return apiClient.get(`/users/${userId}/pages`, { params: normaliseParams(params) });
}

export function listManagedPages(userId, params = {}) {
  return apiClient.get(`/users/${userId}/pages/managed`, { params: normaliseParams(params) });
}

export function createUserPage(userId, payload = {}) {
  return apiClient.post(`/users/${userId}/pages`, payload);
}

export function updateUserPage(userId, pageId, payload = {}) {
  return apiClient.put(`/users/${userId}/pages/${pageId}`, payload);
}

export function listPageMemberships(userId, pageId) {
  return apiClient.get(`/users/${userId}/pages/${pageId}/memberships`);
}

export function updatePageMembership(userId, pageId, membershipId, payload = {}) {
  return apiClient.patch(`/users/${userId}/pages/${pageId}/memberships/${membershipId}`, payload);
}

export function listPageInvites(userId, pageId) {
  return apiClient.get(`/users/${userId}/pages/${pageId}/invites`);
}

export function createPageInvite(userId, pageId, payload = {}) {
  return apiClient.post(`/users/${userId}/pages/${pageId}/invites`, payload);
}

export function deletePageInvite(userId, pageId, inviteId) {
  return apiClient.delete(`/users/${userId}/pages/${pageId}/invites/${inviteId}`);
}

export function listPagePosts(userId, pageId, params = {}) {
  return apiClient.get(`/users/${userId}/pages/${pageId}/posts`, { params: normaliseParams(params) });
}

export function createPagePost(userId, pageId, payload = {}) {
  return apiClient.post(`/users/${userId}/pages/${pageId}/posts`, payload);
}

export function updatePagePost(userId, pageId, postId, payload = {}) {
  return apiClient.patch(`/users/${userId}/pages/${pageId}/posts/${postId}`, payload);
}

export function deletePagePost(userId, pageId, postId) {
  return apiClient.delete(`/users/${userId}/pages/${pageId}/posts/${postId}`);
}

const pagesService = {
  listUserPages,
  listManagedPages,
  createUserPage,
  updateUserPage,
  listPageMemberships,
  updatePageMembership,
  listPageInvites,
  createPageInvite,
  deletePageInvite,
  listPagePosts,
  createPagePost,
  updatePagePost,
  deletePagePost,
};

export default pagesService;
