import PropTypes from 'prop-types';
import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';

const LOOKBACK_OPTIONS = [30, 60, 90, 120];

export default function TimelineSummarySection({
  metrics,
  lookbackDays,
  onLookbackChange,
  onRefresh,
  onCreatePost,
  onOpenInsights,
  refreshing,
  updatedAt,
  metadata,
}) {
  const formattedUpdatedAt = updatedAt ? new Date(updatedAt).toLocaleString() : null;

  return (
    <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-soft" aria-labelledby="timeline-summary-heading">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-1">
          <h2 id="timeline-summary-heading" className="text-xl font-semibold text-slate-900">
            Overview
          </h2>
          {formattedUpdatedAt ? <p className="text-xs text-slate-400">Updated {formattedUpdatedAt}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenInsights}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-accent hover:text-accentDark"
          >
            Insights
          </button>
          <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Range
            <select
              value={lookbackDays}
              onChange={onLookbackChange}
              className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {LOOKBACK_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}d
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            disabled={refreshing}
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin text-accent' : ''}`} />
            Sync
          </button>
          <button
            type="button"
            onClick={onCreatePost}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark"
          >
            <PlusIcon className="h-4 w-4" />
            New
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{metric.value}</p>
          </div>
        ))}
        {metadata?.topChannel ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-900 text-white">
            <div className="space-y-2 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-200">Top channel</p>
              <p className="text-lg font-semibold">{metadata.topChannel.channel}</p>
              <p className="text-xs text-slate-200">
                {metadata.topChannel.impressions.toLocaleString()} views · {(metadata.topChannel.engagementRate * 100).toFixed(1)}% engage
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

TimelineSummarySection.propTypes = {
  metrics: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    }),
  ),
  lookbackDays: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onLookbackChange: PropTypes.func.isRequired,
  onRefresh: PropTypes.func,
  onCreatePost: PropTypes.func.isRequired,
  onOpenInsights: PropTypes.func.isRequired,
  refreshing: PropTypes.bool,
  updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  metadata: PropTypes.shape({
    topChannel: PropTypes.shape({
      channel: PropTypes.string,
      impressions: PropTypes.number,
      engagementRate: PropTypes.number,
    }),
  }),
};

TimelineSummarySection.defaultProps = {
  metrics: [],
  onRefresh: undefined,
  refreshing: false,
  updatedAt: null,
  metadata: null,
};
