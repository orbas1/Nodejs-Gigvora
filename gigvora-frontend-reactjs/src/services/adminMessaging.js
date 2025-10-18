import apiClient from './apiClient.js';

export async function fetchAdminInbox(params = {}) {
  return apiClient.get('/admin/messaging/threads', { params });
}

export async function fetchAdminThread(threadId) {
  return apiClient.get(`/admin/messaging/threads/${threadId}`);
}

export async function fetchAdminThreadMessages(threadId, params = {}) {
  return apiClient.get(`/admin/messaging/threads/${threadId}/messages`, { params });
}

export async function createAdminThread(payload) {
  return apiClient.post('/admin/messaging/threads', payload);
}

export async function sendAdminMessage(threadId, payload) {
  return apiClient.post(`/admin/messaging/threads/${threadId}/messages`, payload);
}

export async function updateAdminThreadState(threadId, payload) {
  return apiClient.patch(`/admin/messaging/threads/${threadId}`, payload);
}

export async function escalateAdminThread(threadId, payload) {
  return apiClient.post(`/admin/messaging/threads/${threadId}/escalate`, payload);
}

export async function assignAdminSupportAgent(threadId, payload) {
  return apiClient.post(`/admin/messaging/threads/${threadId}/assign`, payload);
}

export async function updateAdminSupportStatus(threadId, payload) {
  return apiClient.post(`/admin/messaging/threads/${threadId}/support-status`, payload);
}

export async function listAdminLabels() {
  const response = await apiClient.get('/admin/messaging/labels');
  return response?.data ?? [];
}

export async function createAdminLabel(payload) {
  return apiClient.post('/admin/messaging/labels', payload);
}

export async function updateAdminLabel(labelId, payload) {
  return apiClient.patch(`/admin/messaging/labels/${labelId}`, payload);
}

export async function deleteAdminLabel(labelId) {
  return apiClient.delete(`/admin/messaging/labels/${labelId}`);
}

export async function setThreadLabels(threadId, labelIds) {
  return apiClient.post(`/admin/messaging/threads/${threadId}/labels`, { labelIds });
}

export async function listSupportAgents() {
  const response = await apiClient.get('/admin/messaging/support-agents');
  return response?.data ?? [];
}

export default {
  fetchAdminInbox,
  fetchAdminThread,
  fetchAdminThreadMessages,
  createAdminThread,
  sendAdminMessage,
  updateAdminThreadState,
  escalateAdminThread,
  assignAdminSupportAgent,
  updateAdminSupportStatus,
  listAdminLabels,
  createAdminLabel,
  updateAdminLabel,
  deleteAdminLabel,
  setThreadLabels,
  listSupportAgents,
};
