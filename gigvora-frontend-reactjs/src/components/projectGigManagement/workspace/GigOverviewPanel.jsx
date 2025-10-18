import PropTypes from 'prop-types';
import { formatRelativeTime } from '../../../utils/date.js';

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${currency} ${value}`;
  }
}

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0%';
  }
  return `${Math.round(Number(value))}%`;
}

function formatStatus(value) {
  if (!value) return 'Unknown';
  return value
    .toString()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return new Intl.NumberFormat('en-GB').format(Number(value));
}

function OrderCard({ order, onSelect, onInspect, isActive }) {
  const vendor = order.vendor?.displayName ?? order.vendorName ?? 'Vendor';
  const service = order.gig?.title ?? order.serviceName ?? 'Service';
  const due = order.dueAt ?? order.gig?.dueAt;
  const currency = order.currency ?? order.orderCurrency ?? order.gig?.currency ?? 'USD';
  const amount = order.amount ?? order.gig?.amount ?? order.pricing?.total;
  const progress = order.progressPercent ?? order.tracking?.progressPercent;

  return (
    <button
      type="button"
      onClick={() => onSelect(order.id)}
      className={`group flex w-full flex-col gap-3 rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
        isActive ? 'border-accent bg-white shadow-soft' : 'border-slate-200 bg-white/80 hover:border-accent/60 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{service}</p>
          <p className="text-xs text-slate-500">{vendor}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
          {formatStatus(order.status)}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{formatCurrency(amount, currency)}</span>
        <span>{due ? `Due ${formatRelativeTime(due)}` : 'No due date'}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="h-1.5 w-full rounded-full bg-slate-200">
          <div
            className="h-1.5 rounded-full bg-accent transition-all"
            style={{ width: `${Math.min(100, Math.max(0, Number(progress ?? 0)))}%` }}
          />
        </div>
        <span className="ml-3 text-xs font-semibold text-slate-600">{formatPercent(progress)}</span>
      </div>
      <div className="flex justify-end">
        <span
          onClick={(event) => {
            event.stopPropagation();
            onInspect(order.id);
          }}
          className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
        >
          View
        </span>
      </div>
    </button>
  );
}

OrderCard.propTypes = {
  order: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,
  onInspect: PropTypes.func.isRequired,
  isActive: PropTypes.bool.isRequired,
};

export default function GigOverviewPanel({
  openOrders,
  closedOrders,
  submissions,
  selectedOrderId,
  onSelectOrder,
  onInspectOrder,
  stats,
}) {
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Open</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(stats.openCount)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Closed</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(stats.closedCount)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Escrow</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(stats.escrowTotal, stats.currency)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Submissions</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(submissions.length)}</p>
        </div>
      </div>

      <div className="grid flex-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5">
          <header className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Open</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {openOrders.length}
            </span>
          </header>
          <div className="grid gap-3">
            {openOrders.length ? (
              openOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onSelect={onSelectOrder}
                  onInspect={onInspectOrder}
                  isActive={selectedOrderId === order.id}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center text-sm text-slate-500">
                No open gigs right now.
              </div>
            )}
          </div>
        </section>
        <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5">
          <header className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Closed</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {closedOrders.length}
            </span>
          </header>
          <ul className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1 text-sm">
            {closedOrders.length ? (
              closedOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-900">{order.gig?.title ?? order.serviceName ?? 'Gig'}</p>
                    <p className="text-xs text-slate-500">Closed {formatRelativeTime(order.updatedAt ?? order.closedAt ?? order.createdAt)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onInspectOrder(order.id)}
                    className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
                  >
                    View
                  </button>
                </li>
              ))
            ) : (
              <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-center text-sm text-slate-500">
                No archived gigs yet.
              </li>
            )}
          </ul>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5">
        <header className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Submissions</h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {submissions.length}
          </span>
        </header>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {submissions.length ? (
            submissions.map((item) => (
              <article key={item.id ?? item.roundNumber} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm">
                <p className="font-semibold text-slate-900">Round {item.roundNumber ?? 1}</p>
                <p className="mt-1 text-xs text-slate-500">{formatStatus(item.status)}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {item.requestedAt ? `Asked ${formatRelativeTime(item.requestedAt)}` : 'Requested now'}
                </p>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-6 text-center text-sm text-slate-500">
              No submissions tracked.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

GigOverviewPanel.propTypes = {
  openOrders: PropTypes.arrayOf(PropTypes.object).isRequired,
  closedOrders: PropTypes.arrayOf(PropTypes.object).isRequired,
  submissions: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedOrderId: PropTypes.number,
  onSelectOrder: PropTypes.func.isRequired,
  onInspectOrder: PropTypes.func.isRequired,
  stats: PropTypes.shape({
    openCount: PropTypes.number,
    closedCount: PropTypes.number,
    escrowTotal: PropTypes.number,
    currency: PropTypes.string,
  }).isRequired,
};

GigOverviewPanel.defaultProps = {
  selectedOrderId: null,
};
