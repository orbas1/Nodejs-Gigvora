import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { TIMELINE_STATUSES, TIMELINE_VISIBILITIES, timelineToForm } from './timelineUtils.js';

const STEPS = ['Details', 'Schedule', 'Visibility'];

function StepNav({ activeStep, onStepChange }) {
  return (
    <ol className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {STEPS.map((label, index) => (
        <li key={label} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onStepChange(index)}
            className={[
              'flex h-8 w-8 items-center justify-center rounded-full border text-sm transition',
              index === activeStep
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
            ].join(' ')}
          >
            {index + 1}
          </button>
          <span className={index === activeStep ? 'text-slate-900' : ''}>{label}</span>
          {index < STEPS.length - 1 ? <span className="text-slate-300">/</span> : null}
        </li>
      ))}
    </ol>
  );
}

function Fieldset({ title, children }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</legend>
      {children}
    </fieldset>
  );
}

export default function TimelineDrawer({ open, mode = 'create', initialValue, onClose, onSubmit, busy }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => timelineToForm(initialValue));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(timelineToForm(initialValue));
      setErrors({});
      setStep(0);
    }
  }, [initialValue, open]);

  const heading = useMemo(() => (mode === 'edit' ? 'Edit timeline' : 'New timeline'), [mode]);

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) {
      nextErrors.name = 'Name is required';
    }
    if (!form.slug.trim()) {
      nextErrors.slug = 'Slug is required';
    }
    if (!form.summary.trim()) {
      nextErrors.summary = 'Summary is required';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    onSubmit?.(form);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <Fieldset title="Basics">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label htmlFor="timeline-name" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Name
                  </label>
                  <input
                    id="timeline-name"
                    type="text"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="Launch plan"
                  />
                  {errors.name ? <p className="mt-1 text-xs text-rose-600">{errors.name}</p> : null}
                </div>
                <div>
                  <label htmlFor="timeline-slug" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Slug
                  </label>
                  <input
                    id="timeline-slug"
                    type="text"
                    value={form.slug}
                    onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value.toLowerCase() }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="launch-plan"
                  />
                  {errors.slug ? <p className="mt-1 text-xs text-rose-600">{errors.slug}</p> : null}
                </div>
                <div>
                  <label htmlFor="timeline-type" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Type
                  </label>
                  <input
                    id="timeline-type"
                    type="text"
                    value={form.timelineType}
                    onChange={(event) => setForm((current) => ({ ...current, timelineType: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="Product"
                  />
                </div>
              </div>
            </Fieldset>
            <Fieldset title="Summary">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label htmlFor="timeline-summary" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Summary
                  </label>
                  <input
                    id="timeline-summary"
                    type="text"
                    value={form.summary}
                    onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="One-line overview"
                  />
                  {errors.summary ? <p className="mt-1 text-xs text-rose-600">{errors.summary}</p> : null}
                </div>
                <div>
                  <label htmlFor="timeline-description" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Description
                  </label>
                  <textarea
                    id="timeline-description"
                    rows={4}
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="Add launch context, target outcomes, and dependencies."
                  />
                </div>
              </div>
            </Fieldset>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <Fieldset title="Schedule">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="timeline-start" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Start date
                  </label>
                  <input
                    id="timeline-start"
                    type="date"
                    value={form.startDate}
                    onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label htmlFor="timeline-end" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    End date
                  </label>
                  <input
                    id="timeline-end"
                    type="date"
                    value={form.endDate}
                    onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>
            </Fieldset>
            <Fieldset title="Media">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="timeline-hero" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Hero image URL
                  </label>
                  <input
                    id="timeline-hero"
                    type="url"
                    value={form.heroImageUrl}
                    onChange={(event) => setForm((current) => ({ ...current, heroImageUrl: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="https://"
                  />
                </div>
                <div>
                  <label htmlFor="timeline-thumb" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Thumbnail URL
                  </label>
                  <input
                    id="timeline-thumb"
                    type="url"
                    value={form.thumbnailUrl}
                    onChange={(event) => setForm((current) => ({ ...current, thumbnailUrl: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="https://"
                  />
                </div>
              </div>
            </Fieldset>
          </div>
        );
      case 2:
      default:
        return (
          <div className="space-y-4">
            <Fieldset title="Status">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="timeline-status" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Status
                  </label>
                  <select
                    id="timeline-status"
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    {TIMELINE_STATUSES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="timeline-visibility" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Visibility
                  </label>
                  <select
                    id="timeline-visibility"
                    value={form.visibility}
                    onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    {TIMELINE_VISIBILITIES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Fieldset>
            <Fieldset title="Ownership">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="timeline-owner" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Owner name
                  </label>
                  <input
                    id="timeline-owner"
                    type="text"
                    value={form.programOwner}
                    onChange={(event) => setForm((current) => ({ ...current, programOwner: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label htmlFor="timeline-owner-email" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Owner email
                  </label>
                  <input
                    id="timeline-owner-email"
                    type="email"
                    value={form.programEmail}
                    onChange={(event) => setForm((current) => ({ ...current, programEmail: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>
            </Fieldset>
            <Fieldset title="Coordination">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label htmlFor="timeline-channel" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Channel
                  </label>
                  <input
                    id="timeline-channel"
                    type="text"
                    value={form.coordinationChannel}
                    onChange={(event) => setForm((current) => ({ ...current, coordinationChannel: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="#launch"
                  />
                </div>
                <div>
                  <label htmlFor="timeline-tags" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Tags
                  </label>
                  <input
                    id="timeline-tags"
                    type="text"
                    value={form.tagsText}
                    onChange={(event) => setForm((current) => ({ ...current, tagsText: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="launch, beta"
                  />
                </div>
                <div>
                  <label htmlFor="timeline-risk" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Risk notes
                  </label>
                  <textarea
                    id="timeline-risk"
                    rows={3}
                    value={form.riskNotes}
                    onChange={(event) => setForm((current) => ({ ...current, riskNotes: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>
            </Fieldset>
          </div>
        );
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={busy ? () => {} : onClose}>
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
          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-200"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="w-screen max-w-2xl">
                <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-hidden bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-slate-900">{heading}</Dialog.Title>
                      <p className="text-xs text-slate-500">{mode === 'edit' ? 'Update details and publish changes.' : 'Set up the basics before inviting teams.'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-6 overflow-y-auto px-6 py-6">
                    <StepNav activeStep={step} onStepChange={setStep} />
                    {renderStep()}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setStep((current) => Math.max(current - 1, 0))}
                        disabled={step === 0}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep((current) => Math.min(current + 1, STEPS.length - 1))}
                        disabled={step === STEPS.length - 1}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={busy}
                      className="inline-flex items-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:opacity-60"
                    >
                      {busy ? 'Saving…' : 'Save'}
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
