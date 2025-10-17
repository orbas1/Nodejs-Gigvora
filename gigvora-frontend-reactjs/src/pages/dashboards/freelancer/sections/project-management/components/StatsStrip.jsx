import PropTypes from 'prop-types';
import { formatCurrency, formatPercent } from '../utils.js';

const toneStyles = {
  primary: 'bg-slate-900 text-white',
  accent: 'bg-accent text-white',
  amber: 'bg-amber-100 text-amber-800',
  emerald: 'bg-emerald-100 text-emerald-800',
};

function StatCard({ label, value, tone }) {
  return (
    <div className={`flex flex-col justify-between gap-2 rounded-2xl p-5 shadow-sm ${toneStyles[tone] || toneStyles.primary}`}>
      <span className="text-xs uppercase tracking-wide opacity-80">{label}</span>
      <span className="text-2xl font-semibold">{value}</span>
    </div>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  tone: PropTypes.oneOf(['primary', 'accent', 'amber', 'emerald']),
};

StatCard.defaultProps = {
  tone: 'primary',
};

export default function StatsStrip({ stats, currency }) {
  if (!stats) {
    return null;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Open" value={stats.openCount ?? 0} tone="primary" />
      <StatCard label="Closed" value={stats.closedCount ?? 0} tone="accent" />
      <StatCard label="Budget in play" value={formatCurrency(stats.budgetInPlay ?? 0, currency)} tone="amber" />
      <StatCard label="Average progress" value={formatPercent(stats.averageProgress ?? 0)} tone="emerald" />
    </div>
  );
}

StatsStrip.propTypes = {
  stats: PropTypes.shape({
    openCount: PropTypes.number,
    closedCount: PropTypes.number,
    budgetInPlay: PropTypes.number,
    averageProgress: PropTypes.number,
  }),
  currency: PropTypes.string,
};

StatsStrip.defaultProps = {
  stats: null,
  currency: 'USD',
};
