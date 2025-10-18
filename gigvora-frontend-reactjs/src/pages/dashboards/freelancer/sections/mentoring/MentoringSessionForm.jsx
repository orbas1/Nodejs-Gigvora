import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const DEFAULT_FORM = {
  mentorId: '',
  topic: '',
  agenda: '',
  scheduledAt: '',
  durationMinutes: 60,
  meetingType: 'virtual',
  meetingUrl: '',
  meetingLocation: '',
  pricePaid: '',
  currency: 'USD',
  status: 'scheduled',
};

const STATUS_OPTIONS = [
  { value: 'requested', label: 'Requested' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const MEETING_TYPES = [
  { value: 'virtual', label: 'Virtual' },
  { value: 'in_person', label: 'In person' },
  { value: 'phone', label: 'Phone' },
];

function buildMentorOptions(mentorLookup) {
  if (!mentorLookup) return [];
  return Array.from(mentorLookup.values()).map((mentor) => ({
    value: mentor.id,
    label: mentor.name,
    email: mentor.email ?? null,
  }));
}

export default function MentoringSessionForm({ mentorLookup, onSubmit, submitting, prefillMentorId }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState(null);

  const mentorOptions = useMemo(() => buildMentorOptions(mentorLookup), [mentorLookup]);

  useEffect(() => {
    if (!prefillMentorId) {
      return;
    }
    setForm((previous) => ({
      ...previous,
      mentorId: String(prefillMentorId),
    }));
  }, [prefillMentorId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!form.mentorId || !form.topic || !form.scheduledAt) {
      setError('Mentor, topic, and schedule are required.');
      return;
    }

    const payload = {
      mentorId: Number(form.mentorId),
      topic: form.topic.trim(),
      agenda: form.agenda.trim() || undefined,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
      meetingType: form.meetingType || undefined,
      meetingUrl: form.meetingUrl.trim() || undefined,
      meetingLocation: form.meetingLocation.trim() || undefined,
      pricePaid: form.pricePaid ? Number(form.pricePaid) : undefined,
      currency: form.currency || undefined,
      status: form.status,
    };

    try {
      await onSubmit(payload);
      setForm(DEFAULT_FORM);
    } catch (submitError) {
      setError(submitError?.message || 'Unable to create session.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">
          Mentor
          <select
            name="mentorId"
            value={form.mentorId}
            onChange={handleChange}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select mentor</option>
            {mentorOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} {option.email ? `(${option.email})` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Topic
          <input
            type="text"
            name="topic"
            value={form.topic}
            onChange={handleChange}
            placeholder="Growth strategy review"
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            required
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm font-semibold text-slate-700">
          Scheduled for
          <input
            type="datetime-local"
            name="scheduledAt"
            value={form.scheduledAt}
            onChange={handleChange}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            required
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Duration (minutes)
          <input
            type="number"
            min="15"
            step="15"
            name="durationMinutes"
            value={form.durationMinutes}
            onChange={handleChange}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Status
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">
          Meeting type
          <select
            name="meetingType"
            value={form.meetingType}
            onChange={handleChange}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {MEETING_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Meeting link
          <input
            type="url"
            name="meetingUrl"
            value={form.meetingUrl}
            onChange={handleChange}
            placeholder="https://meet.gigvora.com/session"
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">
          Location (optional)
          <input
            type="text"
            name="meetingLocation"
            value={form.meetingLocation}
            onChange={handleChange}
            placeholder="Gigvora HQ or Zoom"
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Agenda notes
          <textarea
            name="agenda"
            value={form.agenda}
            onChange={handleChange}
            rows={3}
            placeholder="Share context, prep work, or desired outcomes."
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm font-semibold text-slate-700">
          Price paid
          <input
            type="number"
            min="0"
            step="0.01"
            name="pricePaid"
            value={form.pricePaid}
            onChange={handleChange}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Currency
          <input
            type="text"
            name="currency"
            value={form.currency}
            onChange={handleChange}
            maxLength={3}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 uppercase tracking-[0.3em] text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <div className="flex items-end justify-end gap-3">
          <button
            type="button"
            onClick={() => setForm(DEFAULT_FORM)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
            disabled={submitting}
          >
            Reset
          </button>
          <button
            type="submit"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
            disabled={submitting}
          >
            Create session
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </form>
  );
}

MentoringSessionForm.propTypes = {
  mentorLookup: PropTypes.instanceOf(Map),
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  prefillMentorId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
