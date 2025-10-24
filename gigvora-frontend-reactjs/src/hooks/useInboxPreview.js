import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSession from './useSession.js';
import { fetchInbox } from '../services/messaging.js';
import { buildThreadTitle, describeLastActivity } from '../utils/messaging.js';
import { resolveActorId } from '../utils/session.js';

function normaliseThreads(data, actorId) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((thread) => {
      if (!thread?.id) {
        return null;
      }
      const title = buildThreadTitle(thread, actorId);
      const snippet = thread.lastMessagePreview || thread.supportSummary || describeLastActivity(thread);
      const updatedAt = thread.lastMessageAt || thread.updatedAt || thread.createdAt || new Date().toISOString();
      const unreadCount = Number.isFinite(Number(thread.unreadCount)) ? Number(thread.unreadCount) : 0;
      return {
        id: thread.id,
        title,
        snippet,
        updatedAt,
        unreadCount,
      };
    })
    .filter(Boolean);
}

export default function useInboxPreview({
  limit = 3,
  pollInterval = 60_000,
  session: sessionOverride,
  isAuthenticated: authenticatedOverride,
} = {}) {
  const sessionContext = useSession();
  const session = sessionOverride ?? sessionContext.session;
  const isAuthenticated =
    typeof authenticatedOverride === 'boolean' ? authenticatedOverride : sessionContext.isAuthenticated;
  const actorId = resolveActorId(session);

  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  const loadThreads = useCallback(
    async ({ silent = false } = {}) => {
      if (!isAuthenticated || !actorId) {
        setThreads([]);
        setError('');
        return;
      }

      if (!silent) {
        setLoading(true);
        setError('');
      }

      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      abortRef.current = controller;

      try {
        const response = await fetchInbox({
          userId: actorId,
          includeParticipants: true,
          includeSupport: true,
          pageSize: limit,
          signal: controller?.signal,
        });
        const payload = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.threads)
            ? response.data.threads
            : [];
        setThreads(normaliseThreads(payload.slice(0, limit), actorId));
      } catch (err) {
        if (err?.name === 'AbortError') {
          return;
        }
        setError(err?.body?.message ?? err?.message ?? 'Unable to load inbox previews right now.');
      } finally {
        if (!silent) {
          setLoading(false);
        }
        abortRef.current = null;
      }
    },
    [actorId, isAuthenticated, limit],
  );

  const refresh = useCallback(() => {
    loadThreads({ silent: false });
  }, [loadThreads]);

  useEffect(() => {
    if (!isAuthenticated || !actorId) {
      setThreads([]);
      setError('');
      return undefined;
    }

    let mounted = true;
    let timer;

    loadThreads();

    if (pollInterval > 0) {
      timer = window.setInterval(() => {
        if (mounted) {
          loadThreads({ silent: true });
        }
      }, pollInterval);
    }

    return () => {
      mounted = false;
      if (timer) {
        window.clearInterval(timer);
      }
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [actorId, isAuthenticated, loadThreads, pollInterval]);

  const state = useMemo(
    () => ({
      threads,
      loading,
      error,
      refresh,
    }),
    [threads, loading, error, refresh],
  );

  return state;
}
