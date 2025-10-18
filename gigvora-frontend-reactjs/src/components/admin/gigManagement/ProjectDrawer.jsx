import { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

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

function toPercentInput(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '';
  }
  return String(Math.min(Math.max(Number(value), 0), 100));
}

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().split('T')[0];
}

export default function ProjectDrawer({ open, project, canManage, onClose, onSubmit }) {
  const [status, setStatus] = useState('planning');
  const [progressPercent, setProgressPercent] = useState('0');
  const [riskLevel, setRiskLevel] = useState('low');
  const [nextMilestone, setNextMilestone] = useState('');
  const [nextMilestoneDueAt, setNextMilestoneDueAt] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!project) return;
    const workspace = project.workspace ?? {};
    setStatus(workspace.status ?? project.status ?? 'planning');
    setProgressPercent(toPercentInput(workspace.progressPercent ?? 0));
    setRiskLevel(workspace.riskLevel ?? 'low');
    setNextMilestone(workspace.nextMilestone ?? '');
    setNextMilestoneDueAt(toDateInput(workspace.nextMilestoneDueAt ?? project.dueDate));
    setNotes(workspace.notes ?? '');
  }, [project]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!project) return;
    try {
      setSaving(true);
      await onSubmit(project.id, {
        status,
        progressPercent: progressPercent ? Number(progressPercent) : null,
        riskLevel,
        nextMilestone: nextMilestone || null,
        nextMilestoneDueAt: nextMilestoneDueAt || null,
        notes: notes || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full justify-end">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-xl">
                <form onSubmit={handleSubmit} className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-slate-900">{project?.title}</Dialog.Title>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Workspace update</p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-6 px-6 py-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                        <select
                          value={status}
                          onChange={(event) => setStatus(event.target.value)}
                          disabled={!canManage || saving}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Progress %
                        <input
                          value={progressPercent}
                          onChange={(event) => setProgressPercent(event.target.value)}
                          disabled={!canManage || saving}
                          type="number"
                          min="0"
                          max="100"
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Risk
                        <select
                          value={riskLevel}
                          onChange={(event) => setRiskLevel(event.target.value)}
                          disabled={!canManage || saving}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        >
                          {RISK_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Next due
                        <input
                          type="date"
                          value={nextMilestoneDueAt}
                          onChange={(event) => setNextMilestoneDueAt(event.target.value)}
                          disabled={!canManage || saving}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                      </label>
                    </div>

                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Next milestone
                      <input
                        value={nextMilestone}
                        onChange={(event) => setNextMilestone(event.target.value)}
                        disabled={!canManage || saving}
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      />
                    </label>

                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Notes
                      <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        disabled={!canManage || saving}
                        rows={4}
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      />
                    </label>
                  </div>

                  <div className="flex justify-between border-t border-slate-200 px-6 py-5">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Close
                    </button>
                    {canManage ? (
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Save
                      </button>
                    ) : null}
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

ProjectDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  project: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    status: PropTypes.string,
    workspace: PropTypes.object,
    dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  }),
  canManage: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

ProjectDrawer.defaultProps = {
  project: null,
  canManage: true,
};
