import PropTypes from 'prop-types';
import WalletStatusPill from '../WalletStatusPill.jsx';
import { formatCurrency, formatDate, formatStatus } from '../walletFormatting.js';

function EscrowCard({ account, onSelect }) {
  const label = account.name ?? account.label ?? 'Escrow';
  const currency = account.currencyCode ?? 'USD';
  const accessibilityLabel = `${label} escrow account, balance ${formatCurrency(
    account.currentBalance,
    currency,
  )}, status ${formatStatus(account.status)}`;

  return (
    <button
      type="button"
      onClick={() => onSelect(account)}
      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-accent/60 hover:shadow-lg"
      aria-label={accessibilityLabel}
      title={accessibilityLabel}
    >
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-base font-semibold text-slate-900">{label}</h4>
        <WalletStatusPill value={account.status} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-slate-600">Balance</span>
          <span className="text-base font-semibold text-slate-900">
            {formatCurrency(account.currentBalance, account.currencyCode ?? 'USD')}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-slate-600">Held</span>
          <span>{formatCurrency(account.heldBalance, account.currencyCode ?? 'USD')}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-slate-600">Type</span>
          <span>{formatStatus(account.accountType)}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-slate-600">Updated</span>
          <span>{formatDate(account.updatedAt)}</span>
        </div>
      </div>
    </button>
  );
}

EscrowCard.propTypes = {
  account: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,
};

function EscrowPanel({ accounts, onSelectAccount }) {
  const sortedAccounts = [...accounts].sort((a, b) => {
    const balanceA = Number(a.currentBalance ?? 0);
    const balanceB = Number(b.currentBalance ?? 0);
    if (balanceA === balanceB) {
      return new Date(b.updatedAt ?? 0) - new Date(a.updatedAt ?? 0);
    }
    return balanceB - balanceA;
  });

  return (
    <div className="flex flex-col gap-4" id="wallet-escrow" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Escrow</h3>
      </div>
      {sortedAccounts.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedAccounts.map((account) => (
            <EscrowCard key={account.id} account={account} onSelect={onSelectAccount} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No escrow accounts yet.
        </div>
      )}
    </div>
  );
}

EscrowPanel.propTypes = {
  accounts: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSelectAccount: PropTypes.func.isRequired,
};

export default EscrowPanel;
