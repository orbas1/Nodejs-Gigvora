import { apiClient } from './apiClient.js';

export function fetchJobApplicationWorkspace(userId, { signal, limit } = {}) {
  if (!userId) {
    throw new Error('userId is required to load the job application workspace.');
  }
  const params = { ownerId: userId };
  if (limit != null) {
    params.limit = limit;
  }
  return apiClient.get('/job-applications/workspace', { params, signal });
}

export function createJobApplication(userId, payload) {
  if (!userId) {
    throw new Error('userId is required to create a job application.');
  }
  return apiClient.post('/job-applications', { ...payload, ownerId: userId });
}

export function updateJobApplication(userId, applicationId, payload) {
  if (!userId) {
    throw new Error('userId is required to update a job application.');
  }
  if (!applicationId) {
    throw new Error('applicationId is required to update a job application.');
  }
  return apiClient.patch(`/job-applications/${applicationId}`, { ...payload, ownerId: userId });
}

export function archiveJobApplication(userId, applicationId) {
  if (!userId) {
    throw new Error('userId is required to archive a job application.');
  }
  if (!applicationId) {
    throw new Error('applicationId is required to archive a job application.');
  }
  return apiClient.delete(`/job-applications/${applicationId}`, { params: { ownerId: userId } });
}

export function createJobApplicationInterview(userId, applicationId, payload) {
  if (!userId) {
    throw new Error('userId is required to create an interview.');
  }
  if (!applicationId) {
    throw new Error('applicationId is required to create an interview.');
  }
  return apiClient.post(`/job-applications/${applicationId}/interviews`, { ...payload, ownerId: userId });
}

export function updateJobApplicationInterview(userId, applicationId, interviewId, payload) {
  if (!userId) {
    throw new Error('userId is required to update an interview.');
  }
  if (!applicationId || !interviewId) {
    throw new Error('applicationId and interviewId are required to update an interview.');
  }
  return apiClient.patch(`/job-applications/${applicationId}/interviews/${interviewId}`, {
    ...payload,
    ownerId: userId,
  });
}

export function deleteJobApplicationInterview(userId, applicationId, interviewId) {
  if (!userId) {
    throw new Error('userId is required to delete an interview.');
  }
  if (!applicationId || !interviewId) {
    throw new Error('applicationId and interviewId are required to delete an interview.');
  }
  return apiClient.delete(`/job-applications/${applicationId}/interviews/${interviewId}`, {
    params: { ownerId: userId },
  });
}

export function createJobApplicationFavourite(userId, payload) {
  if (!userId) {
    throw new Error('userId is required to create a favourite.');
  }
  return apiClient.post('/job-applications/favourites', { ...payload, ownerId: userId });
}

export function updateJobApplicationFavourite(userId, favouriteId, payload) {
  if (!userId) {
    throw new Error('userId is required to update a favourite.');
  }
  if (!favouriteId) {
    throw new Error('favouriteId is required to update a favourite.');
  }
  return apiClient.patch(`/job-applications/favourites/${favouriteId}`, { ...payload, ownerId: userId });
}

export function deleteJobApplicationFavourite(userId, favouriteId) {
  if (!userId) {
    throw new Error('userId is required to delete a favourite.');
  }
  if (!favouriteId) {
    throw new Error('favouriteId is required to delete a favourite.');
  }
  return apiClient.delete(`/job-applications/favourites/${favouriteId}`, { params: { ownerId: userId } });
}

export function createJobApplicationResponse(userId, applicationId, payload) {
  if (!userId) {
    throw new Error('userId is required to log a response.');
  }
  if (!applicationId) {
    throw new Error('applicationId is required to log a response.');
  }
  return apiClient.post(`/job-applications/${applicationId}/responses`, { ...payload, ownerId: userId });
}

export function updateJobApplicationResponse(userId, applicationId, responseId, payload) {
  if (!userId) {
    throw new Error('userId is required to update a response.');
  }
  if (!applicationId || !responseId) {
    throw new Error('applicationId and responseId are required to update a response.');
  }
  return apiClient.patch(`/job-applications/${applicationId}/responses/${responseId}`, {
    ...payload,
    ownerId: userId,
  });
}

export function deleteJobApplicationResponse(userId, applicationId, responseId) {
  if (!userId) {
    throw new Error('userId is required to delete a response.');
  }
  if (!applicationId || !responseId) {
    throw new Error('applicationId and responseId are required to delete a response.');
  }
  return apiClient.delete(`/job-applications/${applicationId}/responses/${responseId}`, {
    params: { ownerId: userId },
  });
}

export default {
  fetchJobApplicationWorkspace,
  createJobApplication,
  updateJobApplication,
  archiveJobApplication,
  createJobApplicationInterview,
  updateJobApplicationInterview,
  deleteJobApplicationInterview,
  createJobApplicationFavourite,
  updateJobApplicationFavourite,
  deleteJobApplicationFavourite,
  createJobApplicationResponse,
  updateJobApplicationResponse,
  deleteJobApplicationResponse,
};
