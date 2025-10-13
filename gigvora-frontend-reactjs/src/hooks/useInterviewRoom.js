import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchInterviewRoom } from '../services/interviews.js';

export function useInterviewRoom({ roomId, enabled = true } = {}) {
  const cacheKey = useMemo(() => {
    if (!roomId) return null;
    return `interviews:room:${roomId}`;
  }, [roomId]);

  const fetcher = useCallback(
    ({ signal } = {}) => {
      if (!roomId) {
        return null;
      }
      return fetchInterviewRoom(roomId, { signal });
    },
    [roomId],
  );

  const state = useCachedResource(cacheKey ?? 'interviews:room:none', fetcher, {
    enabled: Boolean(enabled && roomId),
    dependencies: [roomId],
    ttl: 1000 * 30,
  });

  return state;
}

export default useInterviewRoom;
