import { act, renderHook, waitFor } from '@testing-library/react';
import useRuntimeHealthSnapshot from '../hooks/useRuntimeHealthSnapshot.js';
import useSavedSearches from '../hooks/useSavedSearches.js';

const {
  fetchRuntimeHealthMock,
  apiClientMock,
  storageStub,
  storageMap,
} = vi.hoisted(() => {
  const fetchRuntimeHealth = vi.fn();

  class ApiError extends Error {
    constructor(message, status) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  }

  const cacheStore = new Map();
  const apiClient = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    ApiError,
    readCache: vi.fn((key) => cacheStore.get(key) ?? null),
    writeCache: vi.fn((key, value) => {
      cacheStore.set(key, { data: value, timestamp: new Date() });
    }),
    removeCache: vi.fn((key) => cacheStore.delete(key)),
  };

  const backingStore = new Map();
  const localStorage = {
    getItem: vi.fn((key) => backingStore.get(key) ?? null),
    setItem: vi.fn((key, value) => {
      backingStore.set(key, value);
    }),
    removeItem: vi.fn((key) => {
      backingStore.delete(key);
    }),
    clear: vi.fn(() => backingStore.clear()),
  };

  return {
    fetchRuntimeHealthMock: fetchRuntimeHealth,
    apiClientMock: apiClient,
    storageStub: localStorage,
    storageMap: backingStore,
  };
});

vi.mock('../services/runtimeTelemetry.js', () => ({
  __esModule: true,
  fetchRuntimeHealth: fetchRuntimeHealthMock,
}));

vi.mock('../services/apiClient.js', () => ({
  __esModule: true,
  apiClient: apiClientMock,
  default: apiClientMock,
}));

beforeEach(() => {
  storageMap.clear();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: storageStub,
  });
  Object.defineProperty(window, 'sessionStorage', {
    configurable: true,
    value: storageStub,
  });
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useRuntimeHealthSnapshot', () => {
  it('returns derived health state and marks snapshots as stale over time', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
    fetchRuntimeHealthMock.mockResolvedValueOnce({
      summary: 'Operational',
      checks: [{ id: 'api', service: 'api', severity: 'info', message: 'ok' }],
    });

    const { result } = renderHook(() => useRuntimeHealthSnapshot({ refreshIntervalMs: 0 }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.status).toBe('healthy');
    expect(result.current.healthSummary.affectedServices).toContain('api');

    fetchRuntimeHealthMock.mockResolvedValueOnce({
      summary: 'Major outage',
      checks: [{ id: 'db', service: 'database', severity: 'critical', message: 'down' }],
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.status).toBe('critical');

    expect(result.current.healthSummary.affectedServices).toContain('database');

    fetchRuntimeHealthMock.mockRejectedValue(new Error('runtime telemetry unavailable'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(90_000);
    });

    await waitFor(() => expect(result.current.isStale).toBe(true));
  });

  it('captures refresh errors and surfaces degraded state details', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
    fetchRuntimeHealthMock.mockResolvedValueOnce({ summary: 'ok', checks: [] });

    const { result } = renderHook(() => useRuntimeHealthSnapshot({ refreshIntervalMs: 45_000 }));

    await act(async () => {
      await Promise.resolve();
    });

    fetchRuntimeHealthMock.mockRejectedValueOnce(new Error('Runtime telemetry offline'));

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.error).toBe('Runtime telemetry offline');
    expect(result.current.status).toBe('degraded');
    expect(result.current.lastErrorAt).not.toBeNull();
    expect(result.current.healthSummary.issues.at(-1)?.service).toBe('runtime-health');
  });
});

describe('useSavedSearches', () => {
  const LOCAL_STORAGE_KEY = 'gigvora:web:explorer:savedSearches';

  it('manages saved searches locally when offline', async () => {
    storageMap.set(
      LOCAL_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'local-1',
          name: 'Local search',
          query: 'type:project',
        },
      ]),
    );

    const { result } = renderHook(() => useSavedSearches());

    expect(result.current.canUseServer).toBe(false);
    expect(result.current.items).toHaveLength(1);

    await act(async () => {
      await result.current.createSavedSearch({ name: 'New search', query: 'skills:design' });
    });

    expect(result.current.items).toHaveLength(2);
    const persisted = JSON.parse(storageMap.get(LOCAL_STORAGE_KEY));
    expect(persisted).toHaveLength(2);
  });

  it('fetches remote saved searches and refreshes after mutations', async () => {
    storageMap.set('gigvora:web:auth:accessToken', 'token');
    storageMap.set('gigvora:web:userId', 'user-123');

    apiClientMock.get.mockResolvedValueOnce({ items: [{ id: 'remote-1', name: 'Alerts' }] });
    apiClientMock.post.mockResolvedValueOnce({ id: 'remote-2', name: 'Fresh' });
    apiClientMock.get.mockResolvedValueOnce({ items: [{ id: 'remote-1' }, { id: 'remote-2' }] });

    const { result } = renderHook(() => useSavedSearches());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(apiClientMock.get).toHaveBeenCalledWith('/search/subscriptions', {
      signal: expect.any(AbortSignal),
      headers: { 'x-user-id': 'user-123' },
    });

    expect(result.current.items).toHaveLength(1);

    await act(async () => {
      await result.current.createSavedSearch({ name: 'Fresh', query: 'sector:health' });
    });

    expect(apiClientMock.post).toHaveBeenCalledWith(
      '/search/subscriptions',
      { name: 'Fresh', query: 'sector:health' },
      { headers: { 'x-user-id': 'user-123' } },
    );
    expect(apiClientMock.get).toHaveBeenCalledTimes(2);
    expect(result.current.fromCache).toBe(false);
    expect(result.current.lastUpdated).not.toBeNull();
  });

  it('swallows handled API errors and returns empty collections', async () => {
    storageMap.set('gigvora:web:auth:accessToken', 'token');
    apiClientMock.get.mockRejectedValueOnce(new apiClientMock.ApiError('Missing resource', 404));

    const { result } = renderHook(() => useSavedSearches());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
