import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import WorkspaceDialog from '../WorkspaceDialog.jsx';

const INITIAL_ATTENDEE = { name: '', email: '', role: '', responseStatus: 'invited' };

const INITIAL_FORM = {
  title: '',
  scheduledAt: '',
  durationMinutes: 30,
  status: 'scheduled',
  location: '',
  meetingLink: '',
  agenda: '',
  notes: '',
  attendees: [INITIAL_ATTENDEE],
};

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const RESPONSE_OPTIONS = [
  { value: 'invited', label: 'Invited' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'tentative', label: 'Tentative' },
];

function toInputDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
}

function formatDateTime(value) {
  if (!value) return 'Unscheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unscheduled';
  return date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

function createAttendee() {
  return { ...INITIAL_ATTENDEE };
}

function sanitizeAttendees(attendees) {
  return (Array.isArray(attendees) ? attendees : [])
    .filter((attendee) => attendee.name?.trim())
    .map((attendee) => ({
      name: attendee.name.trim(),
      email: attendee.email?.trim() || undefined,
      role: attendee.role?.trim() || undefined,
      responseStatus: attendee.responseStatus || 'invited',
    }));
}

export default function MeetingsTab({ project, actions, canManage }) {
  const meetings = Array.isArray(project.meetings) ? project.meetings : [];
  const sortedMeetings = useMemo(() => {
    return [...meetings].sort((a, b) => new Date(a.scheduledAt || 0) - new Date(b.scheduledAt || 0));
  }, [meetings]);

  const upcomingCount = useMemo(() => {
    const now = Date.now();
    return meetings.filter((meeting) => new Date(meeting.scheduledAt || 0).getTime() > now).length;
  }, [meetings]);

  const [form, setForm] = useState(() => ({ ...INITIAL_FORM, attendees: [createAttendee()] }));
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState(() => ({ ...INITIAL_FORM, attendees: [createAttendee()] }));
  const [expandedMeetingId, setExpandedMeetingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const handleFieldChange = (event, setter) => {
    const { name, value } = event.target;
    setter((current) => ({ ...current, [name]: value }));
  };

  const handleAttendeeChange = (setter, index, field, value) => {
    setter((current) => {
      const list = Array.isArray(current.attendees) && current.attendees.length
        ? current.attendees
        : [createAttendee()];
      return {
        ...current,
        attendees: list.map((attendee, attendeeIndex) =>
          attendeeIndex === index ? { ...attendee, [field]: value } : attendee,
        ),
      };
    });
  };

  const handleAddAttendee = (setter) => {
    setter((current) => {
      const list = Array.isArray(current.attendees) ? current.attendees : [];
      return { ...current, attendees: [...list, createAttendee()] };
    });
  };

  const handleRemoveAttendee = (setter, index) => {
    setter((current) => {
      const list = Array.isArray(current.attendees) ? current.attendees : [];
      const filtered = list.filter((_, attendeeIndex) => attendeeIndex !== index);
      return {
        ...current,
        attendees: filtered.length ? filtered : [createAttendee()],
      };
    });
  };

  const buildPayload = (payload) => ({
    title: payload.title,
    agenda: payload.agenda || undefined,
    scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt).toISOString() : undefined,
    durationMinutes: payload.durationMinutes ? Number(payload.durationMinutes) : 30,
    location: payload.location || undefined,
    meetingLink: payload.meetingLink || undefined,
    status: payload.status,
    notes: payload.notes || undefined,
    attendees: sanitizeAttendees(payload.attendees),
  });

  const resetForm = () => {
    setForm({ ...INITIAL_FORM, attendees: [createAttendee()] });
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.createMeeting(project.id, buildPayload(form));
      resetForm();
      setCreateOpen(false);
      setFeedback({ status: 'success', message: 'Meeting scheduled.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to schedule meeting.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (meeting) => {
    setEditingId(meeting.id);
    setEditingForm({
      title: meeting.title || '',
      agenda: meeting.agenda || '',
      scheduledAt: toInputDateTime(meeting.scheduledAt),
      durationMinutes: meeting.durationMinutes ?? 30,
      location: meeting.location || '',
      meetingLink: meeting.meetingLink || '',
      status: meeting.status || 'scheduled',
      notes: meeting.notes || '',
      attendees:
        Array.isArray(meeting.attendees) && meeting.attendees.length
          ? meeting.attendees.map((attendee) => ({
              name: attendee.name || '',
              email: attendee.email || '',
              role: attendee.role || '',
              responseStatus: attendee.responseStatus || 'invited',
            }))
          : [createAttendee()],
    });
    setEditOpen(true);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.updateMeeting(project.id, editingId, buildPayload(editingForm));
      setEditOpen(false);
      setEditingId(null);
      setFeedback({ status: 'success', message: 'Meeting updated.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to update meeting.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (meetingId) => {
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.deleteMeeting(project.id, meetingId);
      setFeedback({ status: 'success', message: 'Meeting removed.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to remove meeting.' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderAttendees = (attendees) => {
    const list = Array.isArray(attendees) ? attendees : [];
    if (!list.length) {
      return <p className="text-xs text-slate-500">No attendees captured.</p>;
    }
    return (
      <ul className="space-y-1 text-xs text-slate-600">
        {list.map((attendee, index) => (
          <li key={`${attendee.email || attendee.name}-${index}`} className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700">{attendee.name}</span>
            {attendee.email ? <span className="text-slate-500">{attendee.email}</span> : null}
            {attendee.role ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                {attendee.role}
              </span>
            ) : null}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
              {attendee.responseStatus?.replace(/_/g, ' ') || 'invited'}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Meetings</p>
          <span className="text-sm font-semibold text-slate-700">Upcoming {upcomingCount}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setCreateOpen(true);
          }}
          disabled={!canManage}
          className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          New meeting
        </button>
      </div>

      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.status === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-600'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="space-y-4">
        {sortedMeetings.length ? (
          sortedMeetings.map((meeting) => {
            const isExpanded = expandedMeetingId === meeting.id;
            return (
              <div key={meeting.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{meeting.title}</p>
                    <p className="text-sm text-slate-600">{formatDateTime(meeting.scheduledAt)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      {meeting.status?.replace(/_/g, ' ') || 'scheduled'}
                    </span>
                    {meeting.durationMinutes ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1">{meeting.durationMinutes} min</span>
                    ) : null}
                    {meeting.location ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1">{meeting.location}</span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setExpandedMeetingId(isExpanded ? null : meeting.id)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300"
                    >
                      {isExpanded ? 'Hide' : 'Details'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(meeting)}
                      disabled={!canManage || submitting}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(meeting.id)}
                      disabled={!canManage || submitting}
                      className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {isExpanded ? (
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    {meeting.agenda ? (
                      <div>
                        <p className="font-semibold text-slate-900">Agenda</p>
                        <p className="text-slate-600">{meeting.agenda}</p>
                      </div>
                    ) : null}
                    {meeting.notes ? (
                      <div>
                        <p className="font-semibold text-slate-900">Notes</p>
                        <p className="text-slate-600">{meeting.notes}</p>
                      </div>
                    ) : null}
                    {meeting.meetingLink ? (
                      <a
                        href={meeting.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent hover:bg-accent/20"
                      >
                        Join link
                      </a>
                    ) : null}
                    <div>
                      <p className="font-semibold text-slate-900">Attendees</p>
                      {renderAttendees(meeting.attendees)}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-center text-sm text-slate-500">
            No meetings scheduled.
          </div>
        )}
      </div>

      <WorkspaceDialog
        open={createOpen}
        onClose={() => {
          if (!submitting) {
            setCreateOpen(false);
          }
        }}
        title="Schedule meeting"
        size="xl"
        fullHeight
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Title
            <input
              name="title"
              value={form.title}
              onChange={(event) => handleFieldChange(event, setForm)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              disabled={!canManage || submitting}
              required
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Start
              <input
                type="datetime-local"
                name="scheduledAt"
                value={form.scheduledAt}
                onChange={(event) => handleFieldChange(event, setForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Duration (minutes)
              <input
                type="number"
                name="durationMinutes"
                value={form.durationMinutes}
                onChange={(event) => handleFieldChange(event, setForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
                min="0"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Status
              <select
                name="status"
                value={form.status}
                onChange={(event) => handleFieldChange(event, setForm)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Location
              <input
                name="location"
                value={form.location}
                onChange={(event) => handleFieldChange(event, setForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Meeting link
            <input
              type="url"
              name="meetingLink"
              value={form.meetingLink}
              onChange={(event) => handleFieldChange(event, setForm)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              disabled={!canManage || submitting}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Agenda
            <textarea
              name="agenda"
              rows={3}
              value={form.agenda}
              onChange={(event) => handleFieldChange(event, setForm)}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              disabled={!canManage || submitting}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Notes
            <textarea
              name="notes"
              rows={2}
              value={form.notes}
              onChange={(event) => handleFieldChange(event, setForm)}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              disabled={!canManage || submitting}
            />
          </label>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attendees</p>
            <div className="mt-3 space-y-3">
              {form.attendees.map((attendee, index) => (
                <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm text-slate-700">
                    Name
                    <input
                      value={attendee.name}
                      onChange={(event) => handleAttendeeChange(setForm, index, 'name', event.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                      disabled={!canManage || submitting}
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-slate-700">
                    Email
                    <input
                      type="email"
                      value={attendee.email}
                      onChange={(event) => handleAttendeeChange(setForm, index, 'email', event.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                      disabled={!canManage || submitting}
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-slate-700">
                    Role
                    <input
                      value={attendee.role}
                      onChange={(event) => handleAttendeeChange(setForm, index, 'role', event.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                      disabled={!canManage || submitting}
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-slate-700">
                    Response
                    <select
                      value={attendee.responseStatus}
                      onChange={(event) => handleAttendeeChange(setForm, index, 'responseStatus', event.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                      disabled={!canManage || submitting}
                    >
                      {RESPONSE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveAttendee(setForm, index)}
                      className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:border-rose-400 hover:bg-rose-50"
                      disabled={form.attendees.length <= 1 || submitting}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddAttendee(setForm)}
                disabled={!canManage || submitting}
                className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300"
              >
                Add attendee
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                if (!submitting) {
                  setCreateOpen(false);
                }
              }}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canManage || submitting}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Saving…' : 'Save meeting'}
            </button>
          </div>
        </form>
      </WorkspaceDialog>

      <WorkspaceDialog
        open={editOpen && Boolean(editingId)}
        onClose={() => {
          if (!submitting) {
            setEditOpen(false);
            setEditingId(null);
          }
        }}
        title="Edit meeting"
        size="xl"
        fullHeight
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Title
            <input
              name="title"
              value={editingForm.title}
              onChange={(event) => handleFieldChange(event, setEditingForm)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              disabled={!canManage || submitting}
              required
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Start
              <input
                type="datetime-local"
                name="scheduledAt"
                value={editingForm.scheduledAt}
                onChange={(event) => handleFieldChange(event, setEditingForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Duration (minutes)
              <input
                type="number"
                name="durationMinutes"
                value={editingForm.durationMinutes}
                onChange={(event) => handleFieldChange(event, setEditingForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
                min="0"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Status
              <select
                name="status"
                value={editingForm.status}
                onChange={(event) => handleFieldChange(event, setEditingForm)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Location
              <input
                name="location"
                value={editingForm.location}
                onChange={(event) => handleFieldChange(event, setEditingForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Meeting link
            <input
              type="url"
              name="meetingLink"
              value={editingForm.meetingLink}
              onChange={(event) => handleFieldChange(event, setEditingForm)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              disabled={!canManage || submitting}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Agenda
            <textarea
              name="agenda"
              rows={3}
              value={editingForm.agenda}
              onChange={(event) => handleFieldChange(event, setEditingForm)}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              disabled={!canManage || submitting}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Notes
            <textarea
              name="notes"
              rows={2}
              value={editingForm.notes}
              onChange={(event) => handleFieldChange(event, setEditingForm)}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              disabled={!canManage || submitting}
            />
          </label>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attendees</p>
            <div className="mt-3 space-y-3">
              {editingForm.attendees.map((attendee, index) => (
                <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm text-slate-700">
                    Name
                    <input
                      value={attendee.name}
                      onChange={(event) => handleAttendeeChange(setEditingForm, index, 'name', event.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                      disabled={!canManage || submitting}
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-slate-700">
                    Email
                    <input
                      type="email"
                      value={attendee.email}
                      onChange={(event) => handleAttendeeChange(setEditingForm, index, 'email', event.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                      disabled={!canManage || submitting}
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-slate-700">
                    Role
                    <input
                      value={attendee.role}
                      onChange={(event) => handleAttendeeChange(setEditingForm, index, 'role', event.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                      disabled={!canManage || submitting}
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-slate-700">
                    Response
                    <select
                      value={attendee.responseStatus}
                      onChange={(event) => handleAttendeeChange(setEditingForm, index, 'responseStatus', event.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                      disabled={!canManage || submitting}
                    >
                      {RESPONSE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveAttendee(setEditingForm, index)}
                      className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:border-rose-400 hover:bg-rose-50"
                      disabled={editingForm.attendees.length <= 1 || submitting}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddAttendee(setEditingForm)}
                disabled={!canManage || submitting}
                className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300"
              >
                Add attendee
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                if (!submitting) {
                  setEditOpen(false);
                  setEditingId(null);
                }
              }}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !canManage}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Saving…' : 'Update meeting'}
            </button>
          </div>
        </form>
      </WorkspaceDialog>
    </div>
  );
}

MeetingsTab.propTypes = {
  project: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  canManage: PropTypes.bool.isRequired,
};
