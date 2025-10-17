import { useMemo, useState } from 'react';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  VideoCameraIcon,
  UserCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

const STATUS_COLUMNS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'requested', label: 'Requests' },
  { key: 'completed', label: 'Finished' },
  { key: 'cancelled', label: 'Cancelled' },
];

function formatSessionDate(value) {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not scheduled';
  }
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function SessionCard({ session, onSelect }) {
  const mentorName = [session?.mentor?.firstName, session?.mentor?.lastName]
    .filter(Boolean)
    .join(' ');
  const scheduleLabel = formatSessionDate(session.scheduledAt);

  return (
    <button
      type="button"
      onClick={() => onSelect(session)}
      className="group flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-accent/50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent/70"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{session.topic}</p>
          <p className="mt-1 text-xs text-slate-500">{scheduleLabel}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
        <div className="inline-flex items-center gap-1">
          <UserCircleIcon className="h-4 w-4 text-slate-400" />
          <span>{mentorName || `Mentor #${session.mentorId}`}</span>
        </div>
        {session.meetingType ? (
          <div className="inline-flex items-center gap-1">
            <VideoCameraIcon className="h-4 w-4 text-slate-400" />
            <span>{session.meetingType}</span>
          </div>
        ) : null}
        {session.meetingLocation ? (
          <div className="inline-flex items-center gap-1">
            <MapPinIcon className="h-4 w-4 text-slate-400" />
            <span className="truncate" title={session.meetingLocation}>
              {session.meetingLocation}
            </span>
          </div>
        ) : null}
        {session.durationMinutes ? (
          <div className="inline-flex items-center gap-1">
            <ClockIcon className="h-4 w-4 text-slate-400" />
            <span>{session.durationMinutes} min</span>
          </div>
        ) : null}
      </div>
      <span className="inline-flex items-center gap-2 text-xs font-semibold text-accent">
        <CalendarDaysIcon className="h-4 w-4" />
        <span>Open session</span>
      </span>
    </button>
  );
}

export default function MentoringSessionsPanel({ sessions, canEdit, onCreate, onSelect }) {
  const [statusFilter, setStatusFilter] = useState('upcoming');

  const groupedSessions = useMemo(() => ({
    upcoming: sessions?.upcoming ?? [],
    requested: sessions?.requested ?? [],
    completed: sessions?.completed ?? [],
    cancelled: sessions?.cancelled ?? [],
  }), [sessions]);

  const filterOptions = useMemo(() => STATUS_COLUMNS.map((column) => column.key), []);
  const activeSessions = groupedSessions[statusFilter] ?? [];

  return (
    <div className="flex h-full flex-col gap-5 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {filterOptions.map((key) => {
            const column = STATUS_COLUMNS.find((item) => item.key === key);
            const isActive = statusFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  isActive
                    ? 'border-accent bg-accent text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-accent/50 hover:text-accent'
                }`}
              >
                {column?.label ?? key}
              </button>
            );
          })}
        </div>
        {canEdit ? (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Book</span>
          </button>
        ) : null}
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-live="polite">
        {activeSessions.length ? (
          activeSessions.map((session) => <SessionCard key={session.id} session={session} onSelect={onSelect} />)
        ) : (
          <div className="col-span-full flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 text-sm text-slate-500">
            No sessions yet.
          </div>
        )}
      </div>
    </div>
  );
}
