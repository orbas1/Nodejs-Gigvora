import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import projectsService from '../services/projects.js';

export function useProjectWorkspace({ projectId, enabled = true } = {}) {
  const cacheKey = useMemo(() => {
    if (!projectId) return null;
    return `projects:workspace:${projectId}`;
  }, [projectId]);

  const fetcher = useCallback(
    ({ signal } = {}) => {
      if (!projectId) {
        return null;
      }
      return projectsService.fetchProjectWorkspace(projectId, { signal });
    },
    [projectId],
  );

  const state = useCachedResource(cacheKey ?? 'projects:workspace:none', fetcher, {
    enabled: Boolean(enabled && projectId),
    dependencies: [projectId],
    ttl: 1000 * 45,
  });

  return state;
}

export default useProjectWorkspace;
