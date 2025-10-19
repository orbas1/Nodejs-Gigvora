import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchLiveServiceTelemetry } from '../services/runtimeTelemetry.js';

const DEFAULT_WINDOW_MINUTES = 60;
const DEFAULT_REFRESH_INTERVAL = 60_000;

export default function useLiveServiceTelemetry({
  windowMinutes = DEFAULT_WINDOW_MINUTES,
  refreshIntervalMs = DEFAULT_REFRESH_INTERVAL,
} = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const hasSnapshotRef = useRef(false);

  const loadTelemetry = useCallback(
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
        const payload = await fetchLiveServiceTelemetry({ windowMinutes }, { signal: controller.signal });
        const telemetry = payload?.telemetry ?? payload;
        if (!isMountedRef.current) {
          return;
        }
        setData(telemetry);
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
          setError(err?.message || 'Unable to load live service telemetry.');
        }
        setLoading(false);
        setRefreshing(false);
      }
    },
    [windowMinutes],
  );

  useEffect(() => {
    isMountedRef.current = true;
    loadTelemetry({ quiet: false });

    if (refreshIntervalMs > 0) {
      const timer = setInterval(() => {
        loadTelemetry({ quiet: true });
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
  }, [loadTelemetry, refreshIntervalMs]);

  const refresh = useCallback(() => loadTelemetry({ quiet: false }), [loadTelemetry]);

  return {
    data,
    loading: hasSnapshotRef.current ? false : loading,
    refreshing: hasSnapshotRef.current ? refreshing : loading,
    error,
    lastUpdated,
    refresh,
  };
}
