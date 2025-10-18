import { apiClient } from './apiClient.js';

export function fetchWalletManagement(userId, { signal, refresh = false } = {}) {
  if (!userId) {
    throw new Error('userId is required to load wallet management data.');
  }
  const query = refresh ? '?refresh=true' : '';
  return apiClient.get(`/users/${userId}/wallet${query}`, { signal });
}

export function createFundingSource(userId, payload) {
  return apiClient.post(`/users/${userId}/wallet/funding-sources`, payload);
}

export function updateFundingSource(userId, fundingSourceId, payload) {
  return apiClient.patch(`/users/${userId}/wallet/funding-sources/${fundingSourceId}`, payload);
}

export function createTransferRule(userId, payload) {
  return apiClient.post(`/users/${userId}/wallet/transfer-rules`, payload);
}

export function updateTransferRule(userId, ruleId, payload) {
  return apiClient.patch(`/users/${userId}/wallet/transfer-rules/${ruleId}`, payload);
}

export function deleteTransferRule(userId, ruleId) {
  return apiClient.delete(`/users/${userId}/wallet/transfer-rules/${ruleId}`);
}

export function createTransferRequest(userId, payload) {
  return apiClient.post(`/users/${userId}/wallet/transfers`, payload);
}

export function updateTransferRequest(userId, transferId, payload) {
  return apiClient.patch(`/users/${userId}/wallet/transfers/${transferId}`, payload);
}

export default {
  fetchWalletManagement,
  createFundingSource,
  updateFundingSource,
  createTransferRule,
  updateTransferRule,
  deleteTransferRule,
  createTransferRequest,
  updateTransferRequest,
};
