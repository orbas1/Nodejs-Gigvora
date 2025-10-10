import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '../services/apiClient.js';

export function useCachedResource(
  cacheKey,
  fetcher,
  { ttl = undefined, dependencies = [], enabled = true } = {},
) {
  const abortRef = useRef();
  const mountedRef = useRef(true);
  const [state, setState] = useState({
    data: null,
    error: null,
    loading: enabled,
    fromCache: false,
    lastUpdated: null,
  });

  const refresh = useCallback(
    async ({ force = false } = {}) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      let cached = null;
      if (!force) {
        cached = apiClient.readCache(cacheKey);
        if (cached && mountedRef.current) {
          setState((prev) => ({
            ...prev,
            data: cached.data,
            fromCache: true,
            lastUpdated: cached.timestamp,
          }));
        }
      }

      if (mountedRef.current) {
        setState((prev) => ({ ...prev, loading: true, error: null }));
      }

      try {
        const result = await fetcher({ signal: controller.signal, force });
        if (!mountedRef.current) {
          return { data: result, fromCache: false };
        }
        apiClient.writeCache(cacheKey, result, ttl ?? undefined);
        const timestamp = new Date();
        setState({
          data: result,
          error: null,
          loading: false,
          fromCache: false,
          lastUpdated: timestamp,
        });
        return { data: result, fromCache: false };
      } catch (error) {
        if (controller.signal.aborted || !mountedRef.current) {
          return { error, fromCache: false };
        }
        const fallback = cached || apiClient.readCache(cacheKey);
        if (fallback) {
          setState({
            data: fallback.data,
            error,
            loading: false,
            fromCache: true,
            lastUpdated: fallback.timestamp,
          });
          return { data: fallback.data, fromCache: true };
        }
        setState({ data: null, error, loading: false, fromCache: false, lastUpdated: null });
        return { error, fromCache: false };
      }
    },
    [cacheKey, fetcher, ttl],
  );

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) {
      refresh();
    }
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, [enabled, refresh, ...dependencies]);

  return { ...state, refresh };
}

export default useCachedResource;
