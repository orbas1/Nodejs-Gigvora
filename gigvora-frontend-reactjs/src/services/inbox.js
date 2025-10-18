import apiClient from './apiClient.js';

function sanitizeParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && `${value}`.length > 0),
  );
}

export async function fetchInboxWorkspace({ userId, forceRefresh = false } = {}) {
  const params = sanitizeParams({ userId, forceRefresh });
  return apiClient.get('/messaging/inbox/workspace', { params });
}

export async function saveInboxPreferences({ userId, ...payload } = {}) {
  return apiClient.put('/messaging/inbox/preferences', { userId, ...payload });
}

export async function createInboxSavedReply({ userId, ...payload } = {}) {
  return apiClient.post('/messaging/inbox/saved-replies', { userId, ...payload });
}

export async function updateInboxSavedReply(replyId, { userId, ...payload } = {}) {
  return apiClient.patch(`/messaging/inbox/saved-replies/${replyId}`, { userId, ...payload });
}

export async function deleteInboxSavedReply(replyId, { userId } = {}) {
  return apiClient.delete(`/messaging/inbox/saved-replies/${replyId}`, { data: { userId } });
}

export async function createInboxRoutingRule({ userId, ...payload } = {}) {
  return apiClient.post('/messaging/inbox/routing-rules', { userId, ...payload });
}

export async function updateInboxRoutingRule(ruleId, { userId, ...payload } = {}) {
  return apiClient.patch(`/messaging/inbox/routing-rules/${ruleId}`, { userId, ...payload });
}

export async function deleteInboxRoutingRule(ruleId, { userId } = {}) {
  return apiClient.delete(`/messaging/inbox/routing-rules/${ruleId}`, { data: { userId } });
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
