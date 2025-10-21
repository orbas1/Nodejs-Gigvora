import PropTypes from 'prop-types';
import WalletStatusPill from '../WalletStatusPill.jsx';
import { formatCurrency, formatDateTime, formatStatus } from '../walletFormatting.js';

function SummaryMetric({ label, value, caption, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-accent/60 hover:shadow-lg"
    >
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="mt-2 text-2xl font-semibold text-slate-900">{value}</span>
      {caption ? <span className="mt-1 text-xs text-slate-400">{caption}</span> : null}
    </button>
  );
}

SummaryMetric.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  caption: PropTypes.string,
  onClick: PropTypes.func,
};

SummaryMetric.defaultProps = {
  caption: null,
  onClick: undefined,
};

function AccountCard({ account, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(account)}
      className="flex flex-col rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-accent/60 hover:shadow-lg"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-base font-semibold text-slate-900">{account.label ?? account.accountType}</span>
        <WalletStatusPill value={account.complianceStatus} />
      </div>
      <p className="mt-4 text-sm text-slate-500">Available</p>
      <p className="text-xl font-semibold text-slate-900">{formatCurrency(account.availableBalance, account.currencyCode ?? 'USD')}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span>{formatStatus(account.accountType)}</span>
        <span>•</span>
        <span>{formatDateTime(account.lastEntryAt)}</span>
        {account.appStoreCompliant === false ? <span className="text-rose-500">App review</span> : null}
      </div>
    </button>
  );
}

AccountCard.propTypes = {
  account: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,
};

function WalletSummaryPanel({ summary, accounts, pendingTransfers, onSelectAccount, onOpenTransfers }) {
  const sanitizedAccounts = accounts.filter(Boolean);
  const safeCurrency = summary?.currency ?? 'USD';
  const safePendingTransfers = pendingTransfers?.filter(Boolean) ?? [];
  const primaryAccount = sanitizedAccounts[0];

  const metrics = [
    {
      label: 'Total',
      value: formatCurrency(summary.totalBalance, safeCurrency),
      caption: 'Ledger balance',
      onClick: () => {
        if (primaryAccount) {
          onSelectAccount(primaryAccount);
        }
      },
    },
    {
      label: 'Available',
      value: formatCurrency(summary.availableBalance, safeCurrency),
      caption: 'Ready to send',
      onClick: () => {
        if (primaryAccount) {
          onSelectAccount(primaryAccount);
        }
      },
    },
    {
      label: 'On hold',
      value: formatCurrency(summary.pendingHoldBalance, safeCurrency),
      caption: 'Pending clearance',
    },
    {
      label: 'Accounts',
      value: summary.accountCount ?? 0,
      caption: 'Active wallets',
    },
    {
      label: 'Pending',
      value: summary.pendingTransferCount ?? safePendingTransfers.length,
      caption: 'Transfers in progress',
      onClick: onOpenTransfers,
    },
    {
      label: 'Next move',
      value: summary.nextScheduledTransferAt ? formatDateTime(summary.nextScheduledTransferAt) : 'None',
      caption: 'Scheduled transfer',
      onClick: onOpenTransfers,
    },
  ];

  return (
    <div className="flex flex-col gap-6" id="wallet-home">
      <div className="flex flex-wrap items-center gap-3">
        <WalletStatusPill value={summary.complianceStatus} />
        <WalletStatusPill value={summary.ledgerIntegrity} />
        {summary.appStoreCompliant ? <WalletStatusPill value="app_store_ready" /> : <WalletStatusPill value="app_store_review" />}
      </div>
      <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map((metric) => (
          <SummaryMetric key={metric.label} {...metric} />
        ))}
      </div>
      <section className="flex flex-col gap-4" id="wallet-accounts">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Accounts</h3>
          {safePendingTransfers.length ? (
            <button
              type="button"
              onClick={onOpenTransfers}
              className="rounded-full border border-accent/50 px-4 py-2 text-sm font-semibold text-accent transition hover:border-accent hover:bg-accent/10"
            >
              View transfers
            </button>
          ) : null}
        </div>
        {sanitizedAccounts.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sanitizedAccounts.map((account) => (
              <AccountCard key={account.id} account={account} onSelect={onSelectAccount} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Wallet accounts are provisioning.
          </div>
        )}
      </section>
    </div>
  );
}

WalletSummaryPanel.propTypes = {
  summary: PropTypes.shape({
    totalBalance: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    availableBalance: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    pendingHoldBalance: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    accountCount: PropTypes.number,
    pendingTransferCount: PropTypes.number,
    nextScheduledTransferAt: PropTypes.string,
    complianceStatus: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    ledgerIntegrity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    appStoreCompliant: PropTypes.bool,
    currency: PropTypes.string,
  }).isRequired,
  accounts: PropTypes.arrayOf(PropTypes.object).isRequired,
  pendingTransfers: PropTypes.arrayOf(PropTypes.object),
  onSelectAccount: PropTypes.func.isRequired,
  onOpenTransfers: PropTypes.func,
};

WalletSummaryPanel.defaultProps = {
  pendingTransfers: [],
  onOpenTransfers: undefined,
};

export default WalletSummaryPanel;
