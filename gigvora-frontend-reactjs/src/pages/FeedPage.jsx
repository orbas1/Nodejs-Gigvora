import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCachedResource from '../hooks/useCachedResource.js';
import { apiClient } from '../services/apiClient.js';
import {
  listFeedPosts,
  createFeedPost,
  updateFeedPost,
  deleteFeedPost,
  reactToFeedPost,
} from '../services/liveFeed.js';
import analytics from '../services/analytics.js';
import useSession from '../hooks/useSession.js';
import useEngagementSignals from '../hooks/useEngagementSignals.js';
import {
  ContentModerationError,
  moderateFeedComposerPayload,
  sanitiseExternalLink,
} from '../utils/contentModeration.js';
import { ALLOWED_FEED_MEMBERSHIPS, COMPOSER_OPTIONS } from '../constants/feedMeta.js';
import FeedComposer from '../components/userNetworking/timeline/FeedComposer.jsx';
import FeedCard, {
  FeedIdentityRail,
  FeedInsightsRail,
  FeedLoadingSkeletons,
  VirtualFeedChunk,
} from '../components/userNetworking/timeline/FeedCard.jsx';
import ActivityFilters from '../components/userNetworking/timeline/ActivityFilters.jsx';
import {
  DEFAULT_ACTIVITY_FILTERS,
  DEFAULT_CHUNK_ESTIMATE,
  DEFAULT_EDIT_DRAFT,
  DEFAULT_FEED_VIRTUAL_CHUNK_SIZE,
  DEFAULT_VIEWPORT_HEIGHT,
  FEED_PAGE_SIZE,
  FEED_VIRTUAL_MAX_CHUNK_SIZE,
  FEED_VIRTUAL_MIN_CHUNK_SIZE,
  FEED_VIRTUAL_THRESHOLD,
  OPPORTUNITY_POST_TYPES,
  buildFeedQuery,
  createFilterStorageKey,
  derivePostTopics,
  normaliseFeedPost,
  postMatchesFilters,
  serializeFeedQuery,
  sortPostsByPreference,
} from '../components/userNetworking/timeline/feedUtils.js';

export default function FeedPage() {
  const analyticsTrackedRef = useRef(false);
  const navigate = useNavigate();
  const { session, isAuthenticated } = useSession();
  const filtersStorageKey = useMemo(
    () => createFilterStorageKey(session?.id ?? session?.userId ?? null),
    [session?.id, session?.userId],
  );
  const [filtersReady, setFiltersReady] = useState(false);
  const [activeFilters, setActiveFilters] = useState(DEFAULT_ACTIVITY_FILTERS);
  const [savedFilterViews, setSavedFilterViews] = useState([]);
  const [localPosts, setLocalPosts] = useState([]);
  const [remotePosts, setRemotePosts] = useState([]);
  const [remoteSuggestions, setRemoteSuggestions] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingDraft, setEditingDraft] = useState(DEFAULT_EDIT_DRAFT);
  const [editSaving, setEditSaving] = useState(false);
  const [editingError, setEditingError] = useState(null);
  const [removingPostId, setRemovingPostId] = useState(null);
  const [feedActionError, setFeedActionError] = useState(null);
  const [pagination, setPagination] = useState({ nextCursor: null, nextPage: null, hasMore: false });
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(null);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    setFiltersReady(false);
    if (typeof window === 'undefined') {
      setFiltersReady(true);
      setActiveFilters(DEFAULT_ACTIVITY_FILTERS);
      setSavedFilterViews([]);
      return;
    }
    try {
      const raw = window.localStorage.getItem(filtersStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const nextActive = {
          ...DEFAULT_ACTIVITY_FILTERS,
          ...(parsed?.active ?? parsed?.filters ?? {}),
        };
        setActiveFilters(nextActive);
        setSavedFilterViews(Array.isArray(parsed?.saved) ? parsed.saved : []);
      } else {
        setActiveFilters(DEFAULT_ACTIVITY_FILTERS);
        setSavedFilterViews([]);
      }
    } catch (error) {
      setActiveFilters(DEFAULT_ACTIVITY_FILTERS);
      setSavedFilterViews([]);
    } finally {
      setFiltersReady(true);
    }
  }, [filtersStorageKey]);

  useEffect(() => {
    if (!filtersReady || typeof window === 'undefined') {
      return;
    }
    try {
      const payload = {
        active: activeFilters,
        saved: savedFilterViews,
      };
      window.localStorage.setItem(filtersStorageKey, JSON.stringify(payload));
    } catch (error) {
      // ignore persistence failures
    }
  }, [activeFilters, filtersReady, filtersStorageKey, savedFilterViews]);

  const feedQuery = useMemo(() => buildFeedQuery(activeFilters), [activeFilters]);
  const serializedFeedQuery = useMemo(() => serializeFeedQuery(feedQuery), [feedQuery]);

  const { data, error, loading, fromCache, refresh } = useCachedResource(
    `feed:posts:v3:${serializedFeedQuery}`,
    ({ signal }) => listFeedPosts({ signal, params: feedQuery }),
    { ttl: 1000 * 60 * 2, enabled: filtersReady, dependencies: [serializedFeedQuery] },
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!data) {
      if (!loading) {
        setRemotePosts([]);
        setRemoteSuggestions(null);
        setPagination((previous) => ({ ...previous, nextCursor: null, nextPage: null, hasMore: false }));
      }
      return;
    }

    const items = Array.isArray(data.items)
      ? data.items
      : Array.isArray(data.data)
      ? data.data
      : Array.isArray(data.results)
      ? data.results
      : Array.isArray(data.feed)
      ? data.feed
      : Array.isArray(data)
      ? data
      : [];

    const normalisedFetched = items.map((post) => normaliseFeedPost(post, session)).filter(Boolean);
    setRemotePosts(normalisedFetched);
    setRemoteSuggestions(data.suggestions ?? null);
    setPagination({
      nextCursor: data.nextCursor ?? null,
      nextPage: data.nextPage ?? null,
      hasMore: Boolean(data.hasMore),
    });
    setLoadMoreError(null);
  }, [data, loading, session]);

  const allPosts = useMemo(() => {
    const merged = [...localPosts, ...remotePosts];
    const deduped = [];
    const seen = new Set();
    merged.forEach((post) => {
      if (!post) {
        return;
      }
      const identifier = post.id ?? `${post.createdAt}:${deduped.length}`;
      if (seen.has(identifier)) {
        return;
      }
      seen.add(identifier);
      deduped.push(post);
    });
    return deduped;
  }, [localPosts, remotePosts]);

  const filteredPosts = useMemo(() => {
    const base = allPosts.filter((post) => postMatchesFilters(post, activeFilters));
    return sortPostsByPreference(base, activeFilters);
  }, [activeFilters, allPosts]);

  const virtualizationEnabled = filteredPosts.length > FEED_VIRTUAL_THRESHOLD;
  const [virtualChunkSize, setVirtualChunkSize] = useState(DEFAULT_FEED_VIRTUAL_CHUNK_SIZE);

  const trendingTopics = useMemo(() => {
    const counts = new Map();
    allPosts.forEach((post) => {
      derivePostTopics(post).forEach((topic) => {
        if (!topic) {
          return;
        }
        counts.set(topic, (counts.get(topic) ?? 0) + 1);
      });
    });
    const blocked = new Set(['update', 'updates', 'post', 'posts', 'feed', 'timeline', 'news']);
    return Array.from(counts.entries())
      .filter(([, count]) => count > 0)
      .filter(([topic]) => !blocked.has(topic))
      .sort((a, b) => b[1] - a[1])
      .map(([topic]) => topic)
      .slice(0, 8);
  }, [allPosts]);

  const trendingHashtags = useMemo(
    () =>
      trendingTopics.map((topic) => {
        const cleaned = topic.startsWith('#') ? topic.slice(1) : topic;
        return `#${cleaned.replace(/_/g, '')}`;
      }),
    [trendingTopics],
  );

  const handleFiltersChange = useCallback(
    (next) => {
      setActiveFilters((previous) => ({ ...previous, ...next }));
    },
    [],
  );

  const handleResetFilters = useCallback(() => {
    setActiveFilters(DEFAULT_ACTIVITY_FILTERS);
  }, []);

  const handleSaveView = useCallback(
    (name) => {
      const trimmed = (name || '').trim();
      const viewId = `view-${Date.now()}`;
      const view = {
        id: viewId,
        name: trimmed || `Saved view ${savedFilterViews.length + 1}`,
        filters: { ...activeFilters, savedViewId: null },
      };
      setSavedFilterViews((previous) => [view, ...previous]);
      setActiveFilters((previous) => ({ ...previous, savedViewId: viewId }));
    },
    [activeFilters, savedFilterViews.length],
  );

  const handleSelectSavedView = useCallback(
    (viewId) => {
      if (!viewId) {
        setActiveFilters((previous) => ({ ...previous, savedViewId: null }));
        return;
      }
      const target = savedFilterViews.find((view) => view.id === viewId);
      if (target) {
        setActiveFilters({ ...target.filters, savedViewId: target.id });
      } else {
        setActiveFilters((previous) => ({ ...previous, savedViewId: null }));
      }
    },
    [savedFilterViews],
  );

  const handleDeleteSavedView = useCallback((viewId) => {
    if (!viewId) {
      return;
    }
    setSavedFilterViews((previous) => previous.filter((view) => view.id !== viewId));
    setActiveFilters((previous) => {
      if (previous.savedViewId === viewId) {
        return { ...previous, savedViewId: null };
      }
      return previous;
    });
  }, []);

  const feedChunks = useMemo(() => {
    if (!filteredPosts.length) {
      return [];
    }
    const chunkSize = virtualizationEnabled
      ? Math.min(
          filteredPosts.length,
          Math.max(FEED_VIRTUAL_MIN_CHUNK_SIZE, Math.min(FEED_VIRTUAL_MAX_CHUNK_SIZE, virtualChunkSize)),
        )
      : filteredPosts.length;
    const chunks = [];
    for (let index = 0; index < filteredPosts.length; index += chunkSize) {
      chunks.push({
        startIndex: index,
        posts: filteredPosts.slice(index, index + chunkSize),
      });
    }
    return chunks;
  }, [filteredPosts, virtualChunkSize, virtualizationEnabled]);

  const [chunkHeights, setChunkHeights] = useState({});

  const averageChunkHeight = useMemo(() => {
    const values = Object.values(chunkHeights).filter((value) => Number.isFinite(value) && value > 0);
    if (!values.length) {
      return DEFAULT_CHUNK_ESTIMATE;
    }
    const total = values.reduce((sum, value) => sum + value, 0);
    const average = total / values.length;
    return Math.min(720, Math.max(280, average));
  }, [chunkHeights]);

  useEffect(() => {
    if (!virtualizationEnabled) {
      setVirtualChunkSize(DEFAULT_FEED_VIRTUAL_CHUNK_SIZE);
      return undefined;
    }

    const resolveViewportHeight = () => {
      if (typeof window === 'undefined' || !Number.isFinite(window.innerHeight)) {
        return DEFAULT_VIEWPORT_HEIGHT;
      }
      return Math.max(640, window.innerHeight);
    };

    const updateChunkSize = () => {
      const viewportHeight = resolveViewportHeight();
      const estimatedHeight = Number.isFinite(averageChunkHeight)
        ? averageChunkHeight
        : DEFAULT_CHUNK_ESTIMATE;
      const proposedSize = Math.round(viewportHeight / estimatedHeight) + 1;
      const nextSize = Math.max(
        FEED_VIRTUAL_MIN_CHUNK_SIZE,
        Math.min(FEED_VIRTUAL_MAX_CHUNK_SIZE, proposedSize),
      );
      setVirtualChunkSize((previous) => (previous === nextSize ? previous : nextSize));
    };

    updateChunkSize();

    if (typeof window === 'undefined') {
      return undefined;
    }

    window.addEventListener('resize', updateChunkSize);
    return () => window.removeEventListener('resize', updateChunkSize);
  }, [averageChunkHeight, virtualizationEnabled]);

  useEffect(() => {
    if (!virtualizationEnabled) {
      setChunkHeights({});
      return;
    }
    setChunkHeights((previous) => {
      const next = {};
      feedChunks.forEach((_, index) => {
        if (previous[index]) {
          next[index] = previous[index];
        }
      });
      return next;
    });
  }, [feedChunks, virtualizationEnabled]);

  const updateChunkHeight = useCallback(
    (index, height) => {
      if (!virtualizationEnabled || !Number.isFinite(height)) {
        return;
      }
      setChunkHeights((previous) => {
        const current = previous[index];
        if (current && Math.abs(current - height) < 4) {
          return previous;
        }
        return { ...previous, [index]: height };
      });
    },
    [virtualizationEnabled],
  );

  const forcedChunkIndices = useMemo(() => {
    if (!virtualizationEnabled) {
      return new Set();
    }
    const forced = new Set([0]);
    if (editingPostId) {
      const editingIndex = feedChunks.findIndex((chunk) =>
        chunk.posts.some((post) => post.id === editingPostId),
      );
      if (editingIndex >= 0) {
        forced.add(editingIndex);
      }
    }
    return forced;
  }, [virtualizationEnabled, feedChunks, editingPostId]);

  const fetchNextPage = useCallback(async () => {
    if (loadingMore || !pagination.hasMore) {
      return;
    }
    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const params = { ...feedQuery };
      params.limit = params.limit ?? FEED_PAGE_SIZE;
      if (pagination.nextCursor) {
        params.cursor = pagination.nextCursor;
      }
      if (pagination.nextPage != null) {
        params.page = pagination.nextPage;
      }
      const response = await listFeedPosts({ params });
      const items = Array.isArray(response.items)
        ? response.items
        : Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.results)
        ? response.results
        : Array.isArray(response.feed)
        ? response.feed
        : Array.isArray(response)
        ? response
        : [];
      const normalised = items.map((post) => normaliseFeedPost(post, session)).filter(Boolean);
      setRemotePosts((previous) => {
        const combined = [...previous, ...normalised];
        const deduped = [];
        const seen = new Set();
        combined.forEach((post) => {
          if (!post) {
            return;
          }
          const identifier = post.id ?? `${post.createdAt}:${deduped.length}`;
          if (identifier && !seen.has(identifier)) {
            seen.add(identifier);
            deduped.push(post);
          }
        });
        return deduped;
      });
      if (response?.suggestions) {
        setRemoteSuggestions(response.suggestions);
      }
      setPagination({
        nextCursor: response.nextCursor ?? null,
        nextPage: response.nextPage ?? null,
        hasMore: Boolean(response.hasMore),
      });
    } catch (loadError) {
      setLoadMoreError(loadError);
    } finally {
      setLoadingMore(false);
    }
  }, [feedQuery, loadingMore, pagination.hasMore, pagination.nextCursor, pagination.nextPage, session]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !pagination.hasMore) {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            fetchNextPage();
          }
        });
      },
      { rootMargin: '200px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, pagination.hasMore]);

  const engagementSignals = useEngagementSignals({ session, feedPosts: filteredPosts, suggestions: remoteSuggestions });
  const {
    interests = [],
    connectionSuggestions = [],
    groupSuggestions = [],
    liveMoments = [],
    generatedAt: suggestionsGeneratedAt = null,
  } = engagementSignals ?? {};

  const membershipList = useMemo(() => {
    const memberships = new Set();
    if (Array.isArray(session?.memberships)) {
      session.memberships.filter(Boolean).forEach((membership) => memberships.add(membership));
    }
    if (Array.isArray(session?.accountTypes)) {
      session.accountTypes.filter(Boolean).forEach((membership) => memberships.add(membership));
    }
    if (session?.primaryMembership) {
      memberships.add(session.primaryMembership);
    }
    if (session?.primaryDashboard) {
      memberships.add(session.primaryDashboard);
    }
    if (session?.userType) {
      memberships.add(session.userType);
    }
    return Array.from(memberships);
  }, [session]);

  const sessionIdentifier = useMemo(() => session?.userId ?? session?.id ?? null, [session?.id, session?.userId]);

  const isAdminUser = useMemo(
    () => membershipList.some((membership) => `${membership}`.toLowerCase() === 'admin'),
    [membershipList],
  );

  const canManagePost = useCallback(
    (post) => {
      if (!post) {
        return false;
      }
      if (isAdminUser) {
        return true;
      }
      if (!sessionIdentifier) {
        return false;
      }
      const authorId =
        post?.User?.id ??
        post?.userId ??
        post?.authorId ??
        post?.author?.id ??
        post?.User?.userId ??
        null;
      if (authorId == null) {
        return false;
      }
      return String(authorId) === String(sessionIdentifier);
    },
    [isAdminUser, sessionIdentifier],
  );

  const hasFeedAccess = useMemo(
    () => membershipList.some((membership) => ALLOWED_FEED_MEMBERSHIPS.has(`${membership}`.toLowerCase())),
    [membershipList],
  );

  useEffect(() => {
    if (!analyticsTrackedRef.current && !loading && filteredPosts.length) {
      analytics.track('web_feed_viewed', { postCount: filteredPosts.length, cacheHit: fromCache }, { source: 'web_app' });
      analyticsTrackedRef.current = true;
    }
  }, [filteredPosts.length, filteredPosts, loading, fromCache]);

  const handleShareClick = useCallback(() => {
    analytics.track('web_feed_share_click', { location: 'feed_page' }, { source: 'web_app' });
  }, []);

  const trackOpportunityTelemetry = useCallback(
    (phase, payload) => {
      if (!payload?.type || !OPPORTUNITY_POST_TYPES.has(payload.type)) {
        return;
      }
      analytics.track(
        'web_feed_opportunity_composer',
        {
          phase,
          type: payload.type,
          hasLink: Boolean(payload.link),
          hasMedia: Array.isArray(payload.mediaAttachments) && payload.mediaAttachments.length > 0,
          viewerMembership:
            session?.primaryMembership ??
            session?.primaryDashboard ??
            session?.userType ??
            (Array.isArray(session?.memberships) && session.memberships.length ? session.memberships[0] : 'unknown'),
        },
        { source: 'web_app', userId: session?.id ?? session?.userId ?? undefined },
      );
    },
    [session],
  );

  const handleComposerCreate = useCallback(
    async (payload) => {
      if (!hasFeedAccess) {
        throw new Error('Your current workspace role cannot publish to the timeline. Switch roles to continue.');
      }

      if (!session?.id) {
        throw new Error('We could not confirm your account. Please sign in again and retry.');
      }

      const optimisticId = `local-${Date.now()}`;
      const author = {
        name: session?.name ?? 'You',
        headline: session?.title ?? 'Shared via Gigvora',
        avatarSeed: session?.avatarSeed ?? session?.name ?? 'You',
      };
      const optimisticPost = {
        id: optimisticId,
        content: payload.content,
        summary: payload.content,
        type: payload.type,
        link: payload.link,
        createdAt: new Date().toISOString(),
        authorName: author.name,
        authorHeadline: author.headline,
        reactions: { likes: 0 },
        comments: [],
        mediaAttachments: payload.mediaAttachments ?? [],
        hashtags: Array.isArray(payload.hashtags) ? payload.hashtags : [],
        visibility: payload.visibility ?? 'connections',
        scheduledFor: payload.scheduledFor ?? null,
        User: {
          firstName: session?.name,
          Profile: {
            avatarSeed: session?.avatarSeed,
            headline: session?.title,
          },
        },
      };

      setLocalPosts((previous) => [optimisticPost, ...previous]);
      analytics.track('web_feed_post_created', { type: payload.type, optimistic: true }, { source: 'web_app' });
      trackOpportunityTelemetry('submitted', payload);

      try {
        const requestPayload = {
          userId: session.id,
          content: payload.content,
          visibility: payload.visibility ?? 'public',
          type: payload.type,
          link: payload.link,
          mediaAttachments: payload.mediaAttachments,
        };
        if (Array.isArray(payload.hashtags) && payload.hashtags.length) {
          requestPayload.hashtags = payload.hashtags;
        }
        if (payload.shareToDigest) {
          requestPayload.shareToDigest = true;
        }
        if (payload.scheduledFor) {
          requestPayload.scheduledFor = payload.scheduledFor;
          requestPayload.scheduleMode = payload.scheduleMode ?? 'schedule';
        }
        const metadata = {
          promptId: payload.promptId ?? null,
          composerPersona: payload.composerPersona ?? null,
        };
        if (metadata.promptId || metadata.composerPersona) {
          requestPayload.metadata = metadata;
        }

        const response = await createFeedPost(requestPayload, {
          headers: { 'X-Feature-Surface': 'web-feed-composer' },
        });

        const normalised = normaliseFeedPost(response, session);

        if (normalised) {
          setLocalPosts((previous) =>
            previous.map((post) => {
              if (post.id !== optimisticId) {
                return post;
              }
              return {
                ...post,
                ...normalised,
                id: normalised.id ?? optimisticId,
                createdAt: normalised.createdAt ?? post.createdAt,
                mediaAttachments: normalised.mediaAttachments?.length
                  ? normalised.mediaAttachments
                  : post.mediaAttachments,
                reactions: normalised.reactions ?? post.reactions,
              };
            }),
          );
        }

        analytics.track(
          'web_feed_post_synced',
          { type: payload.type, visibility: payload.visibility ?? 'public', scheduled: Boolean(payload.scheduledFor) },
          { source: 'web_app' },
        );
        await refresh({ force: true });
        trackOpportunityTelemetry('synced', payload);
      } catch (composerError) {
        setLocalPosts((previous) => previous.filter((post) => post.id !== optimisticId));
        analytics.track(
          'web_feed_post_failed',
          {
            type: payload.type,
            status:
              composerError instanceof apiClient.ApiError ? composerError.status ?? 'api_error' : 'unknown_error',
          },
          { source: 'web_app' },
        );
        trackOpportunityTelemetry('failed', payload);

        if (composerError instanceof ContentModerationError) {
          throw composerError;
        }

        if (composerError instanceof apiClient.ApiError) {
          if (
            composerError.status === 422 &&
            Array.isArray(composerError.body?.details?.reasons) &&
            composerError.body.details.reasons.length
          ) {
            throw new ContentModerationError(
              composerError.body?.message || 'The timeline service rejected your update.',
              {
                reasons: composerError.body.details.reasons,
                signals: composerError.body.details.signals ?? [],
              },
            );
          }

          throw new Error(
            composerError.body?.message || 'The timeline service rejected your update. Please try again.',
          );
        }

        throw new Error('We were unable to reach the timeline service. Check your connection and retry.');
      }
    },
    [hasFeedAccess, session, refresh],
  );

  const handleEditStart = useCallback(
    (post) => {
      if (!post) {
        return;
      }
      if (!canManagePost(post)) {
        setFeedActionError('You can only edit posts that belong to your workspace.');
        return;
      }
      setEditingPostId(post.id);
      setEditingDraft({
        title: post.title ?? '',
        content: post.content ?? post.summary ?? '',
        link: post.link ?? '',
        type: post.type ?? post.category ?? 'update',
      });
      setEditingError(null);
      setFeedActionError(null);
    },
    [canManagePost],
  );

  const handleEditCancel = useCallback(() => {
    setEditingPostId(null);
    setEditingDraft(DEFAULT_EDIT_DRAFT);
    setEditingError(null);
  }, []);

  const handleEditDraftChange = useCallback((field, value) => {
    setEditingDraft((draft) => ({ ...draft, [field]: value }));
  }, []);

  const handleEditSubmit = useCallback(
    async (event, post) => {
      event.preventDefault();
      if (!post?.id || editingPostId !== post.id) {
        return;
      }
      if (!canManagePost(post)) {
        setFeedActionError('You can only update posts that you created or manage.');
        return;
      }

      const trimmedContent = (editingDraft.content ?? '').trim();
      if (!trimmedContent) {
        setEditingError('Share a few more details before saving this update.');
        return;
      }

      const preparedLink = editingDraft.link ? sanitiseExternalLink(editingDraft.link) : null;
      const payload = {
        content: trimmedContent,
        summary: trimmedContent,
        title: editingDraft.title?.trim() || undefined,
        link: preparedLink || undefined,
        type: (editingDraft.type || 'update').toLowerCase(),
      };

      try {
        setEditSaving(true);
        setEditingError(null);
        setFeedActionError(null);
        moderateFeedComposerPayload({ ...payload, mediaAttachments: [] });
        const response = await updateFeedPost(post.id, payload, {
          headers: { 'X-Feature-Surface': 'web-feed-editor' },
        });
        const normalised = normaliseFeedPost(response, session);
        if (normalised) {
          setLocalPosts((previous) => previous.filter((existing) => existing.id !== normalised.id));
        }
        analytics.track('web_feed_post_updated', { postId: post.id, type: payload.type }, { source: 'web_app' });
        await refresh({ force: true });
        setLocalPosts((previous) => previous.filter((existing) => `${existing.id}`.startsWith('local-')));
        setEditingPostId(null);
        setEditingDraft(DEFAULT_EDIT_DRAFT);
      } catch (submitError) {
        const message =
          submitError instanceof ContentModerationError
            ? submitError.message
            : submitError instanceof apiClient.ApiError
            ? submitError.body?.message ?? 'Unable to update the post right now.'
            : submitError?.message ?? 'Unable to update the post right now.';
        setEditingError(message);
        setFeedActionError(message);
      } finally {
        setEditSaving(false);
      }
    },
    [canManagePost, editingDraft, editingPostId, refresh, session],
  );

  const handleDeletePost = useCallback(
    async (post) => {
      if (!post?.id) {
        return;
      }
      if (!canManagePost(post)) {
        setFeedActionError('You can only remove posts that you created or manage.');
        return;
      }
      if (removingPostId) {
        return;
      }
      if (typeof window !== 'undefined' && !window.confirm('Remove this update from the live feed?')) {
        return;
      }
      setRemovingPostId(post.id);
      setFeedActionError(null);
      try {
        await deleteFeedPost(post.id, { headers: { 'X-Feature-Surface': 'web-feed-editor' } });
        setLocalPosts((previous) => previous.filter((existing) => existing.id !== post.id));
        analytics.track('web_feed_post_deleted', { postId: post.id }, { source: 'web_app' });
        await refresh({ force: true });
        if (editingPostId === post.id) {
          setEditingPostId(null);
          setEditingDraft(DEFAULT_EDIT_DRAFT);
        }
      } catch (deleteError) {
        const message =
          deleteError instanceof apiClient.ApiError
            ? deleteError.body?.message ?? 'Unable to remove the post right now.'
            : deleteError?.message ?? 'Unable to remove the post right now.';
        setFeedActionError(message);
      } finally {
        setRemovingPostId(null);
      }
    },
    [canManagePost, editingPostId, refresh, removingPostId],
  );

  const handleReactionChange = useCallback(async (post, { next, previous }) => {
    if (!post?.id) {
      return;
    }
    const operations = [];
    if (previous && (!next || next !== previous)) {
      operations.push(reactToFeedPost(post.id, previous, { active: false }));
    }
    if (next && next !== previous) {
      operations.push(reactToFeedPost(post.id, next, { active: true }));
    }
    if (!operations.length) {
      return;
    }
    try {
      await Promise.all(operations);
    } catch (reactionError) {
      console.warn('Failed to sync reaction', reactionError);
    }
  }, []);

  const renderSkeleton = () => (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <article key={index} className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="h-3 w-32 rounded bg-slate-200" />
            <span className="h-3 w-16 rounded bg-slate-200" />
          </div>
          <div className="mt-4 h-4 w-48 rounded bg-slate-200" />
          <div className="mt-3 space-y-2">
            <div className="h-3 rounded bg-slate-200" />
            <div className="h-3 w-3/4 rounded bg-slate-200" />
            <div className="h-3 w-2/3 rounded bg-slate-200" />
          </div>
        </article>
      ))}
    </div>
  );

  const renderFeedPost = useCallback(
    (post) => (
      <FeedCard
        key={post.id}
        post={post}
        onShare={handleShareClick}
        canManage={canManagePost(post)}
        viewer={session}
        onEditStart={handleEditStart}
        onEditCancel={handleEditCancel}
        onDelete={handleDeletePost}
        isEditing={editingPostId === post.id}
        editDraft={editingPostId === post.id ? editingDraft : DEFAULT_EDIT_DRAFT}
        onEditDraftChange={handleEditDraftChange}
        onEditSubmit={handleEditSubmit}
        editSaving={editSaving}
        editError={editingPostId === post.id ? editingError : null}
        deleteLoading={removingPostId === post.id}
        onReactionChange={handleReactionChange}
      />
    ),
    [
      canManagePost,
      editSaving,
      editingDraft,
      editingError,
      editingPostId,
      handleDeletePost,
      handleEditCancel,
      handleEditDraftChange,
      handleEditStart,
      handleEditSubmit,
      handleShareClick,
      handleReactionChange,
      removingPostId,
      session,
    ],
  );

  const renderPosts = () => {
    if (!filteredPosts.length) {
      return (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          {loading
            ? 'Syncing timeline…'
            : 'No updates match your filters yet. Share something or adjust your filters to see more activity.'}
        </div>
      );
    }

    if (!virtualizationEnabled) {
      return (
        <div className="space-y-6">
          {filteredPosts.map((post) => renderFeedPost(post))}
          <div ref={loadMoreRef} aria-hidden="true" />
          {loadingMore ? <FeedLoadingSkeletons /> : null}
          {loadMoreError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
              {loadMoreError?.message || 'We could not load more updates. Try again soon.'}
              <button
                type="button"
                onClick={fetchNextPage}
                className="ml-3 inline-flex items-center gap-2 rounded-full border border-amber-200 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-amber-700 transition hover:border-amber-300 hover:text-amber-600"
              >
                Retry
              </button>
            </div>
          ) : null}
          {!pagination.hasMore && filteredPosts.length ? (
            <p className="text-center text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">
              You’re all caught up.
            </p>
          ) : null}
        </div>
      );
    }

    const virtualisedChunks = feedChunks.map((chunk, chunkIndex) => (
      <VirtualFeedChunk
        key={`feed-chunk-${chunk.startIndex}`}
        chunk={chunk.posts}
        chunkIndex={chunkIndex}
        renderPost={renderFeedPost}
        estimatedHeight={chunkHeights[chunkIndex] ?? chunk.posts.length * DEFAULT_CHUNK_ESTIMATE}
        onHeightChange={updateChunkHeight}
        forceVisible={forcedChunkIndices.has(chunkIndex)}
      />
    ));

    return (
      <div className="space-y-6">
        {virtualisedChunks}
        <div ref={loadMoreRef} aria-hidden="true" />
        {loadingMore ? <FeedLoadingSkeletons /> : null}
        {loadMoreError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            {loadMoreError?.message || 'We could not load more updates. Try again soon.'}
            <button
              type="button"
              onClick={fetchNextPage}
              className="ml-3 inline-flex items-center gap-2 rounded-full border border-amber-200 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-amber-700 transition hover:border-amber-300 hover:text-amber-600"
            >
              Retry
            </button>
          </div>
        ) : null}
        {!pagination.hasMore && filteredPosts.length ? (
          <p className="text-center text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">
            You’re all caught up.
          </p>
        ) : null}
      </div>
    );
  };

  if (!isAuthenticated) {
    return null;
  }

  if (!hasFeedAccess) {
    return (
      <section className="relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
        <div className="absolute -right-20 top-24 h-72 w-72 rounded-full bg-accent/15 blur-[140px]" aria-hidden="true" />
        <div className="absolute -left-16 bottom-10 h-80 w-80 rounded-full bg-indigo-200/20 blur-[140px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-6">
          <PageHeader
            eyebrow="Timeline"
            title="Switch to an eligible workspace"
            description="Your current role does not grant access to the timeline. Swap to a user, freelancer, agency, mentor, headhunter, or company workspace to engage in real time."
            actions={
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
                >
                  Manage memberships
                </Link>
                <Link
                  to="/dashboard/user"
                  className="inline-flex items-center gap-2 rounded-full border border-accent/50 bg-white px-5 py-2 text-sm font-semibold text-accent transition hover:border-accent"
                >
                  Open dashboards
                </Link>
              </div>
            }
            meta={
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {Array.from(ALLOWED_FEED_MEMBERSHIPS).map((role) => {
                  const readable = role.replace(/_/g, ' ');
                  const formatted = readable.charAt(0).toUpperCase() + readable.slice(1);
                  return (
                    <span
                      key={role}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-slate-500"
                    >
                      <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                      {formatted}
                    </span>
                  );
                })}
              </div>
            }
          />
          <div className="mt-10 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Why access is restricted</h2>
            <p className="mt-3 text-sm text-slate-600">
              The timeline hosts sensitive operating updates. Restricting access keeps launches safe. Switch to an eligible membership or contact support for a review.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <main className="bg-[#f3f2ef] pb-12 pt-6 sm:pt-10">
      <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6 2xl:px-12">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          <div className="order-2 space-y-6 lg:order-1 lg:col-span-3">
            <FeedIdentityRail session={session} interests={interests} />
          </div>
          <div className="order-1 space-y-6 lg:order-2 lg:col-span-6">
            <FeedComposer onCreate={handleComposerCreate} session={session} />
            <ActivityFilters
              filters={activeFilters}
              onChange={handleFiltersChange}
              onReset={handleResetFilters}
              savedViews={savedFilterViews}
              onSaveView={handleSaveView}
              onSelectSavedView={handleSelectSavedView}
              onDeleteSavedView={handleDeleteSavedView}
              suggestedTopics={trendingTopics}
              trendingHashtags={trendingHashtags}
            />
            {error && !loading ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                We’re showing the latest cached updates while we reconnect. {error.message || 'Please try again shortly.'}
              </div>
            ) : null}
            {feedActionError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {feedActionError}
              </div>
            ) : null}
            {loading && !filteredPosts.length ? renderSkeleton() : renderPosts()}
          </div>
          <div className="order-3 space-y-6 lg:col-span-3">
            <FeedInsightsRail
              connectionSuggestions={connectionSuggestions}
              groupSuggestions={groupSuggestions}
              liveMoments={liveMoments}
              generatedAt={suggestionsGeneratedAt}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
