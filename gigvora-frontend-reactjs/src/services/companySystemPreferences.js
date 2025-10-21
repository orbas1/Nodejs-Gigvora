import { apiClient } from './apiClient.js';
import { buildRequestOptions, resolveSignal, requireIdentifier } from './serviceHelpers.js';

export function fetchCompanySystemPreferences({ workspaceId, signal } = {}, options = {}) {
  const params = {};
  if (workspaceId != null && `${workspaceId}`.toString().trim().length > 0) {
    params.workspaceId = `${workspaceId}`.toString().trim();
  }
  const requestOptions = buildRequestOptions({
    params,
    signal: resolveSignal(signal, options.signal),
  });
  return apiClient.get('/company/system-preferences', requestOptions);
}

export function updateCompanySystemPreferences(payload = {}, options = {}) {
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.put('/company/system-preferences', payload ?? {}, requestOptions);
}

export function createCompanyWebhook(payload = {}, options = {}) {
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.post('/company/system-preferences/webhooks', payload ?? {}, requestOptions);
}

export function updateCompanyWebhook(webhookId, payload = {}, options = {}) {
  const webhookIdentifier = requireIdentifier(webhookId, 'webhookId');
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.put(`/company/system-preferences/webhooks/${webhookIdentifier}`, payload ?? {}, requestOptions);
}

export function deleteCompanyWebhook(webhookId, options = {}) {
  const webhookIdentifier = requireIdentifier(webhookId, 'webhookId');
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.delete(`/company/system-preferences/webhooks/${webhookIdentifier}`, requestOptions);
}

export function triggerCompanyWebhookTest(webhookId, payload = {}, options = {}) {
  const webhookIdentifier = requireIdentifier(webhookId, 'webhookId');
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.post(
    `/company/system-preferences/webhooks/${webhookIdentifier}/test`,
    payload ?? {},
    requestOptions,
  );
}

export function createCompanyApiToken(payload = {}, options = {}) {
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.post('/company/system-preferences/api-tokens', payload ?? {}, requestOptions);
}

export function revokeCompanyApiToken(tokenId, options = {}) {
  const tokenIdentifier = requireIdentifier(tokenId, 'tokenId');
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.delete(`/company/system-preferences/api-tokens/${tokenIdentifier}`, requestOptions);
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
