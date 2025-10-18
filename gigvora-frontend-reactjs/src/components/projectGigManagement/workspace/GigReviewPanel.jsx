import { useState } from 'react';
import PropTypes from 'prop-types';

function formatScore(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${Number(value).toFixed(1)}/5`;
}

const SCORE_FIELDS = [
  { key: 'overallScore', label: 'Overall' },
  { key: 'qualityScore', label: 'Quality' },
  { key: 'communicationScore', label: 'Communication' },
  { key: 'reliabilityScore', label: 'Reliability' },
];

export default function GigReviewPanel({ scorecard, canManage, onSubmit }) {
  const [form, setForm] = useState({
    overallScore: scorecard?.overallScore ?? '',
    qualityScore: scorecard?.qualityScore ?? '',
    communicationScore: scorecard?.communicationScore ?? '',
    reliabilityScore: scorecard?.reliabilityScore ?? '',
    notes: scorecard?.notes ?? '',
  });
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {};
    SCORE_FIELDS.forEach((field) => {
      if (form[field.key] !== '' && form[field.key] != null) {
        const numberValue = Number(form[field.key]);
        if (!Number.isNaN(numberValue)) {
          payload[field.key] = numberValue;
        }
      }
    });
    if (form.notes.trim()) {
      payload.notes = form.notes.trim();
    }
    if (!Object.keys(payload).length) {
      setFeedback({ tone: 'error', message: 'Add at least one score.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await onSubmit({ scorecard: payload });
      setFeedback({ tone: 'success', message: 'Review saved.' });
    } catch (error) {
      setFeedback({ tone: 'error', message: error?.message ?? 'Could not save review.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="flex h-full flex-col gap-6" onSubmit={handleSubmit}>
      <header className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Review</h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {formatScore(scorecard?.overallScore)}
        </span>
      </header>
      <div className="flex-1 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {SCORE_FIELDS.map((field) => (
            <label key={field.key} className="flex flex-col gap-2 text-xs font-semibold text-slate-600">
              {field.label}
              <input
                name={field.key}
                value={form[field.key]}
                onChange={handleChange}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                placeholder="4.5"
                type="number"
                min="0"
                max="5"
                step="0.1"
                disabled={!canManage || submitting}
              />
            </label>
          ))}
        </div>
        <label className="mt-6 flex flex-col gap-2 text-xs font-semibold text-slate-600">
          Notes
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={4}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="Share context"
            disabled={!canManage || submitting}
          />
        </label>
      </div>
      {feedback ? (
        <p className={`text-sm ${feedback.tone === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>{feedback.message}</p>
      ) : null}
      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
          disabled={!canManage || submitting}
        >
          {submitting ? 'Saving…' : 'Save review'}
        </button>
      </div>
    </form>
  );
}

GigReviewPanel.propTypes = {
  scorecard: PropTypes.shape({
    overallScore: PropTypes.number,
    qualityScore: PropTypes.number,
    communicationScore: PropTypes.number,
    reliabilityScore: PropTypes.number,
    notes: PropTypes.string,
  }),
  canManage: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
};

GigReviewPanel.defaultProps = {
  scorecard: null,
  canManage: false,
};
