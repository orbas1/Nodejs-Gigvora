import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchMentoringDashboard,
  createMentoringSession,
  updateMentoringSession,
  recordMentorshipPurchase,
  updateMentorshipPurchase,
  addFavouriteMentor,
  removeFavouriteMentor,
  refreshMentorRecommendations,
} from '../services/userMentoring.js';
import { buildMentorLookupFromWorkspace } from '../utils/mentoring.js';

function normaliseUserId(userId) {
  if (!userId) return null;
  const parsed = Number.parseInt(userId, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default function useFreelancerMentoring({ userId, enabled = true, fetchOnMount = true } = {}) {
  const normalisedUserId = useMemo(() => normaliseUserId(userId), [userId]);
  const [state, setState] = useState({ data: null, loading: false, error: null });
  const [pending, setPending] = useState(false);
  const abortRef = useRef(null);

  const refresh = useCallback(
    async ({ fresh = false } = {}) => {
      if (!enabled || !normalisedUserId) {
        return null;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState((previous) => ({ ...previous, loading: true, error: null }));

      try {
        const data = await fetchMentoringDashboard(normalisedUserId, {
          signal: controller.signal,
          fresh,
        });
        setState({ data, loading: false, error: null });
        return data;
      } catch (error) {
        if (controller.signal.aborted) {
          return null;
        }
        setState({ data: null, loading: false, error: error instanceof Error ? error : new Error('Unable to load mentoring data.') });
        return null;
      }
    },
    [enabled, normalisedUserId],
  );

  useEffect(() => {
    if (!fetchOnMount) {
      return () => abortRef.current?.abort();
    }
    refresh();
    return () => abortRef.current?.abort();
  }, [fetchOnMount, refresh]);

  const runMutation = useCallback(
    async (callback, { refreshAfter = true } = {}) => {
      if (!normalisedUserId) {
        throw new Error('A freelancer context is required to manage mentoring.');
      }
      setPending(true);
      try {
        const result = await callback(normalisedUserId);
        if (refreshAfter) {
          await refresh({ fresh: true });
        }
        return result;
      } finally {
        setPending(false);
      }
    },
    [normalisedUserId, refresh],
  );

  const handleCreateSession = useCallback(
    (payload) => runMutation((id) => createMentoringSession(id, payload)),
    [runMutation],
  );

  const handleUpdateSession = useCallback(
    (sessionId, payload) => runMutation((id) => updateMentoringSession(id, sessionId, payload)),
    [runMutation],
  );

  const handleRecordPurchase = useCallback(
    (payload) => runMutation((id) => recordMentorshipPurchase(id, payload)),
    [runMutation],
  );

  const handleUpdatePurchase = useCallback(
    (orderId, payload) => runMutation((id) => updateMentorshipPurchase(id, orderId, payload)),
    [runMutation],
  );

  const handleAddFavourite = useCallback(
    (payload) => runMutation((id) => addFavouriteMentor(id, payload)),
    [runMutation],
  );

  const handleRemoveFavourite = useCallback(
    (mentorId) => runMutation((id) => removeFavouriteMentor(id, mentorId), { refreshAfter: true }),
    [runMutation],
  );

  const handleRefreshRecommendations = useCallback(
    () => runMutation((id) => refreshMentorRecommendations(id), { refreshAfter: true }),
    [runMutation],
  );

  const summary = state.data?.summary ?? null;
  const mentorLookup = useMemo(() => buildMentorLookupFromWorkspace(state.data), [state.data]);

  return {
    data: state.data,
    summary,
    mentorLookup,
    loading: state.loading,
    error: state.error,
    pending,
    refresh,
    createSession: handleCreateSession,
    updateSession: handleUpdateSession,
    recordPurchase: handleRecordPurchase,
    updatePurchase: handleUpdatePurchase,
    addFavourite: handleAddFavourite,
    removeFavourite: handleRemoveFavourite,
    refreshRecommendations: handleRefreshRecommendations,
  };
}
