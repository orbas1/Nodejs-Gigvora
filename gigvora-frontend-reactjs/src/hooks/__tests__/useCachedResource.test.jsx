import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCachedResource } from '../useCachedResource.js';
import { apiClient } from '../../services/apiClient.js';

const cacheStore = new Map();

vi.mock('../../services/apiClient.js', () => {
  return {
    apiClient: {
      readCache: vi.fn((key) => cacheStore.get(key) ?? null),
      writeCache: vi.fn((key, value) => {
        cacheStore.set(key, {
          data: value,
          timestamp: new Date(),
        });
      }),
    },
  };
});

describe('useCachedResource', () => {
  beforeEach(() => {
    cacheStore.clear();
    apiClient.readCache.mockClear();
    apiClient.writeCache.mockClear();
  });

  it('avoids unnecessary refetches when dependencies values are unchanged', async () => {
    const fetcher = vi.fn().mockResolvedValue({ message: 'ok' });

    const { result, rerender } = renderHook(
      ({ deps }) => useCachedResource('test:key', fetcher, { dependencies: deps }),
      { initialProps: { deps: [1, 'alpha'] } },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetcher).toHaveBeenCalledTimes(1);

    rerender({ deps: [1, 'alpha'] });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('refetches when dependencies values change', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ version: 1 })
      .mockResolvedValue({ version: 2 });

    const { result, rerender } = renderHook(
      ({ deps }) => useCachedResource('test:key', fetcher, { dependencies: deps }),
      { initialProps: { deps: [1] } },
    );

    await waitFor(() => expect(result.current.data?.version).toBe(1));
    expect(fetcher).toHaveBeenCalledTimes(1);

    rerender({ deps: [2] });

    await waitFor(() => expect(result.current.data?.version).toBe(2));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('respects the enabled flag', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true });

    const { result, rerender } = renderHook(
      ({ enabled }) => useCachedResource('test:key', fetcher, { enabled, dependencies: [] }),
      { initialProps: { enabled: false } },
    );

    expect(fetcher).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);

    rerender({ enabled: true });

    await waitFor(() => expect(result.current.data).toEqual({ ok: true }));
    expect(fetcher).toHaveBeenCalledTimes(1);

    rerender({ enabled: false });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

