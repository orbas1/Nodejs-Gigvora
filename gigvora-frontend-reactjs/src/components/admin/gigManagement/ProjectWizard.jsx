import { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

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

const STEP_LABELS = ['Basics', 'Planning'];

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

function cleanList(items, predicate) {
  return items.filter(predicate);
}

export default function ProjectWizard({ open, onClose, onSubmit }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'planning',
    riskLevel: 'low',
    progressPercent: '10',
    startDate: '',
    dueDate: '',
    budgetCurrency: 'USD',
    budgetAllocated: '',
    budgetSpent: '',
    nextMilestone: '',
    nextMilestoneDueAt: '',
    milestones: [],
    collaborators: [],
  });

  const resetForm = () => {
    setStep(0);
    setSaving(false);
    setForm({
      title: '',
      description: '',
      status: 'planning',
      riskLevel: 'low',
      progressPercent: '10',
      startDate: '',
      dueDate: '',
      budgetCurrency: 'USD',
      budgetAllocated: '',
      budgetSpent: '',
      nextMilestone: '',
      nextMilestoneDueAt: '',
      milestones: [],
      collaborators: [],
    });
  };

  const closeAndReset = () => {
    resetForm();
    onClose();
  };

  const updateField = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const addMilestone = () => {
    setForm((previous) => ({
      ...previous,
      milestones: [
        ...previous.milestones,
        { id: generateId(), title: '', dueDate: '', status: 'planned' },
      ],
    }));
  };

  const updateMilestone = (id, changes) => {
    setForm((previous) => ({
      ...previous,
      milestones: previous.milestones.map((milestone) =>
        milestone.id === id ? { ...milestone, ...changes } : milestone,
      ),
    }));
  };

  const removeMilestone = (id) => {
    setForm((previous) => ({
      ...previous,
      milestones: previous.milestones.filter((milestone) => milestone.id !== id),
    }));
  };

  const addCollaborator = () => {
    setForm((previous) => ({
      ...previous,
      collaborators: [
        ...previous.collaborators,
        { id: generateId(), fullName: '', email: '', role: 'Collaborator', status: 'invited' },
      ],
    }));
  };

  const updateCollaborator = (id, changes) => {
    setForm((previous) => ({
      ...previous,
      collaborators: previous.collaborators.map((collaborator) =>
        collaborator.id === id ? { ...collaborator, ...changes } : collaborator,
      ),
    }));
  };

  const removeCollaborator = (id) => {
    setForm((previous) => ({
      ...previous,
      collaborators: previous.collaborators.filter((collaborator) => collaborator.id !== id),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (step === 0) {
      setStep(1);
      return;
    }
    try {
      setSaving(true);
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        startDate: form.startDate || null,
        dueDate: form.dueDate || null,
        budgetCurrency: form.budgetCurrency,
        budgetAllocated: form.budgetAllocated ? Number(form.budgetAllocated) : 0,
        budgetSpent: form.budgetSpent ? Number(form.budgetSpent) : 0,
        workspace: {
          status: form.status,
          riskLevel: form.riskLevel,
          progressPercent: form.progressPercent ? Number(form.progressPercent) : 0,
          nextMilestone: form.nextMilestone || null,
          nextMilestoneDueAt: form.nextMilestoneDueAt || form.dueDate || null,
        },
        milestones: cleanList(form.milestones, (milestone) => milestone.title.trim().length > 0).map(
          (milestone, index) => ({
            title: milestone.title.trim(),
            dueDate: milestone.dueDate || null,
            status: milestone.status,
            ordinal: index,
          }),
        ),
        collaborators: cleanList(form.collaborators, (collaborator) => collaborator.fullName.trim().length > 0).map(
          (collaborator) => ({
            fullName: collaborator.fullName.trim(),
            email: collaborator.email || null,
            role: collaborator.role || 'Collaborator',
            status: collaborator.status || 'invited',
          }),
        ),
      };
      await onSubmit(payload);
      closeAndReset();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeAndReset}>
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
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-200"
              enterFrom="scale-95 opacity-0"
              enterTo="scale-100 opacity-100"
              leave="transform transition ease-in duration-150"
              leaveFrom="scale-100 opacity-100"
              leaveTo="scale-95 opacity-0"
            >
              <Dialog.Panel className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                <form onSubmit={handleSubmit}>
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-slate-900">New project</Dialog.Title>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Step {step + 1} · {STEP_LABELS[step]}</p>
                    </div>
                    <button
                      type="button"
                      onClick={closeAndReset}
                      aria-label="Close project wizard"
                      className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="px-6 py-6">
                    {step === 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="sm:col-span-2 flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Title
                          <input
                            value={form.title}
                            onChange={(event) => updateField('title', event.target.value)}
                            required
                            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          />
                        </label>
                        <label className="sm:col-span-2 flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Description
                          <textarea
                            value={form.description}
                            onChange={(event) => updateField('description', event.target.value)}
                            required
                            rows={4}
                            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Status
                          <select
                            value={form.status}
                            onChange={(event) => updateField('status', event.target.value)}
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
                          Risk
                          <select
                            value={form.riskLevel}
                            onChange={(event) => updateField('riskLevel', event.target.value)}
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
                          Progress %
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={form.progressPercent}
                            onChange={(event) => updateField('progressPercent', event.target.value)}
                            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Start
                          <input
                            type="date"
                            value={form.startDate}
                            onChange={(event) => updateField('startDate', event.target.value)}
                            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Due
                          <input
                            type="date"
                            value={form.dueDate}
                            onChange={(event) => updateField('dueDate', event.target.value)}
                            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Currency
                            <input
                              value={form.budgetCurrency}
                              onChange={(event) => updateField('budgetCurrency', event.target.value.toUpperCase())}
                              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            />
                          </label>
                          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Budget
                            <input
                              type="number"
                              min="0"
                              value={form.budgetAllocated}
                              onChange={(event) => updateField('budgetAllocated', event.target.value)}
                              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            />
                          </label>
                          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Spent
                            <input
                              type="number"
                              min="0"
                              value={form.budgetSpent}
                              onChange={(event) => updateField('budgetSpent', event.target.value)}
                              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            />
                          </label>
                          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Next milestone
                            <input
                              value={form.nextMilestone}
                              onChange={(event) => updateField('nextMilestone', event.target.value)}
                              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            />
                          </label>
                          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Next due
                            <input
                              type="date"
                              value={form.nextMilestoneDueAt}
                              onChange={(event) => updateField('nextMilestoneDueAt', event.target.value)}
                              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            />
                          </label>
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Milestones</p>
                            <button
                              type="button"
                              onClick={addMilestone}
                              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
                            >
                              <PlusIcon className="h-4 w-4" />
                              Add
                            </button>
                          </div>
                          <div className="mt-3 space-y-3">
                            {form.milestones.map((milestone) => (
                              <div key={milestone.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 sm:grid-cols-[2fr_1fr_1fr_auto]">
                                <input
                                  value={milestone.title}
                                  onChange={(event) => updateMilestone(milestone.id, { title: event.target.value })}
                                  placeholder="Milestone"
                                  aria-label="Milestone title"
                                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                />
                                <input
                                  type="date"
                                  value={milestone.dueDate}
                                  onChange={(event) => updateMilestone(milestone.id, { dueDate: event.target.value })}
                                  aria-label="Milestone due date"
                                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                />
                                <select
                                  value={milestone.status}
                                  onChange={(event) => updateMilestone(milestone.id, { status: event.target.value })}
                                  aria-label="Milestone status"
                                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                >
                                  <option value="planned">Planned</option>
                                  <option value="in_progress">In progress</option>
                                  <option value="completed">Completed</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={() => removeMilestone(milestone.id)}
                                  aria-label={`Remove milestone ${milestone.title || ''}`.trim() || 'Remove milestone'}
                                  className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-rose-500"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Collaborators</p>
                            <button
                              type="button"
                              onClick={addCollaborator}
                              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
                            >
                              <PlusIcon className="h-4 w-4" />
                              Add
                            </button>
                          </div>
                          <div className="mt-3 space-y-3">
                            {form.collaborators.map((collaborator) => (
                              <div key={collaborator.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 sm:grid-cols-[2fr_2fr_1fr_auto]">
                                <input
                                  value={collaborator.fullName}
                                  onChange={(event) => updateCollaborator(collaborator.id, { fullName: event.target.value })}
                                  placeholder="Name"
                                  aria-label="Collaborator full name"
                                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                />
                                <input
                                  value={collaborator.email}
                                  onChange={(event) => updateCollaborator(collaborator.id, { email: event.target.value })}
                                  placeholder="Email"
                                  aria-label="Collaborator email"
                                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                />
                                <input
                                  value={collaborator.role}
                                  onChange={(event) => updateCollaborator(collaborator.id, { role: event.target.value })}
                                  placeholder="Role"
                                  aria-label="Collaborator role"
                                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeCollaborator(collaborator.id)}
                                  aria-label={`Remove collaborator ${collaborator.fullName || collaborator.email || ''}`.trim() || 'Remove collaborator'}
                                  className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-rose-500"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 px-6 py-5">
                    <button
                      type="button"
                      onClick={closeAndReset}
                      className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                    <div className="flex items-center gap-3">
                      {step === 1 ? (
                        <button
                          type="button"
                          onClick={() => setStep(0)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
                        >
                          <ChevronLeftIcon className="h-4 w-4" />
                          Back
                        </button>
                      ) : null}
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {step === 0 ? (
                          <>
                            Next
                            <ChevronRightIcon className="h-4 w-4" />
                          </>
                        ) : (
                          'Create'
                        )}
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

ProjectWizard.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
