import { apiClient } from './apiClient.js';

function normaliseParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null),
  );
}

export function listGroups({ query, focus, limit, offset, includeEmpty, signal } = {}) {
  const params = normaliseParams({
    q: query,
    focus,
    limit,
    offset,
    includeEmpty,
  });

  return apiClient.get('/groups', { params, signal });
}

export function getGroupProfile(groupSlugOrId, { signal } = {}) {
  return apiClient.get(`/groups/${groupSlugOrId}`, { signal });
}

export function joinGroup(groupSlugOrId, payload = {}) {
  return apiClient.post(`/groups/${groupSlugOrId}/join`, payload);
}

export function leaveGroup(groupSlugOrId, payload = {}) {
  return apiClient.delete(`/groups/${groupSlugOrId}/leave`, { body: payload });
}

export function updateGroupMembership(groupSlugOrId, payload = {}) {
  return apiClient.patch(`/groups/${groupSlugOrId}/membership`, payload);
}

export function fetchDiscoverGroups(params = {}) {
  return apiClient.get('/groups/discover', { params: normaliseParams(params) });
}

export function fetchManagedGroups(params = {}) {
  return apiClient.get('/groups', { params: normaliseParams(params) });
}

export function createGroup(payload) {
  return apiClient.post('/groups', payload);
}

export function updateGroup(groupId, payload) {
  return apiClient.put(`/groups/${groupId}`, payload);
}

export function addMember(groupId, payload) {
  return apiClient.post(`/groups/${groupId}/memberships`, payload);
}

export function updateMember(groupId, membershipId, payload) {
  return apiClient.patch(`/groups/${groupId}/memberships/${membershipId}`, payload);
}

export function removeMember(groupId, membershipId) {
  return apiClient.delete(`/groups/${groupId}/memberships/${membershipId}`);
}

export function requestMembership(groupId, payload = {}) {
  return apiClient.post(`/groups/${groupId}/memberships/request`, payload);
}

export function listUserGroups(userId, params = {}) {
  return apiClient.get(`/users/${userId}/groups`, { params: normaliseParams(params) });
}

export function createUserGroup(userId, payload = {}) {
  return apiClient.post(`/users/${userId}/groups`, payload);
}

export function updateUserGroup(userId, groupId, payload = {}) {
  return apiClient.put(`/users/${userId}/groups/${groupId}`, payload);
}

export function listUserGroupInvites(userId, groupId) {
  return apiClient.get(`/users/${userId}/groups/${groupId}/invites`);
}

export function createUserGroupInvite(userId, groupId, payload = {}) {
  return apiClient.post(`/users/${userId}/groups/${groupId}/invites`, payload);
}

export function deleteUserGroupInvite(userId, groupId, inviteId) {
  return apiClient.delete(`/users/${userId}/groups/${groupId}/invites/${inviteId}`);
}

export function listUserGroupPosts(userId, groupId, params = {}) {
  return apiClient.get(`/users/${userId}/groups/${groupId}/posts`, { params: normaliseParams(params) });
}

export function createUserGroupPost(userId, groupId, payload = {}) {
  return apiClient.post(`/users/${userId}/groups/${groupId}/posts`, payload);
}

export function updateUserGroupPost(userId, groupId, postId, payload = {}) {
  return apiClient.patch(`/users/${userId}/groups/${groupId}/posts/${postId}`, payload);
}

export function deleteUserGroupPost(userId, groupId, postId) {
  return apiClient.delete(`/users/${userId}/groups/${groupId}/posts/${postId}`);
}

const groupsService = {
  listGroups,
  getGroupProfile,
  joinGroup,
  leaveGroup,
  updateGroupMembership,
  fetchDiscoverGroups,
  fetchManagedGroups,
  createGroup,
  updateGroup,
  addMember,
  updateMember,
  removeMember,
  requestMembership,
  listUserGroups,
  createUserGroup,
  updateUserGroup,
  listUserGroupInvites,
  createUserGroupInvite,
  deleteUserGroupInvite,
  listUserGroupPosts,
  createUserGroupPost,
  updateUserGroupPost,
  deleteUserGroupPost,
};

export default groupsService;
