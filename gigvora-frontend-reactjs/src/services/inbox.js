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

function normaliseRuleStructure(value, { allowNull = false } = {}) {
  if (value === null && allowNull) {
    return null;
  }
  if (value == null) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.length ? value : allowNull ? null : undefined;
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    return keys.length ? value : allowNull ? null : undefined;
  }
  return allowNull ? null : undefined;
}

function normalizeRoutingRulePayload(payload = {}) {
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  if (!name) {
    throw new Error('name is required to create a routing rule.');
  }

  const matchType = typeof payload.matchType === 'string' ? payload.matchType.trim().toLowerCase() : 'keyword';
  const normalized = {
    name,
    matchType,
    enabled: payload.enabled !== undefined ? Boolean(payload.enabled) : true,
    stopProcessing: Boolean(payload.stopProcessing),
  };

  if (payload.description != null) {
    const description = String(payload.description).trim();
    if (description) {
      normalized.description = description;
    }
  }

  const criteria = normaliseRuleStructure(payload.criteria);
  if (criteria !== undefined) {
    normalized.criteria = criteria;
  }

  const action = normaliseRuleStructure(payload.action);
  if (action !== undefined) {
    normalized.action = action;
  }

  if (payload.priority != null) {
    const numeric = Number.parseInt(payload.priority, 10);
    normalized.priority = Number.isFinite(numeric) ? numeric : 0;
  }

  return normalized;
}

function normalizeRoutingRulePatch(payload = {}) {
  const normalized = {};

  if (payload.name != null) {
    const name = String(payload.name).trim();
    if (!name) {
      throw new Error('name cannot be empty.');
    }
    normalized.name = name;
  }

  if (payload.description !== undefined) {
    if (payload.description === null) {
      normalized.description = null;
    } else {
      const description = String(payload.description).trim();
      normalized.description = description || null;
    }
  }

  if (payload.matchType !== undefined) {
    const matchType = String(payload.matchType).trim();
    if (matchType) {
      normalized.matchType = matchType.toLowerCase();
    }
  }

  if (payload.priority !== undefined) {
    const numeric = Number.parseInt(payload.priority, 10);
    normalized.priority = Number.isFinite(numeric) ? numeric : 0;
  }

  if (payload.enabled !== undefined) {
    normalized.enabled = Boolean(payload.enabled);
  }

  if (payload.stopProcessing !== undefined) {
    normalized.stopProcessing = Boolean(payload.stopProcessing);
  }

  if (payload.criteria !== undefined) {
    if (payload.criteria === null) {
      normalized.criteria = null;
    } else {
      const criteria = normaliseRuleStructure(payload.criteria, { allowNull: true });
      normalized.criteria = criteria === undefined ? null : criteria;
    }
  }

  if (payload.action !== undefined) {
    if (payload.action === null) {
      normalized.action = null;
    } else {
      const action = normaliseRuleStructure(payload.action, { allowNull: true });
      normalized.action = action === undefined ? null : action;
    }
  }

  return normalized;
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
  const normalized = normalizeRoutingRulePayload(payload);
  return apiClient.post('/messaging/inbox/routing-rules', { userId, ...normalized }, { signal });
}

export async function updateInboxRoutingRule(ruleId, { userId, ...payload } = {}, { signal } = {}) {
  assertIdentifier(ruleId, 'ruleId is required to update a routing rule.');
  assertIdentifier(userId, 'userId is required to update a routing rule.');
  const normalized = normalizeRoutingRulePatch(payload);
  return apiClient.patch(`/messaging/inbox/routing-rules/${ruleId}`, { userId, ...normalized }, { signal });
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
