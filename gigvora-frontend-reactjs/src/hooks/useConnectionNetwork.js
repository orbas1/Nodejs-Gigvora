import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchConnectionNetwork } from '../services/connections.js';

export default function useConnectionNetwork({ userId, viewerId, enabled = true } = {}) {
  const cacheKey = useMemo(() => (userId ? `connections:network:${userId}` : null), [userId]);

  const fetcher = useCallback(
    async ({ signal } = {}) => {
      if (!userId) {
        return null;
      }
      return fetchConnectionNetwork({ userId, viewerId, signal });
    },
    [userId, viewerId],
  );

  const state = useCachedResource(cacheKey ?? 'connections:network:none', fetcher, {
    ttl: 1000 * 60 * 5,
    enabled: enabled && Boolean(userId),
  });

  return state;
}
