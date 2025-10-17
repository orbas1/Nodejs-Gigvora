import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchAgencyDashboard } from '../services/agency.js';

export function useAgencyDashboard({ workspaceId, workspaceSlug, lookbackDays = 90, enabled = true } = {}) {
  const cacheKey = useMemo(() => {
    const identifier = workspaceSlug ?? workspaceId ?? 'default';
    return `agency:dashboard:${identifier}:${lookbackDays}`;
  }, [workspaceId, workspaceSlug, lookbackDays]);

  const fetcher = useCallback(
    ({ signal } = {}) => fetchAgencyDashboard({ workspaceId, workspaceSlug, lookbackDays, signal }),
    [workspaceId, workspaceSlug, lookbackDays],
  );

  return useCachedResource(cacheKey, fetcher, {
    enabled,
    dependencies: [workspaceId, workspaceSlug, lookbackDays],
    ttl: 1000 * 45,
  });
}

export default useAgencyDashboard;
