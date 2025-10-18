import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { PlusIcon } from '@heroicons/react/24/outline';

const STATUS_GROUPS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'due', label: 'Due' },
  { id: 'done', label: 'Done' },
];

function statusTone(status) {
  switch (status) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-600';
    case 'cancelled':
      return 'bg-rose-100 text-rose-600';
    case 'in_revision':
      return 'bg-amber-100 text-amber-600';
    case 'in_delivery':
      return 'bg-indigo-100 text-indigo-600';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

export default function GigOrdersPanel({ orders, reminders, stats, canManage, onCreate, onSelect }) {
  const [filter, setFilter] = useState('active');

  const filteredOrders = useMemo(() => {
    if (filter === 'all') {
      return orders;
    }
    if (filter === 'due') {
      const dueIds = new Set(reminders.filter((reminder) => reminder.overdue || reminder.type === 'delivery_due').map((item) => item.orderId));
      return orders.filter((order) => dueIds.has(order.id));
    }
    if (filter === 'done') {
      return orders.filter((order) => order.status === 'completed');
    }
    return orders.filter((order) => !['completed', 'cancelled'].includes(order.status));
  }, [filter, orders, reminders]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Orders</p>
          <p className="text-lg font-semibold text-slate-900">{filteredOrders.length} showing</p>
        </div>
        {canManage ? (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <PlusIcon className="h-4 w-4" />
            New
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_GROUPS.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => setFilter(group.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
              filter === group.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {group.label}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Order
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Vendor
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Progress
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Due
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white/60">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="cursor-pointer transition hover:bg-slate-50" onClick={() => onSelect(order)}>
                <td className="px-4 py-3 font-semibold text-slate-900">{order.orderNumber}</td>
                <td className="px-4 py-3 text-slate-600">{order.vendorName}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusTone(order.status)}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{Math.round(order.progressPercent ?? 0)}%</td>
                <td className="px-4 py-3 text-slate-600">{order.dueAt ? new Date(order.dueAt).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: order.currency ?? 'USD',
                    maximumFractionDigits: 0,
                  }).format(order.amount ?? 0)}
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                  No orders in this filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{stats.totalOrders}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{stats.active}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completed</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{stats.completed}</p>
        </div>
      </div>
    </section>
  );
}

GigOrdersPanel.propTypes = {
  orders: PropTypes.arrayOf(PropTypes.object).isRequired,
  reminders: PropTypes.arrayOf(PropTypes.object),
  stats: PropTypes.shape({
    totalOrders: PropTypes.number,
    active: PropTypes.number,
    completed: PropTypes.number,
  }).isRequired,
  canManage: PropTypes.bool,
  onCreate: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
};

GigOrdersPanel.defaultProps = {
  reminders: [],
  canManage: true,
};
