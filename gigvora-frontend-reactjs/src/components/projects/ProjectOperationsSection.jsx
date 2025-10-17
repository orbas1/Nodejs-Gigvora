import { Fragment, useCallback, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
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
  status: 'planned',
  riskLevel: 'low',
  startDate: '',
  endDate: '',
  progressPercent: 0,
  workloadHours: '',
  notes: '',
};

const laneOptions = [
  { label: 'Discovery', value: 'Discovery' },
  { label: 'Delivery', value: 'Delivery' },
  { label: 'QA & Enablement', value: 'QA & Enablement' },
  { label: 'Change Management', value: 'Change Management' },
  { label: 'Launch', value: 'Launch' },
];

const ownerTypeOptions = [
  { label: 'Agency lead', value: 'agency_member' },
  { label: 'Internal stakeholder', value: 'company_member' },
  { label: 'Freelancer', value: 'freelancer' },
  { label: 'Vendor partner', value: 'vendor' },
];

const statusOptions = [
  { label: 'Planned', value: 'planned' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'At risk', value: 'at_risk' },
  { label: 'Completed', value: 'completed' },
];

const riskOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
];

const statusOrder = statusOptions.map((option) => option.value);

const statusProgressDefaults = {
  planned: 10,
  in_progress: 35,
  blocked: 35,
  at_risk: 60,
  completed: 100,
};

function formatDateForInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' ? value : '';
  }
  return date.toISOString().slice(0, 10);
}

function sanitiseTaskPayload(draft) {
  const payload = {
    title: draft.title.trim(),
    ownerName: draft.ownerName?.trim() || undefined,
    ownerType: draft.ownerType || undefined,
    lane: draft.lane,
    status: draft.status,
    riskLevel: draft.riskLevel,
    startDate: draft.startDate || undefined,
    endDate: draft.endDate || undefined,
    notes: draft.notes?.trim() ? draft.notes.trim() : undefined,
  };

  if (draft.progressPercent !== '' && draft.progressPercent != null) {
    const progressValue = Math.max(0, Math.min(100, Number(draft.progressPercent)));
    if (!Number.isNaN(progressValue)) {
      payload.progressPercent = progressValue;
    }
  }

  if (draft.workloadHours !== '' && draft.workloadHours != null) {
    const workloadValue = Math.max(0, Number(draft.workloadHours));
    if (!Number.isNaN(workloadValue)) {
      payload.workloadHours = workloadValue;
    }
  }

  return payload;
}

function buildTaskDiff(original, draft) {
  const sanitised = sanitiseTaskPayload(draft);
  const diff = {};

  Object.entries(sanitised).forEach(([key, value]) => {
    if (!original) {
      diff[key] = value;
      return;
    }

    if (key === 'startDate' || key === 'endDate') {
      const originalDate = original[key] ? formatDateForInput(original[key]) : '';
      const nextDate = value ?? '';
      if (originalDate !== nextDate) {
        diff[key] = nextDate || null;
      }
      return;
    }

    if (key === 'progressPercent') {
      const originalProgress =
        original.progressPercent == null ? null : Math.round(Number(original.progressPercent));
      const nextProgress = value == null ? null : Math.round(Number(value));
      if (originalProgress !== nextProgress) {
        diff[key] = nextProgress;
      }
      return;
    }

    if (key === 'workloadHours') {
      const originalWorkload = original.workloadHours == null ? null : Number(original.workloadHours);
      const nextWorkload = value == null ? null : Number(value);
      if (originalWorkload !== nextWorkload) {
        diff[key] = nextWorkload;
      }
      return;
    }

    const originalValue = original[key];
    const normalizedOriginal =
      originalValue == null || originalValue === '' ? undefined : String(originalValue).trim();
    const normalizedNext =
      value == null || value === '' ? undefined : typeof value === 'string' ? value.trim() : value;

    if (normalizedOriginal !== normalizedNext) {
      diff[key] = value;
    }
  });

  return diff;
}

function validateTask(draft) {
  const errors = {};
  const title = draft.title?.trim();
  if (!title) {
    errors.title = 'Enter a task title';
  }
  if (!draft.lane) {
    errors.lane = 'Select a workstream';
  }
  if (!draft.status) {
    errors.status = 'Select a status';
  }
  if (!draft.riskLevel) {
    errors.riskLevel = 'Select a risk level';
  }
  const start = draft.startDate ? new Date(draft.startDate) : null;
  const end = draft.endDate ? new Date(draft.endDate) : null;
  if (start && Number.isNaN(start.getTime())) {
    errors.startDate = 'Enter a valid start date';
  }
  if (end && Number.isNaN(end.getTime())) {
    errors.endDate = 'Enter a valid end date';
  }
  if (start && end && end < start) {
    errors.endDate = 'End date cannot be before the start date';
  }
  const progressValue = Number(draft.progressPercent);
  if (draft.progressPercent !== '' && (Number.isNaN(progressValue) || progressValue < 0 || progressValue > 100)) {
    errors.progressPercent = 'Progress must be between 0 and 100';
  }
  if (draft.workloadHours !== '' && draft.workloadHours != null) {
    const workloadValue = Number(draft.workloadHours);
    if (Number.isNaN(workloadValue) || workloadValue < 0) {
      errors.workloadHours = 'Enter a positive workload estimate';
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

function TaskFormFields({ value, errors = {}, onChange, disabled = false }) {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <label className="space-y-1 text-xs text-slate-500">
        <span className="font-semibold text-slate-900">Title</span>
        <input
          type="text"
          required
          value={value.title}
          onChange={(event) => onChange('title', event.target.value)}
          className={`w-full rounded-2xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
            errors.title
              ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-200'
              : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-200'
          }`}
          placeholder="Milestone name"
          disabled={disabled}
        />
        {errors.title ? <span className="block text-rose-500">{errors.title}</span> : null}
      </label>
      <label className="space-y-1 text-xs text-slate-500">
        <span className="font-semibold text-slate-900">Owner</span>
        <input
          type="text"
          value={value.ownerName}
          onChange={(event) => onChange('ownerName', event.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          placeholder="Assigned leader"
          disabled={disabled}
        />
      </label>
      <label className="space-y-1 text-xs text-slate-500">
        <span className="font-semibold text-slate-900">Owner type</span>
        <select
          value={value.ownerType}
          onChange={(event) => onChange('ownerType', event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          disabled={disabled}
        >
          {ownerTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-xs text-slate-500">
        <span className="font-semibold text-slate-900">Workstream</span>
        <select
          value={value.lane}
          onChange={(event) => onChange('lane', event.target.value)}
          className={`w-full rounded-2xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
            errors.lane
              ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-200'
              : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-200'
          }`}
          disabled={disabled}
        >
          {laneOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.lane ? <span className="block text-rose-500">{errors.lane}</span> : null}
      </label>
      <label className="space-y-1 text-xs text-slate-500">
        <span className="font-semibold text-slate-900">Status</span>
        <select
          value={value.status}
          onChange={(event) => onChange('status', event.target.value)}
          className={`w-full rounded-2xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
            errors.status
              ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-200'
              : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-200'
          }`}
          disabled={disabled}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.status ? <span className="block text-rose-500">{errors.status}</span> : null}
      </label>
      <label className="space-y-1 text-xs text-slate-500">
        <span className="font-semibold text-slate-900">Risk level</span>
        <select
          value={value.riskLevel}
          onChange={(event) => onChange('riskLevel', event.target.value)}
          className={`w-full rounded-2xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
            errors.riskLevel
              ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-200'
              : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-200'
          }`}
          disabled={disabled}
        >
          {riskOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.riskLevel ? <span className="block text-rose-500">{errors.riskLevel}</span> : null}
      </label>
      <label className="space-y-1 text-xs text-slate-500">
        <span className="font-semibold text-slate-900">Start date</span>
        <input
          type="date"
          value={formatDateForInput(value.startDate)}
          onChange={(event) => onChange('startDate', event.target.value)}
          className={`w-full rounded-2xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
            errors.startDate
              ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-200'
              : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-200'
          }`}
          disabled={disabled}
        />
        {errors.startDate ? <span className="block text-rose-500">{errors.startDate}</span> : null}
      </label>
      <label className="space-y-1 text-xs text-slate-500">
        <span className="font-semibold text-slate-900">End date</span>
        <input
          type="date"
          value={formatDateForInput(value.endDate)}
          onChange={(event) => onChange('endDate', event.target.value)}
          className={`w-full rounded-2xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
            errors.endDate
              ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-200'
              : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-200'
          }`}
          disabled={disabled}
        />
        {errors.endDate ? <span className="block text-rose-500">{errors.endDate}</span> : null}
      </label>
      <label className="space-y-1 text-xs text-slate-500">
        <span className="font-semibold text-slate-900">Progress (%)</span>
        <input
          type="number"
          min="0"
          max="100"
          value={value.progressPercent}
          onChange={(event) => onChange('progressPercent', event.target.value)}
          className={`w-full rounded-2xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
            errors.progressPercent
              ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-200'
              : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-200'
          }`}
          disabled={disabled}
        />
        {errors.progressPercent ? <span className="block text-rose-500">{errors.progressPercent}</span> : null}
      </label>
      <label className="space-y-1 text-xs text-slate-500">
        <span className="font-semibold text-slate-900">Workload (hrs)</span>
        <input
          type="number"
          min="0"
          value={value.workloadHours}
          onChange={(event) => onChange('workloadHours', event.target.value)}
          className={`w-full rounded-2xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
            errors.workloadHours
              ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-200'
              : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-200'
          }`}
          disabled={disabled}
        />
        {errors.workloadHours ? <span className="block text-rose-500">{errors.workloadHours}</span> : null}
      </label>
      <label className="space-y-1 text-xs text-slate-500 md:col-span-2 lg:col-span-3">
        <span className="font-semibold text-slate-900">Notes</span>
        <textarea
          value={value.notes}
          onChange={(event) => onChange('notes', event.target.value)}
          rows={3}
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          placeholder="Key dependencies, decisions, or links"
          disabled={disabled}
        />
      </label>
    </div>
  );
}

function StatusBadge({ status }) {
  const tone = {
    planned: 'bg-slate-100 text-slate-600',
    in_progress: 'bg-emerald-100 text-emerald-600',
    blocked: 'bg-amber-100 text-amber-700',
    at_risk: 'bg-orange-100 text-orange-600',
    completed: 'bg-emerald-500 text-white',
  }[status] || 'bg-slate-100 text-slate-600';
  const label = statusOptions.find((option) => option.value === status)?.label ?? status;
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}

function RiskBadge({ riskLevel }) {
  const tone = {
    low: 'bg-emerald-50 text-emerald-600',
    medium: 'bg-amber-50 text-amber-600',
    high: 'bg-orange-50 text-orange-600',
    critical: 'bg-rose-100 text-rose-600',
  }[riskLevel] || 'bg-slate-100 text-slate-600';
  const label = riskOptions.find((option) => option.value === riskLevel)?.label ?? riskLevel;
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>{label} risk</span>;
}

function TaskBoard({ tasks, onAdvanceStatus, onEditTask, busyTaskId, busyType }) {
  const grouped = useMemo(() => {
    const lanes = new Map();
    tasks.forEach((task) => {
      const laneKey = task.lane || 'Delivery';
      if (!lanes.has(laneKey)) {
        lanes.set(laneKey, []);
      }
      lanes.get(laneKey).push(task);
    });
    return Array.from(lanes.entries()).map(([lane, laneTasks]) => ({
      lane,
      tasks: laneTasks.sort((a, b) => {
        const statusIndexA = statusOrder.indexOf(a.status ?? 'planned');
        const statusIndexB = statusOrder.indexOf(b.status ?? 'planned');
        if (statusIndexA !== statusIndexB) return statusIndexA - statusIndexB;
        const startA = a.startDate ? new Date(a.startDate).getTime() : Number.POSITIVE_INFINITY;
        const startB = b.startDate ? new Date(b.startDate).getTime() : Number.POSITIVE_INFINITY;
        return startA - startB;
      }),
    }));
  }, [tasks]);

  if (!grouped.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
        No timeline tasks captured yet. Add items above to build the integrated delivery plan.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {grouped.map((lane) => (
        <div key={lane.lane} className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h5 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{lane.lane}</h5>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">{lane.tasks.length} tasks</span>
          </div>
          <ul className="mt-4 space-y-3">
            {lane.tasks.map((task) => {
              const taskBusy = busyTaskId === task.id;
              return (
                <li
                  key={task.id ?? task.title}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:border-emerald-200"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-[50%] flex-1">
                      <p className="text-base font-semibold text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-500">
                        {task.ownerName ? `${task.ownerName} • ` : ''}
                        {task.ownerType?.replace(/_/g, ' ') ?? 'Unassigned'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-right text-xs text-slate-500">
                      <StatusBadge status={task.status} />
                      <RiskBadge riskLevel={task.riskLevel} />
                    </div>
                  </div>
                  <div className="mt-3 space-y-2 text-xs text-slate-500">
                    <div className="flex flex-wrap items-center gap-3">
                      {task.startDate || task.endDate ? (
                        <span>
                          {task.startDate ? new Date(task.startDate).toLocaleDateString() : 'TBC'} →{' '}
                          {task.endDate ? new Date(task.endDate).toLocaleDateString() : 'TBC'}
                        </span>
                      ) : (
                        <span>Schedule TBC</span>
                      )}
                      {task.workloadHours ? <span>{task.workloadHours} hrs</span> : null}
                      <span>Progress {Math.round(Number(task.progressPercent ?? 0))}%</span>
                    </div>
                    {task.notes ? (
                      <p className="rounded-2xl bg-slate-50 px-3 py-2 text-slate-600">{task.notes}</p>
                    ) : null}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{task.projectName ?? 'Project'}</span>
                      <span aria-hidden="true">•</span>
                      <span>{task.updatedAt ? `Updated ${new Date(task.updatedAt).toLocaleString()}` : 'Awaiting sync'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEditTask(task)}
                        className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700"
                        disabled={taskBusy && busyType === 'update'}
                      >
                        {taskBusy && busyType === 'update' ? 'Saving…' : 'Edit'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onAdvanceStatus(task)}
                        className="inline-flex items-center rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={taskBusy || task.status === 'completed'}
                      >
                        {taskBusy && busyType === 'advance' ? 'Advancing…' : task.status === 'completed' ? 'Completed' : 'Advance'}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function TaskEditorDialog({ open, task, onClose, onSave, onDelete, busy }) {
  const [draft, setDraft] = useState(() => ({
    ...DEFAULT_TASK,
    ...task,
    startDate: formatDateForInput(task?.startDate),
    endDate: formatDateForInput(task?.endDate),
    progressPercent: task?.progressPercent ?? 0,
    workloadHours: task?.workloadHours ?? '',
    notes: task?.notes ?? '',
  }));
  const [errors, setErrors] = useState({});

  const handleChange = useCallback((field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const { valid, errors: validationErrors } = validateTask(draft);
      setErrors(validationErrors);
      if (!valid || !task?.id) {
        return;
      }
      const diff = buildTaskDiff(task, draft);
      if (!Object.keys(diff).length) {
        onClose();
        return;
      }
      const success = await onSave(task, diff);
      if (success) {
        onClose();
      }
    },
    [draft, task, onSave, onClose],
  );

  const handleDelete = useCallback(async () => {
    if (!task?.id) {
      return;
    }
    const confirmed = window.confirm('Are you sure you want to permanently delete this task?');
    if (!confirmed) {
      return;
    }
    const success = await onDelete(task);
    if (success) {
      onClose();
    }
  }, [task, onDelete, onClose]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={busy ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-3xl rounded-4xl bg-white p-6 shadow-2xl">
                <Dialog.Title className="text-lg font-semibold text-slate-900">Edit project task</Dialog.Title>
                <p className="mt-1 text-sm text-slate-500">
                  Update scope, ownership, and delivery metadata. Changes sync instantly to every stakeholder surface.
                </p>
                <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                  <TaskFormFields value={draft} errors={errors} onChange={handleChange} disabled={busy} />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-rose-500 transition hover:text-rose-600"
                      disabled={busy}
                    >
                      Delete task
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
                        disabled={busy}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center rounded-full bg-emerald-500 px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={busy}
                      >
                        {busy ? 'Saving…' : 'Save changes'}
                      </button>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default function ProjectOperationsSection({ projectId }) {
  const [taskDraft, setTaskDraft] = useState({ ...DEFAULT_TASK });
  const [taskDraftErrors, setTaskDraftErrors] = useState({});
  const [savingTask, setSavingTask] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [filters, setFilters] = useState({ lane: 'all', status: 'all', risk: 'all', query: '' });
  const [editingTask, setEditingTask] = useState(null);
  const [taskAction, setTaskAction] = useState(null);

  const { data: operations, loading, error, refresh, fromCache, lastUpdated } = useProjectOperations({
    projectId,
    enabled: Boolean(projectId),
  });

  const assignments = operations?.agencyAssignments ?? [];
  const splits = operations?.contributorSplits ?? [];
  const timeline = operations?.timeline ?? null;
  const tasks = useMemo(() => (Array.isArray(operations?.tasks) ? operations.tasks : []), [operations]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const laneMatches = filters.lane === 'all' || (task.lane || 'Delivery') === filters.lane;
      const statusMatches = filters.status === 'all' || (task.status ?? 'planned') === filters.status;
      const riskMatches = filters.risk === 'all' || (task.riskLevel ?? 'low') === filters.risk;
      const query = filters.query.trim().toLowerCase();
      const queryMatches =
        !query ||
        [task.title, task.ownerName, task.notes, task.projectName]
          .map((value) => (value ? String(value).toLowerCase() : ''))
          .some((value) => value.includes(query));
      return laneMatches && statusMatches && riskMatches && queryMatches;
    });
  }, [tasks, filters]);

  const metrics = useMemo(() => {
    const base = { total: tasks.length, completed: 0, blocked: 0, atRisk: 0 };
    tasks.forEach((task) => {
      if (task.status === 'completed') {
        base.completed += 1;
      }
      if (task.status === 'blocked') {
        base.blocked += 1;
      }
      if (task.status === 'at_risk' || task.riskLevel === 'high' || task.riskLevel === 'critical') {
        base.atRisk += 1;
      }
    });
    return base;
  }, [tasks]);

  const handleDraftChange = useCallback((field, value) => {
    setTaskDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!projectId) {
        return;
      }
      const { valid, errors: validationErrors } = validateTask(taskDraft);
      setTaskDraftErrors(validationErrors);
      if (!valid) {
        setFeedback({ type: 'error', message: 'Resolve the highlighted fields before saving.' });
        return;
      }
      setSavingTask(true);
      setFeedback(null);
      try {
        const payload = sanitiseTaskPayload(taskDraft);
        await projectOperationsService.addProjectTask(projectId, payload);
        setTaskDraft({ ...DEFAULT_TASK });
        setTaskDraftErrors({});
        setFeedback({ type: 'success', message: 'Task added to the delivery plan.' });
        await refresh({ force: true });
      } catch (submitError) {
        console.error('Failed to add project task', submitError);
        setFeedback({ type: 'error', message: submitError.message || 'Unable to add task right now.' });
      } finally {
        setSavingTask(false);
      }
    },
    [projectId, taskDraft, refresh],
  );

  const handleAdvanceStatus = useCallback(
    async (task) => {
      if (!projectId || !task?.id) {
        return;
      }
      const currentIndex = statusOrder.indexOf(task.status ?? 'planned');
      const nextIndex = currentIndex === -1 ? 1 : Math.min(statusOrder.length - 1, currentIndex + 1);
      const nextStatus = statusOrder[nextIndex] ?? 'completed';
      if (nextStatus === (task.status ?? 'planned')) {
        return;
      }
      const payload = {
        status: nextStatus,
        progressPercent:
          nextStatus === 'completed'
            ? 100
            : Math.max(
                task.progressPercent == null ? 0 : Number(task.progressPercent),
                statusProgressDefaults[nextStatus] ?? 35,
              ),
      };
      setTaskAction({ taskId: task.id, type: 'advance' });
      try {
        await projectOperationsService.updateProjectTask(projectId, task.id, payload);
        setFeedback({ type: 'success', message: `Task moved to ${nextStatus.replace(/_/g, ' ')}.` });
        await refresh({ force: true });
      } catch (advanceError) {
        console.error('Failed to advance project task', advanceError);
        setFeedback({ type: 'error', message: advanceError.message || 'Unable to update task status.' });
      } finally {
        setTaskAction(null);
      }
    },
    [projectId, refresh],
  );

  const handleUpdateTask = useCallback(
    async (task, payload) => {
      if (!projectId || !task?.id) {
        return false;
      }
      if (!Object.keys(payload).length) {
        return true;
      }
      setTaskAction({ taskId: task.id, type: 'update' });
      try {
        await projectOperationsService.updateProjectTask(projectId, task.id, payload);
        setFeedback({ type: 'success', message: 'Task updated.' });
        await refresh({ force: true });
        return true;
      } catch (updateError) {
        console.error('Failed to update project task', updateError);
        setFeedback({ type: 'error', message: updateError.message || 'Unable to save task changes.' });
        return false;
      } finally {
        setTaskAction(null);
      }
    },
    [projectId, refresh],
  );

  const handleDeleteTask = useCallback(
    async (task) => {
      if (!projectId || !task?.id) {
        return false;
      }
      setTaskAction({ taskId: task.id, type: 'delete' });
      try {
        await projectOperationsService.deleteProjectTask(projectId, task.id);
        setFeedback({ type: 'success', message: 'Task removed from the plan.' });
        await refresh({ force: true });
        return true;
      } catch (deleteError) {
        console.error('Failed to delete project task', deleteError);
        setFeedback({ type: 'error', message: deleteError.message || 'Unable to delete task.' });
        return false;
      } finally {
        setTaskAction(null);
      }
    },
    [projectId, refresh],
  );

  const handleFilterChange = useCallback((field) => (event) => {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ lane: 'all', status: 'all', risk: 'all', query: '' });
  }, []);

  return (
    <section className="space-y-6 rounded-4xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 shadow-xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">Project ops</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">Delivery board</h3>
          <p className="mt-1 max-w-xl text-sm text-slate-600">Track the gantt, assign work, and keep payouts aligned.</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-xs text-slate-500">
          <div>
            {loading
              ? 'Syncing…'
              : fromCache
              ? 'Showing cached schedule'
              : lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString()}`
              : null}
          </div>
          <button
            type="button"
            onClick={() => refresh({ force: true })}
            className="inline-flex items-center rounded-full border border-emerald-300 px-3 py-1.5 text-[11px] font-semibold text-emerald-600 transition hover:bg-emerald-100"
          >
            Refresh data
          </button>
        </div>
      </header>

      {feedback ? (
        <div
          className={`rounded-3xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-600'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <p>{feedback.message}</p>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-600"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error.message || 'Unable to load project operations right now.'}
        </div>
      ) : null}

      <div className="grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4">
          <p className="font-semibold text-slate-900">Tracked tasks</p>
          <p className="mt-1 text-lg font-semibold text-emerald-600">{metrics.total}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4">
          <p className="font-semibold text-slate-900">Completed</p>
          <p className="mt-1 text-lg font-semibold text-emerald-600">{metrics.completed}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4">
          <p className="font-semibold text-slate-900">Risk & blockers</p>
          <p className="mt-1 text-lg font-semibold text-emerald-600">{metrics.blocked + metrics.atRisk}</p>
        </div>
      </div>

      <ProjectGanttChart timeline={timeline} tasks={tasks} />

      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
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
        <TaskFormFields
          value={taskDraft}
          errors={taskDraftErrors}
          onChange={handleDraftChange}
          disabled={savingTask}
        />
      </form>

      <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Task board</h4>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={filters.query}
              onChange={handleFilterChange('query')}
              placeholder="Search owner, task, or notes"
              className="w-40 rounded-full border border-slate-200 px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 sm:w-52"
            />
            <select
              value={filters.lane}
              onChange={handleFilterChange('lane')}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              <option value="all">All workstreams</option>
              {laneOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={handleFilterChange('status')}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              <option value="all">All statuses</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={filters.risk}
              onChange={handleFilterChange('risk')}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              <option value="all">All risk levels</option>
              {riskOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-emerald-200 hover:text-emerald-700"
            >
              Reset
            </button>
          </div>
        </div>
        <div className="mt-4">
          <TaskBoard
            tasks={filteredTasks}
            onAdvanceStatus={handleAdvanceStatus}
            onEditTask={setEditingTask}
            busyTaskId={taskAction?.taskId}
            busyType={taskAction?.type}
          />
        </div>
      </div>

      <ProjectAgencyDelegation assignments={assignments} />
      <ProjectPaySplitTable splits={splits} />

      <TaskEditorDialog
        open={Boolean(editingTask)}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleUpdateTask}
        onDelete={handleDeleteTask}
        busy={Boolean(taskAction && taskAction.taskId === editingTask?.id)}
      />
    </section>
  );
}
