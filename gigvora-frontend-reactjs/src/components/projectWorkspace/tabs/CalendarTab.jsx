import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const INITIAL_FORM = {
  title: '',
  category: 'event',
  startAt: '',
  endAt: '',
  allDay: false,
  location: '',
  metadata: '',
};

const CATEGORY_OPTIONS = [
  { value: 'event', label: 'Event' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'focus', label: 'Focus block' },
];

function toInputDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
}

function formatDateTime(value) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function CalendarTab({ project, actions, canManage }) {
  const events = Array.isArray(project.calendarEvents) ? project.calendarEvents : [];
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.startAt || 0) - new Date(b.startAt || 0));
  }, [events]);

  const [form, setForm] = useState(() => ({ ...INITIAL_FORM }));
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState(() => ({ ...INITIAL_FORM }));
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleChange = (event, setter) => {
    const { name, type, checked, value } = event.target;
    setter((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const parseMetadata = (value) => {
    if (!value?.trim()) return undefined;
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new Error('Metadata must be valid JSON.');
    }
  };

  const buildPayload = (payload) => ({
    title: payload.title,
    category: payload.category,
    startAt: payload.startAt ? new Date(payload.startAt).toISOString() : undefined,
    endAt: payload.endAt ? new Date(payload.endAt).toISOString() : undefined,
    allDay: Boolean(payload.allDay),
    location: payload.location || undefined,
    metadata: parseMetadata(payload.metadata),
  });

  const resetForm = () => {
    setForm({ ...INITIAL_FORM });
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.createCalendarEvent(project.id, buildPayload(form));
      resetForm();
      setFeedback({ status: 'success', message: 'Calendar event created.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to create event.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (eventRecord) => {
    setEditingId(eventRecord.id);
    setEditingForm({
      title: eventRecord.title || '',
      category: eventRecord.category || 'event',
      startAt: toInputDateTime(eventRecord.startAt),
      endAt: toInputDateTime(eventRecord.endAt),
      allDay: Boolean(eventRecord.allDay),
      location: eventRecord.location || '',
      metadata: eventRecord.metadata ? JSON.stringify(eventRecord.metadata, null, 2) : '',
    });
    setFeedback(null);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.updateCalendarEvent(project.id, editingId, buildPayload(editingForm));
      setEditingId(null);
      setFeedback({ status: 'success', message: 'Event updated.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to update event.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.deleteCalendarEvent(project.id, eventId);
      setFeedback({ status: 'success', message: 'Event removed.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to remove event.' });
    } finally {
      setSubmitting(false);
    }
  };

  const totalAllDay = events.filter((eventRecord) => eventRecord.allDay).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Scheduled events</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{events.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">All-day blocks</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totalAllDay}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Next event</p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {sortedEvents[0]?.startAt ? formatDateTime(sortedEvents[0].startAt) : 'No events scheduled'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Categories used</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {
              [...new Set(events.map((eventRecord) => eventRecord.category || 'event'))].length
            }
          </p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="text-base font-semibold text-slate-900">Add project event</h4>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col text-sm text-slate-700">
            Title
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={(event) => handleChange(event, setForm)}
              required
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="Design sprint kickoff"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-700">
            Category
            <select
              name="category"
              value={form.category}
              onChange={(event) => handleChange(event, setForm)}
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm text-slate-700">
            Starts
            <input
              type="datetime-local"
              name="startAt"
              value={form.startAt}
              onChange={(event) => handleChange(event, setForm)}
              required
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-700">
            Ends
            <input
              type="datetime-local"
              name="endAt"
              value={form.endAt}
              onChange={(event) => handleChange(event, setForm)}
              disabled={!canManage || submitting || form.allDay}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="allDay"
              checked={form.allDay}
              onChange={(event) => handleChange(event, setForm)}
              disabled={!canManage || submitting}
              className="h-4 w-4 rounded border border-slate-300 text-accent focus:ring-accent"
            />
            All-day event
          </label>
          <label className="flex flex-col text-sm text-slate-700">
            Location
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={(event) => handleChange(event, setForm)}
              placeholder="Hybrid - HQ Boardroom"
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-700 md:col-span-2">
            Metadata (JSON)
            <textarea
              name="metadata"
              value={form.metadata}
              onChange={(event) => handleChange(event, setForm)}
              rows={3}
              placeholder='{"capacity": 12, "stream": "Zoom"}'
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
        </div>
        <div className="mt-4 flex items-center justify-end gap-3">
          {feedback ? (
            <p className={`text-sm ${feedback.status === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>
              {feedback.message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={!canManage || submitting}
            className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Add event
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {sortedEvents.length ? (
          sortedEvents.map((eventRecord) => (
            <article key={eventRecord.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              {editingId === eventRecord.id ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex flex-col text-sm text-slate-700">
                      Title
                      <input
                        type="text"
                        name="title"
                        value={editingForm.title}
                        onChange={(event) => handleChange(event, setEditingForm)}
                        required
                        disabled={!canManage || submitting}
                        className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </label>
                    <label className="flex flex-col text-sm text-slate-700">
                      Category
                      <select
                        name="category"
                        value={editingForm.category}
                        onChange={(event) => handleChange(event, setEditingForm)}
                        disabled={!canManage || submitting}
                        className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      >
                        {CATEGORY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col text-sm text-slate-700">
                      Starts
                      <input
                        type="datetime-local"
                        name="startAt"
                        value={editingForm.startAt}
                        onChange={(event) => handleChange(event, setEditingForm)}
                        required
                        disabled={!canManage || submitting}
                        className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </label>
                    <label className="flex flex-col text-sm text-slate-700">
                      Ends
                      <input
                        type="datetime-local"
                        name="endAt"
                        value={editingForm.endAt}
                        onChange={(event) => handleChange(event, setEditingForm)}
                        disabled={!canManage || submitting || editingForm.allDay}
                        className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        name="allDay"
                        checked={editingForm.allDay}
                        onChange={(event) => handleChange(event, setEditingForm)}
                        disabled={!canManage || submitting}
                        className="h-4 w-4 rounded border border-slate-300 text-accent focus:ring-accent"
                      />
                      All-day event
                    </label>
                    <label className="flex flex-col text-sm text-slate-700">
                      Location
                      <input
                        type="text"
                        name="location"
                        value={editingForm.location}
                        onChange={(event) => handleChange(event, setEditingForm)}
                        disabled={!canManage || submitting}
                        className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </label>
                    <label className="flex flex-col text-sm text-slate-700 md:col-span-2">
                      Metadata (JSON)
                      <textarea
                        name="metadata"
                        value={editingForm.metadata}
                        onChange={(event) => handleChange(event, setEditingForm)}
                        rows={3}
                        disabled={!canManage || submitting}
                        className="mt-1 rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </label>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-accent/40 hover:text-accent"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!canManage || submitting}
                      className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Save event
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">{eventRecord.title}</h4>
                    <p className="text-sm text-slate-500">
                      {eventRecord.category?.replace(/_/g, ' ') || 'event'} • {formatDateTime(eventRecord.startAt)}
                      {eventRecord.endAt ? ` → ${formatDateTime(eventRecord.endAt)}` : ''}
                    </p>
                    {eventRecord.location ? (
                      <p className="text-xs text-slate-500">Location: {eventRecord.location}</p>
                    ) : null}
                    {eventRecord.allDay ? (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs uppercase tracking-wide text-slate-500">
                        All-day
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(eventRecord)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!canManage || submitting}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(eventRecord.id)}
                      className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!canManage || submitting}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
            Your project calendar is empty. Capture ceremonies, deadlines, and focus blocks to keep everyone aligned.
          </p>
        )}
      </div>
    </div>
  );
}

CalendarTab.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    calendarEvents: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  actions: PropTypes.shape({
    createCalendarEvent: PropTypes.func.isRequired,
    updateCalendarEvent: PropTypes.func.isRequired,
    deleteCalendarEvent: PropTypes.func.isRequired,
  }).isRequired,
  canManage: PropTypes.bool,
};

CalendarTab.defaultProps = {
  canManage: true,
};
