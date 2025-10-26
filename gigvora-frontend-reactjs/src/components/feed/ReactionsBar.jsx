import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  BoltIcon,
  ChatBubbleOvalLeftIcon,
  ChevronDownIcon,
  InformationCircleIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { Transition } from '@headlessui/react';
import analytics from '../../services/analytics.js';
import {
  DEFAULT_REACTION_ICON,
  REACTION_OPTIONS,
  REACTION_LOOKUP,
  formatReactionSummaryLabel,
  getReactionOption,
} from './reactionsConfig.js';

function calculateTotals(summary) {
  if (!summary || typeof summary !== 'object') {
    return { total: 0, entries: [] };
  }
  const entries = Object.entries(summary).filter(([, value]) => Number.isFinite(Number(value)));
  const total = entries.reduce((acc, [, value]) => acc + Number(value), 0);
  return { total, entries };
}

function buildTopReactions(summary) {
  const { total, entries } = calculateTotals(summary);
  const sorted = entries
    .map(([id, value]) => ({ id, value: Number(value), option: REACTION_LOOKUP[id] }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
  return { total, sorted };
}

export default function ReactionsBar({
  postId,
  reactionSummary,
  activeReaction,
  onSelect,
  totalConversationCount,
  onShare,
  insights,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const pickerRef = useRef(null);
  const insightsRef = useRef(null);
  const { total, sorted } = useMemo(() => buildTopReactions(reactionSummary), [reactionSummary]);
  const activeReactionOption = getReactionOption(activeReaction);
  const ReactionIcon = activeReactionOption?.Icon ?? DEFAULT_REACTION_ICON;
  const summaryLabel = formatReactionSummaryLabel(total);

  useEffect(() => {
    if (!pickerOpen) {
      return undefined;
    }
    const handleClick = (event) => {
      if (!pickerRef.current || pickerRef.current.contains(event.target)) {
        return;
      }
      setPickerOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [pickerOpen]);

  useEffect(() => {
    if (!insightsOpen) {
      return undefined;
    }
    const handleClick = (event) => {
      if (!insightsRef.current || insightsRef.current.contains(event.target)) {
        return;
      }
      setInsightsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [insightsOpen]);

  const togglePicker = () => {
    setPickerOpen((previous) => {
      const next = !previous;
      analytics.track(
        'web_feed_reaction_palette_toggle',
        { postId, open: next },
        { source: 'web_app' },
      );
      return next;
    });
  };

  const handleSelect = (reactionId) => {
    onSelect?.(reactionId);
    setPickerOpen(false);
  };

  const handleShare = () => {
    analytics.track('web_feed_share_click', { postId, location: 'feed_item' }, { source: 'web_app' });
    onShare?.();
  };

  const handleToggleInsights = () => {
    setInsightsOpen((previous) => {
      const next = !previous;
      analytics.track(
        'web_feed_reaction_insights_toggle',
        { postId, open: next },
        { source: 'web_app' },
      );
      return next;
    });
  };

  const reactionMenuId = `reaction-menu-${postId}`;

  return (
    <div className="space-y-2 text-xs text-slate-500">
      <div className="flex flex-wrap items-center gap-3">
        <div ref={pickerRef} className="relative inline-flex items-center">
          <button
            type="button"
            onClick={() => handleSelect(activeReaction ?? 'like')}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 transition ${
              activeReactionOption?.activeClasses ?? 'border-slate-200 text-slate-600 hover:border-accent/60 hover:text-accent'
            }`}
            aria-pressed={Boolean(activeReactionOption)}
          >
            <ReactionIcon className="h-4 w-4" />
            {activeReactionOption?.activeLabel ?? 'React'}
            {total ? <span className="ml-1 text-[0.65rem] font-semibold text-slate-400">· {total}</span> : null}
          </button>
          <button
            type="button"
            onClick={togglePicker}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                togglePicker();
              }
              if (event.key === 'Escape') {
                setPickerOpen(false);
              }
            }}
            className={`ml-1 inline-flex items-center justify-center rounded-full border px-2 py-2 transition ${
              pickerOpen
                ? 'border-accent text-accent'
                : 'border-slate-200 text-slate-500 hover:border-accent/60 hover:text-accent'
            }`}
            aria-haspopup="true"
            aria-expanded={pickerOpen}
            aria-controls={reactionMenuId}
          >
            <ChevronDownIcon className="h-4 w-4" />
          </button>
          <Transition
            as={Fragment}
            show={pickerOpen}
            enter="transition ease-out duration-150"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition ease-in duration-100"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <div
              id={reactionMenuId}
              role="menu"
              aria-label="Choose a reaction"
              className="absolute left-0 top-full z-20 mt-2 w-64 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur"
            >
              {REACTION_OPTIONS.map((option) => {
                const isActive = option.id === activeReaction;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2 text-left text-sm font-semibold transition ${
                      isActive ? 'bg-slate-100 text-accent' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                    role="menuitem"
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${option.dotClassName}`}
                        aria-hidden="true"
                      >
                        <option.Icon className="h-4 w-4" />
                      </span>
                      <span className="flex flex-col items-start">
                        <span>{option.label}</span>
                        <span className="text-[0.65rem] font-medium text-slate-400">{option.description}</span>
                      </span>
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{reactionSummary?.[option.id] ?? 0}</span>
                  </button>
                );
              })}
              <p className="px-3 pt-2 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
                Tailor your response for the community.
              </p>
            </div>
          </Transition>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-slate-500">
          <ChatBubbleOvalLeftIcon className="h-4 w-4" /> {totalConversationCount}{' '}
          {totalConversationCount === 1 ? 'comment' : 'conversations'}
        </span>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 transition hover:border-accent hover:text-accent"
        >
          <ShareIcon className="h-4 w-4" /> Share externally
        </button>
        <button
          type="button"
          onClick={handleToggleInsights}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500 transition hover:border-accent hover:text-accent"
          aria-expanded={insightsOpen}
        >
          <InformationCircleIcon className="h-4 w-4" /> Insights
        </button>
      </div>
      {summaryLabel ? (
        <div
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.7rem] font-semibold text-slate-600"
          aria-live="polite"
        >
          <div className="flex -space-x-1" aria-hidden="true">
            {sorted.length
              ? sorted.map(({ id, option }) => {
                  const OptionIcon = option?.Icon ?? DEFAULT_REACTION_ICON;
                  const toneClass = option?.dotClassName ?? 'bg-slate-400';
                  return (
                    <span
                      key={id}
                      className={`flex h-5 w-5 items-center justify-center rounded-full border border-white text-white ${toneClass}`}
                    >
                      <OptionIcon className="h-3 w-3" />
                    </span>
                  );
                })
              : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white bg-slate-400 text-white">
                  <DEFAULT_REACTION_ICON className="h-3 w-3" />
                </span>
              )}
          </div>
          <span>{summaryLabel}</span>
        </div>
      ) : null}
      <Transition
        as={Fragment}
        show={insightsOpen}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 translate-y-2"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-2"
      >
        <div
          ref={insightsRef}
          className="rounded-3xl border border-slate-200 bg-white/95 p-4 text-[0.7rem] text-slate-600 shadow-xl backdrop-blur"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Engagement pulse</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-slate-400">
              <BoltIcon className="h-3 w-3" /> Live
            </span>
          </div>
          <dl className="mt-3 space-y-2">
            {REACTION_OPTIONS.map((option) => {
              const count = Number(reactionSummary?.[option.id] ?? 0);
              const share = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={option.id} className="space-y-1">
                  <dt className="flex items-center justify-between text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
                    <span className="inline-flex items-center gap-2 text-slate-500">
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full ${option.dotClassName}`}></span>
                      {option.label}
                    </span>
                    <span>{count}</span>
                  </dt>
                  <dd className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${option.dotClassName}`}
                      style={{ width: `${share}%` }}
                    />
                  </dd>
                </div>
              );
            })}
          </dl>
          {insights?.length ? (
            <ul className="mt-4 space-y-2 text-[0.65rem]">
              {insights.map((insight) => (
                <li key={insight.id} className="rounded-2xl bg-slate-50 px-3 py-2 text-slate-500">
                  <p className="font-semibold text-slate-700">{insight.title}</p>
                  {insight.description ? (
                    <p className="mt-1 text-slate-500">{insight.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-2xl bg-slate-50 px-3 py-2 text-[0.65rem] text-slate-500">
              Reaction insights summarise momentum across the feed so you can follow up with precision.
            </p>
          )}
        </div>
      </Transition>
    </div>
  );
}

ReactionsBar.propTypes = {
  postId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  reactionSummary: PropTypes.object,
  activeReaction: PropTypes.string,
  onSelect: PropTypes.func,
  totalConversationCount: PropTypes.number,
  onShare: PropTypes.func,
  insights: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
    }),
  ),
};

ReactionsBar.defaultProps = {
  reactionSummary: {},
  activeReaction: null,
  onSelect: undefined,
  totalConversationCount: 0,
  onShare: undefined,
  insights: undefined,
};
