import { apiClient } from './apiClient.js';

export function fetchApiRegistry(options = {}) {
  return apiClient.get('/admin/api/registry', options);
}

export function createApiProvider(payload = {}, options = {}) {
  return apiClient.post('/admin/api/providers', payload, options);
}

export function updateApiProvider(providerId, payload = {}, options = {}) {
  if (!providerId) {
    throw new Error('providerId is required');
  }
  return apiClient.put(`/admin/api/providers/${providerId}`, payload, options);
}

export function createApiClient(payload = {}, options = {}) {
  return apiClient.post('/admin/api/clients', payload, options);
}

export function updateApiClient(clientId, payload = {}, options = {}) {
  if (!clientId) {
    throw new Error('clientId is required');
  }
  return apiClient.put(`/admin/api/clients/${clientId}`, payload, options);
}

export function issueApiClientKey(clientId, payload = {}, options = {}) {
  if (!clientId) {
    throw new Error('clientId is required');
  }
  return apiClient.post(`/admin/api/clients/${clientId}/keys`, payload, options);
}

export function revokeApiClientKey(clientId, keyId, options = {}) {
  if (!clientId) {
    throw new Error('clientId is required');
  }
  if (!keyId) {
    throw new Error('keyId is required');
  }
  return apiClient.delete(`/admin/api/clients/${clientId}/keys/${keyId}`, options);
}

export function rotateWebhookSecret(clientId, options = {}) {
  if (!clientId) {
    throw new Error('clientId is required');
  }
  return apiClient.post(`/admin/api/clients/${clientId}/webhook/rotate`, {}, options);
}

export function fetchClientAuditEvents(clientId, params = {}, options = {}) {
  if (!clientId) {
    throw new Error('clientId is required');
  }
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

export function recordClientUsage(clientId, payload = {}, options = {}) {
  if (!clientId) {
    throw new Error('clientId is required');
  }
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
