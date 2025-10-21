import apiClient from './apiClient.js';

const CACHE_NAMESPACE = 'support-desk';
const CACHE_TTL = 1000 * 60 * 3; // three minutes

function ensureString(value, { name = 'value', allowEmpty = false } = {}) {
  if (value === undefined || value === null) {
    if (allowEmpty) {
      return '';
    }
    throw new Error(`A valid ${name} is required.`);
  }
  const normalised = `${value}`.trim();
  if (!allowEmpty && !normalised) {
    throw new Error(`A valid ${name} is required.`);
  }
  return normalised;
}

function ensureUserId(userId) {
  return ensureString(userId, { name: 'userId' });
}

function buildCacheKey(userId) {
  return `${CACHE_NAMESPACE}:${userId}`;
}

function ensureOptions(options = {}) {
  if (options === null || typeof options !== 'object') {
    throw new Error('Support desk options must be provided as an object.');
  }

  const {
    forceRefresh = false,
    allowStaleOnError = true,
    signal,
    headers,
    params,
  } = options;

  if (headers !== undefined && (headers === null || typeof headers !== 'object')) {
    throw new Error('Request headers must be provided as an object when specified.');
  }

  if (params !== undefined && (params === null || typeof params !== 'object')) {
    throw new Error('Query parameters must be provided as an object when specified.');
  }

  return {
    forceRefresh: Boolean(forceRefresh),
    allowStaleOnError: allowStaleOnError !== false,
    signal,
    headers,
    params,
  };
}

function ensurePayload(payload, { requireTitle = true } = {}) {
  if (payload === null || payload === undefined) {
    throw new Error('Payload must be provided for support desk submissions.');
  }

  if (typeof payload !== 'object') {
    throw new Error('Payload must be provided as an object.');
  }

  const body = { ...payload };

  if (requireTitle) {
    body.title = ensureString(body.title, { name: 'title' });
  } else if (body.title !== undefined) {
    body.title = ensureString(body.title, { name: 'title' });
  }

  if (body.summary !== undefined) {
    body.summary = ensureString(body.summary, { name: 'summary', allowEmpty: true });
  }

  if (body.content !== undefined) {
    body.content = ensureString(body.content, { name: 'content', allowEmpty: true });
  }

  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) {
      throw new Error('tags must be provided as an array when specified.');
    }
    body.tags = body.tags
      .map((tag) => ensureString(tag, { name: 'tag', allowEmpty: true }))
      .filter((tag) => tag.length > 0);
  }

  return body;
}

function buildRequestOptions({ signal, headers, params }) {
  const requestOptions = {};
  if (signal) {
    requestOptions.signal = signal;
  }
  if (headers) {
    requestOptions.headers = headers;
  }
  if (params && Object.keys(params).length) {
    requestOptions.params = params;
  }
  return requestOptions;
}

export async function getSupportDeskSnapshot(userId, options = {}) {
  const safeUserId = ensureUserId(userId);
  const safeOptions = ensureOptions(options);
  const cacheKey = buildCacheKey(safeUserId);

  if (!safeOptions.forceRefresh) {
    const cached = apiClient.readCache(cacheKey);
    if (cached?.data) {
      return {
        data: cached.data,
        cachedAt: cached.timestamp ?? null,
        fromCache: true,
        stale: false,
      };
    }
  }

  const requestOptions = buildRequestOptions(safeOptions);
  if (!safeOptions.forceRefresh && requestOptions.params === undefined) {
    requestOptions.params = { snapshot: 'cached' };
  }

  try {
    const response = await apiClient.get(
      `/users/${encodeURIComponent(safeUserId)}/support-desk`,
      Object.keys(requestOptions).length ? requestOptions : undefined,
    );
    apiClient.writeCache(cacheKey, response, CACHE_TTL);
    return { data: response, cachedAt: new Date(), fromCache: false, stale: false };
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error;
    }

    if (safeOptions.allowStaleOnError) {
      const cached = apiClient.readCache(cacheKey);
      if (cached?.data) {
        return {
          data: cached.data,
          cachedAt: cached.timestamp ?? null,
          fromCache: true,
          stale: true,
        };
      }
    }

    throw error;
  }
}

export function invalidateSupportDeskSnapshot(userId) {
  const safeUserId = ensureUserId(userId);
  apiClient.removeCache?.(buildCacheKey(safeUserId));
}

export async function createKnowledgeBaseArticle(payload) {
  const body = ensurePayload(payload);
  return apiClient.post('/support/knowledge-base', body);
}

export async function createSupportPlaybook(payload) {
  const body = ensurePayload(payload);
  if (body.steps !== undefined) {
    if (!Array.isArray(body.steps)) {
      throw new Error('steps must be provided as an array when specified.');
    }
    body.steps = body.steps
      .map((step) => ensureString(step, { name: 'step', allowEmpty: true }))
      .filter((step) => step.length > 0);
  }
  return apiClient.post('/support/playbooks', body);
}

export default {
  getSupportDeskSnapshot,
  invalidateSupportDeskSnapshot,
  createKnowledgeBaseArticle,
  createSupportPlaybook,
};
