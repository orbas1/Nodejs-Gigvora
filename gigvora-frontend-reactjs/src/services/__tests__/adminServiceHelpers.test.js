import { describe, expect, it, beforeEach, vi } from 'vitest';

const apiClientCache = new Map();

vi.mock('../apiClient.js', () => {
  const apiClient = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    readCache: vi.fn((key) => apiClientCache.get(key) ?? null),
    writeCache: vi.fn((key, value) => {
      apiClientCache.set(key, { data: value });
    }),
    removeCache: vi.fn((key) => {
      apiClientCache.delete(key);
    }),
    ApiError: class ApiError extends Error {},
    API_BASE_URL: 'http://localhost',
  };

  return {
    apiClient,
    default: apiClient,
  };
});

import { apiClient } from '../apiClient.js';
import {
  assertAdminAccess,
  buildAdminCacheKey,
  fetchWithCache,
  invalidateCacheByTag,
  resetAdminServiceCaches,
  sanitiseQueryParams,
} from '../adminServiceHelpers.js';

function setSession(payload) {
  const store = new Map();
  const localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
  Object.defineProperty(globalThis, 'window', {
    value: { localStorage },
    configurable: true,
    writable: true,
  });
  if (payload) {
    localStorage.setItem('gigvora:web:session', JSON.stringify(payload));
  }
  return localStorage;
}

describe('adminServiceHelpers', () => {
  beforeEach(() => {
    apiClientCache.clear();
    vi.clearAllMocks();
    resetAdminServiceCaches();
  });

  it('sanitises query params by removing nullish values and normalising arrays', () => {
    const params = sanitiseQueryParams({
      search: '  admin ',
      status: ['active', ''],
      empty: '',
      skip: null,
      page: 2,
      include: ['a', 'b'],
      bool: false,
    });

    expect(params).toEqual({
      search: 'admin',
      status: 'active',
      page: 2,
      include: 'a,b',
      bool: 'false',
    });
  });

  it('builds deterministic cache keys', () => {
    const key = buildAdminCacheKey('namespace', { b: 'two', a: 'one' });
    expect(key).toBe('namespace?a=one&b=two');
  });

  it('enforces admin access using stored session roles', () => {
    setSession({ roles: ['finance-admin'] });
    expect(() => assertAdminAccess(['finance-admin'])).not.toThrow();
    expect(() => assertAdminAccess(['super-admin'])).toThrow('You do not have permission');
  });

  it('throws when no session is available', () => {
    setSession(null);
    expect(() => assertAdminAccess()).toThrow('Administrator session is required');
  });

  it('caches fetch results and reuses them until invalidated', async () => {
    setSession({ roles: ['super-admin'] });
    apiClient.get.mockResolvedValueOnce({ value: 1 });

    const loader = () => apiClient.get('/example');
    const resultOne = await fetchWithCache('cache:key', loader, { tag: 'tag' });
    expect(resultOne).toEqual({ value: 1 });
    expect(apiClient.get).toHaveBeenCalledTimes(1);

    const resultTwo = await fetchWithCache('cache:key', loader, { tag: 'tag' });
    expect(resultTwo).toEqual({ value: 1 });
    expect(apiClient.get).toHaveBeenCalledTimes(1);

    invalidateCacheByTag('tag');
    expect(apiClient.removeCache).toHaveBeenCalledWith('cache:key');
  });
});
