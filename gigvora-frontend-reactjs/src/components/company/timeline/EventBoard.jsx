import PropTypes from 'prop-types';
import {
  CalendarIcon,
  ClockIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import StatusPill from './StatusPill.jsx';
import { formatAbsolute, formatRelativeTime } from '../../../utils/date.js';

const STATUS_TONES = {
  planned: 'blue',
  in_progress: 'amber',
  completed: 'green',
  blocked: 'rose',
};

function EmptyState({ onNew }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
      <CalendarIcon className="h-10 w-10 text-slate-300" aria-hidden="true" />
      <p className="mt-4 text-sm font-semibold text-slate-600">No events yet</p>
      <p className="mt-1 text-sm text-slate-500">Track milestones, launches, and hiring checkpoints.</p>
      <button
        type="button"
        onClick={onNew}
        className="mt-5 inline-flex items-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
      >
        New event
      </button>
    </div>
  );
}

EmptyState.propTypes = {
  onNew: PropTypes.func.isRequired,
};

function EventCard({ event, onOpen, onDelete }) {
  const ownerName = event.owner
    ? `${event.owner.firstName ?? ''} ${event.owner.lastName ?? ''}`.trim() || event.owner.email
    : null;
  const dueDate = event.dueDate ?? event.startDate;
  return (
    <article
      className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-100 bg-white px-4 py-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      onClick={() => onOpen(event)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{event.title}</h3>
          {ownerName ? <p className="mt-1 text-xs font-medium text-slate-500">Owner • {ownerName}</p> : null}
        </div>
        <StatusPill tone={STATUS_TONES[event.status] ?? 'slate'}>{event.status.replace('_', ' ')}</StatusPill>
      </div>
      <dl className="mt-4 space-y-2 text-sm text-slate-600">
        {event.startDate ? (
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <span>{formatAbsolute(event.startDate)}</span>
          </div>
        ) : null}
        {dueDate ? (
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <span>
              Due {formatRelativeTime(dueDate)}
              <span className="ml-1 text-xs text-slate-400">({formatAbsolute(dueDate)})</span>
            </span>
          </div>
        ) : null}
        {event.category ? <div className="text-xs uppercase tracking-wide text-slate-400">{event.category}</div> : null}
      </dl>
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={(eventClick) => {
            eventClick.stopPropagation();
            onOpen(event);
          }}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
        >
          <PencilSquareIcon className="h-4 w-4" aria-hidden="true" /> Edit
        </button>
        <button
          type="button"
          onClick={(eventClick) => {
            eventClick.stopPropagation();
            onDelete(event);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
        >
          <TrashIcon className="h-4 w-4" aria-hidden="true" /> Remove
        </button>
      </div>
    </article>
  );
}

EventCard.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    category: PropTypes.string,
    startDate: PropTypes.string,
    dueDate: PropTypes.string,
    owner: PropTypes.shape({
      firstName: PropTypes.string,
      lastName: PropTypes.string,
      email: PropTypes.string,
    }),
  }).isRequired,
  onOpen: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default function EventBoard({ events, upcoming, overdue, statusCounts, onNew, onOpen, onDelete }) {
  const sortedEvents = [...events].sort((a, b) => {
    const aDate = new Date(a.startDate ?? a.dueDate ?? 0).getTime();
    const bDate = new Date(b.startDate ?? b.dueDate ?? 0).getTime();
    return aDate - bDate;
  });

  const statusSummary = [
    { id: 'planned', label: 'Planned', value: statusCounts?.planned ?? 0 },
    { id: 'in_progress', label: 'Active', value: statusCounts?.in_progress ?? 0 },
    { id: 'completed', label: 'Done', value: statusCounts?.completed ?? 0 },
    { id: 'blocked', label: 'Blocked', value: statusCounts?.blocked ?? 0 },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)]">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Events</h2>
          <button
            type="button"
            onClick={onNew}
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            New event
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {statusSummary.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              <span>{item.label}</span>
              <span className="text-slate-900">{item.value}</span>
            </div>
          ))}
        </div>

        {sortedEvents.length === 0 ? (
          <EmptyState onNew={onNew} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sortedEvents.map((event) => (
              <EventCard key={event.id} event={event} onOpen={onOpen} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">Upcoming</h3>
          <ul className="mt-3 space-y-2">
            {(upcoming ?? []).slice(0, 6).map((item) => (
              <li key={item.id} className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{item.title}</span>
                  <StatusPill tone={STATUS_TONES[item.status] ?? 'slate'}>{item.status.replace('_', ' ')}</StatusPill>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{formatAbsolute(item.startDate ?? item.dueDate)}</p>
              </li>
            ))}
            {(upcoming ?? []).length === 0 ? (
              <li className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
                Nothing scheduled
              </li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">Overdue</h3>
          <ul className="mt-3 space-y-2">
            {(overdue ?? []).slice(0, 6).map((item) => (
              <li key={item.id} className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{item.title}</span>
                  <span>{formatRelativeTime(item.dueDate ?? item.startDate)}</span>
                </div>
                <button
                  type="button"
                  className="mt-2 text-[11px] font-semibold text-rose-600 underline-offset-2 hover:underline"
                  onClick={() => onOpen(item)}
                >
                  Open event
                </button>
              </li>
            ))}
            {(overdue ?? []).length === 0 ? (
              <li className="rounded-xl border border-dashed border-rose-200 px-3 py-4 text-center text-xs text-rose-400">
                All clear
              </li>
            ) : null}
          </ul>
        </section>
      </aside>
    </div>
  );
}

EventBoard.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object).isRequired,
  upcoming: PropTypes.arrayOf(PropTypes.object),
  overdue: PropTypes.arrayOf(PropTypes.object),
  statusCounts: PropTypes.object,
  onNew: PropTypes.func.isRequired,
  onOpen: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

EventBoard.defaultProps = {
  upcoming: [],
  overdue: [],
  statusCounts: {},
};
