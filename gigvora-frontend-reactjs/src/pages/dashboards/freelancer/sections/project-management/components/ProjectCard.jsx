import PropTypes from 'prop-types';
import { ArrowTopRightOnSquareIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import {
  formatCurrency,
  formatDate,
  formatPercent,
  getProjectClient,
  getProjectStatus,
  getRiskLevel,
  getProjectTags,
  getWorkspaceUrl,
} from '../utils.js';

const statusTone = {
  planning: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  at_risk: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-700',
};

const riskTone = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-rose-100 text-rose-700',
};

export default function ProjectCard({ project, onOpen, onArchive, onRestore }) {
  const status = getProjectStatus(project);
  const risk = getRiskLevel(project);
  const workspaceUrl = getWorkspaceUrl(project);
  const isArchived = Boolean(project.archivedAt);

  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <button type="button" onClick={() => onOpen(project)} className="text-left text-lg font-semibold text-slate-900 hover:text-accent">
            {project.title}
          </button>
          <p className="text-sm text-slate-600 line-clamp-3">{project.description}</p>
        </div>
        <EllipsisHorizontalIcon className="h-6 w-6 text-slate-400" />
      </header>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`inline-flex items-center rounded-full px-3 py-1 font-medium ${statusTone[status] || statusTone.planning}`}>
          {status.replace(/_/g, ' ')}
        </span>
        <span className={`inline-flex items-center rounded-full px-3 py-1 font-medium ${riskTone[risk] || riskTone.low}`}>
          {risk}
        </span>
        {getProjectTags(project).slice(0, 3).map((tag) => (
          <span key={tag} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
            #{tag}
          </span>
        ))}
      </div>
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Client</dt>
          <dd className="text-sm font-semibold text-slate-800">{getProjectClient(project)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Due</dt>
          <dd className="text-sm font-semibold text-slate-800">{formatDate(project.dueDate)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Budget</dt>
          <dd className="text-sm font-semibold text-slate-800">
            {formatCurrency(project.budgetAllocated ?? project.budget?.allocated ?? 0, project.budgetCurrency ?? project.budget?.currency ?? 'USD')}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Progress</dt>
          <dd className="text-sm font-semibold text-slate-800">{formatPercent(project.workspace?.progressPercent ?? project.lifecycle?.progressPercent ?? 0)}</dd>
        </div>
      </dl>
      <footer className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>{project.workspace?.nextMilestone || 'Next milestone pending'}</span>
          <span>•</span>
          <span>{formatDate(project.workspace?.nextMilestoneDueAt ?? project.lifecycle?.nextDueAt)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {workspaceUrl ? (
            <a
              href={workspaceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1 text-sm font-medium text-slate-700 hover:border-accent hover:text-accent"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" /> Workspace
            </a>
          ) : null}
          {isArchived ? (
            <button
              type="button"
              onClick={() => onRestore(project)}
              className="inline-flex items-center rounded-full border border-emerald-200 px-4 py-1 text-sm font-medium text-emerald-700 hover:border-emerald-300"
            >
              Restore
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onArchive(project)}
              className="inline-flex items-center rounded-full border border-rose-200 px-4 py-1 text-sm font-medium text-rose-600 hover:border-rose-300"
            >
              Archive
            </button>
          )}
        </div>
      </footer>
    </article>
  );
}

ProjectCard.propTypes = {
  project: PropTypes.object.isRequired,
  onOpen: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  onRestore: PropTypes.func.isRequired,
};
