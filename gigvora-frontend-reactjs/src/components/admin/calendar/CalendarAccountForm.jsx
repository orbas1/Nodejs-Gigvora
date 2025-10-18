import { useEffect, useState } from 'react';
import { PROVIDERS, SYNC_STATES } from './calendarOptions.js';

const DEFAULT_FORM = {
  provider: 'google',
  accountEmail: '',
  displayName: '',
  timezone: 'UTC',
  syncStatus: 'connected',
  syncError: '',
  lastSyncedAt: '',
};

function toDateTimeLocal(value) {
  if (!value) return '';
  try {
    const iso = new Date(value).toISOString();
    return iso.slice(0, 16);
  } catch (error) {
    return '';
  }
}

export default function CalendarAccountForm({ initialValue, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (initialValue) {
      setForm({
        provider: initialValue.provider ?? DEFAULT_FORM.provider,
        accountEmail: initialValue.accountEmail ?? DEFAULT_FORM.accountEmail,
        displayName: initialValue.displayName ?? '',
        timezone: initialValue.timezone ?? DEFAULT_FORM.timezone,
        syncStatus: initialValue.syncStatus ?? DEFAULT_FORM.syncStatus,
        syncError: initialValue.syncError ?? '',
        lastSyncedAt: toDateTimeLocal(initialValue.lastSyncedAt),
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [initialValue]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      provider: form.provider,
      accountEmail: form.accountEmail,
      displayName: form.displayName || undefined,
      timezone: form.timezone || undefined,
      syncStatus: form.syncStatus,
      syncError: form.syncError || undefined,
      lastSyncedAt: form.lastSyncedAt ? new Date(form.lastSyncedAt).toISOString() : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Provider
          <select
            name="provider"
            value={form.provider}
            onChange={updateField}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            required
          >
            {PROVIDERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Sync status
          <select
            name="syncStatus"
            value={form.syncStatus}
            onChange={updateField}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            required
          >
            {SYNC_STATES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Account email
        <input
          type="email"
          name="accountEmail"
          value={form.accountEmail}
          onChange={updateField}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          required
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Display name
        <input
          type="text"
          name="displayName"
          value={form.displayName}
          onChange={updateField}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Time zone
          <input
            type="text"
            name="timezone"
            value={form.timezone}
            onChange={updateField}
            placeholder="e.g. UTC"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Last sync
          <input
            type="datetime-local"
            name="lastSyncedAt"
            value={form.lastSyncedAt}
            onChange={updateField}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Sync note
        <textarea
          name="syncError"
          value={form.syncError}
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
          {submitting ? 'Saving…' : 'Save account'}
        </button>
      </div>
    </form>
  );
}
