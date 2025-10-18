import { useMemo, useState } from 'react';
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

const EVENT_TYPE_OPTIONS = [
  { value: 'job_interview', label: 'Job interview' },
  { value: 'interview', label: 'Interview' },
  { value: 'project', label: 'Project date' },
  { value: 'project_milestone', label: 'Project milestone' },
  { value: 'gig', label: 'Gig commitment' },
  { value: 'mentorship', label: 'Mentorship session' },
  { value: 'volunteering', label: 'Volunteering' },
  { value: 'event', label: 'Community event' },
  { value: 'networking', label: 'Networking' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'ritual', label: 'Ritual' },
  { value: 'wellbeing', label: 'Wellbeing' },
];

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'shared', label: 'Shared with collaborators' },
  { value: 'public', label: 'Public' },
];

const REMINDER_OPTIONS = [
  { value: 0, label: 'At start' },
  { value: 5, label: '5 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 1440, label: '1 day before' },
  { value: null, label: 'Custom / none' },
];

function toInputDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (num) => num.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function normalizeColor(value) {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

function parseNumber(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
}

export default function CalendarEventForm({ initialEvent, onSubmit, onCancel, busy = false }) {
  const [formState, setFormState] = useState(() => ({
    title: initialEvent?.title ?? '',
    eventType: initialEvent?.eventType ?? 'job_interview',
    startsAt: toInputDate(initialEvent?.startsAt) || '',
    endsAt: toInputDate(initialEvent?.endsAt) || '',
    location: initialEvent?.location ?? '',
    description: initialEvent?.description ?? '',
    videoConferenceLink: initialEvent?.videoConferenceLink ?? '',
    isAllDay: Boolean(initialEvent?.isAllDay ?? false),
    reminderMinutes:
      initialEvent?.reminderMinutes == null ? '' : String(initialEvent.reminderMinutes ?? ''),
    visibility: initialEvent?.visibility ?? 'private',
    relatedEntityType: initialEvent?.relatedEntityType ?? '',
    relatedEntityId: initialEvent?.relatedEntityId ? String(initialEvent.relatedEntityId) : '',
    colorHex: normalizeColor(initialEvent?.colorHex ?? ''),
    focusMode: initialEvent?.focusMode ?? '',
  }));
  const [errors, setErrors] = useState({});

  const selectedReminderOption = useMemo(() => {
    if (formState.reminderMinutes === '') {
      return null;
    }
    const numeric = Number(formState.reminderMinutes);
    return REMINDER_OPTIONS.find((option) => option.value === numeric) ?? null;
  }, [formState.reminderMinutes]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setFormState((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function handleReminderSelect(event) {
    const selected = event.target.value;
    if (selected === 'custom') {
      setFormState((previous) => ({ ...previous, reminderMinutes: '' }));
      return;
    }
    const numeric = Number(selected);
    setFormState((previous) => ({ ...previous, reminderMinutes: String(numeric) }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const newErrors = {};
    if (!formState.title.trim()) {
      newErrors.title = 'Please provide a title.';
    }
    if (!formState.startsAt) {
      newErrors.startsAt = 'Please select a start date.';
    }
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      title: formState.title.trim(),
      eventType: formState.eventType,
      startsAt: new Date(formState.startsAt).toISOString(),
      endsAt: formState.endsAt ? new Date(formState.endsAt).toISOString() : null,
      location: formState.location.trim() || null,
      description: formState.description.trim() || null,
      videoConferenceLink: formState.videoConferenceLink.trim() || null,
      isAllDay: Boolean(formState.isAllDay),
      reminderMinutes:
        formState.reminderMinutes === '' ? null : parseNumber(formState.reminderMinutes),
      visibility: formState.visibility,
      relatedEntityType: formState.relatedEntityType.trim() || null,
      relatedEntityId: formState.relatedEntityId ? parseNumber(formState.relatedEntityId) : null,
      colorHex: normalizeColor(formState.colorHex) || null,
      focusMode: formState.focusMode.trim() || null,
    };

    try {
      await onSubmit(payload);
    } catch (error) {
      setErrors({ submit: error?.message ?? 'Unable to save the calendar event.' });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.submit ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{errors.submit}</p> : null}

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="event-title">
          Title
        </label>
        <input
          id="event-title"
          name="title"
          type="text"
          value={formState.title}
          onChange={handleChange}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          placeholder="Interview with hiring team"
          disabled={busy}
        />
        {errors.title ? <p className="mt-1 text-xs text-rose-600">{errors.title}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="event-type">
            Category
          </label>
          <select
            id="event-type"
            name="eventType"
            value={formState.eventType}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            disabled={busy}
          >
            {EVENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="event-visibility">
            Visibility
          </label>
          <select
            id="event-visibility"
            name="visibility"
            value={formState.visibility}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            disabled={busy}
          >
            {VISIBILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="event-startsAt">
            Start
          </label>
          <div className="mt-1 flex items-center rounded-xl border border-slate-200 px-3 py-2 focus-within:border-accent">
            <CalendarIcon className="h-5 w-5 text-slate-400" />
            <input
              id="event-startsAt"
              name="startsAt"
              type="datetime-local"
              value={formState.startsAt}
              onChange={handleChange}
              className="ml-2 w-full border-0 bg-transparent text-sm focus:outline-none"
              disabled={busy}
              required
            />
          </div>
          {errors.startsAt ? <p className="mt-1 text-xs text-rose-600">{errors.startsAt}</p> : null}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="event-endsAt">
            End
          </label>
          <div className="mt-1 flex items-center rounded-xl border border-slate-200 px-3 py-2 focus-within:border-accent">
            <ClockIcon className="h-5 w-5 text-slate-400" />
            <input
              id="event-endsAt"
              name="endsAt"
              type="datetime-local"
              value={formState.endsAt}
              onChange={handleChange}
              className="ml-2 w-full border-0 bg-transparent text-sm focus:outline-none"
              disabled={busy}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="event-reminder">
            Reminder
          </label>
          <select
            id="event-reminder"
            name="reminderPreset"
            value={selectedReminderOption ? String(selectedReminderOption.value) : 'custom'}
            onChange={handleReminderSelect}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            disabled={busy}
          >
            {REMINDER_OPTIONS.map((option) => (
              <option key={option.label} value={option.value == null ? 'custom' : String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
          {selectedReminderOption == null ? (
            <input
              type="number"
              name="reminderMinutes"
              value={formState.reminderMinutes}
              onChange={handleChange}
              placeholder="Minutes before event"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              min="0"
              disabled={busy}
            />
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="event-color">
            Colour accent
          </label>
          <input
            id="event-color"
            name="colorHex"
            type="text"
            value={formState.colorHex}
            onChange={handleChange}
            placeholder="#2563EB"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            disabled={busy}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="event-relatedType">
            Linked record type
          </label>
          <input
            id="event-relatedType"
            name="relatedEntityType"
            type="text"
            value={formState.relatedEntityType}
            onChange={handleChange}
            placeholder="project, job, gig..."
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            disabled={busy}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="event-relatedId">
            Linked record ID
          </label>
          <input
            id="event-relatedId"
            name="relatedEntityId"
            type="number"
            value={formState.relatedEntityId}
            onChange={handleChange}
            min="1"
            placeholder="1234"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            disabled={busy}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="event-location">
          Location or call link
        </label>
        <input
          id="event-location"
          name="location"
          type="text"
          value={formState.location}
          onChange={handleChange}
          placeholder="123 Main Street or Google Meet link"
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          disabled={busy}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="event-description">
          Notes
        </label>
        <textarea
          id="event-description"
          name="description"
          value={formState.description}
          onChange={handleChange}
          rows={4}
          placeholder="Agenda, preparation, or collaborators"
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          disabled={busy}
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="isAllDay"
            checked={formState.isAllDay}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
            disabled={busy}
          />
          Mark as all-day event
        </label>
        <div className="flex gap-2">
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
            {initialEvent ? 'Update event' : 'Create event'}
          </button>
        </div>
      </div>
    </form>
  );
}
