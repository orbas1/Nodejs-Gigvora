import { useEffect, useMemo, useState } from 'react';

const STATUSES = ['draft', 'approved', 'in_review', 'over_budget', 'closed'];

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: Math.abs(Number(value)) < 1000 ? 2 : 0,
  }).format(Number(value));
}

const defaultForm = {
  id: null,
  category: '',
  status: 'draft',
  currency: 'USD',
  allocatedAmount: '',
  actualAmount: '',
  ownerName: '',
  notes: '',
};

export default function WorkspaceBudgetManager({ budgets = [], onSave, onDelete, currency = 'USD' }) {
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setForm((prev) => ({ ...prev, currency }));
  }, [currency]);

  const summary = useMemo(() => {
    return budgets.reduce(
      (acc, budget) => {
        acc.allocated += Number(budget.allocatedAmount || 0);
        acc.actual += Number(budget.actualAmount || 0);
        if (budget.status === 'over_budget') {
          acc.overBudget += 1;
        }
        return acc;
      },
      { allocated: 0, actual: 0, overBudget: 0 },
    );
  }, [budgets]);

  function handleEdit(entry) {
    setForm({
      id: entry.id,
      category: entry.category ?? '',
      status: entry.status ?? 'draft',
      currency: entry.currency ?? currency,
      allocatedAmount: entry.allocatedAmount ?? '',
      actualAmount: entry.actualAmount ?? '',
      ownerName: entry.ownerName ?? '',
      notes: entry.notes ?? '',
    });
    setFeedback(null);
    setError(null);
  }

  function resetForm() {
    setForm({ ...defaultForm, currency });
    setFeedback(null);
    setError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!onSave) {
      return;
    }
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      await onSave({
        id: form.id,
        category: form.category,
        status: form.status,
        currency: form.currency,
        allocatedAmount: form.allocatedAmount === '' ? null : Number(form.allocatedAmount),
        actualAmount: form.actualAmount === '' ? null : Number(form.actualAmount),
        ownerName: form.ownerName,
        notes: form.notes,
      });
      setFeedback(form.id ? 'Budget updated.' : 'Budget added.');
      resetForm();
    } catch (submitError) {
      setError(submitError);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry) {
    if (!onDelete) {
      return;
    }
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      await onDelete(entry);
      if (form.id === entry.id) {
        resetForm();
      }
      setFeedback('Budget removed.');
    } catch (deleteError) {
      setError(deleteError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Budget management</h2>
          <p className="text-sm text-slate-600">Track allocations, monitor spend, and keep every line item reviewable.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
          <p>
            Allocated: <span className="font-semibold">{formatCurrency(summary.allocated, currency)}</span>
          </p>
          <p>
            Actual: <span className="font-semibold">{formatCurrency(summary.actual, currency)}</span>
          </p>
          <p>
            Over budget lines: <span className="font-semibold">{summary.overBudget}</span>
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-right">Allocated</th>
              <th className="px-4 py-2 text-right">Actual</th>
              <th className="px-4 py-2 text-left">Owner</th>
              <th className="px-4 py-2 text-left">Notes</th>
              <th className="px-4 py-2" aria-label="actions">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {budgets.length ? (
              budgets.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">{entry.category}</td>
                  <td className="px-4 py-2 capitalize text-slate-600">{entry.status.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-2 text-right text-slate-700">{formatCurrency(entry.allocatedAmount, entry.currency)}</td>
                  <td className="px-4 py-2 text-right text-slate-700">{formatCurrency(entry.actualAmount, entry.currency)}</td>
                  <td className="px-4 py-2 text-slate-600">{entry.ownerName ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-500">{entry.notes ?? '—'}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(entry)}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry)}
                        className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-slate-500">
                  No budget lines yet. Add one to begin tracking spend.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold text-slate-900">{form.id ? 'Edit budget line' : 'Add budget line'}</h3>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="budget-category">
            Category
          </label>
          <input
            id="budget-category"
            value={form.category}
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="e.g. Design"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="budget-status">
            Status
          </label>
          <select
            id="budget-status"
            value={form.status}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="budget-currency">
            Currency
          </label>
          <input
            id="budget-currency"
            value={form.currency}
            onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase().slice(0, 3) }))}
            maxLength={3}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm uppercase text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="budget-allocated">
            Allocated amount
          </label>
          <input
            id="budget-allocated"
            type="number"
            step="0.01"
            value={form.allocatedAmount}
            onChange={(event) => setForm((prev) => ({ ...prev, allocatedAmount: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="budget-actual">
            Actual amount
          </label>
          <input
            id="budget-actual"
            type="number"
            step="0.01"
            value={form.actualAmount}
            onChange={(event) => setForm((prev) => ({ ...prev, actualAmount: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="budget-owner">
            Owner
          </label>
          <input
            id="budget-owner"
            value={form.ownerName}
            onChange={(event) => setForm((prev) => ({ ...prev, ownerName: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Budget owner"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="budget-notes">
            Notes
          </label>
          <textarea
            id="budget-notes"
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            rows={3}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        {feedback ? <p className="md:col-span-2 text-sm text-emerald-600">{feedback}</p> : null}
        {error ? (
          <p className="md:col-span-2 text-sm text-rose-600">{error.message ?? 'Unable to save budget line.'}</p>
        ) : null}
        <div className="md:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? 'Saving…' : form.id ? 'Update budget' : 'Add budget'}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
