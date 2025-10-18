import { CalendarDaysIcon, ClockIcon, ExclamationTriangleIcon, UsersIcon } from '@heroicons/react/24/outline';

const CARD_ICONS = [CalendarDaysIcon, ClockIcon, UsersIcon, ExclamationTriangleIcon];

function formatNextEvent(event) {
  if (!event?.startsAt) {
    return '—';
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(event.startsAt));
  } catch (error) {
    return event.startsAt;
  }
}

export default function CalendarSummary({ summary, onCreate }) {
  const totals = summary?.totalsByType ?? {};
  const cards = [
    {
      label: 'Events',
      value: summary?.totalEvents ?? 0,
    },
    {
      label: 'Next',
      value: summary?.nextEvent?.title ?? 'No event',
      helper: formatNextEvent(summary?.nextEvent),
    },
    {
      label: 'Interviews',
      value: totals.interview ?? 0,
    },
    {
      label: 'Overdue',
      value: summary?.overdueCount ?? 0,
    },
  ];

  return (
    <section id="calendar-overview" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
        <button
          type="button"
          onClick={onCreate}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          New event
        </button>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => {
          const Icon = CARD_ICONS[index % CARD_ICONS.length];
          return (
            <div key={card.label} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white p-2 text-blue-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</dt>
                  <dd className="text-lg font-semibold text-slate-900">{card.value}</dd>
                  {card.helper ? <p className="text-xs text-slate-500">{card.helper}</p> : null}
                </div>
              </div>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
