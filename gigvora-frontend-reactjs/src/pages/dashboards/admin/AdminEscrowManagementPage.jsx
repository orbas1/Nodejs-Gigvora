import { useCallback, useEffect, useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import useSession from '../../../hooks/useSession.js';
import EscrowWorkspace from '../../../components/admin/escrow/EscrowWorkspace.jsx';
import {
  fetchEscrowOverview,
  createEscrowAccount,
  updateEscrowAccount,
  updateEscrowProviderSettings,
  fetchEscrowFeeTiers,
  createEscrowFeeTier,
  updateEscrowFeeTier,
  deleteEscrowFeeTier,
  fetchEscrowReleasePolicies,
  createEscrowReleasePolicy,
  updateEscrowReleasePolicy,
  deleteEscrowReleasePolicy,
  updateEscrowTransaction,
  releaseEscrowTransaction,
  refundEscrowTransaction,
} from '../../../services/adminEscrow.js';

const MENU_SECTIONS = [
  {
    label: 'Escrow',
    items: [
      { name: 'Home', sectionId: 'escrow-home' },
      { name: 'Provider', sectionId: 'escrow-provider' },
      { name: 'Policies', sectionId: 'escrow-policies' },
      { name: 'Fees', sectionId: 'escrow-fees' },
      { name: 'Accounts', sectionId: 'escrow-accounts' },
      { name: 'Flows', sectionId: 'escrow-flows' },
    ],
  },
];

function buildOverviewParams(accountFilters, transactionFilters) {
  return {
    lookbackDays: 30,
    accountStatus: accountFilters.status || undefined,
    accountProvider: accountFilters.provider || undefined,
    accountSearch: accountFilters.search || undefined,
    accountPage: accountFilters.page || undefined,
    accountPageSize: accountFilters.pageSize || undefined,
    transactionStatus: transactionFilters.status || undefined,
    transactionType: transactionFilters.type || undefined,
    transactionReference: transactionFilters.reference || undefined,
    transactionPage: transactionFilters.page || undefined,
    transactionPageSize: transactionFilters.pageSize || undefined,
  };
}

export default function AdminEscrowManagementPage() {
  const { profile } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [accountFilters, setAccountFilters] = useState({ status: '', provider: '', search: '', page: 1 });
  const [transactionFilters, setTransactionFilters] = useState({ status: '', type: '', reference: '', page: 1 });
  const [providerSaving, setProviderSaving] = useState(false);
  const [tiers, setTiers] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [message, setMessage] = useState(null);
  const [exportNotice, setExportNotice] = useState('');

  useEffect(() => {
    if (!message) {
      return undefined;
    }
    const timeout = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timeout);
  }, [message]);

  useEffect(() => {
    if (!exportNotice) {
      return undefined;
    }
    const timeout = setTimeout(() => setExportNotice(''), 2500);
    return () => clearTimeout(timeout);
  }, [exportNotice]);

  const currency = overview?.accounts?.items?.[0]?.currencyCode ?? 'USD';

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildOverviewParams(accountFilters, transactionFilters);
      const data = await fetchEscrowOverview(params);
      setOverview(data);
      setTiers(data.feeTiers ?? []);
      setPolicies(data.releasePolicies ?? []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [accountFilters, transactionFilters]);

  const refreshTiers = useCallback(async () => {
    const data = await fetchEscrowFeeTiers();
    setTiers(Array.isArray(data) ? data : []);
  }, []);

  const refreshPolicies = useCallback(async () => {
    const data = await fetchEscrowReleasePolicies();
    setPolicies(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const handleCreateAccount = async (payload) => {
    await createEscrowAccount(payload);
    setMessage('Escrow account created successfully.');
    await loadOverview();
  };

  const handleUpdateAccount = async (accountId, updates) => {
    await updateEscrowAccount(accountId, updates);
    setMessage('Account updated successfully.');
    await loadOverview();
  };

  const handleProviderSave = async (payload) => {
    try {
      setProviderSaving(true);
      const updated = await updateEscrowProviderSettings(payload);
      setOverview((prev) => ({ ...(prev ?? {}), providerSettings: updated }));
      setMessage('Provider settings saved.');
    } finally {
      setProviderSaving(false);
    }
  };

  const handleCreateTier = async (payload) => {
    await createEscrowFeeTier(payload);
    setMessage('Fee tier created.');
    await refreshTiers();
    await loadOverview();
  };

  const handleUpdateTier = async (tierId, payload) => {
    await updateEscrowFeeTier(tierId, payload);
    setMessage('Fee tier updated.');
    await refreshTiers();
    await loadOverview();
  };

  const handleDeleteTier = async (tierId) => {
    await deleteEscrowFeeTier(tierId);
    setMessage('Fee tier removed.');
    await refreshTiers();
    await loadOverview();
  };

  const handleCreatePolicy = async (payload) => {
    await createEscrowReleasePolicy(payload);
    setMessage('Release policy created.');
    await refreshPolicies();
    await loadOverview();
  };

  const handleUpdatePolicy = async (policyId, payload) => {
    await updateEscrowReleasePolicy(policyId, payload);
    setMessage('Release policy updated.');
    await refreshPolicies();
    await loadOverview();
  };

  const handleDeletePolicy = async (policyId) => {
    await deleteEscrowReleasePolicy(policyId);
    setMessage('Release policy removed.');
    await refreshPolicies();
    await loadOverview();
  };

  const handleUpdateTransaction = async (transactionId, payload) => {
    await updateEscrowTransaction(transactionId, payload);
    setMessage('Transaction updated.');
    await loadOverview();
  };

  const handleReleaseTransaction = async (transactionId) => {
    await releaseEscrowTransaction(transactionId, {});
    setMessage('Funds released.');
    await loadOverview();
  };

  const handleRefundTransaction = async (transactionId) => {
    await refundEscrowTransaction(transactionId, {});
    setMessage('Funds refunded.');
    await loadOverview();
  };

  const handleExportOverview = () => {
    if (!overview) {
      setExportNotice('Overview not ready.');
      return;
    }
    try {
      const rows = [];
      const pushRow = (values) => {
        const serialised = values.map((value) => {
          if (value == null) {
            return '""';
          }
          const text = `${value}`.replace(/"/g, '""');
          return `"${text}"`;
        });
        rows.push(serialised.join(','));
      };

      const summary = overview.summary ?? {};
      const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
        maximumFractionDigits: 2,
      });

      pushRow(['Metric', 'Value']);
      pushRow(['Gross volume (30d)', currencyFormatter.format(summary.grossVolume ?? 0)]);
      pushRow(['Net volume (30d)', currencyFormatter.format(summary.netVolume ?? 0)]);
      pushRow(['Fee volume (30d)', currencyFormatter.format(summary.feeVolume ?? 0)]);
      pushRow(['Current balance', currencyFormatter.format(summary.currentBalance ?? 0)]);
      pushRow(['Pending release total', currencyFormatter.format(summary.pendingReleaseTotal ?? 0)]);
      pushRow(['Open disputes', summary.openDisputes ?? 0]);
      pushRow(['Outstanding transactions', summary.outstandingTransactions ?? 0]);
      pushRow(['Average release hours', summary.averageReleaseHours ?? 0]);

      const accountItems = Array.isArray(overview.accounts?.items) ? overview.accounts.items : [];
      if (accountItems.length) {
        pushRow([]);
        pushRow(['Escrow accounts']);
        pushRow(['Account ID', 'Owner', 'Provider', 'Status', 'Currency', 'Balance', 'Pending release']);
        accountItems.forEach((account) => {
          pushRow([
            account.id,
            account.owner?.email || account.owner?.id || '—',
            account.provider,
            account.status,
            account.currencyCode,
            currencyFormatter.format(account.currentBalance ?? 0),
            currencyFormatter.format(account.pendingReleaseTotal ?? 0),
          ]);
        });
      }

      const transactionItems = Array.isArray(overview.transactions?.items) ? overview.transactions.items : [];
      if (transactionItems.length) {
        pushRow([]);
        pushRow(['Escrow transactions']);
        pushRow(['Transaction ID', 'Reference', 'Status', 'Type', 'Amount', 'Currency', 'Account']);
        transactionItems.forEach((transaction) => {
          pushRow([
            transaction.id,
            transaction.reference,
            transaction.status,
            transaction.type,
            currencyFormatter.format(transaction.amount ?? 0),
            transaction.currencyCode,
            transaction.account?.provider || transaction.accountId,
          ]);
        });
      }

      const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const timestamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
      anchor.download = `gigvora-escrow-${timestamp}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      setExportNotice('Escrow report exported.');
    } catch (err) {
      console.error('Unable to export escrow overview', err);
      setExportNotice('Export failed.');
    }
  };

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Escrow"
      subtitle="Manage funds"
      menuSections={MENU_SECTIONS}
      availableDashboards={['admin']}
      profile={profile}
    >
      <div className="space-y-6" id="escrow-home">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Exports</h2>
            <p className="text-xs text-slate-500">Export a CSV containing summary metrics, account balances, and transaction flow.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportOverview}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
              disabled={!overview}
            >
              <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" /> Export CSV
            </button>
            {exportNotice ? (
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{exportNotice}</span>
            ) : null}
          </div>
        </div>
        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
        )}
        {loading && !overview && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading…</div>
        )}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">Unable to load escrow data.</div>
        )}
        {overview && (
          <EscrowWorkspace
            summary={overview.summary ?? {}}
            currency={currency}
            providerSettings={overview.providerSettings ?? {}}
            providerSaving={providerSaving}
            onProviderSave={handleProviderSave}
            onProviderReset={() => loadOverview()}
            policies={policies}
            onCreatePolicy={handleCreatePolicy}
            onUpdatePolicy={handleUpdatePolicy}
            onDeletePolicy={handleDeletePolicy}
            tiers={tiers}
            onCreateTier={handleCreateTier}
            onUpdateTier={handleUpdateTier}
            onDeleteTier={handleDeleteTier}
            accounts={overview.accounts}
            accountFilters={accountFilters}
            onAccountFilterChange={(next) => setAccountFilters(next)}
            onCreateAccount={handleCreateAccount}
            onUpdateAccount={handleUpdateAccount}
            transactions={overview.transactions}
            transactionFilters={transactionFilters}
            onTransactionFilterChange={(next) => setTransactionFilters(next)}
            onUpdateTransaction={handleUpdateTransaction}
            onReleaseTransaction={handleReleaseTransaction}
            onRefundTransaction={handleRefundTransaction}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
