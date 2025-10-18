import { apiClient } from './apiClient.js';

export function fetchAgencyIntegrations({ workspaceId, signal } = {}) {
  return apiClient.get('/agency/integrations', {
    params: { workspaceId: workspaceId ?? undefined },
    signal,
  });
}

export function createAgencyIntegration(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('payload is required to create an integration');
  }
  return apiClient.post('/agency/integrations', payload);
}

export function updateAgencyIntegration(integrationId, payload) {
  if (!integrationId) {
    throw new Error('integrationId is required');
  }
  return apiClient.patch(`/agency/integrations/${integrationId}`, payload ?? {});
}

export function rotateAgencyIntegrationSecret(integrationId, payload) {
  if (!integrationId) {
    throw new Error('integrationId is required');
  }
  if (!payload || typeof payload !== 'object') {
    throw new Error('payload is required to rotate credentials');
  }
  return apiClient.post(`/agency/integrations/${integrationId}/secrets`, payload);
}

export function createAgencyIntegrationWebhook(integrationId, payload) {
  if (!integrationId) {
    throw new Error('integrationId is required');
  }
  return apiClient.post(`/agency/integrations/${integrationId}/webhooks`, payload ?? {});
}

export function updateAgencyIntegrationWebhook(integrationId, webhookId, payload) {
  if (!integrationId || !webhookId) {
    throw new Error('integrationId and webhookId are required');
  }
  return apiClient.patch(`/agency/integrations/${integrationId}/webhooks/${webhookId}`, payload ?? {});
}

export function deleteAgencyIntegrationWebhook(integrationId, webhookId) {
  if (!integrationId || !webhookId) {
    throw new Error('integrationId and webhookId are required');
  }
  return apiClient.delete(`/agency/integrations/${integrationId}/webhooks/${webhookId}`);
}

export function testAgencyIntegrationConnection(integrationId) {
  if (!integrationId) {
    throw new Error('integrationId is required');
  }
  return apiClient.post(`/agency/integrations/${integrationId}/test`);
}

export default {
  fetchAgencyIntegrations,
  createAgencyIntegration,
  updateAgencyIntegration,
  rotateAgencyIntegrationSecret,
  createAgencyIntegrationWebhook,
  updateAgencyIntegrationWebhook,
  deleteAgencyIntegrationWebhook,
  testAgencyIntegrationConnection,
};
