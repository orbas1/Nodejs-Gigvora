import PropTypes from 'prop-types';
import { formatDate, formatPercent, getProjectStatus, getRiskLevel } from '../utils.js';

const STATUS_COLUMNS = [
  { id: 'planning', label: 'Planning' },
  { id: 'in_progress', label: 'Active' },
  { id: 'at_risk', label: 'At risk' },
  { id: 'completed', label: 'Completed' },
];

export default function ProjectKanban({ projects, onOpen }) {
  const columns = STATUS_COLUMNS.map((column) => ({
    ...column,
    items: projects.filter((project) => getProjectStatus(project) === column.id),
  }));

  if (!projects.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/70 p-10 text-center text-sm text-slate-500">
        No projects available for Kanban view yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
      {columns.map((column) => (
        <section key={column.id} className="flex min-h-[16rem] flex-col rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <header className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">{column.label}</h4>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{column.items.length}</span>
          </header>
          <div className="mt-3 space-y-3">
            {column.items.length ? (
              column.items.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => onOpen?.(project)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left text-xs text-slate-600 transition hover:border-blue-300 hover:text-slate-900"
                >
                  <p className="text-sm font-semibold text-slate-900">{project.title ?? 'Untitled project'}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">{getRiskLevel(project)} risk</p>
                  <p className="mt-2 text-xs">Due {formatDate(project.dueDate)}</p>
                  <p className="mt-1 text-xs">Progress {formatPercent(project.workspace?.progressPercent ?? 0)}</p>
                </button>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-400">
                No projects in this column.
              </p>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

ProjectKanban.propTypes = {
  projects: PropTypes.arrayOf(PropTypes.object),
  onOpen: PropTypes.func,
};

ProjectKanban.defaultProps = {
  projects: [],
  onOpen: undefined,
};
