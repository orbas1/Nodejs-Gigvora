import { Fragment } from 'react';
import { IDENTITY_STEPS } from './constants.js';
import StatusBadge from './StatusBadge.jsx';
import { formatDisplayDate, titleCaseStatus } from './utils.js';

export default function IdentityReviewBoard({
  snapshot,
  reviewForm,
  onReviewFieldChange,
  onReview,
  reviewState,
  canReview,
  allowedStatuses = [],
  onOpenHistory,
}) {
  const isSubmittingReview = reviewState?.status === 'reviewing';

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">Current status</p>
            <StatusBadge status={snapshot?.status} />
          </div>
          <dl className="mt-6 grid gap-4 text-sm text-slate-600">
            <div>
              <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Submitted</dt>
              <dd className="mt-1 font-semibold text-slate-800">{formatDisplayDate(snapshot?.submittedAt)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Reviewed</dt>
              <dd className="mt-1 font-semibold text-slate-800">{formatDisplayDate(snapshot?.reviewedAt)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Reviewer</dt>
              <dd className="mt-1 font-semibold text-slate-800">{snapshot?.reviewerId ?? '—'}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Notes</p>
          <dl className="mt-4 space-y-4 text-sm text-slate-700">
            <div>
              <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Reviewer notes</dt>
              <dd className="mt-1 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-slate-600">
                {snapshot?.reviewNotes ? snapshot.reviewNotes : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Declined reason</dt>
              <dd className="mt-1 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-slate-600">
                {snapshot?.declinedReason ? snapshot.declinedReason : '—'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      {canReview ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Update status</p>
            <button
              type="button"
              onClick={onOpenHistory}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              History
            </button>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="identity-review-status" className="text-sm font-semibold text-slate-800">
                Decision
              </label>
              <select
                id="identity-review-status"
                name="status"
                value={reviewForm.status ?? ''}
                onChange={(event) => onReviewFieldChange('status', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              >
                {allowedStatuses
                  .filter((status) => status !== 'submitted' && status !== 'pending')
                  .map((status) => (
                    <option key={status} value={status}>
                      {titleCaseStatus(status)}
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="identity-review-notes" className="text-sm font-semibold text-slate-800">
                Notes
              </label>
              <textarea
                id="identity-review-notes"
                name="reviewNotes"
                rows={4}
                value={reviewForm.reviewNotes ?? ''}
                onChange={(event) => onReviewFieldChange('reviewNotes', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <label htmlFor="identity-review-reason" className="text-sm font-semibold text-slate-800">
              Decline reason
            </label>
            <textarea
              id="identity-review-reason"
              name="declinedReason"
              rows={3}
              value={reviewForm.declinedReason ?? ''}
              onChange={(event) => onReviewFieldChange('declinedReason', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onReview}
              disabled={isSubmittingReview}
              className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmittingReview ? 'Saving…' : 'Save decision'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
