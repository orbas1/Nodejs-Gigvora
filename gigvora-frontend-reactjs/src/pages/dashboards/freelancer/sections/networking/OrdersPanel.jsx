import { useEffect, useMemo, useState } from 'react';
import SlideOver from './SlideOver.jsx';

function toAmount(value) {
  if (value == null) return '';
  const amount = Number(value) / 100;
  if (!Number.isFinite(amount)) return '';
  return amount.toFixed(amount % 1 === 0 ? 0 : 2);
}

export default function OrdersPanel({
  open,
  order,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  busy,
  statuses = ['pending', 'paid', 'refunded', 'cancelled'],
}) {
  const isEditing = Boolean(order);
  const initialValues = useMemo(
    () => ({
      sessionId: order?.sessionId ? String(order.sessionId) : '',
      amount: toAmount(order?.amountCents ?? null),
      currency: order?.currency ?? '',
      status: order?.status ?? 'pending',
      purchasedAt: order?.purchasedAt ? order.purchasedAt.slice(0, 16) : '',
      reference: order?.reference ?? '',
      notes: order?.metadata?.userNotes ?? '',
    }),
    [order],
  );

  const [form, setForm] = useState(initialValues);
  const [error, setError] = useState(null);

  useEffect(() => {
    setForm(initialValues);
    setError(null);
  }, [initialValues]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSelectAll = (event) => {
    if (event?.target?.select) {
      event.target.select();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    const payload = {
      sessionId: form.sessionId ? Number(form.sessionId) : undefined,
      amount: form.amount,
      currency: form.currency || 'USD',
      status: form.status,
      purchasedAt: form.purchasedAt ? new Date(form.purchasedAt).toISOString() : undefined,
      reference: form.reference,
      notes: form.notes,
    };
    try {
      if (isEditing) {
        await onUpdate?.(order.id, payload);
      } else {
        await onCreate?.(payload);
      }
      onClose?.();
    } catch (submissionError) {
      setError(submissionError?.message ?? 'Unable to save order.');
    }
  };

  const handleDelete = async () => {
    if (!onDelete) {
      return;
    }
    setError(null);
    try {
      await onDelete();
    } catch (submissionError) {
      setError(submissionError?.message ?? 'Unable to delete order.');
      return;
    }
    onClose?.();
  };

  return (
    <SlideOver
      open={open}
      onClose={busy ? () => {} : onClose}
      title={isEditing ? 'Update order' : 'Record networking order'}
      subtitle={isEditing ? order?.session?.title : 'Capture spend and references for networking sessions.'}
      footer={
        <div className="flex items-center justify-between gap-3">
          {isEditing && onDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={busy}
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            form="network-orders-form"
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
            disabled={busy}
          >
            {busy ? 'Saving…' : 'Save order'}
          </button>
        </div>
      }
    >
      <form id="network-orders-form" onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Session ID
          <input
            value={form.sessionId}
            onChange={handleChange('sessionId')}
            type="number"
            min="1"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            placeholder="Optional"
            disabled={busy}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Amount
            <input
              value={form.amount}
              onChange={handleChange('amount')}
              type="number"
              step="0.01"
              min="0"
              onFocus={handleSelectAll}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              placeholder="250"
              disabled={busy}
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Currency
            <input
              value={form.currency}
              onChange={handleChange('currency')}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm uppercase focus:border-blue-400 focus:outline-none"
              maxLength={3}
              disabled={busy}
              onFocus={handleSelectAll}
              placeholder="USD"
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
            <select
              value={form.status}
              onChange={handleChange('status')}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm capitalize focus:border-blue-400 focus:outline-none"
              disabled={busy}
            >
              {(statuses.length ? statuses : ['pending', 'paid', 'refunded', 'cancelled']).map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Purchased at
          <input
            value={form.purchasedAt}
            onChange={handleChange('purchasedAt')}
            type="datetime-local"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            disabled={busy}
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Reference
          <input
            value={form.reference}
            onChange={handleChange('reference')}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            placeholder="INV-2024-04"
            disabled={busy}
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Notes
          <textarea
            value={form.notes}
            onChange={handleChange('notes')}
            rows={3}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            placeholder="Optional notes for finance or operations"
            disabled={busy}
          />
        </label>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </form>
    </SlideOver>
  );
}
