import { useMemo } from 'react';
import PropTypes from 'prop-types';
import useCalendarSync from '../../hooks/useCalendarSync.js';
import usePresence from '../../hooks/usePresence.js';
import { formatRelativeTime, formatDateLabel } from '../../utils/date.js';
import classNames from '../../utils/classNames.js';

function ConnectionStatus({ status }) {
  const state = status?.state || (status?.inProgress ? 'syncing' : 'unknown');
  const labelMap = {
    synced: 'Connected',
    syncing: 'Syncing',
    error: 'Attention needed',
    disconnected: 'Disconnected',
    unknown: 'Unknown',
  };
  const toneMap = {
    synced: 'bg-emerald-50 text-emerald-700 ring-emerald-500/40',
    syncing: 'bg-amber-50 text-amber-700 ring-amber-500/40',
    error: 'bg-rose-50 text-rose-700 ring-rose-500/40',
    disconnected: 'bg-slate-100 text-slate-600 ring-slate-300/40',
    unknown: 'bg-slate-50 text-slate-500 ring-slate-200/40',
  };
  const label = labelMap[state] ?? labelMap.unknown;
  const tone = toneMap[state] ?? toneMap.unknown;

  return (
    <span className={classNames('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-2 ring-offset-2 ring-offset-white', tone)}>
      <span className="inline-flex h-2 w-2 rounded-full bg-current" />
      {label}
    </span>
  );
}

ConnectionStatus.propTypes = {
  status: PropTypes.shape({
    state: PropTypes.string,
    inProgress: PropTypes.bool,
  }),
};

ConnectionStatus.defaultProps = {
  status: undefined,
};

function EventPreview({ event }) {
  const start = formatDateLabel(event.startsAt || event.startAt, { includeTime: true });
  const relative = formatRelativeTime(event.startsAt || event.startAt);
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming</span>
      <span className="text-base font-semibold text-slate-900">{event.title}</span>
      <span className="text-sm text-slate-600">{start}</span>
      <span className="text-xs text-slate-500">{relative}</span>
      {event.location ? <span className="text-xs text-slate-500">{event.location}</span> : null}
    </div>
  );
}

EventPreview.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    startsAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    startAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    location: PropTypes.string,
  }).isRequired,
};

export default function CalendarSyncBadge({ userId, displayName }) {
  const calendar = useCalendarSync(userId, { enabled: Boolean(userId) });
  const presence = usePresence(userId, { enabled: Boolean(userId), pollInterval: 120_000 });

  const nextEvent = useMemo(() => {
    if (presence.summary?.nextEvent) {
      return presence.summary.nextEvent;
    }
    if (calendar.nextEvents.length) {
      return calendar.nextEvents[0];
    }
    return null;
  }, [presence.summary?.nextEvent, calendar.nextEvents]);

  const providers = calendar.status.data?.providers || calendar.status.data?.connectedProviders || [];
  const errors = calendar.status.data?.errors || [];
  const lastSynced = calendar.status.data?.lastSyncedAt || presence.summary?.calendar?.lastSyncedAt;

  return (
    <section className="relative flex flex-col gap-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-5 shadow-lg shadow-slate-200/70">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Calendar sync</p>
          <h3 className="text-lg font-semibold text-slate-900">{displayName ? `${displayName}’s scheduling signal` : 'Scheduling signal'}</h3>
          <p className="text-sm text-slate-600">Stay ahead of huddles and focus blocks with live sync status and event previews.</p>
        </div>
        <ConnectionStatus status={calendar.status.data} />
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm lg:col-span-2">
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50/80 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last synced</dt>
              <dd className="text-sm font-medium text-slate-700">{lastSynced ? formatRelativeTime(lastSynced) : 'Waiting for first sync'}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50/80 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Connected calendars</dt>
              <dd className="text-sm font-medium text-slate-700">{providers.length ? providers.join(', ') : 'Not connected'}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50/80 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next sync</dt>
              <dd className="text-sm font-medium text-slate-700">
                {calendar.status.data?.nextSyncAt
                  ? formatRelativeTime(calendar.status.data.nextSyncAt)
                  : calendar.status.data?.inProgress
                  ? 'Sync in progress'
                  : 'Auto every 5 min'}
              </dd>
            </div>
          </dl>
          {errors.length ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-600">
              {errors[0]?.message || 'Your calendar connection needs attention. Reauthenticate to resume syncing.'}
            </div>
          ) : null}
        </div>
        <div className="space-y-3">
          {nextEvent ? <EventPreview event={nextEvent} /> : <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">No upcoming events detected. Schedule a focus block or sync another calendar to populate this space.</div>}
          <button
            type="button"
            onClick={() => calendar.refresh()}
            disabled={calendar.status.loading || calendar.events.loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-accent to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200/70 transition hover:shadow-indigo-300/80 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            Refresh calendar sync
          </button>
        </div>
      </div>

      {(calendar.status.loading || calendar.events.loading) && (
        <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
            <span className="h-2 w-2 animate-ping rounded-full bg-accent" aria-hidden="true" /> Syncing with your calendar…
          </div>
        </div>
      )}

      {(calendar.status.error || calendar.events.error) && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          We’re having trouble reaching the calendar service right now. Please try refreshing again shortly.
        </div>
      )}
    </section>
  );
}

CalendarSyncBadge.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  displayName: PropTypes.string,
};

CalendarSyncBadge.defaultProps = {
  displayName: undefined,
};
