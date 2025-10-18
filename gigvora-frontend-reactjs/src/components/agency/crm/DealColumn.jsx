import PropTypes from 'prop-types';
import { ArrowsPointingOutIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import SegmentBadge from './SegmentBadge.jsx';

export default function DealColumn({
  column,
  currencyFormatter,
  percentFormatter,
  onInspectDeal,
  onEditDeal,
  onDeleteDeal,
}) {
  return (
    <div className="flex w-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <header className="flex items-baseline justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{column.name}</h3>
          <p className="text-xs text-slate-500">{column.deals.length} active</p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>{currencyFormatter(column.totalValue)}</p>
          <p className="text-[11px] text-slate-400">Weighted {currencyFormatter(column.weightedValue)}</p>
        </div>
      </header>
      <div className="space-y-3">
        {column.deals.map((deal) => (
          <button
            key={deal.id}
            type="button"
            onClick={() => onInspectDeal?.(deal)}
            className="w-full rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-left transition hover:border-accent hover:bg-white"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{deal.title}</p>
                <p className="text-xs text-slate-500">{deal.clientName}</p>
              </div>
              <div className="flex gap-1">
                <span className="inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-1 text-[11px] font-semibold text-slate-500">
                  <ArrowsPointingOutIcon className="h-3.5 w-3.5" aria-hidden="true" /> View
                </span>
              </div>
            </div>
            <dl className="mt-3 grid gap-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <dt>Value</dt>
                <dd className="font-semibold text-slate-900">{currencyFormatter(deal.pipelineValue)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Stage win</dt>
                <dd>{percentFormatter((deal.winProbability ?? deal.stage?.winProbability ?? 0) / 100)}</dd>
              </div>
              {deal.nextFollowUpAt ? (
                <div className="flex justify-between">
                  <dt>Next touch</dt>
                  <dd>{new Date(deal.nextFollowUpAt).toLocaleDateString()}</dd>
                </div>
              ) : null}
              {deal.tags?.length ? (
                <div className="flex flex-wrap gap-1 pt-1">
                  {deal.tags.map((tag) => (
                    <SegmentBadge key={tag}>{tag}</SegmentBadge>
                  ))}
                </div>
              ) : null}
            </dl>
            <div className="mt-4 flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onEditDeal?.(deal);
                }}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              >
                <PencilSquareIcon className="h-3.5 w-3.5" aria-hidden="true" /> Edit
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteDeal?.(deal);
                }}
                className="inline-flex items-center gap-1 rounded-full border border-transparent px-3 py-1 font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-50"
              >
                <TrashIcon className="h-3.5 w-3.5" aria-hidden="true" /> Delete
              </button>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

DealColumn.propTypes = {
  column: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string.isRequired,
    totalValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    weightedValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    deals: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
        title: PropTypes.string.isRequired,
        clientName: PropTypes.string,
        pipelineValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        winProbability: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        nextFollowUpAt: PropTypes.string,
        tags: PropTypes.arrayOf(PropTypes.string),
        stage: PropTypes.shape({ winProbability: PropTypes.oneOfType([PropTypes.number, PropTypes.string]) }),
      }),
    ).isRequired,
  }).isRequired,
  currencyFormatter: PropTypes.func.isRequired,
  percentFormatter: PropTypes.func.isRequired,
  onInspectDeal: PropTypes.func,
  onEditDeal: PropTypes.func,
  onDeleteDeal: PropTypes.func,
};

DealColumn.defaultProps = {
  onInspectDeal: undefined,
  onEditDeal: undefined,
  onDeleteDeal: undefined,
};
