import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import DataStatus from '../../../../components/DataStatus.jsx';
import WalletSummary from '../../../../components/agency/wallet/WalletSummary.jsx';
import WalletAccountsPanel from '../../../../components/agency/wallet/WalletAccountsPanel.jsx';
import WalletFundingSourcesPanel from '../../../../components/agency/wallet/WalletFundingSourcesPanel.jsx';
import WalletPayoutsPanel from '../../../../components/agency/wallet/WalletPayoutsPanel.jsx';
import WalletSettingsForm from '../../../../components/agency/wallet/WalletSettingsForm.jsx';
import WalletLedgerDrawer from '../../../../components/agency/wallet/WalletLedgerDrawer.jsx';
import {
  useAgencyWalletOverview,
  useAgencyWalletAccounts,
  useAgencyWalletFundingSources,
  useAgencyWalletPayouts,
  useAgencyWalletSettings,
  useAgencyWalletLedger,
} from '../../../../hooks/useAgencyWalletManagement.js';
import {
  createWalletAccount,
  updateWalletAccount,
  createFundingSource,
  updateFundingSource,
  createPayoutRequest,
  updatePayoutRequest,
  updateWalletSettings,
  createWalletLedgerEntry,
  invalidateWalletOverview,
  invalidateWalletAccounts,
  invalidateFundingSources,
  invalidatePayoutRequests,
  invalidateWalletSettings,
  invalidateLedgerCache,
} from '../../../../services/agencyWallet.js';

const ACCOUNT_PAGE_SIZE = 10;

export default function AgencyWalletSection({ workspaceId, statusLabel }) {
  const [accountStatusFilter, setAccountStatusFilter] = useState('');
  const [accountSearchTerm, setAccountSearchTerm] = useState('');
  const [accountPage, setAccountPage] = useState(0);
  const [payoutStatusFilter, setPayoutStatusFilter] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [ledgerOpen, setLedgerOpen] = useState(false);

  const trimmedSearch = accountSearchTerm.trim();

  const overviewResource = useAgencyWalletOverview({ workspaceId });
  const accountsResource = useAgencyWalletAccounts({
    workspaceId,
    status: accountStatusFilter === '' ? undefined : accountStatusFilter,
    search: trimmedSearch === '' ? undefined : trimmedSearch,
    page: accountPage,
    pageSize: ACCOUNT_PAGE_SIZE,
  });
  const fundingSourcesResource = useAgencyWalletFundingSources({ workspaceId });
  const payoutsResource = useAgencyWalletPayouts({
    workspaceId,
    status: payoutStatusFilter === '' ? undefined : payoutStatusFilter,
  });
  const settingsResource = useAgencyWalletSettings({ workspaceId });
  const ledgerResource = useAgencyWalletLedger(selectedAccount?.id, {
    enabled: ledgerOpen && Boolean(selectedAccount?.id),
  });

  const { refresh: refreshOverview } = overviewResource;
  const { refresh: refreshAccounts } = accountsResource;
  const { refresh: refreshFunding } = fundingSourcesResource;
  const { refresh: refreshPayouts } = payoutsResource;
  const { refresh: refreshSettings } = settingsResource;
  const { refresh: refreshLedger } = ledgerResource;

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

  const reloadAll = useCallback(async () => {
    await Promise.all([
      refreshOverview?.({ force: true }),
      refreshAccounts?.({ force: true }),
      refreshFunding?.({ force: true }),
      refreshPayouts?.({ force: true }),
      refreshSettings?.({ force: true }),
    ]);
  }, [refreshAccounts, refreshFunding, refreshOverview, refreshPayouts, refreshSettings]);

  const handleCreateAccount = useCallback(
    async (payload) => {
      await createWalletAccount(payload);
      invalidateWalletOverview(workspaceId);
      invalidateWalletAccounts({
        workspaceId,
        status: accountStatusFilter === '' ? undefined : accountStatusFilter,
        search: trimmedSearch === '' ? undefined : trimmedSearch,
        page: accountPage,
        pageSize: ACCOUNT_PAGE_SIZE,
      });
      await Promise.all([
        refreshOverview?.({ force: true }),
        refreshAccounts?.({ force: true }),
      ]);
    },
    [
      accountPage,
      accountStatusFilter,
      refreshAccounts,
      refreshOverview,
      trimmedSearch,
      workspaceId,
    ],
  );

  const handleUpdateAccount = useCallback(
    async (accountId, payload) => {
      await updateWalletAccount(accountId, payload);
      invalidateWalletOverview(workspaceId);
      invalidateWalletAccounts({
        workspaceId,
        status: accountStatusFilter === '' ? undefined : accountStatusFilter,
        search: trimmedSearch === '' ? undefined : trimmedSearch,
        page: accountPage,
        pageSize: ACCOUNT_PAGE_SIZE,
      });
      await Promise.all([
        refreshOverview?.({ force: true }),
        refreshAccounts?.({ force: true }),
      ]);
    },
    [
      accountPage,
      accountStatusFilter,
      refreshAccounts,
      refreshOverview,
      trimmedSearch,
      workspaceId,
    ],
  );

  const handleFundingSubmit = useCallback(
    async (payload, existingId) => {
      if (existingId) {
        await updateFundingSource(existingId, payload);
      } else {
        await createFundingSource(payload);
      }
      invalidateFundingSources(workspaceId);
      await refreshFunding?.({ force: true });
    },
    [refreshFunding, workspaceId],
  );

  const handleCreateFundingSource = useCallback(
    async (payload) => {
      await handleFundingSubmit(payload);
    },
    [handleFundingSubmit],
  );

  const handleUpdateFundingSource = useCallback(
    async (fundingId, payload) => {
      await handleFundingSubmit(payload, fundingId);
    },
    [handleFundingSubmit],
  );

  const handlePayoutSubmit = useCallback(
    async (payload, existingId) => {
      if (existingId) {
        await updatePayoutRequest(existingId, payload);
      } else {
        await createPayoutRequest(payload);
      }
      invalidatePayoutRequests({ workspaceId, status: payoutStatusFilter === '' ? undefined : payoutStatusFilter });
      await refreshPayouts?.({ force: true });
    },
    [payoutStatusFilter, refreshPayouts, workspaceId],
  );

  const handleCreatePayout = useCallback(
    async (payload) => {
      await handlePayoutSubmit(payload);
    },
    [handlePayoutSubmit],
  );

  const handleUpdatePayout = useCallback(
    async (payoutId, payload) => {
      await handlePayoutSubmit(payload, payoutId);
    },
    [handlePayoutSubmit],
  );

  const handleSettingsSave = useCallback(
    async (payload) => {
      await updateWalletSettings(payload);
      invalidateWalletSettings(workspaceId);
      await refreshSettings?.({ force: true });
    },
    [refreshSettings, workspaceId],
  );

  const handleCreateLedgerEntry = useCallback(
    async (entryPayload) => {
      if (!selectedAccount?.id) {
        throw new Error('Select an account before recording a ledger entry.');
      }
      await createWalletLedgerEntry(selectedAccount.id, entryPayload);
      invalidateLedgerCache(selectedAccount.id, {});
      await refreshLedger?.({ force: true });
      await refreshOverview?.({ force: true });
    },
    [refreshLedger, refreshOverview, selectedAccount?.id],
  );

  const headerStatus = useMemo(
    () => ({
      loading: overviewResource?.loading || accountsResource?.loading,
      error: overviewResource?.error || accountsResource?.error,
      lastUpdated: overviewResource?.lastUpdated ?? null,
      fromCache: overviewResource?.fromCache ?? false,
    }),
    [accountsResource?.error, accountsResource?.loading, overviewResource],
  );

  return (
    <section
      id="agency-wallet"
      className="space-y-8 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-6 shadow-sm"
    >
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">Wallet</p>
          <h2 className="text-3xl font-semibold text-slate-900">Treasury &amp; controls</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Operate ledgers, funding sources, payouts, and treasury automation with compliance guardrails tuned for production.
          </p>
        </div>
        <DataStatus
          loading={headerStatus.loading}
          error={headerStatus.error}
          lastUpdated={headerStatus.lastUpdated}
          fromCache={headerStatus.fromCache}
          onRefresh={reloadAll}
      statusLabel={statusLabel}
    />
  </header>

  <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-inner">
        <WalletSummary
          overview={overviewResource?.data ?? null}
          loading={overviewResource?.loading}
          error={overviewResource?.error}
          onRefresh={() => refreshOverview?.({ force: true })}
        />
      </div>

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
        onSelectAccount={(account) => {
          setSelectedAccount(account);
          setLedgerOpen(true);
        }}
      />

      <WalletFundingSourcesPanel
        resource={fundingSourcesResource}
        onCreate={handleCreateFundingSource}
        onUpdate={handleUpdateFundingSource}
      />

      <WalletPayoutsPanel
        resource={payoutsResource}
        statusFilter={payoutStatusFilter}
        onStatusChange={handlePayoutStatusChange}
        onCreate={handleCreatePayout}
        onUpdate={handleUpdatePayout}
      />

      <WalletSettingsForm
        resource={settingsResource}
        onSave={handleSettingsSave}
        workspaceId={workspaceId}
      />

      <WalletLedgerDrawer
        account={selectedAccount}
        ledgerResource={ledgerResource}
        open={ledgerOpen}
        onClose={() => setLedgerOpen(false)}
        onCreateEntry={handleCreateLedgerEntry}
      />
    </section>
  );
}

AgencyWalletSection.propTypes = {
  workspaceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  statusLabel: PropTypes.string,
};

AgencyWalletSection.defaultProps = {
  workspaceId: undefined,
  statusLabel: 'Wallet telemetry',
};

