import apiClient from './apiClient.js';

export async function createProject(payload) {
  return apiClient.post('/projects', payload);
}

export async function updateProject(projectId, payload) {
  return apiClient.patch(`/projects/${projectId}`, payload);
}

export async function updateProjectAutoAssign(projectId, payload) {
  return apiClient.patch(`/projects/${projectId}/auto-assign`, payload);
}

export async function fetchProject(projectId) {
  return apiClient.get(`/projects/${projectId}`);
}

export async function fetchProjectEvents(projectId, { limit } = {}) {
  return apiClient.get(`/projects/${projectId}/events`, { params: { limit } });
}

export async function listProjectBlueprints() {
  return apiClient.get('/projects/blueprints');
}

export async function fetchProjectBlueprint(projectId) {
  return apiClient.get(`/projects/${projectId}/blueprint`);
}

export async function upsertProjectBlueprint(projectId, payload) {
  return apiClient.put(`/projects/${projectId}/blueprint`, payload);
export async function fetchProjectWorkspace(projectId) {
  return apiClient.get(`/projects/${projectId}/workspace`);
}

export async function updateProjectWorkspaceBrief(projectId, payload) {
  return apiClient.put(`/projects/${projectId}/workspace/brief`, payload);
}

export async function updateProjectWorkspaceApproval(projectId, approvalId, payload) {
  return apiClient.patch(`/projects/${projectId}/workspace/approvals/${approvalId}`, payload);
}

export async function acknowledgeProjectWorkspaceConversation(projectId, conversationId, payload) {
  return apiClient.patch(`/projects/${projectId}/workspace/conversations/${conversationId}`, payload);
}

export default {
  createProject,
  updateProject,
  updateProjectAutoAssign,
  fetchProject,
  fetchProjectEvents,
  listProjectBlueprints,
  fetchProjectBlueprint,
  upsertProjectBlueprint,
  fetchProjectWorkspace,
  updateProjectWorkspaceBrief,
  updateProjectWorkspaceApproval,
  acknowledgeProjectWorkspaceConversation,
};
