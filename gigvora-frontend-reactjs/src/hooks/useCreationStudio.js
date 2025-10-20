import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchCompanyCreationStudioOverview } from '../services/creationStudio.js';

export function useCreationStudio({ workspaceId, enabled = true } = {}) {
  const cacheKey = useMemo(() => {
    const keyWorkspace = workspaceId ?? 'default';
    return `company:creation-studio:${keyWorkspace}`;
  }, [workspaceId]);

  const fetcher = useCallback(
    ({ signal } = {}) => fetchCompanyCreationStudioOverview({ workspaceId, signal }),
    [workspaceId],
  );

  return useCachedResource(cacheKey, fetcher, {
    enabled,
    dependencies: [workspaceId],
    ttl: 1000 * 45,
  });
}

export default useCreationStudio;
