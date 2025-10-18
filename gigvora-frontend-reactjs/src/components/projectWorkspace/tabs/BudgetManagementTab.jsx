import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import WorkspaceDialog from '../WorkspaceDialog.jsx';

const INITIAL_FORM = {
  label: '',
  category: 'Operations',
  plannedAmount: '',
  actualAmount: '',
  currency: 'USD',
  status: 'planned',
  ownerId: '',
  notes: '',
};

function formatCurrency(value, currency) {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  } catch (error) {
    return `${currency || 'USD'} ${Number(value || 0).toLocaleString()}`;
  }
}

export default function BudgetManagementTab({ project, actions, canManage }) {
  const budgetLines = project.budgetLines ?? [];
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const totals = useMemo(() => {
    return budgetLines.reduce(
      (accumulator, line) => {
        accumulator.planned += Number(line.plannedAmount || 0);
        accumulator.actual += Number(line.actualAmount || 0);
        return accumulator;
      },
      { planned: 0, actual: 0 },
    );
  }, [budgetLines]);

  const handleFormChange = (event, setState) => {
    const { name, value } = event.target;
    setState((current) => ({ ...current, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!canManage) {
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.createBudgetLine(project.id, {
        label: form.label,
        category: form.category,
        plannedAmount: form.plannedAmount ? Number(form.plannedAmount) : 0,
        actualAmount: form.actualAmount ? Number(form.actualAmount) : 0,
        currency: form.currency,
        status: form.status,
        ownerId: form.ownerId ? Number(form.ownerId) : undefined,
        notes: form.notes || null,
      });
      setForm(INITIAL_FORM);
      setCreateOpen(false);
      setFeedback({ status: 'success', message: 'Budget line created.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Failed to create budget line.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (line) => {
    setEditingId(line.id);
    setEditingForm({
      label: line.label || '',
      category: line.category || 'Operations',
      plannedAmount: line.plannedAmount ?? '',
      actualAmount: line.actualAmount ?? '',
      currency: line.currency || 'USD',
      status: line.status || 'planned',
      ownerId: line.ownerId ?? '',
      notes: line.notes || '',
    });
    setEditOpen(true);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!canManage) {
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.updateBudgetLine(project.id, editingId, {
        label: editingForm.label,
        category: editingForm.category,
        plannedAmount: editingForm.plannedAmount ? Number(editingForm.plannedAmount) : 0,
        actualAmount: editingForm.actualAmount ? Number(editingForm.actualAmount) : 0,
        currency: editingForm.currency,
        status: editingForm.status,
        ownerId: editingForm.ownerId ? Number(editingForm.ownerId) : undefined,
        notes: editingForm.notes || null,
      });
      setEditOpen(false);
      setEditingId(null);
      setFeedback({ status: 'success', message: 'Budget line updated.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Failed to update budget line.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (lineId) => {
    if (!canManage) {
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.deleteBudgetLine(project.id, lineId);
      setFeedback({ status: 'success', message: 'Budget line removed.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Failed to delete budget line.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Budget</p>
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-700">
            <span>Planned {formatCurrency(totals.planned, project.budgetCurrency)}</span>
            <span>Actual {formatCurrency(totals.actual, project.budgetCurrency)}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm(INITIAL_FORM);
            setCreateOpen(true);
          }}
          disabled={!canManage}
          className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          New line
        </button>
      </div>

      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.status === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-600'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 text-left">Label</th>
              <th scope="col" className="px-4 py-3 text-left">Category</th>
              <th scope="col" className="px-4 py-3 text-right">Planned</th>
              <th scope="col" className="px-4 py-3 text-right">Actual</th>
              <th scope="col" className="px-4 py-3 text-left">Status</th>
              <th scope="col" className="px-4 py-3 text-left">Notes</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {budgetLines.length ? (
              budgetLines.map((line) => (
                <tr key={line.id} className="bg-white">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{line.label}</p>
                    {line.ownerId ? <p className="text-xs text-slate-500">Owner #{line.ownerId}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{line.category}</td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {formatCurrency(line.plannedAmount, line.currency || project.budgetCurrency)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {formatCurrency(line.actualAmount, line.currency || project.budgetCurrency)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {line.status?.replace(/_/g, ' ') || 'planned'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{line.notes || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(line)}
                        disabled={!canManage || submitting}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(line.id)}
                        disabled={!canManage || submitting}
                        className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-6 text-center text-sm text-slate-500">
                  No lines recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <WorkspaceDialog
        open={createOpen}
        onClose={() => {
          if (!submitting) {
            setCreateOpen(false);
          }
        }}
        title="New budget line"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Label
              <input
                name="label"
                value={form.label}
                onChange={(event) => handleFormChange(event, setForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Category
              <input
                name="category"
                value={form.category}
                onChange={(event) => handleFormChange(event, setForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Planned amount
              <input
                name="plannedAmount"
                type="number"
                value={form.plannedAmount}
                onChange={(event) => handleFormChange(event, setForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
                min="0"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Actual amount
              <input
                name="actualAmount"
                type="number"
                value={form.actualAmount}
                onChange={(event) => handleFormChange(event, setForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
                min="0"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Status
              <select
                name="status"
                value={form.status}
                onChange={(event) => handleFormChange(event, setForm)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              >
                <option value="planned">Planned</option>
                <option value="approved">Approved</option>
                <option value="in_progress">In delivery</option>
                <option value="complete">Complete</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Owner
              <input
                name="ownerId"
                type="number"
                value={form.ownerId}
                onChange={(event) => handleFormChange(event, setForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
                min="0"
              />
            </label>
            <label className="md:col-span-2 flex flex-col gap-2 text-sm text-slate-700">
              Notes
              <textarea
                name="notes"
                rows={2}
                value={form.notes}
                onChange={(event) => handleFormChange(event, setForm)}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={!canManage || submitting}
              />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                if (!submitting) {
                  setCreateOpen(false);
                }
              }}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canManage || submitting}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Saving…' : 'Save line'}
            </button>
          </div>
        </form>
      </WorkspaceDialog>

      <WorkspaceDialog
        open={editOpen && Boolean(editingId)}
        onClose={() => {
          if (!submitting) {
            setEditOpen(false);
            setEditingId(null);
          }
        }}
        title="Edit budget line"
        size="lg"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Label
              <input
                name="label"
                value={editingForm.label}
                onChange={(event) => handleFormChange(event, setEditingForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={submitting || !canManage}
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Category
              <input
                name="category"
                value={editingForm.category}
                onChange={(event) => handleFormChange(event, setEditingForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={submitting || !canManage}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Planned amount
              <input
                name="plannedAmount"
                type="number"
                value={editingForm.plannedAmount}
                onChange={(event) => handleFormChange(event, setEditingForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={submitting || !canManage}
                min="0"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Actual amount
              <input
                name="actualAmount"
                type="number"
                value={editingForm.actualAmount}
                onChange={(event) => handleFormChange(event, setEditingForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={submitting || !canManage}
                min="0"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Status
              <select
                name="status"
                value={editingForm.status}
                onChange={(event) => handleFormChange(event, setEditingForm)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={submitting || !canManage}
              >
                <option value="planned">Planned</option>
                <option value="approved">Approved</option>
                <option value="in_progress">In delivery</option>
                <option value="complete">Complete</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Owner
              <input
                name="ownerId"
                type="number"
                value={editingForm.ownerId}
                onChange={(event) => handleFormChange(event, setEditingForm)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={submitting || !canManage}
                min="0"
              />
            </label>
            <label className="md:col-span-2 flex flex-col gap-2 text-sm text-slate-700">
              Notes
              <textarea
                name="notes"
                rows={2}
                value={editingForm.notes}
                onChange={(event) => handleFormChange(event, setEditingForm)}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={submitting || !canManage}
              />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                if (!submitting) {
                  setEditOpen(false);
                  setEditingId(null);
                }
              }}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !canManage}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Saving…' : 'Update line'}
            </button>
          </div>
        </form>
      </WorkspaceDialog>
    </div>
  );
}

BudgetManagementTab.propTypes = {
  project: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  canManage: PropTypes.bool.isRequired,
};
