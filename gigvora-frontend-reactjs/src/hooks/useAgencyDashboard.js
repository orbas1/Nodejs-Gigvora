import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAgencyDashboard } from '../services/agency.js';

export default function useAgencyDashboard(params = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const memoParams = useMemo(
    () => ({
      workspaceId: params.workspaceId,
      workspaceSlug: params.workspaceSlug,
      lookbackDays: params.lookbackDays,
    }),
    [params.workspaceId, params.workspaceSlug, params.lookbackDays],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAgencyDashboard(memoParams);
      setData(response ?? null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unable to load agency dashboard.'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [memoParams]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
}
