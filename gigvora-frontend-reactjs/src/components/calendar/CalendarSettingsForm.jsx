import { useMemo, useState } from 'react';

const TIMEZONE_OPTIONS = [
  'UTC',
  'Europe/London',
  'Europe/Berlin',
  'Africa/Lagos',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function minutesToTime(value) {
  const total = Number.isFinite(value) ? Number(value) : 480;
  const clamped = Math.max(0, Math.min(1439, total));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function timeToMinutes(value) {
  if (!value) return null;
  const [hours, minutes] = value.split(':').map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }
  return Math.max(0, Math.min(23, hours)) * 60 + Math.max(0, Math.min(59, minutes));
}

export default function CalendarSettingsForm({ initialSettings, onSubmit, onCancel, busy = false }) {
  const [formState, setFormState] = useState(() => ({
    timezone: initialSettings?.timezone ?? 'UTC',
    weekStart: Number.isFinite(initialSettings?.weekStart) ? initialSettings.weekStart : 1,
    workStart: minutesToTime(initialSettings?.workStartMinutes),
    workEnd: minutesToTime(initialSettings?.workEndMinutes ?? 1020),
    defaultView: initialSettings?.defaultView ?? 'agenda',
    defaultReminderMinutes:
      initialSettings?.defaultReminderMinutes == null ? '30' : String(initialSettings.defaultReminderMinutes),
    autoFocusBlocks: Boolean(initialSettings?.autoFocusBlocks ?? false),
    shareAvailability: Boolean(initialSettings?.shareAvailability ?? false),
    colorHex: initialSettings?.colorHex ?? '',
  }));
  const [errors, setErrors] = useState({});

  const timezoneOptions = useMemo(() => {
    const next = new Set(TIMEZONE_OPTIONS);
    if (initialSettings?.timezone && !next.has(initialSettings.timezone)) {
      next.add(initialSettings.timezone);
    }
    return Array.from(next).sort();
  }, [initialSettings?.timezone]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setFormState((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const newErrors = {};
    if (!formState.timezone) {
      newErrors.timezone = 'Select a timezone.';
    }
    const workStartMinutes = timeToMinutes(formState.workStart);
    const workEndMinutes = timeToMinutes(formState.workEnd);
    if (workStartMinutes == null) {
      newErrors.workStart = 'Provide a valid start time.';
    }
    if (workEndMinutes == null) {
      newErrors.workEnd = 'Provide a valid end time.';
    }
    if (
      workStartMinutes != null &&
      workEndMinutes != null &&
      workEndMinutes <= workStartMinutes
    ) {
      newErrors.workEnd = 'End time must be after the start time.';
    }

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      timezone: formState.timezone,
      weekStart: Number(formState.weekStart),
      workStartMinutes,
      workEndMinutes,
      defaultView: formState.defaultView,
      defaultReminderMinutes: formState.defaultReminderMinutes ? Number(formState.defaultReminderMinutes) : null,
      autoFocusBlocks: Boolean(formState.autoFocusBlocks),
      shareAvailability: Boolean(formState.shareAvailability),
      colorHex: formState.colorHex?.trim() || null,
    };

    try {
      onSubmit(payload);
    } catch (error) {
      setErrors({ submit: error?.message ?? 'Unable to update calendar settings.' });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.submit ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{errors.submit}</p> : null}

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="calendar-timezone">
          Timezone
        </label>
        <select
          id="calendar-timezone"
          name="timezone"
          value={formState.timezone}
          onChange={handleChange}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          disabled={busy}
        >
          {timezoneOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors.timezone ? <p className="mt-1 text-xs text-rose-600">{errors.timezone}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="calendar-weekStart">
            Start of week
          </label>
          <select
            id="calendar-weekStart"
            name="weekStart"
            value={formState.weekStart}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            disabled={busy}
          >
            {WEEK_DAYS.map((day, index) => (
              <option key={day} value={index}>
                {day}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="calendar-view">
            Default view
          </label>
          <select
            id="calendar-view"
            name="defaultView"
            value={formState.defaultView}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            disabled={busy}
          >
            <option value="agenda">Agenda</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="calendar-workStart">
            Working hours start
          </label>
          <input
            id="calendar-workStart"
            name="workStart"
            type="time"
            value={formState.workStart}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            disabled={busy}
          />
          {errors.workStart ? <p className="mt-1 text-xs text-rose-600">{errors.workStart}</p> : null}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="calendar-workEnd">
            Working hours end
          </label>
          <input
            id="calendar-workEnd"
            name="workEnd"
            type="time"
            value={formState.workEnd}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            disabled={busy}
          />
          {errors.workEnd ? <p className="mt-1 text-xs text-rose-600">{errors.workEnd}</p> : null}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="calendar-reminder">
          Default reminder (minutes)
        </label>
        <input
          id="calendar-reminder"
          name="defaultReminderMinutes"
          type="number"
          min="0"
          max="10080"
          value={formState.defaultReminderMinutes}
          onChange={handleChange}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          disabled={busy}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="calendar-color">
          Brand colour accent
        </label>
        <input
          id="calendar-color"
          name="colorHex"
          type="text"
          value={formState.colorHex}
          onChange={handleChange}
          placeholder="#2563EB"
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          disabled={busy}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="autoFocusBlocks"
            checked={formState.autoFocusBlocks}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
            disabled={busy}
          />
          Auto-generate focus blocks for interview preparation
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="shareAvailability"
            checked={formState.shareAvailability}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
            disabled={busy}
          />
          Share availability with mentors and collaborators
        </label>
      </div>

      <div className="flex justify-end gap-2">
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
          Save settings
        </button>
      </div>
    </form>
  );
}
