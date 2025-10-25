import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '../apiClient.js';

const DEFAULT_BASE = 'http://localhost:4000/api';

function createFetchResponse({ ok = true, status = 200, body = {}, headers = { 'content-type': 'application/json' } } = {}) {
  return {
    ok,
    status,
    headers: new Headers(headers),
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('apiClient request helpers', () => {
  it('performs GET requests with query params and auth headers', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createFetchResponse({ body: { ok: true } })));
    apiClient.setAuthToken('token-123');

    const result = await apiClient.get('/example', {
      params: { foo: 'bar', empty: '', nullish: null },
    });

    expect(fetch).toHaveBeenCalledWith(`${DEFAULT_BASE}/example?foo=bar`, expect.objectContaining({
      method: 'GET',
      headers: expect.objectContaining({
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-123',
      }),
      credentials: 'include',
    }));
    expect(result).toEqual({ ok: true });
  });

  it('performs POST requests with JSON body when sendBeacon not used', async () => {
    const body = { created: true };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createFetchResponse({ body })));

    const payload = { name: 'Example' };
    const result = await apiClient.post('items', payload);

    expect(fetch).toHaveBeenCalledWith(`${DEFAULT_BASE}/items`, expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(payload),
    }));
    expect(result).toEqual(body);
  });

  it('throws ApiError with response payload when request fails', async () => {
    const errorPayload = { message: 'Failure' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createFetchResponse({ ok: false, status: 422, body: errorPayload })));

    await expect(apiClient.get('/failing')).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
      body: errorPayload,
      message: 'Failure',
    });
  });
});

describe('apiClient caching utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('writes, reads, and expires cache entries based on ttl', () => {
    const now = new Date('2024-01-01T00:00:00Z');
    vi.setSystemTime(now);

    apiClient.writeCache('demo', { value: 123 }, 1000);

    let cached = apiClient.readCache('demo');
    expect(cached?.data).toEqual({ value: 123 });
    expect(cached?.timestamp?.toISOString()).toBe(now.toISOString());

    vi.setSystemTime(new Date(now.getTime() + 1500));
    cached = apiClient.readCache('demo');
    expect(cached).toBeNull();
  });

  it('removes cache entries explicitly', () => {
    apiClient.writeCache('demo-remove', { ok: true }, Infinity);
    expect(apiClient.readCache('demo-remove')).not.toBeNull();

    apiClient.removeCache('demo-remove');
    expect(apiClient.readCache('demo-remove')).toBeNull();
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});

describe('apiClient token management', () => {
  it('stores and retrieves auth tokens', () => {
    apiClient.setAuthTokens({ accessToken: 'access', refreshToken: 'refresh', expiresAt: '2024-01-01T00:00:00Z' });

    expect(apiClient.getAuthTokens()).toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresAt: '2024-01-01T00:00:00Z',
    });

    apiClient.clearAuthTokens();
    expect(apiClient.getAuthTokens()).toEqual({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
    });
  });
});
