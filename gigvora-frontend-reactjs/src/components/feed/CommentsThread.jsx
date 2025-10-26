import { Fragment, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ChatBubbleOvalLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FaceSmileIcon,
  GlobeAltIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
  SparklesIcon,
  BookmarkSquareIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { Transition } from '@headlessui/react';
import UserAvatar from '../UserAvatar.jsx';
import EmojiQuickPickerPopover from '../popovers/EmojiQuickPickerPopover.jsx';
import analytics from '../../services/analytics.js';
import { formatRelativeTime } from '../../utils/date.js';

const LANGUAGE_DICTIONARY = {
  es: {
    hola: 'hello',
    felicitaciones: 'congratulations',
    equipo: 'team',
    gracias: 'thank you',
    impresionante: 'impressive',
    avance: 'progress',
    increíble: 'incredible',
    apoyo: 'support',
  },
  fr: {
    bonjour: 'hello',
    félicitations: 'congratulations',
    équipe: 'team',
    merci: 'thank you',
    incroyable: 'incredible',
    soutien: 'support',
    progrès: 'progress',
    lancement: 'launch',
  },
  pt: {
    olá: 'hello',
    parabéns: 'congratulations',
    equipe: 'team',
    obrigado: 'thank you',
    incrível: 'incredible',
    apoio: 'support',
    progresso: 'progress',
  },
  de: {
    hallo: 'hello',
    glückwunsch: 'congratulations',
    team: 'team',
    danke: 'thank you',
    beeindruckend: 'impressive',
    unterstützung: 'support',
    fortschritt: 'progress',
  },
};

const UPPERCASE_PATTERN = /^[A-ZÀ-Ý]/;

function detectLanguage(message) {
  if (!message) {
    return 'en';
  }
  const normalised = message.toLowerCase();
  return (
    Object.keys(LANGUAGE_DICTIONARY).find((language) =>
      Object.keys(LANGUAGE_DICTIONARY[language]).some((word) => normalised.includes(word)),
    ) ?? 'en'
  );
}

function titleCase(value) {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function translateMessage(message) {
  const language = detectLanguage(message);
  if (language === 'en') {
    return message;
  }
  const dictionary = LANGUAGE_DICTIONARY[language];
  return message
    .split(/(\b)/)
    .map((segment) => {
      const lookup = dictionary[segment.toLowerCase()];
      if (!lookup) {
        return segment;
      }
      return UPPERCASE_PATTERN.test(segment) ? titleCase(lookup) : lookup;
    })
    .join('');
}

function scoreComment(comment) {
  const replyCount = Array.isArray(comment.replies) ? comment.replies.length : 0;
  return replyCount * 3 + (comment.isOfficial ? 5 : 0);
}

function normaliseCommentForDisplay(comment, postAuthorName) {
  if (!comment) {
    return comment;
  }
  const metadata = comment.metadata && typeof comment.metadata === 'object' ? comment.metadata : null;
  const trimmedHeadline = comment.headline?.trim();
  const headline = trimmedHeadline?.length ? trimmedHeadline : 'Gigvora member';
  const isOfficial = Boolean(
    comment.isOfficial ||
      metadata?.isOfficial ||
      metadata?.official ||
      (postAuthorName && comment.author && comment.author.toLowerCase() === postAuthorName.toLowerCase()) ||
      headline.toLowerCase().includes('gigvora') ||
      headline.toLowerCase().includes('team'),
  );
  const isPinned = Boolean(comment.isPinned ?? metadata?.isPinned ?? metadata?.pinned);
  const insightTags = Array.isArray(comment.insightTags)
    ? comment.insightTags
    : Array.isArray(metadata?.insightTags)
    ? metadata.insightTags
    : [];
  const guidance = typeof (comment.guidance ?? metadata?.guidance) === 'string'
    ? (comment.guidance ?? metadata?.guidance)
    : null;
  return {
    ...comment,
    headline,
    isOfficial,
    isPinned,
    insightTags,
    guidance,
  };
}

function buildSortedComments(comments, sortMode, postAuthorName) {
  const prepared = comments.map((comment) => normaliseCommentForDisplay(comment, postAuthorName));
  if (sortMode === 'recent') {
    return prepared
      .slice()
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) {
          return -1;
        }
        if (!a.isPinned && b.isPinned) {
          return 1;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }
  return prepared
    .slice()
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) {
        return -1;
      }
      if (!a.isPinned && b.isPinned) {
        return 1;
      }
      const scoreDifference = scoreComment(b) - scoreComment(a);
      if (scoreDifference !== 0) {
        return scoreDifference;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
}

function CommentReplies({ comment, onReply, translationState, onToggleTranslation }) {
  const [replying, setReplying] = useState(false);
  const [replyDraft, setReplyDraft] = useState('');
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const replyId = `reply-${comment.id}`;
  const showTranslate = detectLanguage(comment.message) !== 'en';

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
      <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">{comment.headline}</p>
      {comment.isPinned ? (
        <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-accentSoft px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-accent">
          <BookmarkSquareIcon className="h-4 w-4" /> Pinned insight
        </span>
      ) : null}
      <p className="mt-3 whitespace-pre-line text-sm text-slate-700">
        {translationState?.enabled ? translationState.message : comment.message}
      </p>
      {comment.guidance ? (
        <p className="mt-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-[0.65rem] text-indigo-700">
          {comment.guidance}
        </p>
      ) : null}
      {Array.isArray(comment.insightTags) && comment.insightTags.length ? (
        <ul className="mt-2 flex flex-wrap gap-2 text-[0.6rem] font-semibold uppercase tracking-wide text-indigo-600">
          {comment.insightTags.map((tag) => (
            <li key={`${comment.id}-${tag}`} className="rounded-full bg-indigo-100 px-2 py-1">
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <button
          type="button"
          onClick={() => setReplying(true)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 transition hover:border-accent/60 hover:text-accent"
        >
          <ChatBubbleOvalLeftIcon className="h-4 w-4" /> Reply
        </button>
        {comment.replies?.length ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
            {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
          </span>
        ) : null}
        {comment.isOfficial ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-600">
            <ShieldCheckIcon className="h-4 w-4" /> Official response
          </span>
        ) : null}
        {showTranslate ? (
          <button
            type="button"
            onClick={() => onToggleTranslation?.(comment.id)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide transition ${
              translationState?.enabled
                ? 'border-accent text-accent'
                : 'border-slate-200 text-slate-500 hover:border-accent/60 hover:text-accent'
            }`}
          >
            <GlobeAltIcon className="h-4 w-4" /> {translationState?.enabled ? 'Show original' : 'Translate' }
          </button>
        ) : null}
      </div>
      {Array.isArray(comment.replies) && comment.replies.length ? (
        <div className="mt-3 space-y-2 border-l-2 border-accent/30 pl-4">
          {comment.replies.map((reply) => {
            const translated = translationState?.replies?.[reply.id];
            const replyShowTranslate = detectLanguage(reply.message) !== 'en';
            return (
              <div key={reply.id} className="rounded-2xl bg-white/90 p-3 text-sm text-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <span className="font-semibold text-slate-700">{reply.author}</span>
                  <span>{formatRelativeTime(reply.createdAt)}</span>
                </div>
                <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">{reply.headline}</p>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                  {translated?.enabled ? translated.message : reply.message}
                </p>
                {reply.guidance ? (
                  <p className="mt-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-[0.65rem] text-indigo-700">
                    {reply.guidance}
                  </p>
                ) : null}
                {Array.isArray(reply.insightTags) && reply.insightTags.length ? (
                  <ul className="mt-2 flex flex-wrap gap-2 text-[0.6rem] font-semibold uppercase tracking-wide text-indigo-600">
                    {reply.insightTags.map((tag) => (
                      <li key={`${reply.id}-${tag}`} className="rounded-full bg-indigo-100 px-2 py-1">
                        {tag}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {replyShowTranslate ? (
                  <button
                    type="button"
                    onClick={() => onToggleTranslation?.(comment.id, reply.id)}
                    className={`mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide transition ${
                      translated?.enabled
                        ? 'border-accent text-accent'
                        : 'border-slate-200 text-slate-500 hover:border-accent/60 hover:text-accent'
                    }`}
                  >
                    <GlobeAltIcon className="h-4 w-4" /> {translated?.enabled ? 'Show original' : 'Translate'}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
      {replying ? (
        <form onSubmit={handleSubmit} className="relative mt-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-soft">
          <label htmlFor={replyId} className="sr-only">
            Reply to comment
          </label>
          <textarea
            id={replyId}
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
                <FaceSmileIcon className="h-4 w-4" /> Emoji
              </button>
              <EmojiQuickPickerPopover
                open={showEmojiTray}
                onClose={() => setShowEmojiTray(false)}
                onSelect={(emoji) => setReplyDraft((previous) => `${previous}${emoji}`)}
                labelledBy="comment-emoji-trigger"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReplying(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!replyDraft.trim()}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold text-white transition ${
                  replyDraft.trim() ? 'bg-accent hover:bg-accentDark' : 'cursor-not-allowed bg-accent/40'
                }`}
              >
                <PaperAirplaneIcon className="h-4 w-4" /> Reply
              </button>
            </div>
          </div>
        </form>
      ) : null}
    </div>
  );
}

CommentReplies.propTypes = {
  comment: PropTypes.object.isRequired,
  onReply: PropTypes.func,
  translationState: PropTypes.shape({
    enabled: PropTypes.bool,
    message: PropTypes.string,
    replies: PropTypes.object,
  }),
  onToggleTranslation: PropTypes.func,
};

CommentReplies.defaultProps = {
  onReply: undefined,
  translationState: undefined,
  onToggleTranslation: undefined,
};

export default function CommentsThread({
  comments,
  loading,
  error,
  onRetry,
  onReply,
  onSubmit,
  commentDraft,
  onCommentDraftChange,
  quickReplies,
  viewer,
  postId,
  postAuthorName,
  threadInsights,
}) {
  const [sortMode, setSortMode] = useState('relevance');
  const [translationState, setTranslationState] = useState({});
  const [showComposerTips, setShowComposerTips] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);

  const findCommentMessage = (commentId) => {
    const comment = comments.find((entry) => entry.id === commentId);
    return comment?.message ?? '';
  };

  const findReplyMessage = (commentId, replyId) => {
    const comment = comments.find((entry) => entry.id === commentId);
    if (!comment) {
      return '';
    }
    const reply = (comment.replies ?? []).find((entry) => entry.id === replyId);
    return reply?.message ?? '';
  };

  const sortedComments = useMemo(
    () => buildSortedComments(comments, sortMode, postAuthorName),
    [comments, sortMode, postAuthorName],
  );

  const totalReplies = useMemo(
    () =>
      comments.reduce(
        (total, comment) => total + 1 + (Array.isArray(comment.replies) ? comment.replies.length : 0),
        0,
      ),
    [comments],
  );

  const threadMetrics = useMemo(() => {
    if (!Array.isArray(comments) || !comments.length) {
      return {
        officialCount: 0,
        pinnedCount: 0,
        participantCount: 0,
        averageReplyDepth: 0,
        languageDiversity: 1,
      };
    }
    let officialCount = 0;
    let pinnedCount = 0;
    let replyCount = 0;
    const participants = new Set();
    const languages = new Set();

    comments.forEach((comment) => {
      const prepared = normaliseCommentForDisplay(comment, postAuthorName);
      if (prepared.isOfficial) {
        officialCount += 1;
      }
      if (prepared.isPinned) {
        pinnedCount += 1;
      }
      if (prepared.author) {
        participants.add(prepared.author.toLowerCase());
      }
      replyCount += Array.isArray(comment.replies) ? comment.replies.length : 0;
      const commentLanguage = prepared.language ?? detectLanguage(comment.message);
      languages.add(commentLanguage);
      if (Array.isArray(comment.replies)) {
        comment.replies.forEach((reply) => {
          if (reply.author) {
            participants.add(reply.author.toLowerCase());
          }
          const replyLanguage = reply.language ?? detectLanguage(reply.message);
          languages.add(replyLanguage);
        });
      }
    });

    const participantCount = participants.size;
    const averageReplyDepth = participantCount ? Math.round((replyCount / comments.length) * 10) / 10 : 0;

    return {
      officialCount,
      pinnedCount,
      participantCount,
      averageReplyDepth,
      languageDiversity: Math.max(languages.size, 1),
    };
  }, [comments, postAuthorName]);

  const resolvedThreadInsights = useMemo(() => {
    if (Array.isArray(threadInsights) && threadInsights.length) {
      return threadInsights;
    }
    if (!comments.length) {
      return [];
    }
    const insights = [];
    if (threadMetrics.officialCount) {
      insights.push({
        id: 'official-voices',
        title: `${threadMetrics.officialCount} official ${threadMetrics.officialCount === 1 ? 'voice' : 'voices'}`,
        description: 'Founders or workspace owners are guiding this thread.',
      });
    }
    if (threadMetrics.pinnedCount) {
      insights.push({
        id: 'pinned-guidance',
        title: `${threadMetrics.pinnedCount} pinned insight${threadMetrics.pinnedCount === 1 ? '' : 's'}`,
        description: 'Pinned responses summarise agreed actions and follow-ups.',
      });
    }
    if (threadMetrics.participantCount) {
      insights.push({
        id: 'participant-breadth',
        title: `${threadMetrics.participantCount} participant${threadMetrics.participantCount === 1 ? '' : 's'}`,
        description: 'Mentors, founders, and partners are engaging in the thread.',
      });
    }
    if (threadMetrics.languageDiversity > 1) {
      insights.push({
        id: 'language-coverage',
        title: `${threadMetrics.languageDiversity} languages represented`,
        description: 'Multilingual replies ensure global teams stay aligned.',
      });
    }
    return insights;
  }, [comments, threadInsights, threadMetrics]);

  const handleToggleTranslation = (commentId, replyId) => {
    setTranslationState((previous) => {
      const existing = previous[commentId] ?? { enabled: false, replies: {} };
      if (replyId) {
        const replyExisting = existing.replies?.[replyId] ?? { enabled: false };
        const nextReply = {
          enabled: !replyExisting.enabled,
          message: replyExisting.enabled ? replyExisting.message : translateMessage(findReplyMessage(commentId, replyId)),
        };
        return {
          ...previous,
          [commentId]: {
            ...existing,
            replies: {
              ...existing.replies,
              [replyId]: nextReply,
            },
          },
        };
      }
      return {
        ...previous,
        [commentId]: {
          enabled: !existing.enabled,
          message: existing.enabled ? existing.message : translateMessage(findCommentMessage(commentId)),
          replies: existing.replies ?? {},
        },
      };
    });
  };

  const composerPlaceholder = 'Offer context, signal interest, or tag a collaborator…';

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(event);
  };

  const handleSortChange = (mode) => {
    setSortMode(mode);
    analytics.track('web_feed_comment_sort_change', { postId, mode }, { source: 'web_app' });
  };

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Join the conversation</p>
          <p className="text-xs text-slate-500">{totalReplies} contributions from the community</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.65rem] uppercase tracking-wide text-slate-400">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-slate-500">
              <ShieldCheckIcon className="h-4 w-4 text-emerald-500" /> Official voices {threadMetrics.officialCount}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-slate-500">
              <BookmarkSquareIcon className="h-4 w-4 text-accent" /> Pinned threads {threadMetrics.pinnedCount}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-slate-500">
              <ChatBubbleOvalLeftIcon className="h-4 w-4 text-indigo-500" /> Participants {threadMetrics.participantCount}
            </span>
            <button
              type="button"
              onClick={() => setInsightsOpen((previous) => {
                const next = !previous;
                analytics.track('web_feed_comment_insights_toggle', { postId, open: next }, { source: 'web_app' });
                return next;
              })}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 font-semibold transition ${
                insightsOpen
                  ? 'border-accent text-accent'
                  : 'border-slate-200 text-slate-500 hover:border-accent/60 hover:text-accent'
              }`}
            >
              <InformationCircleIcon className="h-4 w-4" /> Insights
            </button>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
          <SparklesIcon className="h-4 w-4 text-accent" />
          <span>Sort</span>
          <button
            type="button"
            onClick={() => handleSortChange(sortMode === 'relevance' ? 'recent' : 'relevance')}
            className="inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-accent transition hover:border-accent/20"
          >
            {sortMode === 'relevance' ? 'Most recent' : 'Most relevant'}
            {sortMode === 'relevance' ? <ChevronDownIcon className="h-3 w-3" /> : <ChevronUpIcon className="h-3 w-3" />}
          </button>
        </div>
      </header>

      <Transition
        as={Fragment}
        show={insightsOpen || resolvedThreadInsights.length > 0}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 -translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 -translate-y-1"
      >
        <aside className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 text-[0.7rem] text-slate-600">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Thread insights</p>
            <div className="flex flex-wrap items-center gap-2 text-[0.65rem] text-slate-500">
              <span>Avg replies {threadMetrics.averageReplyDepth}</span>
              <span>Languages {threadMetrics.languageDiversity}</span>
            </div>
          </div>
          {resolvedThreadInsights.length ? (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {resolvedThreadInsights.slice(0, 4).map((insight) => (
                <li key={insight.id} className="rounded-2xl bg-white/90 p-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-800">{insight.title}</p>
                  {insight.description ? (
                    <p className="mt-1 text-[0.75rem] text-slate-500">{insight.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[0.7rem] text-slate-500">
              Insights synthesise momentum across official voices, mentors, and founders to guide your next reply.
            </p>
          )}
        </aside>
      </Transition>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex items-start gap-3">
          <UserAvatar name={viewer?.name} seed={viewer?.avatarSeed ?? viewer?.name} size="sm" showGlow={false} />
          <div className="flex-1 space-y-3">
            <textarea
              value={commentDraft}
              onChange={(event) => onCommentDraftChange?.(event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder={composerPlaceholder}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-[0.65rem] uppercase tracking-wide text-slate-400">
                {quickReplies.slice(0, 3).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      analytics.track('web_feed_comment_quick_reply_insert', { postId }, { source: 'web_app' });
                      onCommentDraftChange?.((commentDraft ?? '').trim() ? `${commentDraft}\n${suggestion}` : suggestion);
                    }}
                    className="rounded-full border border-slate-200 px-3 py-1 font-semibold transition hover:border-accent/60 hover:text-accent"
                  >
                    {suggestion.slice(0, 24)}…
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowComposerTips((previous) => !previous)}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 font-semibold transition hover:border-accent/60 hover:text-accent"
                >
                  Guidance
                </button>
              </div>
              <button
                type="submit"
                disabled={!commentDraft?.trim()}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white transition ${
                  commentDraft?.trim() ? 'bg-accent hover:bg-accentDark' : 'cursor-not-allowed bg-accent/40'
                }`}
              >
                <PaperAirplaneIcon className="h-4 w-4" /> Comment
              </button>
            </div>
          </div>
        </div>
        <Transition
          as={Fragment}
          show={showComposerTips}
          enter="transition ease-out duration-150"
          enterFrom="opacity-0 -translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 -translate-y-1"
        >
          <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-white/80 p-3 text-[0.65rem] text-slate-500">
            <p className="font-semibold text-slate-700">Commenting guidance</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Lead with context so founders and mentors can respond quickly.</li>
              <li>Highlight how you can help—offers of support unlock faster follow-ups.</li>
              <li>Respect confidentiality agreements when sharing client work.</li>
            </ul>
          </div>
        </Transition>
      </form>

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          <p>{error.message || 'We could not load the latest conversation. Please try again soon.'}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-200 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-amber-700 transition hover:border-amber-300"
            >
              Refresh conversation
            </button>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white/80 p-4 text-xs text-slate-500" aria-busy="true">
          <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
        </div>
      ) : null}

      <div className="space-y-3">
        {sortedComments.map((comment) => (
          <CommentReplies
            key={comment.id}
            comment={{ ...comment, postId }}
            onReply={onReply}
            translationState={translationState[comment.id]}
            onToggleTranslation={handleToggleTranslation}
          />
        ))}
        {!loading && !sortedComments.length ? (
          <p className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-xs text-slate-500">
            Spark the conversation with the first reply.
          </p>
        ) : null}
      </div>
    </section>
  );
}

CommentsThread.propTypes = {
  comments: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  error: PropTypes.object,
  onRetry: PropTypes.func,
  onReply: PropTypes.func,
  onSubmit: PropTypes.func,
  commentDraft: PropTypes.string,
  onCommentDraftChange: PropTypes.func,
  quickReplies: PropTypes.arrayOf(PropTypes.string),
  viewer: PropTypes.shape({
    name: PropTypes.string,
    avatarSeed: PropTypes.string,
  }),
  postId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  postAuthorName: PropTypes.string,
  threadInsights: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
    }),
  ),
};

CommentsThread.defaultProps = {
  comments: [],
  loading: false,
  error: null,
  onRetry: undefined,
  onReply: undefined,
  onSubmit: undefined,
  commentDraft: '',
  onCommentDraftChange: undefined,
  quickReplies: [],
  viewer: null,
  postId: undefined,
  postAuthorName: undefined,
  threadInsights: [],
};
