import { useCallback, useEffect, useMemo, useState } from 'react';
import useCachedResource from './useCachedResource.js';
import {
  fetchFreelancerTimelineWorkspace,
  updateFreelancerTimelineSettings,
  createFreelancerTimelineEntry,
  updateFreelancerTimelineEntry,
  deleteFreelancerTimelineEntry,
  createFreelancerTimelinePost,
  updateFreelancerTimelinePost,
  deleteFreelancerTimelinePost,
  publishFreelancerTimelinePost,
  recordFreelancerTimelinePostMetrics,
} from '../services/freelancerTimeline.js';

const DEFAULT_TIMELINE_SERVICES = Object.freeze({
  fetchWorkspace: fetchFreelancerTimelineWorkspace,
  updateSettings: updateFreelancerTimelineSettings,
  createEntry: createFreelancerTimelineEntry,
  updateEntry: updateFreelancerTimelineEntry,
  deleteEntry: deleteFreelancerTimelineEntry,
  createPost: createFreelancerTimelinePost,
  updatePost: updateFreelancerTimelinePost,
  deletePost: deleteFreelancerTimelinePost,
  publishPost: publishFreelancerTimelinePost,
  recordMetrics: recordFreelancerTimelinePostMetrics,
});

const FALLBACK_WORKSPACE = {
  id: 'demo-workspace',
  freelancerId: 'demo-freelancer',
  timezone: 'UTC',
  defaultVisibility: 'public',
  autoShareToFeed: true,
  reviewBeforePublish: true,
  distributionChannels: ['feed', 'newsletter'],
  contentThemes: ['product updates', 'community impact'],
  pinnedCampaigns: ['Launch week spotlight'],
  cadenceGoal: 4,
  lastSyncedAt: null,
  createdAt: null,
  updatedAt: null,
};

const FALLBACK_POSTS = [
  {
    id: 'demo-post-1',
    freelancerId: 'demo-freelancer',
    workspaceId: 'demo-workspace',
    title: 'Launch announcement',
    summary: 'Expanded the AI discovery playbook to 50 beta partners.',
    content:
      'Shared new before/after visuals, ROI snapshots, and opened the waitlist for venture studios.',
    status: 'published',
    visibility: 'public',
    scheduledAt: null,
    publishedAt: '2024-04-10T10:00:00Z',
    timezone: 'UTC',
    heroImageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1280&q=80',
    allowComments: true,
    tags: ['launch', 'product'],
    attachments: [
      {
        label: 'Launch deck',
        url: 'https://assets.gigvora.test/decks/launch.pdf',
        type: 'document',
        thumbnail: null,
      },
    ],
    targetAudience: [
      { label: 'Prospects', id: 'prospects' },
      { label: 'Investors', id: 'investors' },
    ],
    campaign: 'Launch week',
    callToAction: { label: 'View case study', url: 'https://gigvora.test/case-study' },
    metrics: {
      totals: {
        impressions: 2200,
        views: 1800,
        clicks: 180,
        comments: 16,
        reactions: 240,
        saves: 22,
        shares: 35,
        profileVisits: 80,
        leads: 12,
      },
      trend: [
        { capturedAt: '2024-04-09', impressions: 800, clicks: 60, reactions: 70, comments: 6, saves: 5, shares: 9 },
        { capturedAt: '2024-04-10', impressions: 1400, clicks: 120, reactions: 170, comments: 10, saves: 17, shares: 26 },
      ],
    },
    linkedEntryCount: 1,
    createdAt: '2024-04-08T08:00:00Z',
    updatedAt: '2024-04-10T15:00:00Z',
  },
  {
    id: 'demo-post-2',
    freelancerId: 'demo-freelancer',
    workspaceId: 'demo-workspace',
    title: 'Weekly delivery recap',
    summary: 'Closed discovery sprint, activated success rituals, and rolled out a new measurement loop.',
    content:
      'Highlighting Lumina Health onboarding metrics, new references captured, and velocity improvements across retainers.',
    status: 'scheduled',
    visibility: 'connections',
    scheduledAt: '2024-04-18T14:00:00Z',
    publishedAt: null,
    timezone: 'UTC',
    heroImageUrl: null,
    allowComments: true,
    tags: ['operations', 'delivery'],
    attachments: [],
    targetAudience: [{ label: 'Active clients', id: 'clients' }],
    campaign: 'Retention focus',
    callToAction: { label: 'Book a roadmap review', url: 'https://gigvora.test/roadmap' },
    metrics: {
      totals: {
        impressions: 640,
        views: 520,
        clicks: 48,
        comments: 6,
        reactions: 54,
        saves: 11,
        shares: 4,
        profileVisits: 18,
        leads: 2,
      },
      trend: [
        { capturedAt: '2024-04-16', impressions: 320, clicks: 20, reactions: 24, comments: 2, saves: 4, shares: 1 },
        { capturedAt: '2024-04-17', impressions: 320, clicks: 28, reactions: 30, comments: 4, saves: 7, shares: 3 },
      ],
    },
    linkedEntryCount: 1,
    createdAt: '2024-04-15T09:00:00Z',
    updatedAt: '2024-04-17T11:30:00Z',
  },
];

const FALLBACK_ENTRIES = [
  {
    id: 'demo-entry-1',
    freelancerId: 'demo-freelancer',
    workspaceId: 'demo-workspace',
    title: 'Draft April updates',
    description: 'Pull metrics, capture client quotes, and storyboard the April launch recap.',
    entryType: 'milestone',
    status: 'in_progress',
    startAt: '2024-04-08T09:00:00Z',
    endAt: '2024-04-12T17:00:00Z',
    linkedPostId: 'demo-post-1',
    owner: 'Taylor Rivera',
    channel: 'LinkedIn',
    location: null,
    tags: ['launch', 'content'],
    metadata: { checklist: ['Collect testimonials', 'Prepare visuals'] },
    linkedPost: {
      id: 'demo-post-1',
      title: 'Launch announcement',
      status: 'published',
      visibility: 'public',
      scheduledAt: null,
      publishedAt: '2024-04-10T10:00:00Z',
    },
    createdAt: '2024-04-07T12:00:00Z',
    updatedAt: '2024-04-09T15:00:00Z',
  },
  {
    id: 'demo-entry-2',
    freelancerId: 'demo-freelancer',
    workspaceId: 'demo-workspace',
    title: 'Client spotlight planning',
    description: 'Coordinate with Atlas Robotics for the next community post and testimonial capture.',
    entryType: 'event',
    status: 'planned',
    startAt: '2024-04-19T16:00:00Z',
    endAt: '2024-04-19T17:00:00Z',
    linkedPostId: 'demo-post-2',
    owner: 'Taylor Rivera',
    channel: 'Zoom',
    location: 'Remote',
    tags: ['community', 'spotlight'],
    metadata: { agenda: ['Select clips', 'Draft teaser copy'] },
    linkedPost: {
      id: 'demo-post-2',
      title: 'Weekly delivery recap',
      status: 'scheduled',
      visibility: 'connections',
      scheduledAt: '2024-04-18T14:00:00Z',
      publishedAt: null,
    },
    createdAt: '2024-04-16T10:30:00Z',
    updatedAt: '2024-04-16T10:30:00Z',
  },
];

export function computeTimelineAnalyticsFromClient(posts, entries) {
  const safePosts = Array.isArray(posts) ? posts : [];
  const safeEntries = Array.isArray(entries) ? entries : [];

  const totals = {
    posts: safePosts.length,
    drafts: safePosts.filter((post) => post.status === 'draft').length,
    scheduled: safePosts.filter((post) => post.status === 'scheduled').length,
    published: safePosts.filter((post) => post.status === 'published').length,
    archived: safePosts.filter((post) => post.status === 'archived').length,
    impressions: 0,
    views: 0,
    clicks: 0,
    comments: 0,
    reactions: 0,
    saves: 0,
    shares: 0,
    profileVisits: 0,
    leads: 0,
  };

  const trendAccumulator = new Map();

  safePosts.forEach((post) => {
    const metricsTotals = post.metrics?.totals ?? {};
    totals.impressions += metricsTotals.impressions ?? 0;
    totals.views += metricsTotals.views ?? 0;
    totals.clicks += metricsTotals.clicks ?? 0;
    totals.comments += metricsTotals.comments ?? 0;
    totals.reactions += metricsTotals.reactions ?? 0;
    totals.saves += metricsTotals.saves ?? 0;
    totals.shares += metricsTotals.shares ?? 0;
    totals.profileVisits += metricsTotals.profileVisits ?? 0;
    totals.leads += metricsTotals.leads ?? 0;

    const trendSeries = post.metrics?.trend ?? [];
    trendSeries.forEach((metric) => {
      if (!metric.capturedAt) {
        return;
      }
      const key = metric.capturedAt;
      const bucket = trendAccumulator.get(key) ?? {
        capturedAt: key,
        impressions: 0,
        clicks: 0,
        reactions: 0,
        comments: 0,
        saves: 0,
        shares: 0,
      };
      bucket.impressions += metric.impressions ?? 0;
      bucket.clicks += metric.clicks ?? 0;
      bucket.reactions += metric.reactions ?? 0;
      bucket.comments += metric.comments ?? 0;
      bucket.saves += metric.saves ?? 0;
      bucket.shares += metric.shares ?? 0;
      trendAccumulator.set(key, bucket);
    });
  });

  const engagementActions =
    totals.clicks + totals.comments + totals.reactions + totals.shares + totals.saves;
  const engagementRate = totals.impressions > 0 ? engagementActions / totals.impressions : 0;

  const trend = Array.from(trendAccumulator.values())
    .sort((a, b) => new Date(a.capturedAt) - new Date(b.capturedAt))
    .slice(-30);

  const topPosts = safePosts
    .map((post) => {
      const metricsTotals = post.metrics?.totals ?? {};
      const engagement =
        (metricsTotals.clicks ?? 0) +
        (metricsTotals.comments ?? 0) +
        (metricsTotals.reactions ?? 0) +
        (metricsTotals.shares ?? 0) +
        (metricsTotals.saves ?? 0);
      return {
        id: post.id,
        title: post.title,
        status: post.status,
        impressions: metricsTotals.impressions ?? 0,
        engagement,
        publishedAt: post.publishedAt ?? null,
        tags: post.tags ?? [],
      };
    })
    .sort((a, b) => b.engagement - a.engagement || b.impressions - a.impressions)
    .slice(0, 5);

  const now = Date.now();
  const timelineSummary = {
    total: safeEntries.length,
    planned: safeEntries.filter((entry) => entry.status === 'planned').length,
    inProgress: safeEntries.filter((entry) => entry.status === 'in_progress').length,
    completed: safeEntries.filter((entry) => entry.status === 'completed').length,
    blocked: safeEntries.filter((entry) => entry.status === 'blocked').length,
    upcoming: safeEntries.filter((entry) => entry.startAt && new Date(entry.startAt).getTime() > now).length,
  };

  const tagCounts = new Map();
  safePosts.forEach((post) => {
    (post.tags ?? []).forEach((tag) => {
      const key = `${tag}`.trim();
      if (!key) {
        return;
      }
      tagCounts.set(key, (tagCounts.get(key) ?? 0) + 1);
    });
  });

  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }));

  const latestPublishedAt = safePosts
    .filter((post) => post.status === 'published' && post.publishedAt)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .map((post) => post.publishedAt)[0] ?? null;

  return {
    totals: {
      ...totals,
      engagementRate,
      latestPublishedAt,
    },
    timelineSummary,
    trend,
    topPosts,
    topTags,
  };
}

const FALLBACK_ANALYTICS = computeTimelineAnalyticsFromClient(FALLBACK_POSTS, FALLBACK_ENTRIES);

export function useFreelancerTimeline({
  freelancerId,
  enabled = true,
  resourceKeyPrefix = 'freelancer:timeline',
  demoOwnerId = 'demo-freelancer',
  fallbackWorkspace = FALLBACK_WORKSPACE,
  fallbackPosts = FALLBACK_POSTS,
  fallbackEntries = FALLBACK_ENTRIES,
  fallbackAnalytics,
  services: serviceOverrides,
} = {}) {
  const {
    fetchWorkspace: fetchWorkspaceService,
    updateSettings: updateSettingsService,
    createEntry: createEntryService,
    updateEntry: updateEntryService,
    deleteEntry: deleteEntryService,
    createPost: createPostService,
    updatePost: updatePostService,
    deletePost: deletePostService,
    publishPost: publishPostService,
    recordMetrics: recordMetricsService,
  } = useMemo(
    () => ({ ...DEFAULT_TIMELINE_SERVICES, ...(serviceOverrides ?? {}) }),
    [serviceOverrides],
  );

  const fallbackState = useMemo(() => {
    const workspaceFallback = fallbackWorkspace ?? FALLBACK_WORKSPACE;
    const postsFallback = fallbackPosts ?? FALLBACK_POSTS;
    const entriesFallback = fallbackEntries ?? FALLBACK_ENTRIES;
    const analyticsFallback = fallbackAnalytics
      ?? (postsFallback === FALLBACK_POSTS && entriesFallback === FALLBACK_ENTRIES
        ? FALLBACK_ANALYTICS
        : computeTimelineAnalyticsFromClient(postsFallback, entriesFallback));
    return {
      workspace: workspaceFallback,
      posts: postsFallback,
      entries: entriesFallback,
      analytics: analyticsFallback,
    };
  }, [fallbackAnalytics, fallbackEntries, fallbackPosts, fallbackWorkspace]);

  const safeId = freelancerId ?? demoOwnerId ?? 'demo-freelancer';
  const isNetworkEnabled = Boolean(freelancerId);
  const [workspace, setWorkspace] = useState(fallbackState.workspace);
  const [posts, setPosts] = useState(fallbackState.posts);
  const [entries, setEntries] = useState(fallbackState.entries);
  const [analytics, setAnalytics] = useState(fallbackState.analytics);
  const [savingState, setSavingState] = useState({ settings: false, post: false, entry: false, metrics: false });
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    if (!isNetworkEnabled) {
      setWorkspace(fallbackState.workspace);
      setPosts(fallbackState.posts);
      setEntries(fallbackState.entries);
      setAnalytics(fallbackState.analytics);
    }
  }, [fallbackState, isNetworkEnabled]);

  const fetcher = useCallback(
    async ({ signal } = {}) => {
      if (!isNetworkEnabled) {
        return {
          workspace: fallbackState.workspace,
          timelineEntries: fallbackState.entries,
          posts: fallbackState.posts,
          analytics: fallbackState.analytics,
        };
      }
      return fetchWorkspaceService(freelancerId, { signal });
    },
    [fallbackState, fetchWorkspaceService, freelancerId, isNetworkEnabled],
  );

  const resource = useCachedResource(`${resourceKeyPrefix}:${safeId}`, fetcher, {
    enabled: enabled !== false,
    dependencies: [safeId, resourceKeyPrefix],
    ttl: 1000 * 60,
  });

  useEffect(() => {
    if (!resource.data) {
      return;
    }
    const nextWorkspace = resource.data.workspace ?? fallbackState.workspace;
    const nextEntries = resource.data.timelineEntries ?? fallbackState.entries;
    const nextPosts = resource.data.posts ?? fallbackState.posts;
    const nextAnalytics =
      resource.data.analytics ?? computeTimelineAnalyticsFromClient(nextPosts, nextEntries);
    setWorkspace(nextWorkspace);
    setEntries(nextEntries);
    setPosts(nextPosts);
    setAnalytics(nextAnalytics);
  }, [fallbackState.entries, fallbackState.posts, fallbackState.workspace, resource.data]);

  const refresh = resource.refresh;

  const recomputeAnalytics = useCallback(
    (nextPosts, nextEntries) => {
      setAnalytics(computeTimelineAnalyticsFromClient(nextPosts, nextEntries));
    },
    [],
  );

  const saveSettings = useCallback(
    async (nextSettings) => {
      setSavingState((state) => ({ ...state, settings: true }));
      setActionError(null);
      try {
        if (!isNetworkEnabled) {
          const localSettings = {
            ...workspace,
            ...nextSettings,
            distributionChannels: nextSettings?.distributionChannels ?? workspace.distributionChannels,
            contentThemes: nextSettings?.contentThemes ?? workspace.contentThemes,
            pinnedCampaigns: nextSettings?.pinnedCampaigns ?? workspace.pinnedCampaigns,
          };
          setWorkspace(localSettings);
          return localSettings;
        }
        const result = await updateSettingsService(freelancerId, nextSettings);
        setWorkspace(result);
        await refresh({ force: true });
        return result;
      } catch (error) {
        const normalisedError = error instanceof Error ? error : new Error('Unable to update timeline settings.');
        setActionError(normalisedError);
        throw normalisedError;
      } finally {
        setSavingState((state) => ({ ...state, settings: false }));
      }
    },
    [freelancerId, isNetworkEnabled, refresh, updateSettingsService, workspace],
  );

  const createPost = useCallback(
    async (payload) => {
      setSavingState((state) => ({ ...state, post: true }));
      setActionError(null);
      try {
        if (!isNetworkEnabled) {
          const timestamp = new Date().toISOString();
          const localPost = {
            id: `local-post-${Date.now()}`,
            freelancerId: safeId,
            workspaceId: workspace.id ?? 'demo-workspace',
            title: payload.title ?? 'Untitled update',
            summary: payload.summary ?? null,
            content: payload.content ?? null,
            status: (payload.status ?? 'draft').toLowerCase(),
            visibility: (payload.visibility ?? workspace.defaultVisibility ?? 'public').toLowerCase(),
            scheduledAt: payload.scheduledAt ?? null,
            publishedAt: payload.publishedAt ?? null,
            timezone: payload.timezone ?? workspace.timezone ?? 'UTC',
            heroImageUrl: payload.heroImageUrl ?? null,
            allowComments: payload.allowComments ?? true,
            tags: Array.isArray(payload.tags) ? payload.tags : [],
            attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
            targetAudience: Array.isArray(payload.targetAudience) ? payload.targetAudience : [],
            campaign: payload.campaign ?? null,
            callToAction: payload.callToAction ?? null,
            metrics: {
              totals: {
                impressions: 0,
                views: 0,
                clicks: 0,
                comments: 0,
                reactions: 0,
                saves: 0,
                shares: 0,
                profileVisits: 0,
                leads: 0,
              },
              trend: [],
            },
            linkedEntryCount: 0,
            createdAt: timestamp,
            updatedAt: timestamp,
          };
          const nextPosts = [localPost, ...posts];
          setPosts(nextPosts);
          recomputeAnalytics(nextPosts, entries);
          return localPost;
        }
        const result = await createPostService(freelancerId, payload);
        await refresh({ force: true });
        return result;
      } catch (error) {
        const normalisedError = error instanceof Error ? error : new Error('Unable to create timeline post.');
        setActionError(normalisedError);
        throw normalisedError;
      } finally {
        setSavingState((state) => ({ ...state, post: false }));
      }
    },
    [
      createPostService,
      entries,
      freelancerId,
      isNetworkEnabled,
      posts,
      recomputeAnalytics,
      refresh,
      safeId,
      workspace,
    ],
  );

  const updatePost = useCallback(
    async (postId, payload) => {
      setSavingState((state) => ({ ...state, post: true }));
      setActionError(null);
      try {
        if (!isNetworkEnabled) {
          const nextPosts = posts.map((post) => {
            if (post.id !== postId) {
              return post;
            }
            const updated = {
              ...post,
              ...payload,
              status: payload.status ? `${payload.status}`.toLowerCase() : post.status,
              visibility: payload.visibility ? `${payload.visibility}`.toLowerCase() : post.visibility,
              scheduledAt: payload.scheduledAt ?? post.scheduledAt ?? null,
              publishedAt: payload.publishedAt ?? post.publishedAt ?? null,
              tags: payload.tags ? (Array.isArray(payload.tags) ? payload.tags : post.tags) : post.tags,
              attachments: payload.attachments
                ? Array.isArray(payload.attachments)
                  ? payload.attachments
                  : post.attachments
                : post.attachments,
              targetAudience: payload.targetAudience
                ? Array.isArray(payload.targetAudience)
                  ? payload.targetAudience
                  : post.targetAudience
                : post.targetAudience,
              campaign: payload.campaign ?? post.campaign ?? null,
              callToAction: payload.callToAction ?? post.callToAction ?? null,
              updatedAt: new Date().toISOString(),
            };
            return updated;
          });
          const nextEntries = entries.map((entry) =>
            entry.linkedPostId === postId
              ? {
                  ...entry,
                  linkedPost: {
                    ...(entry.linkedPost ?? {}),
                    status: payload.status ? `${payload.status}`.toLowerCase() : entry.linkedPost?.status,
                    visibility: payload.visibility
                      ? `${payload.visibility}`.toLowerCase()
                      : entry.linkedPost?.visibility,
                    scheduledAt: payload.scheduledAt ?? entry.linkedPost?.scheduledAt ?? null,
                    publishedAt: payload.publishedAt ?? entry.linkedPost?.publishedAt ?? null,
                  },
                }
              : entry,
          );
          setPosts(nextPosts);
          setEntries(nextEntries);
          recomputeAnalytics(nextPosts, nextEntries);
          return nextPosts.find((post) => post.id === postId) ?? null;
        }
        const result = await updatePostService(freelancerId, postId, payload);
        await refresh({ force: true });
        return result;
      } catch (error) {
        const normalisedError = error instanceof Error ? error : new Error('Unable to update timeline post.');
        setActionError(normalisedError);
        throw normalisedError;
      } finally {
        setSavingState((state) => ({ ...state, post: false }));
      }
    },
    [entries, freelancerId, isNetworkEnabled, posts, recomputeAnalytics, refresh, updatePostService],
  );

  const removePost = useCallback(
    async (postId) => {
      setSavingState((state) => ({ ...state, post: true }));
      setActionError(null);
      try {
        if (!isNetworkEnabled) {
          const nextPosts = posts.filter((post) => post.id !== postId);
          const nextEntries = entries.map((entry) =>
            entry.linkedPostId === postId
              ? { ...entry, linkedPostId: null, linkedPost: null }
              : entry,
          );
          setPosts(nextPosts);
          setEntries(nextEntries);
          recomputeAnalytics(nextPosts, nextEntries);
          return { success: true };
        }
        const result = await deletePostService(freelancerId, postId);
        await refresh({ force: true });
        return result;
      } catch (error) {
        const normalisedError = error instanceof Error ? error : new Error('Unable to delete timeline post.');
        setActionError(normalisedError);
        throw normalisedError;
      } finally {
        setSavingState((state) => ({ ...state, post: false }));
      }
    },
    [deletePostService, entries, freelancerId, isNetworkEnabled, posts, recomputeAnalytics, refresh],
  );

  const publishPost = useCallback(
    async (postId, payload = {}) => {
      setSavingState((state) => ({ ...state, post: true }));
      setActionError(null);
      try {
        if (!isNetworkEnabled) {
          return updatePost(postId, {
            ...payload,
            status: 'published',
            publishedAt: payload.publishedAt ?? new Date().toISOString(),
          });
        }
        const result = await publishPostService(freelancerId, postId, payload);
        await refresh({ force: true });
        return result;
      } catch (error) {
        const normalisedError = error instanceof Error ? error : new Error('Unable to publish timeline post.');
        setActionError(normalisedError);
        throw normalisedError;
      } finally {
        setSavingState((state) => ({ ...state, post: false }));
      }
    },
    [freelancerId, isNetworkEnabled, publishPostService, refresh, updatePost],
  );

  const createEntry = useCallback(
    async (payload) => {
      setSavingState((state) => ({ ...state, entry: true }));
      setActionError(null);
      try {
        if (!isNetworkEnabled) {
          const timestamp = new Date().toISOString();
          const localEntry = {
            id: `local-entry-${Date.now()}`,
            freelancerId: safeId,
            workspaceId: workspace.id ?? 'demo-workspace',
            title: payload.title ?? 'New timeline entry',
            description: payload.description ?? null,
            entryType: (payload.entryType ?? 'milestone').toLowerCase(),
            status: (payload.status ?? 'planned').toLowerCase(),
            startAt: payload.startAt ?? null,
            endAt: payload.endAt ?? null,
            linkedPostId: payload.linkedPostId ?? null,
            owner: payload.owner ?? null,
            channel: payload.channel ?? null,
            location: payload.location ?? null,
            tags: Array.isArray(payload.tags) ? payload.tags : [],
            metadata: payload.metadata ?? null,
            linkedPost: payload.linkedPostId
              ? posts.find((post) => post.id === payload.linkedPostId)?.linkedPost ||
                posts.find((post) => post.id === payload.linkedPostId)
              : null,
            createdAt: timestamp,
            updatedAt: timestamp,
          };
          const nextEntries = [localEntry, ...entries];
          setEntries(nextEntries);
          recomputeAnalytics(posts, nextEntries);
          return localEntry;
        }
        const result = await createEntryService(freelancerId, payload);
        await refresh({ force: true });
        return result;
      } catch (error) {
        const normalisedError = error instanceof Error ? error : new Error('Unable to create timeline entry.');
        setActionError(normalisedError);
        throw normalisedError;
      } finally {
        setSavingState((state) => ({ ...state, entry: false }));
      }
    },
    [
      createEntryService,
      entries,
      freelancerId,
      isNetworkEnabled,
      posts,
      recomputeAnalytics,
      refresh,
      safeId,
      workspace.id,
    ],
  );

  const updateEntry = useCallback(
    async (entryId, payload) => {
      setSavingState((state) => ({ ...state, entry: true }));
      setActionError(null);
      try {
        if (!isNetworkEnabled) {
          const nextEntries = entries.map((entry) =>
            entry.id === entryId
              ? {
                  ...entry,
                  ...payload,
                  status: payload.status ? `${payload.status}`.toLowerCase() : entry.status,
                  entryType: payload.entryType ? `${payload.entryType}`.toLowerCase() : entry.entryType,
                  updatedAt: new Date().toISOString(),
                  linkedPostId: payload.linkedPostId ?? entry.linkedPostId ?? null,
                  linkedPost:
                    payload.linkedPostId !== undefined
                      ? posts.find((post) => post.id === payload.linkedPostId)?.linkedPost ||
                        posts.find((post) => post.id === payload.linkedPostId)
                      : entry.linkedPost,
                }
              : entry,
          );
          setEntries(nextEntries);
          recomputeAnalytics(posts, nextEntries);
          return nextEntries.find((entry) => entry.id === entryId) ?? null;
        }
        const result = await updateEntryService(freelancerId, entryId, payload);
        await refresh({ force: true });
        return result;
      } catch (error) {
        const normalisedError = error instanceof Error ? error : new Error('Unable to update timeline entry.');
        setActionError(normalisedError);
        throw normalisedError;
      } finally {
        setSavingState((state) => ({ ...state, entry: false }));
      }
    },
    [entries, freelancerId, isNetworkEnabled, posts, recomputeAnalytics, refresh, updateEntryService],
  );

  const removeEntry = useCallback(
    async (entryId) => {
      setSavingState((state) => ({ ...state, entry: true }));
      setActionError(null);
      try {
        if (!isNetworkEnabled) {
          const nextEntries = entries.filter((entry) => entry.id !== entryId);
          setEntries(nextEntries);
          recomputeAnalytics(posts, nextEntries);
          return { success: true };
        }
        const result = await deleteEntryService(freelancerId, entryId);
        await refresh({ force: true });
        return result;
      } catch (error) {
        const normalisedError = error instanceof Error ? error : new Error('Unable to delete timeline entry.');
        setActionError(normalisedError);
        throw normalisedError;
      } finally {
        setSavingState((state) => ({ ...state, entry: false }));
      }
    },
    [deleteEntryService, entries, freelancerId, isNetworkEnabled, posts, recomputeAnalytics, refresh],
  );

  const recordMetrics = useCallback(
    async (postId, payload) => {
      setSavingState((state) => ({ ...state, metrics: true }));
      setActionError(null);
      try {
        if (!isNetworkEnabled) {
          const dateKey = payload?.capturedAt
            ? new Date(payload.capturedAt).toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10);
          const nextPosts = posts.map((post) => {
            if (post.id !== postId) {
              return post;
            }
            const existingTrend = Array.isArray(post.metrics?.trend) ? post.metrics.trend : [];
            const filteredTrend = existingTrend.filter((metric) => metric.capturedAt !== dateKey);
            const record = {
              capturedAt: dateKey,
              impressions: payload.impressions ?? 0,
              clicks: payload.clicks ?? 0,
              reactions: payload.reactions ?? 0,
              comments: payload.comments ?? 0,
              saves: payload.saves ?? 0,
              shares: payload.shares ?? 0,
            };
            const totals = {
              impressions: (post.metrics?.totals?.impressions ?? 0) - (existingTrend.find((m) => m.capturedAt === dateKey)?.impressions ?? 0) + (payload.impressions ?? 0),
              views: (post.metrics?.totals?.views ?? 0),
              clicks: (post.metrics?.totals?.clicks ?? 0) - (existingTrend.find((m) => m.capturedAt === dateKey)?.clicks ?? 0) + (payload.clicks ?? 0),
              comments: (post.metrics?.totals?.comments ?? 0) - (existingTrend.find((m) => m.capturedAt === dateKey)?.comments ?? 0) + (payload.comments ?? 0),
              reactions: (post.metrics?.totals?.reactions ?? 0) - (existingTrend.find((m) => m.capturedAt === dateKey)?.reactions ?? 0) + (payload.reactions ?? 0),
              saves: (post.metrics?.totals?.saves ?? 0) - (existingTrend.find((m) => m.capturedAt === dateKey)?.saves ?? 0) + (payload.saves ?? 0),
              shares: (post.metrics?.totals?.shares ?? 0) - (existingTrend.find((m) => m.capturedAt === dateKey)?.shares ?? 0) + (payload.shares ?? 0),
              profileVisits: (post.metrics?.totals?.profileVisits ?? 0) - (existingTrend.find((m) => m.capturedAt === dateKey)?.profileVisits ?? 0) + (payload.profileVisits ?? 0),
              leads: (post.metrics?.totals?.leads ?? 0) - (existingTrend.find((m) => m.capturedAt === dateKey)?.leads ?? 0) + (payload.leads ?? 0),
            };
            const updatedTrend = [...filteredTrend, record].sort(
              (a, b) => new Date(a.capturedAt) - new Date(b.capturedAt),
            );
            return {
              ...post,
              metrics: {
                totals,
                trend: updatedTrend,
              },
              updatedAt: new Date().toISOString(),
            };
          });
          setPosts(nextPosts);
          recomputeAnalytics(nextPosts, entries);
          return nextPosts.find((post) => post.id === postId)?.metrics ?? null;
        }
        const result = await recordMetricsService(freelancerId, postId, payload);
        await refresh({ force: true });
        return result;
      } catch (error) {
        const normalisedError = error instanceof Error ? error : new Error('Unable to record post metrics.');
        setActionError(normalisedError);
        throw normalisedError;
      } finally {
        setSavingState((state) => ({ ...state, metrics: false }));
      }
    },
    [entries, freelancerId, isNetworkEnabled, posts, recomputeAnalytics, recordMetricsService, refresh],
  );

  const state = useMemo(
    () => ({
      workspace,
      posts,
      timelineEntries: entries,
      analytics,
      loading: resource.loading,
      error: actionError ?? resource.error,
      fromCache: resource.fromCache,
      lastUpdated: resource.lastUpdated,
      savingSettings: savingState.settings,
      savingPost: savingState.post,
      savingEntry: savingState.entry,
      savingMetrics: savingState.metrics,
      refresh,
      saveSettings,
      createPost,
      updatePost,
      deletePost: removePost,
      publishPost,
      recordMetrics,
      createEntry,
      updateEntry,
      deleteEntry: removeEntry,
      isNetworkEnabled,
    }),
    [
      actionError,
      analytics,
      createEntry,
      createPost,
      entries,
      isNetworkEnabled,
      publishPost,
      recordMetrics,
      refresh,
      removeEntry,
      removePost,
      resource.error,
      resource.fromCache,
      resource.lastUpdated,
      resource.loading,
      saveSettings,
      savingState.entry,
      savingState.metrics,
      savingState.post,
      savingState.settings,
      updateEntry,
      updatePost,
      workspace,
      posts,
    ],
  );

  return state;
}

export default useFreelancerTimeline;
