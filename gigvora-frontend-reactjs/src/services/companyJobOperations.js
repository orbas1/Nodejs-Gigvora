import { apiClient } from './apiClient.js';

function ensureId(value, message) {
  if (value === undefined || value === null || `${value}`.trim().length === 0) {
    throw new Error(message);
  }
  return typeof value === 'string' ? value.trim() : value;
}

export async function fetchCompanyJobOperations({ workspaceId, workspaceSlug, lookbackDays, signal } = {}) {
  const params = {};
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    params.workspaceId = workspaceId;
  }
  if (workspaceSlug != null && `${workspaceSlug}`.length > 0) {
    params.workspaceSlug = `${workspaceSlug}`.trim();
  }
  if (lookbackDays != null) {
    params.lookbackDays = lookbackDays;
  }
  return apiClient.get('/company/jobs/operations', { params, signal });
}

export async function createJobAdvert(payload = {}, { signal } = {}) {
  return apiClient.post('/company/jobs', payload, { signal });
}

export async function updateJobAdvert(jobId, payload = {}, { signal } = {}) {
  const resolvedJobId = ensureId(jobId, 'jobId is required to update a job advert.');
  return apiClient.put(`/company/jobs/${resolvedJobId}`, payload, { signal });
}

export async function updateJobKeywords(jobId, payload = {}, { signal } = {}) {
  const resolvedJobId = ensureId(jobId, 'jobId is required to update keywords.');
  return apiClient.put(`/company/jobs/${resolvedJobId}/keywords`, payload, { signal });
}

export async function createJobFavorite(jobId, payload = {}, { signal } = {}) {
  const resolvedJobId = ensureId(jobId, 'jobId is required to create a favorite.');
  return apiClient.post(`/company/jobs/${resolvedJobId}/favorites`, payload, { signal });
}

export async function deleteJobFavorite(jobId, favoriteId, { workspaceId, signal } = {}) {
  const resolvedJobId = ensureId(jobId, 'jobId is required to delete a favorite.');
  const resolvedFavoriteId = ensureId(favoriteId, 'favoriteId is required to delete a favorite.');
  const params = {};
  if (workspaceId != null) {
    params.workspaceId = workspaceId;
  }
  return apiClient.delete(`/company/jobs/${resolvedJobId}/favorites/${resolvedFavoriteId}`, { params, signal });
}

export async function createJobApplication(jobId, payload = {}, { signal } = {}) {
  const resolvedJobId = ensureId(jobId, 'jobId is required to create an application.');
  return apiClient.post(`/company/jobs/${resolvedJobId}/applications`, payload, { signal });
}

export async function updateJobApplication(jobId, applicationId, payload = {}, { signal } = {}) {
  const resolvedJobId = ensureId(jobId, 'jobId is required to update an application.');
  const resolvedApplicationId = ensureId(applicationId, 'applicationId is required to update an application.');
  return apiClient.patch(`/company/jobs/${resolvedJobId}/applications/${resolvedApplicationId}`, payload, { signal });
}

export async function scheduleInterview(jobId, payload = {}, { signal } = {}) {
  const resolvedJobId = ensureId(jobId, 'jobId is required to schedule an interview.');
  return apiClient.post(`/company/jobs/${resolvedJobId}/interviews`, payload, { signal });
}

export async function updateInterview(jobId, interviewId, payload = {}, { signal } = {}) {
  const resolvedJobId = ensureId(jobId, 'jobId is required to update an interview.');
  const resolvedInterviewId = ensureId(interviewId, 'interviewId is required to update an interview.');
  return apiClient.patch(`/company/jobs/${resolvedJobId}/interviews/${resolvedInterviewId}`, payload, { signal });
}

export async function recordCandidateResponse(jobId, payload = {}, { signal } = {}) {
  const resolvedJobId = ensureId(jobId, 'jobId is required to record a candidate response.');
  return apiClient.post(`/company/jobs/${resolvedJobId}/responses`, payload, { signal });
}

export async function addCandidateNote(jobId, applicationId, payload = {}, { signal } = {}) {
  const resolvedJobId = ensureId(jobId, 'jobId is required to create a note.');
  const resolvedApplicationId = ensureId(applicationId, 'applicationId is required to create a note.');
  return apiClient.post(`/company/jobs/${resolvedJobId}/applications/${resolvedApplicationId}/notes`, payload, { signal });
}

export async function updateCandidateNote(jobId, applicationId, noteId, payload = {}, { signal } = {}) {
  const resolvedJobId = ensureId(jobId, 'jobId is required to update a note.');
  const resolvedApplicationId = ensureId(applicationId, 'applicationId is required to update a note.');
  const resolvedNoteId = ensureId(noteId, 'noteId is required to update a note.');
  return apiClient.patch(
    `/company/jobs/${resolvedJobId}/applications/${resolvedApplicationId}/notes/${resolvedNoteId}`,
    payload,
    { signal },
  );
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
