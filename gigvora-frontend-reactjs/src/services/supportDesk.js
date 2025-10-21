import apiClient from './apiClient.js';

const CACHE_NAMESPACE = 'support-desk';
const CACHE_TTL = 1000 * 60 * 10; // ten minutes

function ensureIdentifier(name, value) {
  if (value === undefined || value === null) {
    throw new Error(`${name} is required`);
  }
  const trimmed = `${value}`.trim();
  if (!trimmed) {
    throw new Error(`${name} is required`);
  }
  return trimmed;
}

function ensurePayload(payload, name) {
  if (payload === undefined || payload === null) {
    throw new Error(`${name} payload is required`);
  }
  if (typeof payload !== 'object') {
    throw new Error(`${name} payload must be an object`);
  }
  return payload;
}

function ensureOptions(options) {
  if (options === undefined || options === null) {
    return {};
  }
  if (typeof options !== 'object') {
    throw new Error('Options must be an object.');
  }
  return options;
}

function buildCacheKey(userId) {
  return `${CACHE_NAMESPACE}:${ensureIdentifier('userId', userId)}`;
}

export async function getSupportDeskSnapshot(userId, options = {}) {
  const { forceRefresh = false, signal, ...rest } = options ?? {};
  const safeOptions = ensureOptions(rest);
  const cacheKey = buildCacheKey(userId);

  if (!forceRefresh) {
    const cached = apiClient.readCache(cacheKey);
    if (cached?.data) {
      return { data: cached.data, cachedAt: cached.timestamp ?? null, fromCache: true };
    }
  }

  const requestOptions = { ...safeOptions };
  const params = forceRefresh ? { ...(safeOptions.params ?? {}), fresh: 'true' } : safeOptions.params;
  if (params) {
    requestOptions.params = params;
  }
  if (signal) {
    requestOptions.signal = signal;
  }

  const data = await apiClient.get(
    `/users/${encodeURIComponent(ensureIdentifier('userId', userId))}/support-desk`,
    Object.keys(requestOptions).length ? requestOptions : undefined,
  );

  apiClient.writeCache(cacheKey, data, CACHE_TTL);

  return { data, cachedAt: new Date(), fromCache: false };
}

export async function createKnowledgeBaseArticle(payload, options) {
  const safePayload = ensurePayload(payload, 'Knowledge base');
  if (!safePayload.title || !`${safePayload.title}`.trim()) {
    throw new Error('A title is required for knowledge base submissions.');
  }
  const safeOptions = ensureOptions(options);
  return apiClient.post(
    '/support/knowledge-base',
    safePayload,
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
}

export async function createSupportPlaybook(payload, options) {
  const safePayload = ensurePayload(payload, 'Playbook');
  if (!safePayload.title || !`${safePayload.title}`.trim()) {
    throw new Error('A playbook title is required.');
  }
  const safeOptions = ensureOptions(options);
  return apiClient.post(
    '/support/playbooks',
    safePayload,
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
}

export default {
  getSupportDeskSnapshot,
  createKnowledgeBaseArticle,
  createSupportPlaybook,
};
