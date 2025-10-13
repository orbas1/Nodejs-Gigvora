import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { listGroups, getGroupProfile } from '../services/groups.js';

export function useGroupDirectory({ query = '', focus, includeEmpty = false, enabled = true } = {}) {
  const trimmedQuery = query.trim();
  const cacheKey = useMemo(
    () => `groups:directory:${focus ?? 'all'}:${trimmedQuery.toLowerCase()}:${includeEmpty}`,
    [focus, trimmedQuery, includeEmpty],
  );

  const fetcher = useCallback(
    ({ signal } = {}) =>
      listGroups({
        query: trimmedQuery,
        focus,
        includeEmpty,
        signal,
      }),
    [trimmedQuery, focus, includeEmpty],
  );

  return useCachedResource(cacheKey, fetcher, {
    enabled,
    dependencies: [trimmedQuery, focus, includeEmpty],
    ttl: 60 * 1000,
  });
}

export function useGroupProfile(groupSlugOrId, { enabled = true } = {}) {
  const cacheKey = useMemo(() => `groups:profile:${groupSlugOrId ?? 'unknown'}`, [groupSlugOrId]);

  const fetcher = useCallback(
    ({ signal } = {}) => {
      if (!groupSlugOrId) {
        return Promise.resolve(null);
      }
      return getGroupProfile(groupSlugOrId, { signal });
    },
    [groupSlugOrId],
  );

  return useCachedResource(cacheKey, fetcher, {
    enabled: enabled && Boolean(groupSlugOrId),
    dependencies: [groupSlugOrId],
    ttl: 60 * 1000,
  });
}

export default {
  useGroupDirectory,
  useGroupProfile,
};
