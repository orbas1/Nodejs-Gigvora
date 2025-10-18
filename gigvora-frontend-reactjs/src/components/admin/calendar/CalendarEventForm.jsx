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

export default function CalendarEventForm({
  initialValue,
  accounts,
  templates,
  onSubmit,
  onCancel,
  submitting,
}) {
  const [form, setForm] = useState(DEFAULT_EVENT);

  useEffect(() => {
    if (initialValue) {
      setForm({
        title: initialValue.title ?? '',
        calendarAccountId: initialValue.calendarAccountId ?? initialValue.calendarAccount?.id ?? '',
        templateId: initialValue.templateId ?? '',
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
      });
    } else {
      setForm(DEFAULT_EVENT);
    }
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
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      title: form.title,
      calendarAccountId: form.calendarAccountId || undefined,
      templateId: form.templateId || undefined,
      eventType: form.eventType,
      status: form.status,
      visibility: form.visibility,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
      meetingUrl: form.meetingUrl || undefined,
      location: form.location || undefined,
      allowedRoles: form.allowedRoles,
      invitees: form.invitees,
      attachments: form.attachments,
      description: form.description || undefined,
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
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
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
          >
            <option value="">Select account</option>
            {accountOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Ends
          <input
            type="datetime-local"
            name="endsAt"
            value={form.endsAt}
            onChange={updateField}
            required
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
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
