import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarDaysIcon,
  ClockIcon,
  EyeIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  TrashIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { formatDateForDisplay } from './timelineUtils.js';

export default function TimelineDetail({
  timeline,
  events,
  loading,
  busy,
  onEditTimeline,
  onDeleteTimeline,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  onReorderEvent,
  onPreviewEvent,
}) {
  if (!timeline) {
    return (
      <section className="relative flex min-h-[24rem] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white text-center text-slate-500">
        {loading ? (
          <div className="absolute inset-x-12 top-8 h-1 rounded-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />
        ) : null}
        <CalendarDaysIcon className="h-10 w-10 text-slate-300" />
        <p className="mt-4 text-base font-medium text-slate-600">
          {loading ? 'Loading timeline…' : 'Choose a timeline to get started'}
        </p>
        {!loading ? (
          <p className="mt-1 text-sm text-slate-500">Pick a record on the left or create a new one.</p>
        ) : null}
      </section>
    );
  }

  const hasEvents = Array.isArray(events) && events.length > 0;
  const scheduleLabel = (() => {
    const start = formatDateForDisplay(timeline.startDate);
    const end = formatDateForDisplay(timeline.endDate);
    if (start && end) {
      return `${start} → ${end}`;
    }
    if (start) {
      return `${start} onwards`;
    }
    if (end) {
      return `Up to ${end}`;
    }
    return 'Schedule pending';
  })();

  const handleDeleteTimeline = () => {
    if (busy) return;
    if (window.confirm('Delete this timeline? This cannot be undone.')) {
      onDeleteTimeline?.(timeline.id);
    }
  };

  return (
    <section className="relative flex min-h-[24rem] flex-col gap-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      {loading ? (
        <div className="absolute inset-x-6 top-6 h-1 rounded-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />
      ) : null}
      <header className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              {timeline.timelineType || 'Timeline'}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              {timeline.status ?? 'Draft'}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              {timeline.visibility ?? 'Internal'}
            </span>
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">{timeline.name}</h2>
          {timeline.summary ? (
            <p className="text-sm text-slate-600">{timeline.summary}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onEditTimeline?.(timeline)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={handleDeleteTimeline}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-60"
          >
            <TrashIcon className="h-4 w-4" />
            Delete
          </button>
          <button
            type="button"
            onClick={() => onAddEvent?.()}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            + Event
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <ClockIcon className="h-4 w-4" />
            Schedule
          </dt>
          <dd className="mt-2 text-lg font-semibold text-slate-900">{scheduleLabel}</dd>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <UserCircleIcon className="h-4 w-4" />
            Owner
          </dt>
          <dd className="mt-2 space-y-1 text-sm text-slate-700">
            {timeline.settings?.programOwner ? <p className="font-semibold text-slate-900">{timeline.settings.programOwner}</p> : <p className="text-slate-500">No owner</p>}
            {timeline.settings?.programEmail ? <p className="text-xs text-slate-500">{timeline.settings.programEmail}</p> : null}
          </dd>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <ShieldCheckIcon className="h-4 w-4" />
            Channel
          </dt>
          <dd className="mt-2 text-sm text-slate-700">
            {timeline.settings?.coordinationChannel || 'Not set'}
          </dd>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Risk
          </dt>
          <dd className="mt-2 text-sm text-slate-700">
            {timeline.settings?.riskNotes || 'No notes'}
          </dd>
        </div>
      </div>

      {timeline.description ? (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Overview</h3>
          <p className="mt-2 text-sm text-slate-700">{timeline.description}</p>
        </div>
      ) : null}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Milestones</h3>
          <span className="text-sm text-slate-500">{events.length} events</span>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {hasEvents ? (
            events.map((event, index) => {
              const start = formatDateForDisplay(event.startDate) ?? 'Unset';
              const due = formatDateForDisplay(event.dueDate);
              const end = formatDateForDisplay(event.endDate);
              return (
                <article
                  key={event.id}
                  className="group relative flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <header className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{event.eventType}</p>
                      <h4 className="mt-1 text-lg font-semibold text-slate-900">{event.title}</h4>
                    </div>
                    <span
                      className="inline-flex items-center rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-white"
                    >
                      {event.status}
                    </span>
                  </header>
                  {event.summary ? <p className="text-sm text-slate-600">{event.summary}</p> : null}
                  <dl className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                    <div>
                      <dt className="font-semibold uppercase tracking-wide">Start</dt>
                      <dd className="mt-0.5 text-sm text-slate-900">{start}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold uppercase tracking-wide">Due</dt>
                      <dd className="mt-0.5 text-sm text-slate-900">{due ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold uppercase tracking-wide">End</dt>
                      <dd className="mt-0.5 text-sm text-slate-900">{end ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold uppercase tracking-wide">Owner</dt>
                      <dd className="mt-0.5 text-sm text-slate-900">{event.ownerName || 'Unassigned'}</dd>
                    </div>
                  </dl>
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-medium text-slate-500">
                    <span>#{index + 1}</span>
                    {event.tags?.slice?.(0, 4)?.map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onPreviewEvent?.(event)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <EyeIcon className="h-4 w-4" />
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditEvent?.(event)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (busy) return;
                        if (window.confirm('Remove this event?')) {
                          onDeleteEvent?.(event.id);
                        }
                      }}
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 disabled:opacity-60"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                  <div className="absolute right-4 top-4 flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => onReorderEvent?.(event.id, 'up')}
                      className="rounded-full border border-slate-200 bg-white p-1 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50"
                      title="Move up"
                    >
                      <ArrowUpIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onReorderEvent?.(event.id, 'down')}
                      className="rounded-full border border-slate-200 bg-white p-1 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50"
                      title="Move down"
                    >
                      <ArrowDownIcon className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="flex min-h-[12rem] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
              <CalendarDaysIcon className="h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-600">No milestones yet</p>
              <button
                type="button"
                onClick={() => onAddEvent?.()}
                className="mt-3 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Add event
              </button>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
