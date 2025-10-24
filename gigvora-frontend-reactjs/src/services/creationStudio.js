import { apiClient } from './apiClient.js';
import {
  requireIdentifier,
  optionalString,
  mergeWorkspace,
  buildWorkspaceContext,
  combineRequestOptions,
} from './serviceHelpers.js';

function parseInteger(value) {
  if (value == null) {
    return undefined;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function buildWorkspaceParams(workspace = {}) {
  return mergeWorkspace({}, workspace);
}

function applyWorkspaceToPayload(payload = {}, workspace = {}) {
  const context = buildWorkspaceContext(workspace);
  if (payload instanceof FormData) {
    Object.entries(context).forEach(([key, value]) => {
      payload.set(key, value);
    });
    return payload;
  }
  return mergeWorkspace({ ...(payload || {}) }, workspace);
}

export function fetchCompanyCreationStudioOverview({ workspaceId, workspaceSlug } = {}, options = {}) {
  const params = buildWorkspaceParams({ workspaceId, workspaceSlug });
  return apiClient.get(
    '/company/creation-studio/overview',
    combineRequestOptions({ params }, options),
  );
}

export function fetchCompanyCreationStudioItems(
  { workspaceId, workspaceSlug, type, status, search, limit, offset } = {},
  options = {},
) {
  const params = buildWorkspaceParams({ workspaceId, workspaceSlug });
  const typeFilter = optionalString(type);
  if (typeFilter) {
    params.type = typeFilter;
  }
  const statusFilter = optionalString(status);
  if (statusFilter) {
    params.status = statusFilter;
  }
  const searchQuery = optionalString(search);
  if (searchQuery) {
    params.search = searchQuery;
  }
  const limitValue = parseInteger(limit);
  if (limitValue !== undefined) {
    params.limit = limitValue;
  }
  const offsetValue = parseInteger(offset);
  if (offsetValue !== undefined) {
    params.offset = offsetValue;
  }

  return apiClient.get(
    '/company/creation-studio',
    combineRequestOptions({ params }, options),
  );
}

export function createCompanyCreationStudioItem(payload = {}, { workspaceId, workspaceSlug, ...options } = {}) {
  const body = applyWorkspaceToPayload(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.post('/company/creation-studio', body, combineRequestOptions({}, options));
}

export function updateCompanyCreationStudioItem(
  itemId,
  payload = {},
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const resolvedItemId = requireIdentifier(itemId, 'itemId');
  const body = applyWorkspaceToPayload(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.put(
    `/company/creation-studio/${resolvedItemId}`,
    body,
    combineRequestOptions({}, options),
  );
}

export function publishCompanyCreationStudioItem(
  itemId,
  payload = {},
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const resolvedItemId = requireIdentifier(itemId, 'itemId');
  const body = applyWorkspaceToPayload(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.post(
    `/company/creation-studio/${resolvedItemId}/publish`,
    body,
    combineRequestOptions({}, options),
  );
}

export function shareCompanyCreationStudioItem(
  itemId,
  payload = {},
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const resolvedItemId = requireIdentifier(itemId, 'itemId');
  const body = applyWorkspaceToPayload(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.post(
    `/company/creation-studio/${resolvedItemId}/share`,
    body,
    combineRequestOptions({}, options),
  );
}

export function deleteCompanyCreationStudioItem(itemId, { workspaceId, workspaceSlug, ...options } = {}) {
  const resolvedItemId = requireIdentifier(itemId, 'itemId');
  const params = buildWorkspaceParams({ workspaceId, workspaceSlug });
  return apiClient.delete(
    `/company/creation-studio/${resolvedItemId}`,
    combineRequestOptions({ params }, options),
  );
}

export function fetchCreationWorkspace(
  userId,
  { includeArchived = false, workspaceId, workspaceSlug, ...options } = {},
) {
  const resolvedUserId = requireIdentifier(userId, 'userId');
  const params = buildWorkspaceParams({ workspaceId, workspaceSlug });
  if (includeArchived) {
    params.includeArchived = 'true';
  }
  return apiClient.get(
    `/users/${resolvedUserId}/creation-studio`,
    combineRequestOptions({ params }, options),
  );
}

export function createCreationItem(userId, payload = {}, { workspaceId, workspaceSlug, ...options } = {}) {
  const resolvedUserId = requireIdentifier(userId, 'userId');
  const body = applyWorkspaceToPayload(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.post(
    `/users/${resolvedUserId}/creation-studio`,
    body,
    combineRequestOptions({}, options),
  );
}

export function updateCreationItem(
  userId,
  itemId,
  payload = {},
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const resolvedUserId = requireIdentifier(userId, 'userId');
  const resolvedItemId = requireIdentifier(itemId, 'itemId');
  const body = applyWorkspaceToPayload(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.put(
    `/users/${resolvedUserId}/creation-studio/${resolvedItemId}`,
    body,
    combineRequestOptions({}, options),
  );
}

export function saveCreationStep(
  userId,
  itemId,
  stepKey,
  payload = {},
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const resolvedUserId = requireIdentifier(userId, 'userId');
  const resolvedItemId = requireIdentifier(itemId, 'itemId');
  const normalisedStepKey = optionalString(stepKey);
  if (!normalisedStepKey) {
    throw new Error('stepKey is required to update a creation studio step.');
  }
  const body = applyWorkspaceToPayload(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.post(
    `/users/${resolvedUserId}/creation-studio/${resolvedItemId}/steps/${encodeURIComponent(normalisedStepKey)}`,
    body,
    combineRequestOptions({}, options),
  );
}

export function shareCreationItem(
  userId,
  itemId,
  payload = {},
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const resolvedUserId = requireIdentifier(userId, 'userId');
  const resolvedItemId = requireIdentifier(itemId, 'itemId');
  const body = applyWorkspaceToPayload(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.post(
    `/users/${resolvedUserId}/creation-studio/${resolvedItemId}/share`,
    body,
    combineRequestOptions({}, options),
  );
}

export function archiveCreationItem(userId, itemId, { workspaceId, workspaceSlug, ...options } = {}) {
  const resolvedUserId = requireIdentifier(userId, 'userId');
  const resolvedItemId = requireIdentifier(itemId, 'itemId');
  const params = buildWorkspaceParams({ workspaceId, workspaceSlug });
  return apiClient.delete(
    `/users/${resolvedUserId}/creation-studio/${resolvedItemId}`,
    combineRequestOptions({ params }, options),
  );
}

export function listCreationStudioItems(filters = {}, options = {}) {
  const { type, status, search, limit, offset, workspaceId, workspaceSlug, ...rest } = filters;
  const params = {
    ...rest,
    ...buildWorkspaceParams({ workspaceId, workspaceSlug }),
  };
  const typeFilter = optionalString(type);
  if (typeFilter) {
    params.type = typeFilter;
  }
  const statusFilter = optionalString(status);
  if (statusFilter) {
    params.status = statusFilter;
  }
  const searchQuery = optionalString(search);
  if (searchQuery) {
    params.search = searchQuery;
  }
  const limitValue = parseInteger(limit);
  if (limitValue !== undefined) {
    params.limit = limitValue;
  }
  const offsetValue = parseInteger(offset);
  if (offsetValue !== undefined) {
    params.offset = offsetValue;
  }

  return apiClient.get(
    '/creation-studio/items',
    combineRequestOptions({ params }, options),
  );
}

export function getCreationStudioItem(itemId, options = {}) {
  const resolvedItemId = requireIdentifier(itemId, 'itemId');
  return apiClient.get(
    `/creation-studio/items/${resolvedItemId}`,
    combineRequestOptions({}, options),
  );
}

export function createCreationStudioItem(payload = {}, options = {}) {
  return apiClient.post('/creation-studio/items', payload ?? {}, combineRequestOptions({}, options));
}

export function updateCreationStudioItem(itemId, payload = {}, options = {}) {
  const resolvedItemId = requireIdentifier(itemId, 'itemId');
  return apiClient.put(
    `/creation-studio/items/${resolvedItemId}`,
    payload ?? {},
    combineRequestOptions({}, options),
  );
}

export function publishCreationStudioItem(itemId, payload = {}, options = {}) {
  const resolvedItemId = requireIdentifier(itemId, 'itemId');
  return apiClient.post(
    `/creation-studio/items/${resolvedItemId}/publish`,
    payload ?? {},
    combineRequestOptions({}, options),
  );
}

export function deleteCreationStudioItem(itemId, options = {}) {
  const resolvedItemId = requireIdentifier(itemId, 'itemId');
  return apiClient.delete(
    `/creation-studio/items/${resolvedItemId}`,
    combineRequestOptions({}, options),
  );
}

export function fetchCreationStudioAnalytics(params = {}, options = {}) {
  const resolvedParams = {};
  const workspaceId = optionalString(params.workspaceId);
  if (workspaceId) {
    resolvedParams.workspaceId = workspaceId;
  }
  const workspaceSlug = optionalString(params.workspaceSlug);
  if (workspaceSlug) {
    resolvedParams.workspaceSlug = workspaceSlug;
  }
  const windowParam = optionalString(params.window);
  if (windowParam) {
    resolvedParams.window = windowParam;
  }

  return apiClient.get(
    '/creation-studio/analytics',
    combineRequestOptions({ params: resolvedParams }, options),
  );
}

export function sendCreationStudioInvite(payload = {}, options = {}) {
  const emailInput = payload?.email ?? payload?.contact?.email ?? '';
  const email = typeof emailInput === 'string' ? emailInput.trim() : `${emailInput}`.trim();
  if (!email) {
    return Promise.reject(new Error('email is required to send a creation studio invite.'));
  }
  const role = optionalString(payload?.role);
  const message = optionalString(payload?.message);
  const preferredTrack = optionalString(payload?.preferredTrack);
  const source = optionalString(payload?.source) ?? 'creation-studio';

  const body = {
    email,
    source,
  };
  if (role) {
    body.role = role;
  }
  if (message) {
    body.message = message;
  }
  if (preferredTrack) {
    body.preferredTrack = preferredTrack;
  }

  return apiClient.post(
    '/creation-studio/invites',
    body,
    combineRequestOptions({}, options),
  );
}

export const creationStudioApi = {
  fetchCompanyCreationStudioOverview,
  fetchCompanyCreationStudioItems,
  createCompanyCreationStudioItem,
  updateCompanyCreationStudioItem,
  publishCompanyCreationStudioItem,
  shareCompanyCreationStudioItem,
  deleteCompanyCreationStudioItem,
  fetchCreationWorkspace,
  createCreationItem,
  updateCreationItem,
  saveCreationStep,
  shareCreationItem,
  archiveCreationItem,
  listCreationStudioItems,
  getCreationStudioItem,
  createCreationStudioItem,
  updateCreationStudioItem,
  publishCreationStudioItem,
  deleteCreationStudioItem,
  fetchCreationStudioAnalytics,
  sendCreationStudioInvite,
};

export default creationStudioApi;
