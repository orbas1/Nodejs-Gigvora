import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchDomainGovernanceSummaries } from '../services/domainGovernance.js';

const DEFAULT_REFRESH_INTERVAL = 1000 * 60 * 5; // five minutes

export default function useDomainGovernanceSummaries({ refreshIntervalMs = DEFAULT_REFRESH_INTERVAL } = {}) {
  const [state, setState] = useState({
    loading: true,
    error: null,
    contexts: [],
    generatedAt: null,
    refreshing: false,
  });
  const abortRef = useRef();

  const load = useCallback(async ({ signal, force = false } = {}) => {
    setState((previous) => ({
      ...previous,
      loading: force ? true : previous.loading,
      refreshing: !force && previous.contexts.length > 0,
      error: null,
    }));

    try {
      const response = await fetchDomainGovernanceSummaries({ signal });
      setState({
        loading: false,
        refreshing: false,
        error: null,
        contexts: response.contexts,
        generatedAt: response.generatedAt,
      });
    } catch (error) {
      if (signal?.aborted) {
        return;
      }
      setState((previous) => ({
        ...previous,
        loading: false,
        refreshing: false,
        error,
      }));
    }
  }, []);

  useEffect(() => {
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;
    load({ signal: controller.signal, force: true });

    if (!refreshIntervalMs) {
      return () => controller.abort();
    }

    const interval = setInterval(() => {
      load({ signal: controller.signal });
    }, refreshIntervalMs);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [load, refreshIntervalMs]);

  const value = useMemo(
    () => ({
      ...state,
      refresh: ({ force = false } = {}) => {
        abortRef.current?.abort?.();
        const controller = new AbortController();
        abortRef.current = controller;
        load({ signal: controller.signal, force });
      },
    }),
    [state, load],
  );

  return value;
}
