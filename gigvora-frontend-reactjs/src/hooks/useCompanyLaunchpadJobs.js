import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import {
  fetchLaunchpadJobDashboard,
  createLaunchpadJobLink,
  updateLaunchpadJobLink,
  deleteLaunchpadJobLink,
  createLaunchpadPlacement,
  updateLaunchpadPlacement,
  deleteLaunchpadPlacement,
} from '../services/companyLaunchpadJobs.js';

function buildCacheKey(workspaceId, workspaceSlug, launchpadId, lookbackDays) {
  const workspaceKey = workspaceSlug ?? workspaceId ?? 'default';
  const launchpadKey = launchpadId ?? 'all';
  const lookbackKey = lookbackDays ?? '90';
  return `company:launchpad:${workspaceKey}:${launchpadKey}:${lookbackKey}`;
}

export function useCompanyLaunchpadJobs({ workspaceId, workspaceSlug, launchpadId, lookbackDays = 90, enabled = true } = {}) {
  const cacheKey = useMemo(
    () => buildCacheKey(workspaceId ?? null, workspaceSlug ?? null, launchpadId ?? null, lookbackDays ?? 90),
    [workspaceId, workspaceSlug, launchpadId, lookbackDays],
  );

  const fetcher = useCallback(
    ({ signal } = {}) =>
      fetchLaunchpadJobDashboard({ workspaceId, workspaceSlug, launchpadId, lookbackDays, signal }),
    [workspaceId, workspaceSlug, launchpadId, lookbackDays],
  );

  const resource = useCachedResource(cacheKey, fetcher, {
    enabled,
    dependencies: [workspaceId, workspaceSlug, launchpadId, lookbackDays],
    ttl: 1000 * 45,
  });

  const { refresh, data, ...rest } = resource;
  const resolvedWorkspaceId = workspaceId ?? data?.workspace?.id ?? undefined;

  const withRefresh = useCallback(
    async (operation) => {
      const result = await operation();
      await refresh({ force: true });
      return result;
    },
    [refresh],
  );

  const createLink = useCallback(
    (payload) =>
      withRefresh(() =>
        createLaunchpadJobLink({ ...payload, workspaceId: resolvedWorkspaceId, workspaceSlug }),
      ),
    [withRefresh, resolvedWorkspaceId, workspaceSlug],
  );

  const updateLink = useCallback(
    (linkId, payload) =>
      withRefresh(() =>
        updateLaunchpadJobLink(linkId, { ...payload, workspaceId: resolvedWorkspaceId, workspaceSlug }),
      ),
    [withRefresh, resolvedWorkspaceId, workspaceSlug],
  );

  const removeLink = useCallback(
    (linkId) =>
      withRefresh(() => deleteLaunchpadJobLink(linkId)),
    [withRefresh],
  );

  const createPlacement = useCallback(
    (linkId, payload) =>
      withRefresh(() =>
        createLaunchpadPlacement(linkId, { ...payload, workspaceId: resolvedWorkspaceId, workspaceSlug }),
      ),
    [withRefresh, resolvedWorkspaceId, workspaceSlug],
  );

  const updatePlacement = useCallback(
    (placementId, payload) =>
      withRefresh(() =>
        updateLaunchpadPlacement(placementId, {
          ...payload,
          workspaceId: resolvedWorkspaceId,
          workspaceSlug,
        }),
      ),
    [withRefresh, resolvedWorkspaceId, workspaceSlug],
  );

  const removePlacement = useCallback(
    (placementId) =>
      withRefresh(() => deleteLaunchpadPlacement(placementId)),
    [withRefresh],
  );

  return {
    ...rest,
    data,
    refresh,
    createLink,
    updateLink,
    removeLink,
    createPlacement,
    updatePlacement,
    removePlacement,
  };
}

export default useCompanyLaunchpadJobs;

