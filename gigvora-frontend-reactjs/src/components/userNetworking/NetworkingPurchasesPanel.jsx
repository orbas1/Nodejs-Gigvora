import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { formatRelativeTime } from '../../utils/date.js';
import classNames from '../../utils/classNames.js';
import { formatMoneyFromCents, formatStatusLabel, resolveSessionLabel } from './utils.js';

const FILTERS = [
  { id: 'All', predicate: () => true },
  { id: 'Paid', predicate: (order) => order.status === 'paid' },
  { id: 'Pending', predicate: (order) => order.status === 'pending' },
  { id: 'Refunded', predicate: (order) => order.status === 'refunded' },
];

function FilterBar({ active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => {
        const isActive = filter.id === active;
        return (
          <button
            key={filter.id}
            type="button"
            className={classNames(
              'rounded-full px-3 py-1 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2',
              isActive
                ? 'bg-slate-900 text-white shadow-sm focus:ring-slate-200'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 focus:ring-slate-300',
            )}
            onClick={() => onChange(filter.id)}
          >
            {filter.id}
          </button>
        );
      })}
    </div>
  );
}

FilterBar.propTypes = {
  active: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default function NetworkingPurchasesPanel({ purchases, activeFilter, onChangeFilter, onCreate, onEdit, onOpen }) {
  const filterDefinition = useMemo(
    () => FILTERS.find((filter) => filter.id === activeFilter) ?? FILTERS[0],
    [activeFilter],
  );

  const filteredPurchases = useMemo(
    () => purchases.filter((order) => filterDefinition.predicate(order)),
    [purchases, filterDefinition],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar active={filterDefinition.id} onChange={onChangeFilter} />
        <button
          type="button"
          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
          onClick={onCreate}
        >
          Add
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filteredPurchases.length ? (
          filteredPurchases.map((order) => {
            const sessionLabel = resolveSessionLabel(order.session, order.sessionId);
            const amount = formatMoneyFromCents(order.amountCents, order.currency);
            return (
              <div key={order.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{sessionLabel}</p>
                    <p className="text-xs text-slate-500">{amount}</p>
                    <p className="text-[11px] text-slate-400">{formatRelativeTime(order.purchasedAt)}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {formatStatusLabel(order.status)}
                  </span>
                </div>

                <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                  <div>
                    <span className="block font-semibold text-slate-500">Reference</span>
                    <span>{order.reference || '—'}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-500">Notes</span>
                    <span className="line-clamp-2 text-slate-500">{order.notes || order.metadata?.userNotes || '—'}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    onClick={() => onOpen(order)}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                    onClick={() => onEdit(order)}
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center text-sm text-slate-500">
            No spend captured yet. Use Add to log purchases.
          </div>
        )}
      </div>
    </div>
  );
}

NetworkingPurchasesPanel.propTypes = {
  purchases: PropTypes.arrayOf(PropTypes.object),
  activeFilter: PropTypes.string.isRequired,
  onChangeFilter: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onOpen: PropTypes.func.isRequired,
};

NetworkingPurchasesPanel.defaultProps = {
  purchases: [],
};
