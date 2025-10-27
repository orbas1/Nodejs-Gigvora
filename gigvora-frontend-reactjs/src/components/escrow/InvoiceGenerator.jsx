import { useEffect, useMemo, useState } from 'react';
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

const PAYMENT_TERMS = [
  { key: 'net_7', label: 'Net 7', days: 7 },
  { key: 'net_14', label: 'Net 14', days: 14 },
  { key: 'net_30', label: 'Net 30', days: 30 },
];

const SIGNAL_TONES = {
  alert: 'border-rose-200 bg-rose-50 text-rose-700',
  caution: 'border-amber-200 bg-amber-50 text-amber-700',
  positive: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

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
  const [paymentTerm, setPaymentTerm] = useState('net_14');
  const [taxRate, setTaxRate] = useState(0.05);
  const [includeTax, setIncludeTax] = useState(true);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [accountId, setAccountId] = useState(() => accounts[0]?.id ?? '');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [sendCopy, setSendCopy] = useState(true);
  const [formError, setFormError] = useState(null);

  const selectedItems = useMemo(
    () => availableTransactions.filter((item) => selectedIds.has(item.id)),
    [availableTransactions, selectedIds],
  );

  const totals = useMemo(() => {
    const subtotal = selectedItems.reduce(
      (sum, item) => sum + Number(item.amount ?? 0),
      0,
    );
    const clampedDiscount = Math.min(Math.max(Number(discountPercent) / 100, 0), 1);
    const discountValue = subtotal * clampedDiscount;
    const taxableBase = Math.max(subtotal - discountValue, 0);
    const tax = includeTax ? taxableBase * Number(taxRate ?? 0) : 0;
    const total = taxableBase + tax;
    return {
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(discountValue.toFixed(2)),
      taxableBase: Number(taxableBase.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2)),
      discountRate: clampedDiscount,
    };
  }, [selectedItems, taxRate, discountPercent, includeTax]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === accountId) ?? null,
    [accounts, accountId],
  );

  const invoiceHealth = useMemo(() => {
    if (!selectedItems.length) {
      return { disputed: 0, average: 0, highest: 0 };
    }
    const disputed = selectedItems.filter((item) => item.hasOpenDispute).length;
    const sum = selectedItems.reduce((accumulator, item) => accumulator + Number(item.amount ?? 0), 0);
    const highest = selectedItems.reduce(
      (accumulator, item) => Math.max(accumulator, Number(item.amount ?? 0)),
      0,
    );
    return {
      disputed,
      average: Number((sum / selectedItems.length).toFixed(2)),
      highest: Number(highest.toFixed(2)),
    };
  }, [selectedItems]);

  const paymentTermDays = useMemo(() => {
    const issue = new Date(issueDate);
    const due = new Date(dueDate);
    if (Number.isNaN(issue.getTime()) || Number.isNaN(due.getTime())) {
      return null;
    }
    const diff = Math.round((due.getTime() - issue.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : null;
  }, [issueDate, dueDate]);

  const readiness = useMemo(() => {
    const checks = [
      { key: 'items', label: 'Line items selected', satisfied: selectedItems.length > 0 },
      { key: 'account', label: 'Remittance account assigned', satisfied: Boolean(accountId) },
      {
        key: 'contact',
        label: 'Client contact captured',
        satisfied: Boolean((clientName && clientName.trim()) || (clientEmail && clientEmail.trim())),
      },
      {
        key: 'terms',
        label: paymentTermDays != null ? `Payment term · Net ${paymentTermDays} days` : 'Custom payment schedule',
        satisfied: paymentTermDays == null || paymentTermDays <= 60,
      },
      {
        key: 'disputes',
        label: 'No disputed transactions',
        satisfied: invoiceHealth.disputed === 0,
      },
    ];
    const satisfiedCount = checks.filter((check) => check.satisfied).length;
    const score = Math.round((satisfiedCount / checks.length) * 100);
    return { checks, score };
  }, [accountId, clientEmail, clientName, invoiceHealth.disputed, paymentTermDays, selectedItems.length]);

  const uniqueCounterparties = useMemo(() => {
    if (!selectedItems.length) {
      return 0;
    }
    const set = new Set();
    selectedItems.forEach((item) => {
      if (item.counterpartyId) {
        set.add(item.counterpartyId);
      } else if (item.counterpartyName) {
        set.add(item.counterpartyName);
      }
    });
    return set.size;
  }, [selectedItems]);

  const policySignals = useMemo(() => {
    const signals = [];

    const addSignal = (level, title, description) => {
      signals.push({ level, title, description });
    };

    if (paymentTermDays != null) {
      if (paymentTermDays > 60) {
        addSignal(
          'alert',
          'Payment term exceeds 60 days',
          'Shorten the net term or attach CFO approval before sending.',
        );
      } else if (paymentTermDays > 45) {
        addSignal(
          'caution',
          `Extended payment term · Net ${paymentTermDays} days`,
          'Confirm the client accepted this schedule or consider tighter terms.',
        );
      }
    }

    if (invoiceHealth.disputed > 0) {
      addSignal(
        'alert',
        'Disputed transactions selected',
        'Resolve open disputes or remove flagged lines before generating an invoice.',
      );
    }

    if (discountPercent > 20) {
      addSignal(
        'caution',
        `High discount applied (${discountPercent.toFixed(1)}%)`,
        'Document approval for discounts above 20% to satisfy finance controls.',
      );
    }

    if (includeTax) {
      if (!taxRate) {
        addSignal('caution', 'Tax enabled without a rate', 'Set a tax rate or disable tax before sending.');
      }
    } else if (selectedItems.length) {
      addSignal(
        'caution',
        'Tax excluded on invoice',
        'Confirm tax-free treatment is compliant for this client and jurisdiction.',
      );
    }

    if (uniqueCounterparties > 1) {
      addSignal(
        'positive',
        'Multiple counterparties covered',
        'Preview groups line items from several partners—include summary copy for clarity.',
      );
    }

    if (signals.every((signal) => signal.level !== 'alert') && readiness.score >= 80) {
      addSignal(
        'positive',
        'Checklist cleared',
        'Readiness score meets the 80% threshold—invoice is primed for review.',
      );
    }

    const alertCount = signals.filter((signal) => signal.level === 'alert').length;
    const cautionCount = signals.filter((signal) => signal.level === 'caution').length;
    const positiveCount = signals.filter((signal) => signal.level === 'positive').length;

    return { signals, alertCount, cautionCount, positiveCount };
  }, [
    discountPercent,
    includeTax,
    invoiceHealth.disputed,
    paymentTermDays,
    readiness.score,
    selectedItems.length,
    taxRate,
    uniqueCounterparties,
  ]);

  const handleToggleItem = (itemId) => {
    setFormError(null);
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
    setFormError(null);
    if (selectedIds.size === availableTransactions.length) {
      setSelectedIds(new Set());
      return;
    }
    const allIds = new Set(availableTransactions.map((item) => item.id));
    setSelectedIds(allIds);
    if (!clientName && availableTransactions.length) {
      setClientName(deriveClientName(availableTransactions));
    }
    if (!clientEmail) {
      const withEmail = availableTransactions.find((item) => item.counterpartyEmail);
      if (withEmail?.counterpartyEmail) {
        setClientEmail(withEmail.counterpartyEmail);
      }
    }
  };

  const handleIssueDateChange = (value) => {
    setIssueDate(value);
    const option = PAYMENT_TERMS.find((term) => term.key === paymentTerm);
    if (option) {
      const recalculated = addDays(value, option.days);
      if (recalculated !== dueDate) {
        setDueDate(recalculated);
      }
    }
  };

  const handlePaymentTermSelect = (option) => {
    setPaymentTerm(option.key);
    const recalculated = addDays(issueDate, option.days);
    setDueDate(recalculated);
  };

  const handleDueDateChange = (value) => {
    setDueDate(value);
    const issue = new Date(issueDate);
    const due = new Date(value);
    if (Number.isNaN(issue.getTime()) || Number.isNaN(due.getTime())) {
      setPaymentTerm('custom');
      return;
    }
    const diff = Math.round((due.getTime() - issue.getTime()) / (1000 * 60 * 60 * 24));
    const matched = PAYMENT_TERMS.find((option) => option.days === diff);
    setPaymentTerm(matched ? matched.key : 'custom');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selectedItems.length) {
      setFormError('Select at least one transaction to generate an invoice.');
      return;
    }
    const issue = new Date(issueDate);
    const due = new Date(dueDate);
    if (Number.isNaN(issue.getTime()) || Number.isNaN(due.getTime())) {
      setFormError('Provide valid issue and due dates.');
      return;
    }
    if (due.getTime() < issue.getTime()) {
      setFormError('Due date cannot be before the issue date.');
      return;
    }
    if (!accountId) {
      setFormError('Choose a remittance account.');
      return;
    }
    setFormError(null);
    const payload = {
      invoiceNumber,
      issueDate,
      dueDate,
      clientName: clientName || deriveClientName(selectedItems),
      accountId,
      notes: notes?.trim() ? notes.trim() : undefined,
      taxRate: includeTax ? Number(taxRate) : 0,
      sendCopy,
      currency,
      clientEmail: clientEmail.trim() ? clientEmail.trim() : undefined,
      includeTax,
      paymentTerm,
      paymentTermDays,
      discountRate: totals.discountRate,
      lineItems: selectedItems.map((item) => ({
        transactionId: item.transactionId ?? item.id,
        reference: item.reference,
        description: item.label,
        amount: Number(item.amount ?? 0),
        currencyCode: item.currencyCode ?? currency,
        counterpartyId: item.counterpartyId ?? null,
      })),
      totals: {
        subtotal: totals.subtotal,
        discount: totals.discount,
        taxableBase: totals.taxableBase,
        tax: totals.tax,
        total: totals.total,
      },
    };
    onGenerate(payload);
  };

  const invoicePreviewClient = useMemo(
    () => clientName || deriveClientName(selectedItems) || 'Client name',
    [clientName, selectedItems],
  );

  useEffect(() => {
    if (!clientName && selectedItems.length) {
      setClientName(deriveClientName(selectedItems));
    }
  }, [clientName, selectedItems]);

  useEffect(() => {
    if (!clientEmail && selectedItems.length) {
      const withEmail = selectedItems.find((item) => item.counterpartyEmail);
      if (withEmail?.counterpartyEmail) {
        setClientEmail(withEmail.counterpartyEmail);
      }
    }
  }, [clientEmail, selectedItems]);

  useEffect(() => {
    const option = PAYMENT_TERMS.find((term) => term.key === paymentTerm);
    if (!option) {
      return;
    }
    const recalculated = addDays(issueDate, option.days);
    if (recalculated !== dueDate) {
      setDueDate(recalculated);
    }
  }, [issueDate, paymentTerm, dueDate]);

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
                  onChange={(event) => handleIssueDateChange(event.target.value)}
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
                  onChange={(event) => handleDueDateChange(event.target.value)}
                  required
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <div className="md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment terms</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {PAYMENT_TERMS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => handlePaymentTermSelect(option)}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                        paymentTerm === option.key
                          ? 'bg-blue-600 text-white shadow'
                          : 'border border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    {paymentTermDays != null ? `Net ${paymentTermDays} days` : 'Custom schedule'}
                  </span>
                </div>
              </div>
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
                Client email
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(event) => setClientEmail(event.target.value)}
                  placeholder="billing@orbitlabs.com"
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="text-sm text-slate-600">
                Tax rate
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="0.5"
                    value={taxRate}
                    onChange={(event) => setTaxRate(Number(event.target.value))}
                    disabled={!includeTax}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  />
                  <label className="flex items-center gap-2 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={includeTax}
                      onChange={(event) => setIncludeTax(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Include tax
                  </label>
                </div>
              </label>
              <label className="text-sm text-slate-600">
                Discount (%)
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(event) => setDiscountPercent(Number(event.target.value))}
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
                <dt>Discount</dt>
                <dd className="font-medium text-emerald-700">-{formatCurrency(totals.discount, currency)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Taxable base</dt>
                <dd className="font-medium text-slate-900">{formatCurrency(totals.taxableBase, currency)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>
                  Tax
                  {includeTax ? ` (${Number(taxRate * 100).toFixed(1)}%)` : ''}
                </dt>
                <dd className="font-medium text-slate-900">
                  {includeTax ? formatCurrency(totals.tax, currency) : '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                <dt>Total due</dt>
                <dd>{formatCurrency(totals.total, currency)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-slate-500">
              {paymentTermDays != null
                ? `Net ${paymentTermDays} days${paymentTerm === 'custom' ? ' (custom)' : ''}`
                : 'Custom payment schedule'}
              {includeTax ? ' · Tax included' : ' · Tax excluded'}
            </p>
            {formError ? <p className="mt-3 text-sm text-rose-600">{formError}</p> : null}
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
              {paymentTermDays != null ? ` · Net ${paymentTermDays} days` : ''}
            </p>
            {clientEmail ? (
              <p className="mt-1 text-xs text-slate-500">Send to {clientEmail}</p>
            ) : null}
            {selectedAccount ? (
              <p className="text-xs text-slate-500">
                Remit to {selectedAccount.displayName ?? selectedAccount.name ?? `Account #${selectedAccount.id}`}
              </p>
            ) : null}
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {selectedItems.length ? (
                selectedItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-500">
                        #{item.reference}
                        {item.counterpartyName ? ` · ${item.counterpartyName}` : ''}
                      </p>
                      {item.hasOpenDispute ? (
                        <span className="mt-1 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-600">
                          Dispute flagged
                        </span>
                      ) : null}
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
            <h4 className="text-sm font-semibold text-slate-900">Invoice health</h4>
            <dl className="mt-3 space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <dt>Disputed line items</dt>
                <dd className="font-medium text-slate-900">{invoiceHealth.disputed}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Average line value</dt>
                <dd className="font-medium text-slate-900">{formatCurrency(invoiceHealth.average, currency)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Largest line item</dt>
                <dd className="font-medium text-slate-900">{formatCurrency(invoiceHealth.highest, currency)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
            <h4 className="text-sm font-semibold text-emerald-700">Send readiness</h4>
            <p className="mt-2 text-sm text-emerald-700">{readiness.score}% of checklist items cleared.</p>
            <ul className="mt-3 space-y-2 text-xs">
              {readiness.checks.map((check) => (
                <li
                  key={check.key}
                  className={`flex items-center justify-between rounded-2xl border px-3 py-2 ${
                    check.satisfied
                      ? 'border-emerald-200 bg-white/70 text-emerald-700'
                      : 'border-amber-200 bg-amber-50/70 text-amber-700'
                  }`}
                >
                  <span className="font-semibold">{check.label}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide">
                    {check.satisfied ? 'Ready' : 'Review'}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-violet-200 bg-violet-50/80 p-4">
            <h4 className="text-sm font-semibold text-violet-700">Policy signals</h4>
            <p className="mt-2 text-sm text-violet-700">
              {policySignals.signals.length
                ? `${policySignals.alertCount} alert${policySignals.alertCount === 1 ? '' : 's'} · ${policySignals.cautionCount} caution${policySignals.cautionCount === 1 ? '' : 's'} · ${policySignals.positiveCount} positive insight${policySignals.positiveCount === 1 ? '' : 's'}.`
                : 'Policy guardrails populate once you select transactions and configure invoice details.'}
            </p>
            <ul className="mt-3 space-y-2 text-xs text-slate-600">
              {policySignals.signals.length ? (
                policySignals.signals.map((signal, index) => (
                  <li
                    key={`${signal.title}-${index}`}
                    className={`rounded-2xl border px-3 py-2 text-sm ${SIGNAL_TONES[signal.level] ?? 'border-slate-200 bg-white text-slate-600'}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide">{signal.title}</p>
                    <p className="text-xs text-slate-600">{signal.description}</p>
                  </li>
                ))
              ) : (
                <li className="rounded-2xl border border-dashed border-violet-200 px-3 py-6 text-center text-xs text-violet-700">
                  Select transactions to surface compliance and billing guidance.
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
                        #{item.reference} · {item.counterpartyName ?? 'Unassigned'}
                      </span>
                      <span className="block text-xs text-slate-500">
                        Released {item.releasedAt ? formatAbsolute(item.releasedAt, { dateStyle: 'medium' }) : 'recently'}
                      </span>
                      {item.hasOpenDispute ? (
                        <span className="mt-1 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-600">
                          Dispute flagged
                        </span>
                      ) : null}
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatCurrency(item.amount, item.currencyCode ?? currency)}
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleItem(item.id)}
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
      counterpartyEmail: PropTypes.string,
      hasOpenDispute: PropTypes.bool,
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
