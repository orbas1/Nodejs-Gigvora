import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { formatRelativeTime } from '../../utils/date.js';

const PROJECT_STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'at_risk', label: 'At risk' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
];

function ProjectLifecyclePanel({ lifecycle, onUpdateWorkspace, canManage, onPreviewProject }) {
  const { open = [], closed = [], stats = {} } = lifecycle ?? {};
  const [drafts, setDrafts] = useState({});
  const [updating, setUpdating] = useState({});
  const [feedback, setFeedback] = useState(null);

  const openProjects = useMemo(
    () =>
      open.map((project) => ({
        id: project.id,
        title: project.title,
        status: project.workspace?.status ?? project.status,
        progressPercent: Number(project.workspace?.progressPercent ?? 0),
        nextMilestone: project.workspace?.nextMilestone ?? project.milestones?.[0]?.title ?? 'Next milestone',
        nextMilestoneDueAt: project.workspace?.nextMilestoneDueAt ?? project.dueDate ?? null,
      })),
    [open],
  );

  const closedProjects = useMemo(
    () =>
      closed.map((project) => ({
        id: project.id,
        title: project.title,
        completedAt: project.workspace?.completedAt ?? project.updatedAt ?? project.dueDate ?? null,
        progressPercent: Number(project.workspace?.progressPercent ?? 100),
      })),
    [closed],
  );

  const handleDraftChange = (projectId, field, value) => {
    setDrafts((current) => ({
      ...current,
      [projectId]: {
        ...current[projectId],
        [field]: value,
      },
    }));
  };

  const handleUpdate = async (projectId) => {
    if (!onUpdateWorkspace) {
      return;
    }
    const payload = {};
    const draft = drafts[projectId] ?? {};
    if (draft.status) {
      payload.status = draft.status;
    }
    if (draft.progressPercent != null && draft.progressPercent !== '') {
      payload.progressPercent = Number(draft.progressPercent);
    }
    if (draft.nextMilestoneDueAt) {
      payload.nextMilestoneDueAt = draft.nextMilestoneDueAt;
    }
    if (draft.nextMilestone) {
      payload.nextMilestone = draft.nextMilestone;
    }
    setUpdating((current) => ({ ...current, [projectId]: true }));
    setFeedback(null);
    try {
      await onUpdateWorkspace(projectId, payload);
      setDrafts((current) => {
        const next = { ...current };
        delete next[projectId];
        return next;
      });
      setFeedback({ tone: 'success', message: 'Project updated.' });
    } catch (error) {
      setFeedback({ tone: 'error', message: error?.message ?? 'Update failed.' });
    } finally {
      setUpdating((current) => {
        const next = { ...current };
        delete next[projectId];
        return next;
      });
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-semibold text-slate-900">Projects</h3>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
              Open {stats.openCount ?? openProjects.length}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
              Closed {stats.closedCount ?? closedProjects.length}
            </span>
          </div>
        </div>
        {feedback ? (
          <div
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              feedback.tone === 'success'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-600'
            }`}
          >
            {feedback.message}
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">Open</h4>
            <p className="text-xs text-slate-500">
              Avg progress {(stats.openAverageProgress ?? 0).toFixed?.(0) ?? stats.openAverageProgress ?? 0}%
            </p>
          </div>
          {openProjects.length ? (
            openProjects.map((project) => {
              const draft = drafts[project.id] ?? {};
              const isUpdating = Boolean(updating[project.id]);
              return (
                <div key={project.id} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{project.title}</p>
                      <p className="text-xs text-slate-500">
                        {project.nextMilestone ?? 'Next milestone'} ·{' '}
                        {project.nextMilestoneDueAt ? formatRelativeTime(project.nextMilestoneDueAt) : 'No date'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        {(project.status ?? 'planning').replace(/_/g, ' ')}
                      </span>
                      {onPreviewProject ? (
                        <button
                          type="button"
                          onClick={() => onPreviewProject(project.id)}
                          className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                        >
                          View
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                      <select
                        value={draft.status ?? project.status ?? 'planning'}
                        onChange={(event) => handleDraftChange(project.id, 'status', event.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                        disabled={!canManage || isUpdating}
                      >
                        {PROJECT_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Progress (%)
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={draft.progressPercent ?? project.progressPercent ?? 0}
                        onChange={(event) => handleDraftChange(project.id, 'progressPercent', event.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                        disabled={!canManage || isUpdating}
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:col-span-2">
                      Next milestone
                      <input
                        type="text"
                        value={draft.nextMilestone ?? project.nextMilestone ?? ''}
                        onChange={(event) => handleDraftChange(project.id, 'nextMilestone', event.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="Demo day"
                        disabled={!canManage || isUpdating}
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Due date
                      <input
                        type="date"
                        value={
                          draft.nextMilestoneDueAt ?? (project.nextMilestoneDueAt ? project.nextMilestoneDueAt.slice(0, 10) : '')
                        }
                        onChange={(event) => handleDraftChange(project.id, 'nextMilestoneDueAt', event.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                        disabled={!canManage || isUpdating}
                      />
                    </label>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleUpdate(project.id)}
                      className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-600"
                      disabled={!canManage || isUpdating}
                    >
                      {isUpdating ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
              No open projects
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-700">Closed</h4>
          {closedProjects.length ? (
            <ul className="space-y-3">
              {closedProjects.slice(0, 8).map((project) => (
                <li
                  key={project.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                >
                  <span className="font-semibold text-slate-900">{project.title}</span>
                  <span className="text-xs text-slate-500">
                    {project.completedAt ? formatRelativeTime(project.completedAt) : 'Closed'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
              No closed projects yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

ProjectLifecyclePanel.propTypes = {
  lifecycle: PropTypes.shape({
    open: PropTypes.array,
    closed: PropTypes.array,
    stats: PropTypes.object,
  }).isRequired,
  onUpdateWorkspace: PropTypes.func,
  canManage: PropTypes.bool,
  onPreviewProject: PropTypes.func,
};

ProjectLifecyclePanel.defaultProps = {
  onUpdateWorkspace: undefined,
  canManage: false,
  onPreviewProject: undefined,
};

export default ProjectLifecyclePanel;
