import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  BriefcaseIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  ChatBubbleOvalLeftIcon,
  FaceSmileIcon,
  HandRaisedIcon,
  HeartIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  PresentationChartBarIcon,
  RocketLaunchIcon,
  ShareIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import useCachedResource from '../hooks/useCachedResource.js';
import { apiClient } from '../services/apiClient.js';
import analytics from '../services/analytics.js';
import { formatRelativeTime } from '../utils/date.js';
import useSession from '../hooks/useSession.js';
import useEngagementSignals from '../hooks/useEngagementSignals.js';

const COMPOSER_OPTIONS = [
  {
    id: 'update',
    label: 'Update',
    description: 'Share wins, milestones, and shout-outs with your network.',
    icon: FaceSmileIcon,
  },
  {
    id: 'media',
    label: 'Media',
    description: 'Upload demos, decks, and reels directly to your feed.',
    icon: PhotoIcon,
  },
  {
    id: 'job',
    label: 'Job',
    description: 'List a permanent, contract, or interim opportunity.',
    icon: BriefcaseIcon,
  },
  {
    id: 'gig',
    label: 'Gig',
    description: 'Promote a specialist engagement with clear deliverables.',
    icon: PresentationChartBarIcon,
  },
  {
    id: 'project',
    label: 'Project',
    description: 'Rally collaborators around a multi-disciplinary brief.',
    icon: UsersIcon,
  },
  {
    id: 'volunteering',
    label: 'Volunteering',
    description: 'Mobilise talent towards purpose-led community missions.',
    icon: HandRaisedIcon,
  },
  {
    id: 'launchpad',
    label: 'Launchpad',
    description: 'Showcase cohort-based Experience Launchpad programmes.',
    icon: RocketLaunchIcon,
  },
];

const POST_TYPE_META = {
  update: {
    label: 'Update',
    badgeClassName: 'bg-slate-100 text-slate-700',
  },
  media: {
    label: 'Media drop',
    badgeClassName: 'bg-indigo-100 text-indigo-700',
  },
  job: {
    label: 'Job opportunity',
    badgeClassName: 'bg-emerald-100 text-emerald-700',
  },
  gig: {
    label: 'Gig opportunity',
    badgeClassName: 'bg-orange-100 text-orange-700',
  },
  project: {
    label: 'Project update',
    badgeClassName: 'bg-blue-100 text-blue-700',
  },
  volunteering: {
    label: 'Volunteer mission',
    badgeClassName: 'bg-rose-100 text-rose-700',
  },
  launchpad: {
    label: 'Experience Launchpad',
    badgeClassName: 'bg-violet-100 text-violet-700',
  },
};

const ALLOWED_FEED_MEMBERSHIPS = new Set(['user', 'freelancer', 'agency', 'company', 'headhunter', 'mentor', 'admin']);

function resolveAuthor(post) {
  const user = post?.User ?? post?.user ?? {};
  const profile = user?.Profile ?? user?.profile ?? {};
  const name = post?.authorName || [user.firstName, user.lastName].filter(Boolean).join(' ');
  const headline =
    post?.authorHeadline || profile.headline || profile.bio || post?.authorTitle || 'Marketplace community update';
  return {
    name: name || 'Gigvora member',
    headline,
    avatarSeed: profile.avatarSeed ?? name ?? 'Gigvora member',
  };
}

function resolvePostType(post) {
  const typeKey = (post?.type || post?.category || post?.opportunityType || 'update').toLowerCase();
  return POST_TYPE_META[typeKey] ?? POST_TYPE_META.update;
}

function normaliseFeedPost(post, fallbackSession) {
  if (!post || typeof post !== 'object') {
    return null;
  }

  const createdAt = post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString();
  const normalisedType = (post.type || post.category || post.opportunityType || 'update').toLowerCase();

  const derivedAuthorName =
    post.authorName ||
    [post.User?.firstName, post.User?.lastName, post.User?.name].filter(Boolean).join(' ') ||
    fallbackSession?.name ||
    'Gigvora member';

  const normalised = {
    id: post.id ?? `local-${Date.now()}`,
    content: post.content ?? '',
    type: normalisedType,
    link: post.link ?? post.resourceLink ?? null,
    createdAt,
    authorName: derivedAuthorName,
    authorHeadline:
      post.authorHeadline ||
      post.authorTitle ||
      post.User?.Profile?.headline ||
      post.User?.Profile?.bio ||
      fallbackSession?.title ||
      'Marketplace community update',
    reactions: post.reactions ?? { likes: typeof post.likes === 'number' ? post.likes : 0 },
    comments: Array.isArray(post.comments) ? post.comments : [],
    User:
      post.User ??
      (fallbackSession
        ? {
            firstName: fallbackSession.name,
            Profile: {
              avatarSeed: fallbackSession.avatarSeed ?? fallbackSession.name,
              headline: fallbackSession.title,
            },
          }
        : undefined),
  };

  return normalised;
}

function buildMockComments(post) {
  return [
    {
      id: `${post.id}-c1`,
      author: 'Anita Singh',
      headline: 'Head of Product, Atlas Studio',
      message: 'Love seeing this momentum – the community will be thrilled!',
      createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
      replies: [
        {
          id: `${post.id}-r1`,
          author: 'Marco Giordano',
          headline: 'Growth Lead, Nova Labs',
          message: 'Totally agree. Let’s cross-promote this with the Berlin crew.',
          createdAt: new Date(Date.now() - 1000 * 60 * 21).toISOString(),
        },
      ],
    },
    {
      id: `${post.id}-c2`,
      author: 'Zoe North',
      headline: 'Community Manager',
      message: 'Adding this to the weekly wrap – congrats team! 🎉',
      createdAt: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
      replies: [],
    },
  ];
}

function normaliseComments(post) {
  if (Array.isArray(post?.comments) && post.comments.length) {
    return post.comments.map((comment, index) => ({
      id: comment.id ?? `${post.id}-comment-${index + 1}`,
      author: comment.author ?? comment.user?.name ?? 'Community member',
      headline: comment.authorHeadline ?? comment.user?.title ?? comment.user?.role ?? 'Gigvora member',
      message: comment.body ?? comment.content ?? comment.message ?? '',
      createdAt: comment.createdAt ?? new Date().toISOString(),
      replies: Array.isArray(comment.replies)
        ? comment.replies.map((reply, replyIndex) => ({
            id: reply.id ?? `${post.id}-comment-${index + 1}-reply-${replyIndex + 1}`,
            author: reply.author ?? reply.user?.name ?? 'Community member',
            headline: reply.authorHeadline ?? reply.user?.title ?? reply.user?.role ?? 'Gigvora member',
            message: reply.body ?? reply.content ?? reply.message ?? '',
            createdAt: reply.createdAt ?? new Date().toISOString(),
          }))
        : [],
    }));
  }
  return buildMockComments(post);
}

function FeedComposer({ onCreate, session }) {
  const [mode, setMode] = useState('update');
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const selectedOption = COMPOSER_OPTIONS.find((option) => option.id === mode) ?? COMPOSER_OPTIONS[0];

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!content.trim() || submitting) {
      return;
    }
    const payload = {
      type: mode,
      content: content.trim(),
      link: link.trim() || null,
    };
    setSubmitting(true);
    setError(null);
    try {
      await Promise.resolve(onCreate(payload));
      setContent('');
      setLink('');
      setMode('update');
    } catch (composerError) {
      const message = composerError?.message || 'We could not publish your update. Please try again in a moment.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/95 shadow-soft">
      <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">Share with your network</p>
          <p className="text-xs text-slate-500">Updates appear instantly across teams you collaborate with.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-accent">
          <ChatBubbleOvalLeftEllipsisIcon className="h-4 w-4" />
          Live
        </span>
      </div>
      <form onSubmit={handleSubmit} className="px-6 py-5">
        <div className="flex items-start gap-4">
          <UserAvatar name={session?.name} seed={session?.avatarSeed ?? session?.name} size="md" />
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap gap-2">
              {COMPOSER_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive = option.id === mode;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      if (!submitting) {
                        setMode(option.id);
                      }
                    }}
                    disabled={submitting}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                      isActive
                        ? 'border-accent bg-accent text-white shadow-soft'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-accent/50 hover:text-accent'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500">{selectedOption.description}</p>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder={`Tell your network about ${selectedOption.label.toLowerCase()}…`}
              disabled={submitting}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="feed-share-link" className="text-xs font-medium text-slate-600">
                  Attach a resource (deck, doc, or listing URL)
                </label>
                <input
                  id="feed-share-link"
                  value={link}
                  onChange={(event) => setLink(event.target.value)}
                  placeholder="https://"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2 text-xs text-slate-500">
                <p className="font-medium text-slate-600">Need inspiration?</p>
                <p>
                  Opportunity posts automatically appear inside Explorer with the right filters so talent can discover them alongside
                  jobs, gigs, projects, volunteering missions, and Launchpad cohorts.
                </p>
              </div>
            </div>
            {error ? (
              <p className="rounded-2xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">Your update is routed to followers, connections, and workspace partners.</p>
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white shadow-soft transition ${
                  submitting || !content.trim()
                    ? 'cursor-not-allowed bg-accent/50'
                    : 'bg-accent hover:bg-accentDark'
                }`}
              >
                {submitting ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <ShareIcon className="h-4 w-4" />}
                {submitting ? 'Publishing…' : 'Publish to live feed'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function FeedComment({ comment }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 text-sm text-slate-700">
      <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
        <span className="font-semibold text-slate-700">{comment.author}</span>
        <span>{formatRelativeTime(comment.createdAt)}</span>
      </div>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{comment.headline}</p>
      <p className="mt-3 text-sm text-slate-700">{comment.message}</p>
      {Array.isArray(comment.replies) && comment.replies.length ? (
        <div className="mt-3 space-y-2 border-l-2 border-accent/30 pl-4">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="rounded-2xl bg-white/90 p-3 text-sm text-slate-700">
              <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                <span className="font-semibold text-slate-700">{reply.author}</span>
                <span>{formatRelativeTime(reply.createdAt)}</span>
              </div>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{reply.headline}</p>
              <p className="mt-2 text-sm text-slate-700">{reply.message}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FeedPostCard({ post, onShare }) {
  const author = resolveAuthor(post);
  const postType = resolvePostType(post);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(() => {
    if (typeof post.reactions?.likes === 'number') {
      return post.reactions.likes;
    }
    if (typeof post.likes === 'number') {
      return post.likes;
    }
    return Math.max(7, Math.round(Math.random() * 32));
  });
  const [comments, setComments] = useState(() => normaliseComments(post));
  const [commentDraft, setCommentDraft] = useState('');

  const handleLike = () => {
    setLiked((previous) => {
      const nextLiked = !previous;
      setLikeCount((current) => current + (nextLiked ? 1 : -1));
      analytics.track('web_feed_reaction_click', { postId: post.id, action: 'like', like: nextLiked }, { source: 'web_app' });
      return nextLiked;
    });
  };

  const handleCommentSubmit = (event) => {
    event.preventDefault();
    if (!commentDraft.trim()) {
      return;
    }
    const newComment = {
      id: `${post.id}-draft-${Date.now()}`,
      author: 'You',
      headline: 'Shared via Gigvora',
      message: commentDraft.trim(),
      createdAt: new Date().toISOString(),
      replies: [],
    };
    setComments((previous) => [newComment, ...previous]);
    setCommentDraft('');
    analytics.track('web_feed_comment_submit', { postId: post.id }, { source: 'web_app' });
  };

  return (
    <article className="space-y-5 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="inline-flex items-center gap-2">
          <UserAvatar name={author.name} seed={author.avatarSeed} size="xs" showGlow={false} />
          <span>{author.headline}</span>
        </span>
        <span>{formatRelativeTime(post.createdAt)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-900">{author.name}</h2>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${postType.badgeClassName}`}>
          {postType.label}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">{post.content}</p>
      {post.link ? (
        <a
          href={post.link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-accent transition hover:border-accent/50 hover:bg-white"
        >
          <ArrowPathIcon className="h-4 w-4" />
          View attached resource
        </a>
      ) : null}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <button
          type="button"
          onClick={handleLike}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 transition ${
            liked ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-200 hover:border-rose-200 hover:text-rose-600'
          }`}
        >
          <HeartIcon className="h-4 w-4" />
          {liked ? 'Liked' : 'Like'} · {likeCount}
        </button>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-slate-500">
          <ChatBubbleOvalLeftIcon className="h-4 w-4" /> {comments.length} comments
        </span>
        <button
          type="button"
          onClick={() => {
            analytics.track('web_feed_share_click', { postId: post.id, location: 'feed_item' }, { source: 'web_app' });
            if (typeof onShare === 'function') {
              onShare(post);
            }
          }}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 transition hover:border-accent hover:text-accent"
        >
          <ShareIcon className="h-4 w-4" /> Share externally
        </button>
      </div>
      <form onSubmit={handleCommentSubmit} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <label htmlFor={`comment-${post.id}`} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Add a comment
        </label>
        <textarea
          id={`comment-${post.id}`}
          value={commentDraft}
          onChange={(event) => setCommentDraft(event.target.value)}
          rows={2}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          placeholder="Offer feedback, drop a resource link, or shout out collaborators"
        />
        <div className="mt-3 flex items-center justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-accentDark"
          >
            <PaperAirplaneIcon className="h-4 w-4" /> Post comment
          </button>
        </div>
      </form>
      <div className="space-y-3">
        {comments.map((comment) => (
          <FeedComment key={comment.id} comment={comment} />
        ))}
      </div>
    </article>
  );
}

function LiveMomentsTicker({ moments = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!moments.length || typeof window === 'undefined') {
      return undefined;
    }
    const interval = window.setInterval(() => {
      setActiveIndex((previous) => (previous + 1) % moments.length);
    }, 6000);
    return () => window.clearInterval(interval);
  }, [moments]);

  if (!moments.length) {
    return null;
  }

  const activeMoment = moments[activeIndex];

  return (
    <div className="rounded-3xl border border-accent/30 bg-white/95 p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-accent">Live moments</p>
        <span className="text-xs font-semibold uppercase tracking-wide text-accentDark">{moments.length} pulsing</span>
      </div>
      <div className="mt-4 rounded-2xl border border-accent/30 bg-accentSoft px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">
            {activeMoment.icon}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accentDark">{activeMoment.tag}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{activeMoment.title}</p>
            <p className="mt-2 text-xs text-slate-500">
              Updated {formatRelativeTime(activeMoment.timestamp)}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        {moments.map((moment, index) => (
          <button
            key={moment.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`flex items-center justify-between rounded-2xl border px-4 py-2 text-left text-xs transition ${
              index === activeIndex
                ? 'border-accent bg-accentSoft text-accent shadow-soft'
                : 'border-slate-200 text-slate-500 hover:border-accent/60 hover:text-accent'
            }`}
          >
            <span className="flex items-center gap-2">
              <span aria-hidden="true">{moment.icon}</span>
              {(moment.title || 'Live update').slice(0, 60)}
              {(moment.title || '').length > 60 ? '…' : ''}
            </span>
            <span className="text-[0.65rem] uppercase tracking-wide text-slate-400">
              {formatRelativeTime(moment.timestamp)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FeedSidebar({ session, insights }) {
  const { interests = [], connectionSuggestions = [], groupSuggestions = [], liveMoments = [] } = insights ?? {};
  return (
    <aside className="order-2 space-y-6 lg:order-1">
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
        <div className="flex items-center gap-4">
          <UserAvatar name={session?.name ?? 'Member'} seed={session?.avatarSeed ?? session?.name} size="lg" />
          <div>
            <p className="text-base font-semibold text-slate-900">{session?.name ?? 'Gigvora member'}</p>
            <p className="text-sm text-slate-500">{session?.title ?? 'Marketplace professional'}</p>
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 text-center">
          <div className="rounded-2xl bg-slate-50 px-3 py-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Followers</dt>
            <dd className="mt-2 text-xl font-semibold text-slate-900">{session?.followers ?? '—'}</dd>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Connections</dt>
            <dd className="mt-2 text-xl font-semibold text-slate-900">{session?.connections ?? '—'}</dd>
          </div>
        </dl>
        <div className="mt-6 space-y-4 text-sm text-slate-600">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Companies</p>
            <ul className="mt-2 space-y-1">
              {(session?.companies ?? ['Add your company']).map((company) => (
                <li key={company} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {company}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agencies & collectives</p>
            <ul className="mt-2 space-y-1">
              {(session?.agencies ?? ['Join or create an agency']).map((agency) => (
                <li key={agency} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {agency}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account types</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {(session?.accountTypes ?? ['Professional']).map((type) => (
                <li key={type} className="rounded-full border border-accent/40 bg-accentSoft px-3 py-1 text-xs font-semibold text-accent">
                  {type}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-6 space-y-2 text-sm">
          <Link
            to="/settings"
            className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-2 text-slate-600 transition hover:border-accent/60 hover:text-accent"
          >
            Settings
            <ArrowPathIcon className="h-4 w-4" />
          </Link>
          <Link
            to="/trust-center"
            className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-2 text-slate-600 transition hover:border-accent/60 hover:text-accent"
          >
            Trust centre
            <ArrowPathIcon className="h-4 w-4" />
          </Link>
          <Link
            to="/auto-assign"
            className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-2 text-slate-600 transition hover:border-accent/60 hover:text-accent"
          >
            Auto-assign queue
            <ArrowPathIcon className="h-4 w-4" />
          </Link>
        </div>
        {interests.length ? (
          <div className="mt-6">
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
      <LiveMomentsTicker moments={liveMoments} />
      {connectionSuggestions.length ? (
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Suggested connections</p>
            <Link
              to="/connections"
              className="text-xs font-semibold text-accent transition hover:text-accentDark"
            >
              View all
            </Link>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {connectionSuggestions.slice(0, 4).map((connection) => (
              <li key={connection.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="flex items-center gap-3">
                  <UserAvatar name={connection.name} seed={connection.name} size="xs" showGlow={false} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{connection.name}</p>
                    <p className="text-xs text-slate-500">{connection.headline}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">{connection.reason}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>{connection.location}</span>
                  <span>{connection.mutualConnections} mutual</span>
                </div>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent/30 px-4 py-2 text-xs font-semibold text-accent transition hover:border-accent hover:bg-accentSoft"
                >
                  Connect
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {groupSuggestions.length ? (
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Groups to join</p>
            <Link
              to="/groups"
              className="text-xs font-semibold text-accent transition hover:text-accentDark"
            >
              Explore groups
            </Link>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {groupSuggestions.slice(0, 4).map((group) => (
              <li key={group.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                <p className="mt-1 text-xs text-slate-500">{group.description}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>{group.members} members</span>
                  <span>{group.focus.slice(0, 2).join(' • ')}</span>
                </div>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Request invite
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="rounded-3xl border border-accent/30 bg-accentSoft p-6 text-sm text-slate-700">
        <p className="text-sm font-semibold text-accentDark">Explorer consolidation</p>
        <p className="mt-2 text-sm text-slate-700">
          Jobs, gigs, projects, Experience Launchpad cohorts, volunteer opportunities, and talent discovery now live inside the
          Explorer. Use filters to pivot between freelancers, companies, people, groups, headhunters, and agencies without leaving
          your flow.
        </p>
        <a
          href="/search"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-soft transition hover:bg-accentDark"
        >
          Open Explorer
        </a>
      </div>
    </aside>
  );
}

export default function FeedPage() {
  const analyticsTrackedRef = useRef(false);
  const navigate = useNavigate();
  const { session, isAuthenticated } = useSession();
  const [localPosts, setLocalPosts] = useState([]);
  const { data, error, loading, fromCache, lastUpdated, refresh } = useCachedResource(
    'feed:posts',
    ({ signal }) => apiClient.get('/feed', { signal }),
    { ttl: 1000 * 60 * 2 },
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const posts = useMemo(() => {
    const fetched = Array.isArray(data) ? data : [];
    const deduped = [];
    const seen = new Set();
    [...localPosts, ...fetched].forEach((post) => {
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
  }, [data, localPosts]);

  const engagementSignals = useEngagementSignals({ session, feedPosts: posts });

  const membershipList = useMemo(
    () => (Array.isArray(session?.memberships) ? session.memberships.filter(Boolean) : []),
    [session?.memberships],
  );

  const hasFeedAccess = useMemo(
    () => membershipList.some((membership) => ALLOWED_FEED_MEMBERSHIPS.has(membership)),
    [membershipList],
  );

  useEffect(() => {
    if (!analyticsTrackedRef.current && !loading && posts.length) {
      analytics.track('web_feed_viewed', { postCount: posts.length, cacheHit: fromCache }, { source: 'web_app' });
      analyticsTrackedRef.current = true;
    }
  }, [loading, posts, fromCache]);

  const handleShareClick = () => {
    analytics.track('web_feed_share_click', { location: 'feed_page' }, { source: 'web_app' });
  };

  const handleComposerCreate = async (payload) => {
    if (!hasFeedAccess) {
      throw new Error('Your current workspace role cannot publish to the live feed. Switch roles to continue.');
    }

    if (!session?.id) {
      throw new Error('We could not confirm your account. Please sign in again and retry.');
    }

    const optimisticId = `local-${Date.now()}`;
    const optimisticPost = {
      id: optimisticId,
      content: payload.content,
      type: payload.type,
      link: payload.link,
      createdAt: new Date().toISOString(),
      authorName: session?.name,
      authorHeadline: session?.title,
      reactions: { likes: 0 },
      comments: [],
      User: {
        firstName: session?.name,
        lastName: '',
        Profile: {
          avatarSeed: session?.avatarSeed,
          headline: session?.title,
        },
      },
    };

    setLocalPosts((previous) => [optimisticPost, ...previous]);
    analytics.track('web_feed_post_created', { type: payload.type, optimistic: true }, { source: 'web_app' });

    try {
      const response = await apiClient.post(
        '/feed',
        {
          userId: session.id,
          content: payload.content,
          visibility: 'public',
          type: payload.type,
          link: payload.link,
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
              User: normalised.User ?? post.User,
              reactions: normalised.reactions ?? post.reactions,
            };
          }),
        );
      }

      analytics.track('web_feed_post_synced', { type: payload.type }, { source: 'web_app' });
      await refresh({ force: true });
    } catch (error) {
      setLocalPosts((previous) => previous.filter((post) => post.id !== optimisticId));
      analytics.track(
        'web_feed_post_failed',
        {
          type: payload.type,
          status: error instanceof apiClient.ApiError ? error.status ?? 'api_error' : 'unknown_error',
        },
        { source: 'web_app' },
      );

      if (error instanceof apiClient.ApiError) {
        throw new Error(error.body?.message || 'The live feed service rejected your update. Please try again.');
      }

      throw new Error('We were unable to reach the live feed service. Check your connection and retry.');
    }
  };

  const renderSkeleton = () => (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <article key={index} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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
          {loading ? 'Syncing feed…' : 'No live updates yet. Share something to start the conversation!'}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {posts.map((post) => (
          <FeedPostCard key={post.id} post={post} onShare={handleShareClick} />
        ))}
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
            eyebrow="Live feed"
            title="Switch to an eligible workspace"
            description="Your current role does not grant access to the community feed. Swap to a user, freelancer, agency, mentor, headhunter, or company workspace to engage in real time."
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
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft">
            <h2 className="text-base font-semibold text-slate-900">Why access is restricted</h2>
            <p className="mt-3 text-sm text-slate-600">
              The live feed surfaces opportunities and updates that are tailored to operating roles inside Gigvora. Restricting access keeps sensitive launch information safe and ensures moderation coverage. Switch to an eligible membership above or contact support for an access review.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute -right-32 top-24 h-72 w-72 rounded-full bg-emerald-200/40 blur-[140px]" aria-hidden="true" />
      <div className="absolute -left-16 bottom-10 h-80 w-80 rounded-full bg-accent/10 blur-[140px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <PageHeader
          eyebrow="Live feed"
          title="Real-time stories and opportunity drops"
          description="Stay close to the community pulse. React, reply, and share launches, roles, gigs, volunteer missions, and Experience Launchpad cohorts as they happen."
          actions={
            <button
              type="button"
              onClick={handleShareClick}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
            >
              Share externally
            </button>
          }
          meta={
            <DataStatus
              loading={loading}
              fromCache={fromCache}
              lastUpdated={lastUpdated}
              onRefresh={() => refresh({ force: true })}
            />
          }
        />
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(260px,0.75fr),minmax(0,2fr)] lg:items-start">
          <FeedSidebar session={session} insights={engagementSignals} />
          <div className="order-1 space-y-8 lg:order-2">
            <FeedComposer onCreate={handleComposerCreate} session={session} />
            {error && !loading ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                We’re showing the latest cached updates while we reconnect. {error.message || 'Please try again shortly.'}
              </div>
            ) : null}
            {loading && !posts.length ? renderSkeleton() : renderPosts()}
          </div>
        </div>
      </div>
    </section>
  );
}
