import { useMemo } from 'react';

export default function AgencyBlogWorkspaceSelector({ workspaces = [], value, onChange, loading, error }) {
  const options = useMemo(
    () =>
      workspaces.map((workspace) => ({
        id: workspace.id,
        label: workspace.name,
        slug: workspace.slug,
        role: workspace.role,
      })),
    [workspaces],
  );

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-600 shadow-soft">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-600 shadow-soft">
        Retry later.
      </div>
    );
  }

  if (!options.length) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm font-semibold text-amber-700 shadow-soft">
        No workspace.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <p className="text-sm font-semibold text-slate-900">Workspace</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((workspace) => {
          const isSelected = value === workspace.id;
          return (
            <button
              key={workspace.id}
              type="button"
              onClick={() => onChange?.(workspace.id)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                isSelected
                  ? 'border-accent/60 bg-accentSoft text-accentDark shadow-soft'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-accent/40 hover:shadow-sm'
              }`}
            >
              <p className="text-sm font-semibold">{workspace.label}</p>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{workspace.slug}</p>
              {workspace.role ? (
                <p className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {workspace.role.replace(/_/g, ' ')}
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
