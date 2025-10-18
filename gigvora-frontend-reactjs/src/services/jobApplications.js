import { apiClient } from './apiClient.js';

export async function listJobApplications(params = {}) {
  return apiClient.get('/admin/job-applications', { params });
}

export async function fetchJobApplication(applicationId) {
  if (!applicationId) {
    throw new Error('applicationId is required');
  }
  return apiClient.get(`/admin/job-applications/${applicationId}`);
}

export async function createJobApplication(payload = {}) {
  return apiClient.post('/admin/job-applications', payload);
}

export async function updateJobApplication(applicationId, payload = {}) {
  if (!applicationId) {
    throw new Error('applicationId is required');
  }
  return apiClient.put(`/admin/job-applications/${applicationId}`, payload);
}

export async function deleteJobApplication(applicationId) {
  if (!applicationId) {
    throw new Error('applicationId is required');
  }
  return apiClient.delete(`/admin/job-applications/${applicationId}`);
}

export async function createJobApplicationNote(applicationId, payload = {}) {
  if (!applicationId) {
    throw new Error('applicationId is required');
  }
  return apiClient.post(`/admin/job-applications/${applicationId}/notes`, payload);
}

export async function updateJobApplicationNote(applicationId, noteId, payload = {}) {
  if (!applicationId || !noteId) {
    throw new Error('applicationId and noteId are required');
  }
  return apiClient.put(`/admin/job-applications/${applicationId}/notes/${noteId}`, payload);
}

export async function deleteJobApplicationNote(applicationId, noteId) {
  if (!applicationId || !noteId) {
    throw new Error('applicationId and noteId are required');
  }
  return apiClient.delete(`/admin/job-applications/${applicationId}/notes/${noteId}`);
}

export async function createJobApplicationInterview(applicationId, payload = {}) {
  if (!applicationId) {
    throw new Error('applicationId is required');
  }
  return apiClient.post(`/admin/job-applications/${applicationId}/interviews`, payload);
}

export async function updateJobApplicationInterview(applicationId, interviewId, payload = {}) {
  if (!applicationId || !interviewId) {
    throw new Error('applicationId and interviewId are required');
  }
  return apiClient.put(`/admin/job-applications/${applicationId}/interviews/${interviewId}`, payload);
}

export async function deleteJobApplicationInterview(applicationId, interviewId) {
  if (!applicationId || !interviewId) {
    throw new Error('applicationId and interviewId are required');
  }
  return apiClient.delete(`/admin/job-applications/${applicationId}/interviews/${interviewId}`);
}

export async function createJobApplicationDocument(applicationId, payload = {}) {
  if (!applicationId) {
    throw new Error('applicationId is required');
  }
  return apiClient.post(`/admin/job-applications/${applicationId}/documents`, payload);
}

export async function updateJobApplicationDocument(applicationId, documentId, payload = {}) {
  if (!applicationId || !documentId) {
    throw new Error('applicationId and documentId are required');
  }
  return apiClient.put(`/admin/job-applications/${applicationId}/documents/${documentId}`, payload);
}

export async function deleteJobApplicationDocument(applicationId, documentId) {
  if (!applicationId || !documentId) {
    throw new Error('applicationId and documentId are required');
  }
  return apiClient.delete(`/admin/job-applications/${applicationId}/documents/${documentId}`);
}

export default {
  listJobApplications,
  fetchJobApplication,
  createJobApplication,
  updateJobApplication,
  deleteJobApplication,
  createJobApplicationNote,
  updateJobApplicationNote,
  deleteJobApplicationNote,
  createJobApplicationInterview,
  updateJobApplicationInterview,
  deleteJobApplicationInterview,
  createJobApplicationDocument,
  updateJobApplicationDocument,
  deleteJobApplicationDocument,
};
