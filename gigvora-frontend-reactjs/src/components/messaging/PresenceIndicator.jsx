import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import UserAvatar from '../UserAvatar.jsx';
import usePresence from '../../hooks/usePresence.js';
import classNames from '../../utils/classNames.js';
import { formatRelativeTime, formatDateLabel } from '../../utils/date.js';

const STATUS_DOT_TONES = {
  in_meeting: 'bg-amber-500',
  focus: 'bg-indigo-500',
  do_not_disturb: 'bg-rose-500',
  away: 'bg-slate-400',
  available: 'bg-emerald-500',
  offline: 'bg-slate-300',
};

function StatusRing({ state }) {
  const toneMap = {
    in_meeting: 'from-amber-400 via-amber-300 to-orange-500 shadow-amber-400/40',
    focus: 'from-indigo-500 via-sky-500 to-violet-500 shadow-indigo-400/40',
    do_not_disturb: 'from-rose-500 via-rose-400 to-pink-500 shadow-rose-400/40',
    away: 'from-slate-300 via-slate-200 to-slate-400 shadow-slate-300/40',
    available: 'from-emerald-500 via-teal-400 to-emerald-600 shadow-emerald-400/40',
    offline: 'from-slate-200 via-slate-100 to-slate-200 shadow-slate-200/40',
  };

  const gradient = toneMap[state] ?? toneMap.offline;

  return (
    <span
      className={classNames(
        'absolute inset-0 rounded-full opacity-90 blur-[2px] transition-opacity duration-300',
        `bg-gradient-to-br ${gradient}`,
        state === 'offline' ? 'opacity-60' : 'opacity-100',
      )}
      aria-hidden="true"
    />
  );
}

StatusRing.propTypes = {
  state: PropTypes.string,
};

function StatusBadge({ label, tone, message }) {
  return (
    <div
      className={classNames(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-2 ring-offset-2 ring-offset-white transition-colors',
        tone,
      )}
    >
      <span className="inline-flex h-2 w-2 rounded-full bg-current opacity-80" />
      <span>{label}</span>
      {message ? <span className="hidden sm:inline text-slate-500 font-normal">• {message}</span> : null}
    </div>
  );
}

StatusBadge.propTypes = {
  label: PropTypes.string,
  tone: PropTypes.string,
  message: PropTypes.string,
};

const timelineEntryShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  type: PropTypes.string,
  startAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  title: PropTypes.string,
  description: PropTypes.string,
});

function TimelineEntry({ entry }) {
  const formatted = entry.startAt ? formatRelativeTime(entry.startAt) : '';
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-slate-100 bg-white/70 p-3 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
        <span className="uppercase tracking-wide text-slate-500">{entry.type}</span>
        <span>{formatted}</span>
      </div>
      <p className="text-sm font-medium text-slate-900">{entry.title}</p>
      {entry.description ? <p className="text-xs text-slate-500">{entry.description}</p> : null}
    </div>
  );
}

TimelineEntry.propTypes = {
  entry: timelineEntryShape.isRequired,
};

function Timeline({ entries }) {
  if (!entries.length) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
        Presence history will appear here once status changes or focus sessions begin.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {entries.slice(-4).map((entry) => (
        <TimelineEntry key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

Timeline.propTypes = {
  entries: PropTypes.arrayOf(timelineEntryShape),
};

function UpcomingEvent({ event }) {
  if (!event) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
        No upcoming calendar events are linked to this presence status. Sync your calendar or create a focus block to see it here.
      </div>
    );
  }

  const startsLabel = formatDateLabel(event.startsAt, { includeTime: true });
  const attendees = (event.attendees || []).slice(0, 4);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Next commitment</p>
          <p className="mt-1 text-base font-semibold text-slate-900">{event.title}</p>
          <p className="text-sm text-slate-600">{startsLabel}</p>
          {event.location ? <p className="text-xs text-slate-500">{event.location}</p> : null}
        </div>
        <div className="flex flex-col items-end gap-2 text-xs text-slate-500">
          <span>{formatRelativeTime(event.startsAt)}</span>
          {event.endsAt ? <span>Ends {formatRelativeTime(event.endsAt)}</span> : null}
        </div>
      </div>
      {attendees.length ? (
        <div className="mt-3 flex items-center gap-2">
          {attendees.map((person) => (
            <span
              key={person.id || person.email}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600"
            >
              {person.initials || person.name?.[0] || person.email?.[0] || '•'}
            </span>
          ))}
          {event.attendees.length > attendees.length ? (
            <span className="text-xs text-slate-500">+{event.attendees.length - attendees.length} more</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

UpcomingEvent.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    startsAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    endsAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    location: PropTypes.string,
    attendees: PropTypes.arrayOf(PropTypes.object),
  }),
};

function StatusSelector({
  statuses,
  active,
  onSelect,
  busy,
}) {
  const [open, setOpen] = useState(false);

  const current = useMemo(() => statuses.find((status) => status.value === active) ?? statuses[0], [statuses, active]);

  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-accent/30 hover:text-slate-900"
        onClick={() => setOpen((previous) => !previous)}
        disabled={busy}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
        <span>{current?.label ?? 'Choose status'}</span>
        <span className="text-slate-400" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-3 w-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </button>
      {open ? (
        <div
          className="absolute right-0 z-20 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
          role="listbox"
          aria-label="Set availability"
        >
          {statuses.map((status) => (
            <button
              key={status.value}
              type="button"
              className={classNames(
                'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-slate-50',
                status.value === active ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-600',
              )}
              onClick={() => {
                setOpen(false);
                onSelect?.(status.value);
              }}
              role="option"
              aria-selected={status.value === active}
            >
              <span className="inline-flex h-2.5 w-2.5 rounded-full" aria-hidden="true">
                <span className={classNames('h-full w-full rounded-full opacity-80', STATUS_DOT_TONES[status.value] ?? 'bg-slate-300')} />
              </span>
              <span>{status.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

StatusSelector.propTypes = {
  statuses: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      tone: PropTypes.string,
    })
  ),
  active: PropTypes.string,
  onSelect: PropTypes.func,
  busy: PropTypes.bool,
};

StatusSelector.defaultProps = {
  statuses: [],
  active: undefined,
  onSelect: undefined,
  busy: false,
};

export default function PresenceIndicator({
  memberId,
  displayName,
  roleLabel,
  avatarUrl,
  size = 'md',
  allowStatusChange = true,
  showTimeline = true,
}) {
  const presence = usePresence(memberId, { enabled: Boolean(memberId) });
  const summary = presence.summary;

  const [pending, setPending] = useState(false);

  const statusMessage = useMemo(() => {
    if (!summary) {
      return '';
    }
    if (summary.focusUntil) {
      return `Focus until ${formatDateLabel(summary.focusUntil, { includeTime: true })}`;
    }
    if (summary.nextEvent) {
      return `Next: ${formatRelativeTime(summary.nextEvent.startsAt)}`;
    }
    if (summary.lastSeenAt && !summary.online) {
      return `Last active ${formatRelativeTime(summary.lastSeenAt)}`;
    }
    return summary.customMessage || '';
  }, [summary]);

  const handleStatusChange = async (value) => {
    if (!value || !presence.setAvailability) {
      return;
    }
    try {
      setPending(true);
      await presence.setAvailability({ availability: value });
    } finally {
      setPending(false);
    }
  };

  const focusActionLabel = summary?.activeFocusSession ? 'End focus' : 'Start focus';

  return (
    <div className="relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-lg shadow-slate-200/50">
      <div className="absolute inset-x-10 top-0 h-32 rounded-b-[48px] bg-gradient-to-br from-accent/20 via-transparent to-transparent blur-2xl" aria-hidden="true" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <UserAvatar name={displayName} imageUrl={avatarUrl} size={size} />
            <span className="pointer-events-none absolute inset-[-6px] rounded-full">
              <StatusRing state={summary?.state ?? 'offline'} />
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-slate-900">{displayName}</p>
              {roleLabel ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{roleLabel}</span> : null}
            </div>
            {summary ? <StatusBadge label={summary.label} tone={summary.tone} message={statusMessage} /> : null}
          </div>
        </div>
        {allowStatusChange && summary ? (
          <div className="flex flex-wrap items-center justify-end gap-3">
            <StatusSelector
              statuses={presence.availableStatuses ?? []}
              active={summary.state}
              onSelect={handleStatusChange}
              busy={pending || presence.loading}
            />
            <button
              type="button"
              onClick={async () => {
                try {
                  setPending(true);
                  if (summary.activeFocusSession) {
                    await presence.endFocus();
                  } else {
                    await presence.startFocus({ durationMinutes: 50, autoMute: true });
                  }
                } finally {
                  setPending(false);
                }
              }}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-accent to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200/60 transition hover:shadow-indigo-300/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              disabled={pending}
            >
              <span className="inline-flex h-2 w-2 rounded-full bg-white/70" />
              <span>{focusActionLabel}</span>
            </button>
          </div>
        ) : null}
      </div>

      <div className="relative grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-100 bg-white/80 p-4 shadow-inner shadow-slate-200/60 backdrop-blur lg:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Live presence context</h3>
          <dl className="mt-3 grid gap-2 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50/60 px-4 py-3">
              <dt className="font-medium text-slate-700">Calendar sync</dt>
              <dd className="text-right">
                {summary?.calendar?.lastSyncedAt
                  ? `Synced ${formatRelativeTime(summary.calendar.lastSyncedAt)}`
                  : 'Awaiting first sync'}
              </dd>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50/60 px-4 py-3">
              <dt className="font-medium text-slate-700">Focus window</dt>
              <dd className="text-right">
                {summary?.focusUntil
                  ? `Locked until ${formatDateLabel(summary.focusUntil, { includeTime: true })}`
                  : 'No focus session scheduled'}
              </dd>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50/60 px-4 py-3">
              <dt className="font-medium text-slate-700">Last activity</dt>
              <dd className="text-right">
                {summary?.lastSeenAt ? formatRelativeTime(summary.lastSeenAt) : 'Tracking live'}
              </dd>
            </div>
          </dl>
        </div>
        <div className="space-y-3">
          <UpcomingEvent event={summary?.nextEvent ?? null} />
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-accent/30 hover:text-accent"
            onClick={() => presence.triggerCalendarRefresh?.()}
            disabled={pending}
          >
            Refresh calendar sync
            <span aria-hidden="true">↻</span>
          </button>
        </div>
      </div>

      {showTimeline ? (
        <div className="relative space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Presence timeline</h3>
          <Timeline entries={summary?.timeline ?? []} />
        </div>
      ) : null}

      {presence.loading ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
            <span className="h-2 w-2 animate-ping rounded-full bg-accent" aria-hidden="true" /> Syncing presence…
          </div>
        </div>
      ) : null}

      {presence.error ? (
        <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 shadow">
          We couldn’t update your presence right now. Please retry in a moment.
        </div>
      ) : null}
    </div>
  );
}

PresenceIndicator.propTypes = {
  memberId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  displayName: PropTypes.string.isRequired,
  roleLabel: PropTypes.string,
  avatarUrl: PropTypes.string,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  allowStatusChange: PropTypes.bool,
  showTimeline: PropTypes.bool,
};
