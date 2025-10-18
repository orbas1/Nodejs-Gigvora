import { useEffect, useState } from 'react';
import { REVIEW_VISIBILITY_OPTIONS } from '../constants.js';
import { formatDateInput, safeNumber } from '../utils.js';

export default function ReviewForm({ value, onSubmit, onCancel, busy }) {
  const [rating, setRating] = useState(value?.rating != null ? String(value.rating) : '5');
  const [headline, setHeadline] = useState(value?.headline ?? '');
  const [feedback, setFeedback] = useState(value?.feedback ?? '');
  const [visibility, setVisibility] = useState(value?.visibility ?? 'private');
  const [publishedAt, setPublishedAt] = useState(formatDateInput(value?.publishedAt));
  const [error, setError] = useState(null);

  useEffect(() => {
    setRating(value?.rating != null ? String(value.rating) : '5');
    setHeadline(value?.headline ?? '');
    setFeedback(value?.feedback ?? '');
    setVisibility(value?.visibility ?? 'private');
    setPublishedAt(formatDateInput(value?.publishedAt));
    setError(null);
  }, [value]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const numeric = safeNumber(rating);
    if (!numeric || numeric < 1 || numeric > 5) {
      setError('Rating must be 1-5');
      return;
    }
    setError(null);
    await onSubmit({
      rating: Math.round(numeric),
      headline: headline || null,
      feedback: feedback || null,
      visibility,
      publishedAt: publishedAt || null,
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Rating
        <input
          type="number"
          min="1"
          max="5"
          className="rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          value={rating}
          onChange={(event) => setRating(event.target.value)}
          disabled={busy}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Headline
        <input
          type="text"
          className="rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          value={headline}
          onChange={(event) => setHeadline(event.target.value)}
          disabled={busy}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Feedback
        <textarea
          className="min-h-[120px] rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          disabled={busy}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Visibility
        <select
          className="rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          value={visibility}
          onChange={(event) => setVisibility(event.target.value)}
          disabled={busy}
        >
          {REVIEW_VISIBILITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Published
        <input
          type="date"
          className="rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          value={publishedAt}
          onChange={(event) => setPublishedAt(event.target.value)}
          disabled={busy}
        />
      </label>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:bg-emerald-300"
          disabled={busy}
        >
          Save
        </button>
      </div>
    </form>
  );
}
