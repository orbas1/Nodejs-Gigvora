import { useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  ArrowUpOnSquareIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

import AdminGovernanceSection from '../ui/AdminGovernanceSection.jsx';

const STATUS_COLUMNS = [
  { key: 'backlog', title: 'Backlog', accent: 'border-slate-200 bg-slate-50/80', icon: ClipboardDocumentListIcon },
  { key: 'in_progress', title: 'In progress', accent: 'border-sky-200 bg-sky-50/80', icon: ArrowPathIcon },
  { key: 'awaiting_evidence', title: 'Awaiting evidence', accent: 'border-amber-200 bg-amber-50/80', icon: ExclamationTriangleIcon },
  { key: 'complete', title: 'Complete', accent: 'border-emerald-200 bg-emerald-50/80', icon: SparklesIcon },
];

const DEFAULT_OBLIGATION = {
  title: '',
  owner: '',
  dueDate: '',
  status: 'backlog',
  riskRating: 'medium',
  frameworkIds: [],
  evidenceUrl: '',
  notes: '',
};

function ObligationCard({ obligation, onUpdateStatus, onAttachEvidence, onPromote, onOpenDetail }) {
  return (
    <article className="space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{obligation.owner || 'Unassigned'}</p>
          <h3 className="mt-1 text-sm font-semibold text-slate-900">{obligation.title}</h3>
        </div>
        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {obligation.riskRating ?? 'medium'} risk
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-xs text-slate-500">
        <div>
          <dt className="font-semibold uppercase tracking-wide text-slate-400">Due</dt>
          <dd className="mt-1 text-slate-700">{obligation.dueDate ? new Date(obligation.dueDate).toLocaleDateString() : 'TBC'}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wide text-slate-400">Frameworks</dt>
          <dd className="mt-1 text-slate-700">{(obligation.frameworkIds ?? []).join(', ') || '—'}</dd>
        </div>
      </dl>

      <p className="text-xs text-slate-500">{obligation.notes || 'No notes yet. Capture context for auditors and stakeholders.'}</p>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <button
          type="button"
          onClick={() => onUpdateStatus?.('in_progress')}
          className="rounded-full border border-slate-200 px-3 py-1 font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-800"
        >
          Start
        </button>
        <button
          type="button"
          onClick={() => onUpdateStatus?.('complete')}
          className="rounded-full border border-emerald-200 px-3 py-1 font-semibold uppercase tracking-wide text-emerald-600 hover:border-emerald-300 hover:text-emerald-700"
        >
          Complete
        </button>
        <button
          type="button"
          onClick={() => onAttachEvidence?.()}
          className="rounded-full border border-slate-200 px-3 py-1 font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
        >
          Evidence
        </button>
        <button
          type="button"
          onClick={() => onPromote?.()}
          className="rounded-full border border-sky-200 px-3 py-1 font-semibold uppercase tracking-wide text-sky-600 hover:border-sky-300 hover:text-sky-700"
        >
          Escalate
        </button>
        <button
          type="button"
          onClick={() => onOpenDetail?.()}
          className="rounded-full border border-slate-200 px-3 py-1 font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
        >
          View
        </button>
      </div>
    </article>
  );
}

function CreateObligationCard({ frameworks, onCreate }) {
  const [draft, setDraft] = useState(DEFAULT_OBLIGATION);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!draft.title.trim()) {
      return;
    }
    onCreate?.({
      ...draft,
      frameworkIds: Array.from(new Set((draft.frameworkIds ?? []).filter(Boolean))),
    });
    setDraft(DEFAULT_OBLIGATION);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm shadow-soft">
      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Obligation</span>
        <input
          type="text"
          required
          value={draft.title}
          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          placeholder="Data processing register, DPIA refresh, pen test…"
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</span>
        <input
          type="text"
          value={draft.owner}
          onChange={(event) => setDraft((current) => ({ ...current, owner: event.target.value }))}
          placeholder="Assign owner"
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Due date</span>
        <input
          type="date"
          value={draft.dueDate}
          onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Frameworks</span>
        <select
          multiple
          value={draft.frameworkIds}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              frameworkIds: Array.from(event.target.selectedOptions).map((option) => option.value),
            }))
          }
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          {frameworks.map((framework) => (
            <option key={framework.id} value={framework.id}>
              {framework.name}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
        <textarea
          rows={2}
          value={draft.notes}
          onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </label>
      <button
        type="submit"
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-soft hover:bg-accentDark"
      >
        <PlusIcon className="h-4 w-4" aria-hidden="true" /> Add obligation
      </button>
    </form>
  );
}

export default function ComplianceObligationBoard({
  obligations = [],
  frameworks = [],
  onCreate,
  onUpdate,
  onAttachEvidence,
}) {
  const [showCreate, setShowCreate] = useState(true);

  const grouped = useMemo(() => {
    return STATUS_COLUMNS.reduce((acc, column) => {
      acc[column.key] = obligations.filter((obligation) => (obligation.status ?? 'backlog') === column.key);
      return acc;
    }, {});
  }, [obligations]);

  return (
    <AdminGovernanceSection
      id="compliance-obligations"
      title="Obligation tracker"
      description="Orchestrate GDPR responses, contract reviews, DPIAs, and training with auditable status transitions and evidence links."
      actions={
        <button
          type="button"
          onClick={() => setShowCreate((current) => !current)}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-slate-800"
        >
          {showCreate ? 'Hide quick add' : 'Add obligation'}
        </button>
      }
    >

      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-600">
        Showing <span className="font-semibold text-slate-900">{obligations.length}</span> obligations in view. Completed items:{' '}
        <span className="font-semibold text-emerald-600">{(grouped.complete ?? []).length}</span>. Adjust filters above to focus on
        specific owners, frameworks, or risk bands.
      </div>

      {showCreate && <CreateObligationCard frameworks={frameworks} onCreate={onCreate} />}

      <div className="grid gap-4 lg:grid-cols-4">
        {STATUS_COLUMNS.map((column) => {
          const Icon = column.icon;
          const columnObligations = grouped[column.key] ?? [];
          return (
            <div key={column.key} className={`flex min-h-[320px] flex-col gap-4 rounded-3xl border p-4 ${column.accent}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{column.title}</p>
                  <h3 className="text-lg font-semibold text-slate-900">{columnObligations.length} open</h3>
                </div>
                <Icon className="h-6 w-6 text-slate-400" aria-hidden="true" />
              </div>

              <div className="flex flex-1 flex-col gap-3">
                {columnObligations.length ? (
                  columnObligations.map((obligation) => (
                    <ObligationCard
                      key={obligation.id}
                      obligation={obligation}
                      onUpdateStatus={(status) => onUpdate?.(obligation.id, { status })}
                      onAttachEvidence={() => onAttachEvidence?.(obligation.id)}
                      onPromote={() => onUpdate?.(obligation.id, { status: 'awaiting_evidence' })}
                      onOpenDetail={() => onUpdate?.(obligation.id, { open: true })}
                    />
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                    Nothing here yet. Drag actions in from other stages or create a new item.
                  </p>
                )}
              </div>

              {column.key === 'complete' && (
                <div className="rounded-2xl border border-emerald-200 bg-white/60 p-4 text-xs text-emerald-700">
                  <p className="font-semibold">Auto-share proof</p>
                  <p className="mt-1 text-emerald-600">
                    Completed items sync to the trust centre and investor reports once evidence is attached.
                  </p>
                  <button
                    type="button"
                    onClick={() => onAttachEvidence?.('broadcast')}
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 px-3 py-1 font-semibold uppercase tracking-wide text-emerald-600 hover:border-emerald-300 hover:text-emerald-700"
                  >
                    <ArrowUpOnSquareIcon className="h-4 w-4" aria-hidden="true" /> Publish highlights
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AdminGovernanceSection>
  );
}
