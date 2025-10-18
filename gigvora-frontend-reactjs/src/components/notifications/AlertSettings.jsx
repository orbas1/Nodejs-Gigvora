import { useEffect, useMemo, useState } from 'react';

const FREQUENCY_OPTIONS = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

const CHANNEL_FIELDS = [
  { key: 'emailEnabled', label: 'Email' },
  { key: 'pushEnabled', label: 'Push' },
  { key: 'smsEnabled', label: 'SMS' },
  { key: 'inAppEnabled', label: 'In-app' },
];

const DEFAULT_SETTINGS = {
  emailEnabled: true,
  pushEnabled: true,
  smsEnabled: false,
  inAppEnabled: true,
  digestFrequency: 'immediate',
  quietHoursStart: '',
  quietHoursEnd: '',
  metadata: { timezone: 'UTC' },
};

function normalisePreferences(preferences) {
  if (!preferences) {
    return { ...DEFAULT_SETTINGS };
  }
  const base = { ...DEFAULT_SETTINGS, ...preferences };
  return {
    ...base,
    metadata: {
      ...DEFAULT_SETTINGS.metadata,
      ...(preferences.metadata && typeof preferences.metadata === 'object' ? preferences.metadata : {}),
    },
  };
}

export default function AlertSettings({ preferences, onSubmit, busy = false, error = null, onResetError }) {
  const [form, setForm] = useState(() => normalisePreferences(preferences));
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setForm(normalisePreferences(preferences));
    setTouched(false);
  }, [preferences]);

  const digestLabel = useMemo(() => {
    const found = FREQUENCY_OPTIONS.find((option) => option.value === form.digestFrequency);
    return found ? found.label : 'Immediate';
  }, [form.digestFrequency]);

  const handleToggle = (key) => (event) => {
    if (!touched) {
      setTouched(true);
    }
    setForm((previous) => ({ ...previous, [key]: event.target.checked }));
    if (error && onResetError) {
      onResetError();
    }
  };

  const handleChange = (key, { nested = false } = {}) => (event) => {
    if (!touched) {
      setTouched(true);
    }
    const value = event.target.value;
    setForm((previous) => {
      if (nested) {
        return { ...previous, metadata: { ...previous.metadata, [key]: value } };
      }
      return { ...previous, [key]: value };
    });
    if (error && onResetError) {
      onResetError();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      emailEnabled: form.emailEnabled,
      pushEnabled: form.pushEnabled,
      smsEnabled: form.smsEnabled,
      inAppEnabled: form.inAppEnabled,
      digestFrequency: form.digestFrequency,
      quietHoursStart: form.quietHoursStart || null,
      quietHoursEnd: form.quietHoursEnd || null,
      metadata: { timezone: form.metadata?.timezone || 'UTC' },
    };
    const result = await onSubmit(payload);
    if (result !== false) {
      setTouched(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <fieldset className="grid gap-3 rounded-2xl border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-700">Channels</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {CHANNEL_FIELDS.map((field) => (
            <label key={field.key} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              <span>{field.label}</span>
              <input
                type="checkbox"
                checked={Boolean(form[field.key])}
                onChange={handleToggle(field.key)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-4 rounded-2xl border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-700">Digest</legend>
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          <span className="font-medium text-slate-700">Frequency</span>
          <select
            value={form.digestFrequency}
            onChange={handleChange('digestFrequency')}
            className="rounded-2xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {FREQUENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-slate-500">Current cadence: {digestLabel}</p>
      </fieldset>

      <fieldset className="grid gap-4 rounded-2xl border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-700">Quiet hours</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Start</span>
            <input
              type="time"
              value={form.quietHoursStart ?? ''}
              onChange={handleChange('quietHoursStart')}
              className="rounded-2xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-medium text-slate-700">End</span>
            <input
              type="time"
              value={form.quietHoursEnd ?? ''}
              onChange={handleChange('quietHoursEnd')}
              className="rounded-2xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </label>
        </div>
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          <span className="font-medium text-slate-700">Timezone</span>
          <input
            type="text"
            value={form.metadata?.timezone ?? 'UTC'}
            onChange={handleChange('timezone', { nested: true })}
            placeholder="UTC"
            className="rounded-2xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
      </fieldset>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error.message || 'Could not update settings.'}
        </div>
      ) : null}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setForm(normalisePreferences(preferences));
            setTouched(false);
            if (onResetError) {
              onResetError();
            }
          }}
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-800"
          disabled={busy}
        >
          Reset
        </button>
        <button
          type="submit"
          className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={busy || !touched}
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
