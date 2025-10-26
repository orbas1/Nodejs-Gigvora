import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowPathIcon, SparklesIcon } from '@heroicons/react/24/outline';
import UserAvatar from '../UserAvatar.jsx';
import ReactionsBar from './ReactionsBar.jsx';
import CommentsThread from './CommentsThread.jsx';
import { formatRelativeTime } from '../../utils/date.js';
import analytics from '../../services/analytics.js';
import {
  createFeedComment,
  createFeedReply,
  listFeedComments,
} from '../../services/liveFeed.js';
import {
  OPPORTUNITY_POST_TYPES,
  resolveAuthor,
  resolvePostType,
  normaliseReactionSummary,
} from './feedNormalizers.js';
import { COMPOSER_OPTIONS } from '../../constants/feedMeta.js';

export const FEED_CARD_DEFAULT_EDIT_DRAFT = {
  title: '',
  content: '',
  link: '',
  type: 'update',
};

const QUICK_REPLY_SUGGESTIONS = [
  'This is a fantastic milestone – congratulations! 👏',
  'Looping the team so we can amplify this right away.',
  'Let’s sync offline about how we can support the rollout.',
  'Added this into the launch tracker so nothing slips.',
];

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
      alt: PropTypes.string,
      url: PropTypes.string,
    }),
  ),
};

export default function FeedCard({
  post,
  onShare,
  canManage = false,
  viewer,
  onEditStart,
  onEditCancel,
  onDelete,
  isEditing = false,
  editDraft = FEED_CARD_DEFAULT_EDIT_DRAFT,
  onEditDraftChange,
  onEditSubmit,
  editSaving = false,
  editError = null,
  deleteLoading = false,
  onReactionChange,
}) {
  const author = resolveAuthor(post, viewer);
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
        onReactionChange?.(post, { next: willActivate ? reactionId : null, previous });
        return willActivate ? reactionId : null;
      });
    },
    [onReactionChange, post],
  );

  const handleCommentSubmit = useCallback(
    async () => {
      if (!post?.id || !commentDraft.trim()) {
        return;
      }
      const optimisticId = `${post.id}-optimistic-${Date.now()}`;
      const optimisticComment = {
        id: optimisticId,
        author: viewerName,
        headline: viewerHeadline,
        message: commentDraft,
        createdAt: new Date().toISOString(),
        replies: [],
      };
      setComments((previous) => [optimisticComment, ...previous]);
      setCommentDraft('');
      analytics.track(
        'web_feed_comment_submit',
        { postId: post.id },
        { source: 'web_app' },
      );
      try {
        const response = await createFeedComment(post.id, { body: commentDraft });
        const persisted = normaliseSingleComment(response, post, viewer, { prefix: optimisticId });
        setComments((previous) => {
          if (!persisted) {
            return previous.filter((comment) => comment.id !== optimisticId);
          }
          const updated = previous.filter((comment) => comment.id !== optimisticId);
          return [persisted, ...updated];
        });
      } catch (error) {
        console.warn('Failed to submit comment', error);
        setComments((previous) => previous.filter((comment) => comment.id !== optimisticId));
        setCommentsError(error);
      }
    },
    [commentDraft, post, viewer, viewerHeadline, viewerName],
  );

  const handleAddReply = useCallback(
    async ({ commentId, message }) => {
      if (!post?.id || !commentId || !message?.trim()) {
        return;
      }
      const optimisticId = `${commentId}-reply-optimistic-${Date.now()}`;
      const optimisticReply = {
        id: optimisticId,
        author: viewerName,
        headline: viewerHeadline,
        message,
        createdAt: new Date().toISOString(),
        replies: [],
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
      analytics.track(
        'web_feed_reply_submit',
        { postId: post.id, commentId },
        { source: 'web_app' },
      );
      try {
        const response = await createFeedReply(post.id, commentId, { body: message });
        const persisted = normaliseSingleComment(response, post, viewer, { prefix: `${commentId}-reply` });
        setComments((previous) =>
          previous.map((existing) => {
            if (existing.id !== commentId) {
              return existing;
            }
            const replies = Array.isArray(existing.replies) ? existing.replies : [];
            const hasPersisted = replies.some((reply) => reply.id === persisted?.id);
            const filtered = replies.filter((reply) => reply.id !== optimisticId);
            return {
              ...existing,
              replies: hasPersisted ? replies : [persisted, ...filtered].filter(Boolean),
            };
          }),
        );
      } catch (error) {
        console.warn('Failed to submit reply', error);
        setComments((previous) =>
          previous.map((existing) => {
            if (existing.id !== commentId) {
              return existing;
            }
            return {
              ...existing,
              replies: (existing.replies ?? []).filter((reply) => reply.id !== optimisticId),
            };
          }),
        );
        setCommentsError(error);
      }
    },
    [post, viewer, viewerHeadline, viewerName],
  );

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
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Content</span>
            <textarea
              value={editDraft?.content ?? ''}
              onChange={(event) => onEditDraftChange?.('content', event.target.value)}
              rows={6}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 shadow-inner focus:border-accent focus:ring-2 focus:ring-accent/20"
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
            quickReplies={QUICK_REPLY_SUGGESTIONS}
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
  canManage: PropTypes.bool,
  deleteLoading: PropTypes.bool,
  editDraft: PropTypes.shape({
    content: PropTypes.string,
    link: PropTypes.string,
    title: PropTypes.string,
    type: PropTypes.string,
  }),
  editError: PropTypes.string,
  editSaving: PropTypes.bool,
  isEditing: PropTypes.bool,
  onDelete: PropTypes.func,
  onEditCancel: PropTypes.func,
  onEditDraftChange: PropTypes.func,
  onEditStart: PropTypes.func,
  onEditSubmit: PropTypes.func,
  onReactionChange: PropTypes.func,
  onShare: PropTypes.func,
  post: PropTypes.shape({
    comments: PropTypes.array,
    content: PropTypes.string,
    createdAt: PropTypes.string,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    link: PropTypes.string,
    mediaAttachments: PropTypes.array,
    metrics: PropTypes.object,
    reactionInsights: PropTypes.array,
    reactionSummary: PropTypes.object,
    reactions: PropTypes.object,
    shareCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    source: PropTypes.string,
    title: PropTypes.string,
    type: PropTypes.string,
    viewerHasLiked: PropTypes.bool,
    viewerReaction: PropTypes.string,
  }).isRequired,
  viewer: PropTypes.shape({
    avatarSeed: PropTypes.string,
    headline: PropTypes.string,
    name: PropTypes.string,
    title: PropTypes.string,
  }),
};
