import { useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchFeedInsights } from '../services/feedInsights.js';
import {
  generateConnectionSuggestions,
  generateGroupSuggestions,
  generateLiveMoments,
  resolveUserInterests,
} from '../services/engagementService.js';

const FIVE_MINUTES = 1000 * 60 * 5;

export default function useEngagementSignals({ session, feedPosts = [], limit = 6, enabled = true } = {}) {
  const viewerId = session?.id ?? session?.userId ?? null;
  const cacheKey = useMemo(() => {
    const scope = viewerId ? `viewer:${viewerId}` : 'viewer:anonymous';
    return `feed:insights:${scope}:limit:${limit}`;
  }, [viewerId, limit]);

  const fallback = useMemo(() => {
    const fallbackInterests = resolveUserInterests(session, { feedPosts });
    return {
      interests: fallbackInterests,
      connectionSuggestions: generateConnectionSuggestions({
        session,
        feedPosts,
        limit,
        interests: fallbackInterests,
      }),
      groupSuggestions: generateGroupSuggestions({
        session,
        feedPosts,
        limit: Math.max(3, Math.floor(limit / 2)),
        interests: fallbackInterests,
      }),
      liveMoments: generateLiveMoments({ feedPosts, limit: Math.max(4, Math.floor(limit * 0.75)) }),
    };
  }, [session, feedPosts, limit]);

  const { data, error, loading, fromCache, lastUpdated, refresh } = useCachedResource(
    cacheKey,
    ({ signal }) => fetchFeedInsights({ limit, signal, viewerId }),
    {
      ttl: FIVE_MINUTES,
      dependencies: [viewerId, limit],
      enabled,
    },
  );

  const insights = data && typeof data === 'object' && !Array.isArray(data) ? data : null;

  const normalisedInsights = useMemo(() => {
    if (!insights) {
      return null;
    }

    const ensureArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

    return {
      interests: ensureArray(insights.interests),
      connectionSuggestions: ensureArray(insights.connectionSuggestions),
      groupSuggestions: ensureArray(insights.groupSuggestions),
      liveMoments: ensureArray(insights.liveMoments),
    };
  }, [insights]);

  const usingFallback = Boolean(error) || (!normalisedInsights && !loading);

  const interests = usingFallback ? fallback.interests : normalisedInsights.interests;
  const connectionSuggestions = usingFallback
    ? fallback.connectionSuggestions
    : normalisedInsights.connectionSuggestions;
  const groupSuggestions = usingFallback
    ? fallback.groupSuggestions
    : normalisedInsights.groupSuggestions;
  const liveMoments = usingFallback ? fallback.liveMoments : normalisedInsights.liveMoments;

  return {
    interests,
    connectionSuggestions,
    groupSuggestions,
    liveMoments,
    loading,
    error,
    fromCache,
    lastUpdated,
    refresh,
    usingFallback,
  };
}
