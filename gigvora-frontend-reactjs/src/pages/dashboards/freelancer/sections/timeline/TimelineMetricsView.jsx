import { ChartBarIcon, CursorArrowRaysIcon, FireIcon, MegaphoneIcon, SparklesIcon } from '@heroicons/react/24/outline';

const METRIC_ORDER = [
  { key: 'posts', label: 'Posts', icon: MegaphoneIcon },
  { key: 'published', label: 'Published', icon: SparklesIcon },
  { key: 'engagementRate', label: 'Engagement %', icon: CursorArrowRaysIcon, isPercent: true },
  { key: 'impressions', label: 'Impressions', icon: ChartBarIcon },
  { key: 'reactions', label: 'Reactions', icon: FireIcon },
];

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  if (Math.abs(numeric) >= 1000) {
    return `${Math.round((numeric / 1000) * 10) / 10}k`;
  }
  return `${Math.round(numeric)}`;
}

function formatPercent(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0%';
  }
  return `${Math.round(numeric * 10) / 10}%`;
}

export default function TimelineMetricsView({ analytics }) {
  const totals = analytics?.totals ?? {};
  const timelineSummary = analytics?.timelineSummary ?? {};
  const trend = Array.isArray(analytics?.trend) ? analytics.trend : [];
  const topPosts = Array.isArray(analytics?.topPosts) ? analytics.topPosts : [];
  const topTags = Array.isArray(analytics?.topTags) ? analytics.topTags : [];

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {METRIC_ORDER.map((item) => {
          const Icon = item.icon;
          const value = item.isPercent ? formatPercent(totals[item.key]) : formatNumber(totals[item.key]);
          return (
            <div key={item.key} className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{item.label}</span>
                <Icon className="h-5 w-5 text-blue-500" />
              </div>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{value}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
          <h4 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">Timeline</h4>
          <div className="mt-4 space-y-3">
            {['planned', 'in_progress', 'completed', 'blocked', 'upcoming'].map((key) => (
              <div key={key} className="flex items-center justify-between text-sm text-slate-600">
                <span className="font-medium capitalize">{key.replace('_', ' ')}</span>
                <span className="font-semibold text-slate-900">{timelineSummary[key] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
          <h4 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">Momentum</h4>
          <div className="mt-4 space-y-3">
            {trend.slice(-6).map((item) => (
              <div key={item.capturedAt} className="flex items-center justify-between text-sm text-slate-600">
                <span className="font-medium">{item.capturedAt}</span>
                <span className="font-semibold text-slate-900">{formatNumber(item.impressions)} / {formatNumber(item.reactions)}</span>
              </div>
            ))}
            {trend.length === 0 ? <p className="text-sm font-semibold text-slate-400">No trend yet</p> : null}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
          <h4 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">Highlights</h4>
          <div className="mt-4 space-y-3">
            {topPosts.slice(0, 3).map((post) => (
              <div key={post.id ?? post.title} className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">{post.title}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {formatNumber(post.metrics?.totals?.impressions)} impressions · {formatPercent(post.metrics?.totals?.engagementRate ?? post.metrics?.totals?.engagement_rate)}
                </p>
              </div>
            ))}
            {topTags.length ? (
              <div className="flex flex-wrap gap-2">
                {topTags.map((tag) => (
                  <span key={tag.tag} className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {tag.tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
