import { useMemo, useState } from 'react';

const STATUSES = ['active', 'pending', 'inactive', 'offboarded'];

export default function WorkspaceRoleManager({ roles = [], onSave, onDelete }) {
  const [form, setForm] = useState({
    id: null,
    memberName: '',
    email: '',
    role: '',
    status: 'active',
    permissions: '',
    responsibilities: '',
    capacityHours: '',
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  const summary = useMemo(() => {
    return STATUSES.map((status) => ({
      status,
      count: roles.filter((role) => role.status === status).length,
    }));
  }, [roles]);

  function handleEdit(entry) {
    setForm({
      id: entry.id,
      memberName: entry.memberName ?? '',
      email: entry.email ?? '',
      role: entry.role ?? '',
      status: entry.status ?? 'active',
      permissions: (entry.permissions ?? []).join(', '),
      responsibilities: (entry.responsibilities ?? []).join(', '),
      capacityHours: entry.capacityHours ?? '',
    });
    setFeedback(null);
    setError(null);
  }

  function resetForm() {
    setForm({
      id: null,
      memberName: '',
      email: '',
      role: '',
      status: 'active',
      permissions: '',
      responsibilities: '',
      capacityHours: '',
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
        email: form.email,
        role: form.role,
        status: form.status,
        permissions: form.permissions
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        responsibilities: form.responsibilities
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        capacityHours: form.capacityHours === '' ? null : Number(form.capacityHours),
      });
      setFeedback(form.id ? 'Role updated.' : 'Role added.');
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
      setFeedback('Role removed.');
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
          <h2 className="text-2xl font-semibold text-slate-900">Project roles</h2>
          <p className="text-sm text-slate-600">Assign responsibilities and keep capacity visible for each contributor.</p>
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
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Capacity (hrs)</th>
              <th className="px-4 py-2 text-left">Permissions</th>
              <th className="px-4 py-2 text-left">Responsibilities</th>
              <th className="px-4 py-2" aria-label="actions">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {roles.length ? (
              roles.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">{entry.memberName}</td>
                  <td className="px-4 py-2 text-slate-600">{entry.role}</td>
                  <td className="px-4 py-2 text-slate-600 capitalize">{entry.status}</td>
                  <td className="px-4 py-2 text-slate-500">{entry.email ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-500">{entry.capacityHours ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-500">{(entry.permissions ?? []).join(', ') || '—'}</td>
                  <td className="px-4 py-2 text-slate-500">{(entry.responsibilities ?? []).join(', ') || '—'}</td>
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
                  No project roles assigned yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold text-slate-900">{form.id ? 'Edit role' : 'Add role'}</h3>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="role-member">
            Member name
          </label>
          <input
            id="role-member"
            value={form.memberName}
            onChange={(event) => setForm((prev) => ({ ...prev, memberName: event.target.value }))}
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="role-email">
            Email
          </label>
          <input
            id="role-email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="role-role">
            Role title
          </label>
          <input
            id="role-role"
            value={form.role}
            onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="role-status">
            Status
          </label>
          <select
            id="role-status"
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
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="role-capacity">
            Capacity hours
          </label>
          <input
            id="role-capacity"
            type="number"
            step="0.5"
            value={form.capacityHours}
            onChange={(event) => setForm((prev) => ({ ...prev, capacityHours: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="role-permissions">
            Permissions (comma separated)
          </label>
          <input
            id="role-permissions"
            value={form.permissions}
            onChange={(event) => setForm((prev) => ({ ...prev, permissions: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="role-responsibilities">
            Responsibilities (comma separated)
          </label>
          <input
            id="role-responsibilities"
            value={form.responsibilities}
            onChange={(event) => setForm((prev) => ({ ...prev, responsibilities: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        {feedback ? <p className="md:col-span-2 text-sm text-emerald-600">{feedback}</p> : null}
        {error ? (
          <p className="md:col-span-2 text-sm text-rose-600">{error.message ?? 'Unable to save role.'}</p>
        ) : null}
        <div className="md:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? 'Saving…' : form.id ? 'Update role' : 'Add role'}
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
