import { useCallback } from 'react';

export default function RoleAssignmentEditor({ value = [], onChange, templates = [] }) {
  const handleChange = useCallback(
    (index, field, newValue) => {
      if (!onChange) {
        return;
      }
      const next = value.map((assignment, assignmentIndex) => {
        if (assignmentIndex !== index) {
          return assignment;
        }
        return { ...assignment, [field]: newValue };
      });
      onChange(next);
    },
    [onChange, value],
  );

  const handleRoleSelect = useCallback(
    (index, roleKey) => {
      if (!onChange) {
        return;
      }
      const template = templates.find((item) => item.roleKey === roleKey) ?? null;
      const next = value.map((assignment, assignmentIndex) => {
        if (assignmentIndex !== index) {
          return assignment;
        }
        return {
          ...assignment,
          roleKey,
          roleLabel: template?.roleLabel ?? assignment.roleLabel ?? roleKey,
          permissions: template?.permissions ?? assignment.permissions ?? [],
        };
      });
      onChange(next);
    },
    [onChange, templates, value],
  );

  const handleAdd = useCallback(() => {
    if (!onChange) {
      return;
    }
    const template = templates[0] ?? null;
    onChange([
      ...value,
      {
        id: `role-${Date.now()}`,
        roleKey: template?.roleKey ?? '',
        roleLabel: template?.roleLabel ?? '',
        assigneeName: '',
        assigneeEmail: '',
        permissions: template?.permissions ?? [],
      },
    ]);
  }, [onChange, templates, value]);

  const handleRemove = useCallback(
    (index) => {
      if (!onChange) {
        return;
      }
      onChange(value.filter((_, assignmentIndex) => assignmentIndex !== index));
    },
    [onChange, value],
  );

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleAdd}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
      >
        Add role
      </button>
      <div className="space-y-4">
        {value.map((assignment, index) => (
          <div key={assignment.id ?? index} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</label>
                <select
                  value={assignment.roleKey ?? ''}
                  onChange={(event) => handleRoleSelect(index, event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  <option value="">Select role</option>
                  {templates.map((template) => (
                    <option key={template.roleKey} value={template.roleKey}>
                      {template.roleLabel ?? template.roleKey}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Display name</label>
                <input
                  type="text"
                  value={assignment.roleLabel ?? ''}
                  onChange={(event) => handleChange(index, 'roleLabel', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assignee name</label>
                <input
                  type="text"
                  value={assignment.assigneeName ?? ''}
                  onChange={(event) => handleChange(index, 'assigneeName', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assignee email</label>
                <input
                  type="email"
                  value={assignment.assigneeEmail ?? ''}
                  onChange={(event) => handleChange(index, 'assigneeEmail', event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Permissions</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {(assignment.permissions ?? []).map((permission) => (
                  <span
                    key={permission}
                    className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600"
                  >
                    {permission}
                  </span>
                ))}
                {!(assignment.permissions ?? []).length ? (
                  <span className="text-[11px] text-slate-400">No permissions</span>
                ) : null}
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="inline-flex items-center rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {!value.length ? (
          <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
            No role assignments configured.
          </p>
        ) : null}
      </div>
    </div>
  );
}
