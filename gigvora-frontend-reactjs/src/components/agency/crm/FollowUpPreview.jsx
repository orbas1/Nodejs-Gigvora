import PropTypes from 'prop-types';
import { CheckCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function FollowUpPreview({ followUp, onComplete, onDelete }) {
  if (!followUp) {
    return null;
  }

  const dueDate = followUp.dueAt ? new Date(followUp.dueAt) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{followUp.deal?.title ?? 'Follow-up'}</h2>
          <p className="text-sm text-slate-500">{followUp.deal?.clientName ?? 'Client'}</p>
        </div>
        <div className="flex gap-2 text-sm">
          {followUp.status !== 'completed' ? (
            <button
              type="button"
              onClick={() => onComplete?.(followUp)}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 font-semibold text-emerald-600 transition hover:bg-emerald-50"
            >
              <CheckCircleIcon className="h-4 w-4" aria-hidden="true" /> Mark done
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onDelete?.(followUp)}
            className="inline-flex items-center gap-2 rounded-full border border-transparent px-4 py-2 font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-50"
          >
            <TrashIcon className="h-4 w-4" aria-hidden="true" /> Delete
          </button>
        </div>
      </div>

      <dl className="grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</dt>
          <dd className="text-sm text-slate-900">{followUp.status}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Due</dt>
          <dd className="text-sm text-slate-900">{dueDate ? dueDate.toLocaleString() : 'Date TBD'}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Channel</dt>
          <dd className="text-sm text-slate-900">{followUp.channel || 'Not set'}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</dt>
          <dd className="text-sm text-slate-900">{followUp.note || 'None'}</dd>
        </div>
      </dl>
    </div>
  );
}

FollowUpPreview.propTypes = {
  followUp: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    deal: PropTypes.shape({ title: PropTypes.string, clientName: PropTypes.string }),
    dueAt: PropTypes.string,
    status: PropTypes.string,
    channel: PropTypes.string,
    note: PropTypes.string,
  }),
  onComplete: PropTypes.func,
  onDelete: PropTypes.func,
};

FollowUpPreview.defaultProps = {
  followUp: null,
  onComplete: undefined,
  onDelete: undefined,
};
