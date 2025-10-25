import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  ChatBubbleOvalLeftIcon,
  FaceSmileIcon,
  HeartIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import EmojiQuickPickerPopover from '../components/popovers/EmojiQuickPickerPopover.jsx';
import GifSuggestionPopover from '../components/popovers/GifSuggestionPopover.jsx';
import useCachedResource from '../hooks/useCachedResource.js';
import { apiClient } from '../services/apiClient.js';
import {
  listFeedPosts,
  createFeedPost,
  updateFeedPost,
  deleteFeedPost,
  reactToFeedPost,
  listFeedComments,
  createFeedComment,
  createFeedReply,
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
import { ALLOWED_FEED_MEMBERSHIPS, COMPOSER_OPTIONS } from '../constants/feedMeta.js';

const DEFAULT_EDIT_DRAFT = {
  title: '',
  content: '',
  link: '',
  type: 'update',
};

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

const QUICK_REPLY_SUGGESTIONS = [
  'This is a fantastic milestone – congratulations! 👏',
  'Looping the team so we can amplify this right away.',
  'Let’s sync offline about how we can support the rollout.',
  'Added this into the launch tracker so nothing slips.',
];
const MAX_CONTENT_LENGTH = 2200;
const FEED_PAGE_SIZE = 12;
const DEFAULT_FEED_VIRTUAL_CHUNK_SIZE = 5;
const FEED_VIRTUAL_MIN_CHUNK_SIZE = 4;
const FEED_VIRTUAL_MAX_CHUNK_SIZE = 12;
const DEFAULT_VIEWPORT_HEIGHT = 900;
const FEED_VIRTUAL_THRESHOLD = 14;
const DEFAULT_CHUNK_ESTIMATE = 420;
const OPPORTUNITY_POST_TYPES = new Set(['job', 'gig', 'project', 'launchpad', 'volunteering', 'mentorship']);

export function resolveAuthor(post) {
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

export function resolvePostType(post) {
  const typeKey = (post?.type || post?.category || post?.opportunityType || 'update').toLowerCase();
  const meta = POST_TYPE_META[typeKey] ?? POST_TYPE_META.update;
  return { key: POST_TYPE_META[typeKey] ? typeKey : 'update', ...meta };
}

export function extractMediaAttachments(post) {
  const attachments = [];
  if (Array.isArray(post?.mediaAttachments)) {
    post.mediaAttachments
      .filter(Boolean)
      .forEach((attachment, index) => {
        if (!attachment?.url && !attachment?.src) {
          return;
        }
        attachments.push({
          id: attachment.id ?? `${post.id ?? 'media'}-${index + 1}`,
          type: attachment.type ?? (attachment.url?.endsWith('.gif') ? 'gif' : 'image'),
          url: attachment.url ?? attachment.src,
          alt: attachment.alt ?? attachment.caption ?? post.title ?? 'Feed media attachment',
        });
      });
  }

  const legacyUrl = post?.imageUrl || post?.mediaUrl || post?.coverImage;
  if (legacyUrl) {
    attachments.push({
      id: `${post?.id ?? 'media'}-legacy`,
      type: legacyUrl.endsWith('.gif') ? 'gif' : 'image',
      url: legacyUrl,
      alt: post?.imageAlt || post?.title || 'Feed media attachment',
    });
  }

  return attachments;
}

export function normaliseFeedPost(post, fallbackSession) {
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
    summary: post.summary ?? post.content ?? '',
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
    mediaAttachments: extractMediaAttachments(post),
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

  if (post.title) {
    normalised.title = post.title;
  }
  if (post.source) {
    normalised.source = post.source;
  }

  return normalised;
}

function normaliseCommentEntry(comment, { index = 0, prefix, fallbackAuthor } = {}) {
  if (!comment) {
    return null;
  }

  const basePrefix = prefix || 'comment';
  const user = comment.user ?? comment.User ?? {};
  const profile = user.Profile ?? user.profile ?? {};
  const id = comment.id ?? `${basePrefix}-${index + 1}`;
  const candidateAuthor =
    comment.author ??
    comment.authorName ??
    [user.firstName, user.lastName, user.name].filter(Boolean).join(' ');
  const author = (() => {
    if (typeof candidateAuthor === 'string' && candidateAuthor.trim().length) {
      return candidateAuthor.trim();
    }
    if (typeof fallbackAuthor?.name === 'string' && fallbackAuthor.name.trim().length) {
      return fallbackAuthor.name.trim();
    }
    return 'Community member';
  })();

  const candidateHeadline =
    comment.authorHeadline ??
    user.title ??
    user.role ??
    profile.headline ??
    profile.bio ??
    fallbackAuthor?.headline;
  const headline =
    typeof candidateHeadline === 'string' && candidateHeadline.trim().length
      ? candidateHeadline.trim()
      : 'Gigvora member';
  const message = (comment.body ?? comment.content ?? comment.message ?? comment.text ?? '').toString();
  const createdAt = comment.createdAt ?? comment.updatedAt ?? new Date().toISOString();
  const replies = Array.isArray(comment.replies)
    ? comment.replies
        .map((reply, replyIndex) =>
          normaliseCommentEntry(reply, {
            index: replyIndex,
            prefix: `${id}-reply`,
            fallbackAuthor: reply.user ?? fallbackAuthor ?? user,
          }),
        )
        .filter(Boolean)
    : [];

  return {
    id,
    author,
    headline,
    message,
    createdAt,
    replies,
  };
}

function normaliseCommentList(comments, post) {
  if (!Array.isArray(comments)) {
    return [];
  }
  const prefixBase = `${post?.id ?? 'feed-post'}-comment`;
  return comments
    .map((comment, index) => normaliseCommentEntry(comment, { index, prefix: prefixBase, fallbackAuthor: comment?.user }))
    .filter(Boolean);
}

function normaliseCommentsFromResponse(response, post) {
  if (!response) {
    return [];
  }
  if (Array.isArray(response)) {
    return normaliseCommentList(response, post);
  }
  if (Array.isArray(response.items)) {
    return normaliseCommentList(response.items, post);
  }
  if (Array.isArray(response.data)) {
    return normaliseCommentList(response.data, post);
  }
  if (Array.isArray(response.results)) {
    return normaliseCommentList(response.results, post);
  }
  if (Array.isArray(response.comments)) {
    return normaliseCommentList(response.comments, post);
  }
  return [];
}

function normaliseSingleComment(response, post, fallbackAuthor, { prefix } = {}) {
  const list = normaliseCommentsFromResponse(response, post);
  if (list.length) {
    return list[0];
  }
  if (response && typeof response === 'object') {
    return normaliseCommentEntry(response, {
      index: 0,
      prefix: prefix ?? `${post?.id ?? 'feed-post'}-comment`,
      fallbackAuthor,
    });
  }
  return null;
}

function MediaAttachmentPreview({ attachment, onRemove }) {
  if (!attachment) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-inner">
      <div className="relative">
        <img
          src={attachment.url}
          alt={attachment.alt || 'Feed media attachment'}
          className="h-48 w-full object-cover"
          loading="lazy"
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-4 top-4 inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-white"
        >
          Remove media
        </button>
      </div>
      {attachment.alt ? (
        <p className="border-t border-slate-200 px-4 py-2 text-xs text-slate-500">{attachment.alt}</p>
      ) : null}
    </div>
  );
}

function FeedComposer({ onCreate, session }) {
  const [mode, setMode] = useState('update');
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [attachmentAlt, setAttachmentAlt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [showGifTray, setShowGifTray] = useState(false);
  const textareaId = useId();
  const linkInputId = useId();
  const mediaAltId = useId();

  const selectedOption = COMPOSER_OPTIONS.find((option) => option.id === mode) ?? COMPOSER_OPTIONS[0];
  const remainingCharacters = MAX_CONTENT_LENGTH - content.length;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) {
      return;
    }
    const draftPayload = {
      type: mode,
      content,
      summary: content,
      link: sanitiseExternalLink(link),
      mediaAttachments: attachment
        ? [
            {
              id: attachment.id,
              type: attachment.type,
              url: attachment.url,
              alt: attachmentAlt?.trim() || attachment.alt,
            },
          ]
        : [],
    };

    let moderated;
    try {
      moderated = moderateFeedComposerPayload(draftPayload);
    } catch (moderationError) {
      if (moderationError instanceof ContentModerationError) {
        setError({
          message: moderationError.message,
          reasons: moderationError.reasons,
        });
        return;
      }
      setError({
        message: moderationError?.message || 'We could not publish your update. Please try again in a moment.',
      });
      return;
    }

    const payload = {
      type: mode,
      content: moderated.content,
      link: moderated.link,
      mediaAttachments: moderated.attachments,
    };

    setSubmitting(true);
    setError(null);
    try {
      await Promise.resolve(onCreate(payload));
      setContent('');
      setLink('');
      setAttachment(null);
      setAttachmentAlt('');
      setMode('update');
    } catch (composerError) {
      if (composerError instanceof ContentModerationError) {
        setError({ message: composerError.message, reasons: composerError.reasons });
      } else {
        const message =
          composerError?.message || 'We could not publish your update. Please try again in a moment.';
        setError({ message });
      }
    } finally {
      setSubmitting(false);
      setShowEmojiTray(false);
      setShowGifTray(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/95 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 px-6 py-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">Share with your network</p>
          <p className="text-xs text-slate-500">Updates appear instantly across teams you collaborate with.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-accent">
          <ChatBubbleOvalLeftEllipsisIcon className="h-4 w-4" />
          Live
        </span>
      </div>
      <form onSubmit={handleSubmit} className="relative px-6 py-5">
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
            <div className="relative">
              <label htmlFor={textareaId} className="sr-only">
                Compose timeline update
              </label>
              <textarea
                id={textareaId}
                value={content}
                onChange={(event) => {
                  setContent(event.target.value.slice(0, MAX_CONTENT_LENGTH));
                  setError(null);
                }}
                rows={4}
                maxLength={MAX_CONTENT_LENGTH}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder={`Tell your network about ${selectedOption.label.toLowerCase()}…`}
                disabled={submitting}
              />
              <div className="pointer-events-none absolute bottom-3 right-4 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
                {remainingCharacters}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowGifTray(false);
                    setShowEmojiTray((previous) => !previous);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
                >
                  <FaceSmileIcon className="h-4 w-4" />
                  Emoji
                </button>
                <EmojiQuickPickerPopover
                  open={showEmojiTray}
                  onClose={() => setShowEmojiTray(false)}
                  onSelect={(emoji) => setContent((previous) => `${previous}${emoji}`)}
                  labelledBy="composer-emoji-trigger"
                />
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmojiTray(false);
                    setShowGifTray((previous) => !previous);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
                >
                  <PhotoIcon className="h-4 w-4" />
                  GIF & media
                </button>
                <GifSuggestionPopover
                  open={showGifTray}
                  onClose={() => setShowGifTray(false)}
                  onSelect={(gif) => {
                    setAttachment({ id: gif.id, type: 'gif', url: gif.url, alt: gif.tone });
                    setAttachmentAlt(gif.tone);
                  }}
                  labelledBy="composer-gif-trigger"
                />
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
              <div className="space-y-2">
                <label htmlFor={linkInputId} className="text-xs font-medium text-slate-600">
                  Attach a resource (deck, doc, or listing URL)
                </label>
                <input
                  id={linkInputId}
                  value={link}
                  onChange={(event) => {
                    setLink(event.target.value);
                    setError(null);
                  }}
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
            {attachment ? (
              <div className="space-y-2">
                <label htmlFor={mediaAltId} className="text-xs font-medium text-slate-600">
                  Media alt text
                </label>
                <input
                  id={mediaAltId}
                  value={attachmentAlt}
                  onChange={(event) => setAttachmentAlt(event.target.value)}
                  maxLength={120}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-inner focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="Describe the media for improved accessibility"
                />
                <MediaAttachmentPreview
                  attachment={{ ...attachment, alt: attachmentAlt }}
                  onRemove={() => {
                    setAttachment(null);
                    setAttachmentAlt('');
                  }}
                />
              </div>
            ) : null}
            {error ? (
              <div
                className="space-y-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-inner"
                role="alert"
              >
                <p className="font-semibold">{error.message}</p>
                {Array.isArray(error.reasons) && error.reasons.length ? (
                  <ul className="list-disc space-y-1 pl-5 text-xs text-rose-600">
                    {error.reasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Your update is routed to followers, connections, and workspace partners.
              </p>
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
                {submitting ? 'Publishing…' : 'Publish to timeline'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function FeedCommentThread({ comment, onReply }) {
  const [replying, setReplying] = useState(false);
  const [replyDraft, setReplyDraft] = useState('');
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const replyTextareaId = useId();

  const totalReplies = Array.isArray(comment.replies) ? comment.replies.length : 0;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!replyDraft.trim()) {
      return;
    }
    onReply?.(comment.id, replyDraft.trim());
    setReplyDraft('');
    setShowEmojiTray(false);
    setReplying(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 text-sm text-slate-700">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <span className="font-semibold text-slate-700">{comment.author}</span>
        <span>{formatRelativeTime(comment.createdAt)}</span>
      </div>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{comment.headline}</p>
      <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{comment.message}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <button
          type="button"
          onClick={() => {
            setReplying(true);
          }}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 transition hover:border-accent/60 hover:text-accent"
        >
          <ChatBubbleOvalLeftIcon className="h-4 w-4" /> Reply
        </button>
        {totalReplies ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
            {totalReplies} {totalReplies === 1 ? 'reply' : 'replies'}
          </span>
        ) : null}
      </div>
      {Array.isArray(comment.replies) && comment.replies.length ? (
        <div className="mt-3 space-y-2 border-l-2 border-accent/30 pl-4">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="rounded-2xl bg-white/90 p-3 text-sm text-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                <span className="font-semibold text-slate-700">{reply.author}</span>
                <span>{formatRelativeTime(reply.createdAt)}</span>
              </div>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{reply.headline}</p>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{reply.message}</p>
            </div>
          ))}
        </div>
      ) : null}
      {replying ? (
        <form onSubmit={handleSubmit} className="relative mt-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-soft">
          <label htmlFor={replyTextareaId} className="sr-only">
            Reply to comment
          </label>
          <textarea
            id={replyTextareaId}
            value={replyDraft}
            onChange={(event) => setReplyDraft(event.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder="Compose a thoughtful reply…"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiTray((previous) => !previous)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
              >
                <FaceSmileIcon className="h-4 w-4" />
                Emoji
              </button>
              <EmojiQuickPickerPopover
                open={showEmojiTray}
                onClose={() => setShowEmojiTray(false)}
                onSelect={(emoji) => setReplyDraft((previous) => `${previous}${emoji}`)}
                labelledBy="comment-emoji-trigger"
              />
            </div>
            <div className="flex items-center gap-2">
              {QUICK_REPLY_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setReplying(true);
                    setReplyDraft((previous) => (previous ? `${previous}\n${suggestion}` : suggestion));
                  }}
                  className="hidden rounded-full border border-slate-200 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500 transition hover:border-accent/60 hover:text-accent lg:inline-flex"
                >
                  {suggestion.slice(0, 14)}…
                </button>
              ))}
              <button
                type="submit"
                disabled={!replyDraft.trim()}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold text-white transition ${
                  replyDraft.trim() ? 'bg-accent hover:bg-accentDark' : 'cursor-not-allowed bg-accent/40'
                }`}
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                Reply
              </button>
            </div>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function MediaAttachmentGrid({ attachments }) {
  if (!attachments?.length) {
    return null;
  }
  const columns = attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2';
  return (
    <div className={`grid gap-4 ${columns}`}>
      {attachments.map((attachment) => (
        <figure
          key={attachment.id}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-inner"
        >
          <img
            src={attachment.url}
            alt={attachment.alt || 'Feed media attachment'}
            className="h-64 w-full object-cover"
            loading="lazy"
          />
          {attachment.alt ? (
            <figcaption className="border-t border-slate-200 px-4 py-2 text-xs text-slate-500">
              {attachment.alt}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
}

function FeedLoadingSkeletons({ count = 2 }) {
  return (
    <div className="space-y-4" role="status" aria-live="polite" aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={`loading-${index}`}
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
}

function VirtualFeedChunk({
  chunk,
  chunkIndex,
  renderPost,
  estimatedHeight,
  onHeightChange,
  forceVisible = false,
}) {
  const wrapperRef = useRef(null);
  const [inView, setInView] = useState(forceVisible);
  const lastReportedHeightRef = useRef(estimatedHeight ?? DEFAULT_CHUNK_ESTIMATE);

  useEffect(() => {
    if (forceVisible) {
      setInView(true);
      return undefined;
    }
    if (typeof window === 'undefined') {
      setInView(true);
      return undefined;
    }
    const element = wrapperRef.current;
    if (!element) {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === element) {
            setInView(entry.isIntersecting);
          }
        });
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [forceVisible]);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) {
      return undefined;
    }
    if (!inView && !forceVisible) {
      if (estimatedHeight && lastReportedHeightRef.current !== estimatedHeight) {
        lastReportedHeightRef.current = estimatedHeight;
      }
      onHeightChange(chunkIndex, estimatedHeight ?? chunk.length * DEFAULT_CHUNK_ESTIMATE);
      return undefined;
    }

    const reportHeight = () => {
      if (!element) {
        return;
      }
      const height = element.offsetHeight || estimatedHeight || chunk.length * DEFAULT_CHUNK_ESTIMATE;
      if (!Number.isFinite(height)) {
        return;
      }
      if (Math.abs((lastReportedHeightRef.current ?? 0) - height) > 4) {
        lastReportedHeightRef.current = height;
        onHeightChange(chunkIndex, height);
      }
    };

    reportHeight();

    if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(reportHeight);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [chunk.length, chunkIndex, estimatedHeight, forceVisible, inView, onHeightChange]);

  const shouldRender = forceVisible || inView;
  const placeholderHeight = estimatedHeight ?? chunk.length * DEFAULT_CHUNK_ESTIMATE;

  return (
    <div
      ref={wrapperRef}
      className={
        shouldRender
          ? 'space-y-6'
          : 'rounded-3xl border border-accent/40 bg-accentSoft px-6 py-8 text-accent shadow-inner transition'
      }
      style={shouldRender ? undefined : { minHeight: placeholderHeight }}
      data-chunk-index={chunkIndex}
      aria-busy={!shouldRender}
    >
      {shouldRender ? (
        chunk.map((post) => renderPost(post))
      ) : (
        <div className="flex h-full min-h-[inherit] items-center justify-center text-[0.65rem] font-semibold uppercase tracking-wide">
          Stay close—fresh updates unlock as you scroll
        </div>
      )}
    </div>
  );
}

function FeedPostCard({
  post,
  onShare,
  canManage = false,
  viewer,
  onEditStart,
  onEditCancel,
  onDelete,
  isEditing = false,
  editDraft = DEFAULT_EDIT_DRAFT,
  onEditDraftChange,
  onEditSubmit,
  editSaving = false,
  editError = null,
  deleteLoading = false,
  onToggleReaction,
}) {
  const author = resolveAuthor(post);
  const postType = resolvePostType(post);
  const isNewsPost = postType.key === 'news';
  const heading = isNewsPost ? post.title || post.summary || post.content || author.name : author.name;
  const bodyText = isNewsPost ? post.summary || post.content || '' : post.content || '';
  const linkLabel = isNewsPost ? 'Read full story' : 'View attached resource';
  const publishedTimestamp = post.publishedAt || post.createdAt;
  const viewerName = viewer?.name ?? 'You';
  const viewerHeadline = viewer?.title ?? viewer?.headline ?? 'Shared via Gigvora';
  const viewerAvatarSeed = viewer?.avatarSeed ?? viewer?.name ?? viewerName;
  const [liked, setLiked] = useState(Boolean(post.viewerHasLiked));
  const [likeCount, setLikeCount] = useState(() => {
    if (typeof post.reactions?.likes === 'number') {
      return post.reactions.likes;
    }
    if (typeof post.likes === 'number') {
      return post.likes;
    }
    return Math.max(7, Math.round(Math.random() * 32));
  });
  const [comments, setComments] = useState(() => normaliseCommentList(post?.comments ?? [], post));
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');

  useEffect(() => {
    setLiked(Boolean(post.viewerHasLiked));
  }, [post.viewerHasLiked, post.id]);

  useEffect(() => {
    setLikeCount(() => {
      if (typeof post.reactions?.likes === 'number') {
        return post.reactions.likes;
      }
      if (typeof post.likes === 'number') {
        return post.likes;
      }
      return Math.max(7, Math.round(Math.random() * 32));
    });
  }, [post.reactions?.likes, post.likes, post.id]);

  useEffect(() => {
    setComments(normaliseCommentList(post?.comments ?? [], post));
  }, [post?.comments, post?.id]);

  useEffect(() => {
    if (!post?.id) {
      setComments([]);
      return undefined;
    }
    let ignore = false;
    const controller = new AbortController();

    const loadComments = async () => {
      setCommentsLoading(true);
      try {
        const response = await listFeedComments(post.id, { signal: controller.signal });
        if (ignore) {
          return;
        }
        const fetched = normaliseCommentsFromResponse(response, post);
        if (fetched.length) {
          setComments(fetched);
        }
        setCommentsError(null);
      } catch (error) {
        if (ignore || controller.signal.aborted) {
          return;
        }
        setCommentsError(error);
      } finally {
        if (!ignore) {
          setCommentsLoading(false);
        }
      }
    };

    loadComments();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [post?.id]);

  const totalConversationCount = useMemo(
    () =>
      comments.reduce(
        (total, comment) => total + 1 + (Array.isArray(comment.replies) ? comment.replies.length : 0),
        0,
      ),
    [comments],
  );

  const handleLike = () => {
    setLiked((previous) => {
      const nextLiked = !previous;
      setLikeCount((current) => {
        const nextCount = nextLiked ? current + 1 : Math.max(0, current - 1);
        return nextCount;
      });
      analytics.track(
        'web_feed_reaction_click',
        { postId: post.id, action: 'like', like: nextLiked },
        { source: 'web_app' },
      );
      if (typeof onToggleReaction === 'function') {
        onToggleReaction(post, nextLiked);
      }
      return nextLiked;
    });
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    const trimmed = commentDraft.trim();
    if (!trimmed) {
      return;
    }
    const optimisticId = `${post.id ?? 'feed-post'}-draft-${Date.now()}`;
    const optimisticComment = {
      id: optimisticId,
      author: viewerName,
      headline: viewerHeadline,
      message: trimmed,
      createdAt: new Date().toISOString(),
      replies: [],
    };
    setComments((previous) => [optimisticComment, ...previous]);
    setCommentDraft('');
    setCommentsError(null);
    analytics.track('web_feed_comment_submit', { postId: post.id }, { source: 'web_app' });

    try {
      const response = await createFeedComment(post.id, { message: trimmed });
      const persisted = normaliseSingleComment(response, post, {
        name: viewerName,
        headline: viewerHeadline,
      });
      if (persisted) {
        setComments((previous) => {
          const replaced = previous.map((existing) => (existing.id === optimisticId ? persisted : existing));
          if (!replaced.some((comment) => comment.id === persisted.id)) {
            return [persisted, ...replaced.filter((comment) => comment.id !== optimisticId)];
          }
          return replaced;
        });
      }
    } catch (error) {
      setComments((previous) => previous.filter((existing) => existing.id !== optimisticId));
      setCommentsError(error);
    }
  };

  const handleAddReply = async (commentId, replyMessage) => {
    const trimmed = (replyMessage ?? '').trim();
    if (!trimmed) {
      return;
    }
    const replyId = `${commentId}-reply-${Date.now()}`;
    const optimisticReply = {
      id: replyId,
      author: viewerName,
      headline: viewerHeadline,
      message: trimmed,
      createdAt: new Date().toISOString(),
    };

    setComments((previous) =>
      previous.map((existing) => {
        if (existing.id !== commentId) {
          return existing;
        }
        return {
          ...existing,
          replies: [optimisticReply, ...(existing.replies ?? [])],
        };
      }),
    );
    setCommentsError(null);
    analytics.track('web_feed_reply_submit', { postId: post.id, commentId }, { source: 'web_app' });

    try {
      const response = await createFeedReply(post.id, commentId, { message: trimmed });
      const persisted = normaliseSingleComment(
        response,
        post,
        {
          name: viewerName,
          headline: viewerHeadline,
        },
        { prefix: `${commentId}-reply` },
      );
      if (persisted) {
        setComments((previous) =>
          previous.map((existing) => {
            if (existing.id !== commentId) {
              return existing;
            }
            const updatedReplies = (existing.replies ?? []).map((reply) =>
              reply.id === replyId ? { ...persisted, id: persisted.id ?? replyId } : reply,
            );
            const hasPersisted = updatedReplies.some((reply) => reply.id === persisted.id);
            return {
              ...existing,
              replies: hasPersisted ? updatedReplies : [persisted, ...updatedReplies.filter((reply) => reply.id !== replyId)],
            };
          }),
        );
      }
    } catch (error) {
      setComments((previous) =>
        previous.map((existing) => {
          if (existing.id !== commentId) {
            return existing;
          }
          return {
            ...existing,
            replies: (existing.replies ?? []).filter((reply) => reply.id !== replyId),
          };
        }),
      );
      setCommentsError(error);
    }
  };

  return (
    <article className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3 text-xs text-slate-400">
        <span className="inline-flex items-center gap-2">
          <UserAvatar name={author.name} seed={author.avatarSeed} size="xs" showGlow={false} />
          <span>{author.headline}</span>
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span>{formatRelativeTime(publishedTimestamp)}</span>
          {canManage ? (
            isEditing ? (
              <button
                type="button"
                onClick={() => onEditCancel?.(post)}
                className="rounded-full border border-slate-200 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500 transition hover:border-rose-200 hover:text-rose-500"
                disabled={editSaving}
              >
                Cancel edit
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onEditStart?.(post)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500 transition hover:border-accent hover:text-accent"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete?.(post)}
                  className={`rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide transition ${
                    deleteLoading
                      ? 'border-rose-200 bg-rose-100 text-rose-500'
                      : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                  }`}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Removing…' : 'Delete'}
                </button>
              </>
            )
          ) : null}
        </div>
      </div>
      {isEditing ? (
        <form onSubmit={(event) => onEditSubmit?.(event, post)} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Title</span>
              <input
                type="text"
                value={editDraft?.title ?? ''}
                onChange={(event) => onEditDraftChange?.('title', event.target.value)}
                placeholder="Optional headline"
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:ring-2 focus:ring-accent/20"
                disabled={editSaving}
              />
            </label>
            <label className="block text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Type</span>
              <select
                value={editDraft?.type ?? 'update'}
                onChange={(event) => onEditDraftChange?.('type', event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20"
                disabled={editSaving}
              >
                {COMPOSER_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">External link</span>
            <input
              type="url"
              value={editDraft?.link ?? ''}
              onChange={(event) => onEditDraftChange?.('link', event.target.value)}
              placeholder="https://example.com/resource"
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:ring-2 focus:ring-accent/20"
              disabled={editSaving}
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Content</span>
            <textarea
              value={editDraft?.content ?? ''}
              onChange={(event) => onEditDraftChange?.('content', event.target.value)}
              rows={6}
              className="mt-1 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 shadow-inner focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="Share the full context for this update…"
              disabled={editSaving}
            />
          </label>
          {editError ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{editError}</p>
          ) : null}
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onEditCancel?.(post)}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300"
              disabled={editSaving}
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={editSaving}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition ${
                editSaving ? 'bg-accent/50' : 'bg-accent hover:bg-accentDark'
              }`}
            >
              {editSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      ) : (
        <>
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
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{bodyText}</p>
          ) : null}
          {isNewsPost && author.name && heading !== author.name ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{author.name}</p>
          ) : null}
          <MediaAttachmentGrid attachments={post.mediaAttachments} />
          {post.link ? (
            <a
              href={post.link}
              target="_blank"
              rel="noreferrer noopener"
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
              <ChatBubbleOvalLeftIcon className="h-4 w-4" /> {totalConversationCount}{' '}
              {totalConversationCount === 1 ? 'comment' : 'conversations'}
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
              Join the conversation
            </label>
            <div className="mt-2 flex gap-3">
              <UserAvatar name={viewerName} seed={viewerAvatarSeed} size="sm" showGlow={false} />
              <textarea
                id={`comment-${post.id}`}
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="Offer context, signal interest, or tag a collaborator…"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-wide text-slate-400">
                {QUICK_REPLY_SUGGESTIONS.slice(0, 2).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setCommentDraft((previous) => (previous ? `${previous}\n${suggestion}` : suggestion))}
                    className="rounded-full border border-slate-200 px-3 py-1 font-semibold transition hover:border-accent/60 hover:text-accent"
                  >
                    {suggestion.slice(0, 22)}…
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={!commentDraft.trim()}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white transition ${
                  commentDraft.trim() ? 'bg-accent hover:bg-accentDark' : 'cursor-not-allowed bg-accent/40'
                }`}
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                Comment
              </button>
            </div>
          </form>
          {commentsError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
              {commentsError?.message || 'We could not load the latest conversation. Please try again soon.'}
            </div>
          ) : null}
          {commentsLoading ? (
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-white/80 p-4 text-xs text-slate-500">
              <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
            </div>
          ) : null}
          <div className="space-y-3">
            {comments.map((comment) => (
              <FeedCommentThread key={comment.id} comment={comment} onReply={handleAddReply} />
            ))}
            {!commentsLoading && !comments.length ? (
              <p className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-xs text-slate-500">
                Spark the conversation with the first reply.
              </p>
            ) : null}
          </div>
        </>
      )}
    </article>
  );
}

function LiveMomentsTicker({ moments = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!moments.length) {
      return undefined;
    }
    const interval = setInterval(() => {
      setActiveIndex((previous) => (previous + 1) % moments.length);
    }, 6000);
    return () => clearInterval(interval);
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
            <p className="mt-2 text-xs text-slate-500">Updated {formatRelativeTime(activeMoment.timestamp)}</p>
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


function FeedIdentityRail({ session, interests = [] }) {
  return (
    <aside className="order-2 space-y-6 xl:order-1">
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-soft">
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
    </aside>
  );
}

function FeedInsightsRail({ liveMoments = [], connectionSuggestions = [], groupSuggestions = [] }) {
  const hasSuggestions = connectionSuggestions.length || groupSuggestions.length;

  return (
    <aside className="order-3 space-y-6 xl:order-3">
      <LiveMomentsTicker moments={liveMoments} />
      {connectionSuggestions.length ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Suggested connections</p>
            <Link to="/connections" className="text-xs font-semibold text-accent transition hover:text-accentDark">
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
                <Link
                  to={`/connections?suggested=${encodeURIComponent(connection.id)}`}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent/30 px-4 py-2 text-xs font-semibold text-accent transition hover:border-accent hover:bg-accentSoft"
                >
                  Start introduction
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {groupSuggestions.length ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Groups to join</p>
            <Link to="/groups" className="text-xs font-semibold text-accent transition hover:text-accentDark">
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
                <Link
                  to={`/groups/${encodeURIComponent(group.id)}?ref=feed-suggestion`}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Request invite
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="rounded-3xl border border-accent/30 bg-accentSoft/80 p-6 text-sm text-slate-700">
        <p className="text-sm font-semibold text-accentDark">Explorer consolidation</p>
        <p className="mt-2 text-sm text-slate-700">
          Jobs, gigs, projects, Experience Launchpad cohorts, volunteer opportunities, and talent discovery now live inside the Explorer. Use filters to pivot between freelancers, companies, people, groups, headhunters, and agencies without leaving your flow.
        </p>
        <Link
          to="/search"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-soft transition hover:bg-accentDark"
        >
          Open Explorer
        </Link>
      </div>
      {!hasSuggestions ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 text-sm text-slate-600 shadow-soft">
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
  const { data, error, loading, fromCache, lastUpdated, refresh } = useCachedResource(
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
    setPagination({
      nextCursor: data.nextCursor ?? null,
      nextPage: data.nextPage ?? null,
      hasMore: Boolean(data.hasMore),
    });
    setLoadMoreError(null);
  }, [data, loading, session]);

  const posts = useMemo(() => {
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

  const engagementSignals = useEngagementSignals({ session, feedPosts: posts });
  const {
    interests = [],
    connectionSuggestions = [],
    groupSuggestions = [],
    liveMoments = [],
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

  const handleToggleReaction = useCallback(async (post, liked) => {
    if (!post?.id) {
      return;
    }
    try {
      await reactToFeedPost(post.id, 'like', { active: liked });
    } catch (reactionError) {
      console.warn('Failed to sync reaction', reactionError);
    }
  }, []);

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

  const renderFeedPost = useCallback(
    (post) => (
      <FeedPostCard
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
        onToggleReaction={handleToggleReaction}
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
      handleToggleReaction,
      removingPostId,
      session,
    ],
  );

  const renderPosts = () => {
    if (!posts.length) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          {loading ? 'Syncing timeline…' : 'No timeline updates yet. Share something to start the conversation!'}
        </div>
      );
    }

    if (!virtualizationEnabled) {
      return (
        <div className="space-y-6">
          {posts.map((post) => renderFeedPost(post))}
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
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft">
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
    <section className="relative overflow-hidden py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute -right-32 top-24 h-72 w-72 rounded-full bg-emerald-200/40 blur-[140px]" aria-hidden="true" />
      <div className="absolute -left-16 bottom-10 h-80 w-80 rounded-full bg-accent/10 blur-[140px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <PageHeader
          eyebrow="Timeline"
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
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(240px,0.9fr),minmax(0,2fr)] xl:grid-cols-[minmax(240px,0.85fr),minmax(0,2.2fr),minmax(240px,1fr)] xl:items-start">
          <FeedIdentityRail session={session} interests={interests} />
          <div className="order-1 space-y-8 xl:order-2">
            <FeedComposer onCreate={handleComposerCreate} session={session} />
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
          <FeedInsightsRail
            liveMoments={liveMoments}
            connectionSuggestions={connectionSuggestions}
            groupSuggestions={groupSuggestions}
          />
        </div>
      </div>
    </section>
  );
}
