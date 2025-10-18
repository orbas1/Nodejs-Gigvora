import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function WorkspaceHeader({
  stats,
  loading,
  onCreate,
  onRefresh,
}) {
  return (
    <div className="rounded-3xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-950/5">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Timeline workspace</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Release calendar</h1>
          <p className="mt-1 text-sm text-slate-600">
            Track schedules, coordinate comms, and keep every milestone on time.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            disabled={loading}
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            <PlusIcon className="h-4 w-4" />
            New timeline
          </button>
        </div>
      </div>
      <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Total</dt>
          <dd className="mt-1 text-2xl font-semibold text-slate-900">{stats.total}</dd>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-emerald-600">Active</dt>
          <dd className="mt-1 text-2xl font-semibold text-emerald-700">{stats.active}</dd>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-amber-600">Upcoming</dt>
          <dd className="mt-1 text-2xl font-semibold text-amber-700">{stats.upcoming}</dd>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Drafts</dt>
          <dd className="mt-1 text-2xl font-semibold text-slate-900">{stats.draft}</dd>
        </div>
      </dl>
    </div>
  );
}
