import PropTypes from 'prop-types';
import WalletStatusPill from '../WalletStatusPill.jsx';
import { formatCurrency, formatStatus } from '../walletFormatting.js';

function TransferRuleCard({ rule, onEdit, onArchive, onRestore, onRemove }) {
  const isActive = rule.status === 'active';
  const showArchive = isActive && onArchive;
  const showRestore = !isActive && onRestore;

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <h4 className="text-base font-semibold text-slate-900">{rule.name}</h4>
          <p className="text-xs uppercase tracking-wide text-slate-400">{formatStatus(rule.transferType)}</p>
        </div>
        <WalletStatusPill value={rule.status} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
        <div className="flex flex-col gap-1">
          <dt className="font-semibold text-slate-600">Every</dt>
          <dd>{formatStatus(rule.cadence)}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="font-semibold text-slate-600">Threshold</dt>
          <dd>{formatCurrency(rule.thresholdAmount, rule.currencyCode ?? 'USD')}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="font-semibold text-slate-600">Day</dt>
          <dd>{rule.executionDay ? `Day ${rule.executionDay}` : 'Any'}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="font-semibold text-slate-600">Source</dt>
          <dd>{rule.fundingSource?.label ?? 'Default wallet'}</dd>
        </div>
      </dl>
      <div className="mt-5 flex items-center justify-end gap-2">
        {showArchive ? (
          <button
            type="button"
            onClick={() => onArchive(rule)}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-rose-300 hover:text-rose-500"
          >
            Pause
          </button>
        ) : null}
        {showRestore ? (
          <button
            type="button"
            onClick={() => onRestore(rule)}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600"
          >
            Resume
          </button>
        ) : null}
        {onRemove ? (
          <button
            type="button"
            onClick={() => onRemove(rule)}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-rose-500 transition hover:border-rose-400 hover:bg-rose-50"
          >
            Remove
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onEdit(rule)}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

TransferRuleCard.propTypes = {
  rule: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onArchive: PropTypes.func,
  onRestore: PropTypes.func,
  onRemove: PropTypes.func,
};

TransferRuleCard.defaultProps = {
  onArchive: undefined,
  onRestore: undefined,
  onRemove: undefined,
};

function TransferRulesPanel({ rules, onCreate, onEdit, onArchive, onRestore, onRemove }) {
  return (
    <div className="flex flex-col gap-4" id="wallet-rules">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Rules</h3>
        <button
          type="button"
          onClick={onCreate}
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent/90"
        >
          New rule
        </button>
      </div>
      {rules.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rules.map((rule) => (
            <TransferRuleCard
              key={rule.id}
              rule={rule}
              onEdit={onEdit}
              onArchive={onArchive}
              onRestore={onRestore}
              onRemove={onRemove}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          Automation starts here. Create your first rule.
        </div>
      )}
    </div>
  );
}

TransferRulesPanel.propTypes = {
  rules: PropTypes.arrayOf(PropTypes.object).isRequired,
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onArchive: PropTypes.func,
  onRestore: PropTypes.func,
  onRemove: PropTypes.func,
};

TransferRulesPanel.defaultProps = {
  onArchive: undefined,
  onRestore: undefined,
  onRemove: undefined,
};

export default TransferRulesPanel;
