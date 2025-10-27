import PropTypes from 'prop-types';
import { BoltIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const ICON_BY_TYPE = {
  content: BoltIcon,
  policy: ShieldCheckIcon,
};

export default function GovernanceActivityTimeline({ events, emptyMessage }) {
  if (!Array.isArray(events) || events.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/40 px-4 py-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {events.map((event) => {
        const Icon = ICON_BY_TYPE[event.type] ?? ShieldCheckIcon;
        return (
          <li
            key={event.id}
            className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
          >
            <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">
                  {event.title}
                </p>
                {event.createdAt ? (
                  <span className="text-xs text-slate-400">{new Date(event.createdAt).toLocaleString()}</span>
                ) : null}
              </div>
              {event.summary ? (
                <p className="mt-1 text-sm text-slate-600">{event.summary}</p>
              ) : null}
              {event.reference ? (
                <p className="mt-2 text-xs text-slate-500">
                  {event.type === 'content'
                    ? `Submission #${event.reference.submissionId} • ${event.reference.title}`
                    : `${event.reference.documentTitle} · v${event.reference.version}`}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {event.metadata?.severity ? (
                  <span className="rounded-full bg-slate-100 px-2 py-1">Severity {event.metadata.severity}</span>
                ) : null}
                {event.metadata?.priority ? (
                  <span className="rounded-full bg-slate-100 px-2 py-1">Priority {event.metadata.priority}</span>
                ) : null}
                {event.reference?.locale ? (
                  <span className="rounded-full bg-slate-100 px-2 py-1">Locale {event.reference.locale}</span>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

GovernanceActivityTimeline.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.string,
      title: PropTypes.string,
      createdAt: PropTypes.string,
      summary: PropTypes.string,
      metadata: PropTypes.object,
      reference: PropTypes.object,
    }),
  ),
  emptyMessage: PropTypes.string,
};

GovernanceActivityTimeline.defaultProps = {
  events: [],
  emptyMessage: 'No recent governance activity recorded during this window.',
};
