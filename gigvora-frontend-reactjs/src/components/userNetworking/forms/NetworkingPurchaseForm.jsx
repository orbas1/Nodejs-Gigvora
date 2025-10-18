import { useId, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { parseFloatValue, parseInteger, toDateInput, toIsoString } from '../utils.js';

const STATUSES = ['pending', 'paid', 'refunded', 'cancelled'];

export default function NetworkingPurchaseForm({
  mode,
  initialValue,
  onSubmit,
  busy,
  sessionOptions,
  loadingSessions,
}) {
  const sessionInputId = useId();
  const [form, setForm] = useState(() => ({
    sessionId: initialValue?.sessionId ? String(initialValue.sessionId) : '',
    status: initialValue?.status ?? STATUSES[0],
    amount: initialValue?.amount != null ? String(initialValue.amount) : '',
    currency: initialValue?.currency ?? 'USD',
    purchasedAt: toDateInput(initialValue?.purchasedAt),
    reference: initialValue?.reference ?? '',
    notes: initialValue?.notes ?? initialValue?.metadata?.userNotes ?? '',
  }));

  const catalog = useMemo(() => sessionOptions ?? [], [sessionOptions]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (busy) {
      return;
    }

    const payload = {};

    if (mode === 'create') {
      const sessionId = parseInteger(form.sessionId);
      const amountValue = parseFloatValue(form.amount);
      if (!sessionId || amountValue == null) {
        return;
      }
      payload.sessionId = sessionId;
      payload.amount = amountValue;
    } else {
      const amountValue = parseFloatValue(form.amount);
      if (amountValue != null) {
        payload.amount = amountValue;
      }
    }

    payload.status = form.status;

    if (form.currency || mode === 'edit') {
      payload.currency = form.currency ? form.currency.toUpperCase() : null;
    }

    const purchasedAt = form.purchasedAt ? toIsoString(form.purchasedAt) : null;
    if (purchasedAt || (mode === 'edit' && form.purchasedAt === '')) {
      payload.purchasedAt = purchasedAt;
    }

    if (form.reference || (mode === 'edit' && form.reference === '')) {
      payload.reference = form.reference || null;
    }

    if (form.notes || (mode === 'edit' && form.notes === '')) {
      payload.notes = form.notes || null;
    }

    onSubmit(payload);
  };

  const requiredReady = Boolean(form.sessionId && form.amount);
  const ready = mode === 'edit' ? !busy : requiredReady && !busy;

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Session
          <input
            name="sessionId"
            id={`${sessionInputId}-purchase-session`}
            type="text"
            inputMode="numeric"
            list={`${sessionInputId}-purchase-sessions`}
            value={form.sessionId}
            onChange={handleChange}
            disabled={mode === 'edit'}
            className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:bg-slate-100"
            placeholder="Session ID"
            required={mode === 'create'}
          />
          {catalog.length ? (
            <datalist id={`${sessionInputId}-purchase-sessions`}>
              {catalog.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.label}
                </option>
              ))}
            </datalist>
          ) : null}
          {loadingSessions ? (
            <span className="mt-1 text-[11px] font-normal text-slate-400">Loading sessions…</span>
          ) : null}
        </label>

        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Status
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="mt-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Amount
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={handleChange}
            className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="0.00"
            required={mode === 'create'}
          />
        </label>
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Currency
          <input
            name="currency"
            type="text"
            value={form.currency}
            onChange={handleChange}
            className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm uppercase text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="USD"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Purchased
          <input
            name="purchasedAt"
            type="datetime-local"
            value={form.purchasedAt}
            onChange={handleChange}
            className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </label>
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Reference
          <input
            name="reference"
            type="text"
            value={form.reference}
            onChange={handleChange}
            className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="Invoice"
          />
        </label>
      </div>

      <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
        Notes
        <textarea
          name="notes"
          rows={3}
          value={form.notes}
          onChange={handleChange}
          className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
          placeholder="Notes"
        />
      </label>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!ready}
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

NetworkingPurchaseForm.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  initialValue: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  busy: PropTypes.bool,
  sessionOptions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  loadingSessions: PropTypes.bool,
};

NetworkingPurchaseForm.defaultProps = {
  initialValue: null,
  busy: false,
  sessionOptions: [],
  loadingSessions: false,
};
