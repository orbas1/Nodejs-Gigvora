import { useMemo } from 'react';
import WalletSettingsCard from './WalletSettingsCard.jsx';
import WalletTransactionsPanel from './WalletTransactionsPanel.jsx';
import WalletFundingSourcesPanel from './WalletFundingSourcesPanel.jsx';
import WalletPayoutMethodsPanel from './WalletPayoutMethodsPanel.jsx';
import WalletPoliciesPanel from './WalletPoliciesPanel.jsx';
import WalletMembersPanel from './WalletMembersPanel.jsx';

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch (error) {
    return `${value} ${currency || ''}`.trim();
  }
}

const VIEW_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'moves', label: 'Moves' },
  { id: 'sources', label: 'Sources' },
  { id: 'payouts', label: 'Payouts' },
  { id: 'rules', label: 'Rules' },
  { id: 'team', label: 'Team' },
];

export default function CompanyWalletDetailPanel({
  wallet,
  fundingSources,
  payoutMethods,
  spendingPolicies,
  onUpdateWallet,
  onCreateTransaction,
  onCreateFundingSource,
  onUpdateFundingSource,
  onCreatePayoutMethod,
  onUpdatePayoutMethod,
  onCreatePolicy,
  onUpdatePolicy,
  onRetirePolicy,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
  onRefreshWallet,
  workspaceId,
  workspaceSlug,
  view = 'overview',
  onChangeView,
}) {

  const balances = wallet?.balances ?? {};
  const metrics = useMemo(
    () => [
      {
        label: 'Current balance',
        value: formatCurrency(balances.current, balances.currencyCode),
        tone: 'text-slate-900',
      },
      {
        label: 'Available balance',
        value: formatCurrency(balances.available, balances.currencyCode),
        tone: 'text-emerald-600',
      },
      {
        label: 'On hold',
        value: formatCurrency(balances.hold, balances.currencyCode),
        tone: 'text-amber-600',
      },
      {
        label: 'Monthly spend',
        value: formatCurrency(wallet?.metrics?.monthlyDebits, balances.currencyCode),
        tone: 'text-slate-900',
      },
      {
        label: 'Pending payouts',
        value: formatCurrency(wallet?.metrics?.pendingPayouts, balances.currencyCode),
        tone: 'text-slate-900',
      },
      {
        label: 'Active members',
        value: `${wallet?.memberSummary?.active ?? 0}`,
        tone: 'text-slate-900',
      },
    ],
    [balances.currencyCode, balances.current, balances.available, balances.hold, wallet?.metrics, wallet?.memberSummary?.active],
  );

  const activeTab = VIEW_TABS.find((tab) => tab.id === view) ?? VIEW_TABS[0];

  if (!wallet) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center text-sm text-slate-600">
        Select a wallet to get started.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-xl font-semibold text-accent">
                {wallet.name?.slice(0, 2).toUpperCase() || 'WA'}
              </span>
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">{wallet.name}</h2>
                <p className="mt-1 text-sm text-slate-500">Wallet #{wallet.id}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`rounded-full px-3 py-1 font-semibold ${
                  wallet.status === 'active'
                    ? 'bg-emerald-100 text-emerald-700'
                    : wallet.status === 'suspended'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {wallet.status ?? 'active'}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                {balances.currencyCode ?? wallet.currencyCode ?? 'USD'}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                {wallet.memberSummary?.total ?? 0} members
              </span>
            </div>
          </div>
          <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
                <p className={`mt-2 text-lg font-semibold ${metric.tone}`}>{metric.value}</p>
              </div>
            ))}
          </div>
        </div>

        <nav className="mt-6 flex flex-wrap gap-2">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeView?.(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                tab.id === activeTab.id
                  ? 'bg-accent text-white shadow'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-accent hover:text-accent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </section>

      {activeTab.id === 'overview' ? (
        <div className="space-y-6">
          <WalletSettingsCard wallet={wallet} onUpdate={onUpdateWallet} onRefresh={onRefreshWallet} />
        </div>
      ) : null}

      {activeTab.id === 'moves' ? (
        <WalletTransactionsPanel
          wallet={wallet}
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
          onCreateTransaction={onCreateTransaction}
        />
      ) : null}

      {activeTab.id === 'sources' ? (
        <WalletFundingSourcesPanel
          fundingSources={fundingSources}
          onCreate={onCreateFundingSource}
          onUpdate={onUpdateFundingSource}
        />
      ) : null}

      {activeTab.id === 'payouts' ? (
        <WalletPayoutMethodsPanel
          payoutMethods={payoutMethods}
          onCreate={onCreatePayoutMethod}
          onUpdate={onUpdatePayoutMethod}
        />
      ) : null}

      {activeTab.id === 'rules' ? (
        <WalletPoliciesPanel
          policies={spendingPolicies}
          onCreate={onCreatePolicy}
          onUpdate={onUpdatePolicy}
          onRetire={onRetirePolicy}
        />
      ) : null}

      {activeTab.id === 'team' ? (
        <WalletMembersPanel
          members={wallet.members}
          onAdd={onAddMember}
          onUpdate={onUpdateMember}
          onRemove={onRemoveMember}
        />
      ) : null}
    </div>
  );
}
