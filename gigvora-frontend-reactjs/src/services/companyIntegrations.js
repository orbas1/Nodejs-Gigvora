import apiClient from './apiClient.js';

export function fetchIntegrationControlTower({ workspaceId, signal } = {}) {
  const params = {};
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    params.workspaceId = workspaceId;
  }
  return apiClient.get('/company/integrations/crm', { params, signal });
}

export function updateCrmIntegration(providerKey, { workspaceId, actorId, actorName, ...payload } = {}) {
  const body = { ...payload };
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    body.workspaceId = workspaceId;
  }
  if (actorId != null) {
    body.actorId = actorId;
  }
  if (actorName) {
    body.actorName = actorName;
  }
  return apiClient.patch(`/company/integrations/crm/${providerKey}`, body);
}

export function rotateCrmCredential(
  integrationId,
  { workspaceId, providerKey, secret, credentialType, expiresAt, actorId, actorName } = {},
) {
  const body = { providerKey, secret, credentialType, expiresAt };
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    body.workspaceId = workspaceId;
  }
  if (actorId != null) {
    body.actorId = actorId;
  }
  if (actorName) {
    body.actorName = actorName;
  }
  return apiClient.post(`/company/integrations/crm/${integrationId}/credentials`, body);
}

export function updateCrmFieldMappings(
  integrationId,
  { workspaceId, providerKey, mappings = [], actorId, actorName } = {},
) {
  const body = { providerKey, mappings };
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    body.workspaceId = workspaceId;
  }
  if (actorId != null) {
    body.actorId = actorId;
  }
  if (actorName) {
    body.actorName = actorName;
  }
  return apiClient.put(`/company/integrations/crm/${integrationId}/field-mappings`, body);
}

export function updateCrmRoleAssignments(
  integrationId,
  { workspaceId, providerKey, assignments = [], actorId, actorName } = {},
) {
  const body = { providerKey, assignments };
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    body.workspaceId = workspaceId;
  }
  if (actorId != null) {
    body.actorId = actorId;
  }
  if (actorName) {
    body.actorName = actorName;
  }
  return apiClient.put(`/company/integrations/crm/${integrationId}/role-assignments`, body);
}

export function triggerCrmManualSync(
  integrationId,
  { workspaceId, providerKey, trigger = 'manual', notes = null, actorId, actorName } = {},
) {
  const body = { providerKey, trigger, notes };
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    body.workspaceId = workspaceId;
  }
  if (actorId != null) {
    body.actorId = actorId;
  }
  if (actorName) {
    body.actorName = actorName;
  }
  return apiClient.post(`/company/integrations/crm/${integrationId}/trigger-sync`, body);
}

export function createCrmIncident(
  integrationId,
  { workspaceId, providerKey, severity, summary, description, actorId, actorName } = {},
) {
  const body = { providerKey, severity, summary, description };
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    body.workspaceId = workspaceId;
  }
  if (actorId != null) {
    body.actorId = actorId;
  }
  if (actorName) {
    body.actorName = actorName;
  }
  return apiClient.post(`/company/integrations/crm/${integrationId}/incidents`, body);
}

export function resolveCrmIncident(
  integrationId,
  incidentId,
  { workspaceId, providerKey, actorId, actorName } = {},
) {
  const body = { providerKey };
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    body.workspaceId = workspaceId;
  }
  if (actorId != null) {
    body.actorId = actorId;
  }
  if (actorName) {
    body.actorName = actorName;
  }
  return apiClient.patch(`/company/integrations/crm/${integrationId}/incidents/${incidentId}/resolve`, body);
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
