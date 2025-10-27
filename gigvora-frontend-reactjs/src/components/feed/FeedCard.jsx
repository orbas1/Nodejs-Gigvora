import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowPathIcon, PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/outline';
import UserAvatar from '../UserAvatar.jsx';
import ReactionsBar from './ReactionsBar.jsx';
import CommentsThread from './CommentsThread.jsx';
import {
  createFeedComment,
  createFeedReply,
  listFeedComments,
} from '../../services/liveFeed.js';
import analytics from '../../services/analytics.js';
import { formatRelativeTime } from '../../utils/date.js';
import { COMPOSER_OPTIONS } from '../../constants/feedMeta.js';
import {
  REACTION_ALIASES,
  REACTION_LOOKUP,
  REACTION_OPTIONS,
} from './reactionsConfig.js';

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

const OPPORTUNITY_POST_TYPES = new Set(['job', 'gig', 'project', 'launchpad', 'volunteering', 'mentorship']);

function normaliseCommentEntry(comment, { index, prefix, fallbackAuthor }) {
  if (!comment || typeof comment !== 'object') {
    return null;
  }

  const user = comment.user ?? comment.author ?? comment.member ?? {};
  const profile = user.profile ?? user.Profile ?? {};
  const metadata = typeof comment.metadata === 'object' && comment.metadata ? comment.metadata : {};
  const id = `${prefix}-${comment.id ?? index + 1}`;

  const author = (() => {
    const candidateAuthor =
      comment.authorName ??
      comment.author ??
      comment.name ??
      user.name ??
      [user.firstName, user.lastName].filter(Boolean).join(' ');
    if (candidateAuthor && candidateAuthor.trim()) {
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
  const insightTags = Array.isArray(comment.insightTags)
    ? comment.insightTags
    : Array.isArray(metadata.insightTags)
    ? metadata.insightTags
    : [];
  const isPinned = Boolean(comment.isPinned ?? metadata.isPinned ?? metadata.pinned);
  const isOfficial = Boolean(comment.isOfficial ?? metadata.isOfficial ?? metadata.official);
  const guidance = typeof (comment.guidance ?? metadata.guidance) === 'string'
    ? (comment.guidance ?? metadata.guidance)
    : null;
  const language = comment.language ?? metadata.language ?? null;
  const avatarSeed =
    comment.authorAvatarSeed ??
    comment.avatarSeed ??
    profile.avatarSeed ??
    fallbackAuthor?.avatarSeed ??
    user.firstName ??
    author;
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
    metadata,
    insightTags,
    isPinned,
    isOfficial,
    guidance,
    language,
    authorAvatarSeed: avatarSeed,
  };
}

function normaliseCommentList(comments, post) {
  if (!Array.isArray(comments)) {
    return [];
  }
  const prefixBase = `${post?.id ?? 'feed-post'}-comment`;
  return comments
    .map((comment, index) =>
      normaliseCommentEntry(comment, { index, prefix: prefixBase, fallbackAuthor: comment?.user }),
    )
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
          className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-inner"
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

MediaAttachmentGrid.propTypes = {
  attachments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      url: PropTypes.string.isRequired,
      alt: PropTypes.string,
    }),
  ),
};

MediaAttachmentGrid.defaultProps = {
  attachments: [],
};

function normaliseReactionSummary(reactions) {
  const summary = {};
  if (reactions && typeof reactions === 'object') {
    Object.entries(reactions).forEach(([key, value]) => {
      if (!Number.isFinite(Number(value))) {
        return;
      }
      const normalisedKey = key.toString().toLowerCase().replace(/[^a-z]/g, '');
      const canonical = REACTION_ALIASES[normalisedKey] || (REACTION_LOOKUP[normalisedKey] ? normalisedKey : null);
      if (!canonical) {
        summary[normalisedKey] = (summary[normalisedKey] ?? 0) + Number(value);
        return;
      }
      summary[canonical] = (summary[canonical] ?? 0) + Number(value);
    });
  }

  REACTION_OPTIONS.forEach((option) => {
    if (typeof summary[option.id] !== 'number') {
      summary[option.id] = 0;
    }
  });

  return summary;
}

function extractMediaAttachments(post) {
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

  const reactionSummary = normaliseReactionSummary(post.reactions);
  const reactionsMap = { ...reactionSummary };
  if (typeof reactionsMap.like === 'number') {
    reactionsMap.likes = reactionsMap.like;
  }
  const viewerReaction = (() => {
    const rawReaction =
      post.viewerReaction ||
      post.viewerReactionType ||
      (post.viewerHasLiked ? 'like' : null);
    if (!rawReaction) {
      return null;
    }
    const key = rawReaction.toString().toLowerCase().replace(/[^a-z]/g, '');
    return REACTION_ALIASES[key] || (REACTION_LOOKUP[key] ? key : null);
  })();

  const normalised = {
    id: post.id ?? `local-${Date.now()}`,
    content: post.content ?? '',
    summary: post.summary ?? post.content ?? '',
    type: normalisedType,
    title: post.title ?? post.headline ?? null,
    link: post.link ?? post.url ?? null,
    mediaAttachments: extractMediaAttachments(post),
    authorName: derivedAuthorName,
    authorHeadline: post.authorHeadline ?? post.authorTitle ?? null,
    authorAvatarSeed: post.authorAvatarSeed ?? derivedAuthorName,
    author: post.author ?? null,
    reactions: reactionsMap,
    reactionSummary,
    viewerReaction,
    viewerHasLiked: Boolean(post.viewerHasLiked || viewerReaction === 'like'),
    createdAt,
    publishedAt: post.publishedAt ?? post.updatedAt ?? createdAt,
    comments: Array.isArray(post.comments) ? post.comments : [],
    shareCount: post.shareCount ?? post.metrics?.shares ?? 0,
    metrics: post.metrics ?? {},
    reactionInsights: post.reactionInsights ?? null,
    workspaceId: post.workspaceId ?? post.workspace?.id ?? null,
    workspaceName: post.workspace?.name ?? null,
    isCurated: Boolean(post.isCurated ?? post.curated ?? false),
  };

  if (fallbackSession && !normalised.authorName) {
    normalised.authorName = fallbackSession.name ?? 'Gigvora member';
  }

  return normalised;
}

function FeedCard({
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
  onReactionChange,
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
  const computedReactionSummary = useMemo(
    () => normaliseReactionSummary(post.reactionSummary ?? post.reactions ?? {}),
    [post.reactionSummary, post.reactions],
  );
  const [reactionSummary, setReactionSummary] = useState(computedReactionSummary);
  useEffect(() => {
    setReactionSummary(computedReactionSummary);
  }, [computedReactionSummary]);

  const [activeReaction, setActiveReaction] = useState(
    () => post.viewerReaction ?? (post.viewerHasLiked ? 'like' : null),
  );
  useEffect(() => {
    setActiveReaction(post.viewerReaction ?? (post.viewerHasLiked ? 'like' : null));
  }, [post.viewerHasLiked, post.viewerReaction]);

  const [comments, setComments] = useState(() => normaliseCommentList(post?.comments ?? [], post));
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');

  useEffect(() => {
    setComments(normaliseCommentList(post?.comments ?? [], post));
  }, [post?.comments, post?.id]);

  const loadComments = useCallback(
    async ({ signal } = {}) => {
      if (!post?.id) {
        setComments([]);
        return;
      }
      setCommentsLoading(true);
      try {
        const response = await listFeedComments(post.id, { signal });
        if (signal?.aborted) {
          return;
        }
        const fetched = normaliseCommentsFromResponse(response, post);
        setComments(fetched.length ? fetched : []);
        setCommentsError(null);
      } catch (error) {
        if (signal?.aborted) {
          return;
        }
        setCommentsError(error);
      } finally {
        if (!signal?.aborted) {
          setCommentsLoading(false);
        }
      }
    },
    [post],
  );

  useEffect(() => {
    if (!post?.id) {
      setComments([]);
      return undefined;
    }
    const controller = new AbortController();
    loadComments({ signal: controller.signal });
    return () => controller.abort();
  }, [loadComments, post?.id]);

  const totalConversationCount = useMemo(
    () =>
      comments.reduce(
        (total, comment) => total + 1 + (Array.isArray(comment.replies) ? comment.replies.length : 0),
        0,
      ),
    [comments],
  );

  const handleReactionSelect = useCallback(
    (reactionId) => {
      setActiveReaction((previous) => {
        const willActivate = previous !== reactionId;
        setReactionSummary((current) => {
          const updated = { ...(current ?? {}) };
          if (previous && typeof updated[previous] === 'number') {
            updated[previous] = Math.max(0, updated[previous] - 1);
          }
          if (willActivate) {
            updated[reactionId] = (updated[reactionId] ?? 0) + 1;
          }
          return updated;
        });
        analytics.track(
          'web_feed_reaction_click',
          { postId: post.id, reaction: reactionId, active: willActivate },
          { source: 'web_app' },
        );
        if (typeof onReactionChange === 'function') {
          onReactionChange(post, { next: willActivate ? reactionId : null, previous });
        }
        return willActivate ? reactionId : null;
      });
    },
    [onReactionChange, post],
  );

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
              replies: hasPersisted
                ? updatedReplies
                : [persisted, ...updatedReplies.filter((reply) => reply.id !== replyId)],
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
    <article className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-md">
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
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Summary</span>
            <textarea
              value={editDraft?.content ?? ''}
              onChange={(event) => onEditDraftChange?.('content', event.target.value)}
              rows={4}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="Share what’s new with your network"
              disabled={editSaving}
            />
          </label>
          {editError ? (
            <p className="text-xs font-semibold text-rose-600">{editError}</p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-3 text-xs">
            <button
              type="button"
              onClick={() => onEditCancel?.(post)}
              className="rounded-full border border-slate-200 px-4 py-2 font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300"
              disabled={editSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold uppercase tracking-wide text-white transition ${
                editSaving ? 'bg-accent/70' : 'bg-accent hover:bg-accentDark'
              }`}
              disabled={editSaving}
            >
              {editSaving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <PaperAirplaneIcon className="h-4 w-4" />}
              {editSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold uppercase tracking-wide text-slate-600">
              {postType.label}
            </span>
            {post.source ? (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-600">
                {post.source}
              </span>
            ) : null}
          </div>
          {OPPORTUNITY_POST_TYPES.has(postType.key) ? (
            <div className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
              <SparklesIcon className="h-4 w-4" /> Opportunity spotlight — invite warm intros or referrals.
            </div>
          ) : null}
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
          <ReactionsBar
            postId={post.id}
            reactionSummary={reactionSummary}
            activeReaction={activeReaction}
            onSelect={handleReactionSelect}
            totalConversationCount={totalConversationCount}
            shareCount={post.shareCount ?? post.metrics?.shares ?? 0}
            onShare={() => onShare?.(post)}
            insights={post.reactionInsights}
          />
          <CommentsThread
            comments={comments}
            loading={commentsLoading}
            error={commentsError}
            onRetry={() => loadComments()}
            onReply={handleAddReply}
            onSubmit={handleCommentSubmit}
            commentDraft={commentDraft}
            onCommentDraftChange={setCommentDraft}
            quickReplies={[
              'This is a fantastic milestone – congratulations! 👏',
              'Looping the team so we can amplify this right away.',
              'Let’s sync offline about how we can support the rollout.',
              'Added this into the launch tracker so nothing slips.',
            ]}
            viewer={{ name: viewerName, avatarSeed: viewerAvatarSeed }}
            postId={post.id}
            postAuthorName={author.name}
          />
        </>
      )}
    </article>
  );
}

FeedCard.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    content: PropTypes.string,
    summary: PropTypes.string,
    title: PropTypes.string,
    type: PropTypes.string,
    link: PropTypes.string,
    mediaAttachments: PropTypes.array,
    reactionSummary: PropTypes.object,
    reactions: PropTypes.object,
    viewerReaction: PropTypes.string,
    viewerHasLiked: PropTypes.bool,
    publishedAt: PropTypes.string,
    createdAt: PropTypes.string,
    comments: PropTypes.array,
    shareCount: PropTypes.number,
    metrics: PropTypes.object,
    reactionInsights: PropTypes.object,
    source: PropTypes.string,
  }).isRequired,
  onShare: PropTypes.func,
  canManage: PropTypes.bool,
  viewer: PropTypes.shape({
    name: PropTypes.string,
    title: PropTypes.string,
    headline: PropTypes.string,
    avatarSeed: PropTypes.string,
  }),
  onEditStart: PropTypes.func,
  onEditCancel: PropTypes.func,
  onDelete: PropTypes.func,
  isEditing: PropTypes.bool,
  editDraft: PropTypes.shape({
    title: PropTypes.string,
    content: PropTypes.string,
    link: PropTypes.string,
    type: PropTypes.string,
  }),
  onEditDraftChange: PropTypes.func,
  onEditSubmit: PropTypes.func,
  editSaving: PropTypes.bool,
  editError: PropTypes.string,
  deleteLoading: PropTypes.bool,
  onReactionChange: PropTypes.func,
};

FeedCard.defaultProps = {
  onShare: undefined,
  canManage: false,
  viewer: null,
  onEditStart: undefined,
  onEditCancel: undefined,
  onDelete: undefined,
  isEditing: false,
  editDraft: DEFAULT_EDIT_DRAFT,
  onEditDraftChange: undefined,
  onEditSubmit: undefined,
  editSaving: false,
  editError: null,
  deleteLoading: false,
  onReactionChange: undefined,
};

export default FeedCard;
export {
  DEFAULT_EDIT_DRAFT,
  resolveAuthor,
  resolvePostType,
  extractMediaAttachments,
  normaliseReactionSummary,
  normaliseFeedPost,
  normaliseCommentList,
  normaliseCommentsFromResponse,
};
