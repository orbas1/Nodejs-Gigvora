import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { FORM_STEPS, SOURCE_OPTIONS, STATUS_OPTIONS } from './constants.js';
import { toFormValues, toPayload } from './utils.js';

function Stepper({ activeStep }) {
  return (
    <ol className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
      {FORM_STEPS.map((step, index) => {
        const isActive = index === activeStep;
        const isComplete = index < activeStep;
        return (
          <li
            key={step.id}
            className={`flex items-center gap-2 ${isActive ? 'text-blue-600' : isComplete ? 'text-emerald-600' : ''}`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] ${
                isActive
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : isComplete
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                    : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              {isComplete ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <span>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function InfoStep({ values, onChange }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Title
          <input
            type="text"
            value={values.title}
            onChange={(event) => onChange({ title: event.target.value })}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Rating
          <input
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={values.rating}
            onChange={(event) => onChange({ rating: event.target.value })}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Name
          <input
            type="text"
            value={values.reviewerName}
            onChange={(event) => onChange({ reviewerName: event.target.value })}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Role
          <input
            type="text"
            value={values.reviewerRole}
            onChange={(event) => onChange({ reviewerRole: event.target.value })}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Company
          <input
            type="text"
            value={values.reviewerCompany}
            onChange={(event) => onChange({ reviewerCompany: event.target.value })}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Status
          <select
            value={values.status}
            onChange={(event) => onChange({ status: event.target.value })}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <input
            type="checkbox"
            checked={values.highlighted}
            onChange={(event) => onChange({ highlighted: event.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Pin to showcase
        </label>
      </div>
    </div>
  );
}

function ContentStep({ values, onChange }) {
  return (
    <div className="space-y-4">
      <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Story
        <textarea
          value={values.body}
          onChange={(event) => onChange({ body: event.target.value })}
          rows={6}
          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Tags
        <input
          type="text"
          value={values.tags}
          onChange={(event) => onChange({ tags: event.target.value })}
          placeholder="Design, Enterprise, Product"
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Preview link
          <input
            type="url"
            value={values.previewUrl}
            onChange={(event) => onChange({ previewUrl: event.target.value })}
            placeholder="https://"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Hero image
          <input
            type="url"
            value={values.heroImageUrl}
            onChange={(event) => onChange({ heroImageUrl: event.target.value })}
            placeholder="https://"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>
    </div>
  );
}

function PublishStep({ values, onChange }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Source
          <select
            value={values.reviewSource}
            onChange={(event) => onChange({ reviewSource: event.target.value })}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            {SOURCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Captured
          <input
            type="datetime-local"
            value={values.capturedAt}
            onChange={(event) => onChange({ capturedAt: event.target.value })}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Publish
          <input
            type="datetime-local"
            value={values.publishedAt}
            onChange={(event) => onChange({ publishedAt: event.target.value })}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Notes
          <textarea
            value={values.privateNotes ?? ''}
            onChange={(event) => onChange({ privateNotes: event.target.value })}
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>
    </div>
  );
}

export default function ReviewFormDrawer({ open, mode = 'create', review, onClose, onSubmit, loading, error }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState(() => toFormValues(review));

  useEffect(() => {
    if (open) {
      setValues(toFormValues(review));
      setStepIndex(0);
    }
  }, [open, review]);

  const title = useMemo(() => (mode === 'edit' ? 'Edit review' : 'New review'), [mode]);

  const handleNext = () => {
    setStepIndex((current) => Math.min(current + 1, FORM_STEPS.length - 1));
  };

  const handleBack = () => {
    setStepIndex((current) => Math.max(current - 1, 0));
  };

  const handleChange = (patch) => {
    setValues((current) => ({ ...current, ...patch }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = toPayload(values);
    try {
      await onSubmit(payload);
    } catch (submitError) {
      // Surface error via provided error prop
    }
  };

  const renderStep = () => {
    if (stepIndex === 0) {
      return <InfoStep values={values} onChange={handleChange} />;
    }
    if (stepIndex === 1) {
      return <ContentStep values={values} onChange={handleChange} />;
    }
    return <PublishStep values={values} onChange={handleChange} />;
  };

  return (
    <Transition show={open} as={Fragment}>
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

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 flex justify-end">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-200"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-slate-900">{title}</Dialog.Title>
                    <Stepper activeStep={stepIndex} />
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-1 flex-col justify-between">
                  <div className="flex-1 space-y-6 px-6 py-6">{renderStep()}</div>
                  <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                    <div className="text-xs text-rose-600">{error?.message}</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleBack}
                        disabled={stepIndex === 0}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Back
                      </button>
                      {stepIndex < FORM_STEPS.length - 1 ? (
                        <button
                          type="button"
                          onClick={handleNext}
                          className="inline-flex items-center gap-2 rounded-full border border-blue-500 bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
                        >
                          Next
                          <ArrowRightIcon className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex items-center gap-2 rounded-full border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-wait disabled:opacity-70"
                        >
                          Save
                          <CheckIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
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

ReviewFormDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']),
  review: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.shape({ message: PropTypes.string }),
};
