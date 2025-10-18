import { apiClient } from './apiClient.js';

export function fetchApiRegistry(options = {}) {
  return apiClient.get('/admin/api/registry', options);
}

export function createApiProvider(payload, options = {}) {
  return apiClient.post('/admin/api/providers', payload, options);
}

export function updateApiProvider(providerId, payload, options = {}) {
  return apiClient.put(`/admin/api/providers/${providerId}`, payload, options);
}

export function createApiClient(payload, options = {}) {
  return apiClient.post('/admin/api/clients', payload, options);
}

export function updateApiClient(clientId, payload, options = {}) {
  return apiClient.put(`/admin/api/clients/${clientId}`, payload, options);
}

export function issueApiClientKey(clientId, payload, options = {}) {
  return apiClient.post(`/admin/api/clients/${clientId}/keys`, payload, options);
}

export function revokeApiClientKey(clientId, keyId, options = {}) {
  return apiClient.delete(`/admin/api/clients/${clientId}/keys/${keyId}`, options);
}

export function rotateWebhookSecret(clientId, options = {}) {
  return apiClient.post(`/admin/api/clients/${clientId}/webhook/rotate`, {}, options);
}

export function fetchClientAuditEvents(clientId, params = {}, options = {}) {
  return apiClient.get(`/admin/api/clients/${clientId}/audit-events`, {
    ...options,
    params,
  });
}

export function listWalletAccounts(params = {}, options = {}) {
  return apiClient.get('/admin/api/wallet-accounts', {
    ...options,
    params,
  });
}

export function recordClientUsage(clientId, payload, options = {}) {
  return apiClient.post(`/admin/api/clients/${clientId}/usage`, payload, options);
}

export default {
  fetchApiRegistry,
  createApiProvider,
  updateApiProvider,
  createApiClient,
  updateApiClient,
  issueApiClientKey,
  revokeApiClientKey,
  rotateWebhookSecret,
  fetchClientAuditEvents,
  listWalletAccounts,
  recordClientUsage,
};
