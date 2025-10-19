import PropTypes from 'prop-types';
import { formatRelativeTime, formatAbsolute } from '../../../utils/date.js';

function renderMetadata(metadata = {}) {
  const entries = Object.entries(metadata || {}).filter(([, value]) => value != null && value !== '');
  if (!entries.length) {
    return null;
  }
  return (
    <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-600">
      <pre className="whitespace-pre-wrap break-words">{JSON.stringify(metadata, null, 2)}</pre>
    </div>
  );
}

export default function ModerationAuditTimeline({ events }) {
  if (!Array.isArray(events) || !events.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
        No moderation actions recorded yet.
      </div>
    );
  }

  return (
    <ol className="space-y-4">
      {events.map((event) => {
        const createdRelative = event.createdAt ? formatRelativeTime(event.createdAt) : '—';
        const createdAbsolute = event.createdAt ? formatAbsolute(event.createdAt) : undefined;
        const severity = event.severity ? event.severity.replace(/_/g, ' ') : 'unspecified';
        const status = event.status ? event.status.replace(/_/g, ' ') : 'open';
        return (
          <li key={event.id} className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {event.action?.replace(/_/g, ' ') ?? 'Moderation event'}
                </p>
                <p className="mt-1 text-sm text-slate-600">{event.reason}</p>
              </div>
              <div className="text-right text-xs uppercase tracking-wide text-slate-400">
                <p title={createdAbsolute}>{createdRelative}</p>
                <p className="mt-1 font-semibold text-slate-500">{status}</p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-100/80 px-3 py-2 text-xs text-slate-600">
                <p className="font-semibold text-slate-500">Severity</p>
                <p className="mt-1 capitalize text-slate-700">{severity}</p>
              </div>
              <div className="rounded-2xl bg-slate-100/80 px-3 py-2 text-xs text-slate-600">
                <p className="font-semibold text-slate-500">Channel</p>
                <p className="mt-1 text-slate-700">#{event.channelSlug ?? 'n/a'}</p>
              </div>
              <div className="rounded-2xl bg-slate-100/80 px-3 py-2 text-xs text-slate-600">
                <p className="font-semibold text-slate-500">Actor</p>
                <p className="mt-1 text-slate-700">{event.actorId ? `User #${event.actorId}` : 'System'}</p>
              </div>
            </div>
            {event.metadata?.resolutionNotes ? (
              <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-800">
                <p className="font-semibold">Resolution notes</p>
                <p className="mt-1 whitespace-pre-wrap">{event.metadata.resolutionNotes}</p>
              </div>
            ) : null}
            {renderMetadata(event.metadata)}
          </li>
        );
      })}
    </ol>
  );
}

ModerationAuditTimeline.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      action: PropTypes.string,
      reason: PropTypes.string,
      severity: PropTypes.string,
      status: PropTypes.string,
      channelSlug: PropTypes.string,
      actorId: PropTypes.number,
      createdAt: PropTypes.string,
      metadata: PropTypes.object,
    }),
  ),
};

ModerationAuditTimeline.defaultProps = {
  events: [],
};
