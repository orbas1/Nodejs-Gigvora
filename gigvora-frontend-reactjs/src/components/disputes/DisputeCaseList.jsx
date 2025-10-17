import { ArrowPathIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

function formatCurrency(amount, currency = 'USD') {
  if (amount == null) {
    return '—';
  }
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  });
  return formatter.format(Number(amount));
}

function formatRelativeTime(value) {
  if (!value) {
    return '—';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  const diff = Date.now() - date.getTime();
  const absoluteDiff = Math.abs(diff);
  const minutes = Math.round(absoluteDiff / (1000 * 60));
  if (minutes < 1) {
    return 'just now';
  }
  if (minutes < 60) {
    return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  }
  const hours = Math.round(absoluteDiff / (1000 * 60 * 60));
  if (hours < 24) {
    return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.round(absoluteDiff / (1000 * 60 * 60 * 24));
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function formatStage(stage) {
  if (!stage) {
    return '—';
  }
  return stage.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatAssignee(dispute) {
  if (!dispute) {
    return 'Unassigned';
  }
  if (dispute.assignedTo?.name) {
    return dispute.assignedTo.name;
  }
  if (dispute.assignedToId) {
    return `User #${dispute.assignedToId}`;
  }
  return 'Unassigned';
}

function getDeadlineInfo(dispute) {
  const deadlines = [dispute?.customerDeadlineAt, dispute?.providerDeadlineAt]
    .map((value) => {
      if (!value) {
        return null;
      }
      const date = value instanceof Date ? value : new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    })
    .filter(Boolean)
    .sort((a, b) => a.getTime() - b.getTime());

  if (deadlines.length === 0) {
    return { label: 'No SLA set', tone: 'muted' };
  }

  const nextDeadline = deadlines[0];
  const diffMs = nextDeadline.getTime() - Date.now();
  const days = Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
  const formattedDate = nextDeadline.toLocaleString();

  if (diffMs < 0) {
    return {
      label: `Overdue ${days === 1 ? '1 day' : `${days} days`} • ${formattedDate}`,
      tone: 'danger',
    };
  }

  if (diffMs < 1000 * 60 * 60 * 24) {
    return { label: `Due today • ${formattedDate}`, tone: 'warning' };
  }

  if (diffMs < 1000 * 60 * 60 * 24 * 3) {
    return {
      label: `Due in ${days} day${days === 1 ? '' : 's'} • ${formattedDate}`,
      tone: 'warning',
    };
  }

  return {
    label: `Due in ${days} day${days === 1 ? '' : 's'} • ${formattedDate}`,
    tone: 'muted',
  };
}

const priorityTone = {
  urgent: 'bg-rose-100 text-rose-700',
  high: 'bg-amber-100 text-amber-700',
  medium: 'bg-blue-100 text-blue-700',
  low: 'bg-slate-100 text-slate-600',
};

const deadlineToneClasses = {
  danger: 'text-rose-600 font-semibold',
  warning: 'text-amber-600 font-semibold',
  muted: 'text-slate-600',
};

export default function DisputeCaseList({
  disputes,
  totals,
  loading,
  selectedId,
  onSelect,
  onRefresh,
  pagination,
  onPageChange,
  onOpenFilters,
  onToggleOnlyMine,
  onToggleIncludeClosed,
  onlyMine,
  includeClosed,
  filterSummary,
  error,
}) {
  const page = pagination?.page ?? 1;
  const totalPages = pagination?.totalPages ?? 1;
  const totalItems = pagination?.totalItems ?? disputes.length ?? 0;
  const openDisputes = totals?.openDisputes ?? 0;
  const overdue = totals?.overdue ?? 0;

  return (
    <section className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Queue</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">{openDisputes} open</span>
            <span className={`rounded-full px-3 py-1 font-semibold ${overdue ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
              {overdue} overdue
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={onOpenFilters}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
          >
            Filters
          </button>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
        <button
          type="button"
          onClick={onToggleOnlyMine}
          className={`rounded-full px-3 py-1 transition ${
            onlyMine ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
          }`}
        >
          My cases
        </button>
        <button
          type="button"
          onClick={onToggleIncludeClosed}
          className={`rounded-full px-3 py-1 transition ${
            includeClosed
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
          }`}
        >
          Closed
        </button>
        {filterSummary?.map((chip) => (
          <span
            key={chip.id}
            className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-slate-600"
            title={chip.label}
          >
            {chip.label}
          </span>
        ))}
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</p>
      ) : null}

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {loading && disputes.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            Loading cases…
          </div>
        ) : null}

        {!loading && disputes.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            No cases match the current filters.
          </div>
        ) : null}

        {disputes.map((dispute) => {
          const isSelected = Number(selectedId) === Number(dispute.id);
          const amount = dispute.transaction?.amount ?? null;
          const currency = dispute.transaction?.currencyCode ?? 'USD';
          const deadlineInfo = getDeadlineInfo(dispute);
          const priority = dispute.priority ?? 'medium';
          const priorityClass = priorityTone[priority] ?? priorityTone.medium;
          const updatedAt = dispute.updatedAt ?? dispute.createdAt;

          return (
            <button
              key={dispute.id}
              type="button"
              onClick={() => onSelect?.(dispute)}
              className={`group w-full rounded-2xl border px-4 py-4 text-left transition ${
                isSelected
                  ? 'border-blue-400 bg-blue-50/70 shadow-md'
                  : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Case #{dispute.id}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                    {dispute.summary ? dispute.summary : 'Summary pending'}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityClass}`}>
                  {formatStage(priority)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700">
                  {formatStage(dispute.stage)}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-slate-600">{formatStage(dispute.status)}</span>
                <span className="rounded-full bg-white px-3 py-1 text-slate-600">{formatCurrency(amount, currency)}</span>
                <span className="rounded-full bg-white px-3 py-1 text-slate-600">{formatAssignee(dispute)}</span>
                <span className={`rounded-full px-3 py-1 ${deadlineToneClasses[deadlineInfo.tone]}`}>{deadlineInfo.label}</span>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Updated {formatRelativeTime(updatedAt)}</span>
                <ChevronRightIcon className="h-4 w-4 text-slate-400 transition group-hover:text-blue-500" />
              </div>
            </button>
          );
        })}
      </div>

      <footer className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Page {page} of {totalPages} • {totalItems} cases
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange?.(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="rounded-full border border-slate-200 px-4 py-1 font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="rounded-full border border-slate-200 px-4 py-1 font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </footer>
    </section>
  );
}
