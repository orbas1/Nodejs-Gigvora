import { useCallback, useMemo, useState } from 'react';
import ProjectGanttChart from './ProjectGanttChart.jsx';
import ProjectAgencyDelegation from './ProjectAgencyDelegation.jsx';
import ProjectPaySplitTable from './ProjectPaySplitTable.jsx';
import { useProjectOperations } from '../../hooks/useProjectOperations.js';
import projectOperationsService from '../../services/projectOperations.js';

const DEFAULT_TASK = {
  title: '',
  ownerName: '',
  ownerType: 'agency_member',
  lane: 'Delivery',
  startDate: '',
  endDate: '',
  progressPercent: 0,
  workloadHours: '',
};

export default function ProjectOperationsSection({ projectId }) {
  const [taskDraft, setTaskDraft] = useState(DEFAULT_TASK);
  const [savingTask, setSavingTask] = useState(false);
  const {
    data: operations,
    loading,
    error,
    refresh,
    fromCache,
    lastUpdated,
  } = useProjectOperations({ projectId, enabled: Boolean(projectId) });

  const assignments = operations?.agencyAssignments ?? [];
  const splits = operations?.contributorSplits ?? [];
  const timeline = operations?.timeline ?? null;
  const tasks = useMemo(() => (Array.isArray(operations?.tasks) ? operations.tasks : []), [operations]);

  const handleFieldChange = useCallback((field) => (event) => {
    const value = event.target.value;
    setTaskDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!projectId || !taskDraft.title) {
        return;
      }
      setSavingTask(true);
      try {
        await projectOperationsService.addProjectTask(projectId, {
          ...taskDraft,
          workloadHours: taskDraft.workloadHours ? Number(taskDraft.workloadHours) : undefined,
        });
        setTaskDraft(DEFAULT_TASK);
        await refresh({ force: true });
      } catch (submitError) {
        console.error('Failed to add project task', submitError);
      } finally {
        setSavingTask(false);
      }
    },
    [projectId, taskDraft, refresh],
  );

  return (
    <section className="space-y-6 rounded-4xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 shadow-xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">Project operations</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">Enterprise PMO cockpit</h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Create interactive Gantt plans, delegate agency workloads, and orchestrate contributor pay splits for every
            delivery pod.
          </p>
        </div>
        <div className="text-xs text-slate-500">
          {loading ? 'Syncing…' : fromCache ? 'Showing cached schedule' : lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : null}
        </div>
      </header>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error.message || 'Unable to load project operations right now.'}
        </div>
      ) : null}

      <ProjectGanttChart timeline={timeline} tasks={tasks} />

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Add timeline entry</h4>
          <button
            type="submit"
            disabled={savingTask || !taskDraft.title}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingTask ? 'Saving…' : 'Add task'}
          </button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-900">Title</span>
            <input
              type="text"
              required
              value={taskDraft.title}
              onChange={handleFieldChange('title')}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder="Milestone name"
            />
          </label>
          <label className="space-y-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-900">Owner</span>
            <input
              type="text"
              value={taskDraft.ownerName}
              onChange={handleFieldChange('ownerName')}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder="Assigned leader"
            />
          </label>
          <label className="space-y-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-900">Workstream</span>
            <input
              type="text"
              value={taskDraft.lane}
              onChange={handleFieldChange('lane')}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder="Delivery lane"
            />
          </label>
          <label className="space-y-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-900">Start date</span>
            <input
              type="date"
              value={taskDraft.startDate}
              onChange={handleFieldChange('startDate')}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </label>
          <label className="space-y-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-900">End date</span>
            <input
              type="date"
              value={taskDraft.endDate}
              onChange={handleFieldChange('endDate')}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </label>
          <label className="space-y-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-900">Progress (%)</span>
            <input
              type="number"
              min="0"
              max="100"
              value={taskDraft.progressPercent}
              onChange={handleFieldChange('progressPercent')}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </label>
          <label className="space-y-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-900">Workload (hrs)</span>
            <input
              type="number"
              min="0"
              value={taskDraft.workloadHours}
              onChange={handleFieldChange('workloadHours')}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </label>
        </div>
      </form>

      <ProjectAgencyDelegation assignments={assignments} />
      <ProjectPaySplitTable splits={splits} />
    </section>
  );
}
