import { StarIcon } from '@heroicons/react/24/solid';
import { ArrowUpRightIcon } from '@heroicons/react/24/outline';
import StatusBadge from './StatusBadge.jsx';
import { formatDate, formatDateTime } from './utils.js';

function MetricCard({ label, value, tone = 'slate' }) {
  const toneClass =
    tone === 'emerald' ? 'text-emerald-600' : tone === 'amber' ? 'text-amber-600' : tone === 'blue' ? 'text-blue-600' : 'text-slate-900';
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function Distribution({ ratingDistribution }) {
  const totals = Object.values(ratingDistribution ?? {}).reduce((sum, count) => sum + count, 0);
  return (
    <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rating mix</p>
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = ratingDistribution?.[star] ?? 0;
          const percent = totals ? Math.round((count / totals) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-3">
              <div className="flex w-12 items-center gap-1 text-sm font-medium text-slate-600">
                <StarIcon className="h-4 w-4 text-amber-400" />
                {star}
              </div>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600" style={{ width: `${percent}%` }} />
              </div>
              <div className="w-12 text-right text-xs font-semibold text-slate-500">{percent}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OverviewView({ summary, reviews, ratingDistribution, onSelectReview }) {
  const featured = reviews.find((review) => review.highlighted) ?? reviews[0];
  const totalReviews = Number.isFinite(summary?.total) ? summary.total : 0;
  const liveReviews = Number.isFinite(summary?.published) ? summary.published : 0;
  const averageRating = Number.isFinite(summary?.averageRating) ? summary.averageRating.toFixed(1) : '—';

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard label="Total" value={totalReviews} tone="blue" />
          <MetricCard label="Live" value={liveReviews} tone="emerald" />
          <MetricCard label="Avg rating" value={averageRating} tone="amber" />
        </div>

        {featured ? (
          <button
            type="button"
            onClick={() => onSelectReview(featured)}
            className="group flex w-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500 text-white">
                  <StarIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{featured.reviewerName || 'Client'}</p>
                  <p className="text-xs text-slate-500">{featured.reviewerCompany || 'Company'}</p>
                </div>
              </div>
              <StatusBadge status={featured.status} />
            </div>
            <p className="text-lg font-semibold text-slate-900">{featured.title}</p>
            {featured.body ? <p className="line-clamp-3 text-sm text-slate-600">{featured.body}</p> : null}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{formatDate(featured.publishedAt ?? featured.capturedAt)}</span>
              <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
                Open
                <ArrowUpRightIcon className="h-4 w-4" />
              </span>
            </div>
          </button>
        ) : null}
      </div>

      <div className="space-y-6">
        <Distribution ratingDistribution={ratingDistribution} />
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timeline</p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
              <span>Last publish</span>
              <span className="font-semibold text-slate-900">{formatDateTime(summary.lastPublishedAt)}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
              <span>Drafts</span>
              <span className="font-semibold text-slate-900">{summary.draft ?? 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
              <span>Queue</span>
              <span className="font-semibold text-slate-900">{summary.pending ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
