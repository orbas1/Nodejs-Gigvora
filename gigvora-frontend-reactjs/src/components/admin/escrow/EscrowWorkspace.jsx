import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { BanknotesIcon, Cog8ToothIcon, ShieldCheckIcon, SquaresPlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import EscrowMetrics from './EscrowMetrics.jsx';
import EscrowProviderForm from './EscrowProviderForm.jsx';
import EscrowReleasePolicies from './EscrowReleasePolicies.jsx';
import EscrowFeeTiers from './EscrowFeeTiers.jsx';
import EscrowAccountsTable from './EscrowAccountsTable.jsx';
import EscrowTransactionsTable from './EscrowTransactionsTable.jsx';
import EscrowActionDrawer from './EscrowActionDrawer.jsx';

const ACTIONS = [
  { key: 'provider', label: 'Provider', icon: Cog8ToothIcon },
  { key: 'policies', label: 'Policies', icon: ShieldCheckIcon },
  { key: 'fees', label: 'Fees', icon: SquaresPlusIcon },
  { key: 'accounts', label: 'Accounts', icon: UserGroupIcon },
  { key: 'flows', label: 'Flows', icon: BanknotesIcon },
];

export default function EscrowWorkspace({
  summary,
  currency,
  providerSettings,
  providerSaving,
  onProviderSave,
  onProviderReset,
  policies,
  onCreatePolicy,
  onUpdatePolicy,
  onDeletePolicy,
  tiers,
  onCreateTier,
  onUpdateTier,
  onDeleteTier,
  accounts,
  accountFilters,
  onAccountFilterChange,
  onCreateAccount,
  onUpdateAccount,
  transactions,
  transactionFilters,
  onTransactionFilterChange,
  onUpdateTransaction,
  onReleaseTransaction,
  onRefundTransaction,
}) {
  const [activeKey, setActiveKey] = useState(null);

  const activeAction = useMemo(
    () => ACTIONS.find((action) => action.key.toLowerCase() === (activeKey ?? '').toLowerCase()),
    [activeKey],
  );

  const openPanel = (key) => setActiveKey(key);
  const closePanel = () => setActiveKey(null);

  const renderPanel = () => {
    if (!activeAction) {
      return null;
    }

    switch (activeAction.key) {
      case 'provider':
        return (
          <EscrowProviderForm
            value={providerSettings}
            onSave={onProviderSave}
            onReset={onProviderReset}
            saving={providerSaving}
            currency={currency}
          />
        );
      case 'policies':
        return (
          <EscrowReleasePolicies policies={policies} onCreate={onCreatePolicy} onUpdate={onUpdatePolicy} onDelete={onDeletePolicy} />
        );
      case 'fees':
        return (
          <EscrowFeeTiers
            tiers={tiers}
            currency={currency}
            onCreate={onCreateTier}
            onUpdate={onUpdateTier}
            onDelete={onDeleteTier}
          />
        );
      case 'accounts':
        return (
          <EscrowAccountsTable
            accounts={accounts}
            filters={accountFilters}
            onFilterChange={onAccountFilterChange}
            onCreateAccount={onCreateAccount}
            onUpdateAccount={onUpdateAccount}
            currency={currency}
          />
        );
      case 'flows':
        return (
          <EscrowTransactionsTable
            transactions={transactions}
            filters={transactionFilters}
            onFilterChange={onTransactionFilterChange}
            onUpdateTransaction={onUpdateTransaction}
            onRelease={onReleaseTransaction}
            onRefund={onRefundTransaction}
            currency={currency}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <EscrowMetrics summary={summary} currency={currency} />
      </section>
      <section>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.key}
                type="button"
                onClick={() => openPanel(action.key)}
                className="flex h-32 flex-col items-start justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-400 hover:shadow-md"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-lg font-semibold text-slate-900">{action.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <EscrowActionDrawer open={Boolean(activeAction)} title={activeAction?.label} onClose={closePanel}>
        {renderPanel()}
      </EscrowActionDrawer>
    </div>
  );
}

EscrowWorkspace.propTypes = {
  summary: PropTypes.object,
  currency: PropTypes.string,
  providerSettings: PropTypes.object,
  providerSaving: PropTypes.bool,
  onProviderSave: PropTypes.func,
  onProviderReset: PropTypes.func,
  policies: PropTypes.array,
  onCreatePolicy: PropTypes.func,
  onUpdatePolicy: PropTypes.func,
  onDeletePolicy: PropTypes.func,
  tiers: PropTypes.array,
  onCreateTier: PropTypes.func,
  onUpdateTier: PropTypes.func,
  onDeleteTier: PropTypes.func,
  accounts: PropTypes.shape({
    items: PropTypes.array,
    pagination: PropTypes.object,
  }),
  accountFilters: PropTypes.object,
  onAccountFilterChange: PropTypes.func,
  onCreateAccount: PropTypes.func,
  onUpdateAccount: PropTypes.func,
  transactions: PropTypes.shape({
    items: PropTypes.array,
    pagination: PropTypes.object,
  }),
  transactionFilters: PropTypes.object,
  onTransactionFilterChange: PropTypes.func,
  onUpdateTransaction: PropTypes.func,
  onReleaseTransaction: PropTypes.func,
  onRefundTransaction: PropTypes.func,
};

EscrowWorkspace.defaultProps = {
  summary: {},
  currency: 'USD',
  providerSettings: {},
  providerSaving: false,
  onProviderSave: undefined,
  onProviderReset: undefined,
  policies: [],
  onCreatePolicy: undefined,
  onUpdatePolicy: undefined,
  onDeletePolicy: undefined,
  tiers: [],
  onCreateTier: undefined,
  onUpdateTier: undefined,
  onDeleteTier: undefined,
  accounts: undefined,
  accountFilters: {},
  onAccountFilterChange: undefined,
  onCreateAccount: undefined,
  onUpdateAccount: undefined,
  transactions: undefined,
  transactionFilters: {},
  onTransactionFilterChange: undefined,
  onUpdateTransaction: undefined,
  onReleaseTransaction: undefined,
  onRefundTransaction: undefined,
};
