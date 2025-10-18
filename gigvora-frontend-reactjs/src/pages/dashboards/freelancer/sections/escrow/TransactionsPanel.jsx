import { useMemo, useState } from 'react';
import {
  ArrowUpCircleIcon,
  ArrowUturnLeftIcon,
  ClockIcon,
  DocumentPlusIcon,
} from '@heroicons/react/24/outline';
import SlideOver from './components/SlideOver.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'in_escrow', label: 'Escrow' },
  { value: 'funded', label: 'Funded' },
  { value: 'released', label: 'Released' },
  { value: 'disputed', label: 'Disputed' },
  { value: 'refunded', label: 'Refunded' },
];

function formatMoney(amount, currencyCode = 'USD') {
  if (amount == null) {
    return '—';
  }
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode }).format(Number(amount));
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function TransactionForm({ accounts, onSubmit, submitting }) {
  const hasAccounts = accounts.length > 0;

  const [form, setForm] = useState({
    accountId: hasAccounts ? accounts[0]?.id ?? '' : '',
    reference: '',
    amount: '',
    feeAmount: '',
    counterpartyId: '',
    milestoneLabel: '',
    scheduledReleaseAt: '',
  });

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.accountId) return;
    if (!hasAccounts) return;
    onSubmit({
      accountId: Number(form.accountId),
      reference: form.reference,
      amount: Number(form.amount),
      feeAmount: form.feeAmount ? Number(form.feeAmount) : 0,
      counterpartyId: form.counterpartyId ? Number(form.counterpartyId) : undefined,
      milestoneLabel: form.milestoneLabel,
      scheduledReleaseAt: form.scheduledReleaseAt ? new Date(form.scheduledReleaseAt).toISOString() : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-sm font-medium text-slate-700">
          Account
          <select
            value={form.accountId}
            onChange={(event) => updateField('accountId', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            required
            disabled={!hasAccounts}
          >
            {hasAccounts ? (
              accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.metadata?.accountLabel || `Account ${account.id}`}
                </option>
              ))
            ) : (
              <option value="">No account</option>
            )}
          </select>
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-700">
          Reference
          <input
            type="text"
            value={form.reference}
            onChange={(event) => updateField('reference', event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-sm font-medium text-slate-700">
          Amount
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(event) => updateField('amount', event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-700">
          Fee
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.feeAmount}
            onChange={(event) => updateField('feeAmount', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-sm font-medium text-slate-700">
          Client ID
          <input
            type="number"
            value={form.counterpartyId}
            onChange={(event) => updateField('counterpartyId', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-700">
          Milestone
          <input
            type="text"
            value={form.milestoneLabel}
            onChange={(event) => updateField('milestoneLabel', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          />
        </label>
      </div>
      <label className="flex flex-col text-sm font-medium text-slate-700">
        Release date
        <input
          type="datetime-local"
          value={form.scheduledReleaseAt}
          onChange={(event) => updateField('scheduledReleaseAt', event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
        />
      </label>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting || !hasAccounts}
          className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {submitting ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

export default function TransactionsPanel({
  accounts,
  transactions,
  onCreate,
  onRelease,
  onRefund,
  loading,
  actionState,
}) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const filteredTransactions = useMemo(() => {
    const list = [...transactions];
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    if (statusFilter === 'all') {
      return list;
    }
    return list.filter((txn) => txn.status === statusFilter);
  }, [transactions, statusFilter]);

  const openDetails = (txn) => {
    setSelected(txn);
    setDrawerOpen(true);
  };

  const confirmAction = (type) => {
    if (!selected) return;
    setConfirm({ type, open: true });
  };

  const executeAction = async () => {
    if (!selected || !confirm) return;
    if (confirm.type === 'release') {
      await onRelease(selected.id);
    } else if (confirm.type === 'refund') {
      await onRefund(selected.id);
    }
    setConfirm(null);
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 rounded-full bg-slate-100 p-1">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatusFilter(option.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                statusFilter === option.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
        >
          <DocumentPlusIcon className="h-4 w-4" />
          New
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Reference</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Release</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTransactions.map((txn) => (
              <tr
                key={txn.id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => openDetails(txn)}
              >
                <td className="px-6 py-4 text-sm font-semibold text-slate-900">{txn.reference}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{formatMoney(txn.netAmount ?? txn.amount, txn.currencyCode)}</td>
                <td className="px-6 py-4 text-sm capitalize text-slate-600">{txn.status?.replace('_', ' ')}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{formatDate(txn.scheduledReleaseAt)}</td>
              </tr>
            ))}
            {!filteredTransactions.length && !loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">
                  No transactions yet. Start by funding your first milestone.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <SlideOver
        open={drawerOpen && Boolean(selected)}
        onClose={() => setDrawerOpen(false)}
        title={selected?.reference ?? 'Transaction'}
        description={selected ? `Status: ${selected.status?.replace('_', ' ')}` : ''}
      >
        {selected ? (
          <div className="space-y-6 text-sm text-slate-600">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {formatMoney(selected.amount, selected.currencyCode)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Net</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {formatMoney(selected.netAmount ?? selected.amount, selected.currencyCode)}
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Client ID</p>
                <p className="mt-1 font-semibold text-slate-900">{selected.counterpartyId ?? '—'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Milestone</p>
                <p className="mt-1 font-semibold text-slate-900">{selected.milestoneLabel || '—'}</p>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timeline</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {(selected.auditTrail || []).map((entry, index) => (
                  <li key={`${entry.action}-${index}`} className="flex items-start gap-3">
                    <ClockIcon className="mt-0.5 h-4 w-4 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-900">{entry.action?.replace('_', ' ')}</p>
                      <p className="text-xs text-slate-500">{formatDate(entry.at || entry.occurredAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-3">
              {selected.releaseEligible ? (
                <button
                  type="button"
                  onClick={() => confirmAction('release')}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  <ArrowUpCircleIcon className="h-5 w-5" />
                  Release
                </button>
              ) : null}
              {selected.status !== 'released' ? (
                <button
                  type="button"
                  onClick={() => confirmAction('refund')}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-rose-400 bg-white px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <ArrowUturnLeftIcon className="h-5 w-5" />
                  Refund
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </SlideOver>

      <SlideOver
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="New transaction"
        description="Fund a milestone from this workspace."
        wide
      >
        <TransactionForm
          accounts={accounts}
          onSubmit={async (payload) => {
            await onCreate(payload);
            setFormOpen(false);
          }}
          submitting={actionState.status === 'pending'}
        />
      </SlideOver>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={confirm?.type === 'release' ? 'Release funds' : 'Refund funds'}
        message={
          confirm?.type === 'release'
            ? 'Confirm you want to release the funds to the freelancer.'
            : 'Confirm you want to send the funds back to the client.'
        }
        confirmLabel={confirm?.type === 'release' ? 'Release' : 'Refund'}
        onConfirm={executeAction}
        loading={actionState.status === 'pending'}
      />
    </div>
  );
}
