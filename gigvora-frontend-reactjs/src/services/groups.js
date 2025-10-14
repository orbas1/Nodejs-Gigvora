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
};

export default groupsService;
