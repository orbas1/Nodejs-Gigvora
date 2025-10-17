import { useState } from 'react';
import PropTypes from 'prop-types';
import { formatAbsolute } from '../../utils/date.js';

const TRANSACTION_TYPES = [
  { value: 'deposit', label: 'Deposit' },
  { value: 'release', label: 'Release' },
  { value: 'refund', label: 'Refund' },
  { value: 'fee', label: 'Fee' },
  { value: 'adjustment', label: 'Adjustment' },
];

const TRANSACTION_DIRECTIONS = [
  { value: 'credit', label: 'Credit' },
  { value: 'debit', label: 'Debit' },
];

const INITIAL_TRANSACTION_FORM = {
  type: 'deposit',
  amount: '',
  currency: 'USD',
  reference: '',
  direction: 'credit',
  description: '',
};

const INITIAL_SETTINGS_FORM = (account) => ({
  currency: account?.currency ?? 'USD',
  autoReleaseDays: account?.autoReleaseDays ?? 14,
});

function EscrowManagementPanel({ account, transactions, onCreateTransaction, onUpdateSettings, canManage }) {
  const [transactionForm, setTransactionForm] = useState(() => INITIAL_TRANSACTION_FORM);
  const [transactionSubmitting, setTransactionSubmitting] = useState(false);
  const [transactionFeedback, setTransactionFeedback] = useState(null);

  const [settingsForm, setSettingsForm] = useState(() => INITIAL_SETTINGS_FORM(account));
  const [settingsSubmitting, setSettingsSubmitting] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState(null);

  const handleTransactionChange = (event) => {
    const { name, value } = event.target;
    setTransactionForm((current) => ({ ...current, [name]: value }));
  };

  const handleTransactionSubmit = async (event) => {
    event.preventDefault();
    if (!onCreateTransaction) return;
    setTransactionSubmitting(true);
    setTransactionFeedback(null);
    try {
      await onCreateTransaction({
        type: transactionForm.type,
        amount: transactionForm.amount ? Number(transactionForm.amount) : undefined,
        currency: transactionForm.currency,
        reference: transactionForm.reference || undefined,
        direction: transactionForm.direction,
        description: transactionForm.description || undefined,
      });
      setTransactionFeedback({ tone: 'success', message: 'Transaction recorded.' });
      setTransactionForm(INITIAL_TRANSACTION_FORM);
    } catch (error) {
      setTransactionFeedback({ tone: 'error', message: error?.message ?? 'Unable to record transaction.' });
    } finally {
      setTransactionSubmitting(false);
    }
  };

  const handleSettingsChange = (event) => {
    const { name, value } = event.target;
    setSettingsForm((current) => ({ ...current, [name]: value }));
  };

  const handleSettingsSubmit = async (event) => {
    event.preventDefault();
    if (!onUpdateSettings) return;
    setSettingsSubmitting(true);
    setSettingsFeedback(null);
    try {
      await onUpdateSettings({
        currency: settingsForm.currency,
        autoReleaseDays: Number(settingsForm.autoReleaseDays),
      });
      setSettingsFeedback({ tone: 'success', message: 'Settings updated.' });
    } catch (error) {
      setSettingsFeedback({ tone: 'error', message: error?.message ?? 'Unable to update settings.' });
    } finally {
      setSettingsSubmitting(false);
    }
  };

  const balance = account?.balance != null ? Number(account.balance).toLocaleString('en-GB', { minimumFractionDigits: 2 }) : '0.00';

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Escrow</h3>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-right text-sm text-emerald-700">
          <p className="text-xs uppercase tracking-wide text-emerald-600">Balance</p>
          <p className="text-lg font-semibold text-emerald-700">
            {account?.currency ?? 'USD'} {balance}
          </p>
          {account?.autoReleaseDays != null ? (
            <p className="text-xs text-emerald-600">Auto-release after {account.autoReleaseDays} days</p>
          ) : null}
        </div>
      </div>

      {settingsFeedback ? (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            settingsFeedback.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {settingsFeedback.message}
        </div>
      ) : null}
      {transactionFeedback ? (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            transactionFeedback.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {transactionFeedback.message}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,320px)_minmax(0,320px)_1fr]">
        <form className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4" onSubmit={handleSettingsSubmit}>
          <span className="text-sm font-semibold text-slate-700">Settings</span>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Currency
            <select
              name="currency"
              value={settingsForm.currency}
              onChange={handleSettingsChange}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              disabled={!canManage || settingsSubmitting}
            >
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Auto-release days
            <input
              type="number"
              min="1"
              name="autoReleaseDays"
              value={settingsForm.autoReleaseDays}
              onChange={handleSettingsChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              disabled={!canManage || settingsSubmitting}
            />
          </label>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-600"
            disabled={!canManage || settingsSubmitting}
          >
            {settingsSubmitting ? 'Saving…' : 'Save settings'}
          </button>
        </form>

        <form className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4" onSubmit={handleTransactionSubmit}>
          <span className="text-sm font-semibold text-slate-700">New transaction</span>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Type
            <select
              name="type"
              value={transactionForm.type}
              onChange={handleTransactionChange}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              disabled={!canManage || transactionSubmitting}
            >
              {TRANSACTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Amount
              <input
                type="number"
                min="0"
                name="amount"
                value={transactionForm.amount}
                onChange={handleTransactionChange}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="1500"
                disabled={!canManage || transactionSubmitting}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Currency
              <select
                name="currency"
                value={transactionForm.currency}
                onChange={handleTransactionChange}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                disabled={!canManage || transactionSubmitting}
              >
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Direction
            <select
              name="direction"
              value={transactionForm.direction}
              onChange={handleTransactionChange}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              disabled={!canManage || transactionSubmitting}
            >
              {TRANSACTION_DIRECTIONS.map((direction) => (
                <option key={direction.value} value={direction.value}>
                  {direction.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Reference
            <input
              name="reference"
              value={transactionForm.reference}
              onChange={handleTransactionChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Invoice #123"
              disabled={!canManage || transactionSubmitting}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Notes
            <textarea
              name="description"
              value={transactionForm.description}
              onChange={handleTransactionChange}
              className="min-h-[96px] rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Context"
              disabled={!canManage || transactionSubmitting}
            />
          </label>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-600"
            disabled={!canManage || transactionSubmitting}
          >
            {transactionSubmitting ? 'Saving…' : 'Record transaction'}
          </button>
        </form>

        <div className="space-y-4">
          {transactions.length ? (
            transactions.map((transaction) => (
              <div key={transaction.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{transaction.type?.replace(/_/g, ' ') ?? 'Transaction'}</p>
                    <p className="text-xs text-slate-500">
                      {transaction.direction?.replace(/_/g, ' ') ?? 'credit'} · {transaction.currency ?? 'USD'}{' '}
                      {transaction.amount != null ? Number(transaction.amount).toLocaleString() : '—'}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {transaction.status?.replace(/_/g, ' ') ?? 'pending'}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>{transaction.occurredAt ? formatAbsolute(transaction.occurredAt) : '—'}</span>
                  <span>{transaction.reference || 'No reference'}</span>
                </div>
                {transaction.description ? (
                  <p className="mt-3 text-sm text-slate-600">{transaction.description}</p>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
              No transactions yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

EscrowManagementPanel.propTypes = {
  account: PropTypes.object,
  transactions: PropTypes.array.isRequired,
  onCreateTransaction: PropTypes.func,
  onUpdateSettings: PropTypes.func,
  canManage: PropTypes.bool,
};

EscrowManagementPanel.defaultProps = {
  account: {},
  onCreateTransaction: undefined,
  onUpdateSettings: undefined,
  canManage: false,
};

export default EscrowManagementPanel;
