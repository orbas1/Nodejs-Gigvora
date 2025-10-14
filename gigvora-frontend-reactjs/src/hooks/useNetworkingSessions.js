import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import {
  listNetworkingSessions,
  getNetworkingSessionRuntime,
} from '../services/networking.js';

function buildCacheKey({ companyId, lookbackDays }) {
  const id = companyId ?? 'default';
  return `networking:sessions:${id}:${lookbackDays}`;
}

export function useNetworkingSessions({ companyId, lookbackDays = 90, enabled = true } = {}) {
  const cacheKey = useMemo(() => buildCacheKey({ companyId, lookbackDays }), [companyId, lookbackDays]);

  const fetcher = useCallback(
    ({ signal } = {}) =>
      listNetworkingSessions({
        companyId,
        lookbackDays,
        includeMetrics: true,
        signal,
      }),
    [companyId, lookbackDays],
  );

  return useCachedResource(cacheKey, fetcher, {
    enabled,
    dependencies: [companyId, lookbackDays],
    ttl: 1000 * 45,
  });
}

export function useNetworkingSessionRuntime(sessionId, { enabled = true } = {}) {
  const cacheKey = useMemo(() => `networking:runtime:${sessionId}`, [sessionId]);
  const fetcher = useCallback(
    ({ signal } = {}) => {
      if (!sessionId) {
        return Promise.resolve(null);
      }
      return getNetworkingSessionRuntime(sessionId, { signal });
    },
    [sessionId],
  );

  return useCachedResource(cacheKey, fetcher, {
    enabled: enabled && Boolean(sessionId),
    dependencies: [sessionId],
    ttl: 15 * 1000,
  });
}

export default useNetworkingSessions;
