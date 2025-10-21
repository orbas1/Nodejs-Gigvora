import { apiClient } from './apiClient.js';

function sanitiseParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && `${value}`.length > 0),
  );
}

export function fetchAgencyInboxWorkspace({ workspaceId, forceRefresh = false } = {}, { signal } = {}) {
  if (!workspaceId) {
    throw new Error('workspaceId is required to load the agency inbox workspace.');
  }

  return apiClient.get('/agency/inbox/workspace', {
    params: sanitiseParams({ workspaceId, forceRefresh }),
    signal,
  });
}

export function saveAgencyInboxPreferences({ workspaceId, ...payload } = {}) {
  if (!workspaceId) {
    throw new Error('workspaceId is required to update agency inbox preferences.');
  }

  return apiClient.put('/agency/inbox/preferences', { workspaceId, ...payload });
}

export function createAgencyInboxSavedReply({ workspaceId, ...payload } = {}) {
  if (!workspaceId) {
    throw new Error('workspaceId is required to create an agency saved reply.');
  }

  return apiClient.post('/agency/inbox/saved-replies', { workspaceId, ...payload });
}

export function updateAgencyInboxSavedReply(replyId, { workspaceId, ...payload } = {}) {
  if (!replyId) {
    throw new Error('replyId is required to update an agency saved reply.');
  }
  if (!workspaceId) {
    throw new Error('workspaceId is required to update an agency saved reply.');
  }

  return apiClient.patch(`/agency/inbox/saved-replies/${replyId}`, { workspaceId, ...payload });
}

export function deleteAgencyInboxSavedReply(replyId, { workspaceId } = {}) {
  if (!replyId) {
    throw new Error('replyId is required to delete an agency saved reply.');
  }
  if (!workspaceId) {
    throw new Error('workspaceId is required to delete an agency saved reply.');
  }

  return apiClient.delete(`/agency/inbox/saved-replies/${replyId}`, { body: { workspaceId } });
}

export function createAgencyInboxRoutingRule({ workspaceId, ...payload } = {}) {
  if (!workspaceId) {
    throw new Error('workspaceId is required to create an agency routing rule.');
  }

  return apiClient.post('/agency/inbox/routing-rules', { workspaceId, ...payload });
}

export function updateAgencyInboxRoutingRule(ruleId, { workspaceId, ...payload } = {}) {
  if (!ruleId) {
    throw new Error('ruleId is required to update an agency routing rule.');
  }
  if (!workspaceId) {
    throw new Error('workspaceId is required to update an agency routing rule.');
  }

  return apiClient.patch(`/agency/inbox/routing-rules/${ruleId}`, { workspaceId, ...payload });
}

export function deleteAgencyInboxRoutingRule(ruleId, { workspaceId } = {}) {
  if (!ruleId) {
    throw new Error('ruleId is required to delete an agency routing rule.');
  }
  if (!workspaceId) {
    throw new Error('workspaceId is required to delete an agency routing rule.');
  }

  return apiClient.delete(`/agency/inbox/routing-rules/${ruleId}`, { body: { workspaceId } });
}

export function saveAgencyInboxAutomations({ workspaceId, ...payload } = {}) {
  if (!workspaceId) {
    throw new Error('workspaceId is required to update agency inbox automations.');
  }

  return apiClient.put('/agency/inbox/automations', { workspaceId, ...payload });
}

export default {
  fetchAgencyInboxWorkspace,
  saveAgencyInboxPreferences,
  createAgencyInboxSavedReply,
  updateAgencyInboxSavedReply,
  deleteAgencyInboxSavedReply,
  createAgencyInboxRoutingRule,
  updateAgencyInboxRoutingRule,
  deleteAgencyInboxRoutingRule,
  saveAgencyInboxAutomations,
};
