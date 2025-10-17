const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api').replace(/\/$/, '');
const DEFAULT_CACHE_TTL = 1000 * 60 * 2; // two minutes
const CACHE_NAMESPACE = 'gigvora:web:cache:';
const AUTH_TOKEN_KEY = 'gigvora:web:auth:accessToken';
const REFRESH_TOKEN_KEY = 'gigvora:web:auth:refreshToken';
const ACCESS_TOKEN_EXPIRY_KEY = 'gigvora:web:auth:accessTokenExpiresAt';
const SESSION_STORAGE_KEY = 'gigvora:web:session';

class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch (error) {
    console.warn('Local storage is unavailable, disabling persistent caching.', error);
    return null;
  }
}

const storage = getStorage();

function persistValue(key, value) {
  if (!storage) {
    return;
  }

  try {
    if (value == null) {
      storage.removeItem(key);
    } else {
      storage.setItem(key, value);
    }
  } catch (error) {
    console.warn(`Failed to persist value for ${key}`, error);
  }
}

function readValue(key) {
  if (!storage) {
    return null;
  }

  try {
    return storage.getItem(key);
  } catch (error) {
    console.warn(`Failed to read value for ${key}`, error);
    return null;
  }
}

function persistAuthToken(token) {
  persistValue(AUTH_TOKEN_KEY, token ?? null);
}

function readAuthToken() {
  return readValue(AUTH_TOKEN_KEY);
}

function buildUrl(path, params = {}) {
  const normalisedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalisedPath}`);
  const query = new URLSearchParams(url.search);

  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && `${value}`.length > 0)
    .forEach(([key, value]) => {
      query.set(key, value);
    });

  url.search = query.toString();
  return url.toString();
}

function readStoredSession() {
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    console.warn('Unable to parse stored session payload.', error);
    return null;
  }
}

function normaliseRole(value) {
  if (!value) {
    return null;
  }
  return `${value}`.trim().toLowerCase().replace(/\s+/g, '-');
}

function getAuthHeaders() {
  const headers = {};

  const token = readAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const session = readStoredSession();
  if (session?.id) {
    headers['x-user-id'] = `${session.id}`;
  }

  if (session?.memberships || session?.accountTypes || session?.primaryDashboard) {
    const roleCandidates = [];
    if (Array.isArray(session.memberships)) {
      roleCandidates.push(...session.memberships);
    }
    if (Array.isArray(session.accountTypes)) {
      roleCandidates.push(...session.accountTypes);
    }
    if (session.primaryDashboard) {
      roleCandidates.push(session.primaryDashboard);
    }

    const normalised = Array.from(new Set(roleCandidates.map(normaliseRole).filter(Boolean)));
    if (normalised.length) {
      headers['x-roles'] = normalised.join(',');
    }
  }

  if (session?.userType) {
    headers['x-user-type'] = normaliseRole(session.userType);
  }

  return headers;
}

function storeAccessToken(token) {
  persistAuthToken(token);
}

function getAccessToken() {
  return readAuthToken();
}

function setAccessToken(token) {
  persistAuthToken(token);
}

function setRefreshToken(token) {
  persistValue(REFRESH_TOKEN_KEY, token ?? null);
}

function getRefreshToken() {
  return readValue(REFRESH_TOKEN_KEY);
}

async function request(method, path, { body, params, signal, headers } = {}) {
  const url = buildUrl(path, params);
  const requestHeaders = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...headers,
  };

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (isFormData) {
    delete requestHeaders['Content-Type'];
  }

  const fetchOptions = {
    method,
    headers: requestHeaders,
    signal,
    credentials: 'include',
  };

  if (method !== 'GET' && method !== 'HEAD') {
    if (isFormData) {
      fetchOptions.body = body;
    } else if (body != null) {
      fetchOptions.body = JSON.stringify(body);
    }
  }

  const response = await fetch(url, fetchOptions);

  const contentType = response.headers.get('content-type') || '';
  let responseBody = null;

  if (contentType.includes('application/json')) {
    responseBody = await response.json();
  } else if (contentType.includes('text/')) {
    responseBody = await response.text();
  }

  if (!response.ok) {
    throw new ApiError(responseBody?.message || 'Request failed', response.status, responseBody);
  }

  return responseBody;
}

function cacheKey(key) {
  return `${CACHE_NAMESPACE}${key}`;
}

function readCache(key) {
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(cacheKey(key));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) {
      storage.removeItem(cacheKey(key));
      return null;
    }
    return {
      data: parsed.data,
      timestamp: parsed.storedAt ? new Date(parsed.storedAt) : null,
    };
  } catch (error) {
    console.warn('Failed to read cache entry', key, error);
    return null;
  }
}

function writeCache(key, data, ttl = DEFAULT_CACHE_TTL) {
  if (!storage) {
    return;
  }

  try {
    const payload = {
      data,
      storedAt: new Date().toISOString(),
      expiresAt: ttl === Infinity ? null : new Date(Date.now() + ttl).toISOString(),
    };
    storage.setItem(cacheKey(key), JSON.stringify(payload));
  } catch (error) {
    console.warn('Failed to persist cache entry', key, error);
  }
}

function removeCache(key) {
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(cacheKey(key));
  } catch (error) {
    console.warn('Failed to remove cache entry', key, error);
  }
}

function setAuthTokens({ accessToken, refreshToken, expiresAt } = {}) {
  persistAuthToken(accessToken ?? null);
  setRefreshToken(refreshToken ?? null);
  persistValue(ACCESS_TOKEN_EXPIRY_KEY, expiresAt ?? null);
}

function getAuthTokens() {
  if (!storage) {
    return { accessToken: null, refreshToken: null, expiresAt: null };
  }

  return {
    accessToken: readAuthToken(),
    refreshToken: readValue(REFRESH_TOKEN_KEY),
    expiresAt: readValue(ACCESS_TOKEN_EXPIRY_KEY),
  };
}

function clearAuthTokens() {
  setAuthTokens({ accessToken: null, refreshToken: null, expiresAt: null });
}

function clearAccessToken() {
  storeAccessToken(null);
  setAccessToken(null);
}

function clearRefreshToken() {
  setRefreshToken(null);
}

export const apiClient = {
  get: (path, options) => request('GET', path, options),
  post: (path, body, options) => request('POST', path, { ...options, body }),
  put: (path, body, options) => request('PUT', path, { ...options, body }),
  patch: (path, body, options) => request('PATCH', path, { ...options, body }),
  delete: (path, options) => request('DELETE', path, options),
  readCache,
  writeCache,
  removeCache,
  setAuthToken: persistAuthToken,
  getAuthToken: readAuthToken,
  clearAuthToken: () => persistAuthToken(null),
  storeAccessToken,
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  setRefreshToken,
  getRefreshToken,
  clearRefreshToken,
  setAuthTokens,
  getAuthTokens,
  clearAuthTokens,
  ApiError,
  API_BASE_URL,
};

export default apiClient;
