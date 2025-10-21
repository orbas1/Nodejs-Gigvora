import { apiClient } from './apiClient.js';

export function fetchCompanySystemPreferences({ workspaceId } = {}, { signal } = {}) {
  const params = {};
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    params.workspaceId = workspaceId;
  }
  return apiClient.get('/company/system-preferences', { params, signal });
}

export function updateCompanySystemPreferences(payload, { signal } = {}) {
  return apiClient.put('/company/system-preferences', payload ?? {}, { signal });
}

export function createCompanyWebhook(payload, { signal } = {}) {
  return apiClient.post('/company/system-preferences/webhooks', payload ?? {}, { signal });
}

export function updateCompanyWebhook(webhookId, payload, { signal } = {}) {
  if (!webhookId) {
    throw new Error('webhookId is required to update a webhook.');
  }
  return apiClient.put(`/company/system-preferences/webhooks/${webhookId}`, payload ?? {}, { signal });
}

export function deleteCompanyWebhook(webhookId, { signal } = {}) {
  if (!webhookId) {
    throw new Error('webhookId is required to delete a webhook.');
  }
  return apiClient.delete(`/company/system-preferences/webhooks/${webhookId}`, { signal });
}

export function triggerCompanyWebhookTest(webhookId, payload = {}, { signal } = {}) {
  if (!webhookId) {
    throw new Error('webhookId is required to trigger a webhook test.');
  }
  return apiClient.post(`/company/system-preferences/webhooks/${webhookId}/test`, payload ?? {}, { signal });
}

export function createCompanyApiToken(payload = {}, { signal } = {}) {
  return apiClient.post('/company/system-preferences/api-tokens', payload ?? {}, { signal });
}

export function revokeCompanyApiToken(tokenId, { signal } = {}) {
  if (!tokenId) {
    throw new Error('tokenId is required to revoke an API token.');
  }
  return apiClient.delete(`/company/system-preferences/api-tokens/${tokenId}`, { signal });
}

export default {
  fetchCompanySystemPreferences,
  updateCompanySystemPreferences,
  createCompanyWebhook,
  updateCompanyWebhook,
  deleteCompanyWebhook,
  triggerCompanyWebhookTest,
  createCompanyApiToken,
  revokeCompanyApiToken,
};
