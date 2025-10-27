import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ShareModal from '../components/feed/ShareModal.jsx';
import FeedComposer from '../components/feed/FeedComposer.jsx';
import FeedCard, {
  DEFAULT_EDIT_DRAFT,
  normaliseFeedPost,
} from '../components/feed/FeedCard.jsx';
import ActivityFilters, {
  DEFAULT_ACTIVITY_FILTERS,
  applyActivityFilters,
  buildActivityFilterSummary,
  classifyFeedPost,
} from '../components/feed/ActivityFilters.jsx';
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
import { formatRelativeTime } from '../utils/date.js';
import useSession from '../hooks/useSession.js';
import useEngagementSignals from '../hooks/useEngagementSignals.js';
import {
  ContentModerationError,
  moderateFeedComposerPayload,
  sanitiseExternalLink,
} from '../utils/contentModeration.js';
import { ALLOWED_FEED_MEMBERSHIPS } from '../constants/feedMeta.js';

const FEED_PAGE_SIZE = 12;
const DEFAULT_FEED_VIRTUAL_CHUNK_SIZE = 5;
const FEED_VIRTUAL_MIN_CHUNK_SIZE = 4;
const FEED_VIRTUAL_MAX_CHUNK_SIZE = 12;
const DEFAULT_VIEWPORT_HEIGHT = 900;
const FEED_VIRTUAL_THRESHOLD = 14;
const DEFAULT_CHUNK_ESTIMATE = 420;
const OPPORTUNITY_POST_TYPES = new Set(['job', 'gig', 'project', 'launchpad', 'volunteering', 'mentorship']);
const COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function FeedIdentityRail({ session, interests = [] }) {
  const followerTotal = session?.followers ?? '—';
  const connectionTotal = session?.connections ?? '—';

  return (
    <aside className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <UserAvatar name={session?.name ?? 'Member'} seed={session?.avatarSeed ?? session?.name} size="lg" />
          <div>
            <p className="text-lg font-semibold text-slate-900">{session?.name ?? 'Gigvora member'}</p>
            <p className="text-sm text-slate-500">{session?.title ?? 'Marketplace professional'}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Network reach</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Followers</dt>
              <dd className="mt-2 text-2xl font-semibold text-slate-900">{followerTotal}</dd>
            </div>
            <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Connections</dt>
              <dd className="mt-2 text-2xl font-semibold text-slate-900">{connectionTotal}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 space-y-5 text-sm text-slate-600">
          {Array.isArray(session?.companies) && session.companies.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Companies</p>
              <ul className="mt-3 space-y-2">
                {session.companies.map((company) => (
                  <li key={company} className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
                    {company}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {Array.isArray(session?.agencies) && session.agencies.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agencies & collectives</p>
              <ul className="mt-3 space-y-2">
                {session.agencies.map((agency) => (
                  <li key={agency} className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
                    {agency}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {Array.isArray(session?.accountTypes) && session.accountTypes.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account types</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {session.accountTypes.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center rounded-full border border-accent/40 bg-accentSoft px-3 py-1 text-[11px] font-semibold text-accent"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {interests.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Interest signals</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {interests.slice(0, 8).map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function FeedInsightsRail({
  connectionSuggestions = [],
  groupSuggestions = [],
  liveMoments = [],
  generatedAt = null,
}) {
  const hasSuggestions = connectionSuggestions.length || groupSuggestions.length;
  const hasLiveMoments = liveMoments.length > 0;

  const formatMemberCount = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return null;
    }
    return COMPACT_NUMBER_FORMATTER.format(numeric);
  };

  return (
    <aside className="space-y-6">
      {hasLiveMoments ? (
        <div className="rounded-[28px] bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-500 p-[1px] shadow-lg shadow-indigo-500/30">
          <div className="rounded-[26px] bg-white/95 p-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-slate-900">Live signals</p>
              {generatedAt ? (
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Updated {formatRelativeTime(generatedAt)}
                </span>
              ) : null}
            </div>
            <ul className="mt-4 space-y-3">
              {liveMoments.slice(0, 4).map((moment) => (
                <li
                  key={moment.id}
                  className="flex items-start gap-3 rounded-2xl bg-white/85 p-3 shadow-sm ring-1 ring-white/60 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="text-xl" aria-hidden="true">
                    {moment.icon ?? '⚡️'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{moment.title}</p>
                    {moment.preview ? (
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">{moment.preview}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-indigo-500">
                      {moment.tag ? <span>{moment.tag}</span> : null}
                      {moment.timestamp ? (
                        <span className="text-slate-400">{formatRelativeTime(moment.timestamp)}</span>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
      {connectionSuggestions.length ? (
        <div className="rounded-[28px] border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-lg shadow-slate-200/40">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Suggested connections</p>
            <Link to="/connections" className="text-xs font-semibold text-accent transition hover:text-accentDark">
              View all
            </Link>
          </div>
          <ul className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            {connectionSuggestions.slice(0, 4).map((connection) => {
              const mutualLabel = connection.mutualConnections === 1
                ? '1 mutual'
                : `${connection.mutualConnections ?? 0} mutual`;
              return (
                <li
                  key={connection.id}
                  className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:-translate-y-1 hover:border-accent/30 hover:shadow-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <span
                        className="pointer-events-none absolute -inset-1 rounded-full bg-gradient-to-br from-accent/30 via-transparent to-violet-400/40 opacity-0 blur-md transition group-hover:opacity-100"
                        aria-hidden="true"
                      />
                      <UserAvatar
                        name={connection.name}
                        seed={connection.avatarSeed ?? connection.name}
                        size="xs"
                        className="relative ring-2 ring-white"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 line-clamp-1">{connection.name}</p>
                      {connection.headline ? (
                        <p className="mt-1 text-xs text-slate-500 line-clamp-2">{connection.headline}</p>
                      ) : null}
                    </div>
                  </div>
                  {connection.reason ? (
                    <p className="mt-3 text-xs text-slate-500 line-clamp-2">{connection.reason}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {connection.location ? <span>{connection.location}</span> : null}
                    <span>{mutualLabel}</span>
                  </div>
                  <Link
                    to={`/connections?suggested=${encodeURIComponent(connection.id)}`}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent to-accentDark px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:shadow"
                  >
                    Start introduction
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {groupSuggestions.length ? (
        <div className="rounded-[28px] border border-slate-100 bg-white/95 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Groups to join</p>
            <Link to="/groups" className="text-xs font-semibold text-accent transition hover:text-accentDark">
              Explore groups
            </Link>
          </div>
          <ul className="mt-4 grid gap-4 text-sm">
            {groupSuggestions.slice(0, 4).map((group) => {
              const membersLabel = formatMemberCount(group.members);
              return (
                <li
                  key={group.id}
                  className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm transition hover:-translate-y-1 hover:border-accent/30 hover:shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900 line-clamp-1">{group.name}</p>
                    {membersLabel ? (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">
                        {membersLabel} members
                      </span>
                    ) : null}
                  </div>
                  {group.description ? (
                    <p className="mt-2 text-xs text-slate-500 line-clamp-3">{group.description}</p>
                  ) : null}
                  {group.focus?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {group.focus.slice(0, 3).map((focus) => (
                        <span
                          key={focus}
                          className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600"
                        >
                          {focus}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {group.reason ? (
                    <p className="mt-3 text-xs font-semibold text-slate-400 line-clamp-2">{group.reason}</p>
                  ) : null}
                  <Link
                    to={`/groups/${encodeURIComponent(group.id)}?ref=feed-suggestion`}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-accent hover:text-accent"
                  >
                    Request invite
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Explorer consolidation</p>
        <p className="mt-2 text-sm text-slate-600">
          Jobs, gigs, projects, Experience Launchpad cohorts, volunteer opportunities, and talent discovery now live inside the Explorer. Use filters to pivot between freelancers, companies, people, groups, headhunters, and agencies without leaving your flow.
        </p>
        <Link
          to="/search"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-accentDark"
        >
          Open Explorer
        </Link>
      </div>
      {!hasSuggestions ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">No new suggestions just yet</p>
          <p className="mt-2 text-sm">As soon as the community shifts, you’ll see fresh connections and groups to explore.</p>
        </div>
      ) : null}
    </aside>
  );
}

export default function FeedPage() {
  const analyticsTrackedRef = useRef(false);
  const navigate = useNavigate();
  const { session, isAuthenticated } = useSession();
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
  const [shareContext, setShareContext] = useState(null);
  const [activityFilters, setActivityFilters] = useState(DEFAULT_ACTIVITY_FILTERS);
  const loadMoreRef = useRef(null);
  const { data, error, loading, fromCache, refresh } = useCachedResource(
    'feed:posts:v2',
    ({ signal }) => listFeedPosts({ signal, params: { limit: FEED_PAGE_SIZE } }),
    { ttl: 1000 * 60 * 2 },
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

  const classificationMap = useMemo(() => {
    const map = new Map();
    allPosts.forEach((post) => {
      if (!post) {
        return;
      }
      map.set(post.id, classifyFeedPost(post, { viewerId: session?.id }));
    });
    return map;
  }, [allPosts, session?.id]);

  const activitySummary = useMemo(
    () => buildActivityFilterSummary(allPosts, { classificationMap }),
    [allPosts, classificationMap],
  );

  const posts = useMemo(
    () => applyActivityFilters(allPosts, activityFilters, { classificationMap, editingPostId }),
    [activityFilters, allPosts, classificationMap, editingPostId],
  );

  const virtualizationEnabled = posts.length > FEED_VIRTUAL_THRESHOLD;
  const [virtualChunkSize, setVirtualChunkSize] = useState(DEFAULT_FEED_VIRTUAL_CHUNK_SIZE);

  const feedChunks = useMemo(() => {
    if (!posts.length) {
      return [];
    }
    const chunkSize = virtualizationEnabled
      ? Math.min(
          posts.length,
          Math.max(FEED_VIRTUAL_MIN_CHUNK_SIZE, Math.min(FEED_VIRTUAL_MAX_CHUNK_SIZE, virtualChunkSize)),
        )
      : posts.length;
    const chunks = [];
    for (let index = 0; index < posts.length; index += chunkSize) {
      chunks.push({
        startIndex: index,
        posts: posts.slice(index, index + chunkSize),
      });
    }
    return chunks;
  }, [posts, virtualChunkSize, virtualizationEnabled]);

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
      const params = { limit: FEED_PAGE_SIZE };
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
  }, [loadingMore, pagination.hasMore, pagination.nextCursor, pagination.nextPage, session]);

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

  const engagementSignals = useEngagementSignals({ session, feedPosts: posts, suggestions: remoteSuggestions });
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
    if (!analyticsTrackedRef.current && !loading && posts.length) {
      analytics.track('web_feed_viewed', { postCount: posts.length, cacheHit: fromCache }, { source: 'web_app' });
      analyticsTrackedRef.current = true;
    }
  }, [loading, posts, fromCache]);

  const handleShareClick = useCallback(
    (post) => {
      if (post?.id) {
        analytics.track('web_feed_share_entry', { postId: post.id }, { source: 'web_app' });
      }
      setShareContext(post ?? null);
    },
    [],
  );

  const handleShareComplete = useCallback(
    (result) => {
      if (!result?.postId) {
        setShareContext(null);
        return;
      }

      const resolvedCount = Number.isFinite(result.shareCount)
        ? Number(result.shareCount)
        : undefined;

      const applyShareCount = (post) => {
        if (!post || `${post.id}` !== `${result.postId}`) {
          return post;
        }
        const current = Number.isFinite(post.shareCount) ? Number(post.shareCount) : 0;
        const nextCount = resolvedCount ?? current + 1;
        return {
          ...post,
          shareCount: nextCount,
          metrics: { ...(post.metrics ?? {}), shares: nextCount },
        };
      };

      setLocalPosts((previous) => previous.map(applyShareCount));
      setRemotePosts((previous) => previous.map(applyShareCount));
      setShareContext(null);
    },
    [setLocalPosts, setRemotePosts],
  );

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
        const response = await createFeedPost(
          {
            userId: session.id,
            content: payload.content,
            visibility: 'public',
            type: payload.type,
            link: payload.link,
            mediaAttachments: payload.mediaAttachments,
          },
          { headers: { 'X-Feature-Surface': 'web-feed-composer' } },
        );

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

        analytics.track('web_feed_post_synced', { type: payload.type }, { source: 'web_app' });
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
    if (!posts.length) {
      const message = loading
        ? 'Syncing timeline…'
        : allPosts.length
        ? 'No timeline stories match your filters. Adjust the filters to rediscover fresh updates.'
        : 'No timeline updates yet. Share something to start the conversation!';
      return (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          {message}
        </div>
      );
    }

    if (!virtualizationEnabled) {
      return (
        <div className="space-y-6">
          {posts.map((post) => renderFeedPost(post))}
          <div ref={loadMoreRef} aria-hidden="true" />
          {loadingMore ? renderSkeleton() : null}
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
          {!pagination.hasMore && posts.length ? (
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
        {loadingMore ? renderSkeleton() : null}
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
        {!pagination.hasMore && posts.length ? (
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
    <>
      <main className="bg-[#f3f2ef] pb-12 pt-6 sm:pt-10">
        <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6 2xl:px-12">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
            <div className="order-2 space-y-6 lg:order-1 lg:col-span-3">
              <FeedIdentityRail session={session} interests={interests} />
            </div>
            <div className="order-1 space-y-6 lg:order-2 lg:col-span-6">
              <FeedComposer onCreate={handleComposerCreate} session={session} />
              <ActivityFilters
                filters={activityFilters}
                onChange={setActivityFilters}
                summary={activitySummary}
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
              {loading && !posts.length ? renderSkeleton() : renderPosts()}
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
      <ShareModal
        open={Boolean(shareContext)}
        onClose={() => setShareContext(null)}
        onComplete={handleShareComplete}
        post={shareContext}
        viewer={session}
      />
    </>
  );
}
