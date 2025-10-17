import PropTypes from 'prop-types';
import { ArrowTrendingUpIcon, ChartBarIcon, CursorArrowRaysIcon } from '@heroicons/react/24/outline';

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${(Number(value) * 100).toFixed(1)}%`;
}

export default function TimelineAnalyticsSection({ totals, trend, channelBreakdown, topPosts, onSelectPost, loading }) {
  return (
    <section className="space-y-6" aria-labelledby="timeline-analytics-heading">
      <div className="flex items-center justify-between">
        <h2 id="timeline-analytics-heading" className="text-xl font-semibold text-slate-900">
          Insights
        </h2>
        {loading ? <p className="text-xs text-slate-400">Syncing…</p> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Views</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totals.impressions?.toLocaleString?.() ?? '—'}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Clicks</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totals.clicks?.toLocaleString?.() ?? '—'}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Eng%</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatPercent(totals.engagementRate)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Conv%</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatPercent(totals.conversionRate)}</p>
        </div>
      </div>

      <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ArrowTrendingUpIcon className="h-5 w-5 text-accent" />
          <h3 className="text-sm font-semibold text-slate-900">Trend</h3>
        </div>
        <ul className="space-y-2 text-xs text-slate-500">
          {trend.length ? (
            trend.map((entry) => (
              <li key={entry.date} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                <span className="font-semibold text-slate-700">{new Date(entry.date).toLocaleDateString()}</span>
                <span>{entry.impressions.toLocaleString()} · {formatPercent(entry.engagementRate)}</span>
              </li>
            ))
          ) : (
            <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-slate-400">
              No history
            </li>
          )}
        </ul>
      </div>

      <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 text-accent" />
          <h3 className="text-sm font-semibold text-slate-900">Channels</h3>
        </div>
        <ul className="space-y-2 text-xs text-slate-500">
          {channelBreakdown.length ? (
            channelBreakdown.map((channel) => (
              <li key={channel.channel} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                <span className="font-semibold text-slate-700">{channel.channel}</span>
                <span>{channel.impressions.toLocaleString()} · {formatPercent(channel.engagementRate)}</span>
              </li>
            ))
          ) : (
            <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-slate-400">
              No channel data
            </li>
          )}
        </ul>
      </div>

      <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <CursorArrowRaysIcon className="h-5 w-5 text-accent" />
          <h3 className="text-sm font-semibold text-slate-900">Posts</h3>
        </div>
        <ul className="space-y-2 text-sm text-slate-600">
          {topPosts.length ? (
            topPosts.map((post) => (
              <li key={post.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                <div>
                  <p className="font-semibold text-slate-900">{post.title}</p>
                  <p className="text-xs text-slate-500">{post.impressions.toLocaleString()} · {formatPercent(post.engagementRate)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectPost?.(post)}
                  className="text-xs font-semibold text-accent hover:text-accentDark"
                >
                  Open
                </button>
              </li>
            ))
          ) : (
            <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-slate-400">
              No posts yet
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}

TimelineAnalyticsSection.propTypes = {
  totals: PropTypes.shape({
    impressions: PropTypes.number,
    clicks: PropTypes.number,
    engagementRate: PropTypes.number,
    conversionRate: PropTypes.number,
  }),
  trend: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      impressions: PropTypes.number.isRequired,
      engagementRate: PropTypes.number,
    }),
  ),
  channelBreakdown: PropTypes.arrayOf(
    PropTypes.shape({
      channel: PropTypes.string.isRequired,
      impressions: PropTypes.number.isRequired,
      engagementRate: PropTypes.number,
    }),
  ),
  topPosts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      impressions: PropTypes.number.isRequired,
      engagementRate: PropTypes.number,
    }),
  ),
  onSelectPost: PropTypes.func,
  loading: PropTypes.bool,
};

TimelineAnalyticsSection.defaultProps = {
  totals: {},
  trend: [],
  channelBreakdown: [],
  topPosts: [],
  onSelectPost: undefined,
  loading: false,
};
