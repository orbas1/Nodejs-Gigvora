import PropTypes from 'prop-types';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function DealPreview({
  deal,
  currencyFormatter,
  percentFormatter,
  onEdit,
  onDelete,
}) {
  if (!deal) {
    return null;
  }

  const closeDate = deal.expectedCloseDate ? new Date(deal.expectedCloseDate) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{deal.title}</h2>
          <p className="text-sm text-slate-500">{deal.clientName}</p>
        </div>
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => onEdit?.(deal)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
          >
            <PencilSquareIcon className="h-4 w-4" aria-hidden="true" /> Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(deal)}
            className="inline-flex items-center gap-2 rounded-full border border-transparent px-4 py-2 font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-50"
          >
            <TrashIcon className="h-4 w-4" aria-hidden="true" /> Delete
          </button>
        </div>
      </div>

      <dl className="grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Stage</dt>
          <dd className="text-sm text-slate-900">{deal.stage?.name ?? 'Stage TBD'}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Value</dt>
          <dd className="text-sm text-slate-900">{currencyFormatter(deal.pipelineValue)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Win chance</dt>
          <dd className="text-sm text-slate-900">{percentFormatter((deal.winProbability ?? deal.stage?.winProbability ?? 0) / 100)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Close target</dt>
          <dd className="text-sm text-slate-900">{closeDate ? closeDate.toLocaleDateString() : 'Not set'}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Source</dt>
          <dd className="text-sm text-slate-900">{deal.source || 'Not tracked'}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Next follow-up</dt>
          <dd className="text-sm text-slate-900">
            {deal.nextFollowUpAt ? new Date(deal.nextFollowUpAt).toLocaleString() : 'None scheduled'}
          </dd>
        </div>
      </dl>

      {deal.description ? (
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</dt>
          <dd className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{deal.description}</dd>
        </div>
      ) : null}
    </div>
  );
}

DealPreview.propTypes = {
  deal: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    title: PropTypes.string,
    clientName: PropTypes.string,
    pipelineValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    winProbability: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    stage: PropTypes.shape({ name: PropTypes.string, winProbability: PropTypes.oneOfType([PropTypes.number, PropTypes.string]) }),
    expectedCloseDate: PropTypes.string,
    source: PropTypes.string,
    nextFollowUpAt: PropTypes.string,
    description: PropTypes.string,
  }),
  currencyFormatter: PropTypes.func.isRequired,
  percentFormatter: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};

DealPreview.defaultProps = {
  deal: null,
  onEdit: undefined,
  onDelete: undefined,
};
