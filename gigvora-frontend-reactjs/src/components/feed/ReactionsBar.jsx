import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChatBubbleOvalLeftIcon,
  ChevronDownIcon,
  HandThumbUpIcon,
  InformationCircleIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import analytics from '../../services/analytics.js';
import {
  REACTION_OPTIONS,
  REACTION_LOOKUP,
  REACTION_SUMMARY_FALLBACK,
  REACTION_SUMMARY_LABELS,
} from './reactionTokens.js';

const COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function mergeSummary(summary) {
  return { ...REACTION_SUMMARY_FALLBACK, ...(summary ?? {}) };
}

function buildSummaryLabel(total) {
  if (!total) {
    return null;
  }
  const noun = total === 1 ? 'appreciation' : 'appreciations';
  return `${COMPACT_NUMBER_FORMATTER.format(total)} ${noun}`;
}

export default function ReactionsBar({
  post,
  postId,
  initialSummary,
  initialViewerReaction,
  viewerHasLiked = false,
  commentCount = 0,
  shareCount = 0,
  onReactionChange,
  onOpenShare,
  insightAvatars = [],
}) {
  const resolvedPostId = postId ?? post?.id ?? 'feed-post';
  const [summary, setSummary] = useState(() => mergeSummary(initialSummary));
  const [activeReaction, setActiveReaction] = useState(
    initialViewerReaction ?? (viewerHasLiked ? 'like' : null),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const pickerRef = useRef(null);
  const insightsRef = useRef(null);

  useEffect(() => {
    setSummary(mergeSummary(initialSummary));
  }, [initialSummary]);

  useEffect(() => {
    setActiveReaction(initialViewerReaction ?? (viewerHasLiked ? 'like' : null));
  }, [initialViewerReaction, viewerHasLiked]);

  useEffect(() => {
    if (!pickerOpen && !insightsOpen) {
      return undefined;
    }
    const handlePointer = (event) => {
      if (pickerOpen && pickerRef.current && !pickerRef.current.contains(event.target)) {
        setPickerOpen(false);
      }
      if (insightsOpen && insightsRef.current && !insightsRef.current.contains(event.target)) {
        setInsightsOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('touchstart', handlePointer);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
    };
  }, [pickerOpen, insightsOpen]);

  const totalReactions = useMemo(() => {
    return Object.values(summary).reduce((total, value) => {
      const numeric = Number(value);
      return total + (Number.isFinite(numeric) ? numeric : 0);
    }, 0);
  }, [summary]);

  const topReactions = useMemo(() => {
    return Object.entries(summary)
      .filter(([id, count]) => REACTION_LOOKUP[id] && Number(count) > 0)
      .map(([id, count]) => ({
        id,
        count: Number(count),
        option: REACTION_LOOKUP[id],
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [summary]);

  const reactionSummaryLabel = useMemo(() => buildSummaryLabel(totalReactions), [totalReactions]);

  const activeReactionOption = activeReaction ? REACTION_LOOKUP[activeReaction] : null;
  const reactionButtonLabel = activeReactionOption?.activeLabel ?? 'React';
  const reactionButtonClasses = activeReactionOption
    ? activeReactionOption.activeClasses
    : 'border-slate-200 hover:border-accent/60 hover:text-accent';
  const ReactionIcon = activeReactionOption?.Icon ?? REACTION_LOOKUP.like?.Icon ?? HandThumbUpIcon;

  const reactionMenuId = useMemo(() => `reaction-menu-${resolvedPostId}`, [resolvedPostId]);
  const insightsId = useMemo(() => `reaction-insights-${resolvedPostId}`, [resolvedPostId]);
  const formattedShareCount = useMemo(() => {
    const numeric = Number(shareCount);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
  }, [shareCount]);
  const shareLabel = formattedShareCount === 1 ? 'share' : 'shares';

  const handleReactionSelect = (reactionId) => {
    setActiveReaction((previous) => {
      const willActivate = previous !== reactionId;
      setSummary((current) => {
        const next = { ...current };
        if (previous && typeof next[previous] === 'number') {
          next[previous] = Math.max(0, next[previous] - 1);
        }
        if (willActivate) {
          next[reactionId] = (next[reactionId] ?? 0) + 1;
        }
        return next;
      });
      analytics.track(
        'web_feed_reaction_click',
        { postId: resolvedPostId, reaction: reactionId, active: willActivate },
        { source: 'web_app' },
      );
      if (typeof onReactionChange === 'function') {
        onReactionChange(post ?? resolvedPostId, { next: willActivate ? reactionId : null, previous });
      }
      return willActivate ? reactionId : null;
    });
    setPickerOpen(false);
  };

  const handleToggleReaction = () => {
    handleReactionSelect(activeReaction ?? 'like');
  };

  const trendingReaction = topReactions[0];
  const insightDescription = trendingReaction
    ? `${trendingReaction.count} ${REACTION_SUMMARY_LABELS[trendingReaction.id] ?? 'responses'} leading`
    : 'Invite the first appreciation';

  return (
    <div className="relative flex flex-wrap items-center gap-3 rounded-[26px] border border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleToggleReaction}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${reactionButtonClasses}`}
          aria-pressed={Boolean(activeReactionOption)}
        >
          <ReactionIcon className="h-4 w-4" />
          {reactionButtonLabel}
          {totalReactions ? (
            <span className="ml-1 text-[0.7rem] font-semibold text-slate-400">· {COMPACT_NUMBER_FORMATTER.format(totalReactions)}</span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setPickerOpen((previous) => !previous)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setPickerOpen((previous) => !previous);
            }
            if (event.key === 'Escape') {
              setPickerOpen(false);
            }
          }}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
            pickerOpen
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-slate-200 text-slate-500 hover:border-accent/60 hover:text-accent'
          }`}
          aria-label="Open reaction palette"
          aria-haspopup="true"
          aria-controls={reactionMenuId}
          aria-expanded={pickerOpen}
        >
          <ChevronDownIcon className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setInsightsOpen((previous) => !previous)}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
          insightsOpen
            ? 'border-accent text-accent shadow-inner'
            : 'border-slate-200 text-slate-500 hover:border-accent/60 hover:text-accent'
        }`}
        aria-controls={insightsId}
        aria-expanded={insightsOpen}
      >
        <InformationCircleIcon className="h-4 w-4" /> Insights
      </button>

      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <ChatBubbleOvalLeftIcon className="h-4 w-4" />
        {commentCount}
        <span className="text-[0.65rem] lowercase">{commentCount === 1 ? 'comment' : 'conversations'}</span>
      </span>

      <button
        type="button"
        onClick={() => {
          analytics.track('web_feed_share_click', { postId: resolvedPostId, location: 'reactions_bar' }, { source: 'web_app' });
          if (typeof onOpenShare === 'function') {
            onOpenShare();
          }
        }}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <ShareIcon className="h-4 w-4" />
        Share externally
      </button>
      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <ShareIcon className="h-4 w-4" />
        {formattedShareCount}
        <span className="text-[0.65rem] lowercase">{shareLabel}</span>
      </span>

      {reactionSummaryLabel ? (
        <div
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.7rem] font-semibold text-slate-600"
          aria-live="polite"
        >
          <div className="flex -space-x-1">
            {topReactions.map(({ id, option }) => {
              const OptionIcon = option.Icon;
              const toneClass = option.dotClassName ?? 'bg-slate-400';
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

      {pickerOpen ? (
        <div
          id={reactionMenuId}
          ref={pickerRef}
          className="absolute left-4 top-full z-30 mt-3 w-72 rounded-3xl border border-slate-200 bg-white/95 p-3 text-left shadow-2xl backdrop-blur"
          role="menu"
        >
          <p className="px-2 pb-2 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
            Tailor your response
          </p>
          {REACTION_OPTIONS.map((option) => {
            const isActive = option.id === activeReaction;
            const optionCount = summary?.[option.id] ?? 0;
            const OptionIcon = option.Icon;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleReactionSelect(option.id)}
                className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                  isActive ? 'bg-slate-100 text-accent' : 'text-slate-600 hover:bg-slate-50'
                }`}
                role="menuitem"
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-white shadow ${option.dotClassName}`}
                  >
                    <OptionIcon className="h-4 w-4" />
                  </span>
                  <span className="flex flex-col items-start leading-tight">
                    <span>{option.label}</span>
                    <span className="text-[0.65rem] font-medium text-slate-400">{option.description}</span>
                  </span>
                </span>
                <span className="text-xs font-semibold text-slate-400">{COMPACT_NUMBER_FORMATTER.format(optionCount)}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {insightsOpen ? (
        <div
          id={insightsId}
          ref={insightsRef}
          className="absolute right-4 top-full z-30 mt-3 w-80 rounded-[28px] border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Appreciation insights</p>
              <p className="mt-1 text-xs text-slate-500">{insightDescription}</p>
            </div>
            <button
              type="button"
              onClick={() => setInsightsOpen(false)}
              className="text-xs font-semibold uppercase tracking-wide text-slate-400 transition hover:text-accent"
            >
              Close
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {REACTION_OPTIONS.map((option) => {
              const OptionIcon = option.Icon;
              const count = Number(summary?.[option.id] ?? 0);
              const proportion = totalReactions ? Math.round((count / totalReactions) * 100) : 0;
              const summaryLabel = REACTION_SUMMARY_LABELS[option.id] ?? 'responses';
              return (
                <div
                  key={option.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 shadow-sm"
                >
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-white ${option.dotClassName}`}>
                    <OptionIcon className="h-4 w-4" />
                  </span>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{option.label}</p>
                  <p className="text-xs text-slate-500">{COMPACT_NUMBER_FORMATTER.format(count)} {summaryLabel}</p>
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-slate-500 via-accent to-accent"
                      style={{ width: `${Math.min(100, proportion)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">{proportion}% of reactions</p>
                </div>
              );
            })}
          </div>
          {insightAvatars.length ? (
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">Top voices</span>
              <div className="flex -space-x-2">
                {insightAvatars.slice(0, 5).map((avatar) => (
                  <img
                    key={avatar.id ?? avatar.src ?? avatar.alt}
                    src={avatar.src}
                    alt={avatar.alt ?? 'Top reactor'}
                    className="h-8 w-8 rounded-full border-2 border-white object-cover shadow-sm"
                    loading="lazy"
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
