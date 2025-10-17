import PropTypes from 'prop-types';
import WalletStatusPill from '../WalletStatusPill.jsx';
import { formatCurrency, formatDate, formatStatus } from '../walletFormatting.js';

function EscrowCard({ account, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(account)}
      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-accent/60 hover:shadow-lg"
    >
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-base font-semibold text-slate-900">{account.name ?? account.label ?? 'Escrow'}</h4>
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
  return (
    <div className="flex flex-col gap-4" id="wallet-escrow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Escrow</h3>
      </div>
      {accounts.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
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
