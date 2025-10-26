import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import {
  fetchHuddleContext,
  fetchRecommendedParticipants,
  createHuddle,
  requestInstantHuddle,
  scheduleHuddle,
} from '../services/huddles.js';

const CONTEXT_TTL = 1000 * 60; // 1 minute cache

export default function useHuddleLauncher({ workspaceId, projectId, enabled = true } = {}) {
  const cacheKey = useMemo(() => `huddle:context:${workspaceId ?? 'global'}:${projectId ?? 'general'}`, [workspaceId, projectId]);

  const contextFetcher = useCallback(
    ({ signal } = {}) => {
      if (!enabled) {
        return Promise.resolve(null);
      }
      return fetchHuddleContext({ workspaceId, projectId, signal });
    },
    [enabled, workspaceId, projectId],
  );

  const participantsFetcher = useCallback(
    ({ signal } = {}) => {
      if (!enabled) {
        return Promise.resolve({ participants: [] });
      }
      return fetchRecommendedParticipants({ workspaceId, projectId, signal });
    },
    [enabled, workspaceId, projectId],
  );

  const context = useCachedResource(cacheKey, contextFetcher, {
    ttl: CONTEXT_TTL,
    enabled,
    dependencies: [workspaceId ?? null, projectId ?? null],
  });

  const participants = useCachedResource(`${cacheKey}:participants`, participantsFetcher, {
    ttl: 1000 * 30,
    enabled,
    dependencies: [workspaceId ?? null, projectId ?? null],
  });

  const launchNow = useCallback(
    async (payload = {}) => {
      const response = await requestInstantHuddle({ workspaceId, projectId, ...payload });
      context.refresh({ force: true }).catch(() => {});
      participants.refresh({ force: true }).catch(() => {});
      return response;
    },
    [workspaceId, projectId, context, participants],
  );

  const schedule = useCallback(
    async ({ startsAt, durationMinutes, agenda, attendeeIds = [], notes, recordMeeting = false, followUpRoomId } = {}) => {
      const created = await createHuddle({
        workspaceId,
        projectId,
        agenda,
        attendeeIds,
        notes,
        recordMeeting,
        followUpRoomId,
      });
      if (startsAt || durationMinutes) {
        await scheduleHuddle(created?.id, { startsAt, durationMinutes });
      }
      context.refresh({ force: true }).catch(() => {});
      participants.refresh({ force: true }).catch(() => {});
      return created;
    },
    [workspaceId, projectId, context, participants],
  );

  const recommendedParticipants = useMemo(() => {
    if (!participants.data?.participants) {
      return [];
    }
    return participants.data.participants;
  }, [participants.data?.participants]);

  return {
    context,
    participants,
    recommendedParticipants,
    launchNow,
    schedule,
  };
}
