import PropTypes from 'prop-types';
import WalletStatusPill from '../WalletStatusPill.jsx';
import { formatCurrency, formatDate, formatStatus } from '../walletFormatting.js';

function FundingSourceCard({ source, isPrimary, onEdit, onMakePrimary }) {
  const currency = source.currencyCode ?? 'USD';
  const descriptorParts = [formatStatus(source.type)];
  if (isPrimary) {
    descriptorParts.push('Primary funding source');
  }
  if (source.requiresManualReview) {
    descriptorParts.push('Requires manual review');
  }
  const actionDescriptor = `${source.label} ${descriptorParts.join(' · ')}`.trim();

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <h4 className="text-base font-semibold text-slate-900">{source.label}</h4>
          <p className="text-xs uppercase tracking-wide text-slate-400">{formatStatus(source.type)}</p>
        </div>
        <WalletStatusPill value={source.status ?? (source.isVerified ? 'active' : 'pending')} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-slate-600">Provider</span>
          <span>{source.provider || 'Custom'}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-slate-600">Digits</span>
          <span>{source.lastFour ? `•••• ${source.lastFour}` : '—'}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-slate-600">Connected</span>
          <span>{formatDate(source.connectedAt)}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-slate-600">Limits</span>
          <span>{source.limitAmount ? formatCurrency(source.limitAmount, currency) : 'No limit'}</span>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {isPrimary ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-600">Primary</span> : null}
          {source.requiresManualReview ? <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-600">Review</span> : null}
        </div>
        <div className="flex items-center gap-2">
          {!isPrimary && onMakePrimary ? (
            <button
              type="button"
              onClick={() => onMakePrimary(source)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              aria-label={`Set ${source.label} as the primary funding source`}
              title={`Set ${source.label} as primary`}
            >
              Set primary
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onEdit(source)}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
            aria-label={`Edit ${actionDescriptor}`}
            title={`Edit ${source.label}`}
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

FundingSourceCard.propTypes = {
  source: PropTypes.object.isRequired,
  isPrimary: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onMakePrimary: PropTypes.func,
};

FundingSourceCard.defaultProps = {
  isPrimary: false,
  onMakePrimary: undefined,
};

function FundingSourcesPanel({ sources, primaryId, onCreate, onEdit, onMakePrimary }) {
  const sortedSources = [...sources].sort((a, b) => {
    const aPrimary = primaryId === a.id || a.isPrimary;
    const bPrimary = primaryId === b.id || b.isPrimary;
    if (aPrimary !== bPrimary) {
      return aPrimary ? -1 : 1;
    }
    return new Date(b.connectedAt ?? 0) - new Date(a.connectedAt ?? 0);
  });

  return (
    <div className="flex flex-col gap-4" id="wallet-sources" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Sources</h3>
        <button
          type="button"
          onClick={onCreate}
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent/90"
        >
          Add source
        </button>
      </div>
      {sortedSources.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedSources.map((source) => (
            <FundingSourceCard
              key={source.id}
              source={source}
              isPrimary={primaryId === source.id || source.isPrimary}
              onEdit={onEdit}
              onMakePrimary={onMakePrimary}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          Connect a payout method to get started.
        </div>
      )}
    </div>
  );
}

FundingSourcesPanel.propTypes = {
  sources: PropTypes.arrayOf(PropTypes.object).isRequired,
  primaryId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onMakePrimary: PropTypes.func,
};

FundingSourcesPanel.defaultProps = {
  primaryId: null,
  onMakePrimary: undefined,
};

export default FundingSourcesPanel;
