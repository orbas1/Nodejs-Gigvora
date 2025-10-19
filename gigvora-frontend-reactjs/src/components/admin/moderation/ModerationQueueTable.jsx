import PropTypes from 'prop-types';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

const SEVERITY_STYLES = {
  critical: 'bg-rose-100 text-rose-800 border-rose-200',
  high: 'bg-amber-100 text-amber-800 border-amber-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  low: 'bg-slate-100 text-slate-700 border-slate-200',
};

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

function formatSignals(signals) {
  if (!Array.isArray(signals) || !signals.length) {
    return 'No signals recorded';
  }
  return signals
    .slice(0, 3)
    .map((signal) => signal.message || signal.code)
    .join(' • ');
}

export default function ModerationQueueTable({
  items,
  loading,
  onResolve,
}) {
  if (!loading && (!Array.isArray(items) || !items.length)) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        <ExclamationCircleIcon className="mb-3 h-10 w-10 text-slate-300" aria-hidden="true" />
        <p>All clear! There are no community messages waiting for review.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Channel</th>
            <th className="px-4 py-3">Severity</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Reason</th>
            <th className="px-4 py-3">Signals</th>
            <th className="px-4 py-3">Score</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
          {items.map((item) => {
            const severityStyle = SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.low;
            const signals = item.metadata?.signals ?? [];
            const rawScore = item.metadata?.score ?? item.metadata?.moderationScore;
            const numericScore = Number.parseFloat(rawScore);
            const displayScore = Number.isFinite(numericScore) ? Math.round(numericScore) : '—';
            return (
              <tr key={item.id}>
                <td className="px-4 py-3 align-top text-xs text-slate-500">{formatDate(item.createdAt)}</td>
                <td className="px-4 py-3 align-top font-medium text-slate-800">#{item.channelSlug}</td>
                <td className="px-4 py-3 align-top">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${severityStyle}`}>
                    {item.severity}
                  </span>
                </td>
                <td className="px-4 py-3 align-top capitalize">{item.status}</td>
                <td className="px-4 py-3 align-top text-slate-600">{item.reason}</td>
                <td className="px-4 py-3 align-top text-slate-600">{formatSignals(signals)}</td>
                <td className="px-4 py-3 align-top font-semibold text-slate-900">{displayScore}</td>
                <td className="px-4 py-3 align-top text-right">
                  <button
                    type="button"
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                    onClick={() => onResolve?.(item)}
                  >
                    Resolve
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {loading ? (
        <div className="border-t border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">Refreshing moderation queue…</div>
      ) : null}
    </div>
  );
}

ModerationQueueTable.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      createdAt: PropTypes.string,
      channelSlug: PropTypes.string,
      severity: PropTypes.string,
      status: PropTypes.string,
      reason: PropTypes.string,
      metadata: PropTypes.shape({
        score: PropTypes.number,
        signals: PropTypes.arrayOf(
          PropTypes.shape({
            code: PropTypes.string,
            message: PropTypes.string,
          }),
        ),
      }),
    }),
  ),
  loading: PropTypes.bool,
  onResolve: PropTypes.func,
};

ModerationQueueTable.defaultProps = {
  items: [],
  loading: false,
  onResolve: undefined,
};
