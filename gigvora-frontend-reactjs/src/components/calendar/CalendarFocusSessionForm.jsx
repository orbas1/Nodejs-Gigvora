import { useState } from 'react';

const FOCUS_SESSION_OPTIONS = [
  { value: 'interview_prep', label: 'Interview preparation' },
  { value: 'application', label: 'Applications' },
  { value: 'deep_work', label: 'Deep work' },
  { value: 'networking', label: 'Networking' },
  { value: 'mentorship', label: 'Mentorship' },
  { value: 'volunteering', label: 'Volunteering' },
  { value: 'wellbeing', label: 'Wellbeing' },
];

function toInputDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (num) => num.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
}

export default function CalendarFocusSessionForm({ initialSession, onSubmit, onCancel, busy = false }) {
  const [formState, setFormState] = useState(() => ({
    focusType: initialSession?.focusType ?? 'interview_prep',
    startedAt: toInputDate(initialSession?.startedAt) || '',
    endedAt: toInputDate(initialSession?.endedAt) || '',
    durationMinutes:
      initialSession?.durationMinutes == null ? '' : String(initialSession.durationMinutes ?? ''),
    completed: Boolean(initialSession?.completed ?? false),
    notes: initialSession?.notes ?? '',
  }));
  const [error, setError] = useState(null);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setFormState((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!formState.startedAt) {
      setError('Select a start time.');
      return;
    }
    setError(null);
    const payload = {
      focusType: formState.focusType,
      startedAt: new Date(formState.startedAt).toISOString(),
      endedAt: formState.endedAt ? new Date(formState.endedAt).toISOString() : null,
      durationMinutes: formState.durationMinutes === '' ? null : Number(formState.durationMinutes),
      completed: Boolean(formState.completed),
      notes: formState.notes.trim() || null,
    };
    try {
      await onSubmit(payload);
    } catch (submissionError) {
      setError(submissionError?.message ?? 'Unable to save the focus session.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="focus-type">
          Session type
        </label>
        <select
          id="focus-type"
          name="focusType"
          value={formState.focusType}
          onChange={handleChange}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          disabled={busy}
        >
          {FOCUS_SESSION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="focus-start">
            Start
          </label>
          <input
            id="focus-start"
            name="startedAt"
            type="datetime-local"
            value={formState.startedAt}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            disabled={busy}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="focus-end">
            End (optional)
          </label>
          <input
            id="focus-end"
            name="endedAt"
            type="datetime-local"
            value={formState.endedAt}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            disabled={busy}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="focus-duration">
          Duration (minutes)
        </label>
        <input
          id="focus-duration"
          name="durationMinutes"
          type="number"
          min="0"
          value={formState.durationMinutes}
          onChange={handleChange}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          disabled={busy}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="focus-notes">
          Notes
        </label>
        <textarea
          id="focus-notes"
          name="notes"
          rows={3}
          value={formState.notes}
          onChange={handleChange}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          disabled={busy}
          placeholder="Prep tasks, agenda, or wins"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          name="completed"
          checked={formState.completed}
          onChange={handleChange}
          className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
          disabled={busy}
        />
        Mark session as completed
      </label>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          disabled={busy}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent/90 disabled:opacity-50"
          disabled={busy}
        >
          {initialSession ? 'Update session' : 'Log session'}
        </button>
      </div>
    </form>
  );
}
