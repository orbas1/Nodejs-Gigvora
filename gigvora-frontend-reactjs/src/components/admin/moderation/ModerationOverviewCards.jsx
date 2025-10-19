import PropTypes from 'prop-types';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  InboxStackIcon,
  UserMinusIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const CARD_DEFINITIONS = [
  {
    key: 'queueOpen',
    title: 'Queue backlog',
    icon: InboxStackIcon,
    tone: 'bg-blue-50 text-blue-700 border-blue-200',
    accessor: (overview) => overview?.queue?.open ?? 0,
  },
  {
    key: 'highSeverity',
    title: 'High severity',
    icon: ExclamationTriangleIcon,
    tone: 'bg-rose-50 text-rose-700 border-rose-200',
    accessor: (overview) => (overview?.totals?.high ?? 0) + (overview?.totals?.critical ?? 0),
  },
  {
    key: 'autoBlocks',
    title: 'Auto blocks (7d)',
    icon: ShieldCheckIcon,
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    accessor: (overview) => overview?.actions?.message_blocked ?? 0,
  },
  {
    key: 'moderatorMutes',
    title: 'Members muted',
    icon: UserMinusIcon,
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
    accessor: (overview) => overview?.actions?.participant_muted ?? 0,
  },
  {
    key: 'avgResolution',
    title: 'Avg resolution',
    icon: ClockIcon,
    tone: 'bg-slate-50 text-slate-700 border-slate-200',
    accessor: (overview) => formatResolutionDuration(overview?.averageResolutionSeconds),
    formatter: (value) => value,
  },
];

function formatResolutionDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '—';
  }
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }
  if (hours >= 1) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function resolveValue(definition, overview) {
  if (definition.accessor) {
    return definition.accessor(overview);
  }
  return overview?.[definition.key] ?? 0;
}

export default function ModerationOverviewCards({ overview, onSelect }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
      {CARD_DEFINITIONS.map((definition) => {
        const Icon = definition.icon;
        const value = resolveValue(definition, overview);
        const displayValue = definition.formatter ? definition.formatter(value) : value;
        return (
          <article
            key={definition.key}
            className={`flex h-full min-h-[150px] flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${definition.tone}`}
            role="button"
            tabIndex={0}
            onClick={() => onSelect?.(definition.key)}
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
                <p className="mt-2 text-3xl font-bold tracking-tight">{displayValue}</p>
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

ModerationOverviewCards.propTypes = {
  overview: PropTypes.shape({
    queue: PropTypes.shape({
      open: PropTypes.number,
    }),
    totals: PropTypes.shape({
      high: PropTypes.number,
      critical: PropTypes.number,
    }),
    actions: PropTypes.shape({
      message_blocked: PropTypes.number,
      participant_muted: PropTypes.number,
    }),
    averageResolutionSeconds: PropTypes.number,
  }),
  onSelect: PropTypes.func,
};

ModerationOverviewCards.defaultProps = {
  overview: {
    queue: { open: 0 },
    totals: { high: 0, critical: 0 },
    actions: { message_blocked: 0, participant_muted: 0 },
    averageResolutionSeconds: null,
  },
  onSelect: undefined,
};
