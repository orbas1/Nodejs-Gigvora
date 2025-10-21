import { apiClient } from './apiClient.js';

async function listJobApplications(params = {}) {
  return apiClient.get('/admin/job-applications', { params });
}

async function fetchJobApplication(applicationId) {
  if (!applicationId) {
    throw new Error('applicationId is required');
  }
  return apiClient.get(`/admin/job-applications/${applicationId}`);
}

async function createAdminJobApplication(payload = {}) {
  return apiClient.post('/admin/job-applications', payload);
}

async function updateAdminJobApplication(applicationId, payload = {}) {
  if (!applicationId) {
    throw new Error('applicationId is required');
  }
  return apiClient.put(`/admin/job-applications/${applicationId}`, payload);
}

async function deleteAdminJobApplication(applicationId, { signal } = {}) {
  if (!applicationId) {
    throw new Error('applicationId is required');
  }
  return apiClient.delete(`/admin/job-applications/${applicationId}`, { signal });
}

async function createJobApplicationNote(applicationId, payload = {}) {
  if (!applicationId) {
    throw new Error('applicationId is required');
  }
  return apiClient.post(`/admin/job-applications/${applicationId}/notes`, payload);
}

async function updateJobApplicationNote(applicationId, noteId, payload = {}) {
  if (!applicationId || !noteId) {
    throw new Error('applicationId and noteId are required');
  }
  return apiClient.put(`/admin/job-applications/${applicationId}/notes/${noteId}`, payload);
}

async function deleteJobApplicationNote(applicationId, noteId, { signal } = {}) {
  if (!applicationId || !noteId) {
    throw new Error('applicationId and noteId are required');
  }
  return apiClient.delete(`/admin/job-applications/${applicationId}/notes/${noteId}`, { signal });
}

async function createJobApplicationInterview(applicationId, payload = {}) {
  if (!applicationId) {
    throw new Error('applicationId is required');
  }
  return apiClient.post(`/admin/job-applications/${applicationId}/interviews`, payload);
}

async function updateJobApplicationInterview(applicationId, interviewId, payload = {}) {
  if (!applicationId || !interviewId) {
    throw new Error('applicationId and interviewId are required');
  }
  return apiClient.put(`/admin/job-applications/${applicationId}/interviews/${interviewId}`, payload);
}

async function deleteJobApplicationInterview(applicationId, interviewId, { signal } = {}) {
  if (!applicationId || !interviewId) {
    throw new Error('applicationId and interviewId are required');
  }
  return apiClient.delete(`/admin/job-applications/${applicationId}/interviews/${interviewId}`, { signal });
}

async function createJobApplicationDocument(applicationId, payload = {}) {
  if (!applicationId) {
    throw new Error('applicationId is required');
  }
  return apiClient.post(`/admin/job-applications/${applicationId}/documents`, payload);
}

async function updateJobApplicationDocument(applicationId, documentId, payload = {}) {
  if (!applicationId || !documentId) {
    throw new Error('applicationId and documentId are required');
  }
  return apiClient.put(`/admin/job-applications/${applicationId}/documents/${documentId}`, payload);
}

async function deleteJobApplicationDocument(applicationId, documentId, { signal } = {}) {
  if (!applicationId || !documentId) {
    throw new Error('applicationId and documentId are required');
  }
  return apiClient.delete(`/admin/job-applications/${applicationId}/documents/${documentId}`, { signal });
}

const adminJobApplicationService = {
  listJobApplications,
  fetchJobApplication,
  createJobApplication: createAdminJobApplication,
  updateJobApplication: updateAdminJobApplication,
  deleteJobApplication: deleteAdminJobApplication,
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

function assertUserId(userId, message) {
  if (!userId) {
    throw new Error(message);
  }
}

async function fetchJobApplicationWorkspace(userId, { signal, limit } = {}) {
  assertUserId(userId, 'userId is required to load the job application workspace.');
  const params = { ownerId: userId };
  if (limit != null) {
    params.limit = limit;
  }
  return apiClient.get('/job-applications/workspace', { params, signal });
}

async function createWorkspaceJobApplication(userId, payload) {
  assertUserId(userId, 'userId is required to create a job application.');
  return apiClient.post('/job-applications', { ...payload, ownerId: userId });
}

async function updateWorkspaceJobApplication(userId, applicationId, payload) {
  assertUserId(userId, 'userId is required to update a job application.');
  if (!applicationId) {
    throw new Error('applicationId is required to update a job application.');
  }
  return apiClient.patch(`/job-applications/${applicationId}`, { ...payload, ownerId: userId });
}

async function archiveWorkspaceJobApplication(userId, applicationId, { signal } = {}) {
  assertUserId(userId, 'userId is required to archive a job application.');
  if (!applicationId) {
    throw new Error('applicationId is required to archive a job application.');
  }
  return apiClient.delete(`/job-applications/${applicationId}`, { signal, body: { ownerId: userId } });
}

async function createWorkspaceJobApplicationInterview(userId, applicationId, payload) {
  assertUserId(userId, 'userId is required to create an interview.');
  if (!applicationId) {
    throw new Error('applicationId is required to create an interview.');
  }
  return apiClient.post(`/job-applications/${applicationId}/interviews`, { ...payload, ownerId: userId });
}

async function updateWorkspaceJobApplicationInterview(userId, applicationId, interviewId, payload) {
  assertUserId(userId, 'userId is required to update an interview.');
  if (!applicationId || !interviewId) {
    throw new Error('applicationId and interviewId are required to update an interview.');
  }
  return apiClient.patch(`/job-applications/${applicationId}/interviews/${interviewId}`, {
    ...payload,
    ownerId: userId,
  });
}

async function deleteWorkspaceJobApplicationInterview(userId, applicationId, interviewId, { signal } = {}) {
  assertUserId(userId, 'userId is required to delete an interview.');
  if (!applicationId || !interviewId) {
    throw new Error('applicationId and interviewId are required to delete an interview.');
  }
  return apiClient.delete(`/job-applications/${applicationId}/interviews/${interviewId}`, {
    signal,
    body: { ownerId: userId },
  });
}

async function createWorkspaceJobApplicationFavourite(userId, payload) {
  assertUserId(userId, 'userId is required to create a favourite.');
  return apiClient.post('/job-applications/favourites', { ...payload, ownerId: userId });
}

async function updateWorkspaceJobApplicationFavourite(userId, favouriteId, payload) {
  assertUserId(userId, 'userId is required to update a favourite.');
  if (!favouriteId) {
    throw new Error('favouriteId is required to update a favourite.');
  }
  return apiClient.patch(`/job-applications/favourites/${favouriteId}`, { ...payload, ownerId: userId });
}

async function deleteWorkspaceJobApplicationFavourite(userId, favouriteId, { signal } = {}) {
  assertUserId(userId, 'userId is required to delete a favourite.');
  if (!favouriteId) {
    throw new Error('favouriteId is required to delete a favourite.');
  }
  return apiClient.delete(`/job-applications/favourites/${favouriteId}`, {
    signal,
    body: { ownerId: userId },
  });
}

async function createWorkspaceJobApplicationResponse(userId, applicationId, payload) {
  assertUserId(userId, 'userId is required to log a response.');
  if (!applicationId) {
    throw new Error('applicationId is required to log a response.');
  }
  return apiClient.post(`/job-applications/${applicationId}/responses`, { ...payload, ownerId: userId });
}

async function updateWorkspaceJobApplicationResponse(userId, applicationId, responseId, payload) {
  assertUserId(userId, 'userId is required to update a response.');
  if (!applicationId || !responseId) {
    throw new Error('applicationId and responseId are required to update a response.');
  }
  return apiClient.patch(`/job-applications/${applicationId}/responses/${responseId}`, {
    ...payload,
    ownerId: userId,
  });
}

async function deleteWorkspaceJobApplicationResponse(userId, applicationId, responseId, { signal } = {}) {
  assertUserId(userId, 'userId is required to delete a response.');
  if (!applicationId || !responseId) {
    throw new Error('applicationId and responseId are required to delete a response.');
  }
  return apiClient.delete(`/job-applications/${applicationId}/responses/${responseId}`, {
    signal,
    body: { ownerId: userId },
  });
}

const workspaceJobApplicationService = {
  fetchJobApplicationWorkspace,
  createJobApplication: createWorkspaceJobApplication,
  updateJobApplication: updateWorkspaceJobApplication,
  archiveJobApplication: archiveWorkspaceJobApplication,
  createJobApplicationInterview: createWorkspaceJobApplicationInterview,
  updateJobApplicationInterview: updateWorkspaceJobApplicationInterview,
  deleteJobApplicationInterview: deleteWorkspaceJobApplicationInterview,
  createJobApplicationFavourite: createWorkspaceJobApplicationFavourite,
  updateJobApplicationFavourite: updateWorkspaceJobApplicationFavourite,
  deleteJobApplicationFavourite: deleteWorkspaceJobApplicationFavourite,
  createJobApplicationResponse: createWorkspaceJobApplicationResponse,
  updateJobApplicationResponse: updateWorkspaceJobApplicationResponse,
  deleteJobApplicationResponse: deleteWorkspaceJobApplicationResponse,
};

export { adminJobApplicationService, workspaceJobApplicationService };

export {
  listJobApplications,
  fetchJobApplication,
  createAdminJobApplication as createJobApplication,
  updateAdminJobApplication as updateJobApplication,
  deleteAdminJobApplication as deleteJobApplication,
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

export {
  fetchJobApplicationWorkspace,
  createWorkspaceJobApplication,
  updateWorkspaceJobApplication,
  archiveWorkspaceJobApplication,
  createWorkspaceJobApplicationInterview,
  updateWorkspaceJobApplicationInterview,
  deleteWorkspaceJobApplicationInterview,
  createWorkspaceJobApplicationFavourite,
  updateWorkspaceJobApplicationFavourite,
  deleteWorkspaceJobApplicationFavourite,
  createWorkspaceJobApplicationResponse,
  updateWorkspaceJobApplicationResponse,
  deleteWorkspaceJobApplicationResponse,
};

export default {
  admin: adminJobApplicationService,
  workspace: workspaceJobApplicationService,
};
