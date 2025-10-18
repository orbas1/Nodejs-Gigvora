import { useEffect, useState } from 'react';

const CADENCE_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const RISK_TIERS = [
  { value: '', label: 'Select risk tier' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export default function WalletSettingsForm({ workspaceId, resource, onSave }) {
  const { data: settings, loading, error, refresh } = resource;
  const [formState, setFormState] = useState({
    workspaceId: workspaceId ?? '',
    lowBalanceAlertThreshold: '',
    autoSweepEnabled: false,
    autoSweepThreshold: '',
    reconciliationCadence: '',
    dualControlEnabled: false,
    complianceContactEmail: '',
    payoutWindow: '',
    riskTier: '',
    complianceNotes: '',
    metadata: '',
  });
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormState({
        workspaceId: settings.workspaceId ?? workspaceId ?? '',
        lowBalanceAlertThreshold: settings.lowBalanceAlertThreshold ?? '',
        autoSweepEnabled: Boolean(settings.autoSweepEnabled),
        autoSweepThreshold: settings.autoSweepThreshold ?? '',
        reconciliationCadence: settings.reconciliationCadence ?? '',
        dualControlEnabled: Boolean(settings.dualControlEnabled),
        complianceContactEmail: settings.complianceContactEmail ?? '',
        payoutWindow: settings.payoutWindow ?? '',
        riskTier: settings.riskTier ?? '',
        complianceNotes: settings.complianceNotes ?? '',
        metadata: settings.metadata ? JSON.stringify(settings.metadata, null, 2) : '',
      });
    }
  }, [settings, workspaceId]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormState((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    setSaving(true);
    try {
      const metadataPayload = formState.metadata ? JSON.parse(formState.metadata) : null;
      await onSave({
        ...formState,
        workspaceId: formState.workspaceId,
        metadata: metadataPayload,
      });
      setFeedback({ type: 'success', message: 'Settings saved.' });
      await refresh?.({ force: true });
    } catch (err) {
      console.error('Failed to update wallet settings', err);
      const message = err?.message || 'Unable to save wallet settings. Check the form and try again.';
      setFeedback({ type: 'error', message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="wallet-controls" className="space-y-6" aria-labelledby="wallet-controls-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="wallet-controls-title" className="text-2xl font-semibold text-slate-900">
            Settings
          </h2>
        </div>
        <button
          type="button"
          onClick={() => refresh?.({ force: true })}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
        >
          Refresh
        </button>
      </div>

      {loading && !settings ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">Loading settings…</div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-700">Settings unavailable.</div>
      ) : null}

      {feedback ? (
        <div
          className={`rounded-3xl border p-4 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50/70 text-emerald-700'
              : 'border-rose-200 bg-rose-50/70 text-rose-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="workspaceId" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Workspace ID
          </label>
          <input
            id="workspaceId"
            name="workspaceId"
            value={formState.workspaceId}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="lowBalanceAlertThreshold"
            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Low balance alert (USD)
          </label>
          <input
            id="lowBalanceAlertThreshold"
            name="lowBalanceAlertThreshold"
            type="number"
            step="0.01"
            value={formState.lowBalanceAlertThreshold}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="5000"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="autoSweepEnabled" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Auto-sweep
          </label>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input
              id="autoSweepEnabled"
              name="autoSweepEnabled"
              type="checkbox"
              checked={Boolean(formState.autoSweepEnabled)}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
            />
            <label htmlFor="autoSweepEnabled" className="text-sm text-slate-700">
              Enable automated sweeps to the primary funding source
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="autoSweepThreshold" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Sweep threshold (USD)
          </label>
          <input
            id="autoSweepThreshold"
            name="autoSweepThreshold"
            type="number"
            step="0.01"
            value={formState.autoSweepThreshold}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="25000"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="reconciliationCadence"
            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Reconciliation cadence
          </label>
          <select
            id="reconciliationCadence"
            name="reconciliationCadence"
            value={formState.reconciliationCadence}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Select cadence</option>
            {CADENCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="dualControlEnabled" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Dual control approvals
          </label>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input
              id="dualControlEnabled"
              name="dualControlEnabled"
              type="checkbox"
              checked={Boolean(formState.dualControlEnabled)}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
            />
            <label htmlFor="dualControlEnabled" className="text-sm text-slate-700">
              Require two approvers for payouts above the threshold
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="complianceContactEmail"
            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Compliance email
          </label>
          <input
            id="complianceContactEmail"
            name="complianceContactEmail"
            type="email"
            value={formState.complianceContactEmail}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="finance@gigvora.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="payoutWindow" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Payout window
          </label>
          <input
            id="payoutWindow"
            name="payoutWindow"
            value={formState.payoutWindow}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="e.g. Mondays & Thursdays"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="riskTier" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Risk tier
          </label>
          <select
            id="riskTier"
            name="riskTier"
            value={formState.riskTier}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {RISK_TIERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="complianceNotes" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Compliance notes
          </label>
          <textarea
            id="complianceNotes"
            name="complianceNotes"
            rows={3}
            value={formState.complianceNotes}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Document approved treasury policies or vendor restrictions"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="metadata" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Metadata (JSON)
          </label>
          <textarea
            id="metadata"
            name="metadata"
            rows={3}
            value={formState.metadata}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder='{"alert":"slack://treasury"}'
          />
        </div>

        <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save operational controls'}
          </button>
        </div>
      </form>
    </section>
  );
}
