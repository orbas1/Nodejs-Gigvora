import apiClient from './apiClient.js';
import {
  assertAdminAccess,
  buildAdminCacheKey,
  createRequestOptions,
  encodeIdentifier,
  fetchWithCache,
  invalidateCacheByTag,
  sanitiseQueryParams,
} from './adminServiceHelpers.js';

const MESSAGING_ROLES = ['super-admin', 'platform-admin', 'support-admin', 'operations-admin'];
const CACHE_TAGS = {
  threads: 'admin:messaging:threads',
  labels: 'admin:messaging:labels',
  agents: 'admin:messaging:support-agents',
};

function buildThreadParams(params = {}) {
  return sanitiseQueryParams({
    status: params.status,
    channel: params.channel,
    priority: params.priority,
    labelId: params.labelId ?? params.label_id,
    assignedTo: params.assignedTo ?? params.assigned_to,
    page: params.page,
    pageSize: params.pageSize ?? params.page_size,
    search: params.search,
    sort: params.sort,
  });
}

function encodeThreadId(threadId) {
  return encodeIdentifier(threadId, { label: 'threadId' });
}

function encodeLabelId(labelId) {
  return encodeIdentifier(labelId, { label: 'labelId' });
}

async function performThreadMutation(request) {
  const response = await request();
  invalidateCacheByTag(CACHE_TAGS.threads);
  return response;
}

async function performLabelMutation(request) {
  const response = await request();
  invalidateCacheByTag(CACHE_TAGS.labels, CACHE_TAGS.threads);
  return response;
}

export function fetchAdminInbox(params = {}, options = {}) {
  assertAdminAccess(MESSAGING_ROLES);
  const cleanedParams = buildThreadParams(params);
  const { forceRefresh = false, cacheTtl = 30 * 1000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:messaging:threads', cleanedParams);

  return fetchWithCache(
    cacheKey,
    () => apiClient.get('/admin/messaging/threads', createRequestOptions(requestOptions, cleanedParams)),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.threads,
    },
  );
}

export function fetchAdminThread(threadId, options = {}) {
  assertAdminAccess(MESSAGING_ROLES);
  return apiClient.get(`/admin/messaging/threads/${encodeThreadId(threadId)}`, options);
}

export function fetchAdminThreadMessages(threadId, params = {}, options = {}) {
  assertAdminAccess(MESSAGING_ROLES);
  const cleanedParams = buildThreadParams(params);
  return apiClient.get(
    `/admin/messaging/threads/${encodeThreadId(threadId)}/messages`,
    createRequestOptions(options, cleanedParams),
  );
}

export function createAdminThread(payload, options = {}) {
  assertAdminAccess(MESSAGING_ROLES);
  return performThreadMutation(() => apiClient.post('/admin/messaging/threads', payload, options));
}

export function sendAdminMessage(threadId, payload, options = {}) {
  assertAdminAccess(MESSAGING_ROLES);
  return performThreadMutation(() =>
    apiClient.post(`/admin/messaging/threads/${encodeThreadId(threadId)}/messages`, payload, options),
  );
}

export function updateAdminThreadState(threadId, payload, options = {}) {
  assertAdminAccess(MESSAGING_ROLES);
  return performThreadMutation(() =>
    apiClient.patch(`/admin/messaging/threads/${encodeThreadId(threadId)}`, payload, options),
  );
}

export function escalateAdminThread(threadId, payload, options = {}) {
  assertAdminAccess(MESSAGING_ROLES);
  return performThreadMutation(() =>
    apiClient.post(`/admin/messaging/threads/${encodeThreadId(threadId)}/escalate`, payload, options),
  );
}

export function assignAdminSupportAgent(threadId, payload, options = {}) {
  assertAdminAccess(MESSAGING_ROLES);
  return performThreadMutation(() =>
    apiClient.post(`/admin/messaging/threads/${encodeThreadId(threadId)}/assign`, payload, options),
  );
}

export function updateAdminSupportStatus(threadId, payload, options = {}) {
  assertAdminAccess(MESSAGING_ROLES);
  return performThreadMutation(() =>
    apiClient.post(`/admin/messaging/threads/${encodeThreadId(threadId)}/support-status`, payload, options),
  );
}

export function listAdminLabels(options = {}) {
  assertAdminAccess(MESSAGING_ROLES);
  const { forceRefresh = false, cacheTtl = 5 * 60 * 1000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:messaging:labels');

  return fetchWithCache(
    cacheKey,
    async () => {
      const response = await apiClient.get(
        '/admin/messaging/labels',
        createRequestOptions(requestOptions),
      );
      return Array.isArray(response?.data) ? response.data : [];
    },
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.labels,
    },
  );
}

export function createAdminLabel(payload, options = {}) {
  assertAdminAccess(MESSAGING_ROLES);
  return performLabelMutation(() => apiClient.post('/admin/messaging/labels', payload, options));
}

export function updateAdminLabel(labelId, payload, options = {}) {
  assertAdminAccess(MESSAGING_ROLES);
  const identifier = encodeLabelId(labelId);
  return performLabelMutation(() =>
    apiClient.patch(`/admin/messaging/labels/${identifier}`, payload, options),
  );
}

export function deleteAdminLabel(labelId, options = {}) {
  assertAdminAccess(MESSAGING_ROLES);
  const identifier = encodeLabelId(labelId);
  return performLabelMutation(() =>
    apiClient.delete(`/admin/messaging/labels/${identifier}`, options),
  );
}

export function setThreadLabels(threadId, labelIds, options = {}) {
  assertAdminAccess(MESSAGING_ROLES);
  return performThreadMutation(() =>
    apiClient.post(
      `/admin/messaging/threads/${encodeThreadId(threadId)}/labels`,
      { labelIds },
      options,
    ),
  );
}

export function listSupportAgents(options = {}) {
  assertAdminAccess(MESSAGING_ROLES);
  const { forceRefresh = false, cacheTtl = 5 * 60 * 1000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:messaging:support-agents');

  return fetchWithCache(
    cacheKey,
    async () => {
      const response = await apiClient.get(
        '/admin/messaging/support-agents',
        createRequestOptions(requestOptions),
      );
      return Array.isArray(response?.data) ? response.data : [];
    },
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.agents,
    },
  );
}

export default {
  fetchAdminInbox,
  fetchAdminThread,
  fetchAdminThreadMessages,
  createAdminThread,
  sendAdminMessage,
  updateAdminThreadState,
  escalateAdminThread,
  assignAdminSupportAgent,
  updateAdminSupportStatus,
  listAdminLabels,
  createAdminLabel,
  updateAdminLabel,
  deleteAdminLabel,
  setThreadLabels,
  listSupportAgents,
};
