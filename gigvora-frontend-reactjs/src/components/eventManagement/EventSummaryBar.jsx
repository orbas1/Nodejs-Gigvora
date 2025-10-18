import { CalendarDaysIcon, CheckCircleIcon, CurrencyDollarIcon, UsersIcon } from '@heroicons/react/24/outline';

function formatCurrency(value, currency = 'USD') {
  if (value == null) return '$0';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${currency} ${Number(value).toFixed(0)}`;
  }
}

function formatDate(value) {
  if (!value) return 'Not set';
  try {
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

const tiles = [
  {
    key: 'events',
    label: 'Live',
    icon: CalendarDaysIcon,
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    formatValue: (overview) => overview?.active ?? 0,
  },
  {
    key: 'tasks',
    label: 'Tasks',
    icon: CheckCircleIcon,
    tone: 'bg-sky-50 text-sky-700 border-sky-100',
    formatValue: (overview) => `${overview?.tasksCompleted ?? 0}/${overview?.tasksTotal ?? 0}`,
  },
  {
    key: 'guests',
    label: 'Guests',
    icon: UsersIcon,
    tone: 'bg-violet-50 text-violet-700 border-violet-100',
    formatValue: (overview) => `${overview?.guestsConfirmed ?? 0}`,
  },
  {
    key: 'budget',
    label: 'Budget',
    icon: CurrencyDollarIcon,
    tone: 'bg-amber-50 text-amber-700 border-amber-100',
    formatValue: (overview) => formatCurrency(overview?.budgetPlanned ?? 0, overview?.budgetCurrency ?? 'USD'),
  },
];

export default function EventSummaryBar({ overview, onCreate, canManage }) {
  const nextEvent = overview?.nextEvent;
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-1 lg:items-center lg:gap-4">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          const value = tile.formatValue(overview);
          return (
            <div
              key={tile.key}
              className={`flex flex-1 items-center justify-between rounded-3xl border bg-white px-5 py-4 shadow-sm ${tile.tone}`}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{tile.label}</p>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
              </div>
              <Icon className="h-8 w-8" aria-hidden="true" />
            </div>
          );
        })}
      </div>
      <div className="flex w-full max-w-sm flex-col gap-2 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Next</p>
        <p className="text-lg font-semibold text-slate-900">{nextEvent?.title ?? 'No event planned'}</p>
        <p className="text-sm text-slate-500">{nextEvent ? formatDate(nextEvent.startAt) : 'Schedule your next experience.'}</p>
        {canManage ? (
          <button
            type="button"
            onClick={onCreate}
            className="mt-1 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            New event
          </button>
        ) : null}
      </div>
    </div>
  );
}

