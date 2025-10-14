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
  news: {
    label: 'Gigvora News',
    badgeClassName: 'bg-sky-100 text-sky-700',
  },
};

function resolveAuthor(post) {
  const directAuthor = post?.author ?? {};
  const user = post?.User ?? post?.user ?? {};
  const profile = user?.Profile ?? user?.profile ?? {};
  const fallbackName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const name =
    directAuthor.name || post?.authorName || fallbackName || post?.authorTitle || 'Gigvora member';
  const headline =
    directAuthor.headline ||
    post?.authorHeadline ||
    profile.headline ||
    profile.bio ||
    post?.authorTitle ||
    'Marketplace community update';
  const avatarSeed = directAuthor.avatarSeed || post?.authorAvatarSeed || profile.avatarSeed || name;
  return {
    name,
    headline,
    avatarSeed,
  };
}

function resolvePostType(post) {
  const typeKey = (post?.type || post?.category || post?.opportunityType || 'update').toLowerCase();
  const meta = POST_TYPE_META[typeKey] ?? POST_TYPE_META.update;
  return { key: POST_TYPE_META[typeKey] ? typeKey : 'update', ...meta };
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
  const selectedOption = COMPOSER_OPTIONS.find((option) => option.id === mode) ?? COMPOSER_OPTIONS[0];

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!content.trim()) {
      return;
    }
    const payload = {
      type: mode,
      content: content.trim(),
      link: link.trim() || null,
    };
    onCreate(payload);
    setContent('');
    setLink('');
    setMode('update');
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
                    onClick={() => setMode(option.id)}
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
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder={`Tell your network about ${selectedOption.label.toLowerCase()}…`}
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">Your update is routed to followers, connections, and workspace partners.</p>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
              >
                <ShareIcon className="h-4 w-4" /> Publish to live feed
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
  const isNewsPost = postType.key === 'news';
  const heading = isNewsPost ? post.title || post.summary || post.content || author.name : author.name;
  const bodyText = isNewsPost ? post.summary || post.content || '' : post.content || '';
  const linkLabel = isNewsPost ? 'Read full story' : 'View attached resource';
  const publishedTimestamp = post.publishedAt || post.createdAt;
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
        <span>{formatRelativeTime(publishedTimestamp)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-900">{heading}</h2>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${postType.badgeClassName}`}>
          {postType.label}
        </span>
        {isNewsPost && post.source ? (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-600">
            {post.source}
          </span>
        ) : null}
      </div>
      {bodyText ? (
        <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">{bodyText}</p>
      ) : null}
      {isNewsPost && author.name && heading !== author.name ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{author.name}</p>
      ) : null}
      {post.imageUrl ? (
        <figure className="overflow-hidden rounded-3xl border border-slate-200">
          <img
            src={post.imageUrl}
            alt={heading ? `${heading} – Gigvora news` : 'Gigvora news visual'}
            className="h-64 w-full object-cover"
            loading="lazy"
          />
        </figure>
      ) : null}
      {post.link ? (
        <a
          href={post.link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-accent transition hover:border-accent/50 hover:bg-white"
        >
          <ArrowPathIcon className="h-4 w-4" />
          {linkLabel}
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
    <div className="rounded-3xl border border-emerald-200 bg-white/95 p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-emerald-700">Live moments</p>
        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{moments.length} pulsing</span>
      </div>
      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">
            {activeMoment.icon}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{activeMoment.tag}</p>
            <p className="mt-1 text-sm font-semibold text-emerald-900">{activeMoment.title}</p>
            <p className="mt-2 text-xs text-emerald-600">
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
                ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-soft'
                : 'border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600'
            }`}
          >
            <span className="flex items-center gap-2">
              <span aria-hidden="true">{moment.icon}</span>
              {moment.title.slice(0, 60)}{moment.title.length > 60 ? '…' : ''}
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
    <aside className="space-y-6">
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
    return [...localPosts, ...fetched];
  }, [data, localPosts]);

  const engagementSignals = useEngagementSignals({ session, feedPosts: posts });

  useEffect(() => {
    if (!analyticsTrackedRef.current && !loading && posts.length) {
      analytics.track('web_feed_viewed', { postCount: posts.length, cacheHit: fromCache }, { source: 'web_app' });
      analyticsTrackedRef.current = true;
    }
  }, [loading, posts, fromCache]);

  const handleShareClick = () => {
    analytics.track('web_feed_share_click', { location: 'feed_page' }, { source: 'web_app' });
  };

  const handleComposerCreate = (payload) => {
    const author = {
      name: session?.name ?? 'You',
      headline: session?.title ?? 'Shared via Gigvora',
      avatarSeed: session?.avatarSeed ?? session?.name ?? 'You',
    };
    const newPost = {
      id: `local-${Date.now()}`,
      content: payload.content,
      summary: payload.content,
      type: payload.type,
      link: payload.link,
      createdAt: new Date().toISOString(),
      authorName: author.name,
      authorHeadline: author.headline,
      authorAvatarSeed: author.avatarSeed,
      author,
      User: {
        firstName: session?.name,
        Profile: {
          avatarSeed: session?.avatarSeed,
          headline: session?.title,
        },
      },
    };
    setLocalPosts((previous) => [newPost, ...previous]);
    analytics.track('web_feed_post_created', { type: payload.type }, { source: 'web_app' });
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
          <div className="space-y-8">
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
