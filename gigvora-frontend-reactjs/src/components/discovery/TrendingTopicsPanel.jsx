import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowTrendingUpIcon,
  GlobeAltIcon,
  ShareIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import classNames from '../../utils/classNames.js';
import { formatRelativeTime } from '../../utils/date.js';

const TIMEFRAME_OPTIONS = [
  { id: '24h', label: 'Last 24h' },
  { id: '7d', label: 'Last 7d' },
  { id: '30d', label: 'Last 30d' },
];

const LOCATION_OPTIONS = [
  { id: 'global', label: 'Global' },
  { id: 'regional', label: 'My region' },
  { id: 'local', label: 'Local chapter' },
];

function TopicRow({
  topic,
  index,
  isExpanded,
  onToggleExpand,
  onFollow,
  onShare,
  onOpen,
  analyticsTag,
}) {
  const ranking = index + 1;
  const growthLabel = topic.metrics?.growthRate ? `${Math.round(topic.metrics.growthRate * 100)}%` : null;
  const mentionsLabel = topic.metrics?.mentions ? `${topic.metrics.mentions.toLocaleString()} mentions` : 'Emerging';
  const updatedLabel = topic.updatedAt ? formatRelativeTime(topic.updatedAt) : null;
  const highlight = topic.highlight ?? (ranking === 1 ? 'Breakout topic this week' : null);
  const personaLabel = topic.personaMatches?.length ? `Popular with ${topic.personaMatches.join(', ')}` : null;

  const handleToggle = () => onToggleExpand(topic.id);
  const handleFollow = () => onFollow(topic, analyticsTag);
  const handleShare = () => onShare(topic, analyticsTag);
  const handleOpen = () => onOpen(topic, analyticsTag);

  return (
    <article
      className={classNames(
        'group relative flex flex-col rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl',
        ranking <= 3 ? 'border-slate-900/20' : null,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white shadow-sm">
            {ranking}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900">{topic.title}</h3>
              {highlight ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white">
                  <SparklesIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {highlight}
                </span>
              ) : null}
            </div>
            {personaLabel ? <p className="mt-1 text-xs text-slate-500">{personaLabel}</p> : null}
            {topic.summary ? <p className="mt-2 text-sm text-slate-600">{topic.summary}</p> : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 text-right text-xs text-slate-500">
          {growthLabel ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-600">
              <ArrowTrendingUpIcon className="h-4 w-4" aria-hidden="true" />
              {growthLabel}
            </span>
          ) : null}
          {updatedLabel ? <span>Updated {updatedLabel}</span> : null}
          {topic.locationLabel ? <span>{topic.locationLabel}</span> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-inner">
          <p className="font-semibold text-slate-600">Mentions</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{mentionsLabel}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-3">
          <p className="font-semibold text-slate-600">Growth drivers</p>
          <p className="mt-1 leading-relaxed">{topic.drivers || 'Mentor roundtables & fundraising wins'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-3">
          <p className="font-semibold text-slate-600">Action</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleOpen}
              className="rounded-full bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
            >
              View timeline
            </button>
            <button
              type="button"
              onClick={handleFollow}
              className={classNames(
                'rounded-full border px-3 py-2 text-[11px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                topic.following
                  ? 'border-slate-300 bg-slate-100 text-slate-700 focus-visible:ring-slate-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-200',
              )}
            >
              {topic.following ? 'Following' : 'Follow topic'}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2"
            >
              <ShareIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Share
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleToggle}
        className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold text-slate-500 transition hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2"
      >
        <span>{isExpanded ? 'Hide insights' : 'Show insights'}</span>
        <ArrowTrendingUpIcon className={classNames('h-4 w-4 transition-transform', isExpanded ? 'rotate-180' : '')} aria-hidden="true" />
      </button>

      {isExpanded ? (
        <div className="mt-4 space-y-3 rounded-3xl border border-slate-200/70 bg-slate-50/70 p-4 text-[11px] text-slate-500">
          <p className="font-semibold text-slate-600">Conversation starters</p>
          <ul className="list-disc space-y-2 pl-5">
            {(topic.insights ?? [
              'Highlight success stories from members driving this trend.',
              'Pair with a curated resource bundle to help peers act quickly.',
            ]).map((insight) => (
              <li key={insight} className="leading-relaxed">
                {insight}
              </li>
            ))}
          </ul>
          {topic.relatedPeople?.length ? (
            <div>
              <p className="font-semibold text-slate-600">Leading voices</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {topic.relatedPeople.map((person) => (
                  <span key={person} className="rounded-full bg-white px-2.5 py-1 font-semibold text-slate-600 shadow-sm">
                    {person}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

TopicRow.propTypes = {
  topic: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    summary: PropTypes.string,
    highlight: PropTypes.string,
    personaMatches: PropTypes.arrayOf(PropTypes.string),
    drivers: PropTypes.string,
    updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    metrics: PropTypes.shape({
      mentions: PropTypes.number,
      growthRate: PropTypes.number,
    }),
    locationLabel: PropTypes.string,
    insights: PropTypes.arrayOf(PropTypes.string),
    relatedPeople: PropTypes.arrayOf(PropTypes.string),
    following: PropTypes.bool,
  }).isRequired,
  index: PropTypes.number.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggleExpand: PropTypes.func.isRequired,
  onFollow: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
  onOpen: PropTypes.func.isRequired,
  analyticsTag: PropTypes.string,
};

TopicRow.defaultProps = {
  analyticsTag: undefined,
};

export default function TrendingTopicsPanel({
  topics,
  persona,
  loading,
  timeframeDefault,
  locationDefault,
  analyticsTag,
  onFollow,
  onShare,
  onOpen,
}) {
  const defaultTimeframe = timeframeDefault || '7d';
  const defaultLocation = locationDefault || 'global';
  const [timeframe, setTimeframe] = useState(defaultTimeframe);
  const [location, setLocation] = useState(defaultLocation);
  const [expanded, setExpanded] = useState(null);

  const filteredTopics = useMemo(() => {
    return topics.filter((topic) => {
      const timeframeMatches = !topic.timeframes?.length || topic.timeframes.includes(timeframe);
      const locationMatches = !topic.locations?.length || topic.locations.includes(location);
      const personaMatches = !topic.personaMatches?.length || !persona || topic.personaMatches.includes(persona);
      return timeframeMatches && locationMatches && personaMatches;
    });
  }, [topics, timeframe, location, persona]);

  const summary = useMemo(() => {
    if (!filteredTopics.length) {
      return null;
    }

    const totalGrowth = filteredTopics.reduce((acc, topic) => acc + (topic.metrics?.growthRate ?? 0), 0);
    const averageGrowth = filteredTopics.length ? Math.round((totalGrowth / filteredTopics.length) * 100) : 0;

    const personaCounts = new Map();
    filteredTopics.forEach((topic) => {
      (topic.personaMatches ?? []).forEach((match) => {
        personaCounts.set(match, (personaCounts.get(match) ?? 0) + 1);
      });
    });

    let topPersona = null;
    if (personaCounts.size) {
      const [personaName] = [...personaCounts.entries()].sort((a, b) => b[1] - a[1])[0];
      topPersona = personaName;
    }

    return {
      averageGrowth,
      topPersona,
      breakoutTitle: filteredTopics[0]?.title ?? null,
    };
  }, [filteredTopics]);

  const handleToggleExpand = (topicId) => {
    setExpanded((current) => (current === topicId ? null : topicId));
  };

  useEffect(() => {
    if (!expanded) return;
    if (!filteredTopics.some((topic) => topic.id === expanded)) {
      setExpanded(null);
    }
  }, [filteredTopics, expanded]);

  const headerLabel = persona ? `Trending for ${persona}` : 'Trending across the network';
  const filteredCount = filteredTopics.length;
  const totalCount = topics.length;
  const filtersActive = timeframe !== defaultTimeframe || location !== defaultLocation;

  const handleResetFilters = () => {
    setTimeframe(defaultTimeframe);
    setLocation(defaultLocation);
    setExpanded(null);
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Discovery spotlight</h2>
          <p className="text-sm text-slate-500">{headerLabel}</p>
        </div>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-3 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-2">
            <GlobeAltIcon className="h-4 w-4" aria-hidden="true" />
            <span>Location</span>
            {LOCATION_OPTIONS.map((option) => {
              const isActive = option.id === location;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setLocation(option.id)}
                  className={classNames(
                    'rounded-full px-3 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-1',
                    isActive ? 'bg-slate-900 text-white shadow-sm' : 'border border-slate-200 bg-white hover:bg-slate-100',
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-4 w-4" aria-hidden="true" />
            <span>Timeframe</span>
            {TIMEFRAME_OPTIONS.map((option) => {
              const isActive = option.id === timeframe;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTimeframe(option.id)}
                  className={classNames(
                    'rounded-full px-3 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-1',
                    isActive ? 'bg-slate-900 text-white shadow-sm' : 'border border-slate-200 bg-white hover:bg-slate-100',
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
              {filteredCount} of {totalCount || 1} topics
            </span>
            {summary?.topPersona ? (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-sm">
                Resonating with {summary.topPersona}
              </span>
            ) : null}
            {filtersActive ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-1"
              >
                Reset filters
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {summary ? (
        <div className="grid gap-3 rounded-3xl border border-slate-200/70 bg-white/80 p-4 text-xs text-slate-600 shadow-sm sm:grid-cols-3">
          <div>
            <p className="font-semibold text-slate-600">Average growth</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{summary.averageGrowth}%</p>
            <p className="mt-1 text-[11px] text-slate-500">Across selected filters</p>
          </div>
          <div>
            <p className="font-semibold text-slate-600">Top persona</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{summary.topPersona ?? 'Broad interest'}</p>
            <p className="mt-1 text-[11px] text-slate-500">Highest share of engagement</p>
          </div>
          <div>
            <p className="font-semibold text-slate-600">Breakout topic</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{summary.breakoutTitle ?? '—'}</p>
            <p className="mt-1 text-[11px] text-slate-500">Leading the conversation</p>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="h-44 animate-pulse rounded-3xl border border-slate-200/70 bg-white/60" />
          ))}
        </div>
      ) : filteredTopics.length ? (
        <div className="grid gap-4">
          {filteredTopics.map((topic, index) => (
            <TopicRow
              key={topic.id}
              topic={topic}
              index={index}
              isExpanded={expanded === topic.id}
              onToggleExpand={handleToggleExpand}
              onFollow={onFollow}
              onShare={onShare}
              onOpen={onOpen}
              analyticsTag={analyticsTag}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-10 text-center text-sm text-slate-500">
          <p className="font-semibold text-slate-600">No trending topics for this filter yet.</p>
          <p className="mt-2 text-xs text-slate-500">
            Adjust filters or expand your interests to see what mentors and founders are discussing across the network.
          </p>
        </div>
      )}
    </section>
  );
}

TrendingTopicsPanel.propTypes = {
  topics: PropTypes.arrayOf(PropTypes.object),
  persona: PropTypes.string,
  loading: PropTypes.bool,
  timeframeDefault: PropTypes.string,
  locationDefault: PropTypes.string,
  analyticsTag: PropTypes.string,
  onFollow: PropTypes.func,
  onShare: PropTypes.func,
  onOpen: PropTypes.func,
};

TrendingTopicsPanel.defaultProps = {
  topics: [],
  persona: undefined,
  loading: false,
  timeframeDefault: '7d',
  locationDefault: 'global',
  analyticsTag: undefined,
  onFollow: () => {},
  onShare: () => {},
  onOpen: () => {},
};
