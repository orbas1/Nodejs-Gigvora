import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchCalendarSyncStatus, triggerCalendarSync } from '../services/calendarSync.js';
import { fetchCalendarEvents } from '../services/userCalendar.js';

const SYNC_TTL = 1000 * 45;

export default function useCalendarSync(userId, { enabled = true, previewLimit = 3 } = {}) {
  const cacheKey = useMemo(() => `calendar-sync:${userId ?? 'anonymous'}`, [userId]);

  const syncFetcher = useCallback(
    ({ signal } = {}) => {
      if (!userId || !enabled) {
        return Promise.resolve(null);
      }
      return fetchCalendarSyncStatus(userId, { signal });
    },
    [userId, enabled],
  );

  const eventsFetcher = useCallback(
    ({ signal } = {}) => {
      if (!userId || !enabled) {
        return Promise.resolve({ events: [] });
      }
      const windowStart = new Date();
      const windowEnd = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);
      return fetchCalendarEvents(
        userId,
        { from: windowStart.toISOString(), to: windowEnd.toISOString(), limit: previewLimit },
        { signal },
      );
    },
    [userId, enabled, previewLimit],
  );

  const status = useCachedResource(cacheKey, syncFetcher, {
    ttl: SYNC_TTL,
    enabled: enabled && Boolean(userId),
    dependencies: [userId ?? null],
  });

  const events = useCachedResource(`${cacheKey}:events`, eventsFetcher, {
    ttl: 1000 * 30,
    enabled: enabled && Boolean(userId),
    dependencies: [userId ?? null, previewLimit],
  });

  const refresh = useCallback(async () => {
    if (!userId) {
      return null;
    }
    await triggerCalendarSync(userId);
    const [syncResult] = await Promise.all([status.refresh({ force: true }), events.refresh({ force: true })]);
    return syncResult.data;
  }, [userId, status, events]);

  const nextEvents = useMemo(() => {
    if (!events.data?.data && !events.data?.events) {
      return [];
    }
    const list = Array.isArray(events.data?.events) ? events.data.events : events.data?.data ?? [];
    return list;
  }, [events.data?.data, events.data?.events]);

  return {
    status,
    events,
    refresh,
    nextEvents,
  };
}
