import { useMemo, useState } from 'react';
import WorkspaceModal from './WorkspaceModal.jsx';

const STATUS_OPTIONS = ['planned', 'approved', 'in_progress', 'completed', 'overbudget'];

function formatAmount(value, currency = 'USD') {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) {
    return `${currency} 0`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

export default function WorkspaceBudgetTab({ budgets = [], submissions = [], onCreate, onUpdate, onDelete }) {
  const [formState, setFormState] = useState(null);

  const editing = useMemo(() => {
    if (!formState?.id) {
      return null;
    }
    return budgets.find((item) => item.id === formState.id) ?? null;
  }, [budgets, formState]);

  const handleOpenCreate = () => {
    setFormState({
      category: '',
      label: '',
      plannedAmount: '',
      actualAmount: '',
      currency: 'USD',
      ownerName: '',
      status: 'planned',
      notes: '',
    });
  };

  const handleOpenEdit = (line) => {
    setFormState({
      id: line.id,
      category: line.category ?? '',
      label: line.label ?? '',
      plannedAmount: line.plannedAmount ?? '',
      actualAmount: line.actualAmount ?? '',
      currency: line.currency ?? 'USD',
      ownerName: line.ownerName ?? '',
      status: line.status ?? 'planned',
      notes: line.notes ?? '',
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formState?.category || !formState?.label) {
      return;
    }
    const payload = {
      category: formState.category,
      label: formState.label,
      plannedAmount: formState.plannedAmount,
      actualAmount: formState.actualAmount,
      currency: formState.currency,
      ownerName: formState.ownerName,
      status: formState.status,
      notes: formState.notes,
    };
    if (formState.id) {
      onUpdate?.(formState.id, payload);
    } else {
      onCreate?.(payload);
    }
    setFormState(null);
  };

  return (
    <div className="space-y-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Budget</h2>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark"
          >
            Add line
          </button>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Label</th>
                <th className="px-4 py-2 text-right">Planned</th>
                <th className="px-4 py-2 text-right">Actual</th>
                <th className="px-4 py-2 text-left">Owner</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {budgets.map((line) => (
                <tr key={line.id} className="text-slate-600">
                  <td className="px-4 py-3 font-medium text-slate-900">{line.category}</td>
                  <td className="px-4 py-3">{line.label}</td>
                  <td className="px-4 py-3 text-right">{formatAmount(line.plannedAmount, line.currency)}</td>
                  <td className="px-4 py-3 text-right">{formatAmount(line.actualAmount, line.currency)}</td>
                  <td className="px-4 py-3">{line.ownerName || 'Unassigned'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {line.status?.replace(/_/g, ' ') ?? 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(line)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete?.(line.id)}
                        className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {budgets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-xs text-slate-500">
                    Capture budget lines to forecast spend and monitor burn.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Submissions</h2>
          <p className="text-xs text-slate-500">Deliverables progressing through review.</p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Owner</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Due</th>
                <th className="px-4 py-2 text-left">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.map((submission) => (
                <tr key={submission.id} className="text-slate-600">
                  <td className="px-4 py-3 font-medium text-slate-900">{submission.title}</td>
                  <td className="px-4 py-3">{submission.submissionType?.replace(/_/g, ' ') ?? '—'}</td>
                  <td className="px-4 py-3">{submission.submittedByName || 'Pending'}</td>
                  <td className="px-4 py-3">{submission.status?.replace(/_/g, ' ') ?? 'Pending'}</td>
                  <td className="px-4 py-3">{submission.dueAt ? new Date(submission.dueAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">{submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-xs text-slate-500">
                    No submissions logged yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <WorkspaceModal
        open={formState !== null}
        title={editing ? 'Edit budget line' : 'New budget line'}
        description="Track spend against plan with clean, single-line entries."
        onClose={() => setFormState(null)}
      >
        {formState ? (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Category
              <input
                type="text"
                value={formState.category ?? ''}
                onChange={(event) => setFormState((state) => ({ ...(state ?? {}), category: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Label
              <input
                type="text"
                value={formState.label ?? ''}
                onChange={(event) => setFormState((state) => ({ ...(state ?? {}), label: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Planned amount
              <input
                type="number"
                step="0.01"
                min="0"
                value={formState.plannedAmount ?? ''}
                onChange={(event) => setFormState((state) => ({ ...(state ?? {}), plannedAmount: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Actual amount
              <input
                type="number"
                step="0.01"
                min="0"
                value={formState.actualAmount ?? ''}
                onChange={(event) => setFormState((state) => ({ ...(state ?? {}), actualAmount: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Currency
              <input
                type="text"
                value={formState.currency ?? 'USD'}
                onChange={(event) => setFormState((state) => ({ ...(state ?? {}), currency: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                maxLength={6}
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Owner
              <input
                type="text"
                value={formState.ownerName ?? ''}
                onChange={(event) => setFormState((state) => ({ ...(state ?? {}), ownerName: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
              <select
                value={formState.status ?? 'planned'}
                onChange={(event) => setFormState((state) => ({ ...(state ?? {}), status: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500 md:col-span-2">
              Notes
              <textarea
                value={formState.notes ?? ''}
                onChange={(event) => setFormState((state) => ({ ...(state ?? {}), notes: event.target.value }))}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFormState(null)}
                className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                {formState.id ? 'Save changes' : 'Create line'}
              </button>
            </div>
          </form>
        ) : null}
      </WorkspaceModal>
    </div>
  );
}
