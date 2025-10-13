import { apiClient } from './apiClient.js';

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
