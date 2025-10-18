import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { createProject } from '../../../services/adminProjectManagement.js';

const INITIAL_FORM = {
  ownerId: '',
  title: '',
  description: '',
  status: 'planning',
  budgetCurrency: 'USD',
  budgetAllocated: '',
  budgetSpent: '',
  startDate: '',
  dueDate: '',
};

const STEPS = [
  { id: 'basics', label: 'Basics' },
  { id: 'budget', label: 'Budget' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'review', label: 'Review' },
];

function StepPill({ label, active, complete }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
        active
          ? 'bg-accent text-white'
          : complete
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-slate-100 text-slate-500'
      }`}
    >
      <span>{label}</span>
    </div>
  );
}

StepPill.propTypes = {
  label: PropTypes.string.isRequired,
  active: PropTypes.bool,
  complete: PropTypes.bool,
};

StepPill.defaultProps = {
  active: false,
  complete: false,
};

export default function ProjectCreateWizard({ open, onClose, owners, onCreated }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const ownerOptions = useMemo(
    () => (owners ?? []).map((owner) => ({ value: owner.id, label: owner.name || owner.fullName || `User ${owner.id}` })),
    [owners],
  );

  useEffect(() => {
    if (open) {
      setStepIndex(0);
      setForm(INITIAL_FORM);
      setSubmitting(false);
      setError('');
    }
  }, [open]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleNext = () => {
    setStepIndex((index) => Math.min(index + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setStepIndex((index) => Math.max(index - 1, 0));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (stepIndex < STEPS.length - 1) {
      handleNext();
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ownerId: form.ownerId ? Number(form.ownerId) : undefined,
        title: form.title,
        description: form.description,
        status: form.status,
        budgetCurrency: form.budgetCurrency || 'USD',
        budgetAllocated: form.budgetAllocated === '' ? undefined : Number(form.budgetAllocated),
        budgetSpent: form.budgetSpent === '' ? undefined : Number(form.budgetSpent),
        startDate: form.startDate || undefined,
        dueDate: form.dueDate || undefined,
      };
      const result = await createProject(payload);
      if (result?.project) {
        onCreated(result.project);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Unable to create project.');
    } finally {
      setSubmitting(false);
    }
  };

  const canContinueBasics = form.ownerId && form.title;
  const canContinueBudget = true;
  const canContinueSchedule = true;

  const isNextDisabled = (() => {
    if (stepIndex === 0) return !canContinueBasics;
    if (stepIndex === 1) return !canContinueBudget;
    if (stepIndex === 2) return !canContinueSchedule;
    return submitting;
  })();

  const renderStep = () => {
    switch (STEPS[stepIndex].id) {
      case 'basics':
        return (
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</span>
              <select
                name="ownerId"
                value={form.ownerId}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
              >
                <option value="">Select owner</option>
                {ownerOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</span>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Project name"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
              >
                <option value="planning">Planning</option>
                <option value="in_progress">In progress</option>
                <option value="at_risk">At risk</option>
                <option value="on_hold">On hold</option>
                <option value="completed">Completed</option>
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
              />
            </label>
          </div>
        );
      case 'budget':
        return (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Currency</span>
                <input
                  name="budgetCurrency"
                  value={form.budgetCurrency}
                  onChange={handleChange}
                  maxLength={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm uppercase text-slate-900 focus:border-accent focus:outline-none"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Allocated</span>
                <input
                  name="budgetAllocated"
                  value={form.budgetAllocated}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Spent</span>
                <input
                  name="budgetSpent"
                  value={form.budgetSpent}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                />
              </label>
            </div>
          </div>
        );
      case 'schedule':
        return (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kickoff</span>
                <input
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  type="date"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Due</span>
                <input
                  name="dueDate"
                  value={form.dueDate}
                  onChange={handleChange}
                  type="date"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
                />
              </label>
            </div>
          </div>
        );
      case 'review':
        return (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
            <div className="flex justify-between"><span className="font-semibold text-slate-500">Owner</span><span>{ownerOptions.find((owner) => owner.value === Number(form.ownerId))?.label || '—'}</span></div>
            <div className="flex justify-between"><span className="font-semibold text-slate-500">Name</span><span className="text-slate-900">{form.title || '—'}</span></div>
            <div className="flex justify-between"><span className="font-semibold text-slate-500">Status</span><span>{form.status.replace(/_/g, ' ')}</span></div>
            <div className="flex justify-between"><span className="font-semibold text-slate-500">Budget</span><span>{form.budgetCurrency} {form.budgetAllocated || '0'}</span></div>
            <div className="flex justify-between"><span className="font-semibold text-slate-500">Schedule</span><span>{form.startDate || '—'} → {form.dueDate || '—'}</span></div>
          </div>
        );
      default:
        return null;
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
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-3xl bg-white shadow-xl">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-8">
                  <header className="space-y-3">
                    <Dialog.Title className="text-2xl font-semibold text-slate-900">New project</Dialog.Title>
                    <div className="flex flex-wrap gap-2">
                      {STEPS.map((step, index) => (
                        <StepPill
                          key={step.id}
                          label={step.label}
                          active={index === stepIndex}
                          complete={index < stepIndex}
                        />
                      ))}
                    </div>
                  </header>

                  {renderStep()}

                  {error ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
                  ) : null}

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={stepIndex === 0 ? onClose : handleBack}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                      disabled={submitting}
                    >
                      {stepIndex === 0 ? 'Cancel' : 'Back'}
                    </button>
                    <button
                      type="submit"
                      className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
                      disabled={isNextDisabled}
                    >
                      {stepIndex === STEPS.length - 1 ? (submitting ? 'Creating…' : 'Create project') : 'Next'}
                    </button>
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

ProjectCreateWizard.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  owners: PropTypes.arrayOf(PropTypes.object),
  onCreated: PropTypes.func,
};

ProjectCreateWizard.defaultProps = {
  owners: [],
  onCreated: () => {},
};
