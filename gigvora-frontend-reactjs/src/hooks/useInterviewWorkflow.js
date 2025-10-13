import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchInterviewWorkflow } from '../services/interviews.js';

export function useInterviewWorkflow({ workspaceId, enabled = true } = {}) {
  const cacheKey = useMemo(() => {
    if (!workspaceId) return null;
    return `interviews:workflow:${workspaceId}`;
  }, [workspaceId]);

  const fetcher = useCallback(
    ({ signal } = {}) => {
      if (!workspaceId) {
        return null;
      }
      return fetchInterviewWorkflow(workspaceId, { signal });
    },
    [workspaceId],
  );

  const state = useCachedResource(cacheKey ?? 'interviews:workflow:none', fetcher, {
    enabled: Boolean(enabled && workspaceId),
    dependencies: [workspaceId],
    ttl: 1000 * 45,
  });

  return state;
}

export default useInterviewWorkflow;
