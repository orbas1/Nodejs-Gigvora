import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { formatAbsolute } from '../../utils/date.js';

const STATUS_TONES = {
  job_interview: 'bg-emerald-50 text-emerald-600',
  interview: 'bg-emerald-50 text-emerald-600',
  project: 'bg-blue-50 text-blue-600',
  project_milestone: 'bg-blue-50 text-blue-600',
  gig: 'bg-purple-50 text-purple-600',
  mentorship: 'bg-orange-50 text-orange-600',
  volunteering: 'bg-teal-50 text-teal-600',
  event: 'bg-indigo-50 text-indigo-600',
  networking: 'bg-sky-50 text-sky-600',
  wellbeing: 'bg-rose-50 text-rose-600',
  ritual: 'bg-slate-100 text-slate-600',
  deadline: 'bg-amber-50 text-amber-600',
};

function formatLabel(type) {
  const option = {
    job_interview: 'Job interview',
    interview: 'Interview',
    project: 'Project date',
    project_milestone: 'Project milestone',
    gig: 'Gig commitment',
    mentorship: 'Mentorship',
    volunteering: 'Volunteering',
    event: 'Community event',
    networking: 'Networking',
    wellbeing: 'Wellbeing',
    ritual: 'Ritual',
    deadline: 'Deadline',
  }[type];
  if (option) return option;
  return type ? type.replace(/[_-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Event';
}

function getTone(type) {
  return STATUS_TONES[type] ?? 'bg-slate-100 text-slate-600';
}

function sortEvents(events) {
  return [...events].sort((a, b) => {
    const aTime = a.startsAt ? new Date(a.startsAt).getTime() : Number.POSITIVE_INFINITY;
    const bTime = b.startsAt ? new Date(b.startsAt).getTime() : Number.POSITIVE_INFINITY;
    if (aTime === bTime) {
      return (a.title ?? '').localeCompare(b.title ?? '');
    }
    return aTime - bTime;
  });
}

export default function CalendarEventList({
  events,
  onEdit,
  onDelete,
  onSelect,
  onEventDragStart,
  onEventDragEnd,
  enableDrag = false,
  emptyMessage = 'No events scheduled.',
}) {
  if (!events?.length) {
    return <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">{emptyMessage}</p>;
  }

  const sorted = sortEvents(events);

  return (
    <div className="space-y-3">
      {sorted.map((event) => {
        const tone = getTone(event.eventType);
        const handleSelect = () => onSelect?.(event);
        return (
          <article
            key={event.id ?? `${event.startsAt}-${event.title}`}
            className="group rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:border-accent focus-within:border-accent"
            role="button"
            tabIndex={0}
            onClick={handleSelect}
            onKeyDown={(keyboardEvent) => {
              if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                keyboardEvent.preventDefault();
                handleSelect();
              }
            }}
            draggable={enableDrag}
            onDragStart={
              enableDrag
                ? (dragEvent) => {
                    try {
                      dragEvent.dataTransfer.effectAllowed = 'move';
                      if (event?.id != null) {
                        dragEvent.dataTransfer.setData('text/calendar-event-id', String(event.id));
                      }
                    } catch (error) {
                      // Ignore data transfer issues in environments without full drag-drop support.
                    }
                    onEventDragStart?.({ nativeEvent: dragEvent, event });
                  }
                : undefined
            }
            onDragEnd={
              enableDrag
                ? (dragEvent) => {
                    onEventDragEnd?.({ nativeEvent: dragEvent, event });
                  }
                : undefined
            }
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">{event.title}</h4>
                <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
                  <CalendarDaysIcon className="h-4 w-4" />
                  {formatLabel(event.eventType)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                {onEdit ? (
                  <button
                    type="button"
                    onClick={(eventObject) => {
                      eventObject.stopPropagation();
                      onEdit(event);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-medium text-slate-600 transition hover:border-accent hover:text-accent"
                  >
                    <PencilSquareIcon className="h-4 w-4" /> Edit
                  </button>
                ) : null}
                {onDelete ? (
                  <button
                    type="button"
                    onClick={(eventObject) => {
                      eventObject.stopPropagation();
                      onDelete(event);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-medium text-slate-600 transition hover:border-rose-300 hover:text-rose-600"
                  >
                    <TrashIcon className="h-4 w-4" /> Delete
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-slate-400" />
                <span>
                  {event.startsAt ? formatAbsolute(event.startsAt, { dateStyle: 'medium', timeStyle: 'short' }) : 'Scheduled'}
                  {event.endsAt ? ` — ${formatAbsolute(event.endsAt, { timeStyle: 'short' })}` : null}
                </span>
              </p>
              {event.location ? (
                <p className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-slate-400" />
                  <span className="truncate">{event.location}</span>
                </p>
              ) : null}
            </div>

            <div className="mt-3 flex items-center justify-end text-slate-400">
              <ChevronRightIcon className="h-4 w-4 transition group-hover:text-accent" aria-hidden="true" />
              <span className="sr-only">Open</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
