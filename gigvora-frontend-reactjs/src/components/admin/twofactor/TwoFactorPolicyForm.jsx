import { useEffect, useMemo, useState } from 'react';

const METHOD_OPTIONS = [
  { value: 'email', label: 'Email codes' },
  { value: 'app', label: 'Authenticator app' },
  { value: 'sms', label: 'SMS fallback' },
  { value: 'security_key', label: 'Security key' },
  { value: 'backup_codes', label: 'Backup codes' },
];

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admins' },
  { value: 'staff', label: 'Internal staff' },
  { value: 'company', label: 'Company workspaces' },
  { value: 'freelancer', label: 'Freelancers' },
  { value: 'agency', label: 'Agencies' },
  { value: 'mentor', label: 'Mentors' },
  { value: 'headhunter', label: 'Headhunters' },
  { value: 'all', label: 'Entire platform' },
];

const ENFORCEMENT_LEVELS = [
  { value: 'optional', label: 'Optional' },
  { value: 'recommended', label: 'Recommended' },
  { value: 'required', label: 'Required' },
];

const DEFAULT_POLICY = {
  name: '',
  description: '',
  appliesToRole: 'admin',
  enforcementLevel: 'required',
  allowedMethods: ['email', 'app'],
  fallbackCodes: 5,
  sessionDurationMinutes: 1440,
  requireForSensitiveActions: true,
  enforced: true,
  ipAllowlist: [],
  notes: '',
};

function normaliseArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => `${item}`.trim()).filter(Boolean);
}

export default function TwoFactorPolicyForm({ initialValue, open, onClose, onSubmit, submitting }) {
  const [draft, setDraft] = useState(DEFAULT_POLICY);
  const [allowlistInput, setAllowlistInput] = useState('');

  useEffect(() => {
    const merged = { ...DEFAULT_POLICY, ...(initialValue ?? {}) };
    setDraft({
      ...merged,
      allowedMethods: normaliseArray(merged.allowedMethods).length
        ? normaliseArray(merged.allowedMethods)
        : DEFAULT_POLICY.allowedMethods,
      ipAllowlist: normaliseArray(merged.ipAllowlist),
    });
    setAllowlistInput(normaliseArray(merged.ipAllowlist).join('\n'));
  }, [initialValue, open]);

  const selectedMethods = useMemo(() => new Set(draft.allowedMethods ?? []), [draft.allowedMethods]);

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleMethodToggle = (method) => (event) => {
    const enabled = event.target.checked;
    setDraft((current) => {
      const next = new Set(current.allowedMethods ?? []);
      if (enabled) {
        next.add(method);
      } else {
        next.delete(method);
      }
      const resolved = Array.from(next);
      return { ...current, allowedMethods: resolved.length ? resolved : ['email'] };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      ...draft,
      allowedMethods: normaliseArray(draft.allowedMethods),
      ipAllowlist: normaliseArray(allowlistInput.split(/\n|,/) ?? []),
    };
    onSubmit?.(payload);
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-8">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-sm font-semibold text-slate-500 hover:text-slate-700"
        >
          Close
        </button>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{initialValue ? 'Edit policy' : 'New MFA policy'}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Configure how multi-factor authentication applies to each workspace segment. Changes apply immediately after
              saving.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Policy name</span>
              <input
                type="text"
                required
                value={draft.name}
                onChange={handleChange('name')}
                className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-400 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Applies to</span>
              <select
                value={draft.appliesToRole}
                onChange={handleChange('appliesToRole')}
                className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-400 focus:outline-none"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Description</span>
            <textarea
              value={draft.description ?? ''}
              onChange={handleChange('description')}
              rows={3}
              className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-400 focus:outline-none"
              placeholder="Where this policy is enforced and why."
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Enforcement level</span>
              <select
                value={draft.enforcementLevel}
                onChange={handleChange('enforcementLevel')}
                className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-400 focus:outline-none"
              >
                {ENFORCEMENT_LEVELS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Session timeout (minutes)</span>
              <input
                type="number"
                min={5}
                value={draft.sessionDurationMinutes}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    sessionDurationMinutes: Number.parseInt(event.target.value, 10) || 0,
                  }))
                }
                className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-400 focus:outline-none"
              />
            </label>
          </div>

          <fieldset className="rounded-3xl border border-slate-200 p-4">
            <legend className="text-sm font-semibold text-slate-900">Allowed authentication methods</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {METHOD_OPTIONS.map((method) => (
                <label key={method.value} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedMethods.has(method.value)}
                    onChange={handleMethodToggle(method.value)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{method.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Fallback codes</span>
              <input
                type="number"
                min={0}
                max={20}
                value={draft.fallbackCodes}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    fallbackCodes: Number.parseInt(event.target.value, 10) || 0,
                  }))
                }
                className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-400 focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(draft.requireForSensitiveActions)}
                onChange={handleChange('requireForSensitiveActions')}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Always challenge sensitive actions (payouts, role changes)</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(draft.enforced)}
                onChange={handleChange('enforced')}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Policy enforced</span>
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">IP allowlist (one per line)</span>
            <textarea
              value={allowlistInput}
              onChange={(event) => setAllowlistInput(event.target.value)}
              rows={3}
              className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-400 focus:outline-none"
              placeholder="198.51.100.0/24"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Notes for auditors</span>
            <textarea
              value={draft.notes ?? ''}
              onChange={handleChange('notes')}
              rows={3}
              className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-blue-400 focus:outline-none"
              placeholder="Document context or links to approvals."
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={Boolean(submitting)}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Save policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
