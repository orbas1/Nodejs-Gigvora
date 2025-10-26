import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BoltIcon,
  FireIcon,
  SparklesIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import classNames from '../../utils/classNames.js';
import { formatRelativeTime } from '../../utils/date.js';
import ConnectionCard from './ConnectionCard.jsx';

const CARD_WIDTH = 320;
const CARD_GAP = 24;
const SORT_OPTIONS = [
  { id: 'for-you', label: 'For you' },
  { id: 'trending', label: 'Trending' },
  { id: 'new', label: 'New' },
];

function personalizeScore(suggestion, { persona, preferences, sort }) {
  const baseScore = typeof suggestion.relevanceScore === 'number' ? suggestion.relevanceScore : 50;
  let score = baseScore;

  const personaMatches = suggestion.personaMatches ?? [];
  if (persona && personaMatches.includes(persona)) {
    score += 35;
  } else if (personaMatches.length) {
    score += 10;
  }

  if (Array.isArray(preferences?.focusAreas) && Array.isArray(suggestion.focusAreas)) {
    const focusOverlap = suggestion.focusAreas.filter((area) => preferences.focusAreas.includes(area)).length;
    score += focusOverlap * 12;
  }

  if (preferences?.highlightCategory && suggestion.category === preferences.highlightCategory) {
    score += 40;
  }

  if (preferences?.pinnedSuggestionId && preferences.pinnedSuggestionId === suggestion.id) {
    score += 1000;
  }

  if (sort === 'trending') {
    score += (suggestion.trendScore ?? suggestion.engagementRate ?? 0) * 25;
  } else if (sort === 'new') {
    const publishedAt = suggestion.publishedAt || suggestion.createdAt || suggestion.refreshedAt;
    if (publishedAt) {
      const publishedDate = new Date(publishedAt);
      if (!Number.isNaN(publishedDate.getTime())) {
        const diffHours = Math.max(1, (Date.now() - publishedDate.getTime()) / 36e5);
        score += Math.max(0, 80 - diffHours);
      }
    } else {
      score += 10;
    }
  } else {
    score += (suggestion.matchScore ?? 0) * 100;
  }

  if (suggestion.pinned) {
    score += 800;
  }

  if (suggestion.dismissed || preferences?.hiddenSuggestionIds?.includes?.(suggestion.id)) {
    score = -Infinity;
  }

  return score;
}

function SuggestionSkeleton() {
  return (
    <div className="min-h-[340px] w-[320px] animate-pulse rounded-3xl border border-slate-200/70 bg-white/60 p-6 shadow-inner">
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="h-10 w-10 rounded-2xl bg-slate-200/80" />
          <div className="flex-1 space-y-2">
            <span className="block h-3 w-2/3 rounded-full bg-slate-200/80" />
            <span className="block h-3 w-1/2 rounded-full bg-slate-200/70" />
          </div>
        </div>
        <span className="block h-24 w-full rounded-2xl bg-slate-100/80" />
        <div className="space-y-2">
          <span className="block h-3 w-full rounded-full bg-slate-200/80" />
          <span className="block h-3 w-4/5 rounded-full bg-slate-200/80" />
        </div>
        <div className="mt-auto flex gap-2">
          <span className="h-9 w-full rounded-full bg-slate-200/80" />
          <span className="h-9 w-full rounded-full bg-slate-200/70" />
        </div>
      </div>
    </div>
  );
}

function getCategoryChips(suggestion) {
  const chips = [];
  if (suggestion.reason) {
    chips.push({ label: suggestion.reason, tone: 'accent' });
  }
  if (suggestion.category) {
    chips.push({ label: suggestion.category, tone: 'neutral' });
  }
  if (Array.isArray(suggestion.personaMatches) && suggestion.personaMatches.length) {
    chips.push({ label: `Ideal for ${suggestion.personaMatches.join(', ')}`, tone: 'muted' });
  }
  if (suggestion.highlightTag) {
    chips.push({ label: suggestion.highlightTag, tone: 'accent' });
  }
  return chips;
}

function renderChips(chips) {
  return (
    <div className="flex flex-wrap gap-2 text-[11px]">
      {chips.map((chip, index) => (
        <span
          key={`${chip.label}-${index}`}
          className={classNames(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold shadow-sm',
            chip.tone === 'accent'
              ? 'bg-gradient-to-r from-slate-900 via-indigo-700 to-sky-600 text-white'
              : chip.tone === 'muted'
                ? 'bg-white/70 text-slate-500'
                : 'bg-white/90 text-slate-700',
          )}
        >
          {chip.tone === 'accent' ? <SparklesIcon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
          {chip.label}
        </span>
      ))}
    </div>
  );
}

function SuggestionCard({ suggestion, timezone, onOpen, onSave, onShare, onDismiss, onFollowToggle, analyticsTag }) {
  const chips = useMemo(() => getCategoryChips(suggestion), [suggestion]);
  const publishedLabel = suggestion.publishedAt ? formatRelativeTime(suggestion.publishedAt, { timeZone: timezone }) : null;
  const statLabel = suggestion.stats?.label ?? 'Engagement';
  const statValue = suggestion.stats?.value ?? `${Math.round((suggestion.engagementRate ?? 0) * 100)}%`;

  const handleOpen = () => {
    onOpen(suggestion, analyticsTag);
  };
  const handleSave = () => {
    onSave(suggestion, analyticsTag);
  };
  const handleShare = () => {
    onShare(suggestion, analyticsTag);
  };
  const handleDismiss = () => {
    onDismiss(suggestion, analyticsTag);
  };
  const handleFollowToggle = () => {
    onFollowToggle(suggestion, analyticsTag);
  };

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative">
        {suggestion.bannerUrl ? (
          <img
            src={suggestion.bannerUrl}
            alt=""
            loading="lazy"
            className="h-32 w-full object-cover"
          />
        ) : (
          <div className="h-32 w-full bg-gradient-to-br from-slate-900 via-indigo-800 to-slate-900" aria-hidden="true" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-white/80">
            <FireIcon className="h-4 w-4" aria-hidden="true" />
            {suggestion.typeLabel || suggestion.type}
          </div>
          <h3 className="mt-1 text-base font-semibold leading-tight">{suggestion.title}</h3>
          {suggestion.subtitle ? <p className="mt-1 text-sm text-white/80">{suggestion.subtitle}</p> : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        {chips.length ? renderChips(chips) : null}
        {suggestion.description ? (
          <p className="text-sm leading-relaxed text-slate-600">{suggestion.description}</p>
        ) : null}
        <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-500">
          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-3">
            <p className="font-semibold text-slate-600">{statLabel}</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{statValue}</p>
            {suggestion.stats?.delta ? (
              <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                <BoltIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {suggestion.stats.delta}
              </p>
            ) : null}
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-3">
            <p className="font-semibold text-slate-600">Why this matters</p>
            <p className="mt-1 leading-relaxed text-slate-500">{suggestion.context ?? 'High affinity with your current goals.'}</p>
            {publishedLabel ? <p className="mt-1 text-[10px] text-slate-400">Updated {publishedLabel}</p> : null}
          </div>
        </div>
        {suggestion.tags?.length ? (
          <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
            {suggestion.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold">#{tag}</span>
            ))}
          </div>
        ) : null}
        <div className="mt-auto space-y-2">
          <button
            type="button"
            onClick={handleOpen}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
          >
            <StarIcon className="h-4 w-4" aria-hidden="true" />
            {suggestion.primaryActionLabel || 'View details'}
          </button>
          <div className="flex gap-2 text-[11px]">
            <button
              type="button"
              onClick={handleFollowToggle}
              className={classNames(
                'flex-1 rounded-full border px-3 py-2 font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                suggestion.following
                  ? 'border-slate-300 bg-slate-100 text-slate-700 focus-visible:ring-slate-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-200',
              )}
            >
              {suggestion.following ? 'Following' : 'Follow updates'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 rounded-full border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2"
            >
              Save
            </button>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <button
              type="button"
              onClick={handleShare}
              className="font-semibold text-slate-500 transition hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2"
            >
              Share externally
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="font-semibold text-slate-400 transition hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

SuggestionCard.propTypes = {
  suggestion: PropTypes.object.isRequired,
  timezone: PropTypes.string,
  onOpen: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
  onFollowToggle: PropTypes.func.isRequired,
  analyticsTag: PropTypes.string,
};

SuggestionCard.defaultProps = {
  timezone: undefined,
  analyticsTag: undefined,
};

export default function SuggestionRail({
  suggestions,
  persona,
  preferences,
  timezone,
  loading,
  heading,
  subheading,
  analyticsTag,
  onOpen,
  onSave,
  onShare,
  onDismiss,
  onFollowToggle,
  onConnect,
  onMessage,
  onAccept,
  onPrefetch,
  onCopyIntro,
}) {
  const [sort, setSort] = useState('for-you');
  const [activeCategory, setActiveCategory] = useState('all');
  const scrollRef = useRef(null);
  const prefetchedRef = useRef(new Set());
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 6 });
  const [scrollMetrics, setScrollMetrics] = useState({ progress: 0, hasPrev: false, hasNext: false });

  const availableCategories = useMemo(() => {
    const categories = new Set();
    suggestions.forEach((suggestion) => {
      if (suggestion.category) {
        categories.add(suggestion.category);
      }
    });
    return ['all', ...Array.from(categories)];
  }, [suggestions]);

  const rankedSuggestions = useMemo(() => {
    return suggestions
      .map((suggestion) => ({
        suggestion,
        score: personalizeScore(suggestion, { persona, preferences, sort }),
      }))
      .filter(({ score }) => Number.isFinite(score))
      .sort((a, b) => b.score - a.score)
      .map(({ suggestion: item }) => item);
  }, [suggestions, persona, preferences, sort]);

  const filteredSuggestions = useMemo(() => {
    if (activeCategory === 'all') {
      return rankedSuggestions;
    }
    return rankedSuggestions.filter((suggestion) => suggestion.category === activeCategory);
  }, [rankedSuggestions, activeCategory]);

  useEffect(() => {
    setVisibleRange({ start: 0, end: 6 });
    setScrollMetrics({ progress: 0, hasPrev: false, hasNext: filteredSuggestions.length > 1 });
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [sort, activeCategory, suggestions, filteredSuggestions.length]);

  useEffect(() => {
    prefetchedRef.current.clear();
  }, [suggestions]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    const updateMetrics = () => {
      const { scrollLeft, clientWidth, scrollWidth } = node;
      const itemWidth = CARD_WIDTH + CARD_GAP;
      const start = Math.max(0, Math.floor(scrollLeft / itemWidth) - 2);
      const end = Math.min(filteredSuggestions.length, Math.ceil((scrollLeft + clientWidth) / itemWidth) + 2);
      setVisibleRange({ start, end });
      const maxScroll = Math.max(0, scrollWidth - clientWidth);
      const progress = maxScroll > 0 ? Math.min(1, scrollLeft / maxScroll) : 0;
      setScrollMetrics({
        progress,
        hasPrev: scrollLeft > 6,
        hasNext: scrollLeft < maxScroll - 6,
      });
    };

    node.addEventListener('scroll', updateMetrics, { passive: true });
    updateMetrics();

    const handleResize = () => updateMetrics();
    const hasWindow = typeof window !== 'undefined';
    if (hasWindow) {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      node.removeEventListener('scroll', updateMetrics);
      if (hasWindow) {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [filteredSuggestions.length]);

  const scrollBy = useCallback((direction) => {
    const node = scrollRef.current;
    if (!node) return;
    const distance = (CARD_WIDTH + CARD_GAP) * 2;
    node.scrollBy({ left: direction === 'next' ? distance : -distance, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!onPrefetch) return;
    const leadBatch = filteredSuggestions.slice(0, 3);
    leadBatch.forEach((item) => {
      if (!prefetchedRef.current.has(item.id)) {
        prefetchedRef.current.add(item.id);
        onPrefetch(item, analyticsTag);
      }
    });
  }, [filteredSuggestions, onPrefetch, analyticsTag]);

  const handleConnect = useCallback(
    (connection) => {
      onConnect(connection.sourceSuggestion ?? connection, analyticsTag);
    },
    [onConnect, analyticsTag],
  );

  const handleMessage = useCallback(
    (connection) => {
      onMessage(connection.sourceSuggestion ?? connection, analyticsTag);
    },
    [onMessage, analyticsTag],
  );

  const handleAccept = useCallback(
    (connection) => {
      onAccept(connection.sourceSuggestion ?? connection, analyticsTag);
    },
    [onAccept, analyticsTag],
  );

  const handleFollowConnection = useCallback(
    (connection) => {
      onFollowToggle(connection.sourceSuggestion ?? connection, analyticsTag);
    },
    [onFollowToggle, analyticsTag],
  );

  const handleSaveConnection = useCallback(
    (connection) => {
      onSave(connection.sourceSuggestion ?? connection, analyticsTag);
    },
    [onSave, analyticsTag],
  );

  const handleDismissConnection = useCallback(
    (connection) => {
      onDismiss(connection.sourceSuggestion ?? connection, analyticsTag);
    },
    [onDismiss, analyticsTag],
  );

  const handleOpenConnection = useCallback(
    (connection) => {
      onOpen(connection.sourceSuggestion ?? connection, analyticsTag);
    },
    [onOpen, analyticsTag],
  );

  const handleCopyIntro = useCallback(
    (connection, meta) => {
      onCopyIntro(connection.sourceSuggestion ?? connection, { ...meta, analyticsTag });
    },
    [onCopyIntro, analyticsTag],
  );

  useEffect(() => {
    if (!onPrefetch) return;
    const start = visibleRange.start;
    const end = visibleRange.end;
    const subset = filteredSuggestions.slice(start, end);
    subset.forEach((item) => {
      if (!prefetchedRef.current.has(item.id)) {
        prefetchedRef.current.add(item.id);
      onPrefetch(item, analyticsTag);
      }
    });
  }, [filteredSuggestions, visibleRange, onPrefetch, analyticsTag]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        scrollBy('next');
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        scrollBy('prev');
      }
    },
    [scrollBy],
  );

  const headingLabel = heading || 'Recommended for you';
  const subheadingLabel = subheading ||
    (preferences?.focusAreas?.length
      ? `Curated around ${preferences.focusAreas.slice(0, 2).join(', ')}.`
      : 'Tailored to your current goals.');

  const progressWidth = filteredSuggestions.length
    ? Math.min(100, Math.max(scrollMetrics.progress * 100, 100 / filteredSuggestions.length))
    : 0;

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{headingLabel}</h2>
          <p className="text-sm text-slate-500">{subheadingLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 p-1 text-xs font-semibold text-slate-600 shadow-sm">
            {SORT_OPTIONS.map((option) => {
              const isActive = option.id === sort;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSort(option.id)}
                  className={classNames(
                    'rounded-full px-3 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-1',
                    isActive ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-100',
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>Focus</span>
            <div className="flex items-center gap-1">
              {availableCategories.map((category) => {
                const isActive = category === activeCategory;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={classNames(
                      'rounded-full px-3 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-1',
                      isActive ? 'bg-slate-900 text-white shadow-sm' : 'border border-slate-200 bg-white hover:bg-slate-100',
                    )}
                  >
                    {category === 'all' ? 'All' : category}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white via-white/80 to-transparent" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white via-white/80 to-transparent" aria-hidden="true" />
        <div className="flex justify-end gap-2 pb-3">
          <button
            type="button"
            onClick={() => scrollBy('prev')}
            disabled={!scrollMetrics.hasPrev}
            className={classNames(
              'inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2',
              scrollMetrics.hasPrev ? 'hover:text-slate-700' : 'cursor-not-allowed opacity-40',
            )}
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Previous suggestions</span>
          </button>
          <button
            type="button"
            onClick={() => scrollBy('next')}
            disabled={!scrollMetrics.hasNext}
            className={classNames(
              'inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2',
              scrollMetrics.hasNext ? 'hover:text-slate-700' : 'cursor-not-allowed opacity-40',
            )}
          >
            <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Next suggestions</span>
          </button>
        </div>
        {filteredSuggestions.length > 1 ? (
          <div className="mb-2 h-1.5 w-full rounded-full bg-slate-200/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-slate-900 via-indigo-600 to-sky-500 transition-[width] duration-300"
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        ) : null}
        <div
          ref={scrollRef}
          className="hide-scrollbar -mx-2 flex gap-6 overflow-x-auto pb-4"
          role="list"
          tabIndex={0}
          aria-label="Suggested opportunities"
          onKeyDown={handleKeyDown}
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="px-2">
                <SuggestionSkeleton />
              </div>
            ))
          ) : filteredSuggestions.length ? (
            filteredSuggestions.map((suggestion, index) => {
              const isVisible = index >= visibleRange.start && index < visibleRange.end;
              const widthStyle = { minWidth: `${CARD_WIDTH}px`, maxWidth: `${CARD_WIDTH}px` };

              if (!isVisible) {
                return <div key={suggestion.id ?? index} className="px-2" style={widthStyle} aria-hidden="true" />;
              }

              if (suggestion.type === 'connection' || suggestion.type === 'person') {
                const connectionPayload = {
                  id: suggestion.id,
                  name: suggestion.name || suggestion.title,
                  firstName: suggestion.firstName,
                  persona: suggestion.persona || suggestion.personaMatches?.[0],
                  headline: suggestion.headline || suggestion.subtitle,
                  summary: suggestion.description,
                  location: suggestion.location,
                  sharedContext: suggestion.reason,
                  avatarUrl: suggestion.avatarUrl,
                  backgroundUrl: suggestion.bannerUrl,
                  focusAreas: suggestion.focusAreas ?? suggestion.tags,
                  badges: suggestion.badges,
                  mutualConnections: suggestion.mutualConnections,
                  lastActiveAt: suggestion.lastActiveAt || suggestion.updatedAt,
                  recentActivity: suggestion.recentActivity,
                  matchScore: suggestion.matchScore ?? suggestion.relevanceScore,
                  quickIntro: suggestion.quickIntro,
                  status: suggestion.status || 'suggested',
                  following: suggestion.following,
                  sourceSuggestion: suggestion,
                };

                return (
                  <div key={suggestion.id ?? index} className="px-2" style={widthStyle}>
                    <ConnectionCard
                      connection={connectionPayload}
                      analyticsTag={analyticsTag}
                      onConnect={handleConnect}
                      onAccept={handleAccept}
                      onMessage={handleMessage}
                      onSave={handleSaveConnection}
                      onFollowToggle={handleFollowConnection}
                      onDismiss={handleDismissConnection}
                      onViewProfile={handleOpenConnection}
                      timezone={timezone}
                      onCopyIntro={handleCopyIntro}
                    />
                  </div>
                );
              }

              return (
                <div key={suggestion.id ?? index} className="px-2" style={widthStyle}>
                  <SuggestionCard
                    suggestion={suggestion}
                    timezone={timezone}
                    analyticsTag={analyticsTag}
                    onOpen={onOpen}
                    onSave={onSave}
                    onShare={onShare}
                    onDismiss={onDismiss}
                    onFollowToggle={onFollowToggle}
                  />
                </div>
              );
            })
          ) : (
            <div className="px-2">
              <div className="flex h-[320px] w-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 text-center text-sm text-slate-500">
                <SparklesIcon className="mb-3 h-6 w-6 text-slate-400" aria-hidden="true" />
                <p className="font-semibold text-slate-600">We’re sourcing new matches</p>
                <p className="mt-1 px-6 text-xs text-slate-500">
                  Refresh soon—our network is lining up mentors, founders, and opportunities aligned to your focus areas.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

SuggestionRail.propTypes = {
  suggestions: PropTypes.arrayOf(PropTypes.object),
  persona: PropTypes.string,
  preferences: PropTypes.shape({
    focusAreas: PropTypes.arrayOf(PropTypes.string),
    highlightCategory: PropTypes.string,
    pinnedSuggestionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    hiddenSuggestionIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  }),
  timezone: PropTypes.string,
  loading: PropTypes.bool,
  heading: PropTypes.string,
  subheading: PropTypes.string,
  analyticsTag: PropTypes.string,
  onOpen: PropTypes.func,
  onSave: PropTypes.func,
  onShare: PropTypes.func,
  onDismiss: PropTypes.func,
  onFollowToggle: PropTypes.func,
  onConnect: PropTypes.func,
  onMessage: PropTypes.func,
  onAccept: PropTypes.func,
  onPrefetch: PropTypes.func,
  onCopyIntro: PropTypes.func,
};

SuggestionRail.defaultProps = {
  suggestions: [],
  persona: undefined,
  preferences: undefined,
  timezone: undefined,
  loading: false,
  heading: undefined,
  subheading: undefined,
  analyticsTag: undefined,
  onOpen: () => {},
  onSave: () => {},
  onShare: () => {},
  onDismiss: () => {},
  onFollowToggle: () => {},
  onConnect: () => {},
  onMessage: () => {},
  onAccept: () => {},
  onPrefetch: undefined,
  onCopyIntro: () => {},
};
