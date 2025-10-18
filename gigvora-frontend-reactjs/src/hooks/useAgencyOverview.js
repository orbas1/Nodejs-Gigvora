import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAgencyOverview, updateAgencyOverview } from '../services/agency.js';

function normaliseWorkspaceParams({ workspaceId, workspaceSlug }) {
  const parsedId = workspaceId != null && workspaceId !== '' ? Number(workspaceId) : null;
  return {
    workspaceId: Number.isFinite(parsedId) ? parsedId : workspaceId ?? null,
    workspaceSlug: workspaceSlug ?? null,
  };
}

export function useAgencyOverview({ workspaceId, workspaceSlug, enabled = true } = {}) {
  const [{ data, loading, error, fromCache, lastUpdated }, setState] = useState({
    data: null,
    loading: Boolean(enabled),
    error: null,
    fromCache: false,
    lastUpdated: null,
  });
  const [saving, setSaving] = useState(false);
  const abortControllerRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      return null;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState((previous) => ({ ...previous, loading: true, error: null }));

    try {
      const params = normaliseWorkspaceParams({ workspaceId, workspaceSlug });
      const response = await fetchAgencyOverview(
        {
          workspaceId: params.workspaceId ?? undefined,
          workspaceSlug: params.workspaceSlug ?? undefined,
        },
        { signal: controller.signal },
      );

      setState({
        data: response,
        loading: false,
        error: null,
        fromCache: Boolean(response?.meta?.fromCache),
        lastUpdated: response?.meta?.lastUpdatedAt ?? response?.overview?.updatedAt ?? null,
      });
      return response;
    } catch (err) {
      if (err?.name === 'AbortError') {
        return null;
      }
      setState((previous) => ({ ...previous, loading: false, error: err }));
      return null;
    }
  }, [enabled, workspaceId, workspaceSlug]);

  useEffect(() => {
    if (!enabled) {
      setState((previous) => ({ ...previous, loading: false }));
      return () => {};
    }

    refresh();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [enabled, refresh]);

  const save = useCallback(
    async (payload = {}) => {
      setSaving(true);
      try {
        const response = await updateAgencyOverview(payload);
        setState({
          data: response,
          loading: false,
          error: null,
          fromCache: false,
          lastUpdated: response?.meta?.lastUpdatedAt ?? response?.overview?.updatedAt ?? new Date().toISOString(),
        });
        return response;
      } catch (err) {
        setState((previous) => ({ ...previous, error: err }));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return {
    data,
    loading,
    error,
    fromCache,
    lastUpdated,
    refresh,
    saving,
    save,
  };
}

export default useAgencyOverview;
