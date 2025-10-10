import { useEffect, useMemo, useRef } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import useCachedResource from '../hooks/useCachedResource.js';
import { apiClient } from '../services/apiClient.js';
import analytics from '../services/analytics.js';
import { formatRelativeTime } from '../utils/date.js';

function resolveAuthor(post) {
  const user = post?.User ?? post?.user ?? {};
  const profile = user?.Profile ?? user?.profile ?? {};
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const headline = profile.headline || profile.bio || null;
  return {
    name: name || 'Gigvora member',
    headline,
  };
}

export default function FeedPage() {
  const analyticsTrackedRef = useRef(false);
  const {
    data,
    error,
    loading,
    fromCache,
    lastUpdated,
    refresh,
  } = useCachedResource(
    'feed:posts',
    ({ signal }) => apiClient.get('/feed', { signal }),
    { ttl: 1000 * 60 * 2 },
  );

  const posts = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  useEffect(() => {
    if (!analyticsTrackedRef.current && !loading && posts.length) {
      analytics.track(
        'web_feed_viewed',
        { postCount: posts.length, cacheHit: fromCache },
        { source: 'web_app' },
      );
      analyticsTrackedRef.current = true;
    }
  }, [loading, posts, fromCache]);

  const handleShareClick = () => {
    analytics.track('web_feed_share_click', { location: 'feed_page' }, { source: 'web_app' });
  };

  const renderSkeleton = () => (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <article
          key={index}
          className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
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

  const renderPosts = () => {
    if (!posts.length) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          {loading
            ? 'Syncing feed…'
            : 'No live updates yet. Follow teams and projects to personalise your feed.'}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {posts.map((post) => {
          const author = resolveAuthor(post);
          return (
            <article
              key={post.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{author.headline ?? 'Marketplace community update'}</span>
                <span>{formatRelativeTime(post.createdAt)}</span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-slate-900">{author.name}</h2>
              <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{post.content}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() =>
                    analytics.track(
                      'web_feed_reaction_click',
                      { postId: post.id, action: 'react' },
                      { source: 'web_app' },
                    )
                  }
                  className="rounded-full border border-slate-200 px-4 py-2 transition hover:border-accent hover:text-accent"
                >
                  React
                </button>
                <button
                  type="button"
                  onClick={() =>
                    analytics.track(
                      'web_feed_comment_click',
                      { postId: post.id },
                      { source: 'web_app' },
                    )
                  }
                  className="rounded-full border border-slate-200 px-4 py-2 transition hover:border-accent hover:text-accent"
                >
                  Comment
                </button>
                <button
                  type="button"
                  onClick={() =>
                    analytics.track(
                      'web_feed_share_click',
                      { postId: post.id, location: 'feed_item' },
                      { source: 'web_app' },
                    )
                  }
                  className="rounded-full border border-slate-200 px-4 py-2 transition hover:border-accent hover:text-accent"
                >
                  Share
                </button>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Live feed"
          title="Real-time stories, launches, and wins"
          description="See what freelancers, agencies, companies, and communities are building across the Gigvora network."
          actions={(
            <button
              type="button"
              onClick={handleShareClick}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
            >
              Share an update
            </button>
          )}
          meta={
            <DataStatus
              loading={loading}
              fromCache={fromCache}
              lastUpdated={lastUpdated}
              onRefresh={() => refresh({ force: true })}
            />
          }
        />
        {error && !loading ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            We’re showing the latest cached updates while we reconnect. {error.message || 'Please try again shortly.'}
          </div>
        ) : null}
        {loading && !posts.length ? renderSkeleton() : renderPosts()}
      </div>
    </section>
  );
}
