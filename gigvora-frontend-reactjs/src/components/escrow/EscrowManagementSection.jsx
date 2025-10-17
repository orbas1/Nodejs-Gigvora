import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  createEscrowAccount,
  updateEscrowAccount,
  initiateEscrowTransaction,
  updateEscrowTransaction,
  releaseEscrow,
  refundEscrow,
  createDispute,
} from '../../services/trust.js';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';
import EscrowSummaryGrid from './EscrowSummaryGrid.jsx';
import EscrowAccountBoard from './EscrowAccountBoard.jsx';
import EscrowActivityBoard from './EscrowActivityBoard.jsx';
import EscrowQueueBoard from './EscrowQueueBoard.jsx';
import EscrowDisputeBoard from './EscrowDisputeBoard.jsx';
import EscrowDrawer from './EscrowDrawer.jsx';
import EscrowAccountForm from './EscrowAccountForm.jsx';
import EscrowTransactionForm from './EscrowTransactionForm.jsx';
import EscrowDisputeForm from './EscrowDisputeForm.jsx';

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

function formatStatus(value) {
  if (!value) return 'Unknown';
  return value
    .toString()
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function ActionNotesForm({ label, submitting, onSubmit }) {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await onSubmit({ notes: notes || undefined });
    } catch (err) {
      setError(err.message ?? 'Action failed.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="flex flex-col gap-2 text-sm text-slate-700">
        Notes
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={5}
          placeholder="Optional release note"
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
          {submitting ? 'Processing…' : label}
        </button>
      </div>
    </form>
  );
}

ActionNotesForm.propTypes = {
  label: PropTypes.string.isRequired,
  submitting: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
};

ActionNotesForm.defaultProps = {
  submitting: false,
};

function AccountDetails({ account }) {
  const metadata = account?.metadata ? JSON.stringify(account.metadata, null, 2) : null;
  return (
    <div className="space-y-4 text-sm text-slate-700">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <p className="text-base font-semibold text-slate-900">
          {account.provider} · {account.currencyCode}
        </p>
        <p className="text-xs text-slate-500">Account #{account.id}</p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</dt>
          <dd className="mt-1 font-medium text-slate-900">{formatStatus(account.status)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Balance</dt>
          <dd className="mt-1 font-medium text-slate-900">
            {formatCurrency(account.currentBalance ?? 0, account.currencyCode)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending</dt>
          <dd className="mt-1 font-medium text-slate-900">
            {formatCurrency(account.pendingReleaseTotal ?? 0, account.currencyCode)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reconciled</dt>
          <dd className="mt-1 font-medium text-slate-900">
            {account.lastReconciledAt ? formatAbsolute(account.lastReconciledAt, { dateStyle: 'medium' }) : '—'}
          </dd>
        </div>
        {account.externalId ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">External ID</dt>
            <dd className="mt-1 font-medium text-slate-900">{account.externalId}</dd>
          </div>
        ) : null}
        {account.walletAccountId ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wallet ID</dt>
            <dd className="mt-1 font-medium text-slate-900">{account.walletAccountId}</dd>
          </div>
        ) : null}
      </dl>
      {metadata ? (
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Metadata</dt>
          <pre className="mt-2 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white/80 p-4 text-xs text-slate-600">
            {metadata}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

AccountDetails.propTypes = {
  account: PropTypes.object.isRequired,
};

function TransactionDetails({ transaction, currency }) {
  const metadata = transaction?.metadata ? JSON.stringify(transaction.metadata, null, 2) : null;
  return (
    <div className="space-y-4 text-sm text-slate-700">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <p className="text-base font-semibold text-slate-900">{transaction.reference}</p>
        <p className="text-xs text-slate-500">Transaction #{transaction.id}</p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</dt>
          <dd className="mt-1 font-medium text-slate-900">{formatStatus(transaction.status)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</dt>
          <dd className="mt-1 font-medium text-slate-900">
            {formatCurrency(transaction.amount ?? 0, transaction.currencyCode ?? currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Net</dt>
          <dd className="mt-1 font-medium text-slate-900">
            {formatCurrency(transaction.netAmount ?? transaction.amount ?? 0, transaction.currencyCode ?? currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</dt>
          <dd className="mt-1 font-medium text-slate-900">{formatStatus(transaction.type)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created</dt>
          <dd className="mt-1 font-medium text-slate-900">
            {transaction.createdAt ? formatAbsolute(transaction.createdAt, { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Updated</dt>
          <dd className="mt-1 font-medium text-slate-900">
            {transaction.updatedAt ? formatRelativeTime(transaction.updatedAt) : '—'}
          </dd>
        </div>
      </dl>
      {metadata ? (
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Metadata</dt>
          <pre className="mt-2 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white/80 p-4 text-xs text-slate-600">
            {metadata}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

TransactionDetails.propTypes = {
  transaction: PropTypes.object.isRequired,
  currency: PropTypes.string.isRequired,
};

function DisputeDetails({ dispute }) {
  return (
    <div className="space-y-4 text-sm text-slate-700">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
        <p className="text-base font-semibold text-amber-700">{dispute.reasonCode.replace(/_/g, ' ')}</p>
        <p className="text-xs text-amber-600">Dispute #{dispute.id}</p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</dt>
          <dd className="mt-1 font-medium text-slate-900">{formatStatus(dispute.status)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stage</dt>
          <dd className="mt-1 font-medium text-slate-900">{formatStatus(dispute.stage)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</dt>
          <dd className="mt-1 font-medium text-slate-900">{formatStatus(dispute.priority)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Opened</dt>
          <dd className="mt-1 font-medium text-slate-900">
            {dispute.openedAt ? formatAbsolute(dispute.openedAt, { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
          </dd>
        </div>
      </dl>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</dt>
        <p className="mt-2 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-700">{dispute.summary}</p>
      </div>
    </div>
  );
}

DisputeDetails.propTypes = {
  dispute: PropTypes.object.isRequired,
};

export default function EscrowManagementSection({
  data,
  userId,
  onRefresh,
  activeView,
  onViewChange,
}) {
  const summary = data?.summary ?? {};
  const permissions = data?.permissions ?? {};
  const forms = data?.forms ?? {};
  const defaultCurrency = summary.currency ?? forms.defaultCurrency ?? 'USD';

  const accounts = useMemo(() => (Array.isArray(data?.accounts) ? data.accounts : []), [data?.accounts]);
  const transactions = useMemo(
    () => (Array.isArray(data?.transactions?.recent) ? data.transactions.recent : []),
    [data?.transactions?.recent],
  );
  const releaseQueue = useMemo(
    () => (Array.isArray(data?.transactions?.releaseQueue) ? data.transactions.releaseQueue : []),
    [data?.transactions?.releaseQueue],
  );
  const disputes = useMemo(
    () => (Array.isArray(data?.transactions?.disputes) ? data.transactions.disputes : []),
    [data?.transactions?.disputes],
  );

  const accountLookup = useMemo(() => {
    const map = new Map();
    accounts.forEach((account) => {
      map.set(account.id, {
        ...account,
        displayName: `${account.provider} · ${account.currencyCode} · #${account.id}`,
      });
    });
    return map;
  }, [accounts]);

  const enrichedTransactions = useMemo(
    () =>
      transactions.map((transaction) => ({
        ...transaction,
        account: accountLookup.get(transaction.accountId) ?? transaction.account ?? null,
      })),
    [transactions, accountLookup],
  );

  const [internalView, setInternalView] = useState('overview');
  const currentView = activeView ?? internalView;
  const setView = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
    if (activeView == null) {
      setInternalView(view);
    }
  };

  const [drawer, setDrawer] = useState({ type: null, payload: null });
  const [feedback, setFeedback] = useState(null);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    if (!feedback || typeof window === 'undefined') {
      return undefined;
    }
    const timeout = window.setTimeout(() => setFeedback(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const closeDrawer = () => {
    setDrawer({ type: null, payload: null });
    setProcessing(null);
  };

  const handleActionSuccess = async (message) => {
    setProcessing(null);
    setDrawer({ type: null, payload: null });
    setFeedback({ tone: 'success', message });
    if (typeof onRefresh === 'function') {
      await onRefresh();
    }
  };

  const handleActionError = (error, fallbackMessage) => {
    const message = error?.message ?? fallbackMessage;
    const failure = error instanceof Error ? error : new Error(message);
    setProcessing(null);
    setFeedback({ tone: 'error', message });
    throw failure;
  };

  const handleCreateAccount = async (payload) => {
    if (!permissions.canCreateAccount) {
      throw new Error('Account creation not allowed.');
    }
    setProcessing('account');
    try {
      await createEscrowAccount({ ...payload, userId });
      await handleActionSuccess('Escrow account saved.');
    } catch (error) {
      handleActionError(error, 'Unable to save account.');
    }
  };

  const handleUpdateAccount = async (accountId, payload) => {
    if (!permissions.canUpdateAccount) {
      throw new Error('Account updates not allowed.');
    }
    setProcessing('account');
    try {
      await updateEscrowAccount(accountId, payload);
      await handleActionSuccess('Escrow account updated.');
    } catch (error) {
      handleActionError(error, 'Unable to update account.');
    }
  };

  const handleCreateTransaction = async (payload) => {
    if (!permissions.canInitiateTransaction) {
      throw new Error('Transaction creation not allowed.');
    }
    setProcessing('transaction');
    try {
      await initiateEscrowTransaction({
        ...payload,
        initiatedById: payload.initiatedById ?? userId,
      });
      await handleActionSuccess('Escrow transaction created.');
    } catch (error) {
      handleActionError(error, 'Unable to create transaction.');
    }
  };

  const handleUpdateTransaction = async (transactionId, payload) => {
    if (!permissions.canUpdateTransaction) {
      throw new Error('Transaction updates not allowed.');
    }
    setProcessing('transaction');
    try {
      await updateEscrowTransaction(transactionId, { ...payload, actorId: userId });
      await handleActionSuccess('Escrow transaction updated.');
    } catch (error) {
      handleActionError(error, 'Unable to update transaction.');
    }
  };

  const handleRelease = async (transactionId, payload) => {
    if (!permissions.canRelease) {
      throw new Error('Release not allowed.');
    }
    setProcessing('release');
    try {
      await releaseEscrow(transactionId, { ...payload, actorId: userId });
      await handleActionSuccess('Funds released.');
    } catch (error) {
      handleActionError(error, 'Unable to release funds.');
    }
  };

  const handleRefund = async (transactionId, payload) => {
    if (!permissions.canRefund) {
      throw new Error('Refund not allowed.');
    }
    setProcessing('refund');
    try {
      await refundEscrow(transactionId, { ...payload, actorId: userId });
      await handleActionSuccess('Funds refunded.');
    } catch (error) {
      handleActionError(error, 'Unable to refund funds.');
    }
  };

  const handleCreateDispute = async (payload) => {
    setProcessing('dispute');
    try {
      await createDispute(payload);
      await handleActionSuccess('Dispute opened.');
    } catch (error) {
      handleActionError(error, 'Unable to open dispute.');
    }
  };

  const isProcessing = (key) => processing === key;

  const renderDrawer = () => {
    switch (drawer.type) {
      case 'account-create':
        return (
          <EscrowAccountForm
            mode="create"
            providers={forms.providers ?? ['stripe']}
            statuses={forms.accountStatuses ?? ['pending', 'active']}
            defaultCurrency={defaultCurrency}
            onSubmit={handleCreateAccount}
            submitting={isProcessing('account')}
          />
        );
      case 'account-edit':
        return (
          <EscrowAccountForm
            mode="edit"
            providers={forms.providers ?? ['stripe']}
            statuses={forms.accountStatuses ?? ['pending', 'active']}
            defaultCurrency={defaultCurrency}
            account={drawer.payload}
            onSubmit={(payload) => handleUpdateAccount(drawer.payload.id, payload)}
            submitting={isProcessing('account')}
          />
        );
      case 'account-detail':
        return <AccountDetails account={drawer.payload} />;
      case 'transaction-create':
        return (
          <EscrowTransactionForm
            mode="create"
            accounts={accounts}
            transactionTypes={forms.transactionTypes ?? ['project']}
            defaultCurrency={defaultCurrency}
            userId={userId}
            onSubmit={handleCreateTransaction}
            submitting={isProcessing('transaction')}
          />
        );
      case 'transaction-edit':
        return (
          <EscrowTransactionForm
            mode="edit"
            accounts={accounts}
            transactionTypes={forms.transactionTypes ?? ['project']}
            defaultCurrency={defaultCurrency}
            userId={userId}
            transaction={drawer.payload}
            onSubmit={(payload) => handleUpdateTransaction(drawer.payload.id, payload)}
            submitting={isProcessing('transaction')}
          />
        );
      case 'transaction-detail':
        return <TransactionDetails transaction={drawer.payload} currency={defaultCurrency} />;
      case 'release':
        return (
          <ActionNotesForm
            label="Release now"
            submitting={isProcessing('release')}
            onSubmit={(payload) => handleRelease(drawer.payload.id, payload)}
          />
        );
      case 'refund':
        return (
          <ActionNotesForm
            label="Refund now"
            submitting={isProcessing('refund')}
            onSubmit={(payload) => handleRefund(drawer.payload.id, payload)}
          />
        );
      case 'dispute-create':
        return (
          <EscrowDisputeForm
            transaction={drawer.payload}
            priorities={forms.disputePriorities ?? ['medium']}
            userId={userId}
            onSubmit={handleCreateDispute}
            submitting={isProcessing('dispute')}
          />
        );
      case 'dispute-detail':
        return <DisputeDetails dispute={drawer.payload} />;
      default:
        return null;
    }
  };

  const drawerTitleMap = {
    'account-create': 'New escrow account',
    'account-edit': 'Edit escrow account',
    'account-detail': 'Account details',
    'transaction-create': 'New escrow transaction',
    'transaction-edit': 'Edit escrow transaction',
    'transaction-detail': 'Transaction details',
    release: 'Release escrow',
    refund: 'Refund escrow',
    'dispute-create': 'Open dispute',
    'dispute-detail': 'Dispute details',
  };

  const drawerSubtitleMap = {
    release: drawer.payload ? drawer.payload.reference : null,
    refund: drawer.payload ? drawer.payload.reference : null,
    'transaction-detail': drawer.payload ? drawer.payload.reference : null,
    'account-detail': drawer.payload ? `Account #${drawer.payload.id}` : null,
    'account-edit': drawer.payload ? `Account #${drawer.payload.id}` : null,
    'dispute-detail': drawer.payload ? `Dispute #${drawer.payload.id}` : null,
  };

  return (
    <section id="escrow-management" className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Escrow</h2>
          <p className="text-sm text-slate-500">Manage safeguarded funds, payouts, and dispute flows.</p>
        </div>
        <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'release', label: 'Release' },
            { key: 'disputes', label: 'Disputes' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setView(tab.key)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                currentView === tab.key
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.tone === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className={currentView === 'overview' ? 'space-y-6' : 'hidden'} id="escrow-management-overview">
        <EscrowSummaryGrid summary={summary} />
        <EscrowAccountBoard
          accounts={accounts}
          currency={defaultCurrency}
          onAdd={() => setDrawer({ type: 'account-create' })}
          onInspect={(account) => setDrawer({ type: 'account-detail', payload: account })}
          onEdit={(account) => setDrawer({ type: 'account-edit', payload: account })}
        />
        <EscrowActivityBoard
          transactions={enrichedTransactions}
          currency={defaultCurrency}
          onCreate={() => setDrawer({ type: 'transaction-create' })}
          onInspect={(transaction) => setDrawer({ type: 'transaction-detail', payload: transaction })}
          onEdit={(transaction) => setDrawer({ type: 'transaction-edit', payload: transaction })}
          onRelease={(transaction) => setDrawer({ type: 'release', payload: transaction })}
          onRefund={(transaction) => setDrawer({ type: 'refund', payload: transaction })}
          onDispute={(transaction) => setDrawer({ type: 'dispute-create', payload: transaction })}
        />
      </div>

      <div className={currentView === 'release' ? 'space-y-6' : 'hidden'} id="escrow-management-release">
        <EscrowQueueBoard
          queue={releaseQueue}
          currency={defaultCurrency}
          onRelease={(transaction) => setDrawer({ type: 'release', payload: transaction })}
          onRefund={(transaction) => setDrawer({ type: 'refund', payload: transaction })}
          onInspect={(transaction) => setDrawer({ type: 'transaction-detail', payload: transaction })}
        />
      </div>

      <div className={currentView === 'disputes' ? 'space-y-6' : 'hidden'} id="escrow-management-disputes">
        <EscrowDisputeBoard
          disputes={disputes}
          onInspect={(dispute) => setDrawer({ type: 'dispute-detail', payload: dispute })}
        />
      </div>

      <EscrowDrawer
        title={drawerTitleMap[drawer.type] ?? ''}
        subtitle={drawerSubtitleMap[drawer.type] ?? null}
        open={Boolean(drawer.type)}
        onClose={closeDrawer}
      >
        {renderDrawer()}
      </EscrowDrawer>
    </section>
  );
}

EscrowManagementSection.propTypes = {
  data: PropTypes.shape({
    summary: PropTypes.object,
    permissions: PropTypes.object,
    forms: PropTypes.object,
    accounts: PropTypes.arrayOf(PropTypes.object),
    transactions: PropTypes.shape({
      recent: PropTypes.arrayOf(PropTypes.object),
      releaseQueue: PropTypes.arrayOf(PropTypes.object),
      disputes: PropTypes.arrayOf(PropTypes.object),
    }),
  }).isRequired,
  userId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  onRefresh: PropTypes.func,
  activeView: PropTypes.oneOf(['overview', 'release', 'disputes']),
  onViewChange: PropTypes.func,
};

EscrowManagementSection.defaultProps = {
  onRefresh: null,
  activeView: null,
  onViewChange: null,
};
