import { useMemo, useState } from 'react';
import {
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

import AdminGovernanceSection from '../ui/AdminGovernanceSection.jsx';

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  planning: 'bg-sky-50 text-sky-700 border-sky-200',
  retired: 'bg-slate-50 text-slate-600 border-slate-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
};

const DEFAULT_FRAMEWORK = {
  name: '',
  owner: '',
  region: 'Global',
  status: 'planning',
  renewalCadenceMonths: 12,
  controls: [],
  automationCoverage: 0,
};

function FrameworkCard({
  framework,
  editing,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  busy,
}) {
  const [draft, setDraft] = useState(framework ?? DEFAULT_FRAMEWORK);

  const handleChange = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!draft.name.trim()) {
      return;
    }
    onSave({ ...draft, automationCoverage: Number(draft.automationCoverage) || 0 });
  };

  const statusTone = STATUS_STYLES[framework?.status] ?? STATUS_STYLES.planning;

  if (editing) {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{framework?.id ? 'Update framework' : 'New framework'}</h3>
            <p className="mt-1 text-sm text-slate-500">
              Capture ownership, automation coverage, and renewal cadence to keep compliance live.
            </p>
          </div>
          {framework?.id && (
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-600 transition hover:border-red-300 hover:bg-red-50"
            >
              <TrashIcon className="h-4 w-4" aria-hidden="true" /> Remove
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Framework name</span>
            <input
              type="text"
              required
              value={draft.name}
              onChange={(event) => handleChange('name', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Framework owner</span>
            <input
              type="text"
              required
              value={draft.owner}
              onChange={(event) => handleChange('owner', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Primary region</span>
            <input
              type="text"
              value={draft.region}
              onChange={(event) => handleChange('region', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select
              value={draft.status}
              onChange={(event) => handleChange('status', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="retired">Retired</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Automation coverage (%)</span>
            <input
              type="number"
              min="0"
              max="100"
              value={draft.automationCoverage}
              onChange={(event) => handleChange('automationCoverage', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Renewal cadence (months)</span>
            <input
              type="number"
              min="1"
              value={draft.renewalCadenceMonths}
              onChange={(event) => handleChange('renewalCadenceMonths', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Automated controls</span>
          <textarea
            rows={3}
            placeholder="Encryption at rest, DLP monitoring, change management approvals..."
            value={(draft.controls || []).join('\n')}
            onChange={(event) => handleChange('controls', event.target.value.split('\n').map((line) => line.trim()).filter(Boolean))}
            className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
          >
            <ArrowUturnLeftIcon className="h-4 w-4" aria-hidden="true" /> Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:opacity-60"
          >
            <CheckCircleIcon className="h-4 w-4" aria-hidden="true" /> Save framework
          </button>
        </div>
      </form>
    );
  }

  return (
    <article className="flex flex-col justify-between gap-6 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-xl">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusTone}`}>
                <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
                {framework.status ?? 'planning'}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{framework.region ?? 'Global'}</span>
            </div>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">{framework.name}</h3>
            <p className="text-sm text-slate-500">Owned by {framework.owner || 'Unassigned'} • Renewal every {framework.renewalCadenceMonths || 12} months</p>
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Edit
          </button>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm text-slate-600">
          <div className="rounded-2xl bg-slate-50/80 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Automation coverage</dt>
            <dd className="mt-2 text-lg font-semibold text-slate-900">{framework.automationCoverage ?? 0}%</dd>
          </div>
          <div className="rounded-2xl bg-slate-50/80 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Controls automated</dt>
            <dd className="mt-2 text-lg font-semibold text-slate-900">{framework.controls?.length ?? 0}</dd>
          </div>
        </dl>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Key controls</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {(framework.controls ?? []).length ? (
              framework.controls.map((control) => (
                <li key={control} className="flex items-start gap-2">
                  <CheckCircleIcon className="mt-0.5 h-4 w-4 text-emerald-500" aria-hidden="true" />
                  <span>{control}</span>
                </li>
              ))
            ) : (
              <li className="rounded-2xl border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-400">
                Add automated controls to keep auditors happy.
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Framework ID: {framework.id}</span>
        <span>Last updated {framework.updatedAt ? new Date(framework.updatedAt).toLocaleDateString() : 'recently'}</span>
      </div>
    </article>
  );
}

export default function ComplianceFrameworksPanel({ frameworks = [], onCreate, onUpdate, onDelete, busyFrameworkId, creating }) {
  const [editingId, setEditingId] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);

  const sortedFrameworks = useMemo(() => {
    return [...frameworks].sort((a, b) => `${a.name}`.localeCompare(`${b.name}`));
  }, [frameworks]);

  const handleCreate = async (payload) => {
    if (!onCreate) return;
    await onCreate(payload);
    setCreatingNew(false);
  };

  const handleUpdate = async (frameworkId, payload) => {
    if (!onUpdate) return;
    await onUpdate(frameworkId, payload);
    setEditingId(null);
  };

  return (
    <AdminGovernanceSection
      id="compliance-frameworks"
      title="Framework register"
      description="Centralise ISO, SOC, GDPR, and bespoke frameworks with ownership, automation coverage, and cadence."
      actions={
        <button
          type="button"
          onClick={() => {
            setCreatingNew(true);
            setEditingId(null);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-800"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" /> New framework
        </button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {creatingNew && (
          <FrameworkCard
            key="new-framework"
            framework={{ ...DEFAULT_FRAMEWORK, id: 'new' }}
            editing
            busy={creating}
            onSave={handleCreate}
            onCancel={() => setCreatingNew(false)}
          />
        )}

        {sortedFrameworks.map((framework) => (
          <FrameworkCard
            key={framework.id}
            framework={framework}
            editing={editingId === framework.id}
            busy={busyFrameworkId === framework.id}
            onEdit={() => {
              setEditingId(framework.id);
              setCreatingNew(false);
            }}
            onCancel={() => setEditingId(null)}
            onSave={(payload) => handleUpdate(framework.id, payload)}
            onDelete={() => onDelete?.(framework.id)}
          />
        ))}

        {!sortedFrameworks.length && !creatingNew && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-10 text-center shadow-soft">
            <ShieldCheckIcon className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No frameworks yet</h3>
            <p className="mt-2 text-sm text-slate-500">
              Capture SOC 2, ISO 27001, GDPR, or supplier frameworks to automate evidence and audits.
            </p>
            <button
              type="button"
              onClick={() => setCreatingNew(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
            >
              <PlusIcon className="h-4 w-4" aria-hidden="true" /> Create framework
            </button>
          </div>
        )}
      </div>
    </AdminGovernanceSection>
  );
}
