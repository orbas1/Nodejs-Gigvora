import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ActionDrawer from './ActionDrawer.jsx';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'at_risk', label: 'At risk' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
];

const RISK_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0%';
  }
  return `${Math.round(Number(value))}%`;
}

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${currency} ${Number(value).toLocaleString('en-GB')}`;
  }
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-700">
      <span className="font-semibold text-slate-900">{label}</span>
      {children}
    </label>
  );
}

Field.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default function WorkspaceDetailDrawer({ open, onClose, project, onSave, saving, error, canManage }) {
  const workspace = project?.workspace ?? {};
  const summary = project?.collaboratorSummary ?? { active: 0, invited: 0 };
  const budget = project?.budget ?? {};
  const communications = project?.communications ?? {};
  const nextDue = workspace.nextMilestoneDueAt ?? project?.project?.dueDate ?? null;

  const [status, setStatus] = useState(workspace.status ?? project?.project?.status ?? 'planning');
  const [risk, setRisk] = useState(workspace.riskLevel ?? 'low');
  const [progress, setProgress] = useState(
    workspace.progressPercent != null && !Number.isNaN(Number(workspace.progressPercent))
      ? String(workspace.progressPercent)
      : '0',
  );
  const [milestone, setMilestone] = useState(workspace.nextMilestone ?? '');
  const [milestoneDue, setMilestoneDue] = useState(() => {
    if (!nextDue) return '';
    const date = new Date(nextDue);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState(workspace.notes ?? '');
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!open) {
      setFeedback(null);
      return;
    }
    setStatus(workspace.status ?? project?.project?.status ?? 'planning');
    setRisk(workspace.riskLevel ?? 'low');
    setProgress(
      workspace.progressPercent != null && !Number.isNaN(Number(workspace.progressPercent))
        ? String(workspace.progressPercent)
        : '0',
    );
    setMilestone(workspace.nextMilestone ?? '');
    setMilestoneDue(() => {
      if (!nextDue) return '';
      const date = new Date(nextDue);
      return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
    });
    setNotes(workspace.notes ?? '');
    setFeedback(null);
  }, [open, workspace.status, workspace.riskLevel, workspace.progressPercent, workspace.nextMilestone, workspace.nextMilestoneDueAt, workspace.notes, project?.project?.status, nextDue]);

  useEffect(() => {
    if (error) {
      setFeedback({ status: 'error', message: error });
    }
  }, [error]);

  const detailMetrics = useMemo(
    () => [
      { label: 'Progress', value: formatPercent(workspace.progressPercent) },
      {
        label: 'Budget',
        value: `${formatCurrency(budget.allocated, budget.currency)} / ${formatCurrency(
          budget.spent,
          budget.currency,
        )}`,
      },
      { label: 'Collaborators', value: `${summary.active ?? 0} active · ${summary.invited ?? 0} invited` },
      { label: 'Approvals', value: `${communications.pendingApprovals ?? 0} waiting` },
      { label: 'Inbox', value: `${communications.unreadMessages ?? 0} unread` },
      { label: 'Next due', value: nextDue ? formatRelativeTime(nextDue) : 'No date' },
    ],
    [workspace.progressPercent, budget.allocated, budget.currency, budget.spent, summary.active, summary.invited, communications.pendingApprovals, communications.unreadMessages, nextDue],
  );

  return (
    <ActionDrawer
      open={open}
      onClose={saving ? () => {} : onClose}
      title={project?.project?.title ?? 'Project'}
      width="max-w-3xl"
      footer={
        canManage ? (
          <div className="flex justify-between gap-3">
            <div
              className={`text-xs font-semibold ${
                feedback?.status === 'error' ? 'text-rose-600' : feedback?.status === 'success' ? 'text-emerald-600' : 'text-slate-500'
              }`}
            >
              {feedback?.message ?? ''}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Close
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!project?.project?.id && !project?.projectId && !project?.id) {
                    setFeedback({ status: 'error', message: 'Project reference missing.' });
                    return;
                  }
                  const parsedProgress = Number(progress);
                  if (Number.isNaN(parsedProgress) || parsedProgress < 0 || parsedProgress > 100) {
                    setFeedback({ status: 'error', message: 'Progress must be between 0 and 100.' });
                    return;
                  }
                  try {
                    await onSave({
                      status,
                      riskLevel: risk,
                      progressPercent: parsedProgress,
                      nextMilestone: milestone?.trim() ? milestone.trim() : undefined,
                      nextMilestoneDueAt: milestoneDue || undefined,
                      notes: notes?.trim() ? notes.trim() : undefined,
                    });
                    setFeedback({ status: 'success', message: 'Workspace updated.' });
                  } catch (saveError) {
                    setFeedback({
                      status: 'error',
                      message: saveError?.message ?? 'Unable to update workspace right now.',
                    });
                  }
                }}
                disabled={saving}
                className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
            >
              Close
            </button>
          </div>
        )
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-600">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              {workspace.status ?? project?.project?.status ?? 'planning'}
            </span>
            {project?.project?.createdAt ? (
              <span title={formatAbsolute(project.project.createdAt)} className="text-xs text-slate-500">
                Created {formatRelativeTime(project.project.createdAt)}
              </span>
            ) : null}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {detailMetrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{metric.value}</p>
            </div>
          ))}
        </div>
        {canManage ? (
          <form className="space-y-4" onSubmit={(event) => event.preventDefault()} noValidate>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Status">
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  disabled={saving}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Risk">
                <select
                  value={risk}
                  onChange={(event) => setRisk(event.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  disabled={saving}
                >
                  {RISK_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Progress %">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(event) => setProgress(event.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  disabled={saving}
                />
              </Field>
              <Field label="Next milestone">
                <input
                  value={milestone}
                  onChange={(event) => setMilestone(event.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  disabled={saving}
                  placeholder="Launch"
                />
              </Field>
              <Field label="Milestone date">
                <input
                  type="date"
                  value={milestoneDue}
                  onChange={(event) => setMilestoneDue(event.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  disabled={saving}
                />
              </Field>
              <Field label="Notes">
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="min-h-[120px] rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  disabled={saving}
                  placeholder="Dependencies or blockers"
                />
              </Field>
            </div>
          </form>
        ) : null}
      </div>
    </ActionDrawer>
  );
}

WorkspaceDetailDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  project: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool.isRequired,
  error: PropTypes.string,
  canManage: PropTypes.bool.isRequired,
};
