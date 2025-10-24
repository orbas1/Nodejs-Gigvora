import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DataStatus from '../../components/DataStatus.jsx';
import UserAvatar from '../../components/UserAvatar.jsx';
import useSession from '../../hooks/useSession.js';
import { formatRelativeTime } from '../../utils/date.js';
import {
  ALLOWED_FEED_MEMBERSHIPS,
  COMPOSER_OPTIONS,
  GIF_LIBRARY,
  QUICK_EMOJIS,
} from '../../constants/feedMeta.js';
import analytics from '../../services/analytics.js';
import { COMMUNITY_FALLBACK_SUMMARIES, HOME_GRADIENTS } from './homeThemeTokens.js';

function normalisePost(post, index) {
  if (!post || typeof post !== 'object') {
    return null;
  }

  const typeKey = `${post.type ?? post.category ?? post.opportunityType ?? 'update'}`.toLowerCase();
  const author = post.author ?? post.user ?? post.User ?? {};
  const createdAt = post.createdAt ?? post.publishedAt ?? post.updatedAt ?? null;
  const avatarUrl =
    author.avatarUrl ??
    author.photoUrl ??
    post.avatarUrl ??
    post.authorAvatar ??
    post.authorAvatarUrl ??
    null;

  return {
    id: post.id ?? `recent-${index}`,
    title: post.title ?? post.headline ?? post.summary ?? 'Community update',
    summary: post.summary ?? post.content ?? post.body ?? '',
    type: typeKey,
    authorName: author.name ?? post.authorName ?? 'Gigvora member',
    authorHeadline: author.headline ?? post.authorHeadline ?? author.title ?? 'Marketplace community update',
    createdAt,
    avatarUrl,
    avatarSeed: author.avatarSeed ?? post.avatarSeed ?? author.id ?? post.id ?? post.authorName ?? undefined,
  };
}

const POST_BADGES = {
  update: { label: 'Community update', tone: 'bg-sky-500/10 text-sky-200 ring-1 ring-sky-400/30' },
  media: { label: 'Media drop', tone: 'bg-indigo-500/10 text-indigo-200 ring-1 ring-indigo-400/30' },
  job: { label: 'Job opportunity', tone: 'bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-400/30' },
  gig: { label: 'Gig spotlight', tone: 'bg-orange-500/10 text-orange-200 ring-1 ring-orange-400/30' },
  project: { label: 'Project update', tone: 'bg-blue-500/10 text-blue-200 ring-1 ring-blue-400/30' },
  volunteering: { label: 'Volunteer mission', tone: 'bg-rose-500/10 text-rose-200 ring-1 ring-rose-400/30' },
  launchpad: { label: 'Experience launchpad', tone: 'bg-violet-500/10 text-violet-200 ring-1 ring-violet-400/30' },
  news: { label: 'Gigvora news', tone: 'bg-sky-500/10 text-sky-200 ring-1 ring-sky-400/30' },
};

function resolveBadge(type) {
  const fallback = POST_BADGES.update;
  return POST_BADGES[type] ?? fallback;
}

function buildEmojiStrip(index) {
  const count = 4;
  const start = (index * count) % QUICK_EMOJIS.length;
  const strip = [];
  for (let offset = 0; offset < count; offset += 1) {
    strip.push(QUICK_EMOJIS[(start + offset) % QUICK_EMOJIS.length]);
  }
  return strip;
}

function selectGifHint(index) {
  if (!GIF_LIBRARY.length) {
    return null;
  }
  return GIF_LIBRARY[index % GIF_LIBRARY.length];
}

export function CommunityPulseSection({
  loading,
  error,
  fromCache,
  lastUpdated,
  onRefresh,
  statusLabel,
  homeData,
}) {
  const { session } = useSession();

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

  const hasFeedAccess = useMemo(
    () => membershipList.some((membership) => ALLOWED_FEED_MEMBERSHIPS.has(`${membership}`.toLowerCase())),
    [membershipList],
  );

  const { posts: curatedPosts, showSkeleton } = useMemo(() => {
    const recentPosts = Array.isArray(homeData?.recentPosts) ? homeData.recentPosts : [];
    const normalised = recentPosts
      .map((post, index) => normalisePost(post, index))
      .filter((post) => post && (post.title || post.summary));

    if (loading && !normalised.length) {
      return { posts: [], showSkeleton: true };
    }

    if (hasFeedAccess && normalised.length) {
      return { posts: normalised.slice(0, 3), showSkeleton: false };
    }

    const fallbackPosts = COMPOSER_OPTIONS.slice(0, 3).map((option, index) => ({
      id: `composer-${option.id}`,
      title: `${option.label} spotlight`,
      summary: COMMUNITY_FALLBACK_SUMMARIES[index % COMMUNITY_FALLBACK_SUMMARIES.length] ?? option.description,
      type: option.id,
      authorName: 'Gigvora community',
      authorHeadline: 'Join to see who’s sharing',
      createdAt: null,
      locked: !hasFeedAccess,
      avatarSeed: option.id,
    }));

    return { posts: fallbackPosts, showSkeleton: false };
  }, [hasFeedAccess, homeData?.recentPosts, loading]);

  const handleFeedCta = useCallback(() => {
    analytics.track(
      'web_home_community_pulse_cta',
      {
        action: 'open_feed',
        hasFeedAccess,
        loading,
        cacheHit: Boolean(fromCache),
      },
      { source: 'web_marketing_site' },
    );
  }, [fromCache, hasFeedAccess, loading]);

  return (
    <section className={HOME_GRADIENTS.communityPulse.background}>
      <div className={HOME_GRADIENTS.communityPulse.overlay} />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-300/80">Live community pulse</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">What’s happening now</h2>
            <p className="text-base text-slate-200/80">
              Sample the momentum from the Gigvora timeline. Trending posts, quick reactions, and energy from across the
              network update in real time.
            </p>
          </div>
          <Link
            to="/feed"
            onClick={handleFeedCta}
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/20"
          >
            Dive into the full feed
            <span aria-hidden="true" className="text-lg">
              →
            </span>
          </Link>
        </div>

        <div className="mt-8 rounded-3xl bg-white/90 p-6 text-slate-700 shadow-2xl shadow-slate-900/20 backdrop-blur">
          <DataStatus
            loading={loading}
            error={error}
            fromCache={fromCache}
            lastUpdated={lastUpdated}
            onRefresh={onRefresh}
            statusLabel={statusLabel ?? 'Live community snapshot'}
          />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3" aria-busy={showSkeleton || undefined}>
          {showSkeleton
            ? Array.from({ length: 3 }).map((_, index) => (
                <article
                  key={`pulse-skeleton-${index}`}
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
                >
                  <div className="flex items-center justify-between">
                    <span className="h-6 w-24 animate-pulse rounded-full bg-white/10" aria-hidden="true" />
                    <span className="h-4 w-16 animate-pulse rounded-full bg-white/10" aria-hidden="true" />
                  </div>
                  <div className="mt-6 space-y-3">
                    <span className="block h-5 w-3/4 animate-pulse rounded-full bg-white/10" aria-hidden="true" />
                    <span className="block h-4 w-full animate-pulse rounded-full bg-white/10" aria-hidden="true" />
                    <span className="block h-4 w-5/6 animate-pulse rounded-full bg-white/10" aria-hidden="true" />
                  </div>
                  <div className="mt-8 flex items-center gap-3">
                    <span className="h-12 w-12 animate-pulse rounded-full bg-white/10" aria-hidden="true" />
                    <div className="flex-1 space-y-2">
                      <span className="block h-4 w-1/2 animate-pulse rounded-full bg-white/10" aria-hidden="true" />
                      <span className="block h-3 w-2/3 animate-pulse rounded-full bg-white/10" aria-hidden="true" />
                    </div>
                  </div>
                </article>
              ))
            : curatedPosts.map((post, index) => {
                const badge = resolveBadge(post.type);
                const emojiStrip = buildEmojiStrip(index);
                const gifHint = selectGifHint(index);
                const relativeLabel = post.createdAt ? formatRelativeTime(post.createdAt) : 'Just now';
                return (
                  <article
                    key={post.id}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-white/20 hover:bg-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={post.authorName}
                        imageUrl={post.avatarUrl}
                        seed={post.avatarSeed ?? post.authorName}
                        size="sm"
                        className="ring-1 ring-white/10"
                      />
                      <div className="flex-1 text-xs text-slate-300/90">
                        <p className="font-semibold text-white/90">{post.authorName}</p>
                        <p>{post.authorHeadline}</p>
                      </div>
                      <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/70">
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                        {relativeLabel}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${badge.tone}`}>
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                        {badge.label}
                      </span>
                      <span className="text-xs text-slate-300/80">{relativeLabel}</span>
                    </div>

                    <div className="mt-4 space-y-3">
                      <h3 className="text-lg font-semibold text-white">{post.title}</h3>
                      <p className="text-sm leading-relaxed text-slate-200/80">
                        {post.summary || 'Fresh updates are flowing. Join the conversation to keep pace with the community.'}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-2 text-xl">
                      {emojiStrip.map((emoji) => (
                        <span key={`${post.id}-emoji-${emoji}`} aria-hidden="true">
                          {emoji}
                        </span>
                      ))}
                    </div>

                    {gifHint ? (
                      <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs text-slate-200/80">
                        <p className="font-semibold text-white/90">GIF vibe: {gifHint.label}</p>
                        <p className="mt-1 line-clamp-2">{gifHint.tone}</p>
                      </div>
                    ) : null}

                    {post.locked ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
                        <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/80">
                          Sign in to unlock member stories
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
        </div>

        {!hasFeedAccess ? (
          <p className="mt-8 max-w-xl text-sm text-slate-200/70">
            Create a Gigvora workspace account or switch to a member role to access private posts, comment threads, and the full
            archive.
          </p>
        ) : null}
      </div>
    </section>
  );
}
