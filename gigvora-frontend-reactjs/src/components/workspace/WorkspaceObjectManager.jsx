import { useMemo, useState } from 'react';

const OBJECT_TYPES = ['deliverable', 'asset', 'milestone', 'requirement', 'risk'];
const STATUSES = ['draft', 'active', 'blocked', 'completed'];

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString();
}

function toInputDate(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
}

const defaultForm = {
  id: null,
  name: '',
  objectType: 'deliverable',
  status: 'draft',
  ownerName: '',
  description: '',
  dueAt: '',
  tags: '',
};

export default function WorkspaceObjectManager({ objects = [], onSave, onDelete }) {
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  const summary = useMemo(() => {
    return STATUSES.map((status) => ({
      status,
      count: objects.filter((item) => item.status === status).length,
    }));
  }, [objects]);

  function handleEdit(entry) {
    setForm({
      id: entry.id,
      name: entry.name ?? '',
      objectType: entry.objectType ?? 'deliverable',
      status: entry.status ?? 'draft',
      ownerName: entry.ownerName ?? '',
      description: entry.description ?? '',
      dueAt: toInputDate(entry.dueAt),
      tags: (entry.tags ?? []).join(', '),
    });
    setFeedback(null);
    setError(null);
  }

  function resetForm() {
    setForm(defaultForm);
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
        name: form.name,
        objectType: form.objectType,
        status: form.status,
        ownerName: form.ownerName,
        description: form.description,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
        tags: form.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      setFeedback(form.id ? 'Task updated.' : 'Task created.');
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
      setFeedback('Task removed.');
    } catch (deleteError) {
      setError(deleteError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Project tasks & deliverables</h2>
          <p className="text-sm text-slate-600">
            Organise deliverables, assign owners, and control status updates for every work object.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {summary.map((item) => (
            <div key={item.status} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
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
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Owner</th>
              <th className="px-4 py-2 text-left">Due</th>
              <th className="px-4 py-2 text-left">Tags</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2" aria-label="actions">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {objects.length ? (
              objects.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">{entry.name}</td>
                  <td className="px-4 py-2 capitalize text-slate-600">{entry.objectType}</td>
                  <td className="px-4 py-2 capitalize text-slate-600">{entry.status}</td>
                  <td className="px-4 py-2 text-slate-600">{entry.ownerName ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-600">{formatDate(entry.dueAt)}</td>
                  <td className="px-4 py-2 text-slate-500">{(entry.tags ?? []).join(', ') || '—'}</td>
                  <td className="px-4 py-2 text-slate-500">{entry.description ?? '—'}</td>
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
                <td colSpan={8} className="px-4 py-4 text-center text-slate-500">
                  No workspace objects yet. Add deliverables to begin task tracking.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold text-slate-900">{form.id ? 'Edit task' : 'Add task'}</h3>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="object-name">
            Name
          </label>
          <input
            id="object-name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Task name"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="object-type">
            Type
          </label>
          <select
            id="object-type"
            value={form.objectType}
            onChange={(event) => setForm((prev) => ({ ...prev, objectType: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {OBJECT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="object-status">
            Status
          </label>
          <select
            id="object-status"
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
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="object-owner">
            Owner
          </label>
          <input
            id="object-owner"
            value={form.ownerName}
            onChange={(event) => setForm((prev) => ({ ...prev, ownerName: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Responsible person"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="object-due">
            Due date
          </label>
          <input
            id="object-due"
            type="datetime-local"
            value={form.dueAt}
            onChange={(event) => setForm((prev) => ({ ...prev, dueAt: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="object-tags">
            Tags (comma separated)
          </label>
          <input
            id="object-tags"
            value={form.tags}
            onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="design, launch, qa"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="object-description">
            Description
          </label>
          <textarea
            id="object-description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            rows={3}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        {feedback ? <p className="md:col-span-2 text-sm text-emerald-600">{feedback}</p> : null}
        {error ? (
          <p className="md:col-span-2 text-sm text-rose-600">{error.message ?? 'Unable to save task.'}</p>
        ) : null}
        <div className="md:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? 'Saving…' : form.id ? 'Update task' : 'Add task'}
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
