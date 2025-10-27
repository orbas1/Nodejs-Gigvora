import PropTypes from 'prop-types';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';
import { formatStatus, getStatusToneClasses } from './escrowUtils.js';

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
              className="w-full rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-left transition hover:border-amber-300 hover:bg-amber-100"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-amber-800">{dispute.reasonCode.replace(/_/g, ' ')}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span
                      className={`rounded-full border px-3 py-1 font-semibold ${getStatusToneClasses(dispute.status ?? 'disputed')}`}
                    >
                      {formatStatus(dispute.status)}
                    </span>
                    {dispute.priority ? (
                      <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 font-semibold text-rose-600">
                        Priority · {formatStatus(dispute.priority)}
                      </span>
                    ) : null}
                    {dispute.stage ? (
                      <span className="rounded-full border border-amber-200 px-3 py-1 text-amber-600">
                        Stage · {formatStatus(dispute.stage)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="text-right text-xs text-amber-700">
                  <p>Opened {dispute.openedAt ? formatAbsolute(dispute.openedAt, { dateStyle: 'medium' }) : '—'}</p>
                  <p>Updated {dispute.updatedAt ? formatRelativeTime(dispute.updatedAt) : 'recently'}</p>
                </div>
              </div>
              <p className="mt-2 text-sm text-amber-800">{dispute.summary}</p>
              {dispute.nextAction ? (
                <p className="mt-1 text-xs text-amber-700">Next action · {dispute.nextAction}</p>
              ) : null}
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
