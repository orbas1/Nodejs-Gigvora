import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { BanknotesIcon, ClipboardDocumentCheckIcon, CurrencyPoundIcon, TrashIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const ORDER_STATUSES = ['Paid', 'Pending payment', 'Refunded', 'Cancelled'];
const FULFILLMENT_STATUSES = ['In progress', 'Awaiting payment', 'Completed', 'On hold'];

const DEFAULT_ORDER = {
  reference: '',
  mentee: '',
  package: '',
  amount: '',
  currency: '£',
  status: 'Pending payment',
  channel: 'Explorer',
  orderedAt: '',
  fulfillmentStatus: 'In progress',
  notes: '',
  invoiceId: '',
};

const ACCENT_CLASSNAMES = {
  blue: {
    container: 'border-blue-100 bg-blue-50/70',
    icon: 'bg-blue-100 text-blue-700',
  },
  amber: {
    container: 'border-amber-100 bg-amber-50/70',
    icon: 'bg-amber-100 text-amber-700',
  },
  emerald: {
    container: 'border-emerald-100 bg-emerald-50/70',
    icon: 'bg-emerald-100 text-emerald-700',
  },
  violet: {
    container: 'border-violet-100 bg-violet-50/70',
    icon: 'bg-violet-100 text-violet-700',
  },
};

const STATUS_BADGE_STYLES = {
  Paid: 'bg-emerald-50 text-emerald-600',
  Refunded: 'bg-slate-100 text-slate-600',
  Cancelled: 'bg-rose-50 text-rose-600',
  'Pending payment': 'bg-amber-50 text-amber-600',
};

const FULFILMENT_BADGE_STYLES = {
  Completed: 'bg-emerald-50 text-emerald-600',
  'In progress': 'bg-blue-50 text-blue-600',
  'Awaiting payment': 'bg-amber-50 text-amber-600',
  'On hold': 'bg-rose-50 text-rose-600',
};

function formatForDateTimeInput(value) {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const offset = date.getTimezoneOffset() * 60 * 1000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  } catch (error) {
    console.warn('Unable to format date for input', error);
    return '';
  }
}

function normaliseDateTime(value) {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
  } catch (error) {
    console.warn('Unable to normalise date value', error);
    return null;
  }
}

function SummaryCard({ label, value, icon: Icon, accent }) {
  const classes = ACCENT_CLASSNAMES[accent] ?? ACCENT_CLASSNAMES.blue;
  return (
    <div className={`rounded-3xl border ${classes.container} p-5 shadow-sm`}>
      <div className="flex items-center gap-4">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${classes.icon}`}>
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-xl font-semibold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

SummaryCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType.isRequired,
  accent: PropTypes.string.isRequired,
};

export default function MentorOrdersSection({ orders, summary, saving, onCreateOrder, onUpdateOrder, onDeleteOrder }) {
  const [formState, setFormState] = useState(DEFAULT_ORDER);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');

  const list = orders ?? [];

  useEffect(() => {
    if (!editingOrderId) {
      return;
    }
    const activeOrder = list.find((order) => order.id === editingOrderId);
    if (!activeOrder) {
      setEditingOrderId(null);
      setFormState(DEFAULT_ORDER);
      return;
    }
    setFormState({
      ...DEFAULT_ORDER,
      ...activeOrder,
      orderedAt: formatForDateTimeInput(activeOrder.orderedAt),
    });
  }, [editingOrderId, list]);

  const formattedSummary = useMemo(() => {
    const total = summary?.revenue ?? list.reduce((acc, order) => acc + Number(order.amount ?? 0), 0);
    return {
      totalOrders: summary?.totalOrders ?? list.length,
      openOrders: summary?.openOrders ?? list.filter((order) => order.status !== 'Paid').length,
      revenue: total,
      avgOrderValue:
        summary?.avgOrderValue ?? (list.length ? Math.round((total / list.length) * 100) / 100 : 0),
    };
  }, [summary, list]);

  const handleReset = () => {
    setFormState(DEFAULT_ORDER);
    setEditingOrderId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    const payload = {
      ...formState,
      amount: formState.amount === '' ? null : Number(formState.amount),
      orderedAt: normaliseDateTime(formState.orderedAt),
    };
    try {
      if (editingOrderId) {
        await onUpdateOrder?.(editingOrderId, payload);
      } else {
        await onCreateOrder?.(payload);
      }
      setFeedback({ type: 'success', message: 'Order saved successfully.' });
      handleReset();
    } catch (error) {
      setFeedback({ type: 'error', message: error.message ?? 'Unable to save order.' });
    }
  };

  const handleEdit = (order) => {
    setEditingOrderId(order.id);
    setFormState({
      ...DEFAULT_ORDER,
      ...order,
      orderedAt: formatForDateTimeInput(order.orderedAt),
    });
  };

  const handleDelete = async (orderId) => {
    setFeedback(null);
    try {
      await onDeleteOrder?.(orderId);
      setFeedback({ type: 'success', message: 'Order removed.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message ?? 'Unable to delete order.' });
    }
  };

  const channelOptions = useMemo(() => {
    const channels = new Set(list.map((order) => order.channel).filter(Boolean));
    return Array.from(channels);
  }, [list]);

  const filteredOrders = useMemo(() => {
    return list
      .filter((order) => (statusFilter === 'all' ? true : order.status === statusFilter))
      .filter((order) => (channelFilter === 'all' ? true : order.channel === channelFilter))
      .filter((order) => {
        if (!orderSearch) return true;
        const haystack = `${order.reference ?? ''} ${order.mentee ?? ''} ${order.package ?? ''}`.toLowerCase();
        return haystack.includes(orderSearch.toLowerCase());
      })
      .sort((a, b) => {
        const aDate = a.orderedAt ? new Date(a.orderedAt).getTime() : 0;
        const bDate = b.orderedAt ? new Date(b.orderedAt).getTime() : 0;
        return bDate - aDate;
      });
  }, [channelFilter, list, orderSearch, statusFilter]);

  return (
    <section className="space-y-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Orders</p>
          <h2 className="text-2xl font-semibold text-slate-900">Track mentorship purchases and fulfilment</h2>
          <p className="text-sm text-slate-600">
            Manage orders across Explorer, referrals, and manual bookings. Sync invoices, payments, and fulfilment statuses in one place.
          </p>
        </div>
      </header>

      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-4">
        <SummaryCard label="Total orders" value={formattedSummary.totalOrders} icon={ClipboardDocumentCheckIcon} accent="blue" />
        <SummaryCard label="Open orders" value={formattedSummary.openOrders} icon={BanknotesIcon} accent="amber" />
        <SummaryCard label="Revenue" value={`£${formattedSummary.revenue.toLocaleString?.() ?? formattedSummary.revenue}`} icon={CurrencyPoundIcon} accent="emerald" />
        <SummaryCard label="Avg order" value={`£${formattedSummary.avgOrderValue}`} icon={CurrencyPoundIcon} accent="violet" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {editingOrderId ? 'Update order' : 'Log order'}
          </h3>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Reference
            <input
              type="text"
              required
              value={formState.reference}
              onChange={(event) => setFormState((current) => ({ ...current, reference: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Mentee
              <input
                type="text"
                required
                value={formState.mentee}
                onChange={(event) => setFormState((current) => ({ ...current, mentee: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Package
              <input
                type="text"
                value={formState.package}
                onChange={(event) => setFormState((current) => ({ ...current, package: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Amount
              <input
                type="number"
                required
                value={formState.amount}
                onChange={(event) => setFormState((current) => ({ ...current, amount: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Currency
              <input
                type="text"
                value={formState.currency}
                onChange={(event) => setFormState((current) => ({ ...current, currency: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Status
              <select
                value={formState.status}
                onChange={(event) => setFormState((current) => ({ ...current, status: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Fulfilment status
              <select
                value={formState.fulfillmentStatus}
                onChange={(event) => setFormState((current) => ({ ...current, fulfillmentStatus: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {FULFILLMENT_STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Channel
              <input
                type="text"
                value={formState.channel}
                onChange={(event) => setFormState((current) => ({ ...current, channel: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Ordered at
              <input
                type="datetime-local"
                value={formState.orderedAt}
                onChange={(event) => setFormState((current) => ({ ...current, orderedAt: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Invoice reference
            <input
              type="text"
              value={formState.invoiceId}
              onChange={(event) => setFormState((current) => ({ ...current, invoiceId: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Notes
            <textarea
              rows={3}
              value={formState.notes}
              onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Saving…' : editingOrderId ? 'Update order' : 'Create order'}
            </button>
            <button type="button" onClick={handleReset} className="text-xs font-semibold text-slate-500 hover:text-accent">
              Reset
            </button>
          </div>
        </form>
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2">
                Status
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-full border border-slate-200 px-3 py-1 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                >
                  <option value="all">All</option>
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2">
                Channel
                <select
                  value={channelFilter}
                  onChange={(event) => setChannelFilter(event.target.value)}
                  className="rounded-full border border-slate-200 px-3 py-1 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                >
                  <option value="all">All</option>
                  {channelOptions.map((channel) => (
                    <option key={channel} value={channel}>
                      {channel}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <input
              type="search"
              value={orderSearch}
              onChange={(event) => setOrderSearch(event.target.value)}
              placeholder="Search orders"
              className="rounded-full border border-slate-200 px-3 py-1 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Mentee</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Fulfilment</th>
                  <th className="px-5 py-3">Channel</th>
                  <th className="px-5 py-3">Ordered</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-6 text-center text-sm text-slate-500">
                      {list.length ? 'No orders match the filters above.' : 'No orders logged yet. Sync Explorer checkout or log manual bookings here.'}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900">{order.reference}</p>
                          <p className="text-xs text-slate-500">{order.package ?? 'Package not set'}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{order.mentee}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                        {order.currency}
                        {order.amount}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_STYLES[order.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${FULFILMENT_BADGE_STYLES[order.fulfillmentStatus] ?? 'bg-slate-100 text-slate-600'}`}>
                          {order.fulfillmentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">{order.channel ?? '—'}</td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {order.orderedAt ? format(new Date(order.orderedAt), 'dd MMM yyyy HH:mm') : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                          <button type="button" onClick={() => handleEdit(order)} className="text-slate-500 hover:text-accent">
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(order.id)}
                            className="inline-flex items-center gap-1 text-rose-500 hover:text-rose-600"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

MentorOrdersSection.propTypes = {
  orders: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      reference: PropTypes.string,
      mentee: PropTypes.string,
      package: PropTypes.string,
      amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      currency: PropTypes.string,
      status: PropTypes.string,
      channel: PropTypes.string,
      orderedAt: PropTypes.string,
      fulfillmentStatus: PropTypes.string,
      notes: PropTypes.string,
      invoiceId: PropTypes.string,
    }),
  ),
  summary: PropTypes.shape({
    totalOrders: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    openOrders: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    revenue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    avgOrderValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  saving: PropTypes.bool,
  onCreateOrder: PropTypes.func,
  onUpdateOrder: PropTypes.func,
  onDeleteOrder: PropTypes.func,
};

MentorOrdersSection.defaultProps = {
  orders: [],
  summary: undefined,
  saving: false,
  onCreateOrder: undefined,
  onUpdateOrder: undefined,
  onDeleteOrder: undefined,
};
