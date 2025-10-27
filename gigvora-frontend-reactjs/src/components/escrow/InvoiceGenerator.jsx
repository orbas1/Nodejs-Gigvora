import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { formatAbsolute } from '../../utils/date.js';

function formatCurrency(amount, currency) {
  if (amount == null) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch (error) {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
}

function addDays(date, days) {
  const base = date ? new Date(date) : new Date();
  const clone = new Date(base.getTime());
  clone.setDate(clone.getDate() + days);
  return clone.toISOString().slice(0, 10);
}

function deriveClientName(selectedItems) {
  if (!selectedItems.length) {
    return '';
  }
  const [first] = selectedItems;
  return first.counterpartyName ?? '';
}

export default function InvoiceGenerator({
  currency,
  nextInvoiceNumber,
  availableTransactions,
  accounts,
  onGenerate,
  loading,
}) {
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [invoiceNumber, setInvoiceNumber] = useState(nextInvoiceNumber);
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => addDays(new Date(), 14));
  const [taxRate, setTaxRate] = useState(0.05);
  const [accountId, setAccountId] = useState(() => accounts[0]?.id ?? '');
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');
  const [sendCopy, setSendCopy] = useState(true);

  const selectedItems = useMemo(
    () => availableTransactions.filter((item) => selectedIds.has(item.id)),
    [availableTransactions, selectedIds],
  );

  const totals = useMemo(() => {
    const subtotal = selectedItems.reduce(
      (sum, item) => sum + Number(item.amount ?? 0),
      0,
    );
    const tax = subtotal * Number(taxRate ?? 0);
    const total = subtotal + tax;
    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }, [selectedItems, taxRate]);

  const handleToggleItem = (itemId) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === availableTransactions.length) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(availableTransactions.map((item) => item.id)));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selectedItems.length) {
      throw new Error('Select at least one transaction to generate an invoice.');
    }
    const payload = {
      invoiceNumber,
      issueDate,
      dueDate,
      clientName: clientName || deriveClientName(selectedItems),
      accountId,
      notes: notes?.trim() ? notes.trim() : undefined,
      taxRate: Number(taxRate),
      sendCopy,
      currency,
      lineItems: selectedItems.map((item) => ({
        transactionId: item.transactionId ?? item.id,
        reference: item.reference,
        description: item.label,
        amount: Number(item.amount ?? 0),
        currencyCode: item.currencyCode ?? currency,
        counterpartyId: item.counterpartyId ?? null,
      })),
      totals,
    };
    onGenerate(payload);
  };

  const invoicePreviewClient = useMemo(
    () => clientName || deriveClientName(selectedItems) || 'Client name',
    [clientName, selectedItems],
  );

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Invoice generator</h3>
          <p className="text-sm text-slate-500">
            Transform released milestones into polished invoices and sync ledger-ready summaries.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSelectAll}
          className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
        >
          {selectedIds.size === availableTransactions.length ? 'Clear selection' : 'Select all'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <h4 className="text-sm font-semibold text-slate-900">Invoice details</h4>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-600">
                Invoice number
                <input
                  value={invoiceNumber}
                  onChange={(event) => setInvoiceNumber(event.target.value)}
                  required
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="text-sm text-slate-600">
                Account
                <select
                  value={accountId}
                  onChange={(event) => setAccountId(event.target.value)}
                  required
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.displayName ?? account.name ?? `Account #${account.id}`}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-600">
                Issue date
                <input
                  type="date"
                  value={issueDate}
                  onChange={(event) => setIssueDate(event.target.value)}
                  required
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="text-sm text-slate-600">
                Due date
                <input
                  type="date"
                  value={dueDate}
                  min={issueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  required
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="text-sm text-slate-600">
                Client name
                <input
                  value={clientName}
                  onChange={(event) => setClientName(event.target.value)}
                  placeholder="Orbit Labs"
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="text-sm text-slate-600">
                Tax rate
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="0.5"
                  value={taxRate}
                  onChange={(event) => setTaxRate(Number(event.target.value))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>
            <label className="mt-3 block text-sm text-slate-600">
              Notes
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="Add remittance instructions or contextual summary"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="mt-4 flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={sendCopy}
                onChange={(event) => setSendCopy(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Email a copy to finance@yourcompany.com
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <h4 className="text-sm font-semibold text-slate-900">Totals</h4>
            <dl className="mt-3 space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <dt>Subtotal</dt>
                <dd className="font-medium text-slate-900">{formatCurrency(totals.subtotal, currency)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Tax ({Number(taxRate * 100).toFixed(1)}%)</dt>
                <dd className="font-medium text-slate-900">{formatCurrency(totals.tax, currency)}</dd>
              </div>
              <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                <dt>Total due</dt>
                <dd>{formatCurrency(totals.total, currency)}</dd>
              </div>
            </dl>
            <button
              type="submit"
              disabled={loading || !selectedItems.length}
              className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-blue-200 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:border-blue-300 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Generating…' : 'Generate invoice'}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <h4 className="text-sm font-semibold text-slate-900">Invoice preview</h4>
            <p className="mt-2 text-sm text-slate-600">{invoicePreviewClient}</p>
            <p className="text-xs text-slate-500">
              {selectedItems.length} line item{selectedItems.length === 1 ? '' : 's'} · Due {formatAbsolute(dueDate, { dateStyle: 'medium' })}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {selectedItems.length ? (
                selectedItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2">
                    <div>
                      <p className="font-medium text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-500">#{item.reference}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(item.amount, item.currencyCode ?? currency)}
                    </p>
                  </li>
                ))
              ) : (
                <li className="rounded-2xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
                  Select transactions to populate the invoice.
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <h4 className="text-sm font-semibold text-slate-900">Released transactions</h4>
            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1 text-sm text-slate-600">
              {availableTransactions.map((item) => {
                const checked = selectedIds.has(item.id);
                return (
                  <label
                    key={item.id}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-3 py-2 transition ${
                      checked
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40'
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{item.label}</span>
                      <span className="block text-xs text-slate-500">
                        #{item.reference} · Released {item.releasedAt ? formatAbsolute(item.releasedAt, { dateStyle: 'medium' }) : 'recently'}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatCurrency(item.amount, item.currencyCode ?? currency)}
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          handleToggleItem(item.id);
                          if (!clientName) {
                            setClientName(deriveClientName([...selectedItems, item]));
                          }
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

InvoiceGenerator.propTypes = {
  currency: PropTypes.string,
  nextInvoiceNumber: PropTypes.string,
  availableTransactions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      transactionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      reference: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      label: PropTypes.string,
      amount: PropTypes.number,
      currencyCode: PropTypes.string,
      counterpartyId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      counterpartyName: PropTypes.string,
      releasedAt: PropTypes.string,
    }),
  ),
  accounts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      displayName: PropTypes.string,
      name: PropTypes.string,
    }),
  ),
  onGenerate: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

InvoiceGenerator.defaultProps = {
  currency: 'USD',
  nextInvoiceNumber: 'INV-0001',
  availableTransactions: [],
  accounts: [],
  loading: false,
};
