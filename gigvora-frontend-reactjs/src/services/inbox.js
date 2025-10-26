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
  if (!payload.title || !payload.body) {
    throw new Error('title and body are required to create a saved reply.');
  }
  return apiClient.post('/messaging/inbox/saved-replies', { userId, ...payload }, { signal });
}

export async function updateInboxSavedReply(replyId, { userId, ...payload } = {}, { signal } = {}) {
  assertIdentifier(replyId, 'replyId is required to update a saved reply.');
  assertIdentifier(userId, 'userId is required to update a saved reply.');
  if (payload.title != null && !payload.title.trim()) {
    throw new Error('title cannot be empty.');
  }
  if (payload.body != null && !payload.body.trim()) {
    throw new Error('body cannot be empty.');
  }
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

export async function pinInboxThread({ userId, threadId } = {}, { signal } = {}) {
  assertIdentifier(userId, 'userId is required to pin a thread.');
  assertIdentifier(threadId, 'threadId is required to pin a thread.');
  return apiClient.post(`/messaging/inbox/threads/${threadId}/pin`, { userId }, { signal });
}

export async function unpinInboxThread({ userId, threadId } = {}, { signal } = {}) {
  assertIdentifier(userId, 'userId is required to unpin a thread.');
  assertIdentifier(threadId, 'threadId is required to unpin a thread.');
  return apiClient.delete(`/messaging/inbox/threads/${threadId}/pin`, {
    signal,
    body: { userId },
  });
}

export async function reorderInboxPinnedThreads({ userId, threadIds } = {}, { signal } = {}) {
  assertIdentifier(userId, 'userId is required to reorder pinned threads.');
  const payload = Array.isArray(threadIds) ? threadIds : [];
  return apiClient.put(
    '/messaging/inbox/threads/pins/order',
    { userId, threadIds: payload },
    { signal },
  );
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
  pinInboxThread,
  unpinInboxThread,
  reorderInboxPinnedThreads,
};
