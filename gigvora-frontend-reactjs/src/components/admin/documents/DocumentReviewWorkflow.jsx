import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { CheckIcon, ClockIcon, ExclamationTriangleIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const STATUS_STYLES = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected: 'border-rose-200 bg-rose-50 text-rose-700',
};

export default function DocumentReviewWorkflow({ reviews = [], onApprove, onReject, onRequestChanges }) {
  const grouped = useMemo(() => {
    return reviews.reduce(
      (acc, review) => {
        const key = review.status ?? 'pending';
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(review);
        return acc;
      },
      { pending: [], approved: [], rejected: [] },
    );
  }, [reviews]);

  return (
    <section className="space-y-6" id="document-reviews">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Review workflow</h2>
          <p className="mt-1 text-sm text-slate-600">
            Route documents through legal, compliance, and security approvals. Every decision is logged for auditors.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {['pending', 'approved', 'rejected'].map((status) => (
          <div key={status} className="space-y-4 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{status}</p>
                <h3 className="text-lg font-semibold text-slate-900">{grouped[status]?.length ?? 0} records</h3>
              </div>
              {status === 'pending' ? (
                <ClockIcon className="h-6 w-6 text-amber-400" aria-hidden="true" />
              ) : status === 'approved' ? (
                <CheckIcon className="h-6 w-6 text-emerald-400" aria-hidden="true" />
              ) : (
                <ExclamationTriangleIcon className="h-6 w-6 text-rose-400" aria-hidden="true" />
              )}
            </div>

            <div className="space-y-3">
              {(grouped[status] ?? []).map((review) => (
                <article key={review.id} className="space-y-2 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{review.documentName}</p>
                      <p className="text-xs text-slate-500">Requested by {review.requestedBy}</p>
                    </div>
                    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[status]}`}>
                      {status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Due {review.dueAt ? new Date(review.dueAt).toLocaleDateString() : 'TBC'}</p>
                  <p className="text-xs text-slate-500">{review.notes || 'No notes yet.'}</p>

                  {status === 'pending' && (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => onApprove?.(review.id)}
                        className="rounded-full border border-emerald-200 px-3 py-1 font-semibold uppercase tracking-wide text-emerald-600 hover:border-emerald-300 hover:text-emerald-700"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => onReject?.(review.id)}
                        className="rounded-full border border-rose-200 px-3 py-1 font-semibold uppercase tracking-wide text-rose-600 hover:border-rose-300 hover:text-rose-700"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => onRequestChanges?.(review.id)}
                        className="rounded-full border border-slate-200 px-3 py-1 font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
                      >
                        Request edits
                      </button>
                    </div>
                  )}
                </article>
              ))}

              {!grouped[status]?.length && (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-400">
                  No {status} reviews.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-900/90 p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white/10 p-3">
            <UserGroupIcon className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Reviewer SLA</p>
            <h3 className="text-lg font-semibold">Fast-track compliance</h3>
            <p className="text-sm text-white/80">
              Legal, security, and finance teams are assigned round-robin. Approvers are nudged on Slack if reviews are
              pending longer than 24 hours.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

DocumentReviewWorkflow.propTypes = {
  reviews: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      documentName: PropTypes.string,
      requestedBy: PropTypes.string,
      status: PropTypes.oneOf(['pending', 'approved', 'rejected']),
      dueAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      notes: PropTypes.string,
    }),
  ),
  onApprove: PropTypes.func,
  onReject: PropTypes.func,
  onRequestChanges: PropTypes.func,
};

DocumentReviewWorkflow.defaultProps = {
  reviews: [],
  onApprove: undefined,
  onReject: undefined,
  onRequestChanges: undefined,
};
