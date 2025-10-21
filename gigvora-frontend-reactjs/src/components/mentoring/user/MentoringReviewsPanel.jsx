import { useState } from 'react';
import PropTypes from 'prop-types';
import { StarIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

function ReviewCard({ review }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{review.topic || review.mentor?.name || 'Mentor session'}</p>
          <p className="text-xs text-slate-500">{review.mentor ? `${review.mentor.firstName ?? ''} ${review.mentor.lastName ?? ''}`.trim() : ''}</p>
        </div>
        {review.rating != null ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            <StarIcon className="h-4 w-4" />
            <span>{review.rating}/5</span>
          </span>
        ) : null}
      </div>
      {review.feedback ? <p className="mt-3 text-sm text-slate-600">{review.feedback}</p> : null}
    </article>
  );
}

export default function MentoringReviewsPanel({ pending = [], recent = [], canEdit = false, onReview }) {
  const [view, setView] = useState('pending');
  const items = view === 'pending' ? pending : recent;
  const emptyLabel = view === 'pending' ? 'No pending reviews.' : 'No reviews yet.';

  return (
    <section className="flex h-full flex-col gap-5 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setView('pending')}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              view === 'pending'
                ? 'border-accent bg-accent text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-500 hover:border-accent/50 hover:text-accent'
            }`}
          >
            To-do
          </button>
          <button
            type="button"
            onClick={() => setView('recent')}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              view === 'recent'
                ? 'border-accent bg-accent text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-500 hover:border-accent/50 hover:text-accent'
            }`}
          >
            Log
          </button>
        </div>
        {canEdit && view === 'pending' && items.length ? (
          <button
            type="button"
            onClick={() => onReview?.(items[0])}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
            <span>Review first</span>
          </button>
        ) : null}
      </header>

      <div className="grid gap-3 md:grid-cols-2" aria-live="polite">
        {items.length ? (
          items.map((entry) => <ReviewCard key={entry.id} review={entry} />)
        ) : (
          <div className="col-span-full flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 text-sm text-slate-500">
            {emptyLabel}
          </div>
        )}
      </div>
    </section>
  );
}

MentoringReviewsPanel.propTypes = {
  pending: PropTypes.arrayOf(PropTypes.object),
  recent: PropTypes.arrayOf(PropTypes.object),
  canEdit: PropTypes.bool,
  onReview: PropTypes.func,
};

