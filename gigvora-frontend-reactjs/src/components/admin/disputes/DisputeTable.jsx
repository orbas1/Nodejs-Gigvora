import PropTypes from 'prop-types';
import { ArrowLongRightIcon } from '@heroicons/react/24/outline';

function formatCurrency(amount, currencyCode = 'USD') {
  if (!Number.isFinite(Number(amount))) {
    return '—';
  }
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: Number(amount) >= 1000 ? 0 : 2,
  }).format(Number(amount));
}

function formatDateTime(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function capitalize(value) {
  if (!value) {
    return '—';
  }
  return value
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function statusTone(status) {
  switch (status) {
    case 'open':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'awaiting_customer':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'under_review':
      return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'settled':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'closed':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

function priorityTone(priority) {
  switch (priority) {
    case 'urgent':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'high':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'medium':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'low':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

function buildBreakdownList(breakdown) {
  if (!breakdown) {
    return [];
  }
  return Object.entries(breakdown)
    .map(([key, value]) => ({ key, label: capitalize(key), value: Number(value) || 0 }))
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value);
}

export default function DisputeTable({
  items = [],
  summary = {},
  pagination = { page: 1, pageSize: 25, totalItems: 0, totalPages: 1 },
  loading = false,
  onSelect,
  onPageChange,
}) {
  const stageBreakdown = buildBreakdownList(summary?.totalsByStage);
  const priorityBreakdown = buildBreakdownList(summary?.totalsByPriority);

  const currentPage = Math.max(1, Number(pagination?.page) || 1);
  const totalPages = Math.max(1, Number(pagination?.totalPages) || 1);
  const totalItems = Number.isFinite(Number(pagination?.totalItems))
    ? Number(pagination.totalItems)
    : items.length;

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange?.(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange?.(currentPage + 1);
    }
  };

  const handleRowActivate = (event, item) => {
    if (!onSelect) {
      return;
    }

    if (event?.type === 'keydown') {
      const triggerKeys = ['Enter', ' '];
      if (!triggerKeys.includes(event.key)) {
        return;
      }
      event.preventDefault();
    }

    onSelect(item);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Queue</h2>
          <div className="flex flex-wrap gap-3">
            {stageBreakdown.map((entry) => (
              <span
                key={`stage-${entry.key}`}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                {entry.label}
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-500">{entry.value}</span>
              </span>
            ))}
            {priorityBreakdown.map((entry) => (
              <span
                key={`priority-${entry.key}`}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
              >
                {entry.label}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">{entry.value}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
          <thead className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-3 font-semibold">Case</th>
              <th className="px-6 py-3 font-semibold">Stage</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold">Priority</th>
              <th className="px-6 py-3 font-semibold">Escrow</th>
              <th className="px-6 py-3 font-semibold">Owner</th>
              <th className="px-6 py-3 font-semibold">Cust due</th>
              <th className="px-6 py-3 font-semibold">Prov due</th>
              <th className="px-6 py-3 font-semibold">Updated</th>
              <th className="px-6 py-3 font-semibold">Note</th>
              <th className="px-6 py-3" aria-hidden="true" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={11} className="px-6 py-8 text-center text-sm text-slate-500">Loading…</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-10 text-center text-sm text-slate-500">No disputes.</td>
              </tr>
            ) : (
              items.map((item) => {
                const latestNote = item.latestEvent?.notes || item.latestEvent?.actionType;
                return (
                  <tr
                    key={item.id}
                    className="cursor-pointer bg-white transition hover:bg-blue-50/50"
                    tabIndex={0}
                    aria-label={`View dispute #${item.id} - ${capitalize(item.stage)} stage`}
                    onClick={(event) => handleRowActivate(event, item)}
                    onKeyDown={(event) => handleRowActivate(event, item)}
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      #{item.id}
                      {item.transaction?.reference ? (
                        <p className="text-xs font-normal text-slate-500">Escrow {item.transaction.reference}</p>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{capitalize(item.stage)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(item.status)}`}>
                        {capitalize(item.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${priorityTone(item.priority)}`}>
                        {capitalize(item.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatCurrency(item.transaction?.amount, item.transaction?.currencyCode)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.assignedTo?.displayName || item.assignedTo?.email || 'Unassigned'}
                    </td>
                    <td className={`px-6 py-4 text-sm ${item.overdue ? 'text-rose-600' : 'text-slate-600'}`}>
                      {formatDateTime(item.customerDeadlineAt)}
                    </td>
                    <td className={`px-6 py-4 text-sm ${item.overdue ? 'text-rose-600' : 'text-slate-600'}`}>
                      {formatDateTime(item.providerDeadlineAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatDateTime(item.updatedAt)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {latestNote ? <span className="line-clamp-2">{latestNote}</span> : '—'}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-400">
                      <ArrowLongRightIcon className="inline h-5 w-5" aria-hidden="true" focusable="false" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-600">
        <div aria-live="polite">
          Page {currentPage} of {totalPages} · {totalItems} total cases
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={loading || currentPage <= 1}
            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={loading || currentPage >= totalPages}
            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

DisputeTable.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  summary: PropTypes.shape({
    totalsByStage: PropTypes.object,
    totalsByPriority: PropTypes.object,
  }),
  pagination: PropTypes.shape({
    page: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    pageSize: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalItems: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalPages: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  loading: PropTypes.bool,
  onSelect: PropTypes.func,
  onPageChange: PropTypes.func,
};

