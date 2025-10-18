import { apiClient } from './apiClient.js';

export function fetchJobManagementMetadata() {
  return apiClient.get('/agency/job-management/metadata');
}

export function fetchJobManagementSummary({ workspaceId } = {}) {
  return apiClient.get('/agency/job-management/summary', {
    params: { workspaceId },
  });
}

export function fetchAgencyJobs({ workspaceId, status, search, page, pageSize } = {}) {
  return apiClient.get('/agency/job-management/jobs', {
    params: { workspaceId, status, search, page, pageSize },
  });
}

export function createAgencyJob({ workspaceId, payload }) {
  return apiClient.post('/agency/job-management/jobs', { ...payload, workspaceId });
}

export function updateAgencyJob({ jobId, workspaceId, payload }) {
  return apiClient.put(`/agency/job-management/jobs/${jobId}`, { ...payload, workspaceId });
}

export function fetchAgencyJob({ jobId, workspaceId }) {
  return apiClient.get(`/agency/job-management/jobs/${jobId}`, {
    params: { workspaceId },
  });
}

export function favoriteAgencyJob({ jobId, workspaceId, memberId, pinnedNote }) {
  return apiClient.post(`/agency/job-management/jobs/${jobId}/favorites`, {
    workspaceId,
    memberId,
    pinnedNote,
  });
}

export function unfavoriteAgencyJob({ jobId, workspaceId, memberId }) {
  const resolvedMemberId = memberId ?? 'me';
  return apiClient.delete(`/agency/job-management/jobs/${jobId}/favorites/${resolvedMemberId}`, {
    params: { workspaceId },
  });
}

export function fetchAgencyApplications({ jobId, workspaceId, status } = {}) {
  return apiClient.get(`/agency/job-management/jobs/${jobId}/applications`, {
    params: { workspaceId, status },
  });
}

export function createAgencyApplication({ jobId, workspaceId, payload }) {
  return apiClient.post(`/agency/job-management/jobs/${jobId}/applications`, {
    ...payload,
    workspaceId,
  });
}

export function fetchAgencyApplication({ applicationId, workspaceId }) {
  return apiClient.get(`/agency/job-management/applications/${applicationId}`, {
    params: { workspaceId },
  });
}

export function updateAgencyApplication({ applicationId, workspaceId, payload }) {
  return apiClient.put(`/agency/job-management/applications/${applicationId}`, {
    ...payload,
    workspaceId,
  });
}

export function fetchAgencyInterviews({ applicationId, workspaceId }) {
  return apiClient.get(`/agency/job-management/applications/${applicationId}/interviews`, {
    params: { workspaceId },
  });
}

export function createAgencyInterview({ applicationId, workspaceId, payload }) {
  return apiClient.post(`/agency/job-management/applications/${applicationId}/interviews`, {
    ...payload,
    workspaceId,
  });
}

export function updateAgencyInterview({ interviewId, workspaceId, payload }) {
  return apiClient.put(`/agency/job-management/interviews/${interviewId}`, {
    ...payload,
    workspaceId,
  });
}

export function fetchAgencyResponses({ applicationId, workspaceId }) {
  return apiClient.get(`/agency/job-management/applications/${applicationId}/responses`, {
    params: { workspaceId },
  });
}

export function createAgencyResponse({ applicationId, workspaceId, payload }) {
  return apiClient.post(`/agency/job-management/applications/${applicationId}/responses`, {
    ...payload,
    workspaceId,
  });
}

export default {
  fetchJobManagementMetadata,
  fetchJobManagementSummary,
  fetchAgencyJobs,
  createAgencyJob,
  updateAgencyJob,
  fetchAgencyJob,
  favoriteAgencyJob,
  unfavoriteAgencyJob,
  fetchAgencyApplications,
  createAgencyApplication,
  fetchAgencyApplication,
  updateAgencyApplication,
  fetchAgencyInterviews,
  createAgencyInterview,
  updateAgencyInterview,
  fetchAgencyResponses,
  createAgencyResponse,
};
