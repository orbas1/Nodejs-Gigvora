import { useState } from 'react';
import WorkspaceModal from './WorkspaceModal.jsx';

const MEETING_STATUSES = ['scheduled', 'completed', 'cancelled'];

function formatDate(value, { withTime = false } = {}) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return withTime
    ? new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
    : new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric' }).format(date);
}

export default function WorkspaceMeetingsTab({
  meetings = [],
  calendarEvents = [],
  onCreateMeeting,
  onUpdateMeeting,
  onDeleteMeeting,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
}) {
  const [meetingForm, setMeetingForm] = useState(null);
  const [eventForm, setEventForm] = useState(null);

  const handleSubmitMeeting = (event) => {
    event.preventDefault();
    if (!meetingForm?.title || !meetingForm?.scheduledAt) {
      return;
    }
    const payload = {
      title: meetingForm.title,
      agenda: meetingForm.agenda,
      scheduledAt: meetingForm.scheduledAt,
      durationMinutes: meetingForm.durationMinutes,
      location: meetingForm.location,
      meetingLink: meetingForm.meetingLink,
      organizerName: meetingForm.organizerName,
      status: meetingForm.status,
      notes: meetingForm.notes,
    };
    if (meetingForm.id) {
      onUpdateMeeting?.(meetingForm.id, payload);
    } else {
      onCreateMeeting?.(payload);
    }
    setMeetingForm(null);
  };

  const handleSubmitEvent = (event) => {
    event.preventDefault();
    if (!eventForm?.title || !eventForm?.startAt) {
      return;
    }
    const payload = {
      title: eventForm.title,
      eventType: eventForm.eventType,
      startAt: eventForm.startAt,
      endAt: eventForm.endAt,
      visibility: eventForm.visibility,
      location: eventForm.location,
      description: eventForm.description,
    };
    if (eventForm.id) {
      onUpdateEvent?.(eventForm.id, payload);
    } else {
      onCreateEvent?.(payload);
    }
    setEventForm(null);
  };

  return (
    <div className="space-y-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Meetings</h2>
          <button
            type="button"
            onClick={() =>
              setMeetingForm({
                title: '',
                agenda: '',
                scheduledAt: '',
                durationMinutes: 60,
                location: '',
                meetingLink: '',
                organizerName: '',
                status: 'scheduled',
                notes: '',
              })
            }
            className="inline-flex items-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark"
          >
            Schedule
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200/70 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{meeting.title}</p>
                <p className="text-xs text-slate-500">
                  {formatDate(meeting.scheduledAt, { withTime: true })} · {meeting.durationMinutes ?? 60} minutes · {meeting.organizerName || 'No organiser'}
                </p>
                {meeting.agenda ? <p className="mt-1 text-xs text-slate-500">Agenda: {meeting.agenda}</p> : null}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setMeetingForm({
                      id: meeting.id,
                      title: meeting.title ?? '',
                      agenda: meeting.agenda ?? '',
                      scheduledAt: meeting.scheduledAt ? meeting.scheduledAt.slice(0, 16) : '',
                      durationMinutes: meeting.durationMinutes ?? 60,
                      location: meeting.location ?? '',
                      meetingLink: meeting.meetingLink ?? '',
                      organizerName: meeting.organizerName ?? '',
                      status: meeting.status ?? 'scheduled',
                      notes: meeting.notes ?? '',
                    })
                  }
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteMeeting?.(meeting.id)}
                  className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {meetings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
              No meetings scheduled.
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Timeline events</h2>
          <button
            type="button"
            onClick={() =>
              setEventForm({
                title: '',
                eventType: 'milestone',
                startAt: '',
                endAt: '',
                visibility: 'team',
                location: '',
                description: '',
              })
            }
            className="inline-flex items-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark"
          >
            Add event
          </button>
        </div>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Start</th>
                <th className="px-4 py-2 text-left">End</th>
                <th className="px-4 py-2 text-left">Visibility</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calendarEvents.map((eventItem) => (
                <tr key={eventItem.id} className="text-slate-600">
                  <td className="px-4 py-3 font-medium text-slate-900">{eventItem.title}</td>
                  <td className="px-4 py-3">{eventItem.eventType ?? 'milestone'}</td>
                  <td className="px-4 py-3">{formatDate(eventItem.startAt, { withTime: true })}</td>
                  <td className="px-4 py-3">{formatDate(eventItem.endAt, { withTime: true })}</td>
                  <td className="px-4 py-3 text-xs uppercase text-slate-500">{eventItem.visibility ?? 'team'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEventForm({
                            id: eventItem.id,
                            title: eventItem.title ?? '',
                            eventType: eventItem.eventType ?? 'milestone',
                            startAt: eventItem.startAt ? eventItem.startAt.slice(0, 16) : '',
                            endAt: eventItem.endAt ? eventItem.endAt.slice(0, 16) : '',
                            visibility: eventItem.visibility ?? 'team',
                            location: eventItem.location ?? '',
                            description: eventItem.description ?? '',
                          })
                        }
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteEvent?.(eventItem.id)}
                        className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {calendarEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-xs text-slate-500">
                    No timeline events captured.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <WorkspaceModal
        open={meetingForm !== null}
        title={meetingForm?.id ? 'Edit meeting' : 'New meeting'}
        description="Orchestrate project rituals with full context."
        onClose={() => setMeetingForm(null)}
      >
        {meetingForm ? (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmitMeeting}>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Title
              <input
                type="text"
                value={meetingForm.title ?? ''}
                onChange={(event) => setMeetingForm((state) => ({ ...(state ?? {}), title: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Start
              <input
                type="datetime-local"
                value={meetingForm.scheduledAt ?? ''}
                onChange={(event) => setMeetingForm((state) => ({ ...(state ?? {}), scheduledAt: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Duration (minutes)
              <input
                type="number"
                min="15"
                value={meetingForm.durationMinutes ?? 60}
                onChange={(event) => setMeetingForm((state) => ({ ...(state ?? {}), durationMinutes: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Organizer
              <input
                type="text"
                value={meetingForm.organizerName ?? ''}
                onChange={(event) => setMeetingForm((state) => ({ ...(state ?? {}), organizerName: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Location
              <input
                type="text"
                value={meetingForm.location ?? ''}
                onChange={(event) => setMeetingForm((state) => ({ ...(state ?? {}), location: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Meeting link
              <input
                type="url"
                value={meetingForm.meetingLink ?? ''}
                onChange={(event) => setMeetingForm((state) => ({ ...(state ?? {}), meetingLink: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
              <select
                value={meetingForm.status ?? 'scheduled'}
                onChange={(event) => setMeetingForm((state) => ({ ...(state ?? {}), status: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {MEETING_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label className="md:col-span-2 space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Agenda
              <textarea
                value={meetingForm.agenda ?? ''}
                onChange={(event) => setMeetingForm((state) => ({ ...(state ?? {}), agenda: event.target.value }))}
                rows={2}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="md:col-span-2 space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Notes
              <textarea
                value={meetingForm.notes ?? ''}
                onChange={(event) => setMeetingForm((state) => ({ ...(state ?? {}), notes: event.target.value }))}
                rows={2}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMeetingForm(null)}
                className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                {meetingForm.id ? 'Save meeting' : 'Create meeting'}
              </button>
            </div>
          </form>
        ) : null}
      </WorkspaceModal>

      <WorkspaceModal
        open={eventForm !== null}
        title={eventForm?.id ? 'Edit timeline event' : 'New timeline event'}
        description="Place milestones, retrospectives, and checkpoints on the shared calendar."
        onClose={() => setEventForm(null)}
      >
        {eventForm ? (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmitEvent}>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Title
              <input
                type="text"
                value={eventForm.title ?? ''}
                onChange={(event) => setEventForm((state) => ({ ...(state ?? {}), title: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Type
              <input
                type="text"
                value={eventForm.eventType ?? 'milestone'}
                onChange={(event) => setEventForm((state) => ({ ...(state ?? {}), eventType: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Start
              <input
                type="datetime-local"
                value={eventForm.startAt ?? ''}
                onChange={(event) => setEventForm((state) => ({ ...(state ?? {}), startAt: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              End
              <input
                type="datetime-local"
                value={eventForm.endAt ?? ''}
                onChange={(event) => setEventForm((state) => ({ ...(state ?? {}), endAt: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Visibility
              <input
                type="text"
                value={eventForm.visibility ?? 'team'}
                onChange={(event) => setEventForm((state) => ({ ...(state ?? {}), visibility: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Location
              <input
                type="text"
                value={eventForm.location ?? ''}
                onChange={(event) => setEventForm((state) => ({ ...(state ?? {}), location: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="md:col-span-2 space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Description
              <textarea
                value={eventForm.description ?? ''}
                onChange={(event) => setEventForm((state) => ({ ...(state ?? {}), description: event.target.value }))}
                rows={2}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEventForm(null)}
                className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                {eventForm.id ? 'Save event' : 'Create event'}
              </button>
            </div>
          </form>
        ) : null}
      </WorkspaceModal>
    </div>
  );
}
