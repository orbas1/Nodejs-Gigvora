import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { buildEventPayload } from './eventPayloads.js';

const steps = ['Info', 'Schedule', 'Access'];

const eventFormats = ['virtual', 'in_person', 'hybrid'];
const eventVisibilities = ['private', 'invite_only', 'public'];
const eventStatuses = ['draft', 'planned', 'registration_open', 'in_progress', 'completed', 'cancelled'];

function formatLabel(value) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const defaultValues = {
  title: '',
  description: '',
  location: '',
  status: 'planned',
  format: 'in_person',
  visibility: 'invite_only',
  startAt: '',
  endAt: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  capacity: '',
  registrationUrl: '',
};

export default function EventWizard({ open, mode, initialValues, onClose, onSubmit, busy, defaults }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [formValues, setFormValues] = useState(defaultValues);

  const mergedDefaults = useMemo(() => {
    const base = { ...defaultValues };
    if (defaults) {
      if (defaults.format) base.format = defaults.format;
      if (defaults.visibility) base.visibility = defaults.visibility;
      if (defaults.timezone) base.timezone = defaults.timezone;
      if (defaults.status) base.status = defaults.status;
    }
    return base;
  }, [defaults]);

  useEffect(() => {
    if (open) {
      setStepIndex(0);
      setFormValues(() => {
        const seed = initialValues ?? {};
        const next = {
          ...mergedDefaults,
          ...seed,
          startAt: seed.startAt ? seed.startAt.slice(0, 16) : '',
          endAt: seed.endAt ? seed.endAt.slice(0, 16) : '',
          capacity:
            seed.capacity != null && !Number.isNaN(Number(seed.capacity)) ? String(seed.capacity) : '',
        };
        if (!next.timezone) {
          next.timezone = mergedDefaults.timezone;
        }
        return next;
      });
    }
  }, [initialValues, mergedDefaults, open]);

  const step = useMemo(() => steps[stepIndex] ?? steps[0], [stepIndex]);

  const nextDisabled = useMemo(() => {
    if (step === 'Info') {
      return !formValues.title?.trim();
    }
    if (step === 'Schedule') {
      return !formValues.startAt;
    }
    return false;
  }, [formValues.endAt, formValues.startAt, formValues.title, step]);

  const handleChange = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const goNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((index) => index + 1);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) {
      setStepIndex((index) => index - 1);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = buildEventPayload(formValues);
    await onSubmit?.(payload);
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={busy ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/30" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-4xl bg-white shadow-xl transition-all">
                <form onSubmit={handleSubmit} className="flex h-full flex-col">
                  <header className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
                    <div>
                      <Dialog.Title className="text-xl font-semibold text-slate-900">
                        {mode === 'edit' ? 'Edit event' : 'New event'}
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-slate-500">Step {stepIndex + 1} · {step}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={busy ? undefined : onClose}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 disabled:cursor-not-allowed"
                        disabled={busy}
                      >
                        Close
                      </button>
                      {stepIndex > 0 ? (
                        <button
                          type="button"
                          onClick={goBack}
                          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
                        >
                          Back
                        </button>
                      ) : null}
                      {stepIndex < steps.length - 1 ? (
                        <button
                          type="button"
                          onClick={goNext}
                          disabled={nextDisabled}
                          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          Next
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={busy || nextDisabled}
                          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {busy ? 'Saving…' : 'Save'}
                        </button>
                      )}
                    </div>
                  </header>
                  <div className="flex flex-1 flex-col gap-6 px-8 py-6">
                    {step === 'Info' ? (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                          Title
                          <input
                            type="text"
                            value={formValues.title}
                            onChange={(event) => handleChange('title', event.target.value)}
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-900 focus:border-slate-400 focus:outline-none"
                            required
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                          Location
                          <input
                            type="text"
                            value={formValues.location}
                            onChange={(event) => handleChange('location', event.target.value)}
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-900 focus:border-slate-400 focus:outline-none"
                            placeholder="Venue or URL"
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
                          Description
                          <textarea
                            value={formValues.description}
                            onChange={(event) => handleChange('description', event.target.value)}
                            rows={3}
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-900 focus:border-slate-400 focus:outline-none"
                            placeholder="What is the event about?"
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                          Status
                          <select
                            value={formValues.status}
                            onChange={(event) => handleChange('status', event.target.value)}
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-900 focus:border-slate-400 focus:outline-none"
                          >
                            {eventStatuses.map((value) => (
                              <option key={value} value={value}>
                                {formatLabel(value)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                          Format
                          <select
                            value={formValues.format}
                            onChange={(event) => handleChange('format', event.target.value)}
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-900 focus:border-slate-400 focus:outline-none"
                          >
                            {eventFormats.map((value) => (
                              <option key={value} value={value}>
                                {formatLabel(value)}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    ) : null}
                    {step === 'Schedule' ? (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                          Starts
                          <input
                            type="datetime-local"
                            value={formValues.startAt}
                            onChange={(event) => handleChange('startAt', event.target.value)}
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-900 focus:border-slate-400 focus:outline-none"
                            required
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                          Ends
                          <input
                            type="datetime-local"
                            value={formValues.endAt}
                            onChange={(event) => handleChange('endAt', event.target.value)}
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-900 focus:border-slate-400 focus:outline-none"
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                          Timezone
                          <input
                            type="text"
                            value={formValues.timezone}
                            onChange={(event) => handleChange('timezone', event.target.value)}
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-900 focus:border-slate-400 focus:outline-none"
                          />
                        </label>
                      </div>
                    ) : null}
                    {step === 'Access' ? (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                          Visibility
                          <select
                            value={formValues.visibility}
                            onChange={(event) => handleChange('visibility', event.target.value)}
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-900 focus:border-slate-400 focus:outline-none"
                          >
                            {eventVisibilities.map((value) => (
                              <option key={value} value={value}>
                                {formatLabel(value)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                          Capacity
                          <input
                            type="number"
                            min="0"
                            value={formValues.capacity}
                            onChange={(event) => handleChange('capacity', event.target.value)}
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-900 focus:border-slate-400 focus:outline-none"
                            placeholder="Seats"
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
                          Registration link
                          <input
                            type="url"
                            value={formValues.registrationUrl}
                            onChange={(event) => handleChange('registrationUrl', event.target.value)}
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-900 focus:border-slate-400 focus:outline-none"
                            placeholder="https://"
                          />
                        </label>
                      </div>
                    ) : null}
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

