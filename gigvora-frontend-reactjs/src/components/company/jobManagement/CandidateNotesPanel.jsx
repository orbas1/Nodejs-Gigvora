
import { useMemo, useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

function formatTimestamp(value) {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export default function CandidateNotesPanel({ notes, applications, onAdd, onUpdate }) {
  const [formState, setFormState] = useState({ applicationId: '', summary: '', stage: '', sentiment: 'neutral', nextSteps: '' });
  const [submitting, setSubmitting] = useState(false);

  const applicationOptions = useMemo(() => {
    return (applications ?? []).map((application) => ({
      id: application.id,
      label:
        `${application.candidate?.name ?? application.candidateName ?? 'Candidate'} • ${application.jobTitle ?? ''}`.trim(),
    }));
  }, [applications]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formState.applicationId || !formState.summary.trim()) {
      return;
    }
    try {
      setSubmitting(true);
      await onAdd?.({
        applicationId: formState.applicationId,
        summary: formState.summary,
        stage: formState.stage,
        sentiment: formState.sentiment,
        nextSteps: formState.nextSteps,
      });
      setFormState({ applicationId: '', summary: '', stage: '', sentiment: 'neutral', nextSteps: '' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm" onSubmit={handleSubmit}>
        <h4 className="text-sm font-semibold text-slate-900">Add note</h4>
        <div className="mt-3 grid gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Candidate
            <select
              name="applicationId"
              value={formState.applicationId}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            >
              <option value="">Select</option>
              {applicationOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Summary
            <textarea
              name="summary"
              value={formState.summary}
              onChange={handleChange}
              rows={4}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Feedback"
              required
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Stage
              <input
                name="stage"
                value={formState.stage}
                onChange={handleChange}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Stage"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Sentiment
              <select
                name="sentiment"
                value={formState.sentiment}
                onChange={handleChange}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="concern">Concern</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            Next steps
            <textarea
              name="nextSteps"
              value={formState.nextSteps}
              onChange={handleChange}
              rows={2}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Follow-up"
            />
          </label>
        </div>
        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
      <div className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm">
        <h4 className="text-sm font-semibold text-slate-900">Latest</h4>
        <ul className="mt-3 space-y-3">
          {(notes ?? []).length ? (
            notes
              .slice()
              .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
              .slice(0, 10)
              .map((note) => (
                <li key={note.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 rounded-full bg-emerald-50 p-2 text-emerald-600">
                      <CheckCircleIcon className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{note.summary}</p>
                      <p className="text-xs text-slate-500">{formatTimestamp(note.createdAt)}</p>
                      {note.nextSteps ? <p className="text-xs text-slate-500">Next: {note.nextSteps}</p> : null}
                    </div>
                  </div>
                </li>
              ))
          ) : (
            <li className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-3 py-6 text-sm text-slate-500">No notes.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
