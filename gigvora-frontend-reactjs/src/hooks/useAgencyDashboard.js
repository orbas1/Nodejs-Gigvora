import { useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchAgencyDashboard } from '../services/agency.js';

function buildCacheKey(workspaceId, workspaceSlug, lookbackDays) {
  const identifier = workspaceSlug ?? workspaceId ?? 'default';
  const normalizedLookback = Number.isFinite(Number(lookbackDays)) ? Number(lookbackDays) : '90';
  return `agency:dashboard:${identifier}:${normalizedLookback}`;
}

export function useAgencyDashboard({ workspaceId, workspaceSlug, lookbackDays = 90, enabled = true } = {}) {
  const cacheKey = useMemo(() => buildCacheKey(workspaceId, workspaceSlug, lookbackDays), [
    workspaceId,
    workspaceSlug,
    lookbackDays,
  ]);

  const resource = useCachedResource(
    cacheKey,
    ({ signal, force } = {}) =>
      fetchAgencyDashboard({
        workspaceId,
        workspaceSlug,
        lookbackDays,
        signal,
        fresh: force,
      }),
    {
      enabled,
      ttl: 1000 * 45,
      dependencies: [workspaceId, workspaceSlug, lookbackDays],
    },
  );

  return resource;
}

export default useAgencyDashboard;
