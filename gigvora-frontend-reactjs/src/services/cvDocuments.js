import { apiClient } from './apiClient.js';

export function fetchCvWorkspace(userId, { signal } = {}) {
  if (!userId) {
    throw new Error('userId is required to load the CV workspace.');
  }
  return apiClient.get(`/users/${userId}/cv-documents/workspace`, { signal });
}

export function createCvDocument(userId, payload) {
  if (!userId) {
    throw new Error('userId is required to create a CV document.');
  }
  return apiClient.post(`/users/${userId}/cv-documents`, payload);
}

export function uploadCvVersion(userId, documentId, payload) {
  if (!userId) {
    throw new Error('userId is required to upload a CV version.');
  }
  if (!documentId) {
    throw new Error('documentId is required to upload a CV version.');
  }
  return apiClient.post(`/users/${userId}/cv-documents/${documentId}/upload`, payload);
}

export default {
  fetchCvWorkspace,
  createCvDocument,
  uploadCvVersion,
};
