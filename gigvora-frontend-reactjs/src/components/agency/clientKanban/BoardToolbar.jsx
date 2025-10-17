import PropTypes from 'prop-types';
import { PlusIcon, AdjustmentsHorizontalIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from './utils.js';

function Metric({ label, value, helper }) {
  return (
    <div className="flex flex-col gap-1 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{label}</span>
      <span className="text-2xl font-semibold text-slate-900">{value}</span>
      {helper ? <span className="text-xs text-slate-500">{helper}</span> : null}
    </div>
  );
}

Metric.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  helper: PropTypes.node,
};

export default function BoardToolbar({ metrics, columnSummary, onCreateColumn, onCreateCard, onTogglePanel, panelOpen }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onCreateCard}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-accentDark"
          >
            <PlusIcon className="h-4 w-4" />
            Card
          </button>
          <button
            type="button"
            onClick={onCreateColumn}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
            Column
          </button>
        </div>
        <button
          type="button"
          onClick={onTogglePanel}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
        >
          <ArrowsPointingOutIcon className="h-4 w-4" />
          {panelOpen ? 'Hide' : 'Clients'}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Pipeline" value={formatCurrency(metrics.pipelineValue)} helper={`${metrics.totalActiveCards ?? 0} active`} />
        <Metric label="Due" value={metrics.dueSoon ?? 0} helper="Next 7 days" />
        <Metric label="Risk" value={metrics.atRisk ?? 0} helper="Needs attention" />
      </div>
      {columnSummary?.length ? (
        <div className="flex flex-wrap items-center gap-2">
          {columnSummary.map((column) => (
            <span
              key={column.id}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
            >
              {column.name}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                {column.totalCards}
              </span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

BoardToolbar.propTypes = {
  metrics: PropTypes.shape({
    pipelineValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    totalActiveCards: PropTypes.number,
    dueSoon: PropTypes.number,
    atRisk: PropTypes.number,
  }),
  columnSummary: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      totalCards: PropTypes.number,
    }),
  ),
  onCreateColumn: PropTypes.func,
  onCreateCard: PropTypes.func,
  onTogglePanel: PropTypes.func,
  panelOpen: PropTypes.bool,
};

BoardToolbar.defaultProps = {
  metrics: {},
  columnSummary: [],
  panelOpen: true,
};
