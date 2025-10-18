import { useMemo, useState } from 'react';

const STATUSES = ['pending', 'active', 'on_leave', 'completed'];

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
}

function toInputDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function WorkspaceHrManager({ records = [], onSave, onDelete }) {
  const [form, setForm] = useState({
    id: null,
    memberName: '',
    assignmentRole: '',
    status: 'pending',
    capacityHours: '',
    allocatedHours: '',
    costRate: '',
    currency: 'USD',
    startedAt: '',
    endedAt: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  const summary = useMemo(() => {
    return STATUSES.map((status) => ({
      status,
      count: records.filter((record) => record.status === status).length,
    }));
  }, [records]);

  function handleEdit(entry) {
    setForm({
      id: entry.id,
      memberName: entry.memberName ?? '',
      assignmentRole: entry.assignmentRole ?? '',
      status: entry.status ?? 'pending',
      capacityHours: entry.capacityHours ?? '',
      allocatedHours: entry.allocatedHours ?? '',
      costRate: entry.costRate ?? '',
      currency: entry.currency ?? 'USD',
      startedAt: toInputDate(entry.startedAt),
      endedAt: toInputDate(entry.endedAt),
      notes: entry.notes ?? '',
    });
    setFeedback(null);
    setError(null);
  }

  function resetForm() {
    setForm({
      id: null,
      memberName: '',
      assignmentRole: '',
      status: 'pending',
      capacityHours: '',
      allocatedHours: '',
      costRate: '',
      currency: 'USD',
      startedAt: '',
      endedAt: '',
      notes: '',
    });
    setFeedback(null);
    setError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!onSave) return;
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      await onSave({
        id: form.id,
        memberName: form.memberName,
        assignmentRole: form.assignmentRole,
        status: form.status,
        capacityHours: form.capacityHours === '' ? null : Number(form.capacityHours),
        allocatedHours: form.allocatedHours === '' ? null : Number(form.allocatedHours),
        costRate: form.costRate === '' ? null : Number(form.costRate),
        currency: form.currency,
        startedAt: form.startedAt ? new Date(form.startedAt).toISOString() : null,
        endedAt: form.endedAt ? new Date(form.endedAt).toISOString() : null,
        notes: form.notes,
      });
      setFeedback(form.id ? 'Record updated.' : 'Record added.');
      resetForm();
    } catch (submitError) {
      setError(submitError);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry) {
    if (!onDelete) return;
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      await onDelete(entry);
      if (form.id === entry.id) {
        resetForm();
      }
      setFeedback('Record removed.');
    } catch (deleteError) {
      setError(deleteError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Human resources assignments</h2>
          <p className="text-sm text-slate-600">Track staffing, availability, and cost for project team members.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {summary.map((item) => (
            <div key={item.status} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs">
              <span className="font-semibold capitalize text-slate-700">{item.status.replace(/_/g, ' ')}:</span>{' '}
              <span className="text-slate-500">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 text-left">Member</th>
              <th className="px-4 py-2 text-left">Assignment</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Capacity</th>
              <th className="px-4 py-2 text-left">Allocated</th>
              <th className="px-4 py-2 text-left">Cost rate</th>
              <th className="px-4 py-2 text-left">Start</th>
              <th className="px-4 py-2 text-left">End</th>
              <th className="px-4 py-2" aria-label="actions">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {records.length ? (
              records.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">{entry.memberName}</td>
                  <td className="px-4 py-2 text-slate-600">{entry.assignmentRole ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-600 capitalize">{entry.status}</td>
                  <td className="px-4 py-2 text-slate-500">{entry.capacityHours ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-500">{entry.allocatedHours ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {entry.costRate == null ? '—' : `${entry.currency ?? 'USD'} ${Number(entry.costRate).toFixed(2)}`}
                  </td>
                  <td className="px-4 py-2 text-slate-500">{formatDate(entry.startedAt)}</td>
                  <td className="px-4 py-2 text-slate-500">{formatDate(entry.endedAt)}</td>
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
                <td colSpan={9} className="px-4 py-4 text-center text-slate-500">
                  No human resources assignments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold text-slate-900">{form.id ? 'Edit assignment' : 'Add assignment'}</h3>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="hr-member">
            Member name
          </label>
          <input
            id="hr-member"
            value={form.memberName}
            onChange={(event) => setForm((prev) => ({ ...prev, memberName: event.target.value }))}
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="hr-assignment">
            Assignment role
          </label>
          <input
            id="hr-assignment"
            value={form.assignmentRole}
            onChange={(event) => setForm((prev) => ({ ...prev, assignmentRole: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="hr-status">
            Status
          </label>
          <select
            id="hr-status"
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
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="hr-capacity">
            Capacity hours
          </label>
          <input
            id="hr-capacity"
            type="number"
            step="0.5"
            value={form.capacityHours}
            onChange={(event) => setForm((prev) => ({ ...prev, capacityHours: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="hr-allocated">
            Allocated hours
          </label>
          <input
            id="hr-allocated"
            type="number"
            step="0.5"
            value={form.allocatedHours}
            onChange={(event) => setForm((prev) => ({ ...prev, allocatedHours: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="hr-cost-rate">
            Cost rate
          </label>
          <input
            id="hr-cost-rate"
            type="number"
            step="0.01"
            value={form.costRate}
            onChange={(event) => setForm((prev) => ({ ...prev, costRate: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="hr-currency">
            Currency
          </label>
          <input
            id="hr-currency"
            value={form.currency}
            onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase().slice(0, 3) }))}
            maxLength={3}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm uppercase text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="hr-started">
            Start date
          </label>
          <input
            id="hr-started"
            type="date"
            value={form.startedAt}
            onChange={(event) => setForm((prev) => ({ ...prev, startedAt: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="hr-ended">
            End date
          </label>
          <input
            id="hr-ended"
            type="date"
            value={form.endedAt}
            onChange={(event) => setForm((prev) => ({ ...prev, endedAt: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="hr-notes">
            Notes
          </label>
          <textarea
            id="hr-notes"
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            rows={3}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        {feedback ? <p className="md:col-span-2 text-sm text-emerald-600">{feedback}</p> : null}
        {error ? (
          <p className="md:col-span-2 text-sm text-rose-600">{error.message ?? 'Unable to save record.'}</p>
        ) : null}
        <div className="md:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? 'Saving…' : form.id ? 'Update record' : 'Add record'}
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
