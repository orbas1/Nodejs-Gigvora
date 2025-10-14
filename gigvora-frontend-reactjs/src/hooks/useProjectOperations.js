import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchProjectOperations } from '../services/projectOperations.js';

export function useProjectOperations({ projectId, enabled = true } = {}) {
  const cacheKey = useMemo(() => {
    if (!projectId) return null;
    return `projects:operations:${projectId}`;
  }, [projectId]);

  const fetcher = useCallback(
    ({ signal } = {}) => {
      if (!projectId) {
        return null;
      }
      return fetchProjectOperations(projectId, { signal });
    },
    [projectId],
  );

  const state = useCachedResource(cacheKey ?? 'projects:operations:none', fetcher, {
    enabled: Boolean(enabled && projectId),
    dependencies: [projectId],
    ttl: 1000 * 30,
  });

  return state;
}

export default useProjectOperations;
