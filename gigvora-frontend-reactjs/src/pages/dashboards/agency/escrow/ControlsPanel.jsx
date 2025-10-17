import { useState } from 'react';
import DataStatus from '../../../../components/DataStatus.jsx';
import { useEscrow } from './EscrowContext.jsx';
import { formatCurrency } from './formatters.js';

export default function ControlsPanel() {
  const { state, dispatch, saveSettings, triggerToast } = useEscrow();
  const { overview, settingsDraft } = state;
  const [saving, setSaving] = useState(false);

  const draft = settingsDraft || overview.data?.settings || {};

  const handleChange = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    dispatch({ type: 'SETTINGS_DRAFT', payload: { [key]: value } });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveSettings({
        autoReleaseEnabled: draft.autoReleaseEnabled,
        autoReleaseAfterDays: draft.autoReleaseAfterDays,
        requireDualApproval: draft.requireDualApproval,
        notifyHoursBeforeRelease: draft.notifyHoursBeforeRelease,
        holdLargePaymentsThreshold: draft.holdLargePaymentsThreshold,
      });
    } catch (error) {
      triggerToast(error.message || 'Unable to save rules', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Rules</h1>
        <p className="mt-1 text-sm text-slate-500">Automate releases and alerts.</p>
      </header>

      <DataStatus loading={overview.loading} error={overview.error}>
        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-2">
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Auto release</p>
                <p className="text-xs text-slate-500">Release after the configured window.</p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(draft.autoReleaseEnabled)}
                onChange={handleChange('autoReleaseEnabled')}
                className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
            </label>
            <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-semibold text-slate-900">Release after (days)</p>
              <input
                type="number"
                min="1"
                value={draft.autoReleaseAfterDays ?? 7}
                onChange={handleChange('autoReleaseAfterDays')}
                className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
              />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Dual approval</p>
                <p className="text-xs text-slate-500">Require second reviewer before payout.</p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(draft.requireDualApproval)}
                onChange={handleChange('requireDualApproval')}
                className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
            </label>
            <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-semibold text-slate-900">Notify before release (hours)</p>
              <input
                type="number"
                min="0"
                value={draft.notifyHoursBeforeRelease ?? 24}
                onChange={handleChange('notifyHoursBeforeRelease')}
                className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
              />
            </label>
          </div>
          <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-sm font-semibold text-slate-900">Large payment hold</p>
            <input
              type="number"
              min="0"
              value={draft.holdLargePaymentsThreshold ?? 25000}
              onChange={handleChange('holdLargePaymentsThreshold')}
              className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
            />
            <p className="mt-2 text-xs text-slate-500">
              Alerts fire when a move is above {formatCurrency(draft.holdLargePaymentsThreshold || 0)}.
            </p>
          </label>
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save rules'}
            </button>
          </div>
        </form>
      </DataStatus>
    </div>
  );
}
