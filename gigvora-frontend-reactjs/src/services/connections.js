import { apiClient } from './apiClient.js';

export async function fetchConnectionNetwork({ userId, viewerId, includePending = false, signal } = {}) {
  if (!userId) {
    throw new Error('A userId is required to fetch the connection network.');
  }

  return apiClient.get('/connections/network', {
    params: {
      userId,
      viewerId,
      includePending,
    },
    signal,
  });
}

export async function createConnectionRequest({ actorId, targetId, signal } = {}) {
  if (!actorId || !targetId) {
    throw new Error('actorId and targetId are required to request a connection.');
  }
  return apiClient.post(
    '/connections',
    {
      actorId,
      targetId,
    },
    { signal },
  );
}

export async function respondToConnection({ connectionId, actorId, decision, signal } = {}) {
  if (!connectionId || !actorId) {
    throw new Error('connectionId and actorId are required to respond to a connection request.');
  }
  return apiClient.post(
    `/connections/${connectionId}/respond`,
    {
      actorId,
      decision,
    },
    { signal },
  );
}

export default {
  fetchConnectionNetwork,
  createConnectionRequest,
  respondToConnection,
};
