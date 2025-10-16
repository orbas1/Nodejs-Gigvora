import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiClient } from '../services/apiClient.js';

export function useCachedResource(
  cacheKey,
  fetcher,
  { ttl = undefined, dependencies = [], enabled = true } = {},
) {
  const abortRef = useRef();
  const mountedRef = useRef(true);
  const dependencySnapshotRef = useRef({ values: [], initialised: false });
  const fetcherRef = useRef(fetcher);
  const [state, setState] = useState({
    data: null,
    error: null,
    loading: enabled,
    fromCache: false,
    lastUpdated: null,
  });

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

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
        const result = await fetcherRef.current({ signal: controller.signal, force });
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
    [cacheKey, ttl],
  );

  useEffect(() => {
    mountedRef.current = true;
    dependencySnapshotRef.current = { values: dependencies, initialised: true };
    if (enabled) {
      refresh();
    }
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      dependencySnapshotRef.current = { values: [], initialised: false };
    };
  }, [dependencies, enabled, refresh]);

  useEffect(() => {
    if (!enabled) {
      dependencySnapshotRef.current = { values: [], initialised: false };
      return;
    }

    const snapshot = dependencySnapshotRef.current;
    const hasChanged =
      snapshot.values.length !== dependencies.length ||
      dependencies.some((value, index) => value !== snapshot.values[index]);

    if (!snapshot.initialised) {
      dependencySnapshotRef.current = { values: dependencies, initialised: true };
      return;
    }

    if (hasChanged) {
      dependencySnapshotRef.current = { values: dependencies, initialised: true };
      refresh();
    }
  }, [dependencies, enabled, refresh]);

  const stateWithRefresh = useMemo(() => ({ ...state, refresh }), [refresh, state]);

  return stateWithRefresh;
}

export default useCachedResource;
