import apiClient from './apiClient.js';

function ensureId(value, message) {
  if (value === undefined || value === null || `${value}`.trim().length === 0) {
    throw new Error(message);
  }
  return typeof value === 'string' ? value.trim() : value;
}

function withWorkspace(payload = {}, workspaceId) {
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    return { ...payload, workspaceId };
  }
  return payload;
}

function appendActor(payload = {}, actorId, actorName) {
  const next = { ...payload };
  if (actorId != null) {
    next.actorId = actorId;
  }
  if (actorName) {
    next.actorName = actorName;
  }
  return next;
}

export function fetchIntegrationControlTower({ workspaceId, signal } = {}) {
  const params = {};
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    params.workspaceId = workspaceId;
  }
  return apiClient.get('/company/integrations/crm', { params, signal });
}

export function updateCrmIntegration(providerKey, { workspaceId, actorId, actorName, ...payload } = {}) {
  const resolvedProviderKey = ensureId(providerKey, 'providerKey is required to update an integration.');
  const body = appendActor(withWorkspace(payload, workspaceId), actorId, actorName);
  return apiClient.patch(`/company/integrations/crm/${resolvedProviderKey}`, body);
}

export function rotateCrmCredential(
  integrationId,
  { workspaceId, providerKey, secret, credentialType, expiresAt, actorId, actorName } = {},
) {
  const resolvedIntegrationId = ensureId(integrationId, 'integrationId is required to rotate credentials.');
  const resolvedProviderKey = ensureId(providerKey, 'providerKey is required to rotate credentials.');
  const body = appendActor(withWorkspace({ providerKey: resolvedProviderKey, secret, credentialType, expiresAt }, workspaceId), actorId, actorName);
  return apiClient.post(`/company/integrations/crm/${resolvedIntegrationId}/credentials`, body);
}

export function updateCrmFieldMappings(
  integrationId,
  { workspaceId, providerKey, mappings = [], actorId, actorName } = {},
) {
  const resolvedIntegrationId = ensureId(integrationId, 'integrationId is required to update mappings.');
  const resolvedProviderKey = ensureId(providerKey, 'providerKey is required to update mappings.');
  const body = appendActor(withWorkspace({ providerKey: resolvedProviderKey, mappings }, workspaceId), actorId, actorName);
  return apiClient.put(`/company/integrations/crm/${resolvedIntegrationId}/field-mappings`, body);
}

export function updateCrmRoleAssignments(
  integrationId,
  { workspaceId, providerKey, assignments = [], actorId, actorName } = {},
) {
  const resolvedIntegrationId = ensureId(integrationId, 'integrationId is required to update role assignments.');
  const resolvedProviderKey = ensureId(providerKey, 'providerKey is required to update role assignments.');
  const body = appendActor(withWorkspace({ providerKey: resolvedProviderKey, assignments }, workspaceId), actorId, actorName);
  return apiClient.put(`/company/integrations/crm/${resolvedIntegrationId}/role-assignments`, body);
}

export function triggerCrmManualSync(
  integrationId,
  { workspaceId, providerKey, trigger = 'manual', notes = null, actorId, actorName } = {},
) {
  const resolvedIntegrationId = ensureId(integrationId, 'integrationId is required to trigger a sync.');
  const resolvedProviderKey = ensureId(providerKey, 'providerKey is required to trigger a sync.');
  const body = appendActor(withWorkspace({ providerKey: resolvedProviderKey, trigger, notes }, workspaceId), actorId, actorName);
  return apiClient.post(`/company/integrations/crm/${resolvedIntegrationId}/trigger-sync`, body);
}

export function createCrmIncident(
  integrationId,
  { workspaceId, providerKey, severity, summary, description, actorId, actorName } = {},
) {
  const resolvedIntegrationId = ensureId(integrationId, 'integrationId is required to create an incident.');
  const resolvedProviderKey = ensureId(providerKey, 'providerKey is required to create an incident.');
  const body = appendActor(
    withWorkspace({ providerKey: resolvedProviderKey, severity, summary, description }, workspaceId),
    actorId,
    actorName,
  );
  return apiClient.post(`/company/integrations/crm/${resolvedIntegrationId}/incidents`, body);
}

export function resolveCrmIncident(
  integrationId,
  incidentId,
  { workspaceId, providerKey, actorId, actorName } = {},
) {
  const resolvedIntegrationId = ensureId(integrationId, 'integrationId is required to resolve an incident.');
  const resolvedIncidentId = ensureId(incidentId, 'incidentId is required to resolve an incident.');
  const resolvedProviderKey = ensureId(providerKey, 'providerKey is required to resolve an incident.');
  const body = appendActor(withWorkspace({ providerKey: resolvedProviderKey }, workspaceId), actorId, actorName);
  return apiClient.patch(`/company/integrations/crm/${resolvedIntegrationId}/incidents/${resolvedIncidentId}/resolve`, body);
}

export default {
  fetchIntegrationControlTower,
  updateCrmIntegration,
  rotateCrmCredential,
  updateCrmFieldMappings,
  updateCrmRoleAssignments,
  triggerCrmManualSync,
  createCrmIncident,
  resolveCrmIncident,
};
