import { useCallback, useEffect, useMemo, useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import UserAvatar from '../UserAvatar.jsx';
import ReactionsBar from './ReactionsBar.jsx';
import CommentsThread from './CommentsThread.jsx';
import { formatRelativeTime } from '../../utils/date.js';
import { COMPOSER_OPTIONS } from '../../constants/feedMeta.js';
import { createFeedComment, createFeedReply, listFeedComments } from '../../services/liveFeed.js';
import analytics from '../../services/analytics.js';
import {
  DEFAULT_EDIT_DRAFT,
  OPPORTUNITY_POST_TYPES,
  QUICK_REPLY_SUGGESTIONS,
  extractMediaAttachments,
  normaliseCommentList,
  normaliseCommentsFromResponse,
  normaliseReactionSummary,
  normaliseSingleComment,
  resolveAuthor,
  resolvePostType,
} from './feedHelpers.js';

function FocusSegmentList({ segments }) {
  if (!segments?.length) {
    return null;
  }

  return (
    <ul className="mt-3 flex flex-wrap items-center gap-2">
      {segments.map((segment) => (
        <li
          key={segment.id || segment.label || segment}
          className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-accent"
        >
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          {segment.label || segment.name || segment}
        </li>
      ))}
    </ul>
  );
}

function OpportunityHighlights({ highlights }) {
  if (!highlights?.length) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">Focus highlights</p>
      <ul className="list-disc space-y-1 pl-4 text-sm text-slate-600">
        {highlights.map((highlight, index) => (
          <li key={highlight.id || index}>{highlight.label || highlight.title || highlight}</li>
        ))}
      </ul>
    </div>
  );
}

function PostInsightStats({ metrics }) {
  if (!metrics?.length) {
    return null;
  }

  return (
    <dl className="mt-4 grid gap-3 rounded-2xl border border-slate-100 bg-white/80 p-4 text-xs text-slate-500 shadow-inner sm:grid-cols-3">
      {metrics.map((metric) => (
        <div key={metric.id} className="space-y-1 rounded-xl bg-slate-50 px-3 py-2 text-center shadow-sm">
          <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">{metric.label}</dt>
          <dd className="text-lg font-semibold text-slate-900">{metric.value}</dd>
          {metric.caption ? <p className="text-[0.65rem] text-slate-500">{metric.caption}</p> : null}
        </div>
      ))}
    </dl>
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

export default function FeedCard({
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

  const handleReactionSelect = useCallback(
    ({ next, previous }) => {
      setActiveReaction(next ?? null);
      setReactionSummary((current) => {
        const updated = { ...current };
        if (previous && updated[previous] > 0) {
          updated[previous] -= 1;
        }
        if (next) {
          updated[next] = (updated[next] ?? 0) + 1;
        }
        return updated;
      });
      onReactionChange?.(post, { next, previous });
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

  const attachments = useMemo(() => extractMediaAttachments(post), [post]);
  const totalConversationCount = (post.commentCount ?? 0) + (post.replyCount ?? 0);
  const focusSegments = useMemo(() => {
    const segments = Array.isArray(post.focusSegments)
      ? post.focusSegments
      : Array.isArray(post.audienceSegments)
        ? post.audienceSegments
        : [];
    return segments
      .map((segment) =>
        typeof segment === 'string'
          ? { id: segment, label: segment }
          : {
              id: segment.id || segment.slug || segment.label || segment.name,
              label: segment.label || segment.name || segment.title || segment.id,
            },
      )
      .filter((segment) => segment?.label);
  }, [post.audienceSegments, post.focusSegments]);

  const focusHighlights = useMemo(() => {
    const highlightSources = [];
    if (Array.isArray(post.focusRecommendations)) {
      highlightSources.push(...post.focusRecommendations);
    }
    if (Array.isArray(post.highlights)) {
      highlightSources.push(...post.highlights);
    }
    return highlightSources
      .map((highlight) =>
        typeof highlight === 'string'
          ? { id: highlight, label: highlight }
          : {
              id: highlight.id || highlight.label || highlight.title,
              label: highlight.label || highlight.title || highlight.summary,
            },
      )
      .filter((highlight) => highlight?.label);
  }, [post.focusRecommendations, post.highlights]);

  const insightMetrics = useMemo(() => {
    const metrics = post.metrics ?? post.engagement ?? {};
    const values = [];
    if (typeof metrics.views === 'number') {
      values.push({ id: 'views', label: 'Views', value: metrics.views.toLocaleString() });
    }
    if (typeof metrics.clicks === 'number') {
      values.push({ id: 'clicks', label: 'Profile taps', value: metrics.clicks.toLocaleString() });
    }
    if (typeof metrics.saves === 'number' || typeof metrics.bookmarks === 'number') {
      const saves = metrics.saves ?? metrics.bookmarks;
      values.push({ id: 'saves', label: 'Saves', value: saves.toLocaleString() });
    }
    if (typeof metrics.shares === 'number') {
      const shareValue = metrics.shares.toLocaleString();
      const shareRate =
        metrics.views && metrics.views > 0
          ? `${Math.round((metrics.shares / metrics.views) * 100)}% share rate`
          : null;
      values.push({ id: 'shares', label: 'Shares', value: shareValue, caption: shareRate });
    }
    if (typeof metrics.clickThroughRate === 'number' && Number.isFinite(metrics.clickThroughRate)) {
      values.push({
        id: 'ctr',
        label: 'Click-through',
        value: `${Math.round(metrics.clickThroughRate * 100)}%`,
      });
    }
    return values;
  }, [post.engagement, post.metrics]);

  const handleEditFormSubmit = (event) => {
    event.preventDefault();
    onEditSubmit?.(event, post);
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
        <form onSubmit={handleEditFormSubmit} className="space-y-4">
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
          <FocusSegmentList segments={focusSegments} />
          {bodyText ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{bodyText}</p>
          ) : null}
          {isNewsPost && author.name && heading !== author.name ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{author.name}</p>
          ) : null}
          <MediaAttachmentGrid attachments={attachments} />
          <OpportunityHighlights highlights={focusHighlights} />
          {post.link ? (
            <a
              href={post.link}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-accent transition hover:border-accent/50 hover:bg-white"
            >
              {linkLabel}
            </a>
          ) : null}
          <PostInsightStats metrics={insightMetrics} />
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
