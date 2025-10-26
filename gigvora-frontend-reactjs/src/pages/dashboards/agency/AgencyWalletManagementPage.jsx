import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import useSession from '../../../hooks/useSession.js';
import { AGENCY_DASHBOARD_MENU } from '../../../constants/agencyDashboardMenu.js';
import WalletOverview from '../../../components/agency/wallet/WalletOverview.jsx';
import TransactionTable from '../../../components/agency/wallet/TransactionTable.jsx';
import PayoutSetup from '../../../components/agency/wallet/PayoutSetup.jsx';
import WalletSummary from '../../../components/agency/wallet/WalletSummary.jsx';
import WalletAccountsPanel from '../../../components/agency/wallet/WalletAccountsPanel.jsx';
import WalletFundingSourcesPanel from '../../../components/agency/wallet/WalletFundingSourcesPanel.jsx';
import WalletPayoutsPanel from '../../../components/agency/wallet/WalletPayoutsPanel.jsx';
import WalletSettingsForm from '../../../components/agency/wallet/WalletSettingsForm.jsx';
import WalletLedgerDrawer from '../../../components/agency/wallet/WalletLedgerDrawer.jsx';
import {
  useAgencyWalletOverview,
  useAgencyWalletAccounts,
  useAgencyWalletFundingSources,
  useAgencyWalletPayouts,
  useAgencyWalletSettings,
  useAgencyWalletLedger,
} from '../../../hooks/useAgencyWalletManagement.js';
import {
  createWalletAccount,
  updateWalletAccount,
  createWalletLedgerEntry,
  createFundingSource,
  updateFundingSource,
  createPayoutRequest,
  updatePayoutRequest,
  updateWalletSettings,
  invalidateWalletOverview,
  invalidateWalletAccounts,
  invalidateLedgerCache,
  invalidateFundingSources,
  invalidatePayoutRequests,
  invalidateWalletSettings,
} from '../../../services/agencyWallet.js';

const ACCOUNT_PAGE_SIZE = 25;
const AVAILABLE_DASHBOARDS = ['agency', 'company', 'freelancer', 'user'];
const SECTION_ORDER = [
  'wallet-summary',
  'wallet-accounts',
  'wallet-funding-sources',
  'wallet-payouts',
  'wallet-controls',
];

export default function AgencyWalletManagementPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const sessionWorkspaceId = session?.workspaceId ?? session?.workspace?.id ?? session?.agency?.workspaceId ?? '';
  const sessionWorkspaceName = session?.workspace?.name ?? session?.agency?.workspaceName ?? '';

  const [workspaceField, setWorkspaceField] = useState(sessionWorkspaceId);
  const [workspaceFilter, setWorkspaceFilter] = useState(sessionWorkspaceId);
  const [hasCustomWorkspace, setHasCustomWorkspace] = useState(false);
  const [accountStatusFilter, setAccountStatusFilter] = useState('');
  const [accountSearchTerm, setAccountSearchTerm] = useState('');
  const [accountPage, setAccountPage] = useState(0);
  const [payoutStatusFilter, setPayoutStatusFilter] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [ledgerDrawerOpen, setLedgerDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('wallet-summary');

  useEffect(() => {
    if (!hasCustomWorkspace) {
      setWorkspaceField(sessionWorkspaceId ?? '');
      setWorkspaceFilter(sessionWorkspaceId ?? '');
    }
  }, [hasCustomWorkspace, sessionWorkspaceId]);

  const trimmedWorkspace = workspaceFilter.trim();
  const effectiveWorkspaceId = trimmedWorkspace === '' ? undefined : trimmedWorkspace;
  const normalizedAccountSearch = accountSearchTerm.trim();
  const accountSearchParam = normalizedAccountSearch === '' ? undefined : normalizedAccountSearch;
  const payoutStatusParam = payoutStatusFilter === '' ? undefined : payoutStatusFilter;

  const overviewResource = useAgencyWalletOverview({ workspaceId: effectiveWorkspaceId });
  const accountsResource = useAgencyWalletAccounts({
    workspaceId: effectiveWorkspaceId,
    status: accountStatusFilter === '' ? undefined : accountStatusFilter,
    search: accountSearchParam,
    page: accountPage,
    pageSize: ACCOUNT_PAGE_SIZE,
  });
  const fundingSourcesResource = useAgencyWalletFundingSources({ workspaceId: effectiveWorkspaceId });
  const payoutsResource = useAgencyWalletPayouts({ workspaceId: effectiveWorkspaceId, status: payoutStatusParam });
  const settingsResource = useAgencyWalletSettings({ workspaceId: effectiveWorkspaceId });
  const ledgerResource = useAgencyWalletLedger(selectedAccount?.id, {
    enabled: ledgerDrawerOpen && Boolean(selectedAccount?.id),
  });

  const { refresh: refreshOverview, data: overviewData } = overviewResource;
  const { refresh: refreshAccounts, data: accountsData } = accountsResource;
  const { refresh: refreshFundingSources } = fundingSourcesResource;
  const { refresh: refreshPayouts } = payoutsResource;
  const { refresh: refreshSettings } = settingsResource;
  const { refresh: refreshLedger } = ledgerResource;

  const selectedAccountId = selectedAccount?.id ?? null;

  useEffect(() => {
    if (!selectedAccountId) {
      return;
    }
    const items = accountsData?.items;
    if (!Array.isArray(items) || items.length === 0) {
      return;
    }
    const latest = items.find((item) => item.id === selectedAccountId);
    if (latest) {
      setSelectedAccount((previous) => {
        if (previous && previous.id === selectedAccountId) {
          return latest;
        }
        return previous;
      });
    }
  }, [accountsData, selectedAccountId]);

  const appliedWorkspaceLabel = useMemo(() => {
    if (effectiveWorkspaceId) {
      return effectiveWorkspaceId;
    }
    if (sessionWorkspaceName) {
      return sessionWorkspaceName;
    }
    if (sessionWorkspaceId) {
      return `${sessionWorkspaceId} (default)`;
    }
    return 'All workspaces';
  }, [effectiveWorkspaceId, sessionWorkspaceId, sessionWorkspaceName]);

  const accountsList = useMemo(() => {
    const items = accountsData?.items;
    return Array.isArray(items) ? items : [];
  }, [accountsData]);

  const workspaceCurrency = overviewData?.totals?.currency ?? 'USD';

  const combinedTransactions = useMemo(() => {
    if (!overviewData) {
      return [];
    }
    const ledgerEntries = Array.isArray(overviewData.recentLedger) ? overviewData.recentLedger : [];
    const transferEntries = Array.isArray(overviewData.recentTransfers) ? overviewData.recentTransfers : [];
    const payoutEntries = Array.isArray(payoutsResource.data?.items)
      ? payoutsResource.data.items
      : [];

    const formatLedger = ledgerEntries.map((entry) => ({
      id: entry.id ?? `ledger-${entry.reference}`,
      reference: entry.reference ?? entry.id,
      type: entry.entryType ?? 'ledger',
      status: entry.status ?? entry.entryStatus ?? 'completed',
      amount: entry.amount ?? entry.delta ?? 0,
      currencyCode: entry.currencyCode ?? workspaceCurrency,
      occurredAt: entry.occurredAt ?? entry.recordedAt ?? entry.createdAt,
      counterparty: entry.counterparty ?? entry.initiatedBy?.name ?? entry.initiatedBy?.displayName,
      channel: entry.channel ?? entry.paymentMethod ?? 'ledger',
      walletAccountId: entry.walletAccountId ?? entry.walletAccount?.id,
      anomalyScore: entry.anomalyScore,
      flagged: Boolean(entry.flagged),
      notes: entry.notes,
      metadata: entry.metadata ?? { source: 'ledger' },
    }));

    const formatTransfers = transferEntries.map((entry) => ({
      id: entry.id ?? `transfer-${entry.reference}`,
      reference: entry.reference ?? entry.id,
      type: entry.type ?? 'transfer',
      status: entry.status ?? 'processing',
      amount: entry.amount ?? 0,
      currencyCode: entry.currencyCode ?? workspaceCurrency,
      occurredAt: entry.initiatedAt ?? entry.createdAt,
      counterparty: entry.counterparty ?? entry.destination,
      channel: entry.channel ?? entry.method,
      walletAccountId: entry.walletAccountId ?? entry.accountId,
      anomalyScore: entry.anomalyScore,
      flagged: Boolean(entry.flagged),
      notes: entry.notes,
      metadata: entry.metadata ?? { source: 'transfer' },
    }));

    const formatPayouts = payoutEntries.map((entry) => ({
      id: entry.id ?? `payout-${entry.reference}`,
      reference: entry.reference ?? entry.id,
      type: 'payout',
      status: entry.status ?? 'pending',
      amount: entry.amount ?? entry.total ?? 0,
      currencyCode: entry.currencyCode ?? entry.currency ?? workspaceCurrency,
      occurredAt: entry.scheduledFor ?? entry.requestedAt ?? entry.createdAt,
      counterparty: entry.destination ?? entry.walletAccount?.displayName,
      channel: entry.method ?? 'bank_transfer',
      walletAccountId: entry.walletAccountId ?? entry.walletAccount?.id,
      anomalyScore: entry.anomalyScore,
      flagged: Boolean(entry.reviewFlagged ?? entry.flagged),
      notes: entry.notes,
      metadata: entry.metadata ?? { source: 'payout' },
    }));

    return [...formatLedger, ...formatTransfers, ...formatPayouts];
  }, [overviewData, payoutsResource.data, workspaceCurrency]);

  const handleTransactionSelect = useCallback(
    (transaction) => {
      if (!transaction) {
        return;
      }
      const accountId = transaction.walletAccountId ?? transaction.accountId;
      if (accountId) {
        const match = accountsList.find((account) => String(account.id) === String(accountId));
        if (match) {
          setSelectedAccount(match);
          setLedgerDrawerOpen(true);
        }
      }
      setActiveSection('wallet-accounts');
      const anchor = document.getElementById('wallet-accounts');
      if (anchor) {
        anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [accountsList],
  );

  const handleExportTransactions = useCallback(
    (rows) => {
      const dataset = Array.isArray(rows) && rows.length ? rows : combinedTransactions;
      if (!dataset.length || typeof window === 'undefined') {
        return;
      }
      const headers = ['reference', 'type', 'status', 'amount', 'currency', 'occurredAt', 'counterparty', 'channel'];
      const body = dataset
        .map((row) =>
          [
            row.reference ?? row.id ?? '',
            row.type ?? '',
            row.status ?? '',
            row.amount ?? '',
            row.currencyCode ?? workspaceCurrency,
            row.occurredAt ?? '',
            row.counterparty ?? '',
            row.channel ?? '',
          ]
            .map((value) => {
              const stringValue = value == null ? '' : String(value);
              return stringValue.includes(',') ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
            })
            .join(','),
        )
        .join('\n');
      const csv = `${headers.join(',')}\n${body}`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `wallet-transactions-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [combinedTransactions, workspaceCurrency],
  );

  const handleNavigateToFunding = useCallback(() => {
    setActiveSection('wallet-funding-sources');
    const anchor = document.getElementById('wallet-funding-sources');
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleScrollToTransactions = useCallback(() => {
    const anchor = document.getElementById('wallet-transactions');
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleMenuSelect = useCallback(
    (itemId, item) => {
      if (!item) {
        return;
      }
      const targetHref = item.href ?? '';
      if (targetHref && targetHref !== '/dashboard/agency/wallet') {
        navigate(targetHref);
        return;
      }

      if (targetHref === '/dashboard/agency/wallet' && !item.sectionId) {
        setActiveSection('wallet-summary');
        if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }

      const sectionId = item.sectionId ?? SECTION_ORDER.find((value) => value === itemId) ?? null;
      if (sectionId) {
        setActiveSection(sectionId);
        const targetElement = document.getElementById(sectionId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    },
    [navigate],
  );

  const handleWorkspaceSubmit = useCallback(
    (event) => {
      event.preventDefault();
      setWorkspaceFilter(workspaceField.trim());
      setHasCustomWorkspace(true);
      setAccountPage(0);
    },
    [workspaceField],
  );

  const handleWorkspaceClear = useCallback(() => {
    setWorkspaceField('');
    setWorkspaceFilter('');
    setHasCustomWorkspace(true);
    setAccountPage(0);
  }, []);

  const handleUseSessionWorkspace = useCallback(() => {
    setHasCustomWorkspace(false);
    setAccountPage(0);
  }, []);

  const handleAccountStatusChange = useCallback((value) => {
    setAccountStatusFilter(value ?? '');
    setAccountPage(0);
  }, []);

  const handleAccountSearchChange = useCallback((value) => {
    setAccountSearchTerm(value ?? '');
    setAccountPage(0);
  }, []);

  const handlePayoutStatusChange = useCallback((value) => {
    setPayoutStatusFilter(value ?? '');
  }, []);

  const handleCreateAccount = useCallback(
    async (payload) => {
      const result = await createWalletAccount(payload);
      setAccountPage(0);
      invalidateWalletOverview(effectiveWorkspaceId);
      invalidateWalletAccounts({
        workspaceId: effectiveWorkspaceId,
        status: accountStatusFilter === '' ? undefined : accountStatusFilter,
        search: accountSearchParam,
        page: 0,
        pageSize: ACCOUNT_PAGE_SIZE,
      });
      await Promise.allSettled([
        refreshAccounts?.({ force: true }),
        refreshOverview?.({ force: true }),
      ]);
      return result;
    },
    [
      effectiveWorkspaceId,
      accountStatusFilter,
      accountSearchParam,
      refreshAccounts,
      refreshOverview,
    ],
  );

  const handleUpdateAccount = useCallback(
    async (accountId, payload) => {
      const result = await updateWalletAccount(accountId, payload);
      invalidateWalletOverview(effectiveWorkspaceId);
      invalidateWalletAccounts({
        workspaceId: effectiveWorkspaceId,
        status: accountStatusFilter === '' ? undefined : accountStatusFilter,
        search: accountSearchParam,
        page: accountPage,
        pageSize: ACCOUNT_PAGE_SIZE,
      });
      await Promise.allSettled([
        refreshAccounts?.({ force: true }),
        refreshOverview?.({ force: true }),
      ]);
      return result;
    },
    [
      effectiveWorkspaceId,
      accountStatusFilter,
      accountSearchParam,
      accountPage,
      refreshAccounts,
      refreshOverview,
    ],
  );

  const handleSelectAccount = useCallback((account) => {
    setSelectedAccount(account);
    setLedgerDrawerOpen(true);
    setActiveSection('wallet-accounts');
  }, []);

  const handleCloseLedger = useCallback(() => {
    setLedgerDrawerOpen(false);
  }, []);

  const handleCreateLedgerEntry = useCallback(
    async (payload) => {
      if (!selectedAccountId) {
        throw new Error('Select a wallet account before creating ledger entries.');
      }
      const result = await createWalletLedgerEntry(selectedAccountId, payload);
      invalidateLedgerCache(selectedAccountId);
      invalidateWalletOverview(effectiveWorkspaceId);
      invalidateWalletAccounts({
        workspaceId: effectiveWorkspaceId,
        status: accountStatusFilter === '' ? undefined : accountStatusFilter,
        search: accountSearchParam,
        page: accountPage,
        pageSize: ACCOUNT_PAGE_SIZE,
      });
      await Promise.allSettled([
        refreshLedger?.({ force: true }),
        refreshAccounts?.({ force: true }),
        refreshOverview?.({ force: true }),
      ]);
      return result;
    },
    [
      selectedAccountId,
      effectiveWorkspaceId,
      accountStatusFilter,
      accountSearchParam,
      accountPage,
      refreshLedger,
      refreshAccounts,
      refreshOverview,
    ],
  );

  const handleCreateFundingSource = useCallback(
    async (payload) => {
      const result = await createFundingSource(payload);
      invalidateFundingSources(effectiveWorkspaceId);
      await Promise.allSettled([
        refreshFundingSources?.({ force: true }),
        refreshOverview?.({ force: true }),
      ]);
      return result;
    },
    [effectiveWorkspaceId, refreshFundingSources, refreshOverview],
  );

  const handleUpdateFundingSource = useCallback(
    async (sourceId, payload) => {
      const result = await updateFundingSource(sourceId, payload);
      invalidateFundingSources(effectiveWorkspaceId);
      await Promise.allSettled([
        refreshFundingSources?.({ force: true }),
        refreshOverview?.({ force: true }),
      ]);
      return result;
    },
    [effectiveWorkspaceId, refreshFundingSources, refreshOverview],
  );

  const handleCreatePayout = useCallback(
    async (payload) => {
      const result = await createPayoutRequest(payload);
      invalidatePayoutRequests({ workspaceId: effectiveWorkspaceId, status: payoutStatusParam });
      await Promise.allSettled([
        refreshPayouts?.({ force: true }),
        refreshOverview?.({ force: true }),
      ]);
      return result;
    },
    [effectiveWorkspaceId, payoutStatusParam, refreshPayouts, refreshOverview],
  );

  const handleUpdatePayout = useCallback(
    async (payoutId, payload) => {
      const result = await updatePayoutRequest(payoutId, payload);
      invalidatePayoutRequests({ workspaceId: effectiveWorkspaceId, status: payoutStatusParam });
      await Promise.allSettled([
        refreshPayouts?.({ force: true }),
        refreshOverview?.({ force: true }),
      ]);
      return result;
    },
    [effectiveWorkspaceId, payoutStatusParam, refreshPayouts, refreshOverview],
  );

  const handleSaveSettings = useCallback(
    async (payload) => {
      const result = await updateWalletSettings(payload);
      invalidateWalletSettings(effectiveWorkspaceId ?? payload.workspaceId);
      await Promise.allSettled([
        refreshSettings?.({ force: true }),
        refreshOverview?.({ force: true }),
      ]);
      return result;
    },
    [effectiveWorkspaceId, refreshSettings, refreshOverview],
  );

  const sectionConfig = useMemo(
    () => [
      {
        id: 'wallet-summary',
        label: 'Summary',
        render: () => (
          <div className="space-y-10">
            <WalletOverview
              overview={overviewData}
              workspaceLabel={appliedWorkspaceLabel}
              loading={overviewResource.loading}
              error={overviewResource.error}
              onRefresh={refreshOverview}
              onViewTransactions={handleScrollToTransactions}
              onSchedulePayout={() => {
                setActiveSection('wallet-payouts');
                const anchor = document.getElementById('wallet-payouts');
                if (anchor) {
                  anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              onManageCompliance={() => {
                setActiveSection('wallet-controls');
                const anchor = document.getElementById('wallet-controls');
                if (anchor) {
                  anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            />
            <div id="wallet-transactions">
              <TransactionTable
                transactions={combinedTransactions}
                loading={overviewResource.loading || payoutsResource.loading}
                error={overviewResource.error}
                onRetry={() => refreshOverview?.({ force: true })}
                onExport={handleExportTransactions}
                onSelectTransaction={handleTransactionSelect}
                workspaceCurrency={workspaceCurrency}
              />
            </div>
            <WalletSummary
              overview={overviewData}
              loading={overviewResource.loading}
              error={overviewResource.error}
              onRefresh={() => refreshOverview?.({ force: true })}
            />
          </div>
        ),
      },
      {
        id: 'wallet-accounts',
        label: 'Accounts',
        render: () => (
          <WalletAccountsPanel
            resource={accountsResource}
            statusFilter={accountStatusFilter}
            onStatusChange={handleAccountStatusChange}
            searchTerm={accountSearchTerm}
            onSearchChange={handleAccountSearchChange}
            page={accountPage}
            pageSize={ACCOUNT_PAGE_SIZE}
            onPageChange={setAccountPage}
            onCreateAccount={handleCreateAccount}
            onUpdateAccount={handleUpdateAccount}
            onSelectAccount={handleSelectAccount}
          />
        ),
      },
      {
        id: 'wallet-funding-sources',
        label: 'Funds',
        render: () => (
          <WalletFundingSourcesPanel
            resource={fundingSourcesResource}
            onCreateFundingSource={handleCreateFundingSource}
            onUpdateFundingSource={handleUpdateFundingSource}
          />
        ),
      },
      {
        id: 'wallet-payouts',
        label: 'Payouts',
        render: () => (
          <div className="space-y-10">
            <PayoutSetup
              workspaceId={effectiveWorkspaceId ?? ''}
              settings={settingsResource.data}
              fundingSources={fundingSourcesResource.data?.items}
              compliance={overviewData?.compliance}
              loading={settingsResource.loading}
              onCreateFundingSource={handleNavigateToFunding}
              onSave={handleSaveSettings}
              workspaceCurrency={workspaceCurrency}
            />
            <WalletPayoutsPanel
              resource={payoutsResource}
              statusFilter={payoutStatusFilter}
              onStatusFilterChange={handlePayoutStatusChange}
              onCreatePayout={handleCreatePayout}
              onUpdatePayout={handleUpdatePayout}
            />
          </div>
        ),
      },
      {
        id: 'wallet-controls',
        label: 'Settings',
        render: () => (
          <WalletSettingsForm
            workspaceId={effectiveWorkspaceId ?? ''}
            resource={settingsResource}
            onSave={handleSaveSettings}
          />
        ),
      },
    ],
    [
      overviewData,
      overviewResource.loading,
      overviewResource.error,
      refreshOverview,
      appliedWorkspaceLabel,
      handleScrollToTransactions,
      combinedTransactions,
      payoutsResource.loading,
      handleExportTransactions,
      handleTransactionSelect,
      workspaceCurrency,
      accountsResource,
      accountStatusFilter,
      accountSearchTerm,
      accountPage,
      handleAccountStatusChange,
      handleAccountSearchChange,
      handleCreateAccount,
      handleUpdateAccount,
      handleSelectAccount,
      fundingSourcesResource,
      handleCreateFundingSource,
      handleUpdateFundingSource,
      payoutsResource,
      payoutStatusFilter,
      handlePayoutStatusChange,
      handleCreatePayout,
      handleUpdatePayout,
      settingsResource,
      effectiveWorkspaceId,
      handleSaveSettings,
      handleNavigateToFunding,
    ],
  );

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Wallet"
      menuSections={AGENCY_DASHBOARD_MENU}
      availableDashboards={AVAILABLE_DASHBOARDS}
      activeMenuItem="wallet"
      onMenuItemSelect={handleMenuSelect}
      adSurface="agency_wallet_management"
    >
      <div id="wallet-management" className="mx-auto max-w-none px-6 py-10 lg:px-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold text-slate-900">Wallet</h1>
              <p className="text-sm font-medium text-slate-600">{appliedWorkspaceLabel}</p>
            </div>
            <form onSubmit={handleWorkspaceSubmit} className="flex w-full flex-col gap-3 xl:w-auto xl:flex-row xl:items-end">
              <div className="flex-1 space-y-2">
                <label htmlFor="workspace-selector" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Workspace
                </label>
                <input
                  id="workspace-selector"
                  name="workspace-selector"
                  value={workspaceField}
                  onChange={(event) => {
                    setWorkspaceField(event.target.value);
                    setHasCustomWorkspace(true);
                  }}
                  placeholder="All"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="flex items-center gap-2 xl:flex-row">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={handleWorkspaceClear}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleUseSessionWorkspace}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
                >
                  Default
                </button>
              </div>
            </form>
          </div>

          <nav className="mt-6 flex flex-wrap gap-2 rounded-3xl bg-slate-900/5 p-2">
            {sectionConfig.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(section.id);
                    const targetElement = document.getElementById(section.id);
                    if (targetElement) {
                      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className={`flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-200 md:flex-none ${
                    isActive ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  {section.label}
                </button>
              );
            })}
          </nav>
        </section>

        <div className="mt-10 space-y-10">
          {sectionConfig.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className={activeSection === section.id ? 'block' : 'hidden'}
              aria-label={section.label}
            >
              {section.render()}
            </section>
          ))}
        </div>
      </div>

      <WalletLedgerDrawer
        account={selectedAccount}
        ledgerResource={ledgerResource}
        open={ledgerDrawerOpen}
        onClose={handleCloseLedger}
        onCreateEntry={handleCreateLedgerEntry}
      />
    </DashboardLayout>
  );
}
