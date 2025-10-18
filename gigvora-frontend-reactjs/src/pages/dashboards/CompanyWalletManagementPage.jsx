import { useEffect, useMemo } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import WalletListPanel from '../../components/company/wallet/WalletListPanel.jsx';
import CompanyWalletDetailPanel from '../../components/company/wallet/CompanyWalletDetailPanel.jsx';
import useSession from '../../hooks/useSession.js';
import useCompanyWallets from '../../hooks/useCompanyWallets.js';
import useCompanyWalletDetail from '../../hooks/useCompanyWalletDetail.js';
import {
  createCompanyWallet,
  updateCompanyWallet,
  createWalletTransaction,
  createWalletFundingSource,
  updateWalletFundingSource,
  createWalletPayoutMethod,
  updateWalletPayoutMethod,
  createWalletSpendingPolicy,
  updateWalletSpendingPolicy,
  retireWalletSpendingPolicy,
  addWalletMember,
  updateWalletMember,
  removeWalletMember,
} from '../../services/companyWallets.js';
import { COMPANY_DASHBOARD_MENU_SECTIONS } from '../../constants/companyDashboardMenu.js';

function buildProfile(workspace, summary) {
  if (!workspace) {
    return undefined;
  }
  const displayName = workspace.name ?? 'Company workspace';
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return {
    name: displayName,
    role: 'Treasury workspace',
    initials: initials || 'CO',
    status: `Wallets ${summary?.walletCount ?? 0}`,
  };
}

export default function CompanyWalletManagementPage() {
  const { session, isAuthenticated } = useSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const workspaceIdParam = searchParams.get('workspaceId');
  const workspaceSlugParam = searchParams.get('workspaceSlug');
  const includeInactiveParam = searchParams.get('includeInactive');
  const walletIdParam = searchParams.get('walletId');
  const viewParam = searchParams.get('view');

  const includeInactive = includeInactiveParam === 'true';

  const membershipsList = session?.memberships ?? [];
  const isCompanyMember = isAuthenticated && membershipsList.includes('company');

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (!isCompanyMember) {
      const fallback = session?.primaryDashboard ?? membershipsList.find((role) => role !== 'company');
      if (fallback) {
        navigate(`/dashboard/${fallback}`, { replace: true, state: { from: '/dashboard/company/wallets' } });
      }
    }
  }, [isAuthenticated, isCompanyMember, navigate, session?.primaryDashboard, membershipsList]);

  const {
    data: walletsData,
    error: walletsError,
    loading: walletsLoading,
    refresh: refreshWallets,
    fromCache: walletsFromCache,
    lastUpdated: walletsLastUpdated,
  } = useCompanyWallets({
    workspaceId: workspaceIdParam,
    workspaceSlug: workspaceSlugParam,
    includeInactive,
    enabled: isAuthenticated && isCompanyMember,
  });

  const wallets = walletsData?.wallets ?? [];
  const summary = walletsData?.summary ?? {};
  const workspace = walletsData?.workspace ?? null;
  const availableWorkspaces = walletsData?.availableWorkspaces ?? [];

  useEffect(() => {
    if (!walletIdParam && wallets.length) {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.set('walletId', `${wallets[0].id}`);
        return next;
      }, { replace: true });
    }
  }, [walletIdParam, wallets, setSearchParams]);

  const selectedWalletId = walletIdParam ?? (wallets[0]?.id ? `${wallets[0].id}` : null);

  const {
    data: walletDetail,
    error: walletDetailError,
    loading: walletDetailLoading,
    refresh: refreshWalletDetail,
  } = useCompanyWalletDetail(selectedWalletId, {
    workspaceId: workspaceIdParam ?? workspace?.id,
    workspaceSlug: workspaceSlugParam,
    enabled: isAuthenticated && isCompanyMember && Boolean(selectedWalletId),
  });

  const profile = useMemo(() => buildProfile(workspace, summary), [workspace, summary]);
  const isDetailLoading = walletDetailLoading && !walletDetail?.wallet;

  const allowedViews = useMemo(
    () => new Set(['overview', 'moves', 'sources', 'payouts', 'rules', 'team']),
    [],
  );
  const normalizedView = viewParam === 'transactions' ? 'moves' : viewParam;
  const activeView = allowedViews.has(normalizedView) ? normalizedView : 'overview';

  const workspaceIdentifier = useMemo(
    () => ({
      workspaceId: workspaceIdParam ?? workspace?.id,
      workspaceSlug: workspaceSlugParam ?? undefined,
    }),
    [workspaceIdParam, workspace?.id, workspaceSlugParam],
  );

  const handleWorkspaceChange = (event) => {
    const value = event.target.value;
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) {
        next.set('workspaceId', value);
        next.delete('workspaceSlug');
      } else {
        next.delete('workspaceId');
      }
      return next;
    });
  };

  const handleIncludeInactiveToggle = (checked) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (checked) {
        next.set('includeInactive', 'true');
      } else {
        next.delete('includeInactive');
      }
      return next;
    });
  };

  const handleSelectWallet = (wallet) => {
    if (!wallet) {
      return;
    }
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set('walletId', `${wallet.id}`);
      return next;
    });
  };

  const handleChangeView = (nextView) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (allowedViews.has(nextView) && nextView !== 'overview') {
        next.set('view', nextView);
      } else {
        next.delete('view');
      }
      return next;
    });
  };

  const handleCreateWallet = async (payload) => {
    const result = await createCompanyWallet(payload, workspaceIdentifier);
    await refreshWallets({ force: true });
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set('walletId', `${result.id}`);
      return next;
    });
    return result;
  };

  const handleUpdateWallet = async (payload) => {
    if (!selectedWalletId) {
      return null;
    }
    const updated = await updateCompanyWallet(selectedWalletId, payload, workspaceIdentifier);
    await Promise.all([refreshWalletDetail({ force: true }), refreshWallets({ force: true })]);
    return updated;
  };

  const handleCreateTransaction = async (payload) => {
    if (!selectedWalletId) {
      return null;
    }
    const created = await createWalletTransaction(selectedWalletId, payload, workspaceIdentifier);
    await Promise.all([refreshWalletDetail({ force: true }), refreshWallets({ force: true })]);
    return created;
  };

  const handleCreateFundingSource = async (payload) => {
    if (!selectedWalletId) {
      return null;
    }
    const created = await createWalletFundingSource(selectedWalletId, payload, workspaceIdentifier);
    await refreshWalletDetail({ force: true });
    return created;
  };

  const handleUpdateFundingSource = async (sourceId, payload) => {
    if (!selectedWalletId) {
      return null;
    }
    const updated = await updateWalletFundingSource(selectedWalletId, sourceId, payload, workspaceIdentifier);
    await refreshWalletDetail({ force: true });
    return updated;
  };

  const handleCreatePayoutMethod = async (payload) => {
    if (!selectedWalletId) {
      return null;
    }
    const created = await createWalletPayoutMethod(selectedWalletId, payload, workspaceIdentifier);
    await refreshWalletDetail({ force: true });
    return created;
  };

  const handleUpdatePayoutMethod = async (methodId, payload) => {
    if (!selectedWalletId) {
      return null;
    }
    const updated = await updateWalletPayoutMethod(selectedWalletId, methodId, payload, workspaceIdentifier);
    await refreshWalletDetail({ force: true });
    return updated;
  };

  const handleCreatePolicy = async (payload) => {
    if (!selectedWalletId) {
      return null;
    }
    const created = await createWalletSpendingPolicy(selectedWalletId, payload, workspaceIdentifier);
    await refreshWalletDetail({ force: true });
    return created;
  };

  const handleUpdatePolicy = async (policyId, payload) => {
    if (!selectedWalletId) {
      return null;
    }
    const updated = await updateWalletSpendingPolicy(selectedWalletId, policyId, payload, workspaceIdentifier);
    await refreshWalletDetail({ force: true });
    return updated;
  };

  const handleRetirePolicy = async (policyId) => {
    if (!selectedWalletId) {
      return null;
    }
    const retired = await retireWalletSpendingPolicy(selectedWalletId, policyId, workspaceIdentifier);
    await refreshWalletDetail({ force: true });
    return retired;
  };

  const handleAddMember = async (payload) => {
    if (!selectedWalletId) {
      return null;
    }
    const created = await addWalletMember(selectedWalletId, payload, workspaceIdentifier);
    await refreshWalletDetail({ force: true });
    return created;
  };

  const handleUpdateMember = async (memberId, payload) => {
    if (!selectedWalletId) {
      return null;
    }
    const updated = await updateWalletMember(selectedWalletId, memberId, payload, workspaceIdentifier);
    await refreshWalletDetail({ force: true });
    return updated;
  };

  const handleRemoveMember = async (memberId) => {
    if (!selectedWalletId) {
      return null;
    }
    const removed = await removeWalletMember(selectedWalletId, memberId, workspaceIdentifier);
    await refreshWalletDetail({ force: true });
    return removed;
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirectTo: '/dashboard/company/wallets' }} />;
  }

  if (!isCompanyMember) {
    return (
      <DashboardLayout
        currentDashboard="company"
        title="Company treasury"
        subtitle="Wallet management"
        description="Enable treasury operations, wallet funding, payout controls, and policy guardrails."
        menuSections={COMPANY_DASHBOARD_MENU_SECTIONS}
        availableDashboards={['user', 'freelancer', 'agency']}
      >
        <AccessDeniedPanel
          availableDashboards={membershipsList.filter((membership) => membership !== 'company')}
          onNavigate={(dashboard) => navigate(`/dashboard/${dashboard}`)}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      currentDashboard="company"
      title="Wallet management"
      subtitle="Treasury control center"
      description="Create company wallets, manage balances, configure payouts, and enforce spending policies with full auditability."
      menuSections={COMPANY_DASHBOARD_MENU_SECTIONS}
      profile={profile}
      availableDashboards={['company', 'agency', 'headhunter', 'user', 'freelancer']}
      activeMenuItem="wallet-management"
    >
      <div className="space-y-10">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="workspace-select">
              Workspace
            </label>
            <select
              id="workspace-select"
              value={workspaceIdParam ?? workspace?.id ?? ''}
              onChange={handleWorkspaceChange}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="">Primary workspace</option>
              {availableWorkspaces.map((option) => (
                <option key={option.id ?? option.slug ?? option.name} value={option.id ?? option.slug}>
                  {option.name ?? option.label ?? option.slug ?? `Workspace ${option.id}`}
                </option>
              ))}
            </select>
          </div>
          <DataStatus
            loading={walletsLoading}
            fromCache={walletsFromCache}
            lastUpdated={walletsLastUpdated}
            onRefresh={() => refreshWallets({ force: true })}
            error={walletsError}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(320px,360px)_1fr]">
          <WalletListPanel
            summary={summary}
            wallets={wallets}
            selectedWalletId={selectedWalletId}
            onSelect={handleSelectWallet}
            onRefresh={() => refreshWallets({ force: true })}
            includeInactive={includeInactive}
            onToggleIncludeInactive={handleIncludeInactiveToggle}
            onCreateWallet={handleCreateWallet}
            busy={walletsLoading}
            error={walletsError}
          />

          <div className="space-y-6">
            {walletDetailError ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700">
                {walletDetailError.message || 'Unable to load wallet details. Check your permissions and try again.'}
              </div>
            ) : null}

            {isDetailLoading ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
                Loading wallet detail…
              </div>
            ) : (
              <CompanyWalletDetailPanel
                wallet={walletDetail?.wallet}
                fundingSources={walletDetail?.fundingSources}
                payoutMethods={walletDetail?.payoutMethods}
                spendingPolicies={walletDetail?.spendingPolicies}
                onUpdateWallet={handleUpdateWallet}
                onCreateTransaction={handleCreateTransaction}
                onCreateFundingSource={handleCreateFundingSource}
                onUpdateFundingSource={handleUpdateFundingSource}
                onCreatePayoutMethod={handleCreatePayoutMethod}
                onUpdatePayoutMethod={handleUpdatePayoutMethod}
                onCreatePolicy={handleCreatePolicy}
                onUpdatePolicy={handleUpdatePolicy}
                onRetirePolicy={handleRetirePolicy}
                onAddMember={handleAddMember}
                onUpdateMember={handleUpdateMember}
                onRemoveMember={handleRemoveMember}
                onRefreshWallet={() => refreshWalletDetail({ force: true })}
                workspaceId={workspaceIdParam ?? workspace?.id}
                workspaceSlug={workspaceSlugParam}
                view={activeView}
                onChangeView={handleChangeView}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
