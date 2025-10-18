import { useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function WorkspaceHeader({
  projectIdInput,
  onProjectIdChange,
  onLoadProject,
  onRefresh,
  loading,
  hasProject,
  project,
  fromCache,
  lastUpdated,
  onCreateProject,
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [createDraft, setCreateDraft] = useState({ title: '', description: '', status: 'active' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    if (creating) {
      return;
    }
    try {
      setCreating(true);
      setCreateError(null);
      await onCreateProject?.(createDraft);
      setCreateDraft({ title: '', description: '', status: 'active' });
      setShowCreate(false);
    } catch (error) {
      setCreateError(error?.message ?? 'Unable to create project.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-blue-50/50 p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-500">Project workspace</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Delivery cockpit</h2>
          <p className="mt-2 max-w-xl text-sm text-slate-600">
            Load a project to manage budgets, tasks, and collaboration in one place.
          </p>
          {project ? (
            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-800">Active project:</span> {project.title}
              </p>
              {project.description ? <p className="text-slate-500">{project.description}</p> : null}
            </div>
          ) : null}
          {fromCache ? <p className="mt-2 text-xs uppercase tracking-wide text-amber-600">Showing cached data</p> : null}
          {lastUpdated ? (
            <p className="mt-1 text-xs text-slate-500">Last updated {new Date(lastUpdated).toLocaleString()}</p>
          ) : null}
        </div>
        <div className="flex w-full max-w-md flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
          <label htmlFor="projectId" className="text-sm font-semibold text-slate-700">
            Project ID
          </label>
          <input
            id="projectId"
            name="projectId"
            value={projectIdInput}
            onChange={(event) => onProjectIdChange(event.target.value)}
            placeholder="Enter a project ID"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onLoadProject}
              disabled={!projectIdInput || loading}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Load workspace
            </button>
            <button
              type="button"
              onClick={onRefresh}
              disabled={!hasProject || loading}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setShowCreate((value) => !value)}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
            >
              <PlusIcon className="h-4 w-4" />
              {showCreate ? 'Hide builder' : 'New workspace'}
            </button>
          </div>
        </div>
      </div>

      {showCreate ? (
        <form onSubmit={handleCreateSubmit} className="mt-6 grid gap-4 rounded-2xl border border-emerald-200 bg-white/90 p-5">
          <p className="text-sm font-semibold text-emerald-700">Create a new project</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="projectTitle" className="text-sm font-medium text-slate-700">
                Project title
              </label>
              <input
                id="projectTitle"
                value={createDraft.title}
                onChange={(event) => setCreateDraft((prev) => ({ ...prev, title: event.target.value }))}
                required
                placeholder="e.g. Launch readiness program"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="projectStatus" className="text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                id="projectStatus"
                value={createDraft.status}
                onChange={(event) => setCreateDraft((prev) => ({ ...prev, status: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                <option value="active">Active</option>
                <option value="planned">Planned</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="projectDescription" className="text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="projectDescription"
              value={createDraft.description}
              onChange={(event) => setCreateDraft((prev) => ({ ...prev, description: event.target.value }))}
              required
              rows={3}
              placeholder="Outline the engagement goals, scope, or problem statement."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          {createError ? <p className="text-sm font-medium text-rose-600">{createError}</p> : null}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {creating ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

WorkspaceHeader.propTypes = {
  projectIdInput: PropTypes.string.isRequired,
  onProjectIdChange: PropTypes.func.isRequired,
  onLoadProject: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  hasProject: PropTypes.bool,
  project: PropTypes.object,
  fromCache: PropTypes.bool,
  lastUpdated: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
  onCreateProject: PropTypes.func,
};
