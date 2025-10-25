import PropTypes from 'prop-types';
import { PlusIcon } from '@heroicons/react/24/outline';
import StatusBadge from '../../common/StatusBadge.jsx';

const PROJECT_STATUS_TONES = {
  planning: { tone: 'slate', variant: 'tint' },
  in_progress: { tone: 'blue', variant: 'tint' },
  at_risk: { tone: 'amber', variant: 'outline' },
  completed: { tone: 'emerald', variant: 'outline' },
  on_hold: { tone: 'slate', variant: 'outline' },
};

function ProgressBar({ value }) {
  const numeric = Math.min(Math.max(Number(value ?? 0), 0), 100);
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className="h-2 rounded-full bg-slate-900" style={{ width: `${numeric}%` }} />
    </div>
  );
}

ProgressBar.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default function ProjectsPanel({ projects, board, canManage, onCreate, onSelect }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Projects</p>
          <p className="text-lg font-semibold text-slate-900">{projects.length} records</p>
        </div>
        {canManage ? (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <PlusIcon className="h-4 w-4" />
            New
          </button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => {
            const status = project.workspace?.status ?? project.status;
            const risk = project.workspace?.riskLevel ?? 'low';
            const riskTone = risk === 'high' ? 'text-rose-600' : risk === 'medium' ? 'text-amber-600' : 'text-emerald-600';
            const nextDue = project.workspace?.nextMilestoneDueAt ?? project.dueDate;
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => onSelect(project)}
                className="group flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{project.title}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <StatusBadge
                      status={status}
                      uppercase={false}
                      size="xs"
                      statusToneMap={PROJECT_STATUS_TONES}
                      className="capitalize"
                    />
                    <span className={`font-semibold uppercase tracking-wide ${riskTone}`}>Risk {risk}</span>
                    {project.workspace?.nextMilestone ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                        {project.workspace.nextMilestone}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-2">
                  <ProgressBar value={project.workspace?.progressPercent} />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{project.workspace?.progressPercent ?? 0}%</span>
                    <span>{nextDue ? new Date(nextDue).toLocaleDateString() : 'No due'}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Board lanes</p>
          <div className="mt-3 space-y-3">
            {board.lanes.map((lane) => (
              <div key={lane.status} className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm shadow-sm">
                <div className="flex justify-between">
                  <span className="font-semibold capitalize text-slate-900">{lane.status.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-slate-500">{lane.projects.length}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {lane.projects.slice(0, 3).map((entry) => (
                    <span key={entry.id} className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                      {entry.title}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

ProjectsPanel.propTypes = {
  projects: PropTypes.arrayOf(PropTypes.object).isRequired,
  board: PropTypes.shape({
    lanes: PropTypes.array,
  }).isRequired,
  canManage: PropTypes.bool,
  onCreate: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
};

ProjectsPanel.defaultProps = {
  canManage: true,
};
