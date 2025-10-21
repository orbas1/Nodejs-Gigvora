import PropTypes from 'prop-types';

function statusBadgeTone(status) {
  switch (status) {
    case 'open':
      return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
    case 'awaiting_customer':
      return 'bg-amber-100 text-amber-700 ring-amber-200';
    case 'under_review':
      return 'bg-sky-100 text-sky-700 ring-sky-200';
    case 'settled':
      return 'bg-indigo-100 text-indigo-700 ring-indigo-200';
    case 'closed':
    default:
      return 'bg-slate-100 text-slate-600 ring-slate-200';
  }
}

function priorityTone(priority) {
  switch (priority) {
    case 'urgent':
      return 'text-rose-600';
    case 'high':
      return 'text-amber-600';
    case 'low':
      return 'text-slate-500';
    case 'medium':
    default:
      return 'text-slate-600';
  }
}

function formatCurrency(amount, currency = 'USD') {
  if (amount == null) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch (error) {
    return `$${Number(amount).toFixed(2)}`;
  }
}

function formatDateTime(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function DisputeBoard({ columns, activeDisputeId, onSelect, loading }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
      {columns.map((column) => (
        <section
          key={column.id}
          className="flex min-h-[24rem] flex-col rounded-3xl border border-slate-200/70 bg-white p-4 shadow-soft"
        >
          <header className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{column.label}</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {column.items.length}
            </span>
          </header>

          <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100/70" />
                ))}
              </div>
            ) : column.items.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-xs uppercase tracking-widest text-slate-400">
                Empty
              </p>
            ) : (
              column.items.map((dispute) => {
                const dueAt = formatDateTime(dispute.providerDeadlineAt || dispute.customerDeadlineAt);
                return (
                  <button
                    key={dispute.id}
                    type="button"
                    onClick={() => onSelect(dispute.id)}
                    className={`w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
                      activeDisputeId === dispute.id ? 'ring-2 ring-accent/60' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold capitalize ring-1 ring-inset ${statusBadgeTone(
                          dispute.status,
                        )}`}
                      >
                        {dispute.status.replace(/_/g, ' ')}
                      </span>
                      <span className={`font-semibold ${priorityTone(dispute.priority)}`}>
                        {dispute.priority}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm font-semibold text-slate-900">{dispute.summary}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {dispute.transaction ? (
                        <span className="rounded-full bg-slate-50 px-2 py-1 font-medium text-slate-600">
                          {dispute.transaction.reference || `#${dispute.transaction.id}`}
                        </span>
                      ) : null}
                      {dispute.transaction ? (
                        <span>{formatCurrency(dispute.transaction.amount, dispute.transaction.currencyCode)}</span>
                      ) : null}
                      {dueAt ? <span className="text-amber-600">Due {dueAt}</span> : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

DisputeBoard.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
          status: PropTypes.string.isRequired,
          summary: PropTypes.string.isRequired,
          priority: PropTypes.string,
          providerDeadlineAt: PropTypes.string,
          customerDeadlineAt: PropTypes.string,
          transaction: PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            reference: PropTypes.string,
            amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            currencyCode: PropTypes.string,
          }),
        }),
      ).isRequired,
    }),
  ).isRequired,
  activeDisputeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelect: PropTypes.func,
  loading: PropTypes.bool,
};

DisputeBoard.defaultProps = {
  activeDisputeId: null,
  onSelect: () => {},
  loading: false,
};
