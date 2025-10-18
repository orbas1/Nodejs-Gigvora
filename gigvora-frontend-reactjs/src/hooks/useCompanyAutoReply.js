import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchAutoReplyOverview } from '../services/companyAutoReply.js';

export function useCompanyAutoReply({ workspaceId, enabled = true } = {}) {
  const cacheKey = useMemo(() => `company:auto-reply:${workspaceId ?? 'default'}`, [workspaceId]);

  const fetcher = useCallback(
    ({ signal } = {}) => fetchAutoReplyOverview({ workspaceId, signal }),
    [workspaceId],
  );

  return useCachedResource(cacheKey, fetcher, {
    enabled,
    dependencies: [workspaceId],
    ttl: 1000 * 30,
  });
}

export default useCompanyAutoReply;
