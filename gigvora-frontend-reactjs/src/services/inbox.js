import apiClient from './apiClient.js';

function sanitizeParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && `${value}`.length > 0),
  );
}

function assertIdentifier(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

export async function fetchInboxWorkspace({ userId, forceRefresh = false, signal } = {}) {
  const params = sanitizeParams({ userId, forceRefresh: forceRefresh ? 'true' : undefined });
  return apiClient.get('/messaging/inbox/workspace', { params, signal });
}

export async function saveInboxPreferences({ userId, ...payload } = {}, { signal } = {}) {
  assertIdentifier(userId, 'userId is required to update inbox preferences.');
  return apiClient.put('/messaging/inbox/preferences', { userId, ...payload }, { signal });
}

export async function createInboxSavedReply({ userId, ...payload } = {}, { signal } = {}) {
  assertIdentifier(userId, 'userId is required to create a saved reply.');
  if (!payload.content) {
    throw new Error('content is required to create a saved reply.');
  }
  return apiClient.post('/messaging/inbox/saved-replies', { userId, ...payload }, { signal });
}

export async function updateInboxSavedReply(replyId, { userId, ...payload } = {}, { signal } = {}) {
  assertIdentifier(replyId, 'replyId is required to update a saved reply.');
  assertIdentifier(userId, 'userId is required to update a saved reply.');
  return apiClient.patch(`/messaging/inbox/saved-replies/${replyId}`, { userId, ...payload }, { signal });
}

export async function deleteInboxSavedReply(replyId, { userId } = {}, { signal } = {}) {
  assertIdentifier(replyId, 'replyId is required to delete a saved reply.');
  assertIdentifier(userId, 'userId is required to delete a saved reply.');
  return apiClient.delete(`/messaging/inbox/saved-replies/${replyId}`, { signal, body: { userId } });
}

export async function createInboxRoutingRule({ userId, ...payload } = {}, { signal } = {}) {
  assertIdentifier(userId, 'userId is required to create a routing rule.');
  if (!payload.trigger) {
    throw new Error('trigger is required to create a routing rule.');
  }
  return apiClient.post('/messaging/inbox/routing-rules', { userId, ...payload }, { signal });
}

export async function updateInboxRoutingRule(ruleId, { userId, ...payload } = {}, { signal } = {}) {
  assertIdentifier(ruleId, 'ruleId is required to update a routing rule.');
  assertIdentifier(userId, 'userId is required to update a routing rule.');
  return apiClient.patch(`/messaging/inbox/routing-rules/${ruleId}`, { userId, ...payload }, { signal });
}

export async function deleteInboxRoutingRule(ruleId, { userId } = {}, { signal } = {}) {
  assertIdentifier(ruleId, 'ruleId is required to delete a routing rule.');
  assertIdentifier(userId, 'userId is required to delete a routing rule.');
  return apiClient.delete(`/messaging/inbox/routing-rules/${ruleId}`, { signal, body: { userId } });
}

export default {
  fetchInboxWorkspace,
  saveInboxPreferences,
  createInboxSavedReply,
  updateInboxSavedReply,
  deleteInboxSavedReply,
  createInboxRoutingRule,
  updateInboxRoutingRule,
  deleteInboxRoutingRule,
};
