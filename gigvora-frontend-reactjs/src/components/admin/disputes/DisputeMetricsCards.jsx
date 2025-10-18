import PropTypes from 'prop-types';
import {
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UsersIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

const CARD_DEFINITIONS = [
  {
    key: 'openCount',
    title: 'Open',
    icon: ArrowTrendingUpIcon,
    tone: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    key: 'overdueCount',
    title: 'Overdue',
    icon: ExclamationTriangleIcon,
    tone: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    key: 'dueSoonCount',
    title: 'Due soon',
    icon: ClockIcon,
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    key: 'unassignedCount',
    title: 'Unassigned',
    icon: UsersIcon,
    tone: 'bg-slate-50 text-slate-700 border-slate-200',
  },
  {
    key: 'totalHeldAmount',
    title: 'Escrow',
    icon: CurrencyDollarIcon,
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    formatter: (value) =>
      new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value ?? 0),
  },
];

function formatValue(definition, summary = {}) {
  const value = summary?.[definition.key];
  if (definition.formatter) {
    return definition.formatter(value ?? 0);
  }
  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) ? numeric : 0;
}

export default function DisputeMetricsCards({ summary, onSelect }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
      {CARD_DEFINITIONS.map((definition) => {
        const Icon = definition.icon;
        return (
          <article
            key={definition.key}
            className={`flex h-full min-h-[150px] flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${definition.tone}`}
            role="button"
            tabIndex={0}
            onClick={() => {
              onSelect?.(definition.key);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect?.(definition.key);
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{definition.title}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight">{formatValue(definition, summary)}</p>
              </div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-current/10 bg-white/70">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

DisputeMetricsCards.propTypes = {
  summary: PropTypes.shape({
    openCount: PropTypes.number,
    overdueCount: PropTypes.number,
    dueSoonCount: PropTypes.number,
    unassignedCount: PropTypes.number,
    totalHeldAmount: PropTypes.number,
  }),
  onSelect: PropTypes.func,
};

DisputeMetricsCards.defaultProps = {
  summary: {
    openCount: 0,
    overdueCount: 0,
    dueSoonCount: 0,
    unassignedCount: 0,
    totalHeldAmount: 0,
  },
  onSelect: undefined,
};
