import { useState } from 'react';
import PropTypes from 'prop-types';

function parseAmount(value, { allowEmpty = false } = {}) {
  if (value === '' && allowEmpty) {
    return undefined;
  }
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('Enter a valid amount.');
  }
  return Number.parseFloat(amount.toFixed(2));
}

function parseMetadata(value) {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error('Metadata must be valid JSON.');
  }
}

export default function EscrowTransactionForm({
  mode,
  accounts,
  transactionTypes,
  defaultCurrency,
  userId,
  transaction,
  onSubmit,
  submitting,
}) {
  const [form, setForm] = useState(() => ({
    accountId: transaction?.accountId ? String(transaction.accountId) : accounts[0]?.id ? String(accounts[0].id) : '',
    reference: transaction?.reference ?? '',
    amount: transaction?.amount != null ? String(transaction.amount) : '',
    feeAmount: transaction?.feeAmount != null ? String(transaction.feeAmount) : '',
    currencyCode: transaction?.currencyCode ?? defaultCurrency ?? 'USD',
    type: transaction?.type ?? transactionTypes[0] ?? 'project',
    initiatedById: transaction?.initiatedById ? String(transaction.initiatedById) : userId ? String(userId) : '',
    counterpartyId: transaction?.counterpartyId ? String(transaction.counterpartyId) : '',
    milestoneLabel: transaction?.milestoneLabel ?? '',
    scheduledReleaseAt: transaction?.scheduledReleaseAt ? transaction.scheduledReleaseAt.slice(0, 16) : '',
    metadata: transaction?.metadata ? JSON.stringify(transaction.metadata, null, 2) : '',
  }));
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (!form.accountId) {
        throw new Error('Select an account.');
      }
      if (!form.reference) {
        throw new Error('Reference is required.');
      }
      const payload = {
        accountId: Number.parseInt(form.accountId, 10),
        reference: form.reference,
        amount: parseAmount(form.amount),
        feeAmount: form.feeAmount ? parseAmount(form.feeAmount, { allowEmpty: false }) : undefined,
        currencyCode: form.currencyCode,
        type: form.type,
        initiatedById: form.initiatedById ? Number.parseInt(form.initiatedById, 10) : undefined,
        counterpartyId: form.counterpartyId ? Number.parseInt(form.counterpartyId, 10) : undefined,
        milestoneLabel: form.milestoneLabel || undefined,
        scheduledReleaseAt: form.scheduledReleaseAt ? new Date(form.scheduledReleaseAt).toISOString() : undefined,
        metadata: form.metadata ? parseMetadata(form.metadata) : null,
      };
      await onSubmit(payload);
    } catch (err) {
      setError(err.message ?? 'Unable to save transaction.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Account
          <select
            name="accountId"
            value={form.accountId}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.provider} · {account.currencyCode} · #{account.id}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Type
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {transactionTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Reference
          <input
            type="text"
            name="reference"
            value={form.reference}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Amount
          <input
            type="number"
            step="0.01"
            min="0"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Fee
          <input
            type="number"
            step="0.01"
            min="0"
            name="feeAmount"
            value={form.feeAmount}
            onChange={handleChange}
            placeholder="0.00"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Currency
          <input
            type="text"
            name="currencyCode"
            value={form.currencyCode}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Initiated by
          <input
            type="number"
            name="initiatedById"
            value={form.initiatedById}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Counterparty
          <input
            type="number"
            name="counterpartyId"
            value={form.counterpartyId}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Milestone
          <input
            type="text"
            name="milestoneLabel"
            value={form.milestoneLabel}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Release date
          <input
            type="datetime-local"
            name="scheduledReleaseAt"
            value={form.scheduledReleaseAt}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm text-slate-700">
        Metadata
        <textarea
          name="metadata"
          value={form.metadata}
          onChange={handleChange}
          rows={6}
          placeholder={`{\n  "note": "Milestone 1"\n}`}
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </label>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded-2xl border border-blue-200 bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition hover:border-blue-300 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Saving…' : mode === 'create' ? 'Create transaction' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

EscrowTransactionForm.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  accounts: PropTypes.arrayOf(PropTypes.object),
  transactionTypes: PropTypes.arrayOf(PropTypes.string),
  defaultCurrency: PropTypes.string,
  userId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  transaction: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};

EscrowTransactionForm.defaultProps = {
  accounts: [],
  transactionTypes: ['project', 'milestone', 'retainer', 'invoice', 'subscription'],
  defaultCurrency: 'USD',
  userId: null,
  transaction: null,
  submitting: false,
};
