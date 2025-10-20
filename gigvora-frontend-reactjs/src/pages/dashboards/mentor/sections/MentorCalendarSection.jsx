import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { CalendarDaysIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const EVENT_TYPES = ['Session', 'Office hours', 'Workshop', 'Cohort'];
const EVENT_STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'Awaiting prep'];

const DEFAULT_FORM = {
  title: '',
  type: 'Session',
  status: 'Scheduled',
  startsAt: '',
  endsAt: '',
  location: '',
  notes: '',
};

function formatDateTime(value) {
  if (!value) {
    return '—';
  }
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch (error) {
    return '—';
  }
}

export default function MentorCalendarSection({ events, onCreateEvent, onUpdateEvent, onDeleteEvent, saving }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const orderedEvents = useMemo(() => {
    return [...(events ?? [])].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [events]);

  useEffect(() => {
    if (!editingId) {
      setForm(DEFAULT_FORM);
    }
  }, [editingId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    const payload = {
      title: form.title,
      type: form.type,
      status: form.status,
      startsAt: form.startsAt,
      endsAt: form.endsAt,
      location: form.location,
      notes: form.notes,
    };
    try {
      if (editingId) {
        await onUpdateEvent?.(editingId, payload);
        setFeedback({ type: 'success', message: 'Event updated.' });
      } else {
        await onCreateEvent?.(payload);
        setFeedback({ type: 'success', message: 'Event scheduled.' });
      }
      setEditingId(null);
      setForm(DEFAULT_FORM);
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Unable to save event.' });
    }
  };

  const handleEdit = (calendarEvent) => {
    setEditingId(calendarEvent.id);
    setForm({
      title: calendarEvent.title || '',
      type: calendarEvent.type || 'Session',
      status: calendarEvent.status || 'Scheduled',
      startsAt: calendarEvent.startsAt ? calendarEvent.startsAt.slice(0, 16) : '',
      endsAt: calendarEvent.endsAt ? calendarEvent.endsAt.slice(0, 16) : '',
      location: calendarEvent.location || '',
      notes: calendarEvent.notes || '',
    });
    setFeedback(null);
  };

  const handleDelete = async (eventId) => {
    if (!eventId) return;
    setFeedback(null);
    try {
      await onDeleteEvent?.(eventId);
      if (editingId === eventId) {
        setEditingId(null);
        setForm(DEFAULT_FORM);
      }
      setFeedback({ type: 'success', message: 'Event removed.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Unable to remove event.' });
    }
  };

  return (
    <section className="space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <header className="flex items-start justify-between gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Calendar</p>
          <h2 className="text-2xl font-semibold text-slate-900">Orchestrate sessions and rituals with precision</h2>
          <p className="text-sm text-slate-600">
            Map out upcoming coaching touchpoints, async review windows, and live workshops. Keep mentees in sync with
            automated reminders and context-rich invites.
          </p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <CalendarDaysIcon className="h-7 w-7" aria-hidden="true" />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {editingId ? 'Update calendar event' : 'Schedule calendar event'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(DEFAULT_FORM);
                setFeedback(null);
              }}
              className="text-xs font-semibold text-accent hover:underline"
            >
              Reset
            </button>
          </div>

          {feedback ? (
            <div
              className={`rounded-2xl px-4 py-2 text-sm ${
                feedback.type === 'success'
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {feedback.message}
            </div>
          ) : null}

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Title
            <input
              type="text"
              required
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Type
              <select
                value={form.type}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Status
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {EVENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Starts at
              <input
                type="datetime-local"
                required
                value={form.startsAt}
                onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Ends at
              <input
                type="datetime-local"
                required
                value={form.endsAt}
                onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Location / access link
            <input
              type="text"
              value={form.location}
              placeholder="Zoom, Loom, physical venue"
              onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Notes
            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            {saving ? 'Saving event…' : editingId ? 'Update event' : 'Schedule event'}
          </button>
        </form>

        <div className="space-y-4">
          <ul className="space-y-4">
            {orderedEvents.map((calendarEvent) => (
              <li key={calendarEvent.id} className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{calendarEvent.title}</p>
                    <p className="text-sm text-slate-500">{calendarEvent.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {calendarEvent.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleEdit(calendarEvent)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(calendarEvent.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                    >
                      <TrashIcon className="h-4 w-4" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                </div>
                <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                  <p>
                    <span className="font-semibold text-slate-500">Starts:</span> {formatDateTime(calendarEvent.startsAt)}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Ends:</span> {formatDateTime(calendarEvent.endsAt)}
                  </p>
                  <p className="sm:col-span-2">
                    <span className="font-semibold text-slate-500">Location:</span> {calendarEvent.location || 'TBC'}
                  </p>
                </div>
                {calendarEvent.notes ? <p className="text-sm text-slate-600">{calendarEvent.notes}</p> : null}
              </li>
            ))}
            {!orderedEvents.length ? (
              <li className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No events scheduled yet. Publish availability to power automated invites.
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </section>
  );
}

MentorCalendarSection.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string,
      type: PropTypes.string,
      status: PropTypes.string,
      startsAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      endsAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      location: PropTypes.string,
      notes: PropTypes.string,
    }),
  ),
  onCreateEvent: PropTypes.func,
  onUpdateEvent: PropTypes.func,
  onDeleteEvent: PropTypes.func,
  saving: PropTypes.bool,
};

MentorCalendarSection.defaultProps = {
  events: [],
  onCreateEvent: undefined,
  onUpdateEvent: undefined,
  onDeleteEvent: undefined,
  saving: false,
};
