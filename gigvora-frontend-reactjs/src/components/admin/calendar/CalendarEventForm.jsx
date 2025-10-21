import { useEffect, useMemo, useState } from 'react';
import { EVENT_TYPES, STATUSES, VISIBILITY } from './calendarOptions.js';

const DEFAULT_EVENT = {
  title: '',
  calendarAccountId: '',
  templateId: '',
  eventType: 'ops_review',
  status: 'scheduled',
  visibility: 'internal',
  startsAt: '',
  endsAt: '',
  meetingUrl: '',
  location: '',
  allowedRoles: '',
  invitees: '',
  attachments: '',
  description: '',
};

function toDateTimeLocal(value) {
  if (!value) return '';
  try {
    return new Date(value).toISOString().slice(0, 16);
  } catch (error) {
    return '';
  }
}

function toList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item, index, array) => item && array.indexOf(item) === index);
}

function deriveFormState(initialValue) {
  if (!initialValue) {
    return { ...DEFAULT_EVENT };
  }

  return {
    title: initialValue.title ?? '',
    calendarAccountId:
      initialValue.calendarAccountId !== undefined && initialValue.calendarAccountId !== null
        ? String(initialValue.calendarAccountId)
        : initialValue.calendarAccount?.id !== undefined && initialValue.calendarAccount?.id !== null
        ? String(initialValue.calendarAccount.id)
        : '',
    templateId:
      initialValue.templateId !== undefined && initialValue.templateId !== null
        ? String(initialValue.templateId)
        : '',
    eventType: initialValue.eventType ?? DEFAULT_EVENT.eventType,
    status: initialValue.status ?? DEFAULT_EVENT.status,
    visibility: initialValue.visibility ?? DEFAULT_EVENT.visibility,
    startsAt: toDateTimeLocal(initialValue.startsAt),
    endsAt: toDateTimeLocal(initialValue.endsAt),
    meetingUrl: initialValue.meetingUrl ?? '',
    location: initialValue.location ?? '',
    allowedRoles: Array.isArray(initialValue.allowedRoles)
      ? initialValue.allowedRoles.join(', ')
      : initialValue.allowedRoles ?? '',
    invitees: Array.isArray(initialValue.invitees)
      ? initialValue.invitees.join(', ')
      : initialValue.invitees ?? '',
    attachments: Array.isArray(initialValue.attachments)
      ? initialValue.attachments.join(', ')
      : initialValue.attachments ?? '',
    description: initialValue.description ?? '',
  };
}

function isSameFormState(previous, next) {
  const keys = Object.keys(next);
  for (const key of keys) {
    if (previous[key] !== next[key]) {
      return false;
    }
  }
  return true;
}

export default function CalendarEventForm({
  initialValue,
  accounts,
  templates,
  onSubmit,
  onCancel,
  submitting,
}) {
  const [form, setForm] = useState(() => deriveFormState(initialValue));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const nextForm = deriveFormState(initialValue);
    setForm((prev) => (isSameFormState(prev, nextForm) ? prev : nextForm));
    setErrors((prev) => (Object.keys(prev).length ? {} : prev));
  }, [initialValue]);

  const accountOptions = useMemo(() => {
    return accounts.map((account) => ({
      value: account.id,
      label: account.displayName || account.accountEmail,
    }));
  }, [accounts]);

  const templateOptions = useMemo(() => {
    return templates.map((template) => ({ value: template.id, label: template.name }));
  }, [templates]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) {
        return prev;
      }
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};

    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      nextErrors.title = 'Event title is required.';
    }

    const startDate = form.startsAt ? new Date(form.startsAt) : null;
    const endDate = form.endsAt ? new Date(form.endsAt) : null;
    if (!startDate || Number.isNaN(startDate.getTime())) {
      nextErrors.startsAt = 'Provide a valid start time.';
    }
    if (!endDate || Number.isNaN(endDate.getTime())) {
      nextErrors.endsAt = 'Provide a valid end time.';
    }
    if (!nextErrors.startsAt && !nextErrors.endsAt && startDate >= endDate) {
      nextErrors.endsAt = 'End time must be after the start time.';
    }

    if (!form.calendarAccountId) {
      nextErrors.calendarAccountId = 'Select a calendar account.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    const allowedRoles = toList(form.allowedRoles);
    const invitees = toList(form.invitees);
    const attachments = toList(form.attachments);

    onSubmit({
      title: trimmedTitle,
      calendarAccountId: form.calendarAccountId ? Number(form.calendarAccountId) : undefined,
      templateId: form.templateId ? Number(form.templateId) : undefined,
      eventType: form.eventType,
      status: form.status,
      visibility: form.visibility,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
      meetingUrl: form.meetingUrl.trim() || undefined,
      location: form.location.trim() || undefined,
      allowedRoles: allowedRoles.length ? allowedRoles : undefined,
      invitees: invitees.length ? invitees : undefined,
      attachments: attachments.length ? attachments : undefined,
      description: form.description.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Title
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={updateField}
          required
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'event-title-error' : undefined}
          className={`rounded-xl border px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 ${
            errors.title ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:border-slate-500'
          }`}
        />
        {errors.title ? (
          <span id="event-title-error" className="text-xs font-semibold text-rose-600">
            {errors.title}
          </span>
        ) : null}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Account
          <select
            name="calendarAccountId"
            value={form.calendarAccountId}
            onChange={updateField}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            required
            aria-invalid={Boolean(errors.calendarAccountId)}
            aria-describedby={errors.calendarAccountId ? 'event-account-error' : undefined}
          >
            <option value="">Select account</option>
            {accountOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.calendarAccountId ? (
            <span id="event-account-error" className="text-xs font-semibold text-rose-600">
              {errors.calendarAccountId}
            </span>
          ) : null}
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Template
          <select
            name="templateId"
            value={form.templateId}
            onChange={updateField}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="">No template</option>
            {templateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Type
          <select
            name="eventType"
            value={form.eventType}
            onChange={updateField}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Status
          <select
            name="status"
            value={form.status}
            onChange={updateField}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Visibility
          <select
            name="visibility"
            value={form.visibility}
            onChange={updateField}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            {VISIBILITY.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Starts
          <input
            type="datetime-local"
            name="startsAt"
            value={form.startsAt}
            onChange={updateField}
            required
            aria-invalid={Boolean(errors.startsAt)}
            aria-describedby={errors.startsAt ? 'event-start-error' : undefined}
            className={`rounded-xl border px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 ${
              errors.startsAt ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:border-slate-500'
            }`}
          />
          {errors.startsAt ? (
            <span id="event-start-error" className="text-xs font-semibold text-rose-600">
              {errors.startsAt}
            </span>
          ) : null}
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Ends
          <input
            type="datetime-local"
            name="endsAt"
            value={form.endsAt}
            onChange={updateField}
            required
            aria-invalid={Boolean(errors.endsAt)}
            aria-describedby={errors.endsAt ? 'event-end-error' : undefined}
            className={`rounded-xl border px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 ${
              errors.endsAt ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:border-slate-500'
            }`}
          />
          {errors.endsAt ? (
            <span id="event-end-error" className="text-xs font-semibold text-rose-600">
              {errors.endsAt}
            </span>
          ) : null}
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Meeting link
          <input
            type="url"
            name="meetingUrl"
            value={form.meetingUrl}
            onChange={updateField}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Location
          <input
            type="text"
            name="location"
            value={form.location}
            onChange={updateField}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Allowed roles
          <input
            type="text"
            name="allowedRoles"
            value={form.allowedRoles}
            onChange={updateField}
            placeholder="comma separated"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Invitees
          <input
            type="text"
            name="invitees"
            value={form.invitees}
            onChange={updateField}
            placeholder="comma separated"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Attachments
        <input
          type="text"
          name="attachments"
          value={form.attachments}
          onChange={updateField}
          placeholder="comma separated URLs"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Notes
        <textarea
          name="description"
          value={form.description}
          onChange={updateField}
          rows={3}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
      </label>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Save event'}
        </button>
      </div>
    </form>
  );
}
