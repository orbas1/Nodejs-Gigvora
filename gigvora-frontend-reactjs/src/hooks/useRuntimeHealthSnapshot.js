import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchRuntimeHealth } from '../services/runtimeTelemetry.js';

const DEFAULT_REFRESH_INTERVAL = 45_000;

export default function useRuntimeHealthSnapshot({ refreshIntervalMs = DEFAULT_REFRESH_INTERVAL } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const hasSnapshotRef = useRef(false);

  const loadSnapshot = useCallback(
    async ({ quiet = false } = {}) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (!quiet) {
        setError(null);
        if (hasSnapshotRef.current) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
      }

      try {
        const payload = await fetchRuntimeHealth({}, { signal: controller.signal });
        if (!isMountedRef.current) {
          return;
        }
        setData(payload);
        hasSnapshotRef.current = true;
        setError(null);
        setLoading(false);
        setRefreshing(false);
        setLastUpdated(new Date().toISOString());
      } catch (err) {
        if (controller.signal.aborted || !isMountedRef.current) {
          return;
        }
        if (!quiet) {
          setError(err?.message || 'Failed to load runtime telemetry.');
        }
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    isMountedRef.current = true;
    loadSnapshot({ quiet: false });

    if (refreshIntervalMs > 0) {
      const timer = setInterval(() => {
        loadSnapshot({ quiet: true });
      }, refreshIntervalMs);
      return () => {
        isMountedRef.current = false;
        clearInterval(timer);
        abortControllerRef.current?.abort();
      };
    }

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, [loadSnapshot, refreshIntervalMs]);

  const refresh = useCallback(() => loadSnapshot({ quiet: false }), [loadSnapshot]);

  return {
    data,
    loading: hasSnapshotRef.current ? false : loading,
    refreshing: hasSnapshotRef.current ? refreshing : loading,
    error,
    lastUpdated,
    refresh,
  };
}

