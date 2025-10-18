import { useEffect, useMemo, useState } from 'react';

const EVENT_TYPE_OPTIONS = [
  { value: 'project', label: 'Project' },
  { value: 'gig', label: 'Gig' },
  { value: 'interview', label: 'Interview' },
  { value: 'mentorship', label: 'Mentor' },
  { value: 'volunteering', label: 'Volunteer' },
];

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'tentative', label: 'Tentative' },
  { value: 'completed', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];

const VISIBILITY_OPTIONS = [
  { value: 'internal', label: 'Team' },
  { value: 'client', label: 'Client' },
  { value: 'public', label: 'Public' },
];

const RELATED_TYPE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'project', label: 'Project' },
  { value: 'gig', label: 'Gig' },
  { value: 'job_interview', label: 'Interview' },
  { value: 'mentorship', label: 'Mentor' },
  { value: 'volunteering', label: 'Volunteer' },
];

function toDateInputValue(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function normaliseMetadata(initialMetadata) {
  if (!initialMetadata || typeof initialMetadata !== 'object') {
    return {};
  }
  return { ...initialMetadata };
}

function buildAttachmentsText(attachments = []) {
  if (!Array.isArray(attachments) || !attachments.length) {
    return '';
  }
  return attachments
    .map((attachment) => {
      if (!attachment) return '';
      const label = attachment.label || attachment.title || '';
      const url = attachment.url || attachment.href || '';
      if (!label && url) {
        return url;
      }
      if (!url) {
        return '';
      }
      return label ? `${label} | ${url}` : url;
    })
    .filter(Boolean)
    .join('\n');
}

function buildGuestEmailText(guestEmails = []) {
  if (!Array.isArray(guestEmails) || !guestEmails.length) {
    return '';
  }
  return guestEmails.join('\n');
}

function buildReminderText(reminderOffsets = []) {
  if (!Array.isArray(reminderOffsets) || !reminderOffsets.length) {
    return '';
  }
  return reminderOffsets.join(', ');
}

function deriveInitialState(event) {
  if (!event) {
    return {
      title: '',
      description: '',
      notes: '',
      eventType: 'project',
      status: 'planned',
      visibility: 'internal',
      startsAt: '',
      endsAt: '',
      isAllDay: false,
      location: '',
      meetingUrl: '',
      coverImageUrl: '',
      attachmentsText: '',
      guestEmailsText: '',
      reminderText: '',
      relatedEntityType: '',
      relatedEntityId: '',
      timezone: '',
      metadata: {},
      collaboratorIds: [],
    };
  }

  return {
    title: event.title ?? '',
    description: event.description ?? '',
    notes: event.notes ?? '',
    eventType: event.eventType ?? 'project',
    status: event.status ?? 'planned',
    visibility: event.visibility ?? 'internal',
    startsAt: toDateInputValue(event.startsAt),
    endsAt: toDateInputValue(event.endsAt),
    isAllDay: Boolean(event.isAllDay),
    location: event.location ?? '',
    meetingUrl: event.meetingUrl ?? '',
    coverImageUrl: event.coverImageUrl ?? '',
    attachmentsText: buildAttachmentsText(event.attachments),
    guestEmailsText: buildGuestEmailText(event.guestEmails),
    reminderText: buildReminderText(event.reminderOffsets),
    relatedEntityType: event.relatedEntityType ?? '',
    relatedEntityId: event.relatedEntityId ? `${event.relatedEntityId}` : '',
    timezone: event.timezone ?? '',
    metadata: normaliseMetadata(event.metadata),
    collaboratorIds: Array.isArray(event.metadata?.collaboratorIds)
      ? event.metadata.collaboratorIds.map(String)
      : [],
  };
}

function normaliseCollaboratorSelection(collaboratorIds = []) {
  return Array.from(new Set(collaboratorIds.map((value) => `${value}`))).filter(Boolean);
}

export default function AgencyCalendarEventForm({
  initialEvent,
  collaborators = [],
  busy = false,
  onSubmit,
  onCancel,
}) {
  const [formState, setFormState] = useState(() => deriveInitialState(initialEvent));

  useEffect(() => {
    setFormState(deriveInitialState(initialEvent));
  }, [initialEvent?.id]);

  const collaboratorOptions = useMemo(() => {
    return collaborators.map((collaborator) => ({
      id: collaborator.id != null ? `${collaborator.id}` : undefined,
      name:
        collaborator.firstName || collaborator.lastName
          ? [collaborator.firstName, collaborator.lastName].filter(Boolean).join(' ')
          : collaborator.email,
      email: collaborator.email,
      role: collaborator.role,
    }));
  }, [collaborators]);

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCheckboxChange = (field) => (event) => {
    setFormState((prev) => ({
      ...prev,
      [field]: event.target.checked,
    }));
  };

  const handleCollaboratorToggle = (collaboratorId, checked) => {
    setFormState((prev) => {
      const current = normaliseCollaboratorSelection(prev.collaboratorIds ?? []);
      if (checked) {
        return { ...prev, collaboratorIds: normaliseCollaboratorSelection([...current, collaboratorId]) };
      }
      return { ...prev, collaboratorIds: current.filter((value) => value !== collaboratorId) };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!onSubmit) {
      return;
    }

    const payload = {
      title: formState.title,
      description: formState.description,
      notes: formState.notes,
      eventType: formState.eventType,
      status: formState.status,
      visibility: formState.visibility,
      startsAt: formState.startsAt ? new Date(formState.startsAt).toISOString() : null,
      endsAt: formState.endsAt ? new Date(formState.endsAt).toISOString() : null,
      isAllDay: Boolean(formState.isAllDay),
      location: formState.location,
      meetingUrl: formState.meetingUrl,
      coverImageUrl: formState.coverImageUrl,
      attachments: formState.attachmentsText,
      guestEmails: formState.guestEmailsText,
      reminderOffsets: formState.reminderText,
      relatedEntityType: formState.relatedEntityType,
      relatedEntityId: formState.relatedEntityId,
      timezone: formState.timezone,
      metadata: {
        ...formState.metadata,
        collaboratorIds: normaliseCollaboratorSelection(formState.collaboratorIds),
      },
    };

    if (formState.isAllDay && !payload.endsAt && payload.startsAt) {
      payload.endsAt = payload.startsAt;
    }

    onSubmit(payload);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="agency-event-title">
              Title
            </label>
            <input
              id="agency-event-title"
              type="text"
              required
              value={formState.title}
              onChange={handleChange('title')}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              placeholder="Add title"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="agency-event-type">
                Type
              </label>
              <select
                id="agency-event-type"
                value={formState.eventType}
                onChange={handleChange('eventType')}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              >
                {EVENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="agency-event-status">
                Status
              </label>
              <select
                id="agency-event-status"
                value={formState.status}
                onChange={handleChange('status')}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="agency-event-start">
                Starts
              </label>
              <input
                id="agency-event-start"
                type="datetime-local"
                required
                value={formState.startsAt}
                onChange={handleChange('startsAt')}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="agency-event-end">
                Ends
              </label>
              <input
                id="agency-event-end"
                type="datetime-local"
                value={formState.endsAt}
                onChange={handleChange('endsAt')}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                disabled={formState.isAllDay}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="agency-event-all-day"
              type="checkbox"
              checked={formState.isAllDay}
              onChange={handleCheckboxChange('isAllDay')}
              className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
            />
            <label htmlFor="agency-event-all-day" className="text-sm text-slate-600">
              All-day event
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="agency-event-visibility">
                Visibility
              </label>
              <select
                id="agency-event-visibility"
                value={formState.visibility}
                onChange={handleChange('visibility')}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              >
                {VISIBILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="agency-event-timezone">
                Timezone
              </label>
              <input
                id="agency-event-timezone"
                type="text"
                value={formState.timezone}
                onChange={handleChange('timezone')}
                placeholder="UTC"
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="agency-event-location">
                Location
              </label>
              <input
                id="agency-event-location"
                type="text"
                value={formState.location}
                onChange={handleChange('location')}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                placeholder="Location"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="agency-event-meeting">
                Meeting link
              </label>
              <input
                id="agency-event-meeting"
                type="url"
                value={formState.meetingUrl}
                onChange={handleChange('meetingUrl')}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                placeholder="https://"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="agency-event-cover">
              Cover image URL
            </label>
            <input
              id="agency-event-cover"
              type="url"
              value={formState.coverImageUrl}
              onChange={handleChange('coverImageUrl')}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              placeholder="https://"
            />
            {formState.coverImageUrl && (
              <img
                src={formState.coverImageUrl}
                alt="Event cover preview"
                className="mt-3 h-32 w-full rounded-2xl object-cover"
              />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="agency-event-description">
              Agenda
            </label>
            <textarea
              id="agency-event-description"
              value={formState.description}
              onChange={handleChange('description')}
              rows={5}
              placeholder="Details"
              className="mt-1 w-full rounded-3xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="agency-event-notes">
              Notes
            </label>
            <textarea
              id="agency-event-notes"
              value={formState.notes}
              onChange={handleChange('notes')}
              rows={4}
              placeholder="What should delivery, finance, or alliances know about this session?"
              className="mt-1 w-full rounded-3xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="agency-event-related-type">
                Related record
              </label>
              <select
                id="agency-event-related-type"
                value={formState.relatedEntityType}
                onChange={handleChange('relatedEntityType')}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              >
                {RELATED_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="agency-event-related-id">
                Record ID
              </label>
              <input
                id="agency-event-related-id"
                type="text"
                value={formState.relatedEntityId}
                onChange={handleChange('relatedEntityId')}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                placeholder="12345"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="agency-event-attachments">
              Files
            </label>
            <textarea
              id="agency-event-attachments"
              value={formState.attachmentsText}
              onChange={handleChange('attachmentsText')}
              rows={4}
              placeholder={`Label | https://link.com/file`}
              className="mt-1 w-full rounded-3xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="agency-event-guests">
              Guests
            </label>
            <textarea
              id="agency-event-guests"
              value={formState.guestEmailsText}
              onChange={handleChange('guestEmailsText')}
              rows={3}
              placeholder="team@gigvora.com"
              className="mt-1 w-full rounded-3xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="agency-event-reminders">
              Reminders (minutes)
            </label>
            <input
              id="agency-event-reminders"
              type="text"
              value={formState.reminderText}
              onChange={handleChange('reminderText')}
              placeholder="30, 120"
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Team</p>
            <div className="mt-3 grid gap-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-inner">
              {collaboratorOptions.length === 0 ? (
                <p className="text-xs text-slate-500">No teammates yet.</p>
              ) : (
                collaboratorOptions.map((option) => {
                  const checked = formState.collaboratorIds?.includes(option.id);
                  return (
                    <label key={option.id ?? option.email} className="flex items-center gap-3 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={Boolean(checked)}
                        onChange={(event) => handleCollaboratorToggle(option.id ?? option.email, event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                      />
                      <span>
                        <span className="font-semibold text-slate-800">{option.name}</span>
                        {option.email ? <span className="ml-2 text-xs text-slate-400">{option.email}</span> : null}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-accentDark focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Saving…' : initialEvent ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

