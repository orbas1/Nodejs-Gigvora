import { useEffect, useMemo, useState } from 'react';
import SlideOver from './SlideOver.jsx';

function useForm(initial) {
  const [state, setState] = useState(initial);
  useEffect(() => {
    setState(initial);
  }, [initial]);
  return [state, setState];
}

function centsToAmount(cents) {
  if (cents == null) return '';
  const amount = Number(cents) / 100;
  if (!Number.isFinite(amount)) return '';
  return amount.toFixed(amount % 1 === 0 ? 0 : 2);
}

export function BookingPanel({
  open,
  onClose,
  sessions,
  paymentStatuses,
  booking,
  session,
  onCreate,
  onUpdate,
  busy,
}) {
  const isEditing = Boolean(booking);
  const initialValues = useMemo(() => {
    if (booking) {
      return {
        sessionId: booking.session?.id ? String(booking.session.id) : '',
        paymentStatus: booking.paymentStatus ?? 'unpaid',
        purchaseAmount: centsToAmount(booking.purchaseCents),
        purchaseCurrency: booking.purchaseCurrency || booking.session?.currency || 'USD',
        note: booking.metadata?.bookingNote ?? '',
      };
    }
    const selectedSession = session ? String(session.id) : '';
    return {
      sessionId: selectedSession,
      paymentStatus: 'unpaid',
      purchaseAmount: session?.priceCents ? centsToAmount(session.priceCents) : '',
      purchaseCurrency: session?.currency || 'USD',
      note: '',
    };
  }, [booking, session]);

  const [form, setForm] = useForm(initialValues);
  const [error, setError] = useState(null);

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.sessionId) {
      setError('Pick a session.');
      return;
    }
    setError(null);
    try {
      if (isEditing) {
        await onUpdate(booking.id, form);
      } else {
        await onCreate(form);
      }
      onClose();
    } catch (submissionError) {
      setError(submissionError?.message || 'Unable to save booking.');
    }
  };

  return (
    <SlideOver
      open={open}
      onClose={busy ? () => {} : onClose}
      title={isEditing ? 'Update booking' : 'Reserve session'}
      subtitle={isEditing ? booking.session?.title : session?.title}
      footer={
        <button
          type="submit"
          form="network-booking-form"
          className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={busy}
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      }
    >
      <form id="network-booking-form" onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Session
          <select
            value={form.sessionId}
            onChange={handleChange('sessionId')}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            disabled={busy}
          >
            <option value="">Select</option>
            {sessions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.title}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Amount
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.purchaseAmount}
              onChange={handleChange('purchaseAmount')}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={busy}
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Currency
            <input
              type="text"
              value={form.purchaseCurrency}
              onChange={handleChange('purchaseCurrency')}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm uppercase focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={busy}
              maxLength={3}
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
            <select
              value={form.paymentStatus}
              onChange={handleChange('paymentStatus')}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={busy}
            >
              {paymentStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Note
          <textarea
            value={form.note}
            onChange={handleChange('note')}
            rows={3}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            disabled={busy}
          />
        </label>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </form>
    </SlideOver>
  );
}

export function ConnectionPanel({
  open,
  onClose,
  connection,
  sessions,
  connectionTypes,
  connectionStatuses,
  onCreate,
  onUpdate,
  busy,
}) {
  const isEditing = Boolean(connection);
  const initialValues = useMemo(() => ({
    sessionId: connection?.sessionId ? String(connection.sessionId) : connection?.session?.id ? String(connection.session.id) : '',
    counterpartName: connection?.counterpart?.name || connection?.counterpartName || '',
    counterpartEmail: connection?.counterpart?.email || connection?.counterpartEmail || '',
    connectionType: connection?.connectionType || connectionTypes[0] || 'follow',
    status: connection?.status || connectionStatuses[0] || 'new',
    followUpAt: connection?.followUpAt ? connection.followUpAt.slice(0, 10) : '',
    notes: connection?.notes || '',
  }), [connection, connectionTypes, connectionStatuses]);

  const [form, setForm] = useForm(initialValues);
  const [error, setError] = useState(null);

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.counterpartName && !form.counterpartEmail) {
      setError('Add a name or email.');
      return;
    }
    setError(null);
    const payload = {
      sessionId: form.sessionId,
      counterpartName: form.counterpartName,
      counterpartEmail: form.counterpartEmail,
      connectionType: form.connectionType,
      status: form.status,
      followUpAt: form.followUpAt,
      notes: form.notes,
    };
    try {
      if (isEditing) {
        await onUpdate(connection.id, payload);
      } else {
        await onCreate(payload);
      }
      onClose();
    } catch (submissionError) {
      setError(submissionError?.message || 'Unable to save contact.');
    }
  };

  return (
    <SlideOver
      open={open}
      onClose={busy ? () => {} : onClose}
      title={isEditing ? 'Update contact' : 'Log contact'}
      subtitle={connection?.counterpart?.name || connection?.counterpartName || undefined}
      footer={
        <button
          type="submit"
          form="network-connection-form"
          className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={busy}
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      }
    >
      <form id="network-connection-form" onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Session
          <select
            value={form.sessionId}
            onChange={handleChange('sessionId')}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            disabled={busy}
          >
            <option value="">None</option>
            {sessions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.title}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Name
            <input
              type="text"
              value={form.counterpartName}
              onChange={handleChange('counterpartName')}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={busy}
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Email
            <input
              type="email"
              value={form.counterpartEmail}
              onChange={handleChange('counterpartEmail')}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={busy}
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Type
            <select
              value={form.connectionType}
              onChange={handleChange('connectionType')}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={busy}
            >
              {connectionTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
            <select
              value={form.status}
              onChange={handleChange('status')}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={busy}
            >
              {connectionStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Follow-up
            <input
              type="date"
              value={form.followUpAt}
              onChange={handleChange('followUpAt')}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={busy}
            />
          </label>
        </div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Notes
          <textarea
            value={form.notes}
            onChange={handleChange('notes')}
            rows={4}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            disabled={busy}
          />
        </label>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </form>
    </SlideOver>
  );
}
