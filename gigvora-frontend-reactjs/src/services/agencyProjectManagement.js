import { apiClient } from './apiClient.js';

export async function fetchAgencyProjectManagement({ signal } = {}) {
  return apiClient.get('/agency/project-management', { signal });
}

export async function createAgencyProject(payload) {
  return apiClient.post('/agency/project-management/projects', payload);
}

export async function updateAgencyProject(projectId, payload) {
  return apiClient.put(`/agency/project-management/projects/${projectId}`, payload);
}

export async function updateAgencyProjectAutoMatchSettings(projectId, payload) {
  return apiClient.put(`/agency/project-management/projects/${projectId}/automatch-settings`, payload);
}

export async function upsertAgencyProjectAutoMatchFreelancer(projectId, payload) {
  return apiClient.post(`/agency/project-management/projects/${projectId}/automatch/freelancers`, payload);
}

export async function updateAgencyProjectAutoMatchFreelancer(projectId, entryId, payload) {
  return apiClient.put(
    `/agency/project-management/projects/${projectId}/automatch/freelancers/${entryId}`,
    payload,
  );
}

export default {
  fetchAgencyProjectManagement,
  createAgencyProject,
  updateAgencyProject,
  updateAgencyProjectAutoMatchSettings,
  upsertAgencyProjectAutoMatchFreelancer,
  updateAgencyProjectAutoMatchFreelancer,
};
