import apiClient from './apiClient.js';

export function fetchAgencyWorkforceDashboard({ workspaceId } = {}, { signal } = {}) {
  return apiClient.get('/agency/workforce/dashboard', {
    params: { workspaceId },
    signal,
  });
}

export function fetchWorkforceMembers(params = {}, { signal } = {}) {
  return apiClient.get('/agency/workforce/members', { params, signal });
}

export function createWorkforceMember(payload) {
  return apiClient.post('/agency/workforce/members', payload);
}

export function updateWorkforceMember(memberId, payload) {
  return apiClient.put(`/agency/workforce/members/${memberId}`, payload);
}

export function deleteWorkforceMember(memberId, params = {}) {
  return apiClient.delete(`/agency/workforce/members/${memberId}`, { params });
}

export function createPayDelegation(payload) {
  return apiClient.post('/agency/workforce/pay-delegations', payload);
}

export function updatePayDelegation(delegationId, payload) {
  return apiClient.put(`/agency/workforce/pay-delegations/${delegationId}`, payload);
}

export function deletePayDelegation(delegationId, params = {}) {
  return apiClient.delete(`/agency/workforce/pay-delegations/${delegationId}`, { params });
}

export function createProjectDelegation(payload) {
  return apiClient.post('/agency/workforce/project-delegations', payload);
}

export function updateProjectDelegation(delegationId, payload) {
  return apiClient.put(`/agency/workforce/project-delegations/${delegationId}`, payload);
}

export function deleteProjectDelegation(delegationId, params = {}) {
  return apiClient.delete(`/agency/workforce/project-delegations/${delegationId}`, { params });
}

export function createGigDelegation(payload) {
  return apiClient.post('/agency/workforce/gig-delegations', payload);
}

export function updateGigDelegation(delegationId, payload) {
  return apiClient.put(`/agency/workforce/gig-delegations/${delegationId}`, payload);
}

export function deleteGigDelegation(delegationId, params = {}) {
  return apiClient.delete(`/agency/workforce/gig-delegations/${delegationId}`, { params });
}

export function recordCapacitySnapshot(payload) {
  return apiClient.post('/agency/workforce/capacity-snapshots', payload);
}

export function updateCapacitySnapshot(snapshotId, payload) {
  return apiClient.put(`/agency/workforce/capacity-snapshots/${snapshotId}`, payload);
}

export function deleteCapacitySnapshot(snapshotId, params = {}) {
  return apiClient.delete(`/agency/workforce/capacity-snapshots/${snapshotId}`, { params });
}

export function createAvailabilityEntry(payload) {
  return apiClient.post('/agency/workforce/availability', payload);
}

export function updateAvailabilityEntry(entryId, payload) {
  return apiClient.put(`/agency/workforce/availability/${entryId}`, payload);
}

export function deleteAvailabilityEntry(entryId, params = {}) {
  return apiClient.delete(`/agency/workforce/availability/${entryId}`, { params });
}

export default {
  fetchAgencyWorkforceDashboard,
  fetchWorkforceMembers,
  createWorkforceMember,
  updateWorkforceMember,
  deleteWorkforceMember,
  createPayDelegation,
  updatePayDelegation,
  deletePayDelegation,
  createProjectDelegation,
  updateProjectDelegation,
  deleteProjectDelegation,
  createGigDelegation,
  updateGigDelegation,
  deleteGigDelegation,
  recordCapacitySnapshot,
  updateCapacitySnapshot,
  deleteCapacitySnapshot,
  createAvailabilityEntry,
  updateAvailabilityEntry,
  deleteAvailabilityEntry,
};
