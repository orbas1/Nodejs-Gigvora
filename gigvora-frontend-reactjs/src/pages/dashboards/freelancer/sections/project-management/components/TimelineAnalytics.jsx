import PropTypes from 'prop-types';
import { formatCurrency, formatDate, formatPercent } from '../utils.js';

function TimelineRow({ item }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600 shadow-sm">
      <div>
        <p className="font-semibold text-slate-900">{item.label}</p>
        <p className="text-xs text-slate-500">Due {formatDate(item.dueDate)}</p>
      </div>
      <div className="text-right text-xs text-slate-500">
        <p>{formatPercent(item.progress)}</p>
        {item.budget ? <p className="mt-1 font-semibold text-slate-700">{formatCurrency(item.budget.amount, item.budget.currency)}</p> : null}
      </div>
    </div>
  );
}

TimelineRow.propTypes = {
  item: PropTypes.shape({
    label: PropTypes.string,
    dueDate: PropTypes.string,
    progress: PropTypes.number,
    budget: PropTypes.shape({ amount: PropTypes.number, currency: PropTypes.string }),
  }).isRequired,
};

export default function TimelineAnalytics({ milestones }) {
  if (!milestones.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-500">
        Timeline analytics will appear once projects include milestones.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {milestones.map((item) => (
        <TimelineRow key={item.id ?? item.label} item={item} />
      ))}
    </div>
  );
}

TimelineAnalytics.propTypes = {
  milestones: PropTypes.arrayOf(PropTypes.object),
};

TimelineAnalytics.defaultProps = {
  milestones: [],
};
