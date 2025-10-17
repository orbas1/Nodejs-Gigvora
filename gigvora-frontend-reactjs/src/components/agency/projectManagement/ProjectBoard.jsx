import { Fragment } from 'react';
import { Switch } from '@headlessui/react';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function SummaryCard({ label, value, highlight }) {
  return (
    <div className={classNames('flex flex-col rounded-3xl border p-5 shadow-soft', highlight ? 'border-accent/40 bg-accent/5' : 'border-slate-200 bg-white')}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="mt-2 text-2xl font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function ProjectCard({ project, onOpenProject, onOpenRoster, onQuickToggle, toggling }) {
  const skills = project.skills ?? [];
  const pendingMatches = project.autoMatchFreelancers?.filter((entry) => entry.status === 'pending').length ?? 0;
  const acceptedMatches = project.autoMatchFreelancers?.filter((entry) => entry.status === 'accepted').length ?? 0;
  const rejectedMatches = project.autoMatchFreelancers?.filter((entry) => entry.status === 'rejected').length ?? 0;

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-slate-900">{project.title}</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{project.category}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{project.status.replace(/_/g, ' ')}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{project.lifecycleState}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            checked={project.autoMatch?.enabled ?? false}
            onChange={() => onQuickToggle(project)}
            className={classNames(
              project.autoMatch?.enabled ? 'bg-accent text-white' : 'bg-slate-200 text-slate-600',
              'relative inline-flex h-9 w-16 flex-shrink-0 cursor-pointer rounded-full border border-transparent transition focus:outline-none focus:ring-2 focus:ring-accent/30',
            )}
            disabled={toggling}
          >
            <span
              aria-hidden="true"
              className={classNames(
                project.autoMatch?.enabled ? 'translate-x-7 bg-white text-accent' : 'translate-x-1 bg-white text-slate-500',
                'pointer-events-none flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shadow ring-0 transition',
              )}
            >
              {project.autoMatch?.enabled ? 'On' : 'Off'}
            </span>
          </Switch>
        </div>
      </div>

      <p className="text-sm text-slate-600">{project.description}</p>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Duration</p>
          <p className="mt-1 text-base font-semibold text-slate-900">{project.durationWeeks} weeks</p>
          <p className="text-xs text-slate-500">{project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'} → {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : '—'}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Budget</p>
          <p className="mt-1 text-base font-semibold text-slate-900">
            {project.budget?.currency} {project.budget?.allocated?.toLocaleString?.() ?? '0'}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Matches</p>
          <p className="mt-1 text-base font-semibold text-slate-900">{pendingMatches} pending</p>
          <p className="text-xs text-emerald-600">{acceptedMatches} accepted</p>
          <p className="text-xs text-rose-500">{rejectedMatches} rejected</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {skills.slice(0, 6).map((skill) => (
          <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {skill}
          </span>
        ))}
        {skills.length > 6 && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
            +{skills.length - 6}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onOpenProject(project)}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onOpenRoster(project)}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Roster
        </button>
      </div>
    </div>
  );
}

export default function ProjectBoard({
  view,
  onViewChange,
  summary,
  projects,
  queue,
  onOpenProject,
  onOpenRoster,
  onQuickToggle,
  togglingProjectId,
}) {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="All" value={summary?.totalProjects ?? 0} />
        <SummaryCard label="Open" value={summary?.openCount ?? 0} highlight={view === 'open'} />
        <SummaryCard label="Closed" value={summary?.closedCount ?? 0} highlight={view === 'closed'} />
        <SummaryCard label="Auto" value={summary?.autoMatchEnabledCount ?? 0} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => onViewChange('open')}
            className={classNames(
              view === 'open'
                ? 'rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow'
                : 'rounded-full px-4 py-2 text-sm font-semibold text-slate-500',
            )}
          >
            Open
          </button>
          <button
            type="button"
            onClick={() => onViewChange('closed')}
            className={classNames(
              view === 'closed'
                ? 'rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow'
                : 'rounded-full px-4 py-2 text-sm font-semibold text-slate-500',
            )}
          >
            Closed
          </button>
        </div>
        {queue && queue.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {queue.map((item) => (
              <Fragment key={item.projectId}>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-600">
                  {item.projectTitle}
                </span>
                <span className="text-slate-400">{item.pending.length} awaiting</span>
              </Fragment>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onOpenProject={onOpenProject}
            onOpenRoster={onOpenRoster}
            onQuickToggle={(current) => onQuickToggle(current)}
            toggling={togglingProjectId === project.id}
          />
        ))}
        {projects.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm font-medium text-slate-500">
            No projects in this view yet.
          </div>
        )}
      </div>
    </div>
  );
}
