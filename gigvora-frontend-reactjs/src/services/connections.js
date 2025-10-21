import { apiClient } from './apiClient.js';
import {
  requireIdentifier,
  optionalString,
  mergeWorkspace,
  combineRequestOptions,
} from './serviceHelpers.js';

export async function fetchConnectionNetwork(
  { userId, viewerId, includePending = false, workspaceId, workspaceSlug } = {},
  options = {},
) {
  const resolvedUserId = requireIdentifier(userId, 'userId');
  const params = {
    userId: resolvedUserId,
    ...mergeWorkspace({}, { workspaceId, workspaceSlug }),
  };

  const viewer = optionalString(viewerId);
  if (viewer) {
    params.viewerId = viewer;
  }
  if (includePending) {
    params.includePending = 'true';
  }

  return apiClient.get(
    '/connections/network',
    combineRequestOptions({ params }, options),
  );
}

export async function createConnectionRequest(
  { actorId, targetId, message, workspaceId, workspaceSlug } = {},
  options = {},
) {
  const resolvedActorId = requireIdentifier(actorId, 'actorId');
  const resolvedTargetId = requireIdentifier(targetId, 'targetId');
  const body = mergeWorkspace(
    {
      actorId: resolvedActorId,
      targetId: resolvedTargetId,
      ...(optionalString(message) ? { message: optionalString(message) } : {}),
    },
    { workspaceId, workspaceSlug },
  );

  return apiClient.post('/connections', body, combineRequestOptions({}, options));
}

export async function respondToConnection(
  { connectionId, actorId, decision, note, workspaceId, workspaceSlug } = {},
  options = {},
) {
  const resolvedConnectionId = requireIdentifier(connectionId, 'connectionId');
  const resolvedActorId = requireIdentifier(actorId, 'actorId');
  const normalisedDecision = optionalString(decision);
  if (!normalisedDecision) {
    throw new Error('decision is required to respond to a connection request.');
  }

  const body = mergeWorkspace(
    {
      actorId: resolvedActorId,
      decision: normalisedDecision,
      ...(optionalString(note) ? { note: optionalString(note) } : {}),
    },
    { workspaceId, workspaceSlug },
  );

  return apiClient.post(
    `/connections/${resolvedConnectionId}/respond`,
    body,
    combineRequestOptions({}, options),
  );
}

export default {
  fetchConnectionNetwork,
  createConnectionRequest,
  respondToConnection,
};
