import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  PaperAirplaneIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import UserAvatar from '../UserAvatar.jsx';
import analytics from '../../services/analytics.js';
import {
  createFeedComment,
  createFeedReply,
  listFeedComments,
} from '../../services/liveFeed.js';
import { formatRelativeTime } from '../../utils/date.js';
import {
  countThreadComments,
  normaliseCommentList,
  normaliseCommentsFromResponse,
  normaliseSingleComment,
  sortComments,
} from './commentUtils.js';

const DEFAULT_VISIBLE_COMMENTS = 5;

function highlightMentions(message) {
  if (!message) {
    return null;
  }
  return message.split('\n').map((line, lineIndex) => (
    <p key={`line-${lineIndex}`} className="text-sm leading-relaxed text-slate-600">
      {line.split(/(\@[A-Za-z0-9_\-\.]+)/g).map((segment, segmentIndex) =>
        segment.startsWith('@') ? (
          <span key={`segment-${lineIndex}-${segmentIndex}`} className="font-semibold text-accent">
            {segment}
          </span>
        ) : (
          <span key={`segment-${lineIndex}-${segmentIndex}`}>{segment}</span>
        ),
      )}
    </p>
  ));
}

function buildShareableUrl(post) {
  if (!post?.id) {
    return null;
  }
  if (post.permalink) {
    return post.permalink;
  }
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin || 'https://gigvora.com';
    return `${origin}/feed/${post.id}`;
  }
  return `https://gigvora.com/feed/${post.id}`;
}

function useCommentStatistics(comments, onStatisticsChange) {
  useEffect(() => {
    if (typeof onStatisticsChange !== 'function') {
      return;
    }
    onStatisticsChange({
      total: countThreadComments(comments),
      topContributors: comments.slice(0, 3).map((comment) => ({
        id: comment.id,
        author: comment.author,
        headline: comment.headline,
      })),
    });
  }, [comments, onStatisticsChange]);
}

export default function CommentsThread({
  post,
  viewer,
  quickReplies = [],
  onStatisticsChange,
}) {
  const viewerName = viewer?.name ?? 'You';
  const viewerHeadline = viewer?.title ?? viewer?.headline ?? 'Gigvora member';
  const viewerAvatarSeed = viewer?.avatarSeed ?? viewer?.name ?? viewerName;
  const [comments, setComments] = useState(() => normaliseCommentList(post?.comments ?? [], post));
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [replyDrafts, setReplyDrafts] = useState({});
  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE_COMMENTS);
  const [sortMode, setSortMode] = useState('recent');
  const [submitting, setSubmitting] = useState(false);

  const officialAuthorId =
    post?.User?.id ?? post?.userId ?? post?.authorId ?? post?.author?.id ?? post?.User?.userId ?? null;

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

    const load = async () => {
      setLoading(true);
      try {
        const response = await listFeedComments(post.id, { signal: controller.signal });
        if (ignore) {
          return;
        }
        const fetched = normaliseCommentsFromResponse(response, post);
        if (fetched.length) {
          setComments(fetched);
        }
        setError(null);
      } catch (loadError) {
        if (ignore || controller.signal.aborted) {
          return;
        }
        setError(loadError);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [post?.id]);

  useCommentStatistics(comments, onStatisticsChange);

  useEffect(() => {
    const total = countThreadComments(comments);
    setVisibleCount((previous) => {
      if (!total) {
        return DEFAULT_VISIBLE_COMMENTS;
      }
      return Math.min(Math.max(DEFAULT_VISIBLE_COMMENTS, previous), total);
    });
  }, [comments]);

  const sortedComments = useMemo(() => sortComments(comments, { mode: sortMode }), [comments, sortMode]);
  const visibleComments = useMemo(
    () => (visibleCount ? sortedComments.slice(0, visibleCount) : sortedComments),
    [sortedComments, visibleCount],
  );

  const totalCount = countThreadComments(comments);
  const shareableUrl = useMemo(() => buildShareableUrl(post), [post]);

  const handleSortChange = useCallback((nextMode) => {
    setSortMode(nextMode);
    analytics.track(
      'web_feed_comment_sort_toggle',
      { postId: post?.id, mode: nextMode },
      { source: 'web_app' },
    );
  }, [post?.id]);

  const handleRefresh = useCallback(async () => {
    if (!post?.id) {
      return;
    }
    setRefreshing(true);
    try {
      const response = await listFeedComments(post.id);
      const fetched = normaliseCommentsFromResponse(response, post);
      setComments(fetched);
      setError(null);
    } catch (refreshError) {
      setError(refreshError);
    } finally {
      setRefreshing(false);
    }
  }, [post]);

  const handleCommentSubmit = useCallback(async (event) => {
    event.preventDefault();
    const trimmed = commentDraft.trim();
    if (!trimmed) {
      return;
    }
    const optimisticId = `${post?.id ?? 'feed-post'}-draft-${Date.now()}`;
    const optimisticComment = {
      id: optimisticId,
      author: viewerName,
      headline: viewerHeadline,
      message: trimmed,
      createdAt: new Date().toISOString(),
      replies: [],
      user: { id: viewer?.id ?? viewer?.userId ?? null },
    };
    setComments((previous) => [optimisticComment, ...previous]);
    setCommentDraft('');
    setError(null);
    setSubmitting(true);
    analytics.track('web_feed_comment_submit', { postId: post?.id }, { source: 'web_app' });

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
    } catch (submitError) {
      setComments((previous) => previous.filter((existing) => existing.id !== optimisticId));
      setError(submitError);
    } finally {
      setSubmitting(false);
    }
  }, [commentDraft, post, viewerName, viewerHeadline, viewer?.id, viewer?.userId]);

  const handleReplyChange = useCallback((commentId, value) => {
    setReplyDrafts((previous) => ({ ...previous, [commentId]: value }));
  }, []);

  const handleReplySubmit = useCallback(
    async (commentId) => {
      const draft = replyDrafts[commentId];
      const trimmed = (draft ?? '').trim();
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
        user: { id: viewer?.id ?? viewer?.userId ?? null },
      };

      setComments((previous) =>
        previous.map((existing) =>
          existing.id === commentId
            ? {
                ...existing,
                replies: [optimisticReply, ...(existing.replies ?? [])],
              }
            : existing,
        ),
      );
      setReplyDrafts((previous) => ({ ...previous, [commentId]: '' }));
      setError(null);
      analytics.track(
        'web_feed_reply_submit',
        { postId: post?.id, commentId },
        { source: 'web_app' },
      );

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
      } catch (replyError) {
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
        setError(replyError);
      }
    },
    [post, replyDrafts, viewerName, viewerHeadline, viewer?.id, viewer?.userId],
  );

  const renderCommentMeta = useCallback(
    (comment) => (
      <div className="flex flex-wrap items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">
        <span>{formatRelativeTime(comment.createdAt)}</span>
        {comment.user?.id && comment.user.id === officialAuthorId ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[0.65rem] font-semibold text-emerald-700">
            <SparklesIcon className="h-3 w-3" /> Official update
          </span>
        ) : null}
      </div>
    ),
    [officialAuthorId],
  );

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Conversations</p>
          <p className="text-xs text-slate-400">{totalCount} total contributions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-xs font-semibold text-slate-500">
            <button
              type="button"
              className={`rounded-full px-3 py-1 transition ${
                sortMode === 'recent' ? 'bg-accent text-white shadow' : 'hover:text-accent'
              }`}
              onClick={() => handleSortChange('recent')}
            >
              Recent
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1 transition ${
                sortMode === 'popular' ? 'bg-accent text-white shadow' : 'hover:text-accent'
              }`}
              onClick={() => handleSortChange('popular')}
            >
              Highlights
            </button>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
              refreshing ? 'border-accent text-accent' : 'border-slate-200 text-slate-500 hover:border-accent/60 hover:text-accen'
            }`}
            disabled={refreshing}
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>
      </header>

      <form onSubmit={handleCommentSubmit} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-inner">
        <label htmlFor={`comment-${post?.id}`} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Join the conversation
        </label>
        <div className="mt-3 flex gap-3">
          <UserAvatar name={viewerName} seed={viewerAvatarSeed} size="sm" showGlow={false} />
          <textarea
            id={`comment-${post?.id}`}
            value={commentDraft}
            onChange={(event) => setCommentDraft(event.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder="Offer context, signal interest, or tag a collaborator…"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-wide text-slate-400">
            {quickReplies.slice(0, 3).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() =>
                  setCommentDraft((previous) =>
                    previous ? `${previous}\n${suggestion}` : suggestion,
                  )
                }
                className="rounded-full border border-slate-200 px-3 py-1 font-semibold transition hover:border-accent/60 hover:text-accent"
              >
                {suggestion.slice(0, 32)}…
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={!commentDraft.trim() || submitting}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white transition ${
              commentDraft.trim() && !submitting
                ? 'bg-accent hover:bg-accentDark'
                : 'cursor-not-allowed bg-accent/40'
            }`}
          >
            <PaperAirplaneIcon className="h-4 w-4" />
            {submitting ? 'Posting…' : 'Comment'}
          </button>
        </div>
      </form>

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          {error?.message || 'We could not load the latest conversation. Please try again soon.'}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white/80 p-4 text-xs text-slate-500">
          <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
        </div>
      ) : null}

      <ol className="space-y-4">
        {visibleComments.map((comment) => (
          <li key={comment.id} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <UserAvatar name={comment.author} seed={comment.author} size="sm" />
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{comment.author}</p>
                  <p className="text-xs text-slate-500">{comment.headline}</p>
                </div>
                <div className="space-y-2">{highlightMentions(comment.message)}</div>
                {renderCommentMeta(comment)}
                <div className="space-y-3 border-l border-slate-200 pl-4">
                  <label htmlFor={`reply-${comment.id}`} className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
                    Reply
                  </label>
                  <textarea
                    id={`reply-${comment.id}`}
                    value={replyDrafts[comment.id] ?? ''}
                    onChange={(event) => handleReplyChange(comment.id, event.target.value)}
                    rows={2}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="Add insight or connect someone who can help…"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleReplySubmit(comment.id)}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-700"
                    >
                      <PaperAirplaneIcon className="h-4 w-4" />
                      Reply
                    </button>
                    {comment.replies?.length ? (
                      <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
                        {comment.replies.length}{' '}
                        {comment.replies.length === 1 ? 'reply' : 'replies'}
                      </span>
                    ) : null}
                  </div>
                  {comment.replies?.length ? (
                    <ul className="space-y-3">
                      {comment.replies.map((reply) => (
                        <li key={reply.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                          <div className="flex items-start gap-3">
                            <UserAvatar name={reply.author} seed={reply.author} size="xs" />
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-slate-900">{reply.author}</p>
                                <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
                                  {formatRelativeTime(reply.createdAt)}
                                </span>
                              </div>
                              <div className="space-y-1 text-sm text-slate-600 leading-relaxed">
                                {highlightMentions(reply.message)}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>

      {sortedComments.length > visibleComments.length ? (
        <button
          type="button"
          onClick={() => setVisibleCount((previous) => previous + DEFAULT_VISIBLE_COMMENTS)}
          className="w-full rounded-full border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
        >
          Show more conversations
        </button>
      ) : null}

      {!loading && !sortedComments.length ? (
        <p className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-xs text-slate-500">
          Spark the conversation with the first reply.
        </p>
      ) : null}

      {shareableUrl ? (
        <footer className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
          Share conversation link: <span className="ml-1 text-slate-500">{shareableUrl}</span>
        </footer>
      ) : null}
    </section>
  );
}
