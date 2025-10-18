import { useEffect, useMemo, useState } from 'react';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

const RELEASE_POLICIES = [
  { id: 'milestone', label: 'Milestone evidence' },
  { id: 'time_based', label: 'Time based' },
  { id: 'manual', label: 'Manual only' },
];

const SWITCH_FIELDS = [
  { name: 'autoReleaseEnabled', label: 'Auto release' },
  { name: 'notifyFinanceTeam', label: 'Finance alerts' },
];

export default function EscrowAutomationPanel({ automation, onUpdate, currentUserId }) {
  const [form, setForm] = useState({
    autoReleaseEnabled: true,
    manualReviewThreshold: 10000,
    notifyFinanceTeam: true,
    defaultReleaseOffsetHours: 24,
    releasePolicy: 'milestone',
    webhookUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!automation) {
      return;
    }
    setForm((previous) => ({
      ...previous,
      autoReleaseEnabled: automation.autoReleaseEnabled ?? previous.autoReleaseEnabled,
      manualReviewThreshold: automation.manualReviewThreshold ?? previous.manualReviewThreshold,
      notifyFinanceTeam: automation.notifyFinanceTeam ?? previous.notifyFinanceTeam,
      defaultReleaseOffsetHours: automation.defaultReleaseOffsetHours ?? previous.defaultReleaseOffsetHours,
      releasePolicy: automation.releasePolicy ?? previous.releasePolicy,
      webhookUrl: automation.webhookUrl ?? '',
    }));
  }, [automation]);

  const toggles = useMemo(
    () =>
      SWITCH_FIELDS.map((field) => ({
        ...field,
        value: form[field.name],
      })),
    [form],
  );

  const handleToggle = (name) => {
    setForm((previous) => ({ ...previous, [name]: !previous[name] }));
  };

  const handleChange = (event) => {
    const { name, type, value } = event.target;
    if (type === 'number') {
      setForm((previous) => ({ ...previous, [name]: value === '' ? '' : Number(value) }));
    } else {
      setForm((previous) => ({ ...previous, [name]: value }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setToast(null);
    setError(null);
    try {
      await onUpdate({
        ...form,
        actorId: currentUserId,
      });
      setToast('Automation updated');
    } catch (err) {
      setError(err?.body?.message ?? err?.message ?? 'Unable to update automation settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-blue-50 p-2 text-blue-600">
            <AdjustmentsHorizontalIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Automation</h2>
            <p className="text-xs text-slate-500">Live controls feed the release queue instantly.</p>
          </div>
        </div>
        {toast ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{toast}</span>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p> : null}

      <form onSubmit={handleSubmit} className="mt-5 space-y-5 text-sm">
        <div className="grid gap-3 md:grid-cols-2">
          {toggles.map((toggle) => (
            <button
              key={toggle.name}
              type="button"
              onClick={() => handleToggle(toggle.name)}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition ${
                toggle.value
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              <span className="font-semibold">{toggle.label}</span>
              <span
                className={`inline-flex h-6 w-10 items-center rounded-full transition ${
                  toggle.value ? 'bg-blue-600 justify-end pr-1' : 'bg-slate-300 justify-start pl-1'
                }`}
              >
                <span className="h-4 w-4 rounded-full bg-white" />
              </span>
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className="font-medium text-slate-700">Manual review limit</span>
            <input
              type="number"
              name="manualReviewThreshold"
              min="0"
              step="100"
              value={form.manualReviewThreshold}
              onChange={handleChange}
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-medium text-slate-700">Release offset (h)</span>
            <input
              type="number"
              name="defaultReleaseOffsetHours"
              min="0"
              max="240"
              value={form.defaultReleaseOffsetHours}
              onChange={handleChange}
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-medium text-slate-700">Policy</span>
            <select
              name="releasePolicy"
              value={form.releasePolicy}
              onChange={handleChange}
              className="rounded-xl border border-slate-300 px-3 py-2 capitalize focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {RELEASE_POLICIES.map((policy) => (
                <option key={policy.id} value={policy.id}>
                  {policy.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 md:col-span-2 xl:col-span-1">
            <span className="font-medium text-slate-700">Webhook</span>
            <input
              type="url"
              name="webhookUrl"
              value={form.webhookUrl}
              onChange={handleChange}
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:bg-blue-300"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
