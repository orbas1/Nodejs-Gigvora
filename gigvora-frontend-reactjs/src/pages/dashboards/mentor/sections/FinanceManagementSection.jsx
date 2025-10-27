import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowPathIcon, BanknotesIcon, TrashIcon } from '@heroicons/react/24/outline';
import InvoiceGenerator from '../../../../components/commerce/InvoiceGenerator.jsx';
import SubscriptionManager from '../../../../components/commerce/SubscriptionManager.jsx';

const DEFAULT_PAYOUT = {
  amount: '',
  currency: '£',
  status: 'Scheduled',
  initiatedOn: '',
  expectedOn: '',
  method: 'Stripe Express',
  destination: '',
  notes: '',
};

const PAYOUT_STATUSES = ['Scheduled', 'Processing', 'Paid', 'Failed'];

function formatDateInput(value) {
  if (!value) {
    return '';
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().slice(0, 10);
  } catch (error) {
    return '';
  }
}

export default function FinanceManagementSection({
  finance,
  onCreateInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  onCreatePayout,
  onUpdatePayout,
  onDeletePayout,
  invoiceSaving,
  payoutSaving,
}) {
  const [invoiceDraft, setInvoiceDraft] = useState(null);
  const [payoutForm, setPayoutForm] = useState(DEFAULT_PAYOUT);
  const [editingPayoutId, setEditingPayoutId] = useState(null);
  const [feedback, setFeedback] = useState({ invoice: null, payout: null });

  useEffect(() => {
    if (!editingPayoutId) {
      setPayoutForm(DEFAULT_PAYOUT);
    }
  }, [editingPayoutId]);

  const handleInvoiceSave = async (payload) => {
    setFeedback((current) => ({ ...current, invoice: null }));
    const { quickSend, ...invoicePayload } = payload;

    if (invoicePayload.status === 'Paid' && !invoicePayload.paidOn) {
      invoicePayload.paidOn = invoicePayload.dueOn || new Date().toISOString();
    }

    try {
      if (invoiceDraft?.id && !quickSend) {
        await onUpdateInvoice?.(invoiceDraft.id, invoicePayload);
      } else {
        await onCreateInvoice?.(invoicePayload);
      }
      const message = quickSend
        ? 'Invoice snapshot queued.'
        : invoiceDraft?.id
        ? 'Invoice updated.'
        : 'Invoice saved.';
      setFeedback((current) => ({ ...current, invoice: { type: 'success', message } }));
      setInvoiceDraft(null);
    } catch (error) {
      setFeedback((current) => ({
        ...current,
        invoice: { type: 'error', message: error.message || 'Unable to save invoice.' },
      }));
      throw error;
    }
  };

  const handlePayoutSubmit = async (event) => {
    event.preventDefault();
    setFeedback((current) => ({ ...current, payout: null }));
    const payload = {
      amount: payoutForm.amount,
      currency: payoutForm.currency,
      status: payoutForm.status,
      initiatedOn: payoutForm.initiatedOn,
      expectedOn: payoutForm.expectedOn,
      method: payoutForm.method,
      destination: payoutForm.destination,
      notes: payoutForm.notes,
    };
    if (payoutForm.status === 'Paid') {
      payload.paidOn = payoutForm.expectedOn || new Date().toISOString();
    }
    try {
      if (editingPayoutId) {
        await onUpdatePayout?.(editingPayoutId, payload);
      } else {
        await onCreatePayout?.(payload);
      }
      setPayoutForm(DEFAULT_PAYOUT);
      setEditingPayoutId(null);
      setFeedback((current) => ({ ...current, payout: { type: 'success', message: 'Payout saved.' } }));
    } catch (error) {
      setFeedback((current) => ({
        ...current,
        payout: { type: 'error', message: error.message || 'Unable to save payout.' },
      }));
    }
  };

  const invoices = finance?.invoices ?? [];
  const payouts = finance?.payouts ?? [];
  const revenueStreams = finance?.revenueStreams ?? [];

  const summaryTiles = useMemo(
    () => [
      { label: 'Outstanding invoices', value: finance?.summary?.outstandingInvoices ?? 0 },
      { label: 'Paid invoices', value: finance?.summary?.paidInvoices ?? 0 },
      { label: 'Available balance', value: finance?.summary?.availableBalance ?? 0 },
      { label: 'Upcoming payouts', value: finance?.summary?.upcomingPayouts ?? 0 },
    ],
    [finance?.summary],
  );

  return (
    <section id="finance" className="space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Finance management</p>
          <h2 className="text-2xl font-semibold text-slate-900">Reconcile invoices and automate payouts</h2>
          <p className="text-sm text-slate-600">
            Track billing, nudge overdue invoices, and confirm your next payout run. These updates sync with Explorer billing
            rails instantly.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {summaryTiles.map((tile) => (
            <div key={tile.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tile.label}</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">£{tile.value?.toLocaleString?.() ?? tile.value}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <InvoiceGenerator
            value={invoiceDraft}
            saving={invoiceSaving}
            onSubmit={handleInvoiceSave}
            onCancel={() => {
              setInvoiceDraft(null);
              setFeedback((current) => ({ ...current, invoice: null }));
            }}
          />
          {feedback.invoice ? (
            <p
              className={`text-sm font-medium ${
                feedback.invoice.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {feedback.invoice.message}
            </p>
          ) : null}

          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Invoice</th>
                  <th className="px-4 py-3 text-left font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Due</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{invoice.mentee}</div>
                      <div className="text-xs text-slate-500">{invoice.package}</div>
                    </td>
                    <td className="px-4 py-3">£{invoice.amount?.toLocaleString?.() ?? invoice.amount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          invoice.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : invoice.status === 'Overdue'
                              ? 'bg-rose-100 text-rose-600'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {invoice.dueOn ? formatDateInput(invoice.dueOn) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent"
                          onClick={() => {
                            setInvoiceDraft(invoice);
                            setFeedback((current) => ({ ...current, invoice: null }));
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                          onClick={async () => {
                            try {
                              await onDeleteInvoice?.(invoice.id);
                              if (invoiceDraft?.id === invoice.id) {
                                setInvoiceDraft(null);
                              }
                              setFeedback((current) => ({ ...current, invoice: { type: 'success', message: 'Invoice removed.' } }));
                            } catch (deleteError) {
                              setFeedback((current) => ({
                                ...current,
                                invoice: {
                                  type: 'error',
                                  message: deleteError.message || 'Unable to remove invoice.',
                                },
                              }));
                            }
                          }}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-5">
          <form onSubmit={handlePayoutSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {editingPayoutId ? 'Update payout' : 'Schedule payout'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingPayoutId(null);
                  setPayoutForm(DEFAULT_PAYOUT);
                }}
                className="text-xs font-semibold text-accent hover:underline"
              >
                Reset
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Amount
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={payoutForm.currency}
                    onChange={(event) => setPayoutForm((current) => ({ ...current, currency: event.target.value }))}
                    className="w-16 rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={payoutForm.amount}
                    onChange={(event) => setPayoutForm((current) => ({ ...current, amount: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Status
                <select
                  value={payoutForm.status}
                  onChange={(event) => setPayoutForm((current) => ({ ...current, status: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {PAYOUT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Initiated on
                <input
                  type="date"
                  value={formatDateInput(payoutForm.initiatedOn)}
                  onChange={(event) => setPayoutForm((current) => ({ ...current, initiatedOn: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Expected on
                <input
                  type="date"
                  value={formatDateInput(payoutForm.expectedOn)}
                  onChange={(event) => setPayoutForm((current) => ({ ...current, expectedOn: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Method
                <input
                  type="text"
                  value={payoutForm.method}
                  onChange={(event) => setPayoutForm((current) => ({ ...current, method: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Destination
                <input
                  type="text"
                  value={payoutForm.destination}
                  onChange={(event) => setPayoutForm((current) => ({ ...current, destination: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Notes
              <textarea
                rows="3"
                value={payoutForm.notes}
                onChange={(event) => setPayoutForm((current) => ({ ...current, notes: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={payoutSaving}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {payoutSaving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <BanknotesIcon className="h-4 w-4" />}
                {payoutSaving ? 'Saving…' : editingPayoutId ? 'Update payout' : 'Schedule payout'}
              </button>
              {feedback.payout ? (
                <p
                  className={`text-sm font-medium ${
                    feedback.payout.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {feedback.payout.message}
                </p>
              ) : null}
            </div>
          </form>

          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Reference</th>
                  <th className="px-4 py-3 text-left font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Expected</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{payout.reference}</div>
                      <div className="text-xs text-slate-500">{payout.method}</div>
                    </td>
                    <td className="px-4 py-3">£{payout.amount?.toLocaleString?.() ?? payout.amount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          payout.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : payout.status === 'Failed'
                              ? 'bg-rose-100 text-rose-600'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {payout.expectedOn ? formatDateInput(payout.expectedOn) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent"
                          onClick={() => {
                            setEditingPayoutId(payout.id);
                            setPayoutForm({
                              amount: payout.amount,
                              currency: payout.currency,
                              status: payout.status,
                              initiatedOn: formatDateInput(payout.initiatedOn),
                              expectedOn: formatDateInput(payout.expectedOn),
                              method: payout.method ?? 'Stripe Express',
                              destination: payout.destination ?? '',
                              notes: payout.notes ?? '',
                            });
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                          onClick={async () => {
                            try {
                              await onDeletePayout?.(payout.id);
                              if (editingPayoutId === payout.id) {
                                setEditingPayoutId(null);
                                setPayoutForm(DEFAULT_PAYOUT);
                              }
                              setFeedback((current) => ({ ...current, payout: { type: 'success', message: 'Payout removed.' } }));
                            } catch (deleteError) {
                              setFeedback((current) => ({
                                ...current,
                                payout: {
                                  type: 'error',
                                  message: deleteError.message || 'Unable to remove payout.',
                                },
                              }));
                            }
                          }}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Revenue streams</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {revenueStreams.map((stream) => (
                <li key={stream.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{stream.label}</p>
                    <p className="text-xs text-slate-500">Change {stream.change > 0 ? '+' : ''}{stream.change}%</p>
                  </div>
                  <p className="font-semibold text-slate-900">£{stream.amount?.toLocaleString?.() ?? stream.amount}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <SubscriptionManager />
    </section>
  );
}

FinanceManagementSection.propTypes = {
  finance: PropTypes.shape({
    summary: PropTypes.object,
    invoices: PropTypes.arrayOf(PropTypes.object),
    payouts: PropTypes.arrayOf(PropTypes.object),
    revenueStreams: PropTypes.arrayOf(PropTypes.object),
  }),
  onCreateInvoice: PropTypes.func,
  onUpdateInvoice: PropTypes.func,
  onDeleteInvoice: PropTypes.func,
  onCreatePayout: PropTypes.func,
  onUpdatePayout: PropTypes.func,
  onDeletePayout: PropTypes.func,
  invoiceSaving: PropTypes.bool,
  payoutSaving: PropTypes.bool,
};

FinanceManagementSection.defaultProps = {
  finance: { summary: {}, invoices: [], payouts: [], revenueStreams: [] },
  onCreateInvoice: undefined,
  onUpdateInvoice: undefined,
  onDeleteInvoice: undefined,
  onCreatePayout: undefined,
  onUpdatePayout: undefined,
  onDeletePayout: undefined,
  invoiceSaving: false,
  payoutSaving: false,
};
