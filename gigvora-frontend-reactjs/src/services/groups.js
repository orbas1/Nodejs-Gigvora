import { apiClient } from './apiClient.js';

export function listGroups({ query, focus, limit, offset, includeEmpty, signal } = {}) {
  const params = {};
  if (query) params.q = query;
  if (focus) params.focus = focus;
  if (limit != null) params.limit = limit;
  if (offset != null) params.offset = offset;
  if (includeEmpty != null) params.includeEmpty = includeEmpty;
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

export default {
  listGroups,
  getGroupProfile,
  joinGroup,
  leaveGroup,
  updateGroupMembership,
function normaliseParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null),
  );
}

export async function fetchDiscoverGroups(params = {}) {
  return apiClient.get('/groups/discover', { params: normaliseParams(params) });
}

export async function fetchManagedGroups(params = {}) {
  return apiClient.get('/groups', { params: normaliseParams(params) });
}

export async function createGroup(payload) {
  return apiClient.post('/groups', payload);
}

export async function updateGroup(groupId, payload) {
  return apiClient.put(`/groups/${groupId}`, payload);
}

export async function addMember(groupId, payload) {
  return apiClient.post(`/groups/${groupId}/memberships`, payload);
}

export async function updateMember(groupId, membershipId, payload) {
  return apiClient.patch(`/groups/${groupId}/memberships/${membershipId}`, payload);
}

export async function removeMember(groupId, membershipId) {
  return apiClient.delete(`/groups/${groupId}/memberships/${membershipId}`);
}

export async function requestMembership(groupId, payload = {}) {
  return apiClient.post(`/groups/${groupId}/memberships/request`, payload);
}

export default {
  fetchDiscoverGroups,
  fetchManagedGroups,
  createGroup,
  updateGroup,
  addMember,
  updateMember,
  removeMember,
  requestMembership,
};
