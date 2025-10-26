import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

function formatAbsolute(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatRelative(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);
  const minutes = Math.round(abs / (1000 * 60));
  if (minutes < 1) {
    return diff >= 0 ? 'in under a minute' : 'just now';
  }
  if (minutes < 60) {
    const unit = minutes === 1 ? 'min' : 'mins';
    return diff >= 0 ? `in ${minutes} ${unit}` : `${minutes} ${unit} ago`;
  }
  const hours = Math.round(abs / (1000 * 60 * 60));
  if (hours < 24) {
    const unit = hours === 1 ? 'hour' : 'hours';
    return diff >= 0 ? `in ${hours} ${unit}` : `${hours} ${unit} ago`;
  }
  const days = Math.round(abs / (1000 * 60 * 60 * 24));
  const unit = days === 1 ? 'day' : 'days';
  return diff >= 0 ? `in ${days} ${unit}` : `${days} ${unit} ago`;
}

function DeadlineBadge({ deadline, onSelect = undefined, active = false }) {
  const tone = deadline.isPastDue ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-800';
  return (
    <button
      type="button"
      onClick={() => onSelect?.(deadline.disputeId)}
      className={`w-full rounded-2xl border px-4 py-3 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
        active ? 'ring-2 ring-offset-2 ring-slate-900' : ''
      } ${tone}`}
    >
      <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide">
        <span>{deadline.stage?.replace(/_/g, ' ') ?? 'Stage'}</span>
        <span>{formatRelative(deadline.dueAt) ?? '—'}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-900">{deadline.summary}</p>
      <p className="mt-2 text-xs text-slate-600">
        Due <span className="font-semibold text-slate-800">{formatAbsolute(deadline.dueAt)}</span>
      </p>
    </button>
  );
}

DeadlineBadge.propTypes = {
  deadline: PropTypes.shape({
    disputeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    dueAt: PropTypes.string.isRequired,
    summary: PropTypes.string,
    stage: PropTypes.string,
    isPastDue: PropTypes.bool,
  }).isRequired,
  onSelect: PropTypes.func,
  active: PropTypes.bool,
};

function EventItem({ event }) {
  const tone = event.actionType === 'status_change' || event.actionType === 'stage_advanced'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-slate-200 bg-white text-slate-600';
  return (
    <li
      className={`rounded-2xl border px-4 py-3 text-xs shadow-soft transition ${tone}`}
      aria-label={`Event ${event.actionType?.replace(/_/g, ' ') ?? 'activity'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold uppercase tracking-wide text-slate-700">
          {event.actionType?.replace(/_/g, ' ') ?? 'Update'}
        </span>
        <span className="text-slate-500">{formatAbsolute(event.eventAt)}</span>
      </div>
      {event.notes ? <p className="mt-2 text-slate-700">{event.notes}</p> : null}
    </li>
  );
}

EventItem.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    actionType: PropTypes.string,
    eventAt: PropTypes.string,
    notes: PropTypes.string,
  }).isRequired,
};

export default function ResolutionTimeline({
  deadlines = [],
  events = [],
  onSelectDeadline,
  activeDisputeId,
  onRefresh,
  refreshing = false,
}) {
  const upcoming = Array.isArray(deadlines) ? deadlines.slice(0, 6) : [];
  const activity = Array.isArray(events)
    ? events
        .slice()
        .sort((a, b) => new Date(b.eventAt ?? 0).getTime() - new Date(a.eventAt ?? 0).getTime())
        .slice(0, 8)
    : [];

  const nextDeadline = upcoming[0] ?? null;
  const overdueCount = upcoming.filter((item) => item.isPastDue).length;

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Resolution timeline</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">SLA pulse</h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
        >
          <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Sync
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <ClockIcon className="h-6 w-6 text-amber-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next milestone</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {nextDeadline ? formatAbsolute(nextDeadline.dueAt) : 'No deadlines'}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            {nextDeadline ? nextDeadline.summary : 'All cases are tracking within their current service agreements.'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-rose-50 p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-rose-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Past due</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{overdueCount}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Escalate overdue cases with a guided mediation plan and notify finance if refunds are likely.
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Upcoming checkpoints</h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CalendarDaysIcon className="h-4 w-4" />
            <span>{upcoming.length} scheduled</span>
          </div>
        </div>
        <ol className="mt-3 space-y-3">
          {upcoming.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-xs uppercase tracking-[0.3em] text-slate-300">
              No deadlines scheduled
            </li>
          ) : (
            upcoming.map((deadline) => (
              <li key={`${deadline.disputeId}-${deadline.dueAt}`}>
                <DeadlineBadge
                  deadline={deadline}
                  onSelect={onSelectDeadline}
                  active={deadline.disputeId === activeDisputeId}
                />
              </li>
            ))
          )}
        </ol>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Activity stream</h3>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{activity.length} events</span>
        </div>
        <ol className="mt-3 space-y-3">
          {activity.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-xs uppercase tracking-[0.3em] text-slate-300">
              No recent events
            </li>
          ) : (
            activity.map((event) => <EventItem key={event.id} event={event} />)
          )}
        </ol>
      </div>
    </section>
  );
}

ResolutionTimeline.propTypes = {
  deadlines: PropTypes.arrayOf(
    PropTypes.shape({
      disputeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      dueAt: PropTypes.string.isRequired,
      summary: PropTypes.string,
      stage: PropTypes.string,
      isPastDue: PropTypes.bool,
    }),
  ),
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      actionType: PropTypes.string,
      eventAt: PropTypes.string,
      notes: PropTypes.string,
    }),
  ),
  onSelectDeadline: PropTypes.func,
  activeDisputeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onRefresh: PropTypes.func,
  refreshing: PropTypes.bool,
};
