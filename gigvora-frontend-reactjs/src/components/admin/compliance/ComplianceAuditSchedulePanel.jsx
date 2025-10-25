import { useMemo, useState } from 'react';
import { CalendarDaysIcon, ClockIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const DEFAULT_AUDIT = {
  name: '',
  frameworkId: '',
  auditFirm: '',
  startDate: '',
  endDate: '',
  scope: '',
  status: 'scheduled',
  deliverables: [],
};

const STATUS_BADGES = {
  scheduled: 'bg-amber-50 text-amber-700 border-amber-200',
  in_progress: 'bg-sky-50 text-sky-700 border-sky-200',
  complete: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  blocked: 'bg-rose-50 text-rose-600 border-rose-200',
};

function AuditRow({ audit, frameworksLookup, onSave, onDelete, busy }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(audit ?? DEFAULT_AUDIT);

  const handleChange = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSave({ ...draft, deliverables: (draft.deliverables ?? []).filter(Boolean) });
    setEditing(false);
  };

  const badgeClass = STATUS_BADGES[audit?.status] ?? STATUS_BADGES.scheduled;

  if (editing) {
    return (
      <tr className="bg-white/80">
        <td colSpan={7} className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Audit name</span>
                <input
                  type="text"
                  required
                  value={draft.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Framework</span>
                <select
                  value={draft.frameworkId}
                  onChange={(event) => handleChange('frameworkId', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">Select framework…</option>
                  {frameworksLookup.map((framework) => (
                    <option key={framework.id} value={framework.id}>
                      {framework.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Audit firm / reviewer</span>
                <input
                  type="text"
                  value={draft.auditFirm}
                  onChange={(event) => handleChange('auditFirm', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                <select
                  value={draft.status}
                  onChange={(event) => handleChange('status', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In progress</option>
                  <option value="complete">Complete</option>
                  <option value="blocked">Blocked</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start date</span>
                <input
                  type="date"
                  value={draft.startDate ? draft.startDate.slice(0, 10) : ''}
                  onChange={(event) => handleChange('startDate', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">End date</span>
                <input
                  type="date"
                  value={draft.endDate ? draft.endDate.slice(0, 10) : ''}
                  onChange={(event) => handleChange('endDate', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scope notes</span>
              <textarea
                rows={3}
                value={draft.scope}
                onChange={(event) => handleChange('scope', event.target.value)}
                placeholder="Include systems, regions, and annex coverage"
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deliverables</span>
              <textarea
                rows={3}
                value={(draft.deliverables ?? []).join('\n')}
                onChange={(event) =>
                  handleChange(
                    'deliverables',
                    event.target.value
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="Report, management letter, readiness review…"
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-800"
              >
                <XMarkIcon className="h-4 w-4" aria-hidden="true" /> Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-soft hover:bg-accentDark disabled:opacity-60"
              >
                Save audit
              </button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-white/70">
      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">{audit.name}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{frameworksLookup.find((fw) => fw.id === audit.frameworkId)?.name ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{audit.auditFirm || 'Internal'}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{audit.startDate ? new Date(audit.startDate).toLocaleDateString() : 'TBC'}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{audit.endDate ? new Date(audit.endDate).toLocaleDateString() : 'TBC'}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${badgeClass}`}>
          {audit.status?.replace('_', ' ') ?? 'scheduled'}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-3 text-xs">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full border border-slate-200 px-3 py-1 font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-800"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete?.()}
            className="rounded-full border border-rose-200 px-3 py-1 font-semibold uppercase tracking-wide text-rose-600 hover:border-rose-300 hover:text-rose-700"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ComplianceAuditSchedulePanel({ audits = [], frameworks = [], onCreate, onUpdate, onDelete, creating, busyAuditId }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAudit, setNewAudit] = useState(DEFAULT_AUDIT);

  const sortedAudits = useMemo(() => {
    return [...audits].sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0));
  }, [audits]);

  const handleCreate = async (event) => {
    event.preventDefault();
    await onCreate?.({ ...newAudit, deliverables: (newAudit.deliverables ?? []).filter(Boolean) });
    setNewAudit(DEFAULT_AUDIT);
    setShowCreateForm(false);
  };

  return (
    <AdminGovernanceSection
      id="compliance-audits"
      title="Audit schedule"
      description="Track external assessments, readiness reviews, and surveillance audits with deliverables and scopes."
      actions={
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-slate-800"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" /> Schedule audit
        </button>
      }
    >

      <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-soft">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Audit</th>
              <th className="px-4 py-3">Framework</th>
              <th className="px-4 py-3">Firm</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">End</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedAudits.map((audit) => (
              <AuditRow
                key={audit.id}
                audit={audit}
                frameworksLookup={frameworks}
                busy={busyAuditId === audit.id}
                onSave={(payload) => onUpdate?.(audit.id, payload)}
                onDelete={() => onDelete?.(audit.id)}
              />
            ))}

            {!sortedAudits.length && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                  <div className="mx-auto max-w-md space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                      <CalendarDaysIcon className="h-8 w-8 text-slate-400" aria-hidden="true" />
                    </div>
                    <p className="text-base font-semibold text-slate-900">No audits yet</p>
                    <p>
                      Schedule readiness reviews, certification renewals, or supplier audits. We surface key dates on the admin
                      timeline and notify owners automatically.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreate} className="space-y-6 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">New audit</h3>
              <p className="mt-1 text-sm text-slate-500">
                Define scope, assign owners, and set deliverables. Notifications will be routed to stakeholders.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setNewAudit(DEFAULT_AUDIT);
              }}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-800"
            >
              Close
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Audit name</span>
              <input
                type="text"
                required
                value={newAudit.name}
                onChange={(event) => setNewAudit((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Framework</span>
              <select
                value={newAudit.frameworkId}
                onChange={(event) => setNewAudit((current) => ({ ...current, frameworkId: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="">Select framework…</option>
                {frameworks.map((framework) => (
                  <option key={framework.id} value={framework.id}>
                    {framework.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Audit firm / reviewer</span>
              <input
                type="text"
                value={newAudit.auditFirm}
                onChange={(event) => setNewAudit((current) => ({ ...current, auditFirm: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
              <select
                value={newAudit.status}
                onChange={(event) => setNewAudit((current) => ({ ...current, status: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In progress</option>
                <option value="complete">Complete</option>
                <option value="blocked">Blocked</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start date</span>
              <input
                type="date"
                value={newAudit.startDate}
                onChange={(event) => setNewAudit((current) => ({ ...current, startDate: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">End date</span>
              <input
                type="date"
                value={newAudit.endDate}
                onChange={(event) => setNewAudit((current) => ({ ...current, endDate: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scope notes</span>
            <textarea
              rows={3}
              value={newAudit.scope}
              onChange={(event) => setNewAudit((current) => ({ ...current, scope: event.target.value }))}
              placeholder="List systems, annexes, sub-service organisations…"
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deliverables</span>
            <textarea
              rows={3}
              value={(newAudit.deliverables ?? []).join('\n')}
              onChange={(event) =>
                setNewAudit((current) => ({
                  ...current,
                  deliverables: event.target.value
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean),
                }))
              }
              placeholder="Report, management letter, remediation plan…"
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setNewAudit(DEFAULT_AUDIT);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-soft hover:bg-accentDark disabled:opacity-60"
            >
              Schedule audit
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-900/90 p-6 text-white shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200">Audit broadcast</p>
            <h3 className="text-lg font-semibold">Keep leadership informed</h3>
          </div>
          <ClockIcon className="h-10 w-10 text-amber-200" aria-hidden="true" />
        </div>
        <p className="text-sm text-white/80">
          Upcoming audits automatically sync to the admin timeline, Slack #gigvora-trust channel, and investor reports. Attach
          readiness decks or scoping notes to each record to keep everyone aligned.
        </p>
      </div>
    </AdminGovernanceSection>
  );
}
