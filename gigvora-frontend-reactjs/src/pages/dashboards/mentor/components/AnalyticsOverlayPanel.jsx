import PropTypes from 'prop-types';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

const lookbackOptions = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
];

function TrendBadge({ trend }) {
  if (!trend || trend.value === undefined || trend.value === null) {
    return null;
  }

  const positive = trend.direction === 'up' || trend.value > 0;
  const negative = trend.direction === 'down' || trend.value < 0;
  const tone = positive ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : negative ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-slate-600 bg-slate-50 border-slate-200';
  const Icon = positive ? ArrowTrendingUpIcon : negative ? ArrowTrendingDownIcon : ArrowTrendingUpIcon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>
      <Icon className="h-3.5 w-3.5" />
      {trend.value > 0 ? `+${trend.value}` : trend.value}
      {trend.label ? <span className="font-normal">{trend.label}</span> : null}
    </span>
  );
}

TrendBadge.propTypes = {
  trend: PropTypes.shape({
    value: PropTypes.number,
    label: PropTypes.string,
    direction: PropTypes.oneOf(['up', 'down', 'flat']),
  }),
};

TrendBadge.defaultProps = {
  trend: undefined,
};

function OverlayCard({ overlay }) {
  return (
    <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{overlay.title}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{overlay.headline}</p>
          </div>
          <TrendBadge trend={overlay.trend} />
        </div>
        {overlay.summary ? <p className="text-sm text-slate-600">{overlay.summary}</p> : null}
        {overlay.stats?.length ? (
          <dl className="grid gap-4 sm:grid-cols-3">
            {overlay.stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm shadow-inner">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</dt>
                <dd className={`mt-1 text-base font-semibold ${stat.tone === 'warning' ? 'text-amber-600' : stat.tone === 'positive' ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {stat.value}
                </dd>
                {stat.hint ? <dd className="mt-1 text-[11px] text-slate-500">{stat.hint}</dd> : null}
              </div>
            ))}
          </dl>
        ) : null}
      </div>
      {overlay.insight ? (
        <p className="mt-6 rounded-2xl bg-slate-900/80 px-4 py-3 text-sm text-white shadow-inner">
          <span className="font-semibold">Operator insight:</span> {overlay.insight}
        </p>
      ) : null}
    </div>
  );
}

OverlayCard.propTypes = {
  overlay: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    headline: PropTypes.string.isRequired,
    summary: PropTypes.string,
    trend: PropTypes.shape({
      value: PropTypes.number,
      label: PropTypes.string,
      direction: PropTypes.oneOf(['up', 'down', 'flat']),
    }),
    stats: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        hint: PropTypes.string,
        tone: PropTypes.oneOf(['positive', 'warning', 'neutral']),
      }),
    ),
    insight: PropTypes.string,
  }).isRequired,
};

export default function AnalyticsOverlayPanel({ overlays, lookbackDays, onLookbackChange, loading }) {
  if (!overlays?.length) {
    return null;
  }

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Mentor analytics overlays</p>
          <h2 className="text-xl font-semibold text-slate-900">Understand bookings, revenue, and demand at a glance.</h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <label htmlFor="mentor-analytics-lookback" className="text-slate-500">
            Window
          </label>
          <select
            id="mentor-analytics-lookback"
            value={lookbackDays}
            onChange={(event) => onLookbackChange(Number(event.target.value))}
            disabled={loading}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm focus:border-accent focus:outline-none"
          >
            {lookbackOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {overlays.map((overlay) => (
          <OverlayCard key={overlay.id} overlay={overlay} />
        ))}
      </div>
    </section>
  );
}

AnalyticsOverlayPanel.propTypes = {
  overlays: PropTypes.arrayOf(OverlayCard.propTypes.overlay).isRequired,
  lookbackDays: PropTypes.number.isRequired,
  onLookbackChange: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

AnalyticsOverlayPanel.defaultProps = {
  loading: false,
};
