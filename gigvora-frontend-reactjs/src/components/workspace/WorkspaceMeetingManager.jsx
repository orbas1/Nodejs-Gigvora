import { useMemo, useState } from 'react';

const STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function toInputDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
}

export default function WorkspaceMeetingManager({ meetings = [], onSave, onDelete }) {
  const [form, setForm] = useState({
    id: null,
    title: '',
    agenda: '',
    startAt: '',
    endAt: '',
    location: '',
    meetingUrl: '',
    hostName: '',
    status: 'scheduled',
    attendees: '',
    notes: '',
    recordingUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  const calendar = useMemo(() => {
    const grouped = new Map();
    meetings.forEach((meeting) => {
      const start = meeting.startAt ? new Date(meeting.startAt) : null;
      const key = start && !Number.isNaN(start.getTime()) ? start.toISOString().slice(0, 10) : 'unscheduled';
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(meeting);
    });
    return Array.from(grouped.entries())
      .sort(([a], [b]) => (a > b ? 1 : a < b ? -1 : 0))
      .map(([date, items]) => ({ date, items: items.sort((a, b) => new Date(a.startAt) - new Date(b.startAt)) }));
  }, [meetings]);

  function handleEdit(entry) {
    setForm({
      id: entry.id,
      title: entry.title ?? '',
      agenda: entry.agenda ?? '',
      startAt: toInputDate(entry.startAt),
      endAt: toInputDate(entry.endAt),
      location: entry.location ?? '',
      meetingUrl: entry.meetingUrl ?? '',
      hostName: entry.hostName ?? '',
      status: entry.status ?? 'scheduled',
      attendees: (entry.attendees ?? []).join(', '),
      notes: entry.notes ?? '',
      recordingUrl: entry.recordingUrl ?? '',
    });
    setFeedback(null);
    setError(null);
  }

  function resetForm() {
    setForm({
      id: null,
      title: '',
      agenda: '',
      startAt: '',
      endAt: '',
      location: '',
      meetingUrl: '',
      hostName: '',
      status: 'scheduled',
      attendees: '',
      notes: '',
      recordingUrl: '',
    });
    setFeedback(null);
    setError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!onSave) {
      return;
    }
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      await onSave({
        id: form.id,
        title: form.title,
        agenda: form.agenda,
        startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
        endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
        location: form.location,
        meetingUrl: form.meetingUrl,
        hostName: form.hostName,
        status: form.status,
        attendees: form.attendees
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        notes: form.notes,
        recordingUrl: form.recordingUrl,
      });
      setFeedback(form.id ? 'Meeting updated.' : 'Meeting scheduled.');
      resetForm();
    } catch (submitError) {
      setError(submitError);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry) {
    if (!onDelete) {
      return;
    }
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      await onDelete(entry);
      if (form.id === entry.id) {
        resetForm();
      }
      setFeedback('Meeting removed.');
    } catch (deleteError) {
      setError(deleteError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Meetings & project calendar</h2>
          <p className="text-sm text-slate-600">Manage kickoff calls, weekly syncs, stakeholder reviews, and retro sessions.</p>
        </div>
        <div className="text-sm text-slate-600">
          Upcoming: {meetings.filter((meeting) => new Date(meeting.startAt) > new Date()).length}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-lg font-semibold text-slate-900">Calendar</h3>
          <div className="mt-3 space-y-4">
            {calendar.length ? (
              calendar.map((day) => (
                <div key={day.date} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">
                    {day.date === 'unscheduled' ? 'To be scheduled' : new Date(day.date).toLocaleDateString()}
                  </p>
                  <ul className="mt-2 space-y-2 text-sm text-slate-600">
                    {day.items.map((item) => (
                      <li key={item.id} className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{item.title}</p>
                          <p className="text-xs text-slate-500">{formatDateTime(item.startAt)}</p>
                        </div>
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold capitalize text-blue-600">
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No meetings scheduled yet.</p>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Host</th>
                <th className="px-4 py-2 text-left">Start</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Location</th>
                <th className="px-4 py-2" aria-label="actions">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {meetings.length ? (
                meetings.map((meeting) => (
                  <tr key={meeting.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-900">{meeting.title}</td>
                    <td className="px-4 py-2 text-slate-600">{meeting.hostName ?? '—'}</td>
                    <td className="px-4 py-2 text-slate-500">{formatDateTime(meeting.startAt)}</td>
                    <td className="px-4 py-2 text-slate-600 capitalize">{meeting.status}</td>
                    <td className="px-4 py-2 text-slate-500">{meeting.location ?? meeting.meetingUrl ?? '—'}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(meeting)}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(meeting)}
                          className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-slate-500">
                    No meetings logged.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold text-slate-900">{form.id ? 'Edit meeting' : 'Schedule meeting'}</h3>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="meeting-title">
            Title
          </label>
          <input
            id="meeting-title"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Weekly status sync"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="meeting-host">
            Host name
          </label>
          <input
            id="meeting-host"
            value={form.hostName}
            onChange={(event) => setForm((prev) => ({ ...prev, hostName: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="meeting-status">
            Status
          </label>
          <select
            id="meeting-status"
            value={form.status}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="meeting-start">
            Start
          </label>
          <input
            id="meeting-start"
            type="datetime-local"
            value={form.startAt}
            onChange={(event) => setForm((prev) => ({ ...prev, startAt: event.target.value }))}
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="meeting-end">
            End
          </label>
          <input
            id="meeting-end"
            type="datetime-local"
            value={form.endAt}
            onChange={(event) => setForm((prev) => ({ ...prev, endAt: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="meeting-location">
            Location / URL
          </label>
          <input
            id="meeting-location"
            value={form.location}
            onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
            placeholder="Conference room or URL"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="meeting-url">
            Meeting URL
          </label>
          <input
            id="meeting-url"
            value={form.meetingUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, meetingUrl: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="meeting-attendees">
            Attendees (comma separated)
          </label>
          <input
            id="meeting-attendees"
            value={form.attendees}
            onChange={(event) => setForm((prev) => ({ ...prev, attendees: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Name, email"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="meeting-agenda">
            Agenda
          </label>
          <textarea
            id="meeting-agenda"
            value={form.agenda}
            onChange={(event) => setForm((prev) => ({ ...prev, agenda: event.target.value }))}
            rows={3}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="meeting-notes">
            Notes
          </label>
          <textarea
            id="meeting-notes"
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            rows={3}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="meeting-recording">
            Recording URL
          </label>
          <input
            id="meeting-recording"
            value={form.recordingUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, recordingUrl: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        {feedback ? <p className="md:col-span-2 text-sm text-emerald-600">{feedback}</p> : null}
        {error ? (
          <p className="md:col-span-2 text-sm text-rose-600">{error.message ?? 'Unable to save meeting.'}</p>
        ) : null}
        <div className="md:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? 'Saving…' : form.id ? 'Update meeting' : 'Schedule meeting'}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
