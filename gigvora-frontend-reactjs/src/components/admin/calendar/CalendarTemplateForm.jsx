import { useEffect, useState } from 'react';
import { EVENT_TYPES, VISIBILITY } from './calendarOptions.js';

const DEFAULT_TEMPLATE = {
  name: '',
  description: '',
  defaultEventType: 'ops_review',
  defaultVisibility: 'internal',
  durationMinutes: 60,
  defaultLocation: '',
  defaultMeetingUrl: '',
  defaultAllowedRoles: '',
  reminderMinutes: '',
  instructions: '',
  bannerImageUrl: '',
  isActive: true,
};

function normaliseRoles(value) {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return value ?? '';
}

function normaliseReminder(value) {
  if (Array.isArray(value)) {
    return value.join(',');
  }
  return value ?? '';
}

export default function CalendarTemplateForm({ initialValue, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(DEFAULT_TEMPLATE);

  useEffect(() => {
    if (initialValue) {
      setForm({
        name: initialValue.name ?? '',
        description: initialValue.description ?? '',
        defaultEventType: initialValue.defaultEventType ?? DEFAULT_TEMPLATE.defaultEventType,
        defaultVisibility: initialValue.defaultVisibility ?? DEFAULT_TEMPLATE.defaultVisibility,
        durationMinutes: initialValue.durationMinutes ?? DEFAULT_TEMPLATE.durationMinutes,
        defaultLocation: initialValue.defaultLocation ?? '',
        defaultMeetingUrl: initialValue.defaultMeetingUrl ?? '',
        defaultAllowedRoles: normaliseRoles(initialValue.defaultAllowedRoles),
        reminderMinutes: normaliseReminder(initialValue.reminderMinutes),
        instructions: initialValue.instructions ?? '',
        bannerImageUrl: initialValue.bannerImageUrl ?? '',
        isActive: initialValue.isActive !== false,
      });
    } else {
      setForm(DEFAULT_TEMPLATE);
    }
  }, [initialValue]);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      name: form.name,
      description: form.description || undefined,
      defaultEventType: form.defaultEventType,
      defaultVisibility: form.defaultVisibility,
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
      defaultLocation: form.defaultLocation || undefined,
      defaultMeetingUrl: form.defaultMeetingUrl || undefined,
      defaultAllowedRoles: form.defaultAllowedRoles,
      reminderMinutes: form.reminderMinutes,
      instructions: form.instructions || undefined,
      bannerImageUrl: form.bannerImageUrl || undefined,
      isActive: !!form.isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Name
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={updateField}
          required
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Description
        <textarea
          name="description"
          value={form.description}
          onChange={updateField}
          rows={3}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Event type
          <select
            name="defaultEventType"
            value={form.defaultEventType}
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
          Visibility
          <select
            name="defaultVisibility"
            value={form.defaultVisibility}
            onChange={updateField}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            {VISIBILITY.map((visibility) => (
              <option key={visibility} value={visibility}>
                {visibility}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Duration (minutes)
          <input
            type="number"
            name="durationMinutes"
            value={form.durationMinutes}
            onChange={updateField}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </label>
        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={updateField}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
          />
          Active
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Meeting link
          <input
            type="url"
            name="defaultMeetingUrl"
            value={form.defaultMeetingUrl}
            onChange={updateField}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Location
          <input
            type="text"
            name="defaultLocation"
            value={form.defaultLocation}
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
            name="defaultAllowedRoles"
            value={form.defaultAllowedRoles}
            onChange={updateField}
            placeholder="comma separated"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Reminders (minutes)
          <input
            type="text"
            name="reminderMinutes"
            value={form.reminderMinutes}
            onChange={updateField}
            placeholder="e.g. 60,15"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Banner image
        <input
          type="url"
          name="bannerImageUrl"
          value={form.bannerImageUrl}
          onChange={updateField}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Host notes
        <textarea
          name="instructions"
          value={form.instructions}
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
          {submitting ? 'Saving…' : 'Save type'}
        </button>
      </div>
    </form>
  );
}
