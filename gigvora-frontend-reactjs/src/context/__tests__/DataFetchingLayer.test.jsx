import { createElement } from 'react';
import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataFetchingProvider, useDataFetchingLayer } from '../DataFetchingLayer.jsx';

const { storage, apiClientMock } = vi.hoisted(() => {
  const cacheStorage = new Map();
  const clientMock = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    writeCache: vi.fn((key, value) => {
      cacheStorage.set(key, { data: value, timestamp: new Date() });
    }),
    readCache: vi.fn((key) => cacheStorage.get(key) ?? null),
    removeCache: vi.fn((key) => cacheStorage.delete(key)),
  };

  return { storage: cacheStorage, apiClientMock: clientMock };
});

vi.mock('../../services/apiClient.js', () => ({
  __esModule: true,
  apiClient: apiClientMock,
  default: apiClientMock,
}));

vi.mock('../../services/analytics.js', () => ({
  __esModule: true,
  default: {
    track: vi.fn(),
    setGlobalContext: vi.fn(),
  },
}));

vi.mock('../SessionContext.jsx', () => ({
  useSession: () => ({ session: { id: 'user-123' } }),
}));

describe('DataFetchingLayer', () => {
  beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
  });

  it('caches GET responses and reuses them', async () => {
    apiClientMock.get.mockResolvedValueOnce({ hello: 'world' });
    const wrapper = ({ children }) => createElement(DataFetchingProvider, null, children);
    const { result } = renderHook(() => useDataFetchingLayer(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.fetchResource('/demo/data', { params: { page: 1 } });
    });
    expect(response).toEqual({ hello: 'world' });
    expect(apiClientMock.get).toHaveBeenCalledTimes(1);

    await act(async () => {
      const second = await result.current.fetchResource('/demo/data', { params: { page: 1 } });
      expect(second).toEqual({ hello: 'world' });
    });
    expect(apiClientMock.get).toHaveBeenCalledTimes(1);
  });

  it('performs optimistic updates on mutation and revalidates cache', async () => {
    const resourcePath = '/admin/platform/feature-flags/sample';
    apiClientMock.get.mockResolvedValueOnce({ key: 'sample', enabled: false });
    const wrapper = ({ children }) => createElement(DataFetchingProvider, null, children);
    const { result } = renderHook(() => useDataFetchingLayer(), { wrapper });

    const cacheKey = result.current.buildKey('GET', resourcePath, {});
    await act(async () => {
      await result.current.fetchResource(resourcePath, { key: cacheKey });
    });

    const updates = [];
    const unsubscribe = result.current.subscribe(cacheKey, (payload) => updates.push(payload));

    apiClientMock.patch.mockResolvedValueOnce({ key: 'sample', enabled: true });
    apiClientMock.get.mockResolvedValueOnce({ key: 'sample', enabled: true });

    await act(async () => {
      await result.current.mutateResource(resourcePath, {
        method: 'PATCH',
        body: { enabled: true },
        invalidate: [cacheKey],
        optimisticUpdate: (updateCache) => {
          updateCache(cacheKey, () => ({ key: 'sample', enabled: true }));
        },
      });
    });

    unsubscribe();
    expect(apiClientMock.patch).toHaveBeenCalledWith(
      resourcePath,
      { enabled: true },
      { params: undefined, signal: undefined },
    );
    expect(apiClientMock.get).toHaveBeenCalledTimes(2);
    expect(updates.some((payload) => payload?.data?.enabled === true)).toBe(true);
  });
});
