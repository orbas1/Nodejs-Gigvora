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

function parseRoles(value) {
  return value
    .split(',')
    .map((role) => role.trim())
    .filter((role, index, array) => role && array.indexOf(role) === index);
}

function parseReminders(value) {
  if (!value.trim()) {
    return [];
  }
  return value
    .split(',')
    .map((entry) => Number.parseInt(entry.trim(), 10))
    .filter((minutes, index, array) => Number.isFinite(minutes) && minutes > 0 && array.indexOf(minutes) === index)
    .sort((a, b) => a - b);
}

function deriveTemplateState(initialValue) {
  if (!initialValue) {
    return { ...DEFAULT_TEMPLATE };
  }

  return {
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
  };
}

function isSameTemplateState(previous, next) {
  const keys = Object.keys(next);
  for (const key of keys) {
    if (previous[key] !== next[key]) {
      return false;
    }
  }
  return true;
}

export default function CalendarTemplateForm({ initialValue, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(() => deriveTemplateState(initialValue));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const nextForm = deriveTemplateState(initialValue);
    setForm((prev) => (isSameTemplateState(prev, nextForm) ? prev : nextForm));
    setErrors((prev) => (Object.keys(prev).length ? {} : prev));
  }, [initialValue]);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      nextErrors.name = 'Template name is required.';
    }

    const duration = Number(form.durationMinutes);
    if (!Number.isFinite(duration) || duration <= 0) {
      nextErrors.durationMinutes = 'Duration must be a positive number of minutes.';
    }

    const reminders = parseReminders(String(form.reminderMinutes ?? ''));
    if (form.reminderMinutes.trim() && reminders.length === 0) {
      nextErrors.reminderMinutes = 'Enter reminders as comma separated positive numbers.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    const allowedRoles = parseRoles(form.defaultAllowedRoles);

    onSubmit({
      name: trimmedName,
      description: form.description.trim() || undefined,
      defaultEventType: form.defaultEventType,
      defaultVisibility: form.defaultVisibility,
      durationMinutes: Math.round(duration),
      defaultLocation: form.defaultLocation.trim() || undefined,
      defaultMeetingUrl: form.defaultMeetingUrl.trim() || undefined,
      defaultAllowedRoles: allowedRoles.length ? allowedRoles : undefined,
      reminderMinutes: reminders.length ? reminders : undefined,
      instructions: form.instructions.trim() || undefined,
      bannerImageUrl: form.bannerImageUrl.trim() || undefined,
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
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'template-name-error' : undefined}
          className={`rounded-xl border px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 ${
            errors.name ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:border-slate-500'
          }`}
        />
        {errors.name ? (
          <span id="template-name-error" className="text-xs font-semibold text-rose-600">
            {errors.name}
          </span>
        ) : null}
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
            aria-invalid={Boolean(errors.durationMinutes)}
            aria-describedby={errors.durationMinutes ? 'template-duration-error' : undefined}
            className={`rounded-xl border px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 ${
              errors.durationMinutes
                ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-200'
                : 'border-slate-300 focus:border-slate-500'
            }`}
          />
          {errors.durationMinutes ? (
            <span id="template-duration-error" className="text-xs font-semibold text-rose-600">
              {errors.durationMinutes}
            </span>
          ) : null}
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
            aria-invalid={Boolean(errors.reminderMinutes)}
            aria-describedby={errors.reminderMinutes ? 'template-reminder-error' : undefined}
            className={`rounded-xl border px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 ${
              errors.reminderMinutes
                ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-200'
                : 'border-slate-300 focus:border-slate-500'
            }`}
          />
          {errors.reminderMinutes ? (
            <span id="template-reminder-error" className="text-xs font-semibold text-rose-600">
              {errors.reminderMinutes}
            </span>
          ) : null}
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
