import { Fragment, useEffect, useState } from 'react';
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

export default function ProjectDetailsDrawer({ open, project, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    status: 'planning',
    lifecycleState: 'open',
    startDate: '',
    dueDate: '',
    durationWeeks: 4,
    budgetCurrency: 'USD',
    budgetAllocated: '',
    skills: [],
  });
  const [skillDraft, setSkillDraft] = useState('');

  useEffect(() => {
    if (!open || !project) {
      return;
    }
    setForm({
      title: project.title ?? '',
      description: project.description ?? '',
      category: project.category ?? '',
      status: project.status ?? 'planning',
      lifecycleState: project.lifecycleState ?? 'open',
      startDate: project.startDate ? project.startDate.slice(0, 10) : '',
      dueDate: project.dueDate ? project.dueDate.slice(0, 10) : '',
      durationWeeks: project.durationWeeks ?? 4,
      budgetCurrency: project.budget?.currency ?? 'USD',
      budgetAllocated: project.budget?.allocated ?? '',
      skills: Array.isArray(project.skills) ? project.skills : [],
    });
    setSkillDraft('');
  }, [open, project]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      title: form.title.trim() || undefined,
      description: form.description.trim() || undefined,
      category: form.category.trim() || undefined,
      status: form.status,
      lifecycleState: form.lifecycleState,
      startDate: form.startDate || undefined,
      dueDate: form.dueDate || undefined,
      durationWeeks: clampDuration(form.durationWeeks),
      budgetCurrency: form.budgetCurrency || undefined,
      budgetAllocated: form.budgetAllocated === '' ? undefined : clampBudget(form.budgetAllocated),
      skills: form.skills,
    };
    await onSubmit(payload);
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
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
                  <form onSubmit={handleSubmit} className="flex h-full flex-col bg-white shadow-2xl">
                    <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                      <Dialog.Title className="text-lg font-semibold text-slate-900">Project</Dialog.Title>
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </header>

                    <div className="flex-1 overflow-y-auto px-6 py-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col text-sm font-medium text-slate-700">
                          Name
                          <input
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                          />
                        </label>
                        <label className="flex flex-col text-sm font-medium text-slate-700">
                          Category
                          <input
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                            className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                          />
                        </label>
                      </div>

                      <label className="mt-4 flex flex-col text-sm font-medium text-slate-700">
                        Summary
                        <textarea
                          name="description"
                          rows={4}
                          value={form.description}
                          onChange={handleChange}
                          className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </label>

                      <div className="mt-6 space-y-2">
                        <label className="text-sm font-medium text-slate-700">Skills</label>
                        <div className="flex items-center gap-2">
                          <input
                            value={skillDraft}
                            onChange={(event) => setSkillDraft(event.target.value)}
                            onKeyDown={handleSkillKeyDown}
                            placeholder="Add skill"
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

                      <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col text-sm font-medium text-slate-700">
                          Status
                          <select
                            name="status"
                            value={form.status}
                            onChange={handleChange}
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
                            onChange={handleChange}
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

                      <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col text-sm font-medium text-slate-700">
                          Start
                          <input
                            type="date"
                            name="startDate"
                            value={form.startDate}
                            onChange={handleChange}
                            className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                          />
                        </label>
                        <label className="flex flex-col text-sm font-medium text-slate-700">
                          Due
                          <input
                            type="date"
                            name="dueDate"
                            value={form.dueDate}
                            onChange={handleChange}
                            className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                          />
                        </label>
                      </div>

                      <div className="mt-6 grid gap-4 md:grid-cols-3">
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
                    </div>

                    <footer className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? 'Saving…' : 'Save'}
                      </button>
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
