import apiClient from './apiClient.js';

function sanitizeParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && `${value}`.length > 0),
  );
}

export async function fetchInbox({
  userId,
  channelTypes,
  states,
  search,
  unreadOnly,
  includeParticipants = true,
  includeSupport = true,
  page = 1,
  pageSize = 20,
} = {}) {
  const params = sanitizeParams({
    userId,
    page,
    pageSize,
    includeParticipants,
    includeSupport,
    unreadOnly,
    search,
  });

  if (Array.isArray(channelTypes) && channelTypes.length > 0) {
    params.channelTypes = channelTypes.join(',');
  }
  if (Array.isArray(states) && states.length > 0) {
    params.states = states.join(',');
  }

  return apiClient.get('/messaging/threads', { params });
}

export async function fetchThread(threadId, { includeParticipants = true, includeSupport = true } = {}) {
  const params = sanitizeParams({ includeParticipants, includeSupport });
  return apiClient.get(`/messaging/threads/${threadId}`, { params });
}

export async function fetchThreadMessages(threadId, { page = 1, pageSize = 50, includeSystem = false } = {}) {
  const params = sanitizeParams({ page, pageSize, includeSystem });
  return apiClient.get(`/messaging/threads/${threadId}/messages`, { params });
}

export async function sendMessage(threadId, { userId, messageType = 'text', body, attachments = [], metadata = {} } = {}) {
  return apiClient.post(`/messaging/threads/${threadId}/messages`, {
    userId,
    messageType,
    body,
    attachments,
    metadata,
  });
}

export async function createThread({ userId, subject, channelType = 'direct', participantIds = [], metadata = {} } = {}) {
  return apiClient.post('/messaging/threads', {
    userId,
    subject,
    channelType,
    participantIds,
    metadata,
  });
}

export async function createCallSession(threadId, { userId, callType = 'video', callId, role } = {}) {
  return apiClient.post(`/messaging/threads/${threadId}/calls`, {
    userId,
    callType,
    callId,
    role,
  });
}

export async function markThreadRead(threadId, { userId } = {}) {
  return apiClient.post(`/messaging/threads/${threadId}/read`, {
    userId,
  });
}

export async function updateThreadState(threadId, { state, userId } = {}) {
  return apiClient.post(`/messaging/threads/${threadId}/state`, { state, userId });
}

export async function muteThread(threadId, { userId, until } = {}) {
  return apiClient.post(`/messaging/threads/${threadId}/mute`, { userId, until });
}

export async function escalateThread(threadId, { userId, reason, priority, metadata } = {}) {
  return apiClient.post(`/messaging/threads/${threadId}/escalate`, {
    userId,
    reason,
    priority,
    metadata,
  });
}

export async function assignSupport(threadId, { userId, agentId, assignedBy, notifyAgent } = {}) {
  return apiClient.post(`/messaging/threads/${threadId}/assign-support`, {
    userId,
    agentId,
    assignedBy,
    notifyAgent,
  });
}

export async function updateSupportStatus(threadId, { userId, status, resolutionSummary, metadata } = {}) {
  return apiClient.post(`/messaging/threads/${threadId}/support-status`, {
    userId,
    status,
    resolutionSummary,
    metadata,
  });
}

export async function updateThreadSettings(threadId, { userId, subject, channelType, metadataPatch, metadata } = {}) {
  return apiClient.post(`/messaging/threads/${threadId}/settings`, {
    userId,
    subject,
    channelType,
    metadataPatch: metadataPatch ?? metadata,
  });
}

export async function addThreadParticipants(threadId, { userId, participantIds } = {}) {
  return apiClient.post(`/messaging/threads/${threadId}/participants`, {
    userId,
    participantIds,
  });
}

export async function removeThreadParticipant(threadId, participantId, { userId } = {}) {
  return apiClient.delete(`/messaging/threads/${threadId}/participants/${participantId}`, {
    params: { userId },
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
  updateSupportStatus,
  updateThreadSettings,
  addThreadParticipants,
  removeThreadParticipant,
};
