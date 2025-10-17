import { ShieldCheckIcon, ArrowPathIcon, PlusIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { STATUS_LABELS, RISK_LABELS } from './constants.js';
import { classNames, formatDate, formatNumber, resolveName } from './utils.js';

export default function IdVerificationQueuePanel({
  summaryCards,
  summaryLoading,
  onRefresh,
  filters,
  onOpenFilters,
  onOpenCreate,
  canManage,
  loading,
  error,
  verifications,
  pagination,
  onPageChange,
  onPageSizeChange,
  onOpenDetail,
  workspaceSlug,
}) {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 rounded-4xl border border-slate-200 bg-white/95 p-8 shadow-soft lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            <ShieldCheckIcon className="h-4 w-4 text-accent" />
            <span>ID checks</span>
          </div>
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">Identity reviews</h2>
            <p className="mt-1 text-sm text-slate-500">
              {workspaceSlug ? `Workspace · ${workspaceSlug}` : 'Workspace wide'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onOpenFilters}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/40 hover:text-accent"
          >
            <ArrowsRightLeftIcon className="h-5 w-5" />
            Filters
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/40 hover:text-accent"
          >
            <ArrowPathIcon className={classNames('h-5 w-5', loading ? 'animate-spin text-accent' : 'text-slate-400')} />
            Refresh
          </button>
          {canManage ? (
            <button
              type="button"
              onClick={onOpenCreate}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
            >
              <PlusIcon className="h-5 w-5" />
              New check
            </button>
          ) : null}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => (
          <article
            key={card.id}
            className={classNames(
              'rounded-3xl border bg-white px-6 py-5 shadow-soft transition',
              card.tone === 'alert'
                ? 'border-amber-200 bg-amber-50'
                : card.tone === 'positive'
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-slate-200',
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {summaryLoading ? <ArrowPathIcon className="h-5 w-5 animate-spin text-accent" /> : card.value}
            </p>
            <p className="mt-2 text-xs text-slate-500">{card.caption}</p>
          </article>
        ))}
      </section>

      <ActiveFilters filters={filters} />

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold">{error?.body?.message ?? error.message ?? 'Unable to load verification records.'}</p>
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:text-rose-800"
            >
              <ArrowPathIcon className="h-4 w-4" /> Retry
            </button>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-soft">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Member
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Risk
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Reviewer
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Submitted
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Next review
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-4 py-10 text-center text-sm text-slate-500">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
                    <ArrowPathIcon className="h-5 w-5 animate-spin text-accent" />
                    Loading checks…
                  </div>
                </td>
              </tr>
            ) : verifications.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-10 text-center text-sm text-slate-500">
                  No results for the current filters.
                </td>
              </tr>
            ) : (
              verifications.map((verification) => (
                <tr key={verification.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{verification.fullName}</p>
                      <p className="text-xs text-slate-500">{verification.typeOfId ?? '—'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill status={verification.status} />
                  </td>
                  <td className="px-4 py-4">
                    <RiskPill risk={verification.riskLevel} />
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{resolveName(verification.assignedReviewer ?? verification.reviewer)}</p>
                      <p className="text-xs text-slate-500">{verification.reviewer?.email || verification.assignedReviewer?.email || '—'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">{formatDate(verification.submittedAt)}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{formatDate(verification.nextReviewAt)}</td>
                  <td className="px-4 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onOpenDetail(verification)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent/50 hover:text-accent"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:flex-row">
          <div>
            Page {pagination.page} of {Math.max(1, pagination.totalPages)} · {formatNumber(pagination.total)} records
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page <= 1}
              className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(pagination.totalPages || 1, pagination.page + 1))}
              disabled={pagination.page >= (pagination.totalPages || 1)}
              className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
            <select
              value={pagination.pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 focus:border-accent focus:outline-none"
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActiveFilters({ filters }) {
  const chips = [];
  filters.status.forEach((status) => {
    chips.push({ id: `status-${status}`, label: STATUS_LABELS[status] ?? status });
  });
  filters.riskLevel.forEach((risk) => {
    chips.push({ id: `risk-${risk}`, label: `${RISK_LABELS[risk] ?? risk} risk` });
  });
  if (filters.requiresManualReview) {
    chips.push({ id: 'flag-manual', label: 'Manual review' });
  }
  if (filters.requiresReverification) {
    chips.push({ id: 'flag-reverify', label: 'Reverify' });
  }
  if (filters.search) {
    chips.push({ id: 'search', label: `Search: ${filters.search}` });
  }

  if (!chips.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
        >
          {chip.label}
        </span>
      ))}
    </div>
  );
}

function StatusPill({ status }) {
  const normalised = status?.toLowerCase?.() ?? 'pending';
  const baseClass =
    normalised === 'verified'
      ? 'bg-emerald-100 text-emerald-700'
      : normalised === 'rejected'
      ? 'bg-rose-100 text-rose-700'
      : normalised === 'in_review'
      ? 'bg-sky-100 text-sky-700'
      : 'bg-slate-100 text-slate-600';
  return (
    <span className={classNames('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', baseClass)}>
      {STATUS_LABELS[normalised] ?? status ?? 'Waiting'}
    </span>
  );
}

function RiskPill({ risk }) {
  const tone =
    risk === 'critical'
      ? 'bg-rose-100 text-rose-700'
      : risk === 'high'
      ? 'bg-amber-100 text-amber-700'
      : risk === 'moderate'
      ? 'bg-sky-100 text-sky-700'
      : 'bg-emerald-100 text-emerald-700';
  return (
    <span className={classNames('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', tone)}>
      {RISK_LABELS[risk] ?? 'Low'}
    </span>
  );
}
