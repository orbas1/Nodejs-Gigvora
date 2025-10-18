import { apiClient } from './apiClient.js';

export function fetchCoverLetterWorkspace(userId, { signal } = {}) {
  if (!userId) {
    throw new Error('userId is required to load cover letter workspace data.');
  }
  return apiClient.get(`/users/${userId}/cover-letters/workspace`, { signal });
}

export function createCoverLetter(userId, payload) {
  if (!userId) {
    throw new Error('userId is required to create a cover letter.');
  }
  return apiClient.post(`/users/${userId}/cover-letters`, payload);
}

export function uploadCoverLetterVersion(userId, documentId, payload) {
  if (!userId) {
    throw new Error('userId is required to upload a cover letter version.');
  }
  if (!documentId) {
    throw new Error('documentId is required to upload a cover letter version.');
  }
  return apiClient.post(`/users/${userId}/cover-letters/${documentId}/upload`, payload);
}

export function createStoryBlock(userId, payload) {
  if (!userId) {
    throw new Error('userId is required to create a story block.');
  }
  return apiClient.post(`/users/${userId}/story-blocks`, payload);
}

export function uploadStoryBlockVersion(userId, documentId, payload) {
  if (!userId) {
    throw new Error('userId is required to update a story block.');
  }
  if (!documentId) {
    throw new Error('documentId is required to update a story block.');
  }
  return apiClient.post(`/users/${userId}/story-blocks/${documentId}/upload`, payload);
}

export default {
  fetchCoverLetterWorkspace,
  createCoverLetter,
  uploadCoverLetterVersion,
  createStoryBlock,
  uploadStoryBlockVersion,
};
