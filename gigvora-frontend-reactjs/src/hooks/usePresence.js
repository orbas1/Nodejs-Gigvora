import { useCallback, useEffect, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import {
  fetchPresenceSnapshot,
  updatePresenceStatus,
  startFocusSession,
  endFocusSession,
  scheduleAvailabilityWindow,
  refreshCalendarSync,
} from '../services/presence.js';
import { buildPresenceSummary, deriveAvailableStatuses } from '../utils/presence.js';

const CACHE_TTL = 1000 * 30; // 30 seconds

export default function usePresence(memberId, { enabled = true, pollInterval = 45_000 } = {}) {
  const cacheKey = useMemo(() => `presence:${memberId ?? 'unknown'}`, [memberId]);

  const fetcher = useCallback(
    ({ signal } = {}) => {
      if (!memberId) {
        return Promise.resolve(null);
      }
      return fetchPresenceSnapshot(memberId, { signal });
    },
    [memberId],
  );

  const state = useCachedResource(cacheKey, fetcher, {
    ttl: CACHE_TTL,
    enabled: enabled && Boolean(memberId),
    dependencies: [memberId ?? null],
  });

  const summary = useMemo(() => {
    if (!state.data) {
      return null;
    }
    return buildPresenceSummary(state.data);
  }, [state.data]);

  const availableStatuses = useMemo(() => deriveAvailableStatuses(state.data), [state.data]);

  const { refresh } = state;

  useEffect(() => {
    if (!memberId || pollInterval <= 0 || !enabled) {
      return () => {};
    }
    const id = setInterval(() => {
      refresh({ force: true }).catch(() => {});
    }, pollInterval);
    return () => clearInterval(id);
  }, [memberId, pollInterval, enabled, refresh]);

  const setAvailability = useCallback(
    async ({ availability, message, focusUntil, metadata } = {}) => {
      if (!memberId) {
        return null;
      }
      await updatePresenceStatus(memberId, { availability, message, focusUntil, metadata });
      const result = await state.refresh({ force: true });
      return result.data ?? null;
    },
    [memberId, state],
  );

  const startFocus = useCallback(
    async ({ durationMinutes, note, autoMute } = {}) => {
      if (!memberId) {
        return null;
      }
      await startFocusSession(memberId, { durationMinutes, note, autoMute });
      const result = await state.refresh({ force: true });
      return result.data ?? null;
    },
    [memberId, state],
  );

  const endFocus = useCallback(async () => {
    if (!memberId) {
      return null;
    }
    await endFocusSession(memberId);
    const result = await state.refresh({ force: true });
    return result.data ?? null;
  }, [memberId, state]);

  const scheduleAvailability = useCallback(
    async (payload = {}) => {
      if (!memberId) {
        return null;
      }
      await scheduleAvailabilityWindow(memberId, payload);
      const result = await state.refresh({ force: true });
      return result.data ?? null;
    },
    [memberId, state],
  );

  const triggerCalendarRefresh = useCallback(async () => {
    if (!memberId) {
      return null;
    }
    await refreshCalendarSync(memberId);
    const result = await state.refresh({ force: true });
    return result.data ?? null;
  }, [memberId, state]);

  return {
    ...state,
    summary,
    availableStatuses,
    setAvailability,
    startFocus,
    endFocus,
    scheduleAvailability,
    triggerCalendarRefresh,
  };
}
