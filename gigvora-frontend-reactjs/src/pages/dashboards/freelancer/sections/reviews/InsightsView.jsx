import PropTypes from 'prop-types';
import { ChartBarIcon, PhotoIcon, SparklesIcon, TagIcon } from '@heroicons/react/24/outline';
import { formatDate } from './utils.js';

function StatTile({ icon: Icon, label, value, tone = 'blue' }) {
  const toneStyles =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-600'
      : tone === 'amber'
        ? 'bg-amber-50 text-amber-600'
        : 'bg-blue-50 text-blue-600';

  return (
    <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${toneStyles}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-lg font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

StatTile.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  tone: PropTypes.oneOf(['blue', 'emerald', 'amber']),
};

export default function InsightsView({ insights, summary }) {
  const topTags = insights?.topTags ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <StatTile icon={SparklesIcon} label="Pinned" value={insights?.highlightedCount ?? 0} tone="emerald" />
          <StatTile icon={ChartBarIcon} label="Hero coverage" value={`${Math.round((insights?.heroImageCoverage ?? 0) * 100)}%`} />
          <StatTile icon={PhotoIcon} label="Preview links" value={`${Math.round((insights?.previewCoverage ?? 0) * 100)}%`} tone="amber" />
          <StatTile icon={TagIcon} label="Active tags" value={topTags.length} tone="blue" />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last publish</p>
          <p className="mt-3 text-lg font-semibold text-slate-900">{formatDate(summary?.lastPublishedAt)}</p>
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top tags</p>
        {topTags.length ? (
          <ul className="space-y-3">
            {topTags.map((item) => (
              <li key={item.tag} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span className="font-semibold text-slate-900">{item.tag}</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No tags captured yet.</p>
        )}
      </div>
    </div>
  );
}

InsightsView.propTypes = {
  insights: PropTypes.shape({
    highlightedCount: PropTypes.number,
    heroImageCoverage: PropTypes.number,
    previewCoverage: PropTypes.number,
    topTags: PropTypes.arrayOf(
      PropTypes.shape({
        tag: PropTypes.string.isRequired,
        count: PropTypes.number.isRequired,
      }),
    ),
  }),
  summary: PropTypes.shape({
    lastPublishedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  }),
};
