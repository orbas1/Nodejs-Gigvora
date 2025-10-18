import { useMemo, useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

function toDatetimeLocal(value) {
  if (!value) {
    return '';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const iso = date.toISOString();
  return iso.slice(0, 16);
}

function normalizeParticipants(participants = []) {
  if (!Array.isArray(participants) || !participants.length) {
    return [];
  }
  return participants
    .map((participant) => ({
      name: participant?.name ?? '',
      email: participant?.email ?? '',
      role: participant?.role ?? '',
    }))
    .slice(0, 10);
}

function normalizeAttachments(attachments = []) {
  if (!Array.isArray(attachments) || !attachments.length) {
    return [];
  }
  return attachments
    .map((attachment) => ({
      label: attachment?.label ?? attachment?.name ?? '',
      url: attachment?.url ?? '',
    }))
    .slice(0, 10);
}

const VISIBILITY_OPTIONS = [
  { value: 'internal', label: 'Internal recruiting team' },
  { value: 'hiring_team', label: 'Hiring team only' },
  { value: 'confidential', label: 'Confidential' },
  { value: 'public', label: 'Workspace visible' },
];

export default function CalendarEventForm({
  initialValues,
  eventTypeOptions,
  onSubmit,
  onCancel,
  busy = false,
}) {
  const defaults = useMemo(
    () => ({
      title: '',
      eventType: eventTypeOptions?.[0]?.value ?? 'project',
      startsAt: '',
      endsAt: '',
      location: '',
      relatedEntityName: '',
      relatedEntityType: '',
      relatedUrl: '',
      ownerName: '',
      ownerEmail: '',
      visibility: 'internal',
      notes: '',
      participants: [],
      attachments: [],
    }),
    [eventTypeOptions],
  );

  const [formState, setFormState] = useState(() => ({
    ...defaults,
    ...initialValues,
    startsAt: toDatetimeLocal(initialValues?.startsAt) || '',
    endsAt: toDatetimeLocal(initialValues?.endsAt) || '',
    participants: normalizeParticipants(initialValues?.metadata?.participants ?? initialValues?.participants),
    attachments: normalizeAttachments(initialValues?.metadata?.attachments ?? initialValues?.attachments),
    visibility: initialValues?.metadata?.visibility ?? initialValues?.visibility ?? defaults.visibility,
    relatedEntityName: initialValues?.metadata?.relatedEntityName ?? '',
    relatedEntityType: initialValues?.metadata?.relatedEntityType ?? '',
    relatedUrl: initialValues?.metadata?.relatedUrl ?? '',
    ownerName: initialValues?.metadata?.ownerName ?? '',
    ownerEmail: initialValues?.metadata?.ownerEmail ?? '',
    notes: initialValues?.metadata?.notes ?? '',
  }));

  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleParticipantChange = (index, field, value) => {
    setFormState((prev) => {
      const next = [...(prev.participants ?? [])];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, participants: next };
    });
  };

  const handleRemoveParticipant = (index) => {
    setFormState((prev) => {
      const next = [...(prev.participants ?? [])];
      next.splice(index, 1);
      return { ...prev, participants: next };
    });
  };

  const handleAddParticipant = () => {
    setFormState((prev) => ({
      ...prev,
      participants: [...(prev.participants ?? []), { name: '', email: '', role: '' }],
    }));
  };

  const handleAttachmentChange = (index, field, value) => {
    setFormState((prev) => {
      const next = [...(prev.attachments ?? [])];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, attachments: next };
    });
  };

  const handleRemoveAttachment = (index) => {
    setFormState((prev) => {
      const next = [...(prev.attachments ?? [])];
      next.splice(index, 1);
      return { ...prev, attachments: next };
    });
  };

  const handleAddAttachment = () => {
    setFormState((prev) => ({
      ...prev,
      attachments: [...(prev.attachments ?? []), { label: '', url: '' }],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    if (!formState.title.trim()) {
      setError('Please provide a descriptive title for this event.');
      return;
    }
    if (!formState.startsAt) {
      setError('Select a start date and time.');
      return;
    }

    const payload = {
      title: formState.title.trim(),
      eventType: formState.eventType,
      startsAt: new Date(formState.startsAt).toISOString(),
      endsAt: formState.endsAt ? new Date(formState.endsAt).toISOString() : undefined,
      location: formState.location?.trim() || undefined,
      metadata: {
        relatedEntityName: formState.relatedEntityName?.trim() || undefined,
        relatedEntityType: formState.relatedEntityType?.trim() || undefined,
        relatedUrl: formState.relatedUrl?.trim() || undefined,
        ownerName: formState.ownerName?.trim() || undefined,
        ownerEmail: formState.ownerEmail?.trim() || undefined,
        visibility: formState.visibility,
        notes: formState.notes?.trim() || undefined,
        participants: (formState.participants ?? [])
          .map((participant) => ({
            name: participant.name?.trim() || undefined,
            email: participant.email?.trim() || undefined,
            role: participant.role?.trim() || undefined,
          }))
          .filter((participant) => participant.name || participant.email || participant.role),
        attachments: (formState.attachments ?? [])
          .map((attachment) => ({
            label: attachment.label?.trim() || undefined,
            url: attachment.url?.trim() || undefined,
          }))
          .filter((attachment) => attachment.url || attachment.label),
      },
    };

    try {
      await onSubmit(payload);
    } catch (submitError) {
      setError(submitError?.message ?? 'We could not save this event. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Title
          <input
            type="text"
            name="title"
            required
            value={formState.title}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="e.g. Engineering panel interview"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Event type
          <select
            name="eventType"
            value={formState.eventType}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {eventTypeOptions?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Starts at
          <input
            type="datetime-local"
            name="startsAt"
            required
            value={formState.startsAt}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Ends at
          <input
            type="datetime-local"
            name="endsAt"
            value={formState.endsAt}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Location
          <input
            type="text"
            name="location"
            value={formState.location}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Video link, office, or timezone"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Visibility
          <select
            name="visibility"
            value={formState.visibility}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {VISIBILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Related program / project
          <input
            type="text"
            name="relatedEntityName"
            value={formState.relatedEntityName}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="e.g. Revenue ops analyst"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Entity type
          <input
            type="text"
            name="relatedEntityType"
            value={formState.relatedEntityType}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="project, job, gig, mentorship"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          External link
          <input
            type="url"
            name="relatedUrl"
            value={formState.relatedUrl}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="https://"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Owner name
          <input
            type="text"
            name="ownerName"
            value={formState.ownerName}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Recruiter or hiring manager"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Owner email
          <input
            type="email"
            name="ownerEmail"
            value={formState.ownerEmail}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="owner@example.com"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Notes
        <textarea
          name="notes"
          rows={4}
          value={formState.notes}
          onChange={handleChange}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          placeholder="Context, preparation, or logistics for teammates"
        />
      </label>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-700">Participants</h4>
          <button
            type="button"
            onClick={handleAddParticipant}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-700"
          >
            <PlusIcon className="h-4 w-4" /> Add participant
          </button>
        </div>
        <div className="space-y-3">
          {(formState.participants ?? []).map((participant, index) => (
            <div key={`participant-${index}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:grid-cols-3">
              <input
                type="text"
                value={participant.name}
                onChange={(event) => handleParticipantChange(index, 'name', event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                placeholder="Name"
              />
              <input
                type="email"
                value={participant.email}
                onChange={(event) => handleParticipantChange(index, 'email', event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                placeholder="Email"
              />
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={participant.role}
                  onChange={(event) => handleParticipantChange(index, 'role', event.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  placeholder="Role"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveParticipant(index)}
                  className="inline-flex items-center rounded-full border border-transparent p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {!formState.participants?.length ? (
            <p className="text-sm text-slate-500">Add interviewers, mentors, or partners to keep coordination simple.</p>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-700">Attachments</h4>
          <button
            type="button"
            onClick={handleAddAttachment}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-700"
          >
            <PlusIcon className="h-4 w-4" /> Add attachment
          </button>
        </div>
        <div className="space-y-3">
          {(formState.attachments ?? []).map((attachment, index) => (
            <div key={`attachment-${index}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:grid-cols-[1fr_1fr_auto]">
              <input
                type="text"
                value={attachment.label}
                onChange={(event) => handleAttachmentChange(index, 'label', event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                placeholder="Briefing document, deck, or prep"
              />
              <input
                type="url"
                value={attachment.url}
                onChange={(event) => handleAttachmentChange(index, 'url', event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                placeholder="https://"
              />
              <button
                type="button"
                onClick={() => handleRemoveAttachment(index)}
                className="inline-flex items-center justify-center rounded-full border border-transparent p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          {!formState.attachments?.length ? (
            <p className="text-sm text-slate-500">Attach scorecards, interview guides, or welcome packs to keep context in one place.</p>
          ) : null}
        </div>
      </section>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-2 text-sm text-rose-700">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {busy ? 'Saving...' : 'Save event'}
        </button>
      </div>
    </form>
  );
}
