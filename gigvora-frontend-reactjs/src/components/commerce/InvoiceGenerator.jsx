import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  CurrencyDollarIcon,
  DocumentCheckIcon,
  PlusCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const DEFAULT_LINE_ITEM = () => ({
  id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  description: '',
  quantity: 1,
  unitPrice: 0,
  taxRate: 0,
});

const STATUS_OPTIONS = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];
const CURRENCY_OPTIONS = ['USD', 'GBP', 'EUR'];

function normaliseInvoice(value) {
  if (!value) {
    const today = new Date();
    const due = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    return {
      clientName: '',
      clientEmail: '',
      company: '',
      reference: '',
      status: 'Sent',
      currency: 'USD',
      issueDate: today.toISOString().slice(0, 10),
      dueDate: due.toISOString().slice(0, 10),
      paymentTerms: 14,
      autoReminders: true,
      notes: '',
      attachments: '',
      lineItems: [DEFAULT_LINE_ITEM()],
    };
  }

  const lineItems = Array.isArray(value.lineItems) && value.lineItems.length > 0
    ? value.lineItems.map((item, index) => ({
        id: item.id ?? `item-${index}`,
        description: item.description ?? item.label ?? '',
        quantity: Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 1,
        unitPrice: Number.isFinite(Number(item.unitPrice ?? item.amount))
          ? Number(item.unitPrice ?? item.amount)
          : Number(value.amount ?? 0),
        taxRate: Number.isFinite(Number(item.taxRate)) ? Number(item.taxRate) : 0,
      }))
    : [
        {
          ...DEFAULT_LINE_ITEM(),
          description: value.package ?? value.reference ?? 'Retainer',
          quantity: 1,
          unitPrice: Number(value.amount ?? 0),
          taxRate: 0,
        },
      ];

  return {
    clientName: value.mentee ?? value.clientName ?? '',
    clientEmail: value.clientEmail ?? '',
    company: value.company ?? '',
    reference: value.reference ?? '',
    status: value.status ?? 'Sent',
    currency: value.currency ?? 'USD',
    issueDate: value.issuedOn ? value.issuedOn.slice(0, 10) : '',
    dueDate: value.dueOn ? value.dueOn.slice(0, 10) : '',
    paymentTerms: value.paymentTerms ?? 14,
    autoReminders: value.autoReminders ?? true,
    notes: value.notes ?? '',
    attachments: value.attachments ?? '',
    lineItems,
  };
}

function computeTotals(lineItems) {
  return lineItems.reduce(
    (acc, item) => {
      const quantity = Number(item.quantity ?? 0);
      const price = Number(item.unitPrice ?? 0);
      const subtotal = quantity * price;
      const taxRate = Number(item.taxRate ?? 0) / 100;
      const tax = subtotal * Math.max(taxRate, 0);
      acc.subtotal += subtotal;
      acc.taxTotal += tax;
      return acc;
    },
    { subtotal: 0, taxTotal: 0 },
  );
}

function toIsoDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString();
}

export default function InvoiceGenerator({
  value = null,
  saving = false,
  onSubmit = () => {},
  onCancel,
}) {
  const [draft, setDraft] = useState(() => normaliseInvoice(value));
  const [submitting, setSubmitting] = useState(false);
  const totals = useMemo(() => computeTotals(draft.lineItems), [draft.lineItems]);

  useEffect(() => {
    setDraft(normaliseInvoice(value));
  }, [value?.id]);

  const totalAmount = totals.subtotal + totals.taxTotal;

  const handleLineItemChange = (id, patch) => {
    setDraft((current) => ({
      ...current,
      lineItems: current.lineItems.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const handleAddLineItem = () => {
    setDraft((current) => ({
      ...current,
      lineItems: [...current.lineItems, DEFAULT_LINE_ITEM()],
    }));
  };

  const handleRemoveLineItem = (id) => {
    setDraft((current) => ({
      ...current,
      lineItems: current.lineItems.length === 1
        ? current.lineItems
        : current.lineItems.filter((item) => item.id !== id),
    }));
  };

  const resetDraft = () => {
    setDraft(normaliseInvoice(value));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const payload = {
      mentee: draft.clientName,
      clientEmail: draft.clientEmail || undefined,
      company: draft.company || undefined,
      reference: draft.reference || undefined,
      package: draft.company || draft.reference || draft.clientName || 'Invoice',
      amount: Number(totalAmount.toFixed(2)),
      subtotal: Number(totals.subtotal.toFixed(2)),
      taxTotal: Number(totals.taxTotal.toFixed(2)),
      currency: draft.currency,
      status: draft.status,
      issuedOn: toIsoDate(draft.issueDate),
      dueOn: toIsoDate(draft.dueDate),
      paymentTerms: Number(draft.paymentTerms ?? 0) || undefined,
      autoReminders: Boolean(draft.autoReminders),
      notes: draft.notes || undefined,
      attachments: draft.attachments || undefined,
      lineItems: draft.lineItems.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity ?? 0),
        unitPrice: Number(item.unitPrice ?? 0),
        taxRate: Number(item.taxRate ?? 0),
      })),
    };

    if (draft.status === 'Paid' && payload.dueOn && !value?.paidOn) {
      payload.paidOn = payload.dueOn;
    }

    try {
      setSubmitting(true);
      await onSubmit(payload);
      resetDraft();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Invoices</p>
          <h3 className="text-xl font-semibold text-slate-900">
            {value?.id ? 'Update invoice' : 'Generate invoice'}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Capture scope, calculate totals, and queue reminders for upcoming billing moments.
          </p>
        </div>
        <button
          type="button"
          onClick={resetDraft}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
        >
          <ArrowUturnLeftIcon className="h-4 w-4" />
          Reset
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          <section className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Client name
              <input
                type="text"
                required
                value={draft.clientName}
                onChange={(event) => setDraft((current) => ({ ...current, clientName: event.target.value }))}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Client email
              <input
                type="email"
                value={draft.clientEmail}
                onChange={(event) => setDraft((current) => ({ ...current, clientEmail: event.target.value }))}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Company or programme
              <input
                type="text"
                value={draft.company}
                onChange={(event) => setDraft((current) => ({ ...current, company: event.target.value }))}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Invoice reference
              <input
                type="text"
                value={draft.reference}
                onChange={(event) => setDraft((current) => ({ ...current, reference: event.target.value }))}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
              />
            </label>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Status
              <select
                value={draft.status}
                onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Currency
              <select
                value={draft.currency}
                onChange={(event) => setDraft((current) => ({ ...current, currency: event.target.value }))}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
              >
                {CURRENCY_OPTIONS.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Issue date
              <input
                type="date"
                value={draft.issueDate}
                onChange={(event) => setDraft((current) => ({ ...current, issueDate: event.target.value }))}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Due date
              <input
                type="date"
                value={draft.dueDate}
                onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Payment terms (days)
              <input
                type="number"
                min="0"
                value={draft.paymentTerms}
                onChange={(event) => setDraft((current) => ({ ...current, paymentTerms: event.target.value }))}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
              <input
                type="checkbox"
                checked={draft.autoReminders}
                onChange={(event) => setDraft((current) => ({ ...current, autoReminders: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              Enable payment reminders
            </label>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Line items</h4>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                <PlusCircleIcon className="h-4 w-4" />
                Add item
              </button>
            </div>
            <div className="space-y-3">
              {draft.lineItems.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[2fr_repeat(3,_minmax(0,_1fr))_auto]"
                >
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:col-span-1">
                    Description
                    <input
                      type="text"
                      value={item.description}
                      onChange={(event) => handleLineItemChange(item.id, { description: event.target.value })}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Qty
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={item.quantity}
                      onChange={(event) => handleLineItemChange(item.id, { quantity: event.target.value })}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Rate
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(event) => handleLineItemChange(item.id, { unitPrice: event.target.value })}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tax %
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={item.taxRate}
                      onChange={(event) => handleLineItemChange(item.id, { taxRate: event.target.value })}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                    />
                  </label>
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                    <span>Total</span>
                    <span>{(Number(item.quantity ?? 0) * Number(item.unitPrice ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveLineItem(item.id)}
                    className="flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-rose-300 hover:text-rose-600 disabled:opacity-30"
                    disabled={draft.lineItems.length === 1}
                    aria-label="Remove line item"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Notes & payment instructions
              <textarea
                rows="3"
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Attachments or links
              <input
                type="text"
                value={draft.attachments}
                onChange={(event) => setDraft((current) => ({ ...current, attachments: event.target.value }))}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                placeholder="Share drive or contract references"
              />
            </label>
          </section>
        </div>

        <aside className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CurrencyDollarIcon className="h-6 w-6 text-emerald-600" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total due</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {totalAmount.toLocaleString(undefined, { style: 'currency', currency: draft.currency })}
                </p>
              </div>
            </div>
            <dl className="space-y-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <dt>Subtotal</dt>
                <dd>{totals.subtotal.toLocaleString(undefined, { style: 'currency', currency: draft.currency })}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Tax</dt>
                <dd>{totals.taxTotal.toLocaleString(undefined, { style: 'currency', currency: draft.currency })}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-slate-700">
                <dt className="font-semibold">Total</dt>
                <dd className="font-semibold">
                  {totalAmount.toLocaleString(undefined, { style: 'currency', currency: draft.currency })}
                </dd>
              </div>
            </dl>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
              <p className="font-semibold text-slate-700">Preview</p>
              <p className="mt-1">
                {draft.clientName || 'Client'} will receive a {draft.status.toLowerCase()} invoice for
                {' '}
                {totalAmount.toLocaleString(undefined, { style: 'currency', currency: draft.currency })}
                {' '}due on {draft.dueDate || 'the selected date'}.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <button
              type="submit"
              disabled={saving || submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <DocumentCheckIcon className="h-5 w-5" />
              {saving || submitting ? 'Saving…' : value?.id ? 'Update invoice' : 'Generate invoice'}
            </button>
            <button
              type="button"
              onClick={() => onSubmit({
                mentee: draft.clientName,
                amount: Number(totalAmount.toFixed(2)),
                currency: draft.currency,
                status: draft.status,
                issuedOn: toIsoDate(draft.issueDate),
                dueOn: toIsoDate(draft.dueDate),
                autoReminders: Boolean(draft.autoReminders),
                quickSend: true,
              })}
              disabled={saving || submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowPathIcon className="h-5 w-5" />
              Quick send snapshot
            </button>
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="w-full rounded-full border border-transparent px-5 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
              >
                Cancel editing
              </button>
            ) : null}
          </div>
        </aside>
      </div>
    </form>
  );
}

InvoiceGenerator.propTypes = {
  value: PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) }),
  saving: PropTypes.bool,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
};

