import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowUpRightIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

const toneStyles = {
  default: {
    node: 'bg-slate-200 border-slate-300',
    line: 'border-slate-200',
    badge: 'bg-slate-100 text-slate-600',
  },
  success: {
    node: 'bg-emerald-500 border-emerald-200 text-white',
    line: 'border-emerald-100',
    badge: 'bg-emerald-50 text-emerald-700',
  },
  warning: {
    node: 'bg-amber-400 border-amber-100 text-amber-950',
    line: 'border-amber-100',
    badge: 'bg-amber-50 text-amber-700',
  },
  danger: {
    node: 'bg-rose-500 border-rose-200 text-white',
    line: 'border-rose-200',
    badge: 'bg-rose-50 text-rose-700',
  },
  accent: {
    node: 'bg-blue-500 border-blue-200 text-white',
    line: 'border-blue-200',
    badge: 'bg-blue-50 text-blue-700',
  },
};

const SEVERITY_ORDER = ['critical', 'escalated', 'warning', 'info', 'success'];

function resolveTone(event) {
  const severity = event.severity ?? event.status ?? 'info';
  if (typeof severity !== 'string') {
    return 'default';
  }
  const normalized = severity.toLowerCase();
  if (['closed', 'resolved', 'success'].includes(normalized)) return 'success';
  if (['critical', 'breach', 'failed', 'escalated'].includes(normalized)) return 'danger';
  if (['warning', 'pending', 'awaiting_customer_action'].includes(normalized)) return 'warning';
  if (['info', 'update', 'comment'].includes(normalized)) return 'accent';
  return 'default';
}

function sortEvents(events) {
  return [...events].sort((a, b) => {
    const aDate = new Date(a.eventAt ?? a.createdAt ?? a.updatedAt ?? 0).getTime();
    const bDate = new Date(b.eventAt ?? b.createdAt ?? b.updatedAt ?? 0).getTime();
    return aDate - bDate;
  });
}

function AttachmentList({ attachments }) {
  if (!attachments?.length) {
    return null;
  }
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {attachments.map((item) => {
        const key = item.id ?? item.fileName ?? item.url ?? Math.random().toString(36).slice(2);
        const label = item.label ?? item.fileName ?? 'Attachment';
        const url = item.url ?? item.href ?? null;
        return (
          <a
            key={key}
            href={url ?? '#'}
            target={url ? '_blank' : undefined}
            rel={url ? 'noreferrer' : undefined}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
          >
            <DocumentArrowDownIcon className="h-4 w-4" aria-hidden="true" />
            <span>{label}</span>
          </a>
        );
      })}
    </div>
  );
}

AttachmentList.propTypes = {
  attachments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
      fileName: PropTypes.string,
      url: PropTypes.string,
      href: PropTypes.string,
    }),
  ),
};

AttachmentList.defaultProps = {
  attachments: undefined,
};

function EventBadges({ event }) {
  const badges = [];
  if (event.stage) {
    badges.push({ id: 'stage', label: event.stage.replace(/_/g, ' '), tone: 'accent' });
  }
  if (event.status) {
    badges.push({ id: 'status', label: event.status.replace(/_/g, ' '), tone: 'warning' });
  }
  if (event.actorRole || event.actorType) {
    badges.push({ id: 'role', label: (event.actorRole ?? event.actorType).replace(/_/g, ' '), tone: 'default' });
  }
  if (event.slaStatus) {
    const tone = event.slaStatus === 'breach' ? 'danger' : event.slaStatus === 'at_risk' ? 'warning' : 'success';
    badges.push({ id: 'sla', label: `SLA ${event.slaStatus.replace(/_/g, ' ')}`, tone });
  }
  if (event.escalationLevel) {
    badges.push({ id: 'escalation', label: `Escalation L${event.escalationLevel}`, tone: 'danger' });
  }

  if (!badges.length) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide">
      {badges.map((badge) => {
        const tone = toneStyles[badge.tone] ?? toneStyles.default;
        return (
          <span
            key={badge.id}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 shadow-sm ${tone.badge}`}
          >
            {badge.id === 'sla' ? <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
            {badge.label}
          </span>
        );
      })}
    </div>
  );
}

EventBadges.propTypes = {
  event: PropTypes.object.isRequired,
};

function TimelineEvent({ event, index, total, isActive, onSelect }) {
  const toneKey = resolveTone(event);
  const tone = toneStyles[toneKey] ?? toneStyles.default;
  const createdAtLabel = formatAbsolute(event.eventAt ?? event.createdAt ?? event.updatedAt);
  const relative = formatRelativeTime(event.eventAt ?? event.createdAt ?? event.updatedAt, {
    numeric: 'auto',
  });

  return (
    <li className="relative flex gap-4 pb-10 last:pb-0">
      <div className="flex flex-col items-center">
        <span
          className={`mt-1 h-4 w-4 rounded-full border-2 ${tone.node} ${isActive ? 'ring-4 ring-offset-2 ring-slate-200' : ''}`}
          aria-hidden="true"
        />
        {index < total - 1 ? <span className={`mt-1 h-full border-l ${tone.line}`} aria-hidden="true" /> : null}
      </div>
      <article
        className={`flex-1 rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_25px_60px_-30px_rgba(15,23,42,0.4)] backdrop-blur ${
          isActive ? 'ring-2 ring-blue-100' : ''
        }`}
      >
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100">
              <UserCircleIcon className="h-5 w-5 text-slate-500" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {event.actorName ?? event.actor ?? 'Support specialist'}
              </p>
              <p className="text-xs text-slate-500">
                {event.actorRole?.replace(/_/g, ' ') ?? event.actorType?.replace(/_/g, ' ') ?? 'Contributor'}
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p className="flex items-center justify-end gap-1">
              <ClockIcon className="h-4 w-4" aria-hidden="true" />
              <span>{relative || 'moments ago'}</span>
            </p>
            <p>{createdAtLabel || '—'}</p>
          </div>
        </header>

        <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
          <p className="font-medium text-slate-800">
            {event.title ?? event.summary ?? event.notes ?? 'Updated case activity'}
          </p>
          {event.notes && event.notes !== event.title ? <p className="text-slate-600">{event.notes}</p> : null}
          {event.metadata?.nextStep ? (
            <p className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
              Next: {event.metadata.nextStep}
            </p>
          ) : null}
        </div>

        <EventBadges event={event} />
        <AttachmentList attachments={event.attachments ?? event.evidence ?? event.files} />

        {(event.actions?.length || onSelect) && (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold">
            {(event.actions ?? []).map((action) => (
              <span
                key={action.id ?? action.label ?? Math.random().toString(36).slice(2)}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-slate-600"
              >
                <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
                {action.label ?? action.name ?? 'Actioned'}
              </span>
            ))}
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(event)}
                className="inline-flex items-center gap-1 rounded-full bg-slate-900 text-white px-3 py-1 shadow-sm transition hover:bg-slate-800"
              >
                View detail
                <ArrowUpRightIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        )}
      </article>
    </li>
  );
}

TimelineEvent.propTypes = {
  event: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  isActive: PropTypes.bool,
  onSelect: PropTypes.func,
};

TimelineEvent.defaultProps = {
  isActive: false,
  onSelect: undefined,
};

export default function ResolutionTimeline({ events, highlightEventId, onSelectEvent }) {
  const orderedEvents = useMemo(() => sortEvents(events ?? []), [events]);
  const activeEventId = useMemo(() => {
    if (highlightEventId != null) {
      return highlightEventId;
    }
    const latest = [...orderedEvents].sort((a, b) => {
      const aScore = SEVERITY_ORDER.indexOf((a.severity ?? a.status ?? '').toLowerCase());
      const bScore = SEVERITY_ORDER.indexOf((b.severity ?? b.status ?? '').toLowerCase());
      return (aScore === -1 ? 99 : aScore) - (bScore === -1 ? 99 : bScore);
    })[0];
    return latest?.id ?? latest?.eventId ?? null;
  }, [highlightEventId, orderedEvents]);

  if (!orderedEvents.length) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 p-6 text-center text-sm text-slate-500">
        Timeline will populate as updates are recorded.
      </div>
    );
  }

  return (
    <ol className="relative space-y-0">
      {orderedEvents.map((event, index) => (
        <TimelineEvent
          key={event.id ?? event.eventId ?? index}
          event={event}
          index={index}
          total={orderedEvents.length}
          isActive={(event.id ?? event.eventId ?? null) === activeEventId}
          onSelect={onSelectEvent}
        />
      ))}
    </ol>
  );
}

ResolutionTimeline.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object),
  highlightEventId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelectEvent: PropTypes.func,
};

ResolutionTimeline.defaultProps = {
  events: [],
  highlightEventId: null,
  onSelectEvent: undefined,
};
