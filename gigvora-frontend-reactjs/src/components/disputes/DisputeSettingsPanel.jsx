import { useEffect, useState } from 'react';

function normaliseList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export default function DisputeSettingsPanel({ settings, loading, onSave }) {
  const [formState, setFormState] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormState({
        workspaceId: settings.workspaceId ?? '',
        responseSlaHours: settings.responseSlaHours ?? 24,
        resolutionSlaHours: settings.resolutionSlaHours ?? 120,
        autoEscalateHours: settings.autoEscalateHours ?? '',
        autoCloseHours: settings.autoCloseHours ?? '',
        defaultAssigneeId: settings.defaultAssigneeId ?? '',
        notificationEmails: (settings.notificationEmails ?? []).join('\n'),
        evidenceRequirements: (settings.evidenceRequirements ?? []).join('\n'),
      });
    }
  }, [settings]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave?.({
        workspaceId: formState.workspaceId || settings?.workspaceId,
        responseSlaHours: Number(formState.responseSlaHours) || 0,
        resolutionSlaHours: Number(formState.resolutionSlaHours) || 0,
        autoEscalateHours: formState.autoEscalateHours ? Number(formState.autoEscalateHours) : null,
        autoCloseHours: formState.autoCloseHours ? Number(formState.autoCloseHours) : null,
        defaultAssigneeId: formState.defaultAssigneeId || null,
        notificationEmails: normaliseList(formState.notificationEmails),
        evidenceRequirements: normaliseList(formState.evidenceRequirements),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Rules</h2>
        <span className="text-xs uppercase tracking-wide text-slate-400">Workflow</span>
      </div>
      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading…</p>
      ) : (
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="space-y-1 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Response hours</span>
              <input
                type="number"
                name="responseSlaHours"
                min={1}
                value={formState.responseSlaHours ?? ''}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
              />
            </label>
            <label className="space-y-1 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Resolution hours</span>
              <input
                type="number"
                name="resolutionSlaHours"
                min={1}
                value={formState.resolutionSlaHours ?? ''}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
              />
            </label>
            <label className="space-y-1 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Escalate after</span>
              <input
                type="number"
                name="autoEscalateHours"
                min={0}
                value={formState.autoEscalateHours ?? ''}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="space-y-1 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Close after</span>
              <input
                type="number"
                name="autoCloseHours"
                min={0}
                value={formState.autoCloseHours ?? ''}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="space-y-1 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Default assignee</span>
              <input
                type="text"
                name="defaultAssigneeId"
                value={formState.defaultAssigneeId ?? ''}
                onChange={handleChange}
                placeholder="User ID"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="space-y-1 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Notify</span>
              <textarea
                name="notificationEmails"
                value={formState.notificationEmails ?? ''}
                onChange={handleChange}
                rows={3}
                placeholder="team@example.com"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <span className="text-xs text-slate-400">One per line</span>
            </label>
          </div>
          <label className="space-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Evidence list</span>
            <textarea
              name="evidenceRequirements"
              value={formState.evidenceRequirements ?? ''}
              onChange={handleChange}
              rows={3}
              placeholder={`Screenshots
Contracts`}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
