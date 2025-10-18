import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
];

const LIFECYCLE_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
];

const STEP_LABELS = ['Details', 'Schedule', 'Automation'];

function clampBudget(value) {
  if (value === '' || value == null) {
    return '';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '';
  }
  return Math.max(0, Math.round(numeric * 100) / 100);
}

function clampHours(value) {
  if (value === '' || value == null) {
    return '';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '';
  }
  return Math.max(0, Math.round(numeric * 2) / 2);
}

function clampDuration(value) {
  if (value === '' || value == null) {
    return '';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '';
  }
  return Math.min(520, Math.max(1, Math.round(numeric)));
}

function SkillChips({ skills, onRemove }) {
  if (!skills.length) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span
          key={skill}
          className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
        >
          {skill}
          <button
            type="button"
            onClick={() => onRemove(skill)}
            className="text-slate-400 transition hover:text-slate-600"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

export default function ProjectWizardDrawer({ open, onClose, onSubmit, submitting }) {
  const [step, setStep] = useState(0);
  const [skillDraft, setSkillDraft] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    durationWeeks: 4,
    status: 'planning',
    lifecycleState: 'open',
    startDate: '',
    dueDate: '',
    budgetCurrency: 'USD',
    budgetAllocated: '',
    skills: [],
    autoMatch: {
      enabled: false,
      autoAcceptEnabled: false,
      autoRejectEnabled: false,
      budgetMin: '',
      budgetMax: '',
      weeklyHoursMin: '',
      weeklyHoursMax: '',
      durationWeeksMin: '',
      durationWeeksMax: '',
      notes: '',
    },
  });

  const nextEnabled = useMemo(() => {
    if (step === 0) {
      return form.title.trim().length >= 3 && form.category.trim().length >= 2 && form.skills.length > 0;
    }
    if (step === 1) {
      return Boolean(form.durationWeeks);
    }
    return true;
  }, [form, step]);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setForm({
        title: '',
        description: '',
        category: '',
        durationWeeks: 4,
        status: 'planning',
        lifecycleState: 'open',
        startDate: '',
        dueDate: '',
        budgetCurrency: 'USD',
        budgetAllocated: '',
        skills: [],
        autoMatch: {
          enabled: false,
          autoAcceptEnabled: false,
          autoRejectEnabled: false,
          budgetMin: '',
          budgetMax: '',
          weeklyHoursMin: '',
          weeklyHoursMax: '',
          durationWeeksMin: '',
          durationWeeksMax: '',
          notes: '',
        },
      });
      setSkillDraft('');
    }
  }, [open]);

  const addSkill = () => {
    const trimmed = skillDraft.trim().toLowerCase();
    if (!trimmed) {
      return;
    }
    setForm((current) => {
      const existing = new Set(current.skills);
      existing.add(trimmed);
      return { ...current, skills: Array.from(existing).slice(0, 50) };
    });
    setSkillDraft('');
  };

  const removeSkill = (skill) => {
    setForm((current) => ({ ...current, skills: current.skills.filter((value) => value !== skill) }));
  };

  const handleSkillKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addSkill();
    }
  };

  const handleAutoMatchChange = (event) => {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({
      ...current,
      autoMatch: {
        ...current.autoMatch,
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const goNext = () => {
    if (step < STEP_LABELS.length - 1) {
      setStep((current) => current + 1);
    }
  };

  const goBack = () => {
    if (step > 0) {
      setStep((current) => current - 1);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      durationWeeks: clampDuration(form.durationWeeks),
      status: form.status,
      lifecycleState: form.lifecycleState,
      startDate: form.startDate || undefined,
      dueDate: form.dueDate || undefined,
      budgetCurrency: form.budgetCurrency || undefined,
      budgetAllocated: form.budgetAllocated === '' ? undefined : clampBudget(form.budgetAllocated),
      skills: form.skills,
      autoMatch: {
        enabled: form.autoMatch.enabled,
        autoAcceptEnabled: form.autoMatch.autoAcceptEnabled,
        autoRejectEnabled: form.autoMatch.autoRejectEnabled,
        budgetMin:
          form.autoMatch.budgetMin === '' ? undefined : clampBudget(form.autoMatch.budgetMin),
        budgetMax:
          form.autoMatch.budgetMax === '' ? undefined : clampBudget(form.autoMatch.budgetMax),
        weeklyHoursMin:
          form.autoMatch.weeklyHoursMin === '' ? undefined : clampHours(form.autoMatch.weeklyHoursMin),
        weeklyHoursMax:
          form.autoMatch.weeklyHoursMax === '' ? undefined : clampHours(form.autoMatch.weeklyHoursMax),
        durationWeeksMin:
          form.autoMatch.durationWeeksMin === ''
            ? undefined
            : clampDuration(form.autoMatch.durationWeeksMin),
        durationWeeksMax:
          form.autoMatch.durationWeeksMax === ''
            ? undefined
            : clampDuration(form.autoMatch.durationWeeksMax),
        notes: form.autoMatch.notes.trim() || undefined,
      },
    };
    await onSubmit(payload);
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
          <div className="fixed inset-0 bg-slate-900/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                  <form onSubmit={submit} className="flex h-full flex-col bg-white shadow-2xl">
                    <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                      <div>
                        <Dialog.Title className="text-lg font-semibold text-slate-900">New Project</Dialog.Title>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          {STEP_LABELS[step]}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </header>

                    <div className="flex-1 overflow-y-auto px-6 py-6">
                      {step === 0 && (
                        <div className="space-y-6">
                          <div className="grid gap-4 md:grid-cols-2">
                            <label className="flex flex-col text-sm font-medium text-slate-700">
                              Name
                              <input
                                required
                                name="title"
                                value={form.title}
                                onChange={handleInputChange}
                                placeholder="Project name"
                                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                              />
                            </label>
                            <label className="flex flex-col text-sm font-medium text-slate-700">
                              Category
                              <input
                                required
                                name="category"
                                value={form.category}
                                onChange={handleInputChange}
                                placeholder="Marketing"
                                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                              />
                            </label>
                          </div>
                          <label className="flex flex-col text-sm font-medium text-slate-700">
                            Summary
                            <textarea
                              required
                              name="description"
                              rows={4}
                              value={form.description}
                              onChange={handleInputChange}
                              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                            />
                          </label>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Skills</label>
                            <div className="flex items-center gap-2">
                              <input
                                value={skillDraft}
                                onChange={(event) => setSkillDraft(event.target.value)}
                                onKeyDown={handleSkillKeyDown}
                                placeholder="Add a skill and press enter"
                                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                              />
                              <button
                                type="button"
                                onClick={addSkill}
                                className="inline-flex items-center rounded-full bg-accent px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark"
                              >
                                Add
                              </button>
                            </div>
                            <SkillChips skills={form.skills} onRemove={removeSkill} />
                          </div>
                        </div>
                      )}

                      {step === 1 && (
                        <div className="space-y-6">
                          <div className="grid gap-4 md:grid-cols-2">
                            <label className="flex flex-col text-sm font-medium text-slate-700">
                              Start
                              <input
                                type="date"
                                name="startDate"
                                value={form.startDate}
                                onChange={handleInputChange}
                                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                              />
                            </label>
                            <label className="flex flex-col text-sm font-medium text-slate-700">
                              Due
                              <input
                                type="date"
                                name="dueDate"
                                value={form.dueDate}
                                onChange={handleInputChange}
                                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                              />
                            </label>
                          </div>
                          <div className="grid gap-4 md:grid-cols-3">
                            <label className="flex flex-col text-sm font-medium text-slate-700">
                              Duration (weeks)
                              <input
                                type="number"
                                min={1}
                                name="durationWeeks"
                                value={form.durationWeeks}
                                onChange={(event) =>
                                  setForm((current) => ({
                                    ...current,
                                    durationWeeks: clampDuration(event.target.value),
                                  }))
                                }
                                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                              />
                            </label>
                            <label className="flex flex-col text-sm font-medium text-slate-700">
                              Currency
                              <input
                                name="budgetCurrency"
                                value={form.budgetCurrency}
                                onChange={(event) =>
                                  setForm((current) => ({
                                    ...current,
                                    budgetCurrency: event.target.value.toUpperCase().slice(0, 3),
                                  }))
                                }
                                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                              />
                            </label>
                            <label className="flex flex-col text-sm font-medium text-slate-700">
                              Budget
                              <input
                                type="number"
                                min={0}
                                name="budgetAllocated"
                                value={form.budgetAllocated}
                                onChange={(event) =>
                                  setForm((current) => ({
                                    ...current,
                                    budgetAllocated: clampBudget(event.target.value),
                                  }))
                                }
                                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                              />
                            </label>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <label className="flex flex-col text-sm font-medium text-slate-700">
                              Status
                              <select
                                name="status"
                                value={form.status}
                                onChange={handleInputChange}
                                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                              >
                                {STATUS_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="flex flex-col text-sm font-medium text-slate-700">
                              Lifecycle
                              <select
                                name="lifecycleState"
                                value={form.lifecycleState}
                                onChange={handleInputChange}
                                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                              >
                                {LIFECYCLE_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        </div>
                      )}

                      {step === 2 && (
                        <div className="space-y-6">
                          <div className="grid gap-4 md:grid-cols-2">
                            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                              <input
                                type="checkbox"
                                name="enabled"
                                checked={form.autoMatch.enabled}
                                onChange={handleAutoMatchChange}
                                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                              />
                              Auto-Match
                            </label>
                            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                              <input
                                type="checkbox"
                                name="autoAcceptEnabled"
                                checked={form.autoMatch.autoAcceptEnabled}
                                onChange={handleAutoMatchChange}
                                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                              />
                              Auto-Accept
                            </label>
                            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                              <input
                                type="checkbox"
                                name="autoRejectEnabled"
                                checked={form.autoMatch.autoRejectEnabled}
                                onChange={handleAutoMatchChange}
                                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                              />
                              Guardrails
                            </label>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <label className="flex flex-col text-sm font-medium text-slate-700">
                              Budget Min
                              <input
                                type="number"
                                min={0}
                                name="budgetMin"
                                value={form.autoMatch.budgetMin}
                                onChange={(event) =>
                                  handleAutoMatchChange({
                                    target: {
                                      name: 'budgetMin',
                                      value: clampBudget(event.target.value),
                                    },
                                  })
                                }
                                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                              />
                            </label>
                            <label className="flex flex-col text-sm font-medium text-slate-700">
                              Budget Max
                              <input
                                type="number"
                                min={0}
                                name="budgetMax"
                                value={form.autoMatch.budgetMax}
                                onChange={(event) =>
                                  handleAutoMatchChange({
                                    target: {
                                      name: 'budgetMax',
                                      value: clampBudget(event.target.value),
                                    },
                                  })
                                }
                                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                              />
                            </label>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <label className="flex flex-col text-sm font-medium text-slate-700">
                              Hours Min
                              <input
                                type="number"
                                min={0}
                                name="weeklyHoursMin"
                                value={form.autoMatch.weeklyHoursMin}
                                onChange={(event) =>
                                  handleAutoMatchChange({
                                    target: {
                                      name: 'weeklyHoursMin',
                                      value: clampHours(event.target.value),
                                    },
                                  })
                                }
                                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                              />
                            </label>
                            <label className="flex flex-col text-sm font-medium text-slate-700">
                              Hours Max
                              <input
                                type="number"
                                min={0}
                                name="weeklyHoursMax"
                                value={form.autoMatch.weeklyHoursMax}
                                onChange={(event) =>
                                  handleAutoMatchChange({
                                    target: {
                                      name: 'weeklyHoursMax',
                                      value: clampHours(event.target.value),
                                    },
                                  })
                                }
                                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                              />
                            </label>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <label className="flex flex-col text-sm font-medium text-slate-700">
                              Duration Min
                              <input
                                type="number"
                                min={1}
                                name="durationWeeksMin"
                                value={form.autoMatch.durationWeeksMin}
                                onChange={(event) =>
                                  handleAutoMatchChange({
                                    target: {
                                      name: 'durationWeeksMin',
                                      value: clampDuration(event.target.value),
                                    },
                                  })
                                }
                                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                              />
                            </label>
                            <label className="flex flex-col text-sm font-medium text-slate-700">
                              Duration Max
                              <input
                                type="number"
                                min={1}
                                name="durationWeeksMax"
                                value={form.autoMatch.durationWeeksMax}
                                onChange={(event) =>
                                  handleAutoMatchChange({
                                    target: {
                                      name: 'durationWeeksMax',
                                      value: clampDuration(event.target.value),
                                    },
                                  })
                                }
                                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                              />
                            </label>
                          </div>

                          <label className="flex flex-col text-sm font-medium text-slate-700">
                            Notes
                            <textarea
                              name="notes"
                              rows={3}
                              value={form.autoMatch.notes}
                              onChange={handleAutoMatchChange}
                              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    <footer className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {STEP_LABELS.map((label, index) => (
                          <span
                            key={label}
                            className={
                              index === step
                                ? 'rounded-full bg-accent/10 px-3 py-1 text-accent'
                                : 'rounded-full bg-slate-100 px-3 py-1 text-slate-500'
                            }
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={goBack}
                          disabled={step === 0 || submitting}
                          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Back
                        </button>
                        {step < STEP_LABELS.length - 1 ? (
                          <button
                            type="button"
                            onClick={goNext}
                            disabled={!nextEnabled || submitting}
                            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Next
                          </button>
                        ) : (
                          <button
                            type="submit"
                            disabled={submitting || !nextEnabled}
                            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {submitting ? 'Creating…' : 'Create'}
                          </button>
                        )}
                      </div>
                    </footer>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
