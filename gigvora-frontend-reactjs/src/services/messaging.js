import apiClient from './apiClient.js';

function sanitizeParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && `${value}`.length > 0),
  );
}

export function fetchInbox({
  userId,
  channelTypes,
  states,
  search,
  unreadOnly,
  includeParticipants = true,
  includeSupport = true,
  includeLabels = false,
  page = 1,
  pageSize = 20,
  signal,
} = {}) {
  const params = sanitizeParams({
    userId,
    page,
    pageSize,
    includeParticipants,
    includeSupport,
    includeLabels,
    unreadOnly,
    search,
  });

  if (Array.isArray(channelTypes) && channelTypes.length > 0) {
    params.channelTypes = channelTypes.join(',');
  }
  if (Array.isArray(states) && states.length > 0) {
    params.states = states.join(',');
  }

  return apiClient.get('/messaging/threads', { params, signal });
}

export function fetchThread(threadId, { includeParticipants = true, includeSupport = true, includeLabels = false } = {}) {
  if (!threadId) {
    throw new Error('threadId is required to load a thread.');
  }
  const params = sanitizeParams({ includeParticipants, includeSupport, includeLabels });
  return apiClient.get(`/messaging/threads/${threadId}`, { params });
}

export function fetchThreadMessages(threadId, { page = 1, pageSize = 50, includeSystem = false } = {}) {
  if (!threadId) {
    throw new Error('threadId is required to load thread messages.');
  }
  const params = sanitizeParams({ page, pageSize, includeSystem });
  return apiClient.get(`/messaging/threads/${threadId}/messages`, { params });
}

export function sendMessage(threadId, { userId, messageType = 'text', body, attachments = [], metadata = {} } = {}) {
  if (!threadId) {
    throw new Error('threadId is required to send a message.');
  }
  if (!body && (!attachments || attachments.length === 0)) {
    throw new Error('A message body or attachments are required to send a message.');
  }
  return apiClient.post(`/messaging/threads/${threadId}/messages`, {
    userId,
    messageType,
    body,
    attachments,
    metadata,
  });
}

export function createThread({ userId, subject, channelType = 'direct', participantIds = [], metadata = {} } = {}) {
  return apiClient.post('/messaging/threads', {
    userId,
    subject,
    channelType,
    participantIds,
    metadata,
  });
}

export function createCallSession(threadId, { userId, callType = 'video', callId, role } = {}) {
  if (!threadId) {
    throw new Error('threadId is required to create a call session.');
  }
  return apiClient.post(`/messaging/threads/${threadId}/calls`, {
    userId,
    callType,
    callId,
    role,
  });
}

export function markThreadRead(threadId, { userId } = {}) {
  if (!threadId) {
    throw new Error('threadId is required to mark a thread as read.');
  }
  return apiClient.post(`/messaging/threads/${threadId}/read`, {
    userId,
  });
}

export function updateThreadState(threadId, { state, userId } = {}) {
  if (!threadId) {
    throw new Error('threadId is required to update thread state.');
  }
  if (!state) {
    throw new Error('state is required to update a thread.');
  }
  return apiClient.post(`/messaging/threads/${threadId}/state`, { state, userId });
}

export function muteThread(threadId, { userId, until } = {}) {
  if (!threadId) {
    throw new Error('threadId is required to mute a thread.');
  }
  return apiClient.post(`/messaging/threads/${threadId}/mute`, { userId, until });
}

export function escalateThread(threadId, { userId, reason, priority = 'medium', metadata = {} } = {}) {
  if (!threadId) {
    throw new Error('threadId is required to escalate a thread.');
  }
  if (!reason) {
    throw new Error('reason is required to escalate a thread.');
  }
  return apiClient.post(`/messaging/threads/${threadId}/escalate`, {
    userId,
    reason,
    priority,
    metadata,
  });
}

export function assignSupport(threadId, { userId, agentId, assignedBy, notifyAgent = true } = {}) {
  if (!threadId) {
    throw new Error('threadId is required to assign support.');
  }
  return apiClient.post(`/messaging/threads/${threadId}/assign-support`, {
    userId,
    agentId,
    assignedBy,
    notifyAgent,
  });
}

export function assignSupportAgent(threadId, options = {}) {
  return assignSupport(threadId, options);
}

export function updateSupportStatus(threadId, { userId, status, resolutionSummary, metadata = {} } = {}) {
  if (!threadId) {
    throw new Error('threadId is required to update support status.');
  }
  if (!status) {
    throw new Error('status is required to update support status.');
  }
  return apiClient.post(`/messaging/threads/${threadId}/support-status`, {
    userId,
    status,
    resolutionSummary,
    metadata,
  });
}

export function updateThreadSettings(
  threadId,
  { userId, subject, channelType, metadataPatch, metadata } = {},
) {
  if (!threadId) {
    throw new Error('threadId is required to update thread settings.');
  }
  return apiClient.post(`/messaging/threads/${threadId}/settings`, {
    userId,
    subject,
    channelType,
    metadataPatch: metadataPatch ?? metadata,
  });
}

export function addThreadParticipants(threadId, { userId, participantIds } = {}) {
  if (!threadId) {
    throw new Error('threadId is required to add participants.');
  }
  if (!Array.isArray(participantIds) || participantIds.length === 0) {
    throw new Error('participantIds must include at least one id.');
  }
  return apiClient.post(`/messaging/threads/${threadId}/participants`, {
    userId,
    participantIds,
  });
}

export function removeThreadParticipant(threadId, participantId, { userId } = {}) {
  if (!threadId || !participantId) {
    throw new Error('threadId and participantId are required to remove a participant.');
  }
  return apiClient.delete(`/messaging/threads/${threadId}/participants/${participantId}`, {
    params: sanitizeParams({ userId }),
  });
}

export default {
  fetchInbox,
  fetchThread,
  fetchThreadMessages,
  sendMessage,
  createThread,
  createCallSession,
  markThreadRead,
  updateThreadState,
  muteThread,
  escalateThread,
  assignSupport,
  assignSupportAgent,
  updateSupportStatus,
  updateThreadSettings,
  addThreadParticipants,
  removeThreadParticipant,
};
