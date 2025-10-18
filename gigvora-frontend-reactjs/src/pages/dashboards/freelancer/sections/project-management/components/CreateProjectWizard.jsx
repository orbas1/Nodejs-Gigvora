import { Fragment, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { toNumber } from '../utils.js';

const STEP_ORDER = ['basics', 'workspace', 'budget'];

function BasicsStep({ form, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="project-title">
          Title
        </label>
        <input
          id="project-title"
          type="text"
          value={form.title}
          onChange={(event) => onChange({ title: event.target.value })}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="project-description">
          Summary
        </label>
        <textarea
          id="project-description"
          value={form.description}
          onChange={(event) => onChange({ description: event.target.value })}
          rows={4}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="project-start">
            Start
          </label>
          <input
            id="project-start"
            type="date"
            value={form.startDate}
            onChange={(event) => onChange({ startDate: event.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="project-due">
            Due
          </label>
          <input
            id="project-due"
            type="date"
            value={form.dueDate}
            onChange={(event) => onChange({ dueDate: event.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

BasicsStep.propTypes = {
  form: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    startDate: PropTypes.string,
    dueDate: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};

function WorkspaceStep({ form, onChange }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="workspace-status">
            Status
          </label>
          <select
            id="workspace-status"
            value={form.workspace.status}
            onChange={(event) => onChange({ workspace: { ...form.workspace, status: event.target.value } })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          >
            <option value="planning">Planning</option>
            <option value="in_progress">Active</option>
            <option value="at_risk">At risk</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="workspace-risk">
            Risk
          </label>
          <select
            id="workspace-risk"
            value={form.workspace.riskLevel}
            onChange={(event) => onChange({ workspace: { ...form.workspace, riskLevel: event.target.value } })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="workspace-progress">
          Progress (%)
        </label>
        <input
          id="workspace-progress"
          type="number"
          min="0"
          max="100"
          value={form.workspace.progressPercent}
          onChange={(event) =>
            onChange({ workspace: { ...form.workspace, progressPercent: toNumber(event.target.value) } })
          }
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="workspace-next">
          Next milestone
        </label>
        <input
          id="workspace-next"
          type="text"
          value={form.workspace.nextMilestone}
          onChange={(event) => onChange({ workspace: { ...form.workspace, nextMilestone: event.target.value } })}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="workspace-next-due">
          Due date
        </label>
        <input
          id="workspace-next-due"
          type="date"
          value={form.workspace.nextMilestoneDueAt}
          onChange={(event) => onChange({ workspace: { ...form.workspace, nextMilestoneDueAt: event.target.value } })}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
    </div>
  );
}

WorkspaceStep.propTypes = {
  form: PropTypes.shape({
    workspace: PropTypes.shape({
      status: PropTypes.string,
      riskLevel: PropTypes.string,
      progressPercent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      nextMilestone: PropTypes.string,
      nextMilestoneDueAt: PropTypes.string,
    }),
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};

function BudgetStep({ form, onChange }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="budget-currency">
            Currency
          </label>
          <select
            id="budget-currency"
            value={form.budgetCurrency}
            onChange={(event) => onChange({ budgetCurrency: event.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="AUD">AUD</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="budget-allocated">
            Allocated
          </label>
          <input
            id="budget-allocated"
            type="number"
            min="0"
            value={form.budgetAllocated}
            onChange={(event) => onChange({ budgetAllocated: toNumber(event.target.value) })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="budget-spent">
            Spent
          </label>
          <input
            id="budget-spent"
            type="number"
            min="0"
            value={form.budgetSpent}
            onChange={(event) => onChange({ budgetSpent: toNumber(event.target.value) })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="project-client">
          Client name
        </label>
        <input
          id="project-client"
          type="text"
          value={form.metadata.clientName}
          onChange={(event) => onChange({ metadata: { ...form.metadata, clientName: event.target.value } })}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="project-workspace-url">
          Workspace URL
        </label>
        <input
          id="project-workspace-url"
          type="url"
          value={form.metadata.workspaceUrl}
          onChange={(event) => onChange({ metadata: { ...form.metadata, workspaceUrl: event.target.value } })}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
    </div>
  );
}

BudgetStep.propTypes = {
  form: PropTypes.shape({
    budgetCurrency: PropTypes.string,
    budgetAllocated: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    budgetSpent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    metadata: PropTypes.shape({
      clientName: PropTypes.string,
      workspaceUrl: PropTypes.string,
    }),
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default function CreateProjectWizard({ open, onClose, onSubmit, loading }) {
  const [currentStep, setCurrentStep] = useState('basics');
  const [form, setForm] = useState({
    title: '',
    description: '',
    startDate: '',
    dueDate: '',
    budgetCurrency: 'USD',
    budgetAllocated: 0,
    budgetSpent: 0,
    metadata: { clientName: '', workspaceUrl: '' },
    workspace: {
      status: 'planning',
      riskLevel: 'low',
      progressPercent: 10,
      nextMilestone: '',
      nextMilestoneDueAt: '',
    },
  });
  const [submitting, setSubmitting] = useState(false);

  const updateForm = (patch) => {
    setForm((prev) => ({
      ...prev,
      ...patch,
      workspace: patch.workspace ? { ...prev.workspace, ...patch.workspace } : prev.workspace,
      metadata: patch.metadata ? { ...prev.metadata, ...patch.metadata } : prev.metadata,
    }));
  };

  const steps = useMemo(
    () => ({
      basics: {
        title: 'Basics',
        content: <BasicsStep form={form} onChange={updateForm} />,
        canContinue: Boolean(form.title.trim() && form.description.trim()),
      },
      workspace: {
        title: 'Workspace',
        content: <WorkspaceStep form={form} onChange={updateForm} />,
        canContinue: true,
      },
      budget: {
        title: 'Budget',
        content: <BudgetStep form={form} onChange={updateForm} />,
        canContinue: true,
      },
    }),
    [form],
  );

  const handleNext = async () => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    const step = steps[currentStep];
    if (!step.canContinue) {
      return;
    }
    if (currentIndex === STEP_ORDER.length - 1) {
      setSubmitting(true);
      try {
        await onSubmit({
          ...form,
          startDate: form.startDate || null,
          dueDate: form.dueDate || null,
          workspace: {
            ...form.workspace,
            nextMilestoneDueAt: form.workspace.nextMilestoneDueAt || null,
          },
        });
        onClose();
        setForm((prev) => ({
          ...prev,
          title: '',
          description: '',
          startDate: '',
          dueDate: '',
          workspace: {
            ...prev.workspace,
            nextMilestone: '',
            nextMilestoneDueAt: '',
          },
          metadata: { clientName: '', workspaceUrl: '' },
          budgetAllocated: 0,
          budgetSpent: 0,
        }));
        setCurrentStep('basics');
      } catch (error) {
        console.error('Failed to create project', error);
      } finally {
        setSubmitting(false);
      }
      return;
    }
    const nextStep = STEP_ORDER[currentIndex + 1];
    setCurrentStep(nextStep);
  };

  const handleBack = () => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex === 0) {
      onClose();
      return;
    }
    setCurrentStep(STEP_ORDER[currentIndex - 1]);
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-xl">
                <div className="border-b border-slate-200 px-6 py-4">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">New project</Dialog.Title>
                  <p className="mt-1 text-sm text-slate-500">Create a workspace-ready engagement in three quick steps.</p>
                </div>
                <div className="px-6 py-6">
                  <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {STEP_ORDER.map((stepId) => (
                      <span
                        key={stepId}
                        className={`rounded-full px-3 py-1 ${
                          stepId === currentStep ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {steps[stepId].title}
                      </span>
                    ))}
                  </nav>
                  <div className="mt-6">{steps[currentStep].content}</div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="rounded-full px-5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={submitting || loading || !steps[currentStep].canContinue}
                    className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90 disabled:opacity-50"
                  >
                    {STEP_ORDER.indexOf(currentStep) === STEP_ORDER.length - 1 ? 'Create project' : 'Continue'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

CreateProjectWizard.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

CreateProjectWizard.defaultProps = {
  loading: false,
};
