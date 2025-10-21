import { useMemo, useState } from 'react';
import WorkspaceSummary from './WorkspaceSummary.jsx';
import WorkspaceGanttChart from './WorkspaceGanttChart.jsx';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'at_risk', label: 'At risk' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On hold' },
];

const RISK_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

function trimText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function optionalText(value) {
  if (value == null) {
    return '';
  }
  return typeof value === 'string' ? value.trim() : String(value);
}

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clampPercent(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.min(100, Math.max(0, parsed));
}

export default function WorkspaceOverviewTab({
  project,
  workspace,
  summary,
  timeline,
  objectives = [],
  tasks = [],
  onUpdateSummary,
  onCreateObjective,
  onUpdateObjective,
  onDeleteObjective,
}) {
  const [objectiveForm, setObjectiveForm] = useState(null);
  const [summaryForm, setSummaryForm] = useState({
    title: project?.title ?? '',
    description: project?.description ?? '',
    status: workspace?.status ?? 'planning',
    progressPercent: workspace?.progressPercent ?? 0,
    riskLevel: workspace?.riskLevel ?? 'low',
    nextMilestone: workspace?.nextMilestone ?? '',
    nextMilestoneDueAt: workspace?.nextMilestoneDueAt ? workspace.nextMilestoneDueAt.slice(0, 10) : '',
    notes: workspace?.notes ?? '',
  });

  const computedTimeline = useMemo(() => {
    if (!timeline) {
      return null;
    }
    const start = new Date(timeline.startDate);
    const end = new Date(timeline.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return null;
    }
    const formatter = new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric' });
    return `${formatter.format(start)} → ${formatter.format(end)}`;
  }, [timeline]);

  const editingObjective = objectiveForm?.id
    ? objectives.find((objective) => objective.id === objectiveForm.id)
    : null;

  return (
    <div className="space-y-10">
      <WorkspaceSummary summary={summary} />

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-slate-900">Project description</h2>
        <p className="mt-1 text-xs text-slate-500">Update high-level context, delivery status, and upcoming milestones.</p>
        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onUpdateSummary?.({
              title: trimText(summaryForm.title),
              description: optionalText(summaryForm.description),
              status: summaryForm.status,
              riskLevel: summaryForm.riskLevel,
              progressPercent: clampPercent(summaryForm.progressPercent),
              nextMilestone: optionalText(summaryForm.nextMilestone),
              nextMilestoneDueAt: summaryForm.nextMilestoneDueAt || '',
              notes: optionalText(summaryForm.notes),
            });
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Title
              <input
                type="text"
                value={summaryForm.title}
                onChange={(event) => setSummaryForm((form) => ({ ...form, title: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
              <select
                value={summaryForm.status}
                onChange={(event) => setSummaryForm((form) => ({ ...form, status: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Risk level
              <select
                value={summaryForm.riskLevel}
                onChange={(event) => setSummaryForm((form) => ({ ...form, riskLevel: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {RISK_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Progress (%)
              <input
                type="number"
                min="0"
                max="100"
                value={summaryForm.progressPercent}
                onChange={(event) => setSummaryForm((form) => ({ ...form, progressPercent: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>
          <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Description
            <textarea
              value={summaryForm.description}
              onChange={(event) => setSummaryForm((form) => ({ ...form, description: event.target.value }))}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Next milestone
              <input
                type="text"
                value={summaryForm.nextMilestone}
                onChange={(event) => setSummaryForm((form) => ({ ...form, nextMilestone: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Due date
              <input
                type="date"
                value={summaryForm.nextMilestoneDueAt}
                onChange={(event) => setSummaryForm((form) => ({ ...form, nextMilestoneDueAt: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>
          <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Notes
            <textarea
              value={summaryForm.notes}
              onChange={(event) => setSummaryForm((form) => ({ ...form, notes: event.target.value }))}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark"
            >
              Save summary
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Objectives</h2>
            <p className="text-xs text-slate-500">Track measurable outcomes and who is accountable.</p>
          </div>
          {computedTimeline ? <span className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold text-slate-600">Timeline {computedTimeline}</span> : null}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {objectives.map((objective) => (
            <div key={objective.id} className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{objective.title}</p>
                  <p className="text-xs text-slate-500">{objective.description || 'No description provided'}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {objective.ownerName ? `Owner: ${objective.ownerName}` : 'Unassigned'} · {objective.status ?? 'Status unknown'}
                  </p>
                  {objective.metric ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {objective.metric}: {objective.currentValue ?? 0} / {objective.targetValue ?? 0}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setObjectiveForm({
                        id: objective.id,
                        title: objective.title,
                        description: objective.description ?? '',
                        ownerName: objective.ownerName ?? '',
                        metric: objective.metric ?? '',
                        targetValue: objective.targetValue ?? '',
                        currentValue: objective.currentValue ?? '',
                        status: objective.status ?? 'on_track',
                        dueDate: objective.dueDate ? objective.dueDate.slice(0, 10) : '',
                        weight: objective.weight ?? '',
                      })
                    }
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteObjective?.(objective.id)}
                    className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <form
          className="mt-6 space-y-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!objectiveForm?.title) {
              return;
            }
            const payload = {
              title: trimText(objectiveForm.title),
              description: optionalText(objectiveForm.description),
              ownerName: optionalText(objectiveForm.ownerName),
              metric: optionalText(objectiveForm.metric),
              targetValue: toNumberOrNull(objectiveForm.targetValue),
              currentValue: toNumberOrNull(objectiveForm.currentValue),
              status: optionalText(objectiveForm.status) || 'on_track',
              dueDate: objectiveForm.dueDate || '',
              weight: toNumberOrNull(objectiveForm.weight),
            };
            if (objectiveForm.id) {
              onUpdateObjective?.(objectiveForm.id, payload);
            } else {
              onCreateObjective?.(payload);
            }
            setObjectiveForm(null);
          }}
        >
          <p className="text-sm font-semibold text-slate-900">{editingObjective ? 'Edit objective' : 'Add objective'}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Title
              <input
                type="text"
                value={objectiveForm?.title ?? ''}
                onChange={(event) => setObjectiveForm((form) => ({ ...(form ?? {}), title: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Owner
              <input
                type="text"
                value={objectiveForm?.ownerName ?? ''}
                onChange={(event) => setObjectiveForm((form) => ({ ...(form ?? {}), ownerName: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Metric
              <input
                type="text"
                value={objectiveForm?.metric ?? ''}
                onChange={(event) => setObjectiveForm((form) => ({ ...(form ?? {}), metric: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Target value
              <input
                type="number"
                step="0.01"
                value={objectiveForm?.targetValue ?? ''}
                onChange={(event) => setObjectiveForm((form) => ({ ...(form ?? {}), targetValue: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Current value
              <input
                type="number"
                step="0.01"
                value={objectiveForm?.currentValue ?? ''}
                onChange={(event) => setObjectiveForm((form) => ({ ...(form ?? {}), currentValue: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
              <input
                type="text"
                value={objectiveForm?.status ?? 'on_track'}
                onChange={(event) => setObjectiveForm((form) => ({ ...(form ?? {}), status: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Due date
              <input
                type="date"
                value={objectiveForm?.dueDate ?? ''}
                onChange={(event) => setObjectiveForm((form) => ({ ...(form ?? {}), dueDate: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Weight
              <input
                type="number"
                value={objectiveForm?.weight ?? ''}
                onChange={(event) => setObjectiveForm((form) => ({ ...(form ?? {}), weight: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>
          <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Notes
            <textarea
              value={objectiveForm?.description ?? ''}
              onChange={(event) => setObjectiveForm((form) => ({ ...(form ?? {}), description: event.target.value }))}
              rows={2}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <div className="flex justify-between">
            {objectiveForm?.id ? (
              <button
                type="button"
                onClick={() => setObjectiveForm(null)}
                className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
              >
                Cancel edit
              </button>
            ) : null}
            <button
              type="submit"
              className={classNames(
                'inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition',
                'hover:bg-slate-700',
              )}
            >
              {objectiveForm?.id ? 'Save objective' : 'Add objective'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-slate-900">Timeline & sprint view</h2>
        <p className="text-xs text-slate-500">Visualise delivery stages to spot bottlenecks and overlapping workloads.</p>
        <div className="mt-4">
          <WorkspaceGanttChart tasks={tasks} />
        </div>
      </div>
    </div>
  );
}
