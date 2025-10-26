import apiClient from './apiClient.js';

export async function fetchApprovalQueue(params = {}) {
  return apiClient.get('/admin/governance/content/queue', { params });
}

export async function fetchSubmission(submissionId) {
  return apiClient.get(`/admin/governance/content/queue/${submissionId}`);
}

export async function updateSubmission(submissionId, payload) {
  return apiClient.patch(`/admin/governance/content/queue/${submissionId}`, payload);
}

export async function assignSubmission(submissionId, payload) {
  return apiClient.post(`/admin/governance/content/queue/${submissionId}/assign`, payload);
}

export async function createModerationAction(submissionId, payload) {
  return apiClient.post(`/admin/governance/content/queue/${submissionId}/actions`, payload);
}

export async function fetchModerationActions(submissionId) {
  return apiClient.get(`/admin/governance/content/queue/${submissionId}/actions`);
}

export default {
  fetchApprovalQueue,
  fetchSubmission,
  updateSubmission,
  assignSubmission,
  createModerationAction,
  fetchModerationActions,
};
