import { CalendarDaysIcon, ClockIcon, UserCircleIcon } from '@heroicons/react/24/outline';

function formatRelative(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return 'moments ago';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

function formatCurrency(amount, currency = 'USD') {
  if (amount == null) return '—';
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: numeric >= 1000 ? 0 : 2,
  }).format(numeric);
}

function EmptyState({ onCreate }) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-4xl border border-dashed border-slate-300 bg-slate-50/70 p-12 text-center">
      <UserCircleIcon className="h-12 w-12 text-slate-300" />
      <h3 className="mt-4 text-lg font-semibold text-slate-800">No applications</h3>
      <button
        type="button"
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        New
      </button>
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange, disabled }) {
  const go = (next) => {
    if (next >= 1 && next <= totalPages) {
      onPageChange(next);
    }
  };
  return (
    <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
      <span className="text-slate-500">
        Page <span className="font-semibold text-slate-900">{page}</span> of{' '}
        <span className="font-semibold text-slate-900">{totalPages}</span>
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => go(page - 1)}
          disabled={disabled || page <= 1}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={() => go(page + 1)}
          disabled={disabled || page >= totalPages}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function JobApplicationTable({
  applications,
  loading,
  onSelect,
  onCreate,
  selectedId,
  pagination,
  onPageChange,
}) {
  if (!loading && (!applications || applications.length === 0)) {
    return <EmptyState onCreate={onCreate} />;
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="grid gap-4">
        {(applications ?? []).map((application) => {
          const isActive = selectedId === application.id;
          return (
            <article
              key={application.id}
              className={`grid gap-4 rounded-4xl border ${
                isActive ? 'border-blue-400 bg-blue-50/60' : 'border-slate-200 bg-white'
              } p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md md:grid-cols-[minmax(0,1fr)_auto]`}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900">{application.candidateName}</h3>
                  <p className="text-sm text-slate-500">{application.candidateEmail}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 font-semibold uppercase tracking-wide text-blue-700">
                      {application.stage?.replace(/_/g, ' ') || 'new'}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 font-semibold uppercase tracking-wide text-slate-600">
                      {application.status?.replace(/_/g, ' ') || 'open'}
                    </span>
                    {application.priority ? (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 font-semibold uppercase tracking-wide text-amber-700">
                        {application.priority.replace(/_/g, ' ')}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900">{application.jobTitle}</p>
                  <p className="text-sm text-slate-500">{application.jobLocation || 'Remote'}</p>
                  <p className="text-sm text-slate-500">{formatCurrency(application.salaryExpectation, application.currency)}</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500 sm:col-span-2">
                  <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
                  <span>{application.interviewCount ?? 0} interviews</span>
                  <ClockIcon className="h-4 w-4 text-slate-400" />
                  <span>{application.noteCount ?? 0} notes</span>
                  <span className="ml-auto text-xs uppercase tracking-wide text-slate-400">Updated {formatRelative(application.updatedAt)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between gap-3">
                <div className="text-right text-sm text-slate-500">
                  <p className="font-semibold text-slate-800">{application.assignedRecruiterName || 'Unassigned'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelect(application)}
                  className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:text-blue-800"
                >
                  Open
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">Refreshing…</div>
      ) : null}

      {pagination ? (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
          disabled={loading}
        />
      ) : null}
    </div>
  );
}
