import { apiClient } from './apiClient.js';
import { requireIdentifier, mergeWorkspace, combineRequestOptions } from './serviceHelpers.js';

export async function fetchUserDisputes(userId, filters = {}, options = {}) {
  const resolvedUserId = requireIdentifier(userId, 'userId');
  const { workspaceId, workspaceSlug, ...restFilters } = filters;
  const params = {
    ...restFilters,
    ...mergeWorkspace({}, { workspaceId, workspaceSlug }),
  };
  return apiClient.get(
    `/users/${resolvedUserId}/disputes`,
    combineRequestOptions({ params }, options),
  );
}

export async function fetchUserDispute(userId, disputeId, options = {}) {
  const resolvedUserId = requireIdentifier(userId, 'userId');
  const resolvedDisputeId = requireIdentifier(disputeId, 'disputeId');
  return apiClient.get(
    `/users/${resolvedUserId}/disputes/${resolvedDisputeId}`,
    combineRequestOptions({}, options),
  );
}

export async function createUserDispute(userId, payload = {}, { workspaceId, workspaceSlug, ...options } = {}) {
  const resolvedUserId = requireIdentifier(userId, 'userId');
  const body = mergeWorkspace({ ...(payload || {}) }, { workspaceId, workspaceSlug });
  return apiClient.post(
    `/users/${resolvedUserId}/disputes`,
    body,
    combineRequestOptions({}, options),
  );
}

export async function postUserDisputeEvent(
  userId,
  disputeId,
  payload = {},
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const resolvedUserId = requireIdentifier(userId, 'userId');
  const resolvedDisputeId = requireIdentifier(disputeId, 'disputeId');
  const body = mergeWorkspace({ ...(payload || {}) }, { workspaceId, workspaceSlug });
  return apiClient.post(
    `/users/${resolvedUserId}/disputes/${resolvedDisputeId}/events`,
    body,
    combineRequestOptions({}, options),
  );
}

export default {
  fetchUserDisputes,
  fetchUserDispute,
  createUserDispute,
  postUserDisputeEvent,
};
