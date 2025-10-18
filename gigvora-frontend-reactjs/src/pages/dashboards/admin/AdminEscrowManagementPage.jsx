import { useCallback, useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!message) {
      return undefined;
    }
    const timeout = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timeout);
  }, [message]);

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
