import PropTypes from 'prop-types';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

function formatStatus(value) {
  if (!value) return 'Unknown';
  return value
    .toString()
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function EscrowDisputeBoard({ disputes, onInspect }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Disputes</h3>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{disputes.length} open</p>
      </div>
      <div className="mt-4 space-y-3">
        {disputes.length ? (
          disputes.map((dispute) => (
            <button
              key={dispute.id}
              type="button"
              onClick={() => onInspect(dispute)}
              className="w-full rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-left transition hover:border-amber-300 hover:bg-amber-100"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-amber-700">{dispute.reasonCode.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-amber-600">{formatStatus(dispute.status)}</p>
                </div>
                <p className="text-xs text-amber-600">
                  Opened {dispute.openedAt ? formatAbsolute(dispute.openedAt, { dateStyle: 'medium' }) : '—'}
                </p>
              </div>
              <p className="mt-2 text-sm text-amber-700">{dispute.summary}</p>
              <p className="mt-2 text-xs text-amber-600">
                Updated {dispute.updatedAt ? formatRelativeTime(dispute.updatedAt) : 'recently'}
              </p>
            </button>
          ))
        ) : (
          <p className="text-sm text-slate-500">No open disputes.</p>
        )}
      </div>
    </div>
  );
}

EscrowDisputeBoard.propTypes = {
  disputes: PropTypes.arrayOf(PropTypes.object),
  onInspect: PropTypes.func.isRequired,
};

EscrowDisputeBoard.defaultProps = {
  disputes: [],
};
