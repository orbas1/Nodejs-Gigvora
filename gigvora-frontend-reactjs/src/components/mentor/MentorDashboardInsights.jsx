import { ArrowPathIcon } from '@heroicons/react/24/outline';
import DataStatus from '../DataStatus.jsx';

const STAT_TILES = [
  { key: 'activeMentees', label: 'Active mentees', suffix: '', trendKey: 'activeMenteesChange' },
  { key: 'upcomingSessions', label: 'Upcoming sessions', suffix: '', trendKey: 'upcomingSessionsChange' },
  { key: 'avgRating', label: 'Avg. rating', suffix: '/5', trendKey: 'avgRatingChange' },
  { key: 'monthlyRevenue', label: 'Monthly revenue', prefix: '£', trendKey: 'monthlyRevenueChange' },
];

function TrendLabel({ value }) {
  const numericValue = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(numericValue) || numericValue === 0) {
    return <span className="text-xs text-slate-500">Stable</span>;
  }
  const isPositive = numericValue > 0;
  return (
    <span className={`text-xs font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
      {isPositive ? '+' : ''}
      {numericValue}%
    </span>
  );
}

function StatTile({ stat }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-900">
        {stat.prefix}
        {stat.value}
        {stat.suffix}
      </p>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
        <p>{stat.caption}</p>
        {stat.trend !== undefined ? <TrendLabel value={stat.trend} /> : null}
      </div>
    </div>
  );
}

function normalizeStats(stats = {}) {
  return STAT_TILES.map((tile) => {
    const value = stats[tile.key] ?? 0;
    const prefix = tile.prefix ?? '';
    const suffix = tile.suffix ?? '';
    const change = stats[tile.trendKey];
    const caption = (() => {
      if (change === undefined || change === null) {
        return 'Last 30 days';
      }
      const numericChange = typeof change === 'string' ? Number.parseFloat(change) : change;
      if (!Number.isFinite(numericChange) || numericChange === 0) {
        return 'Holding steady vs. last month';
      }
      return numericChange > 0 ? 'Growth vs. last month' : 'Down vs. last month';
    })();
    return {
      ...tile,
      value,
      prefix,
      suffix,
      caption,
      trend: change,
    };
  });
}

export default function MentorDashboardInsights({ dashboard, loading, error, onRefresh }) {
  const stats = normalizeStats(dashboard?.stats);
  const conversion = Array.isArray(dashboard?.conversion) ? dashboard.conversion : null;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Mentorship performance</h2>
          <p className="text-sm text-slate-500">
            Keep tabs on mentee growth, upcoming sessions, and the health of your mentorship revenue stream.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onRefresh?.()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      <DataStatus loading={loading} error={error} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatTile key={stat.key} stat={stat} />
        ))}
      </div>
      {conversion ? (
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-blue-50 p-6">
          <h3 className="text-lg font-semibold text-slate-900">Conversion funnel</h3>
          <p className="mt-1 text-sm text-slate-500">
            Explorer demand, booking requests, and confirmed sessions across the past 30 days.
          </p>
          <dl className="mt-4 grid gap-4 md:grid-cols-3">
            {conversion.map((stage) => (
              <div key={stage.id} className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stage.label}</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{stage.value}</p>
                <TrendLabel value={stage.delta} />
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </section>
  );
}
