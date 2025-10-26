import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  appendDisputeEvent,
  createDispute,
  fetchDisputeDashboard,
  fetchDisputeDetail,
} from '../../../../services/freelancerDisputes.js';

function normaliseError(error) {
  if (!error) {
    return null;
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error(typeof error === 'string' ? error : 'Unexpected error');
}

export function useDisputesData(freelancerId) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ stage: 'all', status: 'all', includeClosed: false });

  const [selectedId, setSelectedId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const detailCacheRef = useRef(new Map());
  const [toast, setToast] = useState(null);

  const queryParams = useMemo(() => {
    const params = {};
    if (filters.stage && filters.stage !== 'all') {
      params.stage = filters.stage;
    }
    if (filters.status && filters.status !== 'all') {
      params.status = filters.status;
    }
    if (filters.includeClosed) {
      params.includeClosed = true;
    }
    return params;
  }, [filters]);

  const loadDashboard = useCallback(
    async (mode = 'auto') => {
      if (!freelancerId) {
        return null;
      }
      const setState = mode === 'initial' || (!dashboard && mode === 'auto') ? setLoading : setRefreshing;
      setState(true);
      try {
        const data = await fetchDisputeDashboard(freelancerId, queryParams);
        setDashboard(data);
        setError(null);
        return data;
      } catch (cause) {
        const normalised = normaliseError(cause);
        setError(normalised);
        throw normalised;
      } finally {
        setState(false);
      }
    },
    [dashboard, freelancerId, queryParams],
  );

  useEffect(() => {
    loadDashboard(dashboard ? 'refresh' : 'initial').catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freelancerId, queryParams.stage, queryParams.status, queryParams.includeClosed]);

  const selectDispute = useCallback(
    async (disputeId) => {
      if (!freelancerId) {
        return null;
      }
      if (!disputeId) {
        setSelectedId(null);
        return null;
      }

      setSelectedId(disputeId);
      const cached = detailCacheRef.current.get(disputeId);
      if (cached) {
        setDetailError(null);
        return cached;
      }

      setDetailLoading(true);
      try {
        const detail = await fetchDisputeDetail(freelancerId, disputeId);
        detailCacheRef.current.set(disputeId, detail);
        setDetailError(null);
        return detail;
      } catch (cause) {
        const normalised = normaliseError(cause);
        setDetailError(normalised);
        throw normalised;
      } finally {
        setDetailLoading(false);
      }
    },
    [freelancerId],
  );

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setDetailError(null);
  }, []);

  const selectedDetail = useMemo(() => {
    if (!selectedId) {
      return null;
    }
    return detailCacheRef.current.get(selectedId) ?? null;
  }, [selectedId]);

  const openDispute = useCallback(
    async (payload) => {
      if (!freelancerId) {
        throw new Error('Missing freelancer context');
      }

      const result = await createDispute(freelancerId, payload);
      detailCacheRef.current.set(result.dispute.id, result);
      setSelectedId(result.dispute.id);
      setToast({ type: 'success', message: 'Dispute created' });
      await loadDashboard('refresh');
      return result;
    },
    [freelancerId, loadDashboard],
  );

  const logEvent = useCallback(
    async (disputeId, payload) => {
      if (!freelancerId || !disputeId) {
        throw new Error('Missing dispute context');
      }
      const result = await appendDisputeEvent(freelancerId, disputeId, payload);
      detailCacheRef.current.set(disputeId, result);
      setToast({ type: 'success', message: 'Update saved' });
      await loadDashboard('refresh');
      setSelectedId(disputeId);
      return result;
    },
    [freelancerId, loadDashboard],
  );

  const dismissToast = useCallback(() => setToast(null), []);

  return {
    dashboard,
    loading,
    refreshing,
    error,
    filters,
    setFilters,
    reload: () => loadDashboard(dashboard ? 'refresh' : 'initial'),
    selectedId,
    selectDispute,
    clearSelection,
    selectedDetail,
    detailLoading,
    detailError,
    openDispute,
    logEvent,
    toast,
    dismissToast,
  };
}

export default useDisputesData;
