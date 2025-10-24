import { apiClient } from './apiClient.js';

function ensureUserId(userId) {
  if (!userId) {
    throw new Error('A userId is required to manage privacy requests.');
  }
  return userId;
}

export async function listDataExportRequests(userId, { signal } = {}) {
  const id = ensureUserId(userId);
  return apiClient.get(`/users/${id}/data-exports`, { signal });
}

export async function createDataExportRequest(userId, payload = {}, { signal } = {}) {
  const id = ensureUserId(userId);
  if (payload != null && typeof payload !== 'object') {
    throw new Error('Payload must be an object when requesting a data export.');
  }
  return apiClient.post(`/users/${id}/data-exports`, payload ?? {}, { signal });
}

export default {
  listDataExportRequests,
  createDataExportRequest,
};
