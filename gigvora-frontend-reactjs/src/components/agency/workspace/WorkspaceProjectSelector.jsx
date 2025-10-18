import { ArrowPathIcon } from '@heroicons/react/24/outline';

function formatStatus(status) {
  if (!status) return 'Unknown';
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function WorkspaceProjectSelector({ projects = [], value, onChange, onRefresh, loading }) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm font-semibold text-slate-900">Project</div>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
        <select
          className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          value={value ?? ''}
          onChange={(event) => onChange?.(event.target.value ? Number(event.target.value) : null)}
        >
          {projects.length === 0 ? (
            <option value="">No projects available</option>
          ) : (
            projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title} · {formatStatus(project.status)}
              </option>
            ))
          )}
        </select>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="ml-2">Refresh</span>
        </button>
      </div>
    </div>
  );
}
