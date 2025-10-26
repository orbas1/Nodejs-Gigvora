import PropTypes from 'prop-types';
import { useMemo } from 'react';
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ClockIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { formatRelativeTime } from '../../utils/date.js';

const CATEGORY_OPTIONS = [
  { id: 'all', label: 'All activity', description: 'Everything from your network and org.' },
  { id: 'opportunities', label: 'Opportunities', description: 'Roles, gigs, and volunteer missions.' },
  { id: 'milestones', label: 'Milestones', description: 'Launches, deliverables, and retros.' },
  { id: 'media', label: 'Media', description: 'Livestreams, recordings, and demo drops.' },
  { id: 'community', label: 'Community', description: 'Culture, celebrations, and announcements.' },
];

const TIMEFRAME_OPTIONS = [
  { id: '24h', label: 'Last 24h' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '90d', label: 'Quarter' },
];

const AUDIENCE_OPTIONS = [
  { id: 'all', label: 'All audiences' },
  { id: 'network', label: 'My network' },
  { id: 'org', label: 'My organisation' },
  { id: 'saved', label: 'Saved updates' },
];

function StatCard({ label, value, trend, accent = 'bg-accent/10 text-accent' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {trend ? <p className={`mt-2 text-xs font-semibold ${accent}`}>{trend}</p> : null}
    </div>
  );
}

StatCard.propTypes = {
  accent: PropTypes.string,
  label: PropTypes.string.isRequired,
  trend: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};

export default function ActivityFilters({
  filters,
  onFiltersChange,
  metrics,
  hasActiveFilters = false,
  onReset,
  disabled = false,
  availableCategories = CATEGORY_OPTIONS,
  availableTimeframes = TIMEFRAME_OPTIONS,
  availableAudiences = AUDIENCE_OPTIONS,
  lastRefreshedAt = null,
}) {
  const refreshLabel = useMemo(() => {
    if (!lastRefreshedAt) {
      return 'Synced moments ago';
    }
    try {
      const timestamp = typeof lastRefreshedAt === 'string' ? new Date(lastRefreshedAt) : lastRefreshedAt;
      if (Number.isNaN(timestamp.getTime())) {
        return 'Synced recently';
      }
      return `Synced ${formatRelativeTime(timestamp.toISOString())}`;
    } catch (error) {
      return 'Synced recently';
    }
  }, [lastRefreshedAt]);

  const trendingTopics = metrics?.trendingTopics ?? [];
  const stats = [
    {
      id: 'total',
      label: 'Posts in view',
      value: metrics?.totalPosts ?? 0,
      trend: metrics?.totalDelta,
    },
    {
      id: 'opportunities',
      label: 'Opportunities',
      value: metrics?.opportunityPosts ?? 0,
      trend: metrics?.opportunityDelta,
      accent: 'bg-emerald-100 text-emerald-700',
    },
    {
      id: 'media',
      label: 'Media moments',
      value: metrics?.mediaPosts ?? 0,
      trend: metrics?.mediaDelta,
      accent: 'bg-indigo-100 text-indigo-700',
    },
    {
      id: 'engagement',
      label: 'Avg engagement',
      value: metrics?.avgEngagement ?? 0,
      trend: metrics?.engagementDelta,
      accent: 'bg-amber-100 text-amber-700',
    },
  ];

  const handleCategorySelect = (categoryId) => {
    if (disabled) return;
    onFiltersChange?.({ ...filters, category: categoryId });
  };

  const handleTimeframeSelect = (timeframeId) => {
    if (disabled) return;
    onFiltersChange?.({ ...filters, timeframe: timeframeId });
  };

  const handleAudienceSelect = (audienceId) => {
    if (disabled) return;
    onFiltersChange?.({ ...filters, audience: audienceId });
  };

  const handleReset = () => {
    if (disabled) return;
    if (onReset) {
      onReset();
      return;
    }
    onFiltersChange?.({ category: 'all', timeframe: '30d', audience: 'all' });
  };

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Timeline controls</p>
          <h2 className="text-lg font-semibold text-slate-900">Curate your home feed</h2>
          <p className="text-xs font-semibold text-slate-500">{refreshLabel}</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={handleReset}
            disabled={disabled || !hasActiveFilters}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 font-semibold uppercase tracking-wide transition ${
              disabled || !hasActiveFilters
                ? 'cursor-not-allowed border-slate-200 text-slate-300'
                : 'border-slate-200 text-slate-600 hover:border-accent hover:text-accent'
            }`}
          >
            <ArrowPathIcon className="h-4 w-4" /> Reset
          </button>
        </div>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Categories</p>
          <div className="flex flex-wrap gap-2">
            {availableCategories.map((category) => {
              const isActive = filters?.category === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-accent text-white shadow-soft'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <AdjustmentsHorizontalIcon className="h-4 w-4" />
                  <span>{category.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-500">{availableCategories.find((item) => item.id === filters?.category)?.description}</p>
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Timeframe</p>
          <div className="flex flex-wrap gap-2">
            {availableTimeframes.map((timeframe) => {
              const isActive = filters?.timeframe === timeframe.id;
              return (
                <button
                  key={timeframe.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleTimeframeSelect(timeframe.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-soft'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <ClockIcon className="h-4 w-4" />
                  <span>{timeframe.label}</span>
                </button>
              );
            })}
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Audience</p>
            <div className="flex flex-wrap gap-2">
              {availableAudiences.map((audience) => {
                const isActive = filters?.audience === audience.id;
                return (
                  <button
                    key={audience.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleAudienceSelect(audience.id)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-soft'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    }`}
                  >
                    <UserGroupIcon className="h-4 w-4" />
                    <span>{audience.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.id} label={stat.label} value={stat.value} trend={stat.trend} accent={stat.accent} />
        ))}
      </div>
      <div className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Trending topics</p>
        {trendingTopics.length ? (
          <ul className="mt-3 space-y-3">
            {trendingTopics.map((topic) => (
              <li key={topic.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span className="truncate">{topic.label}</span>
                  <span className="ml-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{topic.count}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-accent"
                    style={{ width: `${Math.min(100, (topic.percentage ?? 0) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            Apply filters or share updates to unlock trending topics.
          </div>
        )}
      </div>
    </section>
  );
}

ActivityFilters.propTypes = {
  availableAudiences: PropTypes.array,
  availableCategories: PropTypes.array,
  availableTimeframes: PropTypes.array,
  disabled: PropTypes.bool,
  filters: PropTypes.shape({
    audience: PropTypes.string,
    category: PropTypes.string,
    timeframe: PropTypes.string,
  }),
  hasActiveFilters: PropTypes.bool,
  lastRefreshedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  metrics: PropTypes.shape({
    avgEngagement: PropTypes.number,
    mediaDelta: PropTypes.string,
    mediaPosts: PropTypes.number,
    opportunityDelta: PropTypes.string,
    opportunityPosts: PropTypes.number,
    totalDelta: PropTypes.string,
    totalPosts: PropTypes.number,
    engagementDelta: PropTypes.string,
    trendingTopics: PropTypes.arrayOf(
      PropTypes.shape({
        count: PropTypes.number,
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        percentage: PropTypes.number,
      }),
    ),
  }),
  onFiltersChange: PropTypes.func,
  onReset: PropTypes.func,
};
