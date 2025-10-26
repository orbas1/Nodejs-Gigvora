import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  ArrowSmallRightIcon,
  BookmarkIcon,
  CheckIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import analytics from '../../services/analytics.js';
import classNames from '../../utils/classNames.js';

const CARD_WIDTH = 288;
const CARD_GAP = 24;
const VIEW_THRESHOLD = 0.6;

function SuggestionCard({
  suggestion,
  onFollowToggle,
  onDismiss,
  onSave,
  onView,
  onShare,
  analyticsSource,
}) {
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const element = cardRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= VIEW_THRESHOLD && !hasTrackedView) {
            setHasTrackedView(true);
            analytics.track('discovery.suggestion.viewed', {
              suggestionId: suggestion.id,
              suggestionType: suggestion.type ?? 'unknown',
              personalizationScore: suggestion.personalizationScore ?? null,
              source: analyticsSource ?? 'web_app',
            });
          }
        });
      },
      { threshold: VIEW_THRESHOLD },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [analyticsSource, hasTrackedView, suggestion.id, suggestion.personalizationScore, suggestion.type]);

  const handleFollowToggle = useCallback(() => {
    onFollowToggle?.(suggestion);
    analytics.track('discovery.suggestion.follow_toggled', {
      suggestionId: suggestion.id,
      suggestionType: suggestion.type ?? 'unknown',
      followed: !suggestion.followed,
      source: analyticsSource ?? 'web_app',
    });
  }, [analyticsSource, onFollowToggle, suggestion]);

  const handleDismiss = useCallback(() => {
    onDismiss?.(suggestion);
    analytics.track('discovery.suggestion.dismissed', {
      suggestionId: suggestion.id,
      suggestionType: suggestion.type ?? 'unknown',
      source: analyticsSource ?? 'web_app',
    });
  }, [analyticsSource, onDismiss, suggestion]);

  const handleSave = useCallback(() => {
    onSave?.(suggestion);
    analytics.track('discovery.suggestion.saved', {
      suggestionId: suggestion.id,
      suggestionType: suggestion.type ?? 'unknown',
      source: analyticsSource ?? 'web_app',
    });
  }, [analyticsSource, onSave, suggestion]);

  const handleView = useCallback(() => {
    onView?.(suggestion);
    analytics.track('discovery.suggestion.opened', {
      suggestionId: suggestion.id,
      suggestionType: suggestion.type ?? 'unknown',
      destination: suggestion.href ?? null,
      source: analyticsSource ?? 'web_app',
    });
  }, [analyticsSource, onView, suggestion]);

  const handleShare = useCallback(() => {
    onShare?.(suggestion);
    analytics.track('discovery.suggestion.shared', {
      suggestionId: suggestion.id,
      suggestionType: suggestion.type ?? 'unknown',
      shareUrl: suggestion.shareUrl ?? null,
      source: analyticsSource ?? 'web_app',
    });
  }, [analyticsSource, onShare, suggestion]);

  const contextChips = Array.isArray(suggestion.context) ? suggestion.context.slice(0, 3) : [];
  const statItems = Array.isArray(suggestion.stats) ? suggestion.stats.slice(0, 2) : [];

  return (
    <article
      ref={cardRef}
      className={classNames(
        'group relative flex h-full w-[18rem] flex-col overflow-hidden rounded-[20px] border border-white/40 bg-white/70 p-5 shadow-xl transition-all duration-200 ease-out',
        'backdrop-blur-xl hover:-translate-y-1 hover:shadow-2xl focus-within:-translate-y-1 focus-within:shadow-2xl',
        suggestion.pinned ? 'outline outline-2 outline-offset-2 outline-blue-200' : 'outline outline-transparent',
      )}
    >
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-slate-50/80 via-white to-blue-50/40 opacity-80" aria-hidden />

      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-3">
          {suggestion.avatarUrl ? (
            <img
              src={suggestion.avatarUrl}
              alt=""
              loading="lazy"
              className="h-12 w-12 flex-none rounded-2xl border border-white/60 object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-sm">
              <SparklesIcon className="h-5 w-5" aria-hidden="true" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">{suggestion.title}</h3>
              {suggestion.pinned ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                  <SparklesIcon className="h-3 w-3" aria-hidden="true" /> Curated
                </span>
              ) : null}
            </div>
            {suggestion.subtitle ? <p className="text-xs text-slate-500">{suggestion.subtitle}</p> : null}
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-full border border-slate-200 bg-white/80 p-1 text-slate-400 transition hover:border-slate-300 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2"
          aria-label="Dismiss suggestion"
        >
          <XMarkIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {suggestion.description ? (
        <p className="mt-3 line-clamp-3 text-sm text-slate-600">{suggestion.description}</p>
      ) : null}

      {contextChips.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {contextChips.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-600"
            >
              <SparklesIcon className="h-3 w-3" aria-hidden="true" />
              {chip}
            </span>
          ))}
        </div>
      ) : null}

      {statItems.length ? (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
          {statItems.map((stat) => (
            <div key={stat.id ?? stat.label} className="rounded-2xl border border-slate-200/60 bg-white/70 p-3 shadow-sm">
              <dt className="font-semibold text-slate-600">{stat.label}</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">{stat.value}</dd>
              {stat.delta ? (
                <p className={classNames('mt-1 text-[11px] font-semibold', stat.delta.startsWith('+') ? 'text-emerald-600' : 'text-rose-500')}>
                  {stat.delta}
                </p>
              ) : null}
            </div>
          ))}
        </dl>
      ) : null}

      {suggestion.reason ? (
        <p className="mt-4 text-[11px] uppercase tracking-wide text-slate-400">{suggestion.reason}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleFollowToggle}
          className={classNames(
            'inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2',
            suggestion.followed
              ? 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 focus:ring-emerald-300'
              : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:from-blue-600 hover:to-indigo-600 focus:ring-indigo-300',
          )}
        >
          {suggestion.followed ? <CheckIcon className="h-4 w-4" aria-hidden="true" /> : <SparklesIcon className="h-4 w-4" aria-hidden="true" />}
          {suggestion.followed ? 'Following' : suggestion.primaryActionLabel ?? 'Follow'}
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2"
        >
          <BookmarkIcon className="h-4 w-4" aria-hidden="true" />
          Save
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
        {suggestion.personalizationScore != null ? (
          <span className="inline-flex items-center gap-1">
            <SparklesIcon className="h-3 w-3" aria-hidden="true" />
            Matched {Math.round(suggestion.personalizationScore)}%
          </span>
        ) : (
          <span />
        )}
        {suggestion.mutualConnections != null ? (
          <span>{suggestion.mutualConnections} mutual</span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-blue-600">
        <button
          type="button"
          onClick={handleView}
          className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-blue-600 transition hover:bg-blue-100"
        >
          View details
          <ArrowSmallRightIcon className="h-4 w-4" aria-hidden="true" />
        </button>
        {suggestion.shareUrl ? (
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1 rounded-full border border-blue-200 px-3 py-1 text-blue-500 transition hover:border-blue-300 hover:text-blue-600"
          >
            Share
          </button>
        ) : null}
      </div>
    </article>
  );
}

SuggestionCard.propTypes = {
  suggestion: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    description: PropTypes.string,
    avatarUrl: PropTypes.string,
    type: PropTypes.string,
    context: PropTypes.arrayOf(PropTypes.string),
    stats: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        label: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
        delta: PropTypes.string,
      }),
    ),
    reason: PropTypes.string,
    shareUrl: PropTypes.string,
    href: PropTypes.string,
    pinned: PropTypes.bool,
    followed: PropTypes.bool,
    personalizationScore: PropTypes.number,
    mutualConnections: PropTypes.number,
    primaryActionLabel: PropTypes.string,
  }).isRequired,
  onFollowToggle: PropTypes.func,
  onDismiss: PropTypes.func,
  onSave: PropTypes.func,
  onView: PropTypes.func,
  onShare: PropTypes.func,
  analyticsSource: PropTypes.string,
};

SuggestionCard.defaultProps = {
  onFollowToggle: undefined,
  onDismiss: undefined,
  onSave: undefined,
  onView: undefined,
  onShare: undefined,
  analyticsSource: 'web_app',
};

export default function SuggestionRail({
  title,
  suggestions,
  loading,
  error,
  personalizationSummary,
  filters,
  activeFilter,
  onFilterChange,
  onRefresh,
  onFollowToggle,
  onDismiss,
  onSave,
  onView,
  onShare,
  analyticsSource,
}) {
  const scrollRef = useRef(null);
  const [viewport, setViewport] = useState({ width: 0, scrollLeft: 0 });

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return undefined;

    const updateViewport = () => {
      setViewport((prev) => {
        const nextWidth = container.clientWidth;
        const nextScroll = container.scrollLeft;
        if (prev.width === nextWidth && prev.scrollLeft === nextScroll) {
          return prev;
        }
        return { width: nextWidth, scrollLeft: nextScroll };
      });
    };

    updateViewport();
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateViewport) : null;

    container.addEventListener('scroll', updateViewport, { passive: true });
    resizeObserver?.observe(container);

    return () => {
      container.removeEventListener('scroll', updateViewport);
      resizeObserver?.disconnect();
    };
  }, []);

  const filteredSuggestions = useMemo(() => {
    if (!activeFilter || !filters?.length) {
      return suggestions;
    }

    const filter = filters.find((entry) => entry.id === activeFilter);
    if (!filter?.predicate) {
      return suggestions;
    }
    return suggestions.filter((suggestion) => filter.predicate(suggestion));
  }, [activeFilter, filters, suggestions]);

  const virtualisation = useMemo(() => {
    const total = filteredSuggestions.length;
    if (!total) {
      return { before: 0, after: 0, items: [] };
    }

    const viewportWidth = viewport.width || CARD_WIDTH * 2;
    const visibleCount = Math.ceil(viewportWidth / (CARD_WIDTH + CARD_GAP)) + 2;
    const startIndex = Math.max(0, Math.floor((viewport.scrollLeft || 0) / (CARD_WIDTH + CARD_GAP)) - 1);
    const endIndex = Math.min(total, startIndex + visibleCount);
    const items = filteredSuggestions.slice(startIndex, endIndex);

    const before = startIndex * (CARD_WIDTH + CARD_GAP);
    const after = Math.max(0, (total - endIndex) * (CARD_WIDTH + CARD_GAP));

    return { before, after, items };
  }, [filteredSuggestions, viewport.scrollLeft, viewport.width]);

  const showEmptyState = !loading && !filteredSuggestions.length && !error;

  return (
    <section className="relative space-y-6 rounded-[28px] border border-slate-100/80 bg-white/80 p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-blue-500">
            <SparklesIcon className="h-4 w-4" aria-hidden="true" />
            Discovery Feed
          </div>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">{title}</h2>
          {personalizationSummary ? (
            <p className="mt-1 text-sm text-slate-500">{personalizationSummary}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          {Array.isArray(filters) && filters.length ? (
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => {
                const isActive = filter.id === (activeFilter ?? filters[0]?.id);
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => onFilterChange?.(filter.id)}
                    className={classNames(
                      'rounded-full px-3 py-1 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2',
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm focus:ring-slate-200'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 focus:ring-slate-200',
                    )}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          ) : null}

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              className="h-64 w-[18rem] animate-pulse rounded-[20px] bg-gradient-to-br from-slate-100 via-slate-50 to-white"
            />
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-6 text-sm text-rose-600">
          <p className="font-semibold">We could not load new recommendations.</p>
          <p className="mt-1 text-rose-500">Please refresh to try again—your personalization settings remain saved.</p>
        </div>
      ) : null}

      {showEmptyState ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center text-sm text-slate-500">
          No suggestions right now. Update your interests to help us surface new opportunities.
        </div>
      ) : null}

      {filteredSuggestions.length ? (
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white via-white/70 to-transparent" aria-hidden />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white via-white/70 to-transparent" aria-hidden />
          <div
            ref={scrollRef}
            className="hide-scrollbar -mx-4 overflow-x-auto px-4"
            aria-label="Suggested opportunities"
          >
            <div className="flex items-stretch gap-6 py-2">
              {virtualisation.before ? <div style={{ flex: `0 0 ${virtualisation.before}px` }} aria-hidden /> : null}
              {virtualisation.items.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onFollowToggle={onFollowToggle}
                  onDismiss={onDismiss}
                  onSave={onSave}
                  onView={onView}
                  onShare={onShare}
                  analyticsSource={analyticsSource}
                />
              ))}
              {virtualisation.after ? <div style={{ flex: `0 0 ${virtualisation.after}px` }} aria-hidden /> : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

SuggestionRail.propTypes = {
  title: PropTypes.string.isRequired,
  suggestions: PropTypes.arrayOf(SuggestionCard.propTypes.suggestion),
  loading: PropTypes.bool,
  error: PropTypes.bool,
  personalizationSummary: PropTypes.string,
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      predicate: PropTypes.func,
    }),
  ),
  activeFilter: PropTypes.string,
  onFilterChange: PropTypes.func,
  onRefresh: PropTypes.func,
  onFollowToggle: PropTypes.func,
  onDismiss: PropTypes.func,
  onSave: PropTypes.func,
  onView: PropTypes.func,
  onShare: PropTypes.func,
  analyticsSource: PropTypes.string,
};

SuggestionRail.defaultProps = {
  suggestions: [],
  loading: false,
  error: false,
  personalizationSummary: null,
  filters: null,
  activeFilter: null,
  onFilterChange: undefined,
  onRefresh: undefined,
  onFollowToggle: undefined,
  onDismiss: undefined,
  onSave: undefined,
  onView: undefined,
  onShare: undefined,
  analyticsSource: 'web_app',
};
