import { useEffect, useState } from 'react';
import { DAYS } from './calendarOptions.js';

const DEFAULT_WINDOW = {
  dayOfWeek: '1',
  startTime: '09:00',
  endTime: '17:00',
  timezone: '',
};

function minutesToTime(minutes) {
  if (!Number.isFinite(minutes)) return '09:00';
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mins = String(minutes % 60).padStart(2, '0');
  return `${hours}:${mins}`;
}

function timeToMinutes(value) {
  if (!value) return undefined;
  const [hours, minutes] = value.split(':').map((part) => Number.parseInt(part, 10));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return undefined;
  }
  return hours * 60 + minutes;
}

export default function CalendarAvailabilityForm({
  account,
  initialValue,
  onSubmit,
  onCancel,
  submitting,
}) {
  const [timezone, setTimezone] = useState(account?.timezone ?? 'UTC');
  const [windows, setWindows] = useState([DEFAULT_WINDOW]);

  useEffect(() => {
    if (initialValue) {
      setTimezone(initialValue.timezone || account?.timezone || 'UTC');
      if (Array.isArray(initialValue.windows) && initialValue.windows.length) {
        setWindows(
          initialValue.windows.map((window) => ({
            id: window.id,
            dayOfWeek: `${window.dayOfWeek ?? 0}`,
            startTime: window.startTime ?? minutesToTime(window.startTimeMinutes ?? 540),
            endTime: window.endTime ?? minutesToTime(window.endTimeMinutes ?? 1020),
            timezone: window.timezone ?? '',
          })),
        );
        return;
      }
    }
    setWindows([DEFAULT_WINDOW]);
  }, [initialValue, account]);

  const updateWindow = (index, field, value) => {
    setWindows((current) =>
      current.map((window, idx) => (idx === index ? { ...window, [field]: value } : window)),
    );
  };

  const addWindow = () => {
    setWindows((current) => [...current, { ...DEFAULT_WINDOW }]);
  };

  const removeWindow = (index) => {
    setWindows((current) => current.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      timezone: timezone || undefined,
      windows: windows.map((window) => ({
        id: window.id,
        dayOfWeek: Number.parseInt(window.dayOfWeek, 10),
        startTimeMinutes: timeToMinutes(window.startTime),
        endTimeMinutes: timeToMinutes(window.endTime),
        timezone: window.timezone || undefined,
      })),
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Editing {account?.displayName || account?.accountEmail}
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Time zone override
        <input
          type="text"
          value={timezone}
          onChange={(event) => setTimezone(event.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
      </label>

      <div className="space-y-4">
        {windows.map((window, index) => (
          <div key={window.id ?? index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-4">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Day
                <select
                  value={window.dayOfWeek}
                  onChange={(event) => updateWindow(index, 'dayOfWeek', event.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  {DAYS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Start
                <input
                  type="time"
                  value={window.startTime}
                  onChange={(event) => updateWindow(index, 'startTime', event.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                End
                <input
                  type="time"
                  value={window.endTime}
                  onChange={(event) => updateWindow(index, 'endTime', event.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Slot zone
                <input
                  type="text"
                  value={window.timezone}
                  onChange={(event) => updateWindow(index, 'timezone', event.target.value)}
                  placeholder="optional"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
              </label>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => removeWindow(index)}
                className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addWindow}
        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
      >
        Add window
      </button>

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
          {submitting ? 'Saving…' : 'Save slots'}
        </button>
      </div>
    </form>
  );
}
