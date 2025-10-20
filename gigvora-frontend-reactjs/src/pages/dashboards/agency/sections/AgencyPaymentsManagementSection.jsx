import { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import WalletSummary from '../../../../components/agency/wallet/WalletSummary.jsx';
import WalletAccountsPanel from '../../../../components/agency/wallet/WalletAccountsPanel.jsx';
import WalletFundingSourcesPanel from '../../../../components/agency/wallet/WalletFundingSourcesPanel.jsx';
import WalletPayoutsPanel from '../../../../components/agency/wallet/WalletPayoutsPanel.jsx';
import WalletSettingsForm from '../../../../components/agency/wallet/WalletSettingsForm.jsx';
import WalletLedgerDrawer from '../../../../components/agency/wallet/WalletLedgerDrawer.jsx';
import DataStatus from '../../../../components/DataStatus.jsx';
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
  createWalletLedgerEntry,
  createFundingSource,
  updateFundingSource,
  createPayoutRequest,
  updatePayoutRequest,
  updateWalletSettings,
  invalidateWalletAccounts,
  invalidateLedgerCache,
  invalidateFundingSources,
  invalidatePayoutRequests,
  invalidateWalletSettings,
} from '../../../../services/agencyWallet.js';

const ACCOUNT_PAGE_SIZE = 10;

export default function AgencyPaymentsManagementSection({ workspaceId, workspaceLabel }) {
  const [accountStatusFilter, setAccountStatusFilter] = useState('');
  const [accountSearchTerm, setAccountSearchTerm] = useState('');
  const [accountPage, setAccountPage] = useState(0);
  const [payoutStatusFilter, setPayoutStatusFilter] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [ledgerDrawerOpen, setLedgerDrawerOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [actionError, setActionError] = useState('');

  const withWorkspace = useCallback(
    (payload = {}) => {
      if (workspaceId == null || workspaceId === '' || payload.workspaceId) {
        return payload;
      }
      return { ...payload, workspaceId };
    },
    [workspaceId],
  );

  const overviewResource = useAgencyWalletOverview({ workspaceId });
  const accountsResource = useAgencyWalletAccounts({
    workspaceId,
    status: accountStatusFilter || undefined,
    search: accountSearchTerm || undefined,
    page: accountPage,
    pageSize: ACCOUNT_PAGE_SIZE,
  });
  const fundingResource = useAgencyWalletFundingSources({ workspaceId });
  const payoutsResource = useAgencyWalletPayouts({ workspaceId, status: payoutStatusFilter || undefined });
  const settingsResource = useAgencyWalletSettings({ workspaceId });
  const ledgerResource = useAgencyWalletLedger(selectedAccount?.id, {
    enabled: ledgerDrawerOpen && Boolean(selectedAccount?.id),
  });

  const refreshOverview = overviewResource.refresh;
  const refreshAccounts = accountsResource.refresh;
  const refreshFunding = fundingResource.refresh;
  const refreshPayouts = payoutsResource.refresh;
  const refreshSettings = settingsResource.refresh;
  const refreshLedger = ledgerResource.refresh;

  const handleAction = useCallback(
    async (label, task, invalidate) => {
      setStatusMessage('');
      setActionError('');
      try {
        const result = await task();
        if (typeof invalidate === 'function') {
          invalidate();
        }
        setStatusMessage(label);
        await Promise.all([
          refreshOverview?.(),
          refreshAccounts?.(),
          refreshFunding?.(),
          refreshPayouts?.(),
          refreshSettings?.(),
          refreshLedger?.(),
        ]);
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to complete payment operation.';
        setActionError(message);
        throw error;
      }
    },
    [refreshAccounts, refreshFunding, refreshLedger, refreshOverview, refreshPayouts, refreshSettings],
  );

  const handleCreateAccount = useCallback(
    (payload) =>
      handleAction('Wallet account created.', () => createWalletAccount(withWorkspace(payload)), () =>
        invalidateWalletAccounts({ workspaceId, status: accountStatusFilter || undefined, search: accountSearchTerm || undefined, page: accountPage, pageSize: ACCOUNT_PAGE_SIZE }),
      ),
    [handleAction, workspaceId, accountStatusFilter, accountSearchTerm, accountPage, withWorkspace],
  );

  const handleUpdateAccount = useCallback(
    (accountId, payload) =>
      handleAction('Wallet account updated.', () => updateWalletAccount(accountId, withWorkspace(payload)), () =>
        invalidateWalletAccounts({ workspaceId, status: accountStatusFilter || undefined, search: accountSearchTerm || undefined, page: accountPage, pageSize: ACCOUNT_PAGE_SIZE }),
      ),
    [handleAction, workspaceId, accountStatusFilter, accountSearchTerm, accountPage, withWorkspace],
  );

  const handleCreateLedgerEntry = useCallback(
    (accountId, payload) =>
      handleAction('Ledger entry recorded.', () => createWalletLedgerEntry(accountId, payload), () =>
        invalidateLedgerCache(accountId, {}),
      ),
    [handleAction],
  );

  const handleCreateFundingSource = useCallback(
    (payload) =>
      handleAction('Funding source saved.', () => createFundingSource(withWorkspace(payload)), () => invalidateFundingSources(workspaceId)),
    [handleAction, workspaceId, withWorkspace],
  );

  const handleUpdateFundingSource = useCallback(
    (sourceId, payload) =>
      handleAction('Funding source updated.', () => updateFundingSource(sourceId, withWorkspace(payload)), () => invalidateFundingSources(workspaceId)),
    [handleAction, workspaceId, withWorkspace],
  );

  const handleCreatePayout = useCallback(
    (payload) =>
      handleAction('Payout submitted.', () => createPayoutRequest(withWorkspace(payload)), () =>
        invalidatePayoutRequests({ workspaceId, status: payoutStatusFilter || undefined }),
      ),
    [handleAction, workspaceId, payoutStatusFilter, withWorkspace],
  );

  const handleUpdatePayout = useCallback(
    (payoutId, payload) =>
      handleAction('Payout updated.', () => updatePayoutRequest(payoutId, withWorkspace(payload)), () =>
        invalidatePayoutRequests({ workspaceId, status: payoutStatusFilter || undefined }),
      ),
    [handleAction, workspaceId, payoutStatusFilter, withWorkspace],
  );

  const handleUpdateSettings = useCallback(
    (payload) => handleAction('Wallet policies updated.', () => updateWalletSettings(payload), () => invalidateWalletSettings(workspaceId)),
    [handleAction, workspaceId],
  );

  const accounts = accountsResource.data?.items ?? [];
  const accountsTotal = accountsResource.data?.pagination?.total ?? accountsResource.data?.total ?? accounts.length;
  const accountsResourceValue = {
    data: { items: accounts, total: accountsTotal },
    loading: accountsResource.loading,
    error: accountsResource.error,
    refresh: accountsResource.refresh,
  };

  const ledgerEntries = ledgerResource.data?.items ?? [];

  const appliedWorkspaceLabel = workspaceLabel || (workspaceId ? `Workspace ${workspaceId}` : 'All workspaces');

  return (
    <section id="agency-payments" className="space-y-8 rounded-4xl border border-slate-200 bg-white p-8 shadow-soft">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Dashboard / Finance</p>
          <h2 className="text-3xl font-semibold text-slate-900">Agency payments management</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Orchestrate wallet accounts, funding rails, payouts, and treasury guardrails for {appliedWorkspaceLabel}.
          </p>
        </div>
        <DataStatus
          loading={overviewResource.loading || accountsResource.loading || fundingResource.loading || payoutsResource.loading}
          error={overviewResource.error || accountsResource.error || fundingResource.error || payoutsResource.error}
          onRefresh={() => Promise.all([
            overviewResource.refresh?.(),
            accountsResource.refresh?.(),
            fundingResource.refresh?.(),
            payoutsResource.refresh?.(),
            settingsResource.refresh?.(),
          ])}
          statusLabel="Payments"
        />
      </header>

      {statusMessage ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-700">{statusMessage}</div>
      ) : null}

      {actionError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">{actionError}</div>
      ) : null}

      <WalletSummary
        overview={overviewResource.data?.overview ?? overviewResource.data}
        loading={overviewResource.loading}
        error={overviewResource.error}
        onRefresh={overviewResource.refresh}
      />

      <div className="grid gap-8 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <WalletAccountsPanel
            resource={accountsResourceValue}
            statusFilter={accountStatusFilter}
            onStatusChange={(status) => {
              setAccountStatusFilter(status ?? '');
              setAccountPage(0);
            }}
            searchTerm={accountSearchTerm}
            onSearchChange={(value) => {
              setAccountSearchTerm(value ?? '');
              setAccountPage(0);
            }}
            page={accountPage}
            pageSize={ACCOUNT_PAGE_SIZE}
            onPageChange={(page) => setAccountPage(page)}
            onCreateAccount={handleCreateAccount}
            onUpdateAccount={handleUpdateAccount}
            onSelectAccount={(account) => {
              setSelectedAccount(account);
              setLedgerDrawerOpen(true);
            }}
          />

          <WalletPayoutsPanel
            payouts={payoutsResource.data?.items ?? []}
            statusFilter={payoutStatusFilter}
            onCreatePayout={handleCreatePayout}
            onUpdatePayout={handleUpdatePayout}
            onStatusFilterChange={(value) => setPayoutStatusFilter(value ?? '')}
            loading={payoutsResource.loading}
            error={payoutsResource.error}
          />
        </div>

        <div className="space-y-6">
          <WalletFundingSourcesPanel
            sources={fundingResource.data?.items ?? []}
            loading={fundingResource.loading}
            error={fundingResource.error}
            onCreateFundingSource={handleCreateFundingSource}
            onUpdateFundingSource={handleUpdateFundingSource}
          />

          <WalletSettingsForm
            settings={settingsResource.data}
            onSubmit={handleUpdateSettings}
            loading={settingsResource.loading}
            error={settingsResource.error}
          />
        </div>
      </div>

      <WalletLedgerDrawer
        open={ledgerDrawerOpen}
        onClose={() => setLedgerDrawerOpen(false)}
        ledger={ledgerEntries}
        account={selectedAccount}
        onCreateEntry={(payload) => (selectedAccount ? handleCreateLedgerEntry(selectedAccount.id, payload) : Promise.resolve())}
        loading={ledgerResource.loading}
        error={ledgerResource.error}
      />
    </section>
  );
}

AgencyPaymentsManagementSection.propTypes = {
  workspaceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  workspaceLabel: PropTypes.string,
};

AgencyPaymentsManagementSection.defaultProps = {
  workspaceId: null,
  workspaceLabel: '',
};
