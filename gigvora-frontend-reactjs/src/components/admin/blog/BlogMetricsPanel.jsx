import { useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon, ChartBarIcon, ClockIcon, UserGroupIcon } from '@heroicons/react/24/outline';

function formatNumber(value, { fallback = '—', maximumFractionDigits = 0 } = {}) {
  if (value == null || Number.isNaN(Number(value))) {
    return fallback;
  }
  return Number(value).toLocaleString(undefined, { maximumFractionDigits });
}

function formatPercent(value, { fallback = '—', maximumFractionDigits = 1 } = {}) {
  if (value == null || Number.isNaN(Number(value))) {
    return fallback;
  }
  return `${Number(value).toFixed(maximumFractionDigits)}%`;
}

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

const SUMMARY_CARDS = [
  { key: 'totalViews', label: 'Views', icon: ChartBarIcon },
  { key: 'uniqueVisitors', label: 'Readers', icon: UserGroupIcon },
  { key: 'subscriberConversions', label: 'Signups', icon: UserGroupIcon },
  { key: 'commentCount', label: 'Comments', icon: ClockIcon },
];

export default function BlogMetricsPanel({
  overview,
  loading,
  onRefresh,
  posts,
  onUpdatePostMetrics,
  onExpand,
  onCloseFullscreen,
  isFullscreen = false,
}) {
  const [formState, setFormState] = useState({
    postId: '',
    totalViews: '',
    uniqueVisitors: '',
    averageReadTimeSeconds: '',
    readCompletionRate: '',
    clickThroughRate: '',
    bounceRate: '',
    shareCount: '',
    likeCount: '',
    subscriberConversions: '',
    commentCount: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const postMetricsMap = useMemo(() => {
    const map = new Map();
    posts.forEach((post) => {
      if (post.metrics) {
        map.set(String(post.id), post.metrics);
      }
    });
    (overview?.posts ?? []).forEach((entry) => {
      if (entry?.postId && !map.has(String(entry.postId))) {
        map.set(String(entry.postId), entry);
      }
    });
    return map;
  }, [overview, posts]);

  useEffect(() => {
    if (!formState.postId) {
      return;
    }
    const metrics = postMetricsMap.get(String(formState.postId));
    if (!metrics) {
      return;
    }
    setFormState((current) => ({
      ...current,
      totalViews: metrics.totalViews ?? '',
      uniqueVisitors: metrics.uniqueVisitors ?? '',
      averageReadTimeSeconds: metrics.averageReadTimeSeconds ?? '',
      readCompletionRate: metrics.readCompletionRate ?? '',
      clickThroughRate: metrics.clickThroughRate ?? '',
      bounceRate: metrics.bounceRate ?? '',
      shareCount: metrics.shareCount ?? '',
      likeCount: metrics.likeCount ?? '',
      subscriberConversions: metrics.subscriberConversions ?? '',
      commentCount: metrics.commentCount ?? '',
    }));
  }, [formState.postId, postMetricsMap]);

  const handleFieldChange = (field) => (event) => {
    setFormState((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formState.postId) {
      setStatusMessage('Choose a post.');
      return;
    }
    const payload = {};
    ['totalViews', 'uniqueVisitors', 'averageReadTimeSeconds', 'shareCount', 'likeCount', 'subscriberConversions', 'commentCount'].forEach((key) => {
      const value = formState[key];
      if (value !== '' && value != null) {
        payload[key] = Number(value);
      }
    });
    ['readCompletionRate', 'clickThroughRate', 'bounceRate'].forEach((key) => {
      const value = formState[key];
      if (value !== '' && value != null) {
        payload[key] = Number(value);
      }
    });
    setSubmitting(true);
    setStatusMessage('');
    try {
      await onUpdatePostMetrics(formState.postId, payload);
      setStatusMessage('Saved.');
    } finally {
      setSubmitting(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  const trendingPosts = overview?.trendingPosts ?? [];
  const engagement = overview?.engagement ?? {};
  const freshness = overview?.freshness ?? {};

  const sectionClass = `rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm ${
    isFullscreen ? 'h-full max-h-full overflow-y-auto' : ''
  }`;

  return (
    <section id="metrics" className={sectionClass}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Stats</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin text-accent' : ''}`} />
            Refresh
          </button>
          {isFullscreen ? (
            <button
              type="button"
              onClick={onCloseFullscreen}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-accent hover:text-accent"
            >
              Close view
            </button>
          ) : (
            <button
              type="button"
              onClick={onExpand}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-accent hover:text-accent"
            >
              Full view
            </button>
          )}
        </div>
      </header>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY_CARDS.map(({ key, label, icon: Icon }) => (
          <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <Icon className="h-5 w-5 text-accent" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(overview?.totals?.[key])}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <h3 className="text-sm font-semibold text-slate-800">Engagement</h3>
          <dl className="mt-3 grid gap-2 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <dt>Read time</dt>
              <dd>{formatNumber(engagement.averageReadTimeSeconds, { fallback: '—', maximumFractionDigits: 1 })}s</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Completion</dt>
              <dd>{formatPercent(engagement.readCompletionRate)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Click rate</dt>
              <dd>{formatPercent(engagement.clickThroughRate)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Bounce</dt>
              <dd>{formatPercent(engagement.bounceRate)}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <h3 className="text-sm font-semibold text-slate-800">Freshness</h3>
          <dl className="mt-3 grid gap-2 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <dt>Posts</dt>
              <dd>{formatNumber(freshness.postsTracked)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Updated</dt>
              <dd>{formatNumber(freshness.postsUpdatedThisWeek)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Last sync</dt>
              <dd>{formatDate(freshness.lastSyncedAt)}</dd>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Status mix</span>
              <span>
                {formatNumber(freshness.draftCount)} · {formatNumber(freshness.scheduledCount)} · {formatNumber(freshness.publishedCount)} · {formatNumber(freshness.archivedCount)}
              </span>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Trending</h3>
          <div className="mt-3 space-y-3">
            {trendingPosts.length ? (
              trendingPosts.map((post) => (
                <div key={post.postId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{post.title}</p>
                    <p className="text-xs text-slate-500">{post.status ?? 'published'} · {post.views?.toLocaleString?.() ?? post.views} views</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{formatNumber(post.uniqueVisitors)} readers</span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{formatNumber(post.comments)} comments</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No trending data yet.</p>
            )}
          </div>
        </div>
        <form className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" onSubmit={handleSubmit}>
          <h3 className="text-sm font-semibold text-slate-900">Adjust metrics</h3>
          <div className="mt-3 space-y-3">
            <div>
              <label htmlFor="metrics-post" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Post
              </label>
              <select
                id="metrics-post"
                value={formState.postId}
                onChange={(event) => setFormState((current) => ({ ...current, postId: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                required
              >
                <option value="">Select a post</option>
                {posts.map((post) => (
                  <option key={post.id} value={post.id}>
                    {post.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="metrics-views">
                  Views
                </label>
                <input
                  id="metrics-views"
                  type="number"
                  min="0"
                  value={formState.totalViews}
                  onChange={handleFieldChange('totalViews')}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="metrics-visitors">
                  Readers
                </label>
                <input
                  id="metrics-visitors"
                  type="number"
                  min="0"
                  value={formState.uniqueVisitors}
                  onChange={handleFieldChange('uniqueVisitors')}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="metrics-read-time">
                  Read time (s)
                </label>
                <input
                  id="metrics-read-time"
                  type="number"
                  min="0"
                  value={formState.averageReadTimeSeconds}
                  onChange={handleFieldChange('averageReadTimeSeconds')}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="metrics-click-through">
                  Click %
                </label>
                <input
                  id="metrics-click-through"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formState.clickThroughRate}
                  onChange={handleFieldChange('clickThroughRate')}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="metrics-completion">
                  Complete %
                </label>
                <input
                  id="metrics-completion"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formState.readCompletionRate}
                  onChange={handleFieldChange('readCompletionRate')}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="metrics-bounce">
                  Bounce %
                </label>
                <input
                  id="metrics-bounce"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formState.bounceRate}
                  onChange={handleFieldChange('bounceRate')}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="metrics-shares">
                  Shares
                </label>
                <input
                  id="metrics-shares"
                  type="number"
                  min="0"
                  value={formState.shareCount}
                  onChange={handleFieldChange('shareCount')}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="metrics-likes">
                  Likes
                </label>
                <input
                  id="metrics-likes"
                  type="number"
                  min="0"
                  value={formState.likeCount}
                  onChange={handleFieldChange('likeCount')}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="metrics-subscribers">
                  Signups
                </label>
                <input
                  id="metrics-subscribers"
                  type="number"
                  min="0"
                  value={formState.subscriberConversions}
                  onChange={handleFieldChange('subscriberConversions')}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="metrics-comments">
                  Comments
                </label>
                <input
                  id="metrics-comments"
                  type="number"
                  min="0"
                  value={formState.commentCount}
                  onChange={handleFieldChange('commentCount')}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Updating…' : 'Save metrics'}
            </button>
            {statusMessage ? <p className="text-xs text-slate-500">{statusMessage}</p> : null}
          </div>
        </form>
      </div>
    </section>
  );
}
