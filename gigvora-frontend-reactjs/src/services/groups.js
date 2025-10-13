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
};
