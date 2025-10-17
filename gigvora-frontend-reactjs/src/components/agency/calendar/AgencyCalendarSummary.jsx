import { CalendarDaysIcon, ExclamationTriangleIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

const CARD_CONFIG = [
  {
    id: 'total',
    label: 'Total',
    icon: CalendarDaysIcon,
    valueKey: 'total',
    footerKey: 'upcomingToday',
    formatValue: (value) => value ?? 0,
    buildFooter: (summary) => {
      const today = summary.upcomingToday ?? 0;
      return today === 1 ? '1 today' : `${today} today`;
    },
  },
  {
    id: 'attention',
    label: 'Alerts',
    icon: ExclamationTriangleIcon,
    valueKey: 'requiresAttention',
    formatValue: (value) => value ?? 0,
    buildFooter: () => 'Check overdue items',
  },
  {
    id: 'next',
    label: 'Next',
    icon: RocketLaunchIcon,
    valueKey: 'nextEvent',
    formatValue: (value) => value?.title ?? 'None',
    buildFooter: (summary) => {
      const next = summary.nextEvent?.startsAt ? new Date(summary.nextEvent.startsAt) : null;
      if (!next) {
        return 'Nothing scheduled';
      }
      return new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(next);
    },
  },
];

export default function AgencyCalendarSummary({ summary = {} }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CARD_CONFIG.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900/5 text-slate-900">
                <Icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900">
              {card.formatValue(summary[card.valueKey])}
            </p>
            <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
              {card.buildFooter(summary)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
