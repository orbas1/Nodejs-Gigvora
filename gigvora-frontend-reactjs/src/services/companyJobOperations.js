import { apiClient } from './apiClient.js';

export async function fetchCompanyJobOperations({ workspaceId, workspaceSlug, lookbackDays, signal } = {}) {
  const params = {};
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    params.workspaceId = workspaceId;
  }
  if (workspaceSlug != null && `${workspaceSlug}`.length > 0) {
    params.workspaceSlug = workspaceSlug;
  }
  if (lookbackDays != null) {
    params.lookbackDays = lookbackDays;
  }
  return apiClient.get('/company/jobs/operations', { params, signal });
}

export async function createJobAdvert(payload) {
  return apiClient.post('/company/jobs', payload);
}

export async function updateJobAdvert(jobId, payload) {
  return apiClient.put(`/company/jobs/${jobId}`, payload);
}

export async function updateJobKeywords(jobId, payload) {
  return apiClient.put(`/company/jobs/${jobId}/keywords`, payload);
}

export async function createJobFavorite(jobId, payload) {
  return apiClient.post(`/company/jobs/${jobId}/favorites`, payload);
}

export async function deleteJobFavorite(jobId, favoriteId, { workspaceId } = {}) {
  const params = {};
  if (workspaceId != null) {
    params.workspaceId = workspaceId;
  }
  return apiClient.delete(`/company/jobs/${jobId}/favorites/${favoriteId}`, { params });
}

export async function createJobApplication(jobId, payload) {
  return apiClient.post(`/company/jobs/${jobId}/applications`, payload);
}

export async function updateJobApplication(jobId, applicationId, payload) {
  return apiClient.patch(`/company/jobs/${jobId}/applications/${applicationId}`, payload);
}

export async function scheduleInterview(jobId, payload) {
  return apiClient.post(`/company/jobs/${jobId}/interviews`, payload);
}

export async function updateInterview(jobId, interviewId, payload) {
  return apiClient.patch(`/company/jobs/${jobId}/interviews/${interviewId}`, payload);
}

export async function recordCandidateResponse(jobId, payload) {
  return apiClient.post(`/company/jobs/${jobId}/responses`, payload);
}

export async function addCandidateNote(jobId, applicationId, payload) {
  return apiClient.post(`/company/jobs/${jobId}/applications/${applicationId}/notes`, payload);
}

export async function updateCandidateNote(jobId, applicationId, noteId, payload) {
  return apiClient.patch(`/company/jobs/${jobId}/applications/${applicationId}/notes/${noteId}`, payload);
}

export default {
  fetchCompanyJobOperations,
  createJobAdvert,
  updateJobAdvert,
  updateJobKeywords,
  createJobFavorite,
  deleteJobFavorite,
  createJobApplication,
  updateJobApplication,
  scheduleInterview,
  updateInterview,
  recordCandidateResponse,
  addCandidateNote,
  updateCandidateNote,
};
