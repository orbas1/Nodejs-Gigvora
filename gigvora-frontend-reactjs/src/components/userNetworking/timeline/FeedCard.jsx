import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowPathIcon,
  ChatBubbleOvalLeftIcon,
  ChevronDownIcon,
  FaceSmileIcon,
  HandThumbUpIcon,
  PaperAirplaneIcon,
  ShareIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import EmojiQuickPickerPopover from '../../popovers/EmojiQuickPickerPopover.jsx';
import UserAvatar from '../../UserAvatar.jsx';
import analytics from '../../../services/analytics.js';
import { createFeedComment, createFeedReply, listFeedComments } from '../../../services/liveFeed.js';
import { formatRelativeTime } from '../../../utils/date.js';
import {
  COMPACT_NUMBER_FORMATTER,
  DEFAULT_CHUNK_ESTIMATE,
  DEFAULT_EDIT_DRAFT,
  OPPORTUNITY_POST_TYPES,
  QUICK_REPLY_SUGGESTIONS,
  REACTION_LOOKUP,
  REACTION_OPTIONS,
  computeCommentCount,
  computeTotalReactions,
  normaliseCommentList,
  normaliseCommentsFromResponse,
  normaliseReactionSummary,
  normaliseSingleComment,
  resolveAuthor,
  resolvePostType,
} from './feedUtils.js';

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

function FeedLoadingSkeletons({ count = 2 }) {
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
          : 'rounded-xl border border-accent/40 bg-accentSoft px-6 py-8 text-accent shadow-inner transition'
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

  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const reactionPickerRef = useRef(null);
  const [comments, setComments] = useState(() => normaliseCommentList(post?.comments ?? [], post));
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');

  useEffect(() => {
    if (!reactionPickerOpen) {
      return undefined;
    }
    const handlePointerDown = (event) => {
      if (!reactionPickerRef.current) {
        return;
      }
      if (!reactionPickerRef.current.contains(event.target)) {
        setReactionPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [reactionPickerOpen]);

  const totalReactions = useMemo(() => {
    if (!reactionSummary) {
      return 0;
    }
    return Object.values(reactionSummary).reduce((total, value) => {
      const numeric = Number(value);
      return total + (Number.isFinite(numeric) ? numeric : 0);
    }, 0);
  }, [reactionSummary]);

  const topReactions = useMemo(() => {
    if (!reactionSummary) {
      return [];
    }
    return Object.entries(reactionSummary)
      .filter(([, count]) => Number(count) > 0)
      .map(([id, count]) => ({ id, count: Number(count), option: REACTION_LOOKUP[id] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [reactionSummary]);

  const activeReactionOption = activeReaction ? REACTION_LOOKUP[activeReaction] : null;
  const reactionButtonLabel = activeReactionOption?.activeLabel ?? 'React';
  const reactionButtonClasses = activeReactionOption
    ? activeReactionOption.activeClasses
    : 'border-slate-200 hover:border-accent/60 hover:text-accent';
  const ReactionIcon = activeReactionOption?.Icon ?? HandThumbUpIcon;
  const reactionMenuId = useMemo(() => `reaction-menu-${post.id}`, [post.id]);

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
      setReactionPickerOpen(false);
    },
    [onReactionChange, post],
  );

  const handleReactionButtonClick = useCallback(() => {
    handleReactionSelect(activeReaction ?? 'like');
  }, [activeReaction, handleReactionSelect]);

  const reactionSummaryLabel = useMemo(() => {
    if (!totalReactions) {
      return null;
    }
    return `${totalReactions} ${totalReactions === 1 ? 'appreciation' : 'appreciations'}`;
  }, [totalReactions]);

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
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <div ref={reactionPickerRef} className="relative inline-flex items-center">
              <button
                type="button"
                onClick={handleReactionButtonClick}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 transition ${reactionButtonClasses}`}
                aria-pressed={Boolean(activeReactionOption)}
              >
                <ReactionIcon className="h-4 w-4" />
                {reactionButtonLabel}
                {totalReactions ? (
                  <span className="ml-1 text-[0.65rem] font-semibold text-slate-400">· {totalReactions}</span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => setReactionPickerOpen((previous) => !previous)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setReactionPickerOpen((previous) => !previous);
                  }
                  if (event.key === 'Escape') {
                    setReactionPickerOpen(false);
                  }
                }}
                className={`ml-1 inline-flex items-center justify-center rounded-full border px-2 py-2 transition ${
                  reactionPickerOpen
                    ? 'border-accent text-accent'
                    : 'border-slate-200 text-slate-500 hover:border-accent/60 hover:text-accent'
                }`}
                aria-label="Open reaction palette"
                aria-haspopup="true"
                aria-controls={reactionMenuId}
                aria-expanded={reactionPickerOpen}
              >
                <ChevronDownIcon className="h-4 w-4" />
              </button>
              {reactionPickerOpen ? (
                <div
                  id={reactionMenuId}
                  className="absolute left-0 top-full z-30 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
                  role="menu"
                >
                  {REACTION_OPTIONS.map((option) => {
                    const isActive = option.id === activeReaction;
                    const optionCount = reactionSummary?.[option.id] ?? 0;
                    const OptionIcon = option.Icon;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleReactionSelect(option.id)}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                          isActive ? 'bg-slate-100 text-accent' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                        role="menuitem"
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-white ${option.dotClassName}`}
                          >
                            <OptionIcon className="h-4 w-4" />
                          </span>
                          <span className="flex flex-col items-start">
                            <span>{option.label}</span>
                            <span className="text-[0.65rem] font-medium text-slate-400">{option.description}</span>
                          </span>
                        </span>
                        <span className="text-xs font-semibold text-slate-400">{optionCount}</span>
                      </button>
                    );
                  })}
                  <p className="px-3 pt-2 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
                    Tailor your response for the community.
                  </p>
                </div>
              ) : null}
            </div>
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
          {reactionSummaryLabel ? (
            <div
              className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.7rem] font-semibold text-slate-600"
              aria-live="polite"
            >
              <div className="flex -space-x-1">
                {topReactions.map(({ id, option }) => {
                  const OptionIcon = option?.Icon ?? ReactionIcon;
                  const toneClass = option?.dotClassName ?? 'bg-slate-400';
                  return (
                    <span
                      key={id}
                      className={`flex h-5 w-5 items-center justify-center rounded-full border border-white text-white ${toneClass}`}
                      aria-hidden="true"
                    >
                      <OptionIcon className="h-3 w-3" />
                    </span>
                  );
                })}
              </div>
              <span>{reactionSummaryLabel}</span>
            </div>
          ) : null}
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

function FeedIdentityRail({ session, interests = [] }) {
  const followerTotal = session?.followers ?? '—';
  const connectionTotal = session?.connections ?? '—';

  return (
    <aside className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <UserAvatar name={session?.name ?? 'Member'} seed={session?.avatarSeed ?? session?.name} size="lg" />
          <div>
            <p className="text-lg font-semibold text-slate-900">{session?.name ?? 'Gigvora member'}</p>
            <p className="text-sm text-slate-500">{session?.title ?? 'Marketplace professional'}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Network reach</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Followers</dt>
              <dd className="mt-2 text-2xl font-semibold text-slate-900">{followerTotal}</dd>
            </div>
            <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Connections</dt>
              <dd className="mt-2 text-2xl font-semibold text-slate-900">{connectionTotal}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 space-y-5 text-sm text-slate-600">
          {Array.isArray(session?.companies) && session.companies.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Companies</p>
              <ul className="mt-3 space-y-2">
                {session.companies.map((company) => (
                  <li key={company} className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
                    {company}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {Array.isArray(session?.agencies) && session.agencies.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agencies & collectives</p>
              <ul className="mt-3 space-y-2">
                {session.agencies.map((agency) => (
                  <li key={agency} className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
                    {agency}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {Array.isArray(session?.accountTypes) && session.accountTypes.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account types</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {session.accountTypes.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center rounded-full border border-accent/40 bg-accentSoft px-3 py-1 text-[11px] font-semibold text-accent"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {interests.length ? (
            <div>
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
      </div>
    </aside>
  );
}

function FeedInsightsRail({
  connectionSuggestions = [],
  groupSuggestions = [],
  liveMoments = [],
  generatedAt = null,
}) {
  const hasSuggestions = connectionSuggestions.length || groupSuggestions.length;
  const hasLiveMoments = liveMoments.length > 0;

  const formatMemberCount = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return null;
    }
    return COMPACT_NUMBER_FORMATTER.format(numeric);
  };

  return (
    <aside className="space-y-6">
      {hasLiveMoments ? (
        <div className="rounded-[28px] bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-500 p-[1px] shadow-lg shadow-indigo-500/30">
          <div className="rounded-[26px] bg-white/95 p-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-slate-900">Live signals</p>
              {generatedAt ? (
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Updated {formatRelativeTime(generatedAt)}
                </span>
              ) : null}
            </div>
            <ul className="mt-4 space-y-3">
              {liveMoments.slice(0, 4).map((moment) => (
                <li
                  key={moment.id}
                  className="flex items-start gap-3 rounded-2xl bg-white/85 p-3 shadow-sm ring-1 ring-white/60 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="text-xl" aria-hidden="true">
                    {moment.icon ?? '⚡️'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{moment.title}</p>
                    {moment.preview ? (
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">{moment.preview}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-indigo-500">
                      {moment.tag ? <span>{moment.tag}</span> : null}
                      {moment.timestamp ? (
                        <span className="text-slate-400">{formatRelativeTime(moment.timestamp)}</span>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
      {connectionSuggestions.length ? (
        <div className="rounded-[28px] border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-lg shadow-slate-200/40">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Suggested connections</p>
            <Link to="/connections" className="text-xs font-semibold text-accent transition hover:text-accentDark">
              View all
            </Link>
          </div>
          <ul className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            {connectionSuggestions.slice(0, 4).map((connection) => {
              const mutualLabel = connection.mutualConnections === 1
                ? '1 mutual'
                : `${connection.mutualConnections ?? 0} mutual`;
              return (
                <li
                  key={connection.id}
                  className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:-translate-y-1 hover:border-accent/30 hover:shadow-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <span
                        className="pointer-events-none absolute -inset-1 rounded-full bg-gradient-to-br from-accent/30 via-transparent to-violet-400/40 opacity-0 blur-md transition group-hover:opacity-100"
                        aria-hidden="true"
                      />
                      <UserAvatar
                        name={connection.name}
                        seed={connection.avatarSeed ?? connection.name}
                        size="xs"
                        className="relative ring-2 ring-white"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 line-clamp-1">{connection.name}</p>
                      {connection.headline ? (
                        <p className="mt-1 text-xs text-slate-500 line-clamp-2">{connection.headline}</p>
                      ) : null}
                    </div>
                  </div>
                  {connection.reason ? (
                    <p className="mt-3 text-xs text-slate-500 line-clamp-2">{connection.reason}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {connection.location ? <span>{connection.location}</span> : null}
                    <span>{mutualLabel}</span>
                  </div>
                  <Link
                    to={`/connections?suggested=${encodeURIComponent(connection.id)}`}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent to-accentDark px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:shadow"
                  >
                    Start introduction
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {groupSuggestions.length ? (
        <div className="rounded-[28px] border border-slate-100 bg-white/95 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Groups to join</p>
            <Link to="/groups" className="text-xs font-semibold text-accent transition hover:text-accentDark">
              Explore groups
            </Link>
          </div>
          <ul className="mt-4 grid gap-4 text-sm">
            {groupSuggestions.slice(0, 4).map((group) => {
              const membersLabel = formatMemberCount(group.members);
              return (
                <li
                  key={group.id}
                  className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm transition hover:-translate-y-1 hover:border-accent/30 hover:shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900 line-clamp-1">{group.name}</p>
                    {membersLabel ? (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">
                        {membersLabel} members
                      </span>
                    ) : null}
                  </div>
                  {group.description ? (
                    <p className="mt-2 text-xs text-slate-500 line-clamp-3">{group.description}</p>
                  ) : null}
                  {group.focus?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {group.focus.slice(0, 3).map((focus) => (
                        <span
                          key={focus}
                          className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600"
                        >
                          {focus}
                        </span>
export { FeedLoadingSkeletons, VirtualFeedChunk, FeedIdentityRail, FeedInsightsRail };
export default FeedCard;
