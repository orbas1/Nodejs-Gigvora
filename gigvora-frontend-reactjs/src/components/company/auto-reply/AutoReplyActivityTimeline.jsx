import PropTypes from 'prop-types';

function formatDate(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

const STATUS_BADGES = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  error: 'bg-rose-50 text-rose-700 border-rose-200',
  skipped: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function AutoReplyActivityTimeline({ activity, className = '' }) {
  if (!activity?.length) {
    return (
      <div className={`rounded-3xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500 ${className}`}>
        No runs yet.
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {activity.map((run) => (
        <div key={run.id} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold text-slate-900">{run.template?.title || run.model || 'Auto reply'}</span>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                    STATUS_BADGES[run.status] ?? STATUS_BADGES.skipped
                  }`}
                >
                  {run.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Model {run.model || '—'} · {run.responseLatencyMs != null ? `${run.responseLatencyMs}ms` : '—'}
              </p>
              {run.responsePreview ? <p className="mt-2 text-sm text-slate-700">{run.responsePreview}</p> : null}
              {run.errorMessage ? <p className="mt-2 text-sm text-rose-600">{run.errorMessage}</p> : null}
            </div>
            <div className="text-xs text-slate-500">
              <p>{formatDate(run.createdAt)}</p>
              {run.threadId ? <p>Thread #{run.threadId}</p> : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

AutoReplyActivityTimeline.propTypes = {
  activity: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      model: PropTypes.string,
      status: PropTypes.string,
      responseLatencyMs: PropTypes.number,
      responsePreview: PropTypes.string,
      errorMessage: PropTypes.string,
      createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      threadId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      template: PropTypes.shape({ title: PropTypes.string }),
    }),
  ),
  className: PropTypes.string,
};

AutoReplyActivityTimeline.defaultProps = {
  activity: [],
  className: '',
};
