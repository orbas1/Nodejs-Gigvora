import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { EVENT_STATUSES, EVENT_TYPES, eventToForm } from './timelineUtils.js';

const STEPS = ['Details', 'Schedule', 'Delivery'];

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

export default function EventDrawer({ open, mode = 'create', initialValue, onClose, onSubmit, busy }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => eventToForm(initialValue));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(eventToForm(initialValue));
      setErrors({});
      setStep(0);
    }
  }, [initialValue, open]);

  const heading = useMemo(() => (mode === 'edit' ? 'Edit event' : 'New event'), [mode]);

  const validate = () => {
    const nextErrors = {};
    if (!form.title.trim()) {
      nextErrors.title = 'Title is required';
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
                  <label htmlFor="event-title" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Title
                  </label>
                  <input
                    id="event-title"
                    type="text"
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="Go live"
                  />
                  {errors.title ? <p className="mt-1 text-xs text-rose-600">{errors.title}</p> : null}
                </div>
                <div>
                  <label htmlFor="event-summary" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Summary
                  </label>
                  <input
                    id="event-summary"
                    type="text"
                    value={form.summary}
                    onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="One-line context"
                  />
                </div>
                <div>
                  <label htmlFor="event-description" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Description
                  </label>
                  <textarea
                    id="event-description"
                    rows={4}
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="Add runbook notes, links, and dependencies."
                  />
                </div>
              </div>
            </Fieldset>
            <Fieldset title="Classification">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="event-type" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Type
                  </label>
                  <select
                    id="event-type"
                    value={form.eventType}
                    onChange={(event) => setForm((current) => ({ ...current, eventType: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    {EVENT_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="event-status" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Status
                  </label>
                  <select
                    id="event-status"
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    {EVENT_STATUSES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Fieldset>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <Fieldset title="Timing">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="event-start" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Start
                  </label>
                  <input
                    id="event-start"
                    type="date"
                    value={form.startDate}
                    onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label htmlFor="event-due" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Due
                  </label>
                  <input
                    id="event-due"
                    type="date"
                    value={form.dueDate}
                    onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label htmlFor="event-end" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    End
                  </label>
                  <input
                    id="event-end"
                    type="date"
                    value={form.endDate}
                    onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>
            </Fieldset>
            <Fieldset title="Logistics">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="event-location" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Location / link
                  </label>
                  <input
                    id="event-location"
                    type="text"
                    value={form.location}
                    onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="Zoom / HQ"
                  />
                </div>
                <div>
                  <label htmlFor="event-order" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Order
                  </label>
                  <input
                    id="event-order"
                    type="number"
                    value={form.orderIndex}
                    onChange={(event) => setForm((current) => ({ ...current, orderIndex: Number(event.target.value) }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    min={0}
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
            <Fieldset title="Owners">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label htmlFor="event-owner-name" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Owner name
                  </label>
                  <input
                    id="event-owner-name"
                    type="text"
                    value={form.ownerName}
                    onChange={(event) => setForm((current) => ({ ...current, ownerName: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label htmlFor="event-owner-email" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Owner email
                  </label>
                  <input
                    id="event-owner-email"
                    type="email"
                    value={form.ownerEmail}
                    onChange={(event) => setForm((current) => ({ ...current, ownerEmail: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label htmlFor="event-owner-id" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Owner ID
                  </label>
                  <input
                    id="event-owner-id"
                    type="text"
                    value={form.ownerId}
                    onChange={(event) => setForm((current) => ({ ...current, ownerId: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>
            </Fieldset>
            <Fieldset title="Calls to action">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="event-cta-label" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Button label
                  </label>
                  <input
                    id="event-cta-label"
                    type="text"
                    value={form.ctaLabel}
                    onChange={(event) => setForm((current) => ({ ...current, ctaLabel: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="Join"
                  />
                </div>
                <div>
                  <label htmlFor="event-cta-url" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Button link
                  </label>
                  <input
                    id="event-cta-url"
                    type="url"
                    value={form.ctaUrl}
                    onChange={(event) => setForm((current) => ({ ...current, ctaUrl: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="https://"
                  />
                </div>
              </div>
            </Fieldset>
            <Fieldset title="Metadata">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label htmlFor="event-tags" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Tags
                  </label>
                  <input
                    id="event-tags"
                    type="text"
                    value={form.tagsText}
                    onChange={(event) => setForm((current) => ({ ...current, tagsText: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="launch, qa"
                  />
                </div>
                <div>
                  <label htmlFor="event-attachments" className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    Attachments
                  </label>
                  <textarea
                    id="event-attachments"
                    rows={4}
                    value={form.attachmentsText}
                    onChange={(event) => setForm((current) => ({ ...current, attachmentsText: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="Label | https://link | optional note"
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
                      <p className="text-xs text-slate-500">Keep everyone aligned with clear milestones.</p>
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
