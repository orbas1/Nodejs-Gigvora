import { useMemo } from 'react';
import PropTypes from 'prop-types';

function formatDate(value) {
  if (!value) {
    return '—';
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleDateString();
  } catch (error) {
    return '—';
  }
}

function formatCurrency(amount, currency) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    return `${currency ?? 'USD'} —`;
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch (error) {
    return `${currency ?? 'USD'} ${Math.round(numeric)}`;
  }
}

export default function ClosedGigsSection({ orders, onReopen, updatingOrderId }) {
  const closedOrders = useMemo(
    () =>
      (orders ?? [])
        .filter((order) => order && ['completed', 'cancelled'].includes(order.status))
        .map((order) => ({
          id: order.id,
          serviceName: order.serviceName,
          vendorName: order.vendorName,
          status: order.status,
          dueAt: order.dueAt,
          amount: order.amount,
          currency: order.currency,
          progressPercent: order.progressPercent,
        })),
    [orders],
  );

  const completedCount = closedOrders.filter((order) => order.status === 'completed').length;
  const cancelledCount = closedOrders.filter((order) => order.status === 'cancelled').length;

  return (
    <section id="agency-closed-gigs" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Gig · Closed</p>
          <h2 className="text-3xl font-semibold text-slate-900">Closed gigs</h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="rounded-full bg-emerald-100 px-3 py-1 uppercase tracking-[0.2em] text-emerald-600">
            {completedCount}
          </span>
          <span className="rounded-full bg-rose-100 px-3 py-1 uppercase tracking-[0.2em] text-rose-600">
            {cancelledCount}
          </span>
        </div>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {closedOrders.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
            Nothing archived yet.
          </div>
        ) : (
          closedOrders.map((order) => (
            <div
              key={order.id}
              className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{order.serviceName}</p>
                    <p className="text-xs text-slate-500">{order.vendorName}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                    order.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {order.status === 'completed' ? 'Done' : 'Cancelled'}
                  </span>
                </div>
                <div className="mt-4 flex flex-col gap-2 text-xs text-slate-500">
                  <span>Closed {formatDate(order.dueAt)}</span>
                  <span>{formatCurrency(order.amount, order.currency)}</span>
                  <span>Progress {Math.round(order.progressPercent ?? 0)}%</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onReopen?.(order)}
                disabled={updatingOrderId === order.id}
                className="mt-5 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updatingOrderId === order.id ? 'Reopening…' : 'Reopen'}
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

ClosedGigsSection.propTypes = {
  orders: PropTypes.arrayOf(PropTypes.object),
  onReopen: PropTypes.func,
  updatingOrderId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

ClosedGigsSection.defaultProps = {
  orders: [],
  onReopen: undefined,
  updatingOrderId: null,
};
