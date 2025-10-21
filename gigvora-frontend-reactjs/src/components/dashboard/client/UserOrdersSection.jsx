import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import DataStatus from '../../DataStatus.jsx';
import useProjectGigManagement from '../../../hooks/useProjectGigManagement.js';

function formatCurrency(value, currency = 'USD') {
  if (value == null) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(Number(value));
  } catch (error) {
    return `${currency} ${Number(value).toFixed(0)}`;
  }
}

function formatRelative(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

function humaniseOrderStatus(value) {
  return value ? value.replace(/_/g, ' ') : 'Pending';
}

function getOrderTitle(order) {
  if (!order) {
    return 'Order';
  }
  return order.title ?? `Order #${order.id}`;
}

const TIMELINE_PAGE_SIZE = 10;
const MESSAGE_PAGE_SIZE = 10;

function toTimestamp(value) {
  if (!value) {
    return 0;
  }
  const date = new Date(value);
  const timestamp = date.getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export default function UserOrdersSection({ userId, initialWorkspace }) {
  const { data, loading, error, actions, reload } = useProjectGigManagement(userId, {
    initialData: initialWorkspace,
  });
  const [timelineForm, setTimelineForm] = useState({ orderId: null, title: '', notes: '' });
  const [timelineBusy, setTimelineBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const [createOrderForm, setCreateOrderForm] = useState({
    vendorName: '',
    serviceName: '',
    amount: '',
    currency: 'USD',
    kickoffAt: '',
    dueAt: '',
    orderNumber: '',
    requirementTitle: '',
    requirementDue: '',
    requirementNotes: '',
  });
  const [createOrderBusy, setCreateOrderBusy] = useState(false);
  const [createOrderFeedback, setCreateOrderFeedback] = useState('');
  const [createOrderError, setCreateOrderError] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('all');
  const [timelineLimit, setTimelineLimit] = useState(TIMELINE_PAGE_SIZE);
  const [messageLimit, setMessageLimit] = useState(MESSAGE_PAGE_SIZE);
  const [messageForm, setMessageForm] = useState({ orderId: '', body: '', internal: false });
  const [messageBusy, setMessageBusy] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState('');
  const [messageError, setMessageError] = useState('');
  const [submissionForm, setSubmissionForm] = useState({ orderId: '', title: '', url: '', notes: '', deliveredAt: '' });
  const [submissionBusy, setSubmissionBusy] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState('');
  const [submissionError, setSubmissionError] = useState('');

  const orders = useMemo(() => {
    const allOrders = data?.purchasedGigs?.orders ?? [];
    const open = allOrders.filter((order) => ['requirements', 'in_delivery', 'in_revision'].includes(order.status));
    const closed = allOrders.filter((order) => !['requirements', 'in_delivery', 'in_revision'].includes(order.status));
    return { all: allOrders, open, closed };
  }, [data?.purchasedGigs?.orders]);

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId || selectedOrderId === 'all') {
      return null;
    }
    return orders.all.find((order) => `${order.id}` === `${selectedOrderId}`) ?? null;
  }, [orders.all, selectedOrderId]);

  const orderTimeline = useMemo(() => (selectedOrder ? selectedOrder.timeline ?? [] : []), [selectedOrder]);
  const orderMessages = useMemo(() => (selectedOrder ? selectedOrder.messages ?? [] : []), [selectedOrder]);

  const aggregatedTimeline = useMemo(() => {
    return orders.all
      .flatMap((order) => {
        if (!Array.isArray(order.timeline)) {
          return [];
        }
        return order.timeline.map((event) => {
          const timestampSource =
            event.createdAt ?? event.loggedAt ?? event.timestamp ?? event.updatedAt ?? event.happenedAt ?? null;
          return {
            ...event,
            sourceOrderId: order.id,
            sourceOrderTitle: getOrderTitle(order),
            sourceOrderStatus: order.status,
            eventTimestamp: toTimestamp(timestampSource),
          };
        });
      })
      .sort((a, b) => b.eventTimestamp - a.eventTimestamp);
  }, [orders.all]);

  const aggregatedMessages = useMemo(() => {
    return orders.all
      .flatMap((order) => {
        if (!Array.isArray(order.messages)) {
          return [];
        }
        return order.messages.map((message) => {
          const timestampSource =
            message.createdAt ?? message.sentAt ?? message.loggedAt ?? message.timestamp ?? message.updatedAt ?? null;
          return {
            ...message,
            sourceOrderId: order.id,
            sourceOrderTitle: getOrderTitle(order),
            sourceOrderStatus: order.status,
            eventTimestamp: toTimestamp(timestampSource),
          };
        });
      })
      .sort((a, b) => b.eventTimestamp - a.eventTimestamp);
  }, [orders.all]);

  const timelineEntries = useMemo(
    () => (selectedOrder ? orderTimeline : aggregatedTimeline),
    [aggregatedTimeline, orderTimeline, selectedOrder],
  );

  const messageEntries = useMemo(
    () => (selectedOrder ? orderMessages : aggregatedMessages),
    [aggregatedMessages, orderMessages, selectedOrder],
  );

  const visibleTimeline = useMemo(
    () => timelineEntries.slice(0, timelineLimit),
    [timelineEntries, timelineLimit],
  );

  const visibleMessages = useMemo(
    () => messageEntries.slice(0, messageLimit),
    [messageEntries, messageLimit],
  );

  const timelineHasMore = timelineEntries.length > timelineLimit;
  const timelineCanReset = timelineLimit > TIMELINE_PAGE_SIZE;
  const messageHasMore = messageEntries.length > messageLimit;
  const messageCanReset = messageLimit > MESSAGE_PAGE_SIZE;

  const stats = useMemo(() => {
    const summary = data?.purchasedGigs?.stats ?? {};
    return {
      totalOrders: summary.totalOrders ?? orders.all.length,
      openOrders: summary.active ?? orders.open.length,
      awaitingReview: summary.awaitingReview ?? 0,
      valueInPlay: summary.escrowInFlight ?? summary.openGigValue ?? 0,
      satisfaction: summary.satisfactionScore ?? null,
      currency: summary.currency ?? 'USD',
    };
  }, [data?.purchasedGigs?.stats, orders]);

  useEffect(() => {
    setCreateOrderForm((previous) => ({
      ...previous,
      currency: previous.currency || stats.currency || 'USD',
    }));
  }, [stats.currency]);

  useEffect(() => {
    const fallbackOrder = orders.open[0] ?? orders.all[0] ?? null;
    const fallbackId = fallbackOrder ? fallbackOrder.id : null;

    if (selectedOrderId && selectedOrderId !== 'all' && !selectedOrder) {
      setSelectedOrderId('all');
      return;
    }

    if (!selectedOrderId && fallbackId != null) {
      setSelectedOrderId(`${fallbackId}`);
      return;
    }

    if (selectedOrder) {
      setMessageForm((previous) => ({
        ...previous,
        orderId: previous.orderId || selectedOrder.id,
      }));
      setSubmissionForm((previous) => ({
        ...previous,
        orderId: previous.orderId || selectedOrder.id,
      }));
      setTimelineForm((previous) => ({
        ...previous,
        orderId: previous.orderId || selectedOrder.id,
      }));
    } else {
      const aggregateDefault = orders.all.length === 1 && fallbackId != null ? fallbackId : '';
      setMessageForm((previous) => ({ ...previous, orderId: aggregateDefault }));
      setSubmissionForm((previous) => ({ ...previous, orderId: aggregateDefault }));
      setTimelineForm((previous) => ({ ...previous, orderId: aggregateDefault }));
    }
  }, [orders.all, orders.open, selectedOrder, selectedOrderId]);

  useEffect(() => {
    setTimelineLimit(TIMELINE_PAGE_SIZE);
    setMessageLimit(MESSAGE_PAGE_SIZE);
  }, [selectedOrderId, orders.all.length]);

  const handleUpdateStatus = useCallback(
    async (orderId, status) => {
      if (!orderId || !status) {
        return;
      }
      setFeedback('');
      setErrorMessage('');
      try {
        await actions.updateGigOrder(orderId, { status });
        setFeedback(`Order #${orderId} moved to ${status.replace(/_/g, ' ')}.`);
      } catch (err) {
        setErrorMessage(err?.message ?? 'Unable to update order status.');
      }
    },
    [actions],
  );

  const handleTimelineSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!timelineForm.orderId || !timelineForm.title) {
        setErrorMessage('Choose an order and add a title.');
        return;
      }
      setTimelineBusy(true);
      setFeedback('');
      setErrorMessage('');
      try {
        await actions.addTimelineEvent(timelineForm.orderId, {
          title: timelineForm.title,
          notes: timelineForm.notes,
          eventType: 'note',
        });
        setTimelineForm({ orderId: null, title: '', notes: '' });
        setFeedback('Timeline note captured.');
        setLastUpdated(new Date());
      } catch (err) {
        setErrorMessage(err?.message ?? 'Unable to log timeline event.');
      } finally {
        setTimelineBusy(false);
      }
    },
    [actions, timelineForm],
  );

  const handleCreateOrderChange = useCallback((event) => {
    const { name, value } = event.target;
    setCreateOrderForm((previous) => ({ ...previous, [name]: value }));
  }, []);

  const handleCreateOrderSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!createOrderForm.vendorName || !createOrderForm.serviceName) {
        setCreateOrderError('Vendor name and service name are required.');
        return;
      }
      setCreateOrderBusy(true);
      setCreateOrderFeedback('');
      setCreateOrderError('');
      try {
        const payload = {
          vendorName: createOrderForm.vendorName.trim(),
          serviceName: createOrderForm.serviceName.trim(),
          amount: createOrderForm.amount ? Number(createOrderForm.amount) : 0,
          currency: createOrderForm.currency || stats.currency || 'USD',
          kickoffAt: createOrderForm.kickoffAt || undefined,
          dueAt: createOrderForm.dueAt || undefined,
          orderNumber: createOrderForm.orderNumber || undefined,
        };
        if (createOrderForm.requirementTitle) {
          payload.requirements = [
            {
              title: createOrderForm.requirementTitle,
              dueAt: createOrderForm.requirementDue || undefined,
              notes: createOrderForm.requirementNotes || undefined,
            },
          ];
        }
        await actions.createGigOrder(payload);
        setCreateOrderFeedback('Order created and routed to your gig workspace.');
        setCreateOrderForm({
          vendorName: '',
          serviceName: '',
          amount: '',
          currency: payload.currency,
          kickoffAt: '',
          dueAt: '',
          orderNumber: '',
          requirementTitle: '',
          requirementDue: '',
          requirementNotes: '',
        });
      } catch (err) {
        setCreateOrderError(err?.message ?? 'Unable to create order.');
      } finally {
        setCreateOrderBusy(false);
      }
    },
    [actions, createOrderForm, stats.currency],
  );

  const handleMessageChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    const resolvedValue = type === 'checkbox' ? checked : value;
    setMessageForm((previous) => ({ ...previous, [name]: resolvedValue }));
    if (name === 'orderId') {
      setSelectedOrderId(value);
    }
  }, []);

  const handleMessageSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const orderId = messageForm.orderId ? Number(messageForm.orderId) || messageForm.orderId : null;
      if (!orderId || !messageForm.body.trim()) {
        setMessageError('Select an order and add message content.');
        return;
      }
      setMessageBusy(true);
      setMessageFeedback('');
      setMessageError('');
      try {
        await actions.postGigMessage(orderId, {
          body: messageForm.body.trim(),
          internal: Boolean(messageForm.internal),
        });
        setMessageForm((previous) => ({ ...previous, body: '' }));
        setMessageFeedback('Message dispatched to the vendor workspace.');
        setLastUpdated(new Date());
      } catch (err) {
        setMessageError(err?.message ?? 'Unable to send message.');
      } finally {
        setMessageBusy(false);
      }
    },
    [actions, messageForm],
  );

  const handleSubmissionChange = useCallback((event) => {
    const { name, value } = event.target;
    setSubmissionForm((previous) => ({ ...previous, [name]: value }));
    if (name === 'orderId') {
      setSelectedOrderId(value);
    }
  }, []);

  const handleSubmissionSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const orderId = submissionForm.orderId ? Number(submissionForm.orderId) || submissionForm.orderId : null;
      if (!orderId || !submissionForm.title.trim()) {
        setSubmissionError('Provide an order and deliverable title.');
        return;
      }
      setSubmissionBusy(true);
      setSubmissionFeedback('');
      setSubmissionError('');
      try {
        const payload = {
          title: submissionForm.title.trim(),
          url: submissionForm.url.trim() || undefined,
          notes: submissionForm.notes.trim() || undefined,
          deliveredAt: submissionForm.deliveredAt || undefined,
        };
        await actions.createGigSubmission(orderId, payload);
        setSubmissionFeedback('Deliverable logged for the order timeline.');
        setSubmissionForm((previous) => ({
          ...previous,
          title: '',
          url: '',
          notes: '',
          deliveredAt: '',
        }));
        setLastUpdated(new Date());
      } catch (err) {
        setSubmissionError(err?.message ?? 'Unable to record deliverable.');
      } finally {
        setSubmissionBusy(false);
      }
    },
    [actions, submissionForm],
  );

  return (
    <section
      id="user-orders"
      className="space-y-8 rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white p-6 shadow-sm"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Orders</p>
          <h2 className="text-3xl font-semibold text-slate-900">Gig delivery and fulfilment control</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Review live orders, progress status changes, and capture delivery notes with the same controls your vendor managers
            use every day.
          </p>
        </div>
        <button
          type="button"
          onClick={() => reload()}
          className="rounded-2xl border border-blue-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh workspace'}
        </button>
      </div>

      <DataStatus
        loading={loading}
        error={error}
        lastUpdated={data?.purchasedGigs?.updatedAt ?? data?.purchasedGigs?.snapshotAt ?? lastUpdated}
        fromCache={false}
        statusLabel="Gig order workspace"
        onRefresh={reload}
      />

      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total orders</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.totalOrders}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Open orders</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.openOrders}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Awaiting review</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.awaitingReview}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Value in play</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(stats.valueInPlay, stats.currency)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Satisfaction</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {stats.satisfaction != null ? Number(stats.satisfaction).toFixed(1) : '—'}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-slate-900">Open orders</h3>
          <p className="text-sm text-slate-500">Advance status or capture context with one click.</p>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {orders.open.length ? (
            orders.open.map((order) => (
              <div key={order.id} className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{order.title ?? `Order #${order.id}`}</p>
                      <p className="text-xs text-slate-500">Vendor: {order.vendorName ?? 'Assigned via marketplace'}</p>
                    </div>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
                      {humaniseOrderStatus(order.status)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Value: {formatCurrency(order.totalValue, order.currency || stats.currency)}</p>
                  <p className="text-xs text-slate-500">Updated: {formatRelative(order.updatedAt)}</p>
                  {order.nextMilestone ? (
                    <p className="text-xs text-slate-500">Next milestone: {order.nextMilestone.title}</p>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(order.id, 'in_delivery')}
                    className="rounded-2xl border border-blue-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
                  >
                    Start delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(order.id, 'in_revision')}
                    className="rounded-2xl border border-amber-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-amber-600 transition hover:border-amber-300 hover:text-amber-700"
                  >
                    Request revision
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(order.id, 'completed')}
                    className="rounded-2xl border border-emerald-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-600 transition hover:border-emerald-300 hover:text-emerald-700"
                  >
                    Approve delivery
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-3xl border border-dashed border-slate-200 p-10 text-sm text-slate-500">
              All deliveries are complete. New orders will appear here the moment they go live.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <form onSubmit={handleCreateOrderSubmit} className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Raise a new order</h3>
            <p className="text-sm text-slate-500">Spin up delivery in minutes — gig managers receive the same structured briefing the vendor network expects.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Vendor</span>
              <input
                type="text"
                name="vendorName"
                value={createOrderForm.vendorName}
                onChange={handleCreateOrderChange}
                required
                placeholder="Atlas Creative Studio"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Service name</span>
              <input
                type="text"
                name="serviceName"
                value={createOrderForm.serviceName}
                onChange={handleCreateOrderChange}
                required
                placeholder="Growth launch blueprint"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Amount</span>
              <input
                type="number"
                name="amount"
                value={createOrderForm.amount}
                onChange={handleCreateOrderChange}
                min="0"
                step="0.01"
                placeholder="2500"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Currency</span>
              <input
                type="text"
                name="currency"
                value={createOrderForm.currency}
                onChange={handleCreateOrderChange}
                placeholder={stats.currency}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Kickoff date</span>
              <input
                type="date"
                name="kickoffAt"
                value={createOrderForm.kickoffAt}
                onChange={handleCreateOrderChange}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Due date</span>
              <input
                type="date"
                name="dueAt"
                value={createOrderForm.dueAt}
                onChange={handleCreateOrderChange}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Order reference</span>
              <input
                type="text"
                name="orderNumber"
                value={createOrderForm.orderNumber}
                onChange={handleCreateOrderChange}
                placeholder="ORD-2024-0098"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Kickoff requirement</span>
              <input
                type="text"
                name="requirementTitle"
                value={createOrderForm.requirementTitle}
                onChange={handleCreateOrderChange}
                placeholder="Submit discovery questionnaire"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Requirement due</span>
              <input
                type="date"
                name="requirementDue"
                value={createOrderForm.requirementDue}
                onChange={handleCreateOrderChange}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Requirement notes</span>
              <textarea
                name="requirementNotes"
                value={createOrderForm.requirementNotes}
                onChange={handleCreateOrderChange}
                rows={2}
                placeholder="Access provided via secure vault."
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
          </div>
          {createOrderBusy ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Creating order…</p>
          ) : null}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createOrderBusy}
              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              Raise order
            </button>
          </div>
          {createOrderFeedback ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{createOrderFeedback}</div>
          ) : null}
          {createOrderError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{createOrderError}</div>
          ) : null}
        </form>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-slate-900">Closed orders</h3>
          <p className="text-sm text-slate-500">Recently completed engagements with satisfaction outcomes and close dates.</p>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {orders.closed.length ? (
            orders.closed.slice(0, 6).map((order) => (
              <div key={order.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">{order.title ?? `Order #${order.id}`}</p>
                <p className="mt-1 text-xs text-slate-500">Closed {formatRelative(order.completedAt ?? order.updatedAt)}</p>
                <p className="mt-1 text-xs text-slate-500">Final value {formatCurrency(order.totalValue, order.currency || stats.currency)}</p>
                <p className="mt-1 text-xs text-slate-500">Rating {order.satisfactionScore != null ? order.satisfactionScore : '—'}</p>
              </div>
            ))
          ) : (
            <p className="rounded-3xl border border-dashed border-slate-200 p-10 text-sm text-slate-500">No closed orders yet.</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-5 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Order journal</h3>
              <p className="text-sm text-slate-500">
                Timeline events and conversation history for your selected fulfilment or an aggregated feed across all orders.
              </p>
            </div>
            <label className="flex flex-col gap-2 text-xs text-slate-600 sm:w-64">
              <span className="font-semibold uppercase tracking-wide text-slate-500">Order reference</span>
              <select
                value={selectedOrderId}
                onChange={(event) => setSelectedOrderId(event.target.value || 'all')}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All orders</option>
                {orders.all.map((order) => (
                  <option key={order.id} value={`${order.id}`}>
                    {order.title ?? `Order #${order.id}`} – {humaniseOrderStatus(order.status)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timeline</p>
            {visibleTimeline.length ? (
              <>
                <ul className="space-y-3">
                  {visibleTimeline.map((event, index) => {
                    const key =
                      event.id ??
                      `${event.sourceOrderId ?? selectedOrder?.id ?? 'order'}-${
                        event.createdAt ?? event.loggedAt ?? event.timestamp ?? index
                      }`;
                    const timestamp =
                      event.createdAt ?? event.loggedAt ?? event.timestamp ?? event.updatedAt ?? event.eventTimestamp;
                    return (
                      <li
                        key={key}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold text-slate-900">
                              {event.title ?? event.eventType ?? 'Timeline event'}
                            </span>
                            <span className="text-xs text-slate-400">{formatRelative(timestamp)}</span>
                          </div>
                          {!selectedOrder ? (
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                              {event.sourceOrderTitle} • {humaniseOrderStatus(event.sourceOrderStatus)}
                            </span>
                          ) : null}
                        </div>
                        {event.notes ? <p className="mt-1 text-xs text-slate-500">{event.notes}</p> : null}
                      </li>
                    );
                  })}
                </ul>
                {timelineHasMore || timelineCanReset ? (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {timelineCanReset ? (
                      <button
                        type="button"
                        onClick={() => setTimelineLimit(TIMELINE_PAGE_SIZE)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                      >
                        Show latest updates
                      </button>
                    ) : null}
                    {timelineHasMore ? (
                      <button
                        type="button"
                        onClick={() => setTimelineLimit((previous) => previous + TIMELINE_PAGE_SIZE)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                      >
                        Load more updates
                      </button>
                    ) : null}
                  </div>
                ) : null}
                {!selectedOrder && timelineEntries.length ? (
                  <p className="text-[11px] text-slate-400">
                    Showing {visibleTimeline.length} of {timelineEntries.length} updates across all orders.
                  </p>
                ) : null}
              </>
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-500">
                Timeline notes will appear here once logged. Capture your first update using the form on the right.
              </p>
            )}
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Messages</p>
            {visibleMessages.length ? (
              <>
                <ul className="space-y-3">
                  {visibleMessages.map((message, index) => {
                    const key =
                      message.id ??
                      `${message.sourceOrderId ?? selectedOrder?.id ?? 'order'}-${
                        message.createdAt ?? message.timestamp ?? index
                      }`;
                    const timestamp =
                      message.createdAt ??
                      message.sentAt ??
                      message.loggedAt ??
                      message.timestamp ??
                      message.eventTimestamp;
                    return (
                      <li
                        key={key}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold text-slate-900">{message.author?.name ?? 'System'}</span>
                            <span className="text-xs text-slate-400">{formatRelative(timestamp)}</span>
                          </div>
                          {!selectedOrder ? (
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                              {message.sourceOrderTitle} • {humaniseOrderStatus(message.sourceOrderStatus)}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{message.body ?? message.text ?? '—'}</p>
                      </li>
                    );
                  })}
                </ul>
                {messageHasMore || messageCanReset ? (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {messageCanReset ? (
                      <button
                        type="button"
                        onClick={() => setMessageLimit(MESSAGE_PAGE_SIZE)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                      >
                        Show latest messages
                      </button>
                    ) : null}
                    {messageHasMore ? (
                      <button
                        type="button"
                        onClick={() => setMessageLimit((previous) => previous + MESSAGE_PAGE_SIZE)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                      >
                        Load more messages
                      </button>
                    ) : null}
                  </div>
                ) : null}
                {!selectedOrder && messageEntries.length ? (
                  <p className="text-[11px] text-slate-400">
                    Showing {visibleMessages.length} of {messageEntries.length} messages across all orders.
                  </p>
                ) : null}
              </>
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-500">
                No messages yet. Send a vendor update or internal note from the collaboration form.
              </p>
            )}
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <form onSubmit={handleTimelineSubmit} className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Log timeline note</h3>
                <p className="text-sm text-slate-500">Capture delivery context or client feedback — shared across vendor and finance teams.</p>
              </div>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700">Order</span>
                <select
                  value={
                    timelineForm.orderId === null || timelineForm.orderId === ''
                      ? selectedOrder?.id ?? ''
                      : timelineForm.orderId
                  }
                  onChange={(event) => {
                    const nextValue = Number(event.target.value) || event.target.value || null;
                    setTimelineForm((previous) => ({ ...previous, orderId: nextValue }));
                    if (nextValue) {
                      setSelectedOrderId(event.target.value);
                    }
                  }}
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                >
                  <option value="">Select order</option>
                  {orders.all.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.title ?? `Order #${order.id}`} – {humaniseOrderStatus(order.status)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700">Title</span>
                <input
                  type="text"
                  value={timelineForm.title}
                  onChange={(event) => setTimelineForm((previous) => ({ ...previous, title: event.target.value }))}
                  required
                  placeholder="Client approved milestone two"
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700">Notes</span>
                <textarea
                  value={timelineForm.notes}
                  onChange={(event) => setTimelineForm((previous) => ({ ...previous, notes: event.target.value }))}
                  rows={3}
                  placeholder="Summarise client feedback, scope changes, or next steps."
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </label>
              {timelineBusy ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Saving note…</p>
              ) : null}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={timelineBusy}
                >
                  Log timeline update
                </button>
              </div>
            </form>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <form onSubmit={handleMessageSubmit} className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Send workspace message</h3>
                <p className="text-sm text-slate-500">Nudge vendors or leave an internal note for programme managers.</p>
              </div>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700">Order</span>
                <select
                  name="orderId"
                  value={messageForm.orderId}
                  onChange={handleMessageChange}
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                >
                  <option value="">Select order</option>
                  {orders.all.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.title ?? `Order #${order.id}`}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700">Message</span>
                <textarea
                  name="body"
                  value={messageForm.body}
                  onChange={handleMessageChange}
                  rows={3}
                  placeholder="Share delivery blockers or confirm submission receipt."
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </label>
              <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  name="internal"
                  checked={messageForm.internal}
                  onChange={handleMessageChange}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Internal note (visible only to Gigvora and client teams)
              </label>
              {messageBusy ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Sending message…</p>
              ) : null}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={messageBusy}
                  className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  Send update
                </button>
              </div>
              {messageFeedback ? (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-700">{messageFeedback}</p>
              ) : null}
              {messageError ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">{messageError}</p>
              ) : null}
            </form>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <form onSubmit={handleSubmissionSubmit} className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Log deliverable</h3>
                <p className="text-sm text-slate-500">Track upload links and notes when a vendor submits work.</p>
              </div>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700">Order</span>
                <select
                  name="orderId"
                  value={submissionForm.orderId}
                  onChange={handleSubmissionChange}
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                >
                  <option value="">Select order</option>
                  {orders.all.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.title ?? `Order #${order.id}`}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700">Deliverable title</span>
                <input
                  type="text"
                  name="title"
                  value={submissionForm.title}
                  onChange={handleSubmissionChange}
                  required
                  placeholder="Homepage refresh v2"
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700">Asset link</span>
                <input
                  type="url"
                  name="url"
                  value={submissionForm.url}
                  onChange={handleSubmissionChange}
                  placeholder="https://files.gigvora.com/deliverables/123"
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700">Notes</span>
                <textarea
                  name="notes"
                  value={submissionForm.notes}
                  onChange={handleSubmissionChange}
                  rows={3}
                  placeholder="Links to source files or QA commentary."
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700">Delivered at</span>
                <input
                  type="datetime-local"
                  name="deliveredAt"
                  value={submissionForm.deliveredAt}
                  onChange={handleSubmissionChange}
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </label>
              {submissionBusy ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Recording deliverable…</p>
              ) : null}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submissionBusy}
                  className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  Log deliverable
                </button>
              </div>
              {submissionFeedback ? (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-700">{submissionFeedback}</p>
              ) : null}
              {submissionError ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">{submissionError}</p>
              ) : null}
            </form>
          </div>
        </div>
      </div>

      {feedback ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{errorMessage}</div>
      ) : null}
      {error && !errorMessage ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error?.message ?? 'Order workspace unavailable.'}
        </div>
      ) : null}
    </section>
  );
}

UserOrdersSection.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  initialWorkspace: PropTypes.object,
};

UserOrdersSection.defaultProps = {
  initialWorkspace: null,
};
