import { CalendarDaysIcon, ClockIcon, UsersIcon } from '@heroicons/react/24/outline';

const cards = [
  { id: 'accounts', label: 'Accounts', icon: UsersIcon },
  { id: 'slots', label: 'Slots', icon: ClockIcon },
  { id: 'events', label: 'Events', icon: CalendarDaysIcon },
];

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch (error) {
    return '—';
  }
}

export default function CalendarOverviewPanel({
  metrics,
  events,
  onSelectEvent,
  onNavigate,
  onCreateEvent,
  onOpenSlots,
  onCreateTemplate,
}) {
  const upcomingEvents = [...events]
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 4);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,_2fr)_minmax(0,_1fr)]">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            const content = metrics?.[card.id] ?? {};
            const total = content.total ?? 0;
            const highlight = (() => {
              if (card.id === 'accounts') return content.connected ?? 0;
              if (card.id === 'events') return content.upcoming ?? 0;
              if (card.id === 'slots') return content.open ?? content.total ?? 0;
              return content.total ?? 0;
            })();
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onNavigate(card.id)}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="text-2xl font-semibold text-slate-900">{total}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {card.id === 'accounts' ? `${highlight} connected` : card.id === 'events' ? `${highlight} upcoming` : `${highlight} open`}
                </p>
              </button>
            );
          })}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Upcoming</h2>
            <button
              type="button"
              onClick={() => onNavigate('events')}
              className="text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
            >
              View all
            </button>
          </div>
          <ul className="mt-5 space-y-4">
            {upcomingEvents.length === 0 ? (
              <li className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No events
              </li>
            ) : (
              upcomingEvents.map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => onSelectEvent(event)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
                  >
                    <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{event.eventType}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      {formatDate(event.startsAt)} → {formatDate(event.endsAt)}
                    </p>
                    {event.calendarAccount?.displayName ? (
                      <p className="mt-1 text-xs text-slate-400">{event.calendarAccount.displayName}</p>
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <aside className="space-y-6">
        <div
          data-testid="calendar-quick-actions"
          className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-lg"
        >
          <h2 className="text-lg font-semibold">Quick</h2>
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={onCreateEvent ?? (() => onNavigate('events'))}
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              New event
            </button>
            <button
              type="button"
              onClick={onOpenSlots ?? (() => onNavigate('slots'))}
              className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-white shadow-inner transition hover:bg-slate-700"
            >
              Slots
            </button>
            <button
              type="button"
              onClick={onCreateTemplate ?? (() => onNavigate('types'))}
              className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-white shadow-inner transition hover:bg-slate-700"
            >
              New type
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
