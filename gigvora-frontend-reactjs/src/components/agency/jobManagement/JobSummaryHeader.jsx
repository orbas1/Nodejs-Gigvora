import PropTypes from 'prop-types';
import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return new Intl.NumberFormat('en-US').format(numeric);
}

const SUMMARY_CARDS = [
  {
    id: 'total-jobs',
    label: 'Jobs',
    field: 'totalJobs',
    tone: 'bg-indigo-50 text-indigo-700',
  },
  {
    id: 'open-jobs',
    label: 'Open',
    field: 'openJobs',
    tone: 'bg-emerald-50 text-emerald-700',
  },
  {
    id: 'favorite-jobs',
    label: 'Starred',
    field: 'favoriteJobs',
    tone: 'bg-amber-50 text-amber-700',
  },
  {
    id: 'total-applications',
    label: 'Apps',
    field: 'totalApplications',
    tone: 'bg-blue-50 text-blue-700',
  },
];

export default function JobSummaryHeader({
  metrics,
  interviewSummary,
  isRefreshing = false,
  onRefresh,
  onCreate,
  workspaceId,
}) {
  const jobSummary = metrics ?? {};
  const interviewCounts = interviewSummary ?? {};

  return (
    <header className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Workspace</p>
          <h2 className="text-2xl font-semibold text-slate-900">{workspaceId || '—'}</h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </button>
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            New role
          </button>
        </div>
      </div>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {SUMMARY_CARDS.map((card) => (
          <div key={card.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{card.label}</dt>
            <dd className={`mt-3 text-2xl font-semibold ${card.tone}`}>{formatNumber(jobSummary?.[card.field] ?? 0)}</dd>
          </div>
        ))}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Interviews</dt>
          <dd className="mt-3 text-2xl font-semibold text-slate-900">
            {formatNumber(interviewCounts.planned ?? interviewCounts.scheduled ?? 0)}
          </dd>
        </div>
      </dl>
    </header>
  );
}

JobSummaryHeader.propTypes = {
  metrics: PropTypes.shape({
    totalJobs: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    openJobs: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    favoriteJobs: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    totalApplications: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  interviewSummary: PropTypes.shape({
    planned: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    scheduled: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  isRefreshing: PropTypes.bool,
  onRefresh: PropTypes.func,
  onCreate: PropTypes.func,
  workspaceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

JobSummaryHeader.defaultProps = {
  metrics: {},
  interviewSummary: {},
  isRefreshing: false,
  onRefresh: undefined,
  onCreate: undefined,
  workspaceId: null,
};
