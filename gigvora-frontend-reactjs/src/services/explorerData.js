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

export async function fetchExplorerInteractions(category, recordId) {
  return apiClient.get(`/explorer/${category}/${recordId}/interactions`);
}

export async function createExplorerInteraction(category, recordId, payload) {
  return apiClient.post(`/explorer/${category}/${recordId}/interactions`, payload);
}

export async function updateExplorerInteraction(category, recordId, interactionId, payload) {
  return apiClient.put(`/explorer/${category}/${recordId}/interactions/${interactionId}`, payload);
}

export async function deleteExplorerInteraction(category, recordId, interactionId) {
  return apiClient.delete(`/explorer/${category}/${recordId}/interactions/${interactionId}`);
}

export default {
  fetchExplorerRecords,
  fetchExplorerRecord,
  createExplorerRecord,
  updateExplorerRecord,
  deleteExplorerRecord,
  fetchExplorerInteractions,
  createExplorerInteraction,
  updateExplorerInteraction,
  deleteExplorerInteraction,
};
