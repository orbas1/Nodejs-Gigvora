export default function AccessDeniedPanel({ availableDashboards, onNavigate }) {
  return (
    <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-6 text-slate-700">
      <h2 className="text-xl font-semibold text-rose-700">Access restricted</h2>
      <p className="mt-2 text-sm">
        The company talent acquisition hub is only available to workspace members with the company role. Contact your
        administrator to request access or switch to another dashboard below.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {(availableDashboards ?? []).map((dashboard) => (
          <button
            key={dashboard}
            type="button"
            onClick={() => onNavigate?.(dashboard)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
          >
            Switch to {dashboard.charAt(0).toUpperCase() + dashboard.slice(1)} dashboard
          </button>
        ))}
      </div>
    </div>
  );
}
