import PropTypes from 'prop-types';
import WalletStatusPill from '../WalletStatusPill.jsx';
import { formatCurrency, formatDateTime, formatStatus } from '../walletFormatting.js';

function TransferRow({ transfer, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(transfer)}
      className="flex flex-col rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-1 hover:border-accent/60 hover:shadow-lg"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-900">{formatStatus(transfer.transferType)}</span>
          <span className="text-xs text-slate-500">{formatDateTime(transfer.scheduledAt ?? transfer.createdAt)}</span>
        </div>
        <WalletStatusPill value={transfer.status} />
      </div>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-600">{transfer.fundingSource?.label ?? 'Default wallet'}</span>
        <span className="text-base font-semibold text-slate-900">{formatCurrency(transfer.amount, transfer.currencyCode ?? 'USD')}</span>
      </div>
      {transfer.notes ? <p className="mt-2 text-xs text-slate-500">{transfer.notes}</p> : null}
    </button>
  );
}

TransferRow.propTypes = {
  transfer: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,
};

function TransferMovesPanel({ transfers, onCreate, onSelectTransfer }) {
  return (
    <div className="flex flex-col gap-4" id="wallet-moves">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Moves</h3>
        <button
          type="button"
          onClick={onCreate}
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent/90"
        >
          Schedule
        </button>
      </div>
      {transfers.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {transfers.map((transfer) => (
            <TransferRow key={transfer.id} transfer={transfer} onSelect={onSelectTransfer} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No transfers yet. Schedule the first move.
        </div>
      )}
    </div>
  );
}

TransferMovesPanel.propTypes = {
  transfers: PropTypes.arrayOf(PropTypes.object).isRequired,
  onCreate: PropTypes.func.isRequired,
  onSelectTransfer: PropTypes.func.isRequired,
};

export default TransferMovesPanel;
