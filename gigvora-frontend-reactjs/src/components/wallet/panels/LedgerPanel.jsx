import PropTypes from 'prop-types';
import { formatCurrency, formatDateTime, formatStatus } from '../walletFormatting.js';
import WalletStatusPill from '../WalletStatusPill.jsx';

function LedgerRow({ entry, onSelect }) {
  const currency = entry.currencyCode ?? 'USD';
  const label = `${entry.reference ?? formatStatus(entry.entryType)} ledger entry, amount ${formatCurrency(
    entry.amount,
    currency,
  )}, balance after ${formatCurrency(entry.balanceAfter, currency)}`;

  return (
    <button
      type="button"
      onClick={() => onSelect(entry)}
      className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-1 hover:border-accent/60 hover:shadow-lg"
      aria-label={label}
      title={label}
    >
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-900">{entry.reference ?? formatStatus(entry.entryType)}</span>
        <span className="text-xs text-slate-500">{formatDateTime(entry.occurredAt)}</span>
      </div>
      <div className="text-sm font-semibold text-slate-600">{formatCurrency(entry.amount, entry.currencyCode ?? 'USD')}</div>
      <div className="flex items-center justify-end gap-2 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">After</span>
        <span>{formatCurrency(entry.balanceAfter, entry.currencyCode ?? 'USD')}</span>
      </div>
    </button>
  );
}

LedgerRow.propTypes = {
  entry: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,
};

function LedgerPanel({ entries, summary, onSelectEntry }) {
  const sortedEntries = [...entries]
    .filter((entry) => entry != null)
    .sort((a, b) => new Date(b.occurredAt ?? 0) - new Date(a.occurredAt ?? 0));

  return (
    <div className="flex flex-col gap-4" id="wallet-ledger" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Ledger</h3>
        <WalletStatusPill value={summary?.ledgerIntegrity} />
      </div>
      {sortedEntries.length ? (
        <div className="flex flex-col gap-3">
          {sortedEntries.slice(0, 12).map((entry) => (
            <LedgerRow key={entry.id} entry={entry} onSelect={onSelectEntry} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          Ledger entries will appear after your first transaction.
        </div>
      )}
    </div>
  );
}

LedgerPanel.propTypes = {
  entries: PropTypes.arrayOf(PropTypes.object).isRequired,
  summary: PropTypes.object,
  onSelectEntry: PropTypes.func.isRequired,
};

LedgerPanel.defaultProps = {
  summary: null,
};

export default LedgerPanel;
