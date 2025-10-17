import PropTypes from 'prop-types';
import { CheckCircleIcon, ClockIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function FollowUpList({ followUps, onInspect, onComplete, onDelete }) {
  if (!followUps.length) {
    return <p className="text-sm text-slate-500">No tasks yet. Schedule the next touch.</p>;
  }

  return (
    <div className="mt-4 space-y-3">
      {followUps.map((followUp) => {
        const dueDate = followUp.dueAt ? new Date(followUp.dueAt) : null;
        const isOverdue = dueDate && dueDate.getTime() < Date.now() && followUp.status !== 'completed';

        return (
          <button
            key={followUp.id}
            type="button"
            onClick={() => onInspect?.(followUp)}
            className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
              isOverdue
                ? 'border-rose-200 bg-rose-50/60 hover:border-rose-300 hover:bg-rose-50'
                : 'border-slate-200/80 bg-slate-50 hover:border-accent hover:bg-white'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{followUp.deal?.title ?? 'Deal'}</p>
                <p className="text-xs text-slate-500">{followUp.deal?.clientName ?? 'Client'}</p>
              </div>
              <div className="flex gap-2 text-[11px]">
                {followUp.status !== 'completed' ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onComplete?.(followUp);
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-2 py-1 font-semibold text-emerald-600 transition hover:bg-emerald-50"
                  >
                    <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden="true" /> Done
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete?.(followUp);
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-1 font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-50"
                >
                  <TrashIcon className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
                  isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'
                }`}
              >
                <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {dueDate ? dueDate.toLocaleDateString() : 'Date TBD'}
              </span>
              {followUp.channel ? <span>{followUp.channel}</span> : null}
              {followUp.note ? <span className="truncate text-slate-500">{followUp.note}</span> : null}
              <span className="uppercase tracking-wide text-slate-400">{followUp.status}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

FollowUpList.propTypes = {
  followUps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      deal: PropTypes.shape({
        title: PropTypes.string,
        clientName: PropTypes.string,
      }),
      dueAt: PropTypes.string,
      status: PropTypes.string,
      channel: PropTypes.string,
      note: PropTypes.string,
    }),
  ).isRequired,
  onInspect: PropTypes.func,
  onComplete: PropTypes.func,
  onDelete: PropTypes.func,
};

FollowUpList.defaultProps = {
  onInspect: undefined,
  onComplete: undefined,
  onDelete: undefined,
};
