import { useEffect, useMemo, useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const DAY_OPTIONS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const RISK_OPTIONS = ['Conservative', 'Balanced', 'Assertive'];

const DEFAULT_FORM = {
  policyName: '',
  defaultCurrency: 'USD',
  reserveTarget: '',
  minimumBalanceThreshold: '',
  autopayoutEnabled: false,
  autopayoutWindowDays: '',
  autopayoutDayOfWeek: '',
  autopayoutTimeOfDay: '',
  invoiceGracePeriodDays: '',
  riskAppetite: '',
  operationalContacts: '',
  notes: '',
};

export default function TreasuryPolicyForm({ policy, onSave }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!policy) {
      setForm(DEFAULT_FORM);
      return;
    }
    setForm({
      policyName: policy.policyName ?? DEFAULT_FORM.policyName,
      defaultCurrency: policy.defaultCurrency ?? DEFAULT_FORM.defaultCurrency,
      reserveTarget: policy.reserveTarget ?? '',
      minimumBalanceThreshold: policy.minimumBalanceThreshold ?? '',
      autopayoutEnabled: Boolean(policy.autopayoutEnabled),
      autopayoutWindowDays: policy.autopayoutWindowDays ?? '',
      autopayoutDayOfWeek: policy.autopayoutDayOfWeek ?? '',
      autopayoutTimeOfDay: policy.autopayoutTimeOfDay ?? '',
      invoiceGracePeriodDays: policy.invoiceGracePeriodDays ?? '',
      riskAppetite: policy.riskAppetite ?? '',
      operationalContacts: policy.operationalContacts ?? '',
      notes: policy.notes ?? '',
    });
  }, [policy]);

  useEffect(() => {
    if (!success) {
      return undefined;
    }
    const timeout = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(timeout);
  }, [success]);

  const autopayoutWindowDisabled = useMemo(() => !form.autopayoutEnabled, [form.autopayoutEnabled]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        policyName: form.policyName.trim(),
        defaultCurrency: form.defaultCurrency.trim().toUpperCase(),
        reserveTarget: form.reserveTarget === '' ? undefined : Number(form.reserveTarget),
        minimumBalanceThreshold:
          form.minimumBalanceThreshold === '' ? undefined : Number(form.minimumBalanceThreshold),
        autopayoutEnabled: Boolean(form.autopayoutEnabled),
        autopayoutWindowDays: form.autopayoutWindowDays === '' ? undefined : Number(form.autopayoutWindowDays),
        autopayoutDayOfWeek: form.autopayoutDayOfWeek || undefined,
        autopayoutTimeOfDay: form.autopayoutTimeOfDay || undefined,
        invoiceGracePeriodDays: form.invoiceGracePeriodDays === '' ? undefined : Number(form.invoiceGracePeriodDays),
        riskAppetite: form.riskAppetite || undefined,
        operationalContacts: form.operationalContacts || undefined,
        notes: form.notes || undefined,
      };
      await onSave(payload);
      setSuccess('Treasury policy saved.');
    } catch (err) {
      setError(err?.message ?? 'Unable to save treasury policy.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="finance-policy" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Treasury policy & reserves</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Define the operational guardrails for treasury operations—reserve targets, payout cadence, and risk posture.
          </p>
        </div>
        {success ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            <CheckCircleIcon className="h-4 w-4" aria-hidden="true" /> Saved
          </span>
        ) : null}
      </div>

      <form className="mt-6 grid gap-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col">
            <span className="text-sm font-semibold text-slate-700">Policy name</span>
            <input
              type="text"
              name="policyName"
              value={form.policyName}
              onChange={handleChange}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-semibold text-slate-700">Default currency</span>
            <input
              type="text"
              name="defaultCurrency"
              value={form.defaultCurrency}
              onChange={handleChange}
              className="mt-1 uppercase tracking-wide text-sm text-slate-900 rounded-xl border border-slate-200 px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              maxLength={3}
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-semibold text-slate-700">Reserve target</span>
            <input
              type="number"
              name="reserveTarget"
              value={form.reserveTarget}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-semibold text-slate-700">Minimum operating balance</span>
            <input
              type="number"
              name="minimumBalanceThreshold"
              value={form.minimumBalanceThreshold}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
        </div>

        <fieldset className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <legend className="px-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Autopayout configuration</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                name="autopayoutEnabled"
                checked={form.autopayoutEnabled}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Enable automated releases
            </label>
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Window (days)</span>
              <input
                type="number"
                name="autopayoutWindowDays"
                value={form.autopayoutWindowDays}
                onChange={handleChange}
                min="1"
                max="90"
                disabled={autopayoutWindowDisabled}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm disabled:bg-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Run day</span>
              <select
                name="autopayoutDayOfWeek"
                value={form.autopayoutDayOfWeek}
                onChange={handleChange}
                disabled={autopayoutWindowDisabled}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm disabled:bg-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Select day</option>
                {DAY_OPTIONS.map((day) => (
                  <option key={day} value={day.toLowerCase()}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Run time (UTC)</span>
              <input
                type="time"
                name="autopayoutTimeOfDay"
                value={form.autopayoutTimeOfDay}
                onChange={handleChange}
                disabled={autopayoutWindowDisabled}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm disabled:bg-slate-100 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col">
            <span className="text-sm font-semibold text-slate-700">Invoice grace period (days)</span>
            <input
              type="number"
              name="invoiceGracePeriodDays"
              value={form.invoiceGracePeriodDays}
              onChange={handleChange}
              min="0"
              max="120"
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-semibold text-slate-700">Risk appetite</span>
            <select
              name="riskAppetite"
              value={form.riskAppetite}
              onChange={handleChange}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Select profile</option>
              {RISK_OPTIONS.map((option) => (
                <option key={option} value={option.toLowerCase()}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col">
          <span className="text-sm font-semibold text-slate-700">Operational contacts</span>
          <input
            type="text"
            name="operationalContacts"
            value={form.operationalContacts}
            onChange={handleChange}
            placeholder="finance@gigvora.com, treasury@gigvora.com"
            className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-semibold text-slate-700">Policy notes</span>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={4}
            className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Escrow partner escalation paths, banking cut-off times, or exception workflows."
          />
        </label>

        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {saving ? 'Saving…' : 'Save treasury policy'}
          </button>
          <p className="text-xs text-slate-500">All changes are versioned and auditable.</p>
        </div>
      </form>
    </section>
  );
}
