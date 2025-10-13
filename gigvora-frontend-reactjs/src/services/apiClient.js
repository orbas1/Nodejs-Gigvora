const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api').replace(/\/$/, '');
const DEFAULT_CACHE_TTL = 1000 * 60 * 2; // two minutes
const CACHE_NAMESPACE = 'gigvora:web:cache:';
const AUTH_TOKEN_KEY = 'gigvora:web:auth:accessToken';
const REFRESH_TOKEN_KEY = 'gigvora:web:auth:refreshToken';
const ACCESS_TOKEN_EXPIRY_KEY = 'gigvora:web:auth:accessTokenExpiresAt';

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
    console.warn('Local storage is unavailable, caching disabled.', error);
    return null;
  }
}

const storage = getStorage();

function buildUrl(path, params = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);
  const query = new URLSearchParams(url.search);

  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && `${value}`.length > 0)
    .forEach(([key, value]) => {
      query.set(key, value);
    });

  url.search = query.toString();
  return url.toString();
}

function getAuthHeaders() {
  if (!storage) {
    return {};
  }
  const token = storage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
}

async function request(method, path, { body, params, signal, headers } = {}) {
  const url = buildUrl(path, params);
  const requestHeaders = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...headers,
  };

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body == null ? undefined : JSON.stringify(body),
    signal,
    credentials: 'include',
  });

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
  if (!storage) {
    return;
  }
  try {
    if (accessToken) {
      storage.setItem(AUTH_TOKEN_KEY, accessToken);
    } else {
      storage.removeItem(AUTH_TOKEN_KEY);
    }

    if (refreshToken) {
      storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      storage.removeItem(REFRESH_TOKEN_KEY);
    }

    if (expiresAt) {
      storage.setItem(ACCESS_TOKEN_EXPIRY_KEY, expiresAt);
    } else {
      storage.removeItem(ACCESS_TOKEN_EXPIRY_KEY);
    }
  } catch (error) {
    console.warn('Failed to persist auth tokens', error);
  }
}

function getAuthTokens() {
  if (!storage) {
    return { accessToken: null, refreshToken: null, expiresAt: null };
  }
  return {
    accessToken: storage.getItem(AUTH_TOKEN_KEY),
    refreshToken: storage.getItem(REFRESH_TOKEN_KEY),
    expiresAt: storage.getItem(ACCESS_TOKEN_EXPIRY_KEY),
  };
}

function clearAuthTokens() {
  setAuthTokens({});
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
  ApiError,
  API_BASE_URL,
  setAuthTokens,
  clearAuthTokens,
  getAuthTokens,
};

export default apiClient;
