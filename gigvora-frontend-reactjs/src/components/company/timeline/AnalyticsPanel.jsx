import PropTypes from 'prop-types';
import StatusPill from './StatusPill.jsx';
import { formatAbsolute } from '../../../utils/date.js';

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return Number(value).toLocaleString();
}

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0%';
  }
  return `${Number(value).toFixed(1)}%`;
}

export default function AnalyticsPanel({ analytics, lookbackDays }) {
  const totals = analytics?.totals ?? {};
  const trend = analytics?.trend ?? [];
  const topPosts = analytics?.topPosts ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Stats</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          Last {lookbackDays} days
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Impressions</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(totals.impressions)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Engagements</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(totals.engagements)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Engagement rate</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatPercent(totals.engagementRate)}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Daily trend</h3>
            <span className="text-xs text-slate-400">Most recent first</span>
          </header>
          <div className="mt-3 max-h-[320px] overflow-y-auto">
            <table className="min-w-full text-left text-xs text-slate-600">
              <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-semibold">Date</th>
                  <th className="px-3 py-2 font-semibold">Impressions</th>
                  <th className="px-3 py-2 font-semibold">Engagements</th>
                  <th className="px-3 py-2 font-semibold">Clicks</th>
                </tr>
              </thead>
              <tbody>
                {trend.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-slate-400" colSpan={4}>
                      No metrics yet
                    </td>
                  </tr>
                ) : (
                  trend
                    .slice()
                    .sort((a, b) => new Date(b.metricDate ?? 0) - new Date(a.metricDate ?? 0))
                    .map((point) => (
                      <tr key={point.metricDate} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2 text-slate-700">{formatAbsolute(point.metricDate, { dateStyle: 'medium' })}</td>
                        <td className="px-3 py-2 text-slate-900">{formatNumber(point.impressions)}</td>
                        <td className="px-3 py-2 text-slate-900">{formatNumber(point.engagements)}</td>
                        <td className="px-3 py-2 text-slate-900">{formatNumber(point.clicks)}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Top posts</h3>
            <span className="text-xs text-slate-400">Based on engagement</span>
          </header>
          <ul className="mt-3 space-y-2">
            {topPosts.length === 0 ? (
              <li className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
                No posts yet
              </li>
            ) : (
              topPosts.map((post) => (
                <li key={post.id} className="rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-600">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800">{post.title}</p>
                      {post.publishedAt ? (
                        <p className="mt-1 text-[11px] text-slate-500">{formatAbsolute(post.publishedAt, { dateStyle: 'medium' })}</p>
                      ) : null}
                    </div>
                    <StatusPill tone="green">{formatNumber(post.engagements)} actions</StatusPill>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{formatNumber(post.impressions)} views</span>
                    <span>{formatPercent(post.engagementRate)}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}

AnalyticsPanel.propTypes = {
  analytics: PropTypes.shape({
    totals: PropTypes.object,
    trend: PropTypes.arrayOf(PropTypes.object),
    topPosts: PropTypes.arrayOf(PropTypes.object),
  }),
  lookbackDays: PropTypes.number.isRequired,
};

AnalyticsPanel.defaultProps = {
  analytics: null,
};
