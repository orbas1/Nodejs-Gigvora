import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

function formatMentorOption(mentor) {
  if (!mentor) return '';
  const name = [mentor.firstName, mentor.lastName].filter(Boolean).join(' ') || `Mentor #${mentor.id}`;
  const headline = mentor.profile?.headline || mentor.profile?.missionStatement || null;
  return headline ? `${name} — ${headline}` : name;
}

export default function MentoringSessionForm({
  mentors = [],
  orders = [],
  onSubmit,
  onCancel,
  initialValues = {},
  submitting = false,
}) {
  const [formState, setFormState] = useState(() => ({
    mentorId: initialValues.mentorId ?? '',
    orderId: initialValues.orderId ?? '',
    topic: initialValues.topic ?? '',
    agenda: initialValues.agenda ?? '',
    scheduledAt: initialValues.scheduledAt ? initialValues.scheduledAt.slice(0, 16) : '',
    durationMinutes: initialValues.durationMinutes ?? '',
    meetingLocation: initialValues.meetingLocation ?? '',
    meetingType: initialValues.meetingType ?? 'Virtual',
    meetingUrl: initialValues.meetingUrl ?? '',
    pricePaid: initialValues.pricePaid ?? '',
    currency: initialValues.currency ?? 'USD',
    notes: initialValues.notes ?? '',
    status: initialValues.status ?? 'scheduled',
  }));

  const mentorOptions = useMemo(() => {
    const uniqueMentors = new Map();
    mentors.forEach((mentor) => {
      if (mentor && mentor.id && !uniqueMentors.has(mentor.id)) {
        uniqueMentors.set(mentor.id, mentor);
      }
    });
    return Array.from(uniqueMentors.values());
  }, [mentors]);

  const orderOptions = useMemo(() => {
    return Array.isArray(orders)
      ? orders.filter((order) => order && ['pending', 'active'].includes(order.status))
      : [];
  }, [orders]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!onSubmit) return;
    const payload = {
      mentorId: formState.mentorId ? Number(formState.mentorId) : null,
      orderId: formState.orderId ? Number(formState.orderId) : undefined,
      topic: formState.topic,
      agenda: formState.agenda || undefined,
      scheduledAt: formState.scheduledAt ? new Date(formState.scheduledAt).toISOString() : undefined,
      durationMinutes: formState.durationMinutes ? Number(formState.durationMinutes) : undefined,
      meetingLocation: formState.meetingLocation || undefined,
      meetingType: formState.meetingType || undefined,
      meetingUrl: formState.meetingUrl || undefined,
      pricePaid: formState.pricePaid === '' ? undefined : Number(formState.pricePaid),
      currency: formState.currency || undefined,
      notes: formState.notes || undefined,
      status: formState.status,
    };
    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Mentor</span>
          <select
            name="mentorId"
            required
            value={formState.mentorId}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
          >
            <option value="">Select mentor…</option>
            {mentorOptions.map((mentor) => (
              <option key={mentor.id} value={mentor.id}>
                {formatMentorOption(mentor)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Apply package credits</span>
          <select
            name="orderId"
            value={formState.orderId}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
          >
            <option value="">No package applied</option>
            {orderOptions.map((order) => (
              <option key={order.id} value={order.id}>
                {order.packageName} · {order.sessionsRemaining ?? order.sessionsPurchased - order.sessionsRedeemed} sessions left
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-slate-700">Session topic</span>
        <input
          name="topic"
          value={formState.topic}
          onChange={handleChange}
          required
          placeholder="e.g. Portfolio storytelling audit"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Scheduled for</span>
          <input
            type="datetime-local"
            name="scheduledAt"
            value={formState.scheduledAt}
            onChange={handleChange}
            required
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Duration (minutes)</span>
          <input
            name="durationMinutes"
            type="number"
            min="15"
            step="5"
            value={formState.durationMinutes}
            onChange={handleChange}
            placeholder="45"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Format</span>
          <select
            name="meetingType"
            value={formState.meetingType}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
          >
            <option value="Virtual">Virtual</option>
            <option value="In person">In person</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Meeting link</span>
          <input
            name="meetingUrl"
            type="url"
            value={formState.meetingUrl}
            onChange={handleChange}
            placeholder="https://..."
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-slate-700">Meeting location or notes</span>
        <input
          name="meetingLocation"
          value={formState.meetingLocation}
          onChange={handleChange}
          placeholder="Zoom, Teams, or office location"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-slate-700">Agenda & preparation notes</span>
        <textarea
          name="agenda"
          value={formState.agenda}
          onChange={handleChange}
          rows="3"
          placeholder="Share context, goals, and any documents the mentor should review."
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Status</span>
          <select
            name="status"
            value={formState.status}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
          >
            <option value="requested">Requested</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Price paid</span>
          <input
            name="pricePaid"
            type="number"
            min="0"
            step="0.01"
            value={formState.pricePaid}
            onChange={handleChange}
            placeholder="150"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Currency</span>
          <input
            name="currency"
            value={formState.currency}
            onChange={handleChange}
            maxLength={3}
            className="rounded-xl border border-slate-300 px-3 py-2 uppercase text-sm shadow-inner focus:border-accent focus:outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-slate-700">Internal notes</span>
        <textarea
          name="notes"
          value={formState.notes}
          onChange={handleChange}
          rows="3"
          placeholder="Add reminders or preparation tasks for collaborators."
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
        />
      </label>

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            disabled={submitting}
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? 'Saving…' : 'Save session'}
        </button>
      </div>
    </form>
  );
}

MentoringSessionForm.propTypes = {
  mentors: PropTypes.arrayOf(PropTypes.object),
  orders: PropTypes.arrayOf(PropTypes.object),
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  initialValues: PropTypes.object,
  submitting: PropTypes.bool,
};

