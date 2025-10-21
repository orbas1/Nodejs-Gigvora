import { apiClient } from './apiClient.js';

export async function fetchExplorerRecords(category, params = {}) {
  return apiClient.get(`/explorer/${category}`, { params });
}

export async function fetchExplorerRecord(category, recordId) {
  return apiClient.get(`/explorer/${category}/${recordId}`);
}

export async function createExplorerRecord(category, payload) {
  return apiClient.post(`/explorer/${category}`, payload);
}

export async function updateExplorerRecord(category, recordId, payload) {
  return apiClient.put(`/explorer/${category}/${recordId}`, payload);
}

export async function deleteExplorerRecord(category, recordId) {
  return apiClient.delete(`/explorer/${category}/${recordId}`);
}

export default {
  fetchExplorerRecords,
  fetchExplorerRecord,
  createExplorerRecord,
  updateExplorerRecord,
  deleteExplorerRecord,
};
