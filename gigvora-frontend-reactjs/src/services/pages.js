import { apiClient } from './apiClient.js';

function normaliseParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null),
  );
}

function requireUserId(userId) {
  if (!userId) {
    throw new Error('userId is required for page operations.');
  }
  return userId;
}

function requirePageId(pageId) {
  if (!pageId) {
    throw new Error('pageId is required for page operations.');
  }
  return pageId;
}

export function listUserPages(userId, params = {}) {
  return apiClient.get(`/users/${requireUserId(userId)}/pages`, { params: normaliseParams(params) });
}

export function listManagedPages(userId, params = {}) {
  return apiClient.get(`/users/${requireUserId(userId)}/pages/managed`, {
    params: normaliseParams(params),
  });
}

export function createUserPage(userId, payload = {}) {
  requireUserId(userId);
  if (!payload?.name) {
    throw new Error('name is required to create a page.');
  }
  return apiClient.post(`/users/${userId}/pages`, payload);
}

export function updateUserPage(userId, pageId, payload = {}) {
  requireUserId(userId);
  requirePageId(pageId);
  return apiClient.put(`/users/${userId}/pages/${pageId}`, payload);
}

export function listPageMemberships(userId, pageId) {
  requireUserId(userId);
  requirePageId(pageId);
  return apiClient.get(`/users/${userId}/pages/${pageId}/memberships`);
}

export function updatePageMembership(userId, pageId, membershipId, payload = {}) {
  requireUserId(userId);
  requirePageId(pageId);
  if (!membershipId) {
    throw new Error('membershipId is required to update a page membership.');
  }
  return apiClient.patch(`/users/${userId}/pages/${pageId}/memberships/${membershipId}`, payload);
}

export function listPageInvites(userId, pageId) {
  requireUserId(userId);
  requirePageId(pageId);
  return apiClient.get(`/users/${userId}/pages/${pageId}/invites`);
}

export function createPageInvite(userId, pageId, payload = {}) {
  requireUserId(userId);
  requirePageId(pageId);
  if (!payload?.email) {
    throw new Error('email is required to create a page invite.');
  }
  return apiClient.post(`/users/${userId}/pages/${pageId}/invites`, payload);
}

export function deletePageInvite(userId, pageId, inviteId) {
  requireUserId(userId);
  requirePageId(pageId);
  if (!inviteId) {
    throw new Error('inviteId is required to delete a page invite.');
  }
  return apiClient.delete(`/users/${userId}/pages/${pageId}/invites/${inviteId}`);
}

export function listPagePosts(userId, pageId, params = {}) {
  requireUserId(userId);
  requirePageId(pageId);
  return apiClient.get(`/users/${userId}/pages/${pageId}/posts`, { params: normaliseParams(params) });
}

export function createPagePost(userId, pageId, payload = {}) {
  requireUserId(userId);
  requirePageId(pageId);
  if (!payload?.content) {
    throw new Error('content is required to create a page post.');
  }
  return apiClient.post(`/users/${userId}/pages/${pageId}/posts`, payload);
}

export function updatePagePost(userId, pageId, postId, payload = {}) {
  requireUserId(userId);
  requirePageId(pageId);
  if (!postId) {
    throw new Error('postId is required to update a page post.');
  }
  return apiClient.patch(`/users/${userId}/pages/${pageId}/posts/${postId}`, payload);
}

export function deletePagePost(userId, pageId, postId) {
  requireUserId(userId);
  requirePageId(pageId);
  if (!postId) {
    throw new Error('postId is required to delete a page post.');
  }
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
