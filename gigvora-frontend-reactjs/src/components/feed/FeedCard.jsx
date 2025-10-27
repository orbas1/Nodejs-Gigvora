import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowPathIcon, SparklesIcon } from '@heroicons/react/24/outline';

import UserAvatar from '../UserAvatar.jsx';
import ReactionsBar from './ReactionsBar.jsx';
import CommentsThread from './CommentsThread.jsx';
import analytics from '../../services/analytics.js';
import {
  createFeedComment,
  createFeedReply,
  listFeedComments,
} from '../../services/liveFeed.js';
import { formatRelativeTime } from '../../utils/date.js';
import {
  normaliseCommentList,
  normaliseCommentsFromResponse,
  normaliseSingleComment,
  resolveAuthor,
  resolvePostType,
  normaliseReactionSummary,
} from './feedNormalisers.js';
import { OPPORTUNITY_POST_TYPES, QUICK_REPLY_SUGGESTIONS } from './feedConstants.js';
import { COMPOSER_OPTIONS } from '../../constants/feedMeta.js';

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
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      url: PropTypes.string,
      alt: PropTypes.string,
    }),
  ),
};

export function FeedLoadingSkeletons({ count = 2 }) {
  return (
    <div className="space-y-4" role="status" aria-live="polite" aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={`loading-${index}`}
          className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
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

FeedLoadingSkeletons.propTypes = {
  count: PropTypes.number,
};

export default function FeedCard({
  post,
  viewer,
  canManage = false,
  onShare,
  onEditStart,
  onEditCancel,
  onDelete,
  isEditing = false,
  editDraft,
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

  const renderMetricsRail = () => {
    const reactionTotal = Object.values(reactionSummary ?? {}).reduce(
      (total, count) => (Number.isFinite(count) ? total + Number(count) : total),
      0,
    );
    const commentCount = Number.isFinite(post.commentCount) ? post.commentCount : totalConversationCount;
    const shareCount = Number.isFinite(post.shareCount) ? post.shareCount : post.metrics?.shares ?? 0;
    const impressionCount = Number.isFinite(post.metrics?.impressions)
      ? post.metrics.impressions
      : Number.isFinite(post.metrics?.views)
      ? post.metrics.views
      : null;

    return (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        <span>{reactionTotal} reactions</span>
        <span>•</span>
        <span>{commentCount} comments</span>
        <span>•</span>
        <span>{shareCount} shares</span>
        {Number.isFinite(impressionCount) ? (
          <>
            <span>•</span>
            <span>{impressionCount} impressions</span>
          </>
        ) : null}
        {post.viewerReaction ? (
          <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-1 text-accent">
            You reacted
          </span>
        ) : null}
        {post.viewerHasCommented ? (
          <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-1 text-indigo-600">
            You joined the discussion
          </span>
        ) : null}
      </div>
    );
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
          {renderMetricsRail()}
          {OPPORTUNITY_POST_TYPES.has(postType.key) ? (
            <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
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
  post: PropTypes.object.isRequired,
  viewer: PropTypes.object,
  canManage: PropTypes.bool,
  onShare: PropTypes.func,
  onEditStart: PropTypes.func,
  onEditCancel: PropTypes.func,
  onDelete: PropTypes.func,
  isEditing: PropTypes.bool,
  editDraft: PropTypes.object,
  onEditDraftChange: PropTypes.func,
  onEditSubmit: PropTypes.func,
  editSaving: PropTypes.bool,
  editError: PropTypes.string,
  deleteLoading: PropTypes.bool,
  onReactionChange: PropTypes.func,
};
