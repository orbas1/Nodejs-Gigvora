import apiClient from './apiClient.js';

const USERS_BASE_PATH = '/users';
const CACHE_NAMESPACE = 'users:account';
const CACHE_TTL = 1000 * 60 * 5; // five minutes

function ensureUserId(userId) {
  if (userId === null || userId === undefined) {
    throw new Error('A userId is required to perform user operations.');
  }
  const normalised = `${userId}`.trim();
  if (!normalised) {
    throw new Error('A userId is required to perform user operations.');
  }
  return normalised;
}

function ensurePayload(payload) {
  if (payload === null || payload === undefined) {
    throw new Error('Update payload must be an object.');
  }
  if (typeof payload !== 'object') {
    throw new Error('Update payload must be an object.');
  }
  return { ...payload };
}

function ensureOptions(options = {}) {
  if (options === null || typeof options !== 'object') {
    throw new Error('Request options must be an object.');
  }

  const { force = false, signal, headers } = options;

  if (headers !== undefined && (headers === null || typeof headers !== 'object')) {
    throw new Error('Request headers must be provided as an object when specified.');
  }

  return {
    force: Boolean(force),
    signal,
    headers,
  };
}

function buildUserPath(userId, ...segments) {
  const safeUserId = encodeURIComponent(ensureUserId(userId));
  const safeSegments = segments
    .filter((segment) => segment !== undefined && segment !== null)
    .map((segment) => `${segment}`.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment));
  if (!safeSegments.length) {
    return `${USERS_BASE_PATH}/${safeUserId}`;
  }
  return `${USERS_BASE_PATH}/${safeUserId}/${safeSegments.join('/')}`;
}

function buildCacheKey(userId) {
  return `${CACHE_NAMESPACE}:${encodeURIComponent(userId)}`;
}

function buildRequestOptions({ signal, headers }) {
  const requestOptions = {};
  if (signal) {
    requestOptions.signal = signal;
  }
  if (headers) {
    requestOptions.headers = headers;
  }
  return requestOptions;
}

export async function fetchUser(userId, options = {}) {
  const safeUserId = ensureUserId(userId);
  const safeOptions = ensureOptions(options);
  const cacheKey = buildCacheKey(safeUserId);

  if (!safeOptions.force) {
    const cached = apiClient.readCache(cacheKey);
    if (cached?.data) {
      return cached.data;
    }
  }

  const requestOptions = buildRequestOptions(safeOptions);
  const response = await apiClient.get(
    buildUserPath(safeUserId),
    Object.keys(requestOptions).length ? requestOptions : undefined,
  );
  apiClient.writeCache(cacheKey, response, CACHE_TTL);
  return response;
}

export async function updateUserAccount(userId, payload, options = {}) {
  const safeUserId = ensureUserId(userId);
  const body = ensurePayload(payload);
  const safeOptions = ensureOptions(options);
  const requestOptions = buildRequestOptions(safeOptions);

  const updated = await apiClient.put(
    buildUserPath(safeUserId),
    body,
    Object.keys(requestOptions).length ? requestOptions : undefined,
  );
  apiClient.writeCache(buildCacheKey(safeUserId), updated, CACHE_TTL);
  return updated;
}

export function clearUserCache(userId) {
  const safeUserId = ensureUserId(userId);
  apiClient.removeCache?.(buildCacheKey(safeUserId));
}

export default {
  fetchUser,
  updateUserAccount,
  clearUserCache,
};
