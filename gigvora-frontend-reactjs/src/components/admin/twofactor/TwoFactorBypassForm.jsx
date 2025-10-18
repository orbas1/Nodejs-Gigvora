import { useState } from 'react';

const DEFAULT_VALUES = {
  userId: '',
  userEmail: '',
  reason: '',
  durationHours: 24,
  status: 'pending',
  notes: '',
};

const DURATION_OPTIONS = [
  { value: 6, label: '6 hours' },
  { value: 12, label: '12 hours' },
  { value: 24, label: '24 hours' },
  { value: 72, label: '72 hours' },
  { value: 168, label: '7 days' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Require approval' },
  { value: 'approved', label: 'Auto-approve now' },
];

export default function TwoFactorBypassForm({ onSubmit, submitting }) {
  const [draft, setDraft] = useState(DEFAULT_VALUES);

  const handleChange = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      userId: draft.userId ? Number.parseInt(draft.userId, 10) : undefined,
      userEmail: draft.userEmail ? draft.userEmail.trim() : undefined,
      reason: draft.reason?.trim() || undefined,
      expiresAt: new Date(Date.now() + Number(draft.durationHours ?? 24) * 60 * 60 * 1000).toISOString(),
      status: draft.status,
      notes: draft.notes?.trim() || undefined,
    };
    onSubmit?.(payload);
    setDraft(DEFAULT_VALUES);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Issue temporary bypass</h3>
        <p className="mt-1 text-sm text-slate-500">
          Grant short-term access when a second factor is unavailable. Bypasses expire automatically.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">User ID (optional)</span>
          <input
            type="number"
            value={draft.userId}
            onChange={handleChange('userId')}
            className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-400 focus:outline-none"
            placeholder="1234"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">User email</span>
          <input
            type="email"
            required={!draft.userId}
            value={draft.userEmail}
            onChange={handleChange('userEmail')}
            className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-400 focus:outline-none"
            placeholder="admin@example.com"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm text-slate-700">
        <span className="font-semibold text-slate-900">Reason</span>
        <textarea
          required
          value={draft.reason}
          onChange={handleChange('reason')}
          rows={2}
          className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-400 focus:outline-none"
          placeholder="Lost device, waiting for hardware replacement"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">Expires in</span>
          <select
            value={draft.durationHours}
            onChange={handleChange('durationHours')}
            className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-400 focus:outline-none"
          >
            {DURATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">Initial status</span>
          <select
            value={draft.status}
            onChange={handleChange('status')}
            className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-400 focus:outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm text-slate-700">
        <span className="font-semibold text-slate-900">Notes for audit trail (optional)</span>
        <textarea
          value={draft.notes}
          onChange={handleChange('notes')}
          rows={2}
          className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-400 focus:outline-none"
          placeholder="Device shipping ETA, service ticket, etc."
        />
      </label>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="submit"
          disabled={Boolean(submitting)}
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Issuing…' : 'Issue bypass'}
        </button>
      </div>
    </form>
  );
}
