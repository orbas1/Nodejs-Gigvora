import { apiClient } from './apiClient.js';

const SESSION_STORAGE_KEY = 'gigvora:web:session';
const DEFAULT_ADMIN_ROLES = ['super-admin', 'platform-admin', 'admin'];
const cacheRegistry = new Map();
const inFlightRequests = new Map();

function getLocalStorage() {
  if (typeof window === 'undefined' || !window?.localStorage) {
    return null;
  }

  try {
    return window.localStorage;
  } catch (error) {
    console.warn('Local storage access denied, RBAC checks will fail.', error);
    return null;
  }
}

function normaliseRole(value) {
  if (!value && value !== 0) {
    return null;
  }
  return `${value}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function toArray(value) {
  if (!value && value !== 0) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (value instanceof Set) {
    return Array.from(value);
  }
  if (typeof value === 'object') {
    return Object.values(value);
  }
  return [value];
}

function readAdminSession() {
  const storage = getLocalStorage();
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
    console.warn('Failed to parse stored admin session payload.', error);
    return null;
  }
}

function extractRoles(session) {
  const roles = new Set();
  if (!session) {
    return roles;
  }

  const addRoles = (values) => {
    toArray(values)
      .map(normaliseRole)
      .filter(Boolean)
      .forEach((role) => roles.add(role));
  };

  addRoles(session.memberships);
  addRoles(session.accountTypes);
  addRoles(session.roles);
  addRoles(session.permissions);
  addRoles(session.securityContext?.roles);
  addRoles(session.securityContext?.permissions);
  addRoles(session.securityContext?.scopes);

  if (session.primaryDashboard) {
    const primaryRole = normaliseRole(session.primaryDashboard);
    if (primaryRole) {
      roles.add(primaryRole);
    }
  }

  if (session.userType) {
    const userTypeRole = normaliseRole(session.userType);
    if (userTypeRole) {
      roles.add(userTypeRole);
    }
  }

  if (Array.isArray(session.featureFlags)) {
    session.featureFlags
      .map((flag) => normaliseRole(`feature-${flag}`))
      .filter(Boolean)
      .forEach((role) => roles.add(role));
  }

  return roles;
}

function assertAdminAccess(requiredRoles = DEFAULT_ADMIN_ROLES, { message } = {}) {
  const normalisedRequired = toArray(requiredRoles)
    .map(normaliseRole)
    .filter(Boolean);
  if (!normalisedRequired.length) {
    return;
  }

  const session = readAdminSession();
  if (!session) {
    throw new Error(message ?? 'Administrator session is required to perform this action.');
  }

  const activeRoles = extractRoles(session);
  const hasRole = normalisedRequired.some((role) => activeRoles.has(role));

  if (!hasRole) {
    throw new Error(message ?? 'You do not have permission to perform this action.');
  }
}

function sanitiseQueryParams(params = {}) {
  const cleanedEntries = Object.entries(params).flatMap(([key, value]) => {
    if (value === undefined || value === null) {
      return [];
    }

    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        return [];
      }
      return [[key, value.toISOString()]];
    }

    if (Array.isArray(value)) {
      const serialised = value
        .map((entry) => `${entry}`.trim())
        .filter(Boolean)
        .join(',');
      return serialised ? [[key, serialised]] : [];
    }

    if (typeof value === 'boolean') {
      return [[key, value ? 'true' : 'false']];
    }

    if (typeof value === 'number') {
      if (Number.isFinite(value)) {
        return [[key, value]];
      }
      return [];
    }

    const trimmed = `${value}`.trim();
    if (!trimmed) {
      return [];
    }
    return [[key, trimmed]];
  });

  return Object.fromEntries(cleanedEntries);
}

function buildAdminCacheKey(namespace, params = {}) {
  const cleaned = sanitiseQueryParams(params);
  const sorted = Object.entries(cleaned).sort(([a], [b]) => a.localeCompare(b));
  if (!sorted.length) {
    return namespace;
  }

  const serialised = sorted
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return `${namespace}?${serialised}`;
}

function registerCacheKey(tag, key) {
  if (!tag) {
    return;
  }
  const tags = Array.isArray(tag) ? tag : [tag];
  tags
    .map((entry) => `${entry}`.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const set = cacheRegistry.get(entry) ?? new Set();
      set.add(key);
      cacheRegistry.set(entry, set);
    });
}

async function fetchWithCache(key, loader, { ttl = 120000, forceRefresh = false, tag } = {}) {
  if (!forceRefresh) {
    const cached = apiClient.readCache(key);
    if (cached && Object.prototype.hasOwnProperty.call(cached, 'data')) {
      registerCacheKey(tag, key);
      return cached.data;
    }
  } else {
    apiClient.removeCache(key);
  }

  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }

  const task = (async () => {
    try {
      const data = await loader();
      apiClient.writeCache(key, data, ttl);
      registerCacheKey(tag, key);
      return data;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, task);
  return task;
}

function invalidateCacheByTag(...tags) {
  tags
    .flat()
    .map((tag) => `${tag}`.trim())
    .filter(Boolean)
    .forEach((tag) => {
      const keys = cacheRegistry.get(tag);
      if (!keys) {
        return;
      }
      keys.forEach((key) => apiClient.removeCache(key));
      cacheRegistry.delete(tag);
    });
}

function invalidateCacheKey(key) {
  if (!key) {
    return;
  }
  apiClient.removeCache(key);
  cacheRegistry.forEach((set) => set.delete(key));
}

function normaliseIdentifier(value, { label = 'identifier' } = {}) {
  if (value === undefined || value === null) {
    throw new Error(`${label} is required`);
  }

  const normalised = typeof value === 'string' ? value.trim() : `${value}`;
  if (!normalised) {
    throw new Error(`${label} is required`);
  }
  return normalised;
}

function encodeIdentifier(value, options) {
  return encodeURIComponent(normaliseIdentifier(value, options));
}

function createRequestOptions(options = {}, params) {
  const { params: optionParams, headers, ...rest } = options ?? {};
  const requestOptions = { ...rest };

  if (headers) {
    requestOptions.headers = { ...headers };
  }

  if (params) {
    requestOptions.params = { ...(optionParams ?? {}), ...params };
  } else if (optionParams) {
    requestOptions.params = { ...optionParams };
  }

  return requestOptions;
}

function resetAdminServiceCaches() {
  inFlightRequests.clear();
  cacheRegistry.clear();
}

export {
  DEFAULT_ADMIN_ROLES,
  assertAdminAccess,
  buildAdminCacheKey,
  createRequestOptions,
  encodeIdentifier,
  fetchWithCache,
  invalidateCacheByTag,
  invalidateCacheKey,
  normaliseIdentifier,
  sanitiseQueryParams,
  resetAdminServiceCaches,
};

export default {
  assertAdminAccess,
  buildAdminCacheKey,
  createRequestOptions,
  encodeIdentifier,
  fetchWithCache,
  invalidateCacheByTag,
  invalidateCacheKey,
  normaliseIdentifier,
  sanitiseQueryParams,
  resetAdminServiceCaches,
};
