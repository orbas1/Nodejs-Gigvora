import { apiClient } from './apiClient.js';
import {
  requireIdentifier,
  optionalString,
  mergeWorkspace,
  buildWorkspaceContext,
  combineRequestOptions,
} from './serviceHelpers.js';

function resolveFreelancerId(payload) {
  if (!payload) {
    return undefined;
  }
  if (payload instanceof FormData) {
    return payload.get('freelancerId');
  }
  return payload.freelancerId;
}

function normalisePayload(payload = {}, workspace = {}) {
  const freelancerId = requireIdentifier(resolveFreelancerId(payload), 'freelancerId');
  if (payload instanceof FormData) {
    payload.set('freelancerId', freelancerId);
    const context = buildWorkspaceContext(workspace);
    Object.entries(context).forEach(([key, value]) => {
      payload.set(key, value);
    });
    return payload;
  }
  const base = { ...(payload || {}) };
  base.freelancerId = freelancerId;
  return mergeWorkspace(base, workspace);
}

function mergePayload(payload = {}, workspace = {}) {
  if (payload instanceof FormData) {
    const context = buildWorkspaceContext(workspace);
    Object.entries(context).forEach(([key, value]) => {
      payload.set(key, value);
    });
    return payload;
  }
  return mergeWorkspace({ ...(payload || {}) }, workspace);
}

export async function fetchVaultOverview({ freelancerId, workspaceId, workspaceSlug } = {}, options = {}) {
  const resolvedFreelancerId = requireIdentifier(freelancerId, 'freelancerId');
  const params = {
    freelancerId: resolvedFreelancerId,
    ...mergeWorkspace({}, { workspaceId, workspaceSlug }),
  };
  return apiClient.get(
    '/deliverable-vault/overview',
    combineRequestOptions({ params }, options),
  );
}

export async function fetchVaultItem(
  itemId,
  { freelancerId, workspaceId, workspaceSlug } = {},
  options = {},
) {
  const resolvedItemId = requireIdentifier(itemId, 'itemId');
  const params = mergeWorkspace({}, { workspaceId, workspaceSlug });
  const resolvedFreelancerId = optionalString(freelancerId);
  if (resolvedFreelancerId) {
    params.freelancerId = resolvedFreelancerId;
  }
  return apiClient.get(
    `/deliverable-vault/items/${resolvedItemId}`,
    combineRequestOptions({ params }, options),
  );
}

export async function createDeliverable(payload = {}, { workspaceId, workspaceSlug, ...options } = {}) {
  const body = normalisePayload(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.post('/deliverable-vault/items', body, combineRequestOptions({}, options));
}

export async function updateDeliverable(
  itemId,
  payload = {},
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const resolvedItemId = requireIdentifier(itemId, 'itemId');
  const body = mergePayload(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.patch(
    `/deliverable-vault/items/${resolvedItemId}`,
    body,
    combineRequestOptions({}, options),
  );
}

export async function addDeliverableVersion(
  itemId,
  payload = {},
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const resolvedItemId = requireIdentifier(itemId, 'itemId');
  const body = mergePayload(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.post(
    `/deliverable-vault/items/${resolvedItemId}/versions`,
    body,
    combineRequestOptions({}, options),
  );
}

export async function generateDeliveryPackage(
  itemId,
  payload = {},
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const resolvedItemId = requireIdentifier(itemId, 'itemId');
  const body = mergePayload(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.post(
    `/deliverable-vault/items/${resolvedItemId}/delivery-packages`,
    body,
    combineRequestOptions({}, options),
  );
}

export default {
  fetchVaultOverview,
  fetchVaultItem,
  createDeliverable,
  updateDeliverable,
  addDeliverableVersion,
  generateDeliveryPackage,
};
