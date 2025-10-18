import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const STEP_ORDER = ['hero', 'numbers', 'visuals', 'weather'];

const STEP_COPY = Object.freeze({
  hero: {
    title: 'Hero',
    fields: [
      { name: 'greetingName', label: 'Name', type: 'text', autoComplete: 'name' },
      { name: 'headline', label: 'Line', type: 'text' },
      { name: 'overview', label: 'Intro', type: 'textarea', rows: 3 },
    ],
  },
  numbers: {
    title: 'Numbers',
    fields: [
      { name: 'followersCount', label: 'Followers', type: 'number', min: 0 },
      { name: 'followersGoal', label: 'Goal', type: 'number', min: 0 },
      { name: 'trustScore', label: 'Trust %', type: 'number', min: 0, max: 100, step: 0.5 },
      { name: 'trustScoreLabel', label: 'Trust tag', type: 'text' },
      { name: 'rating', label: 'Rating /5', type: 'number', min: 0, max: 5, step: 0.1 },
      { name: 'ratingCount', label: 'Reviews', type: 'number', min: 0 },
    ],
  },
  visuals: {
    title: 'Images',
    fields: [
      { name: 'avatarUrl', label: 'Avatar link', type: 'url' },
      { name: 'bannerImageUrl', label: 'Banner link', type: 'url' },
    ],
  },
  weather: {
    title: 'Sky',
    fields: [
      { name: 'weatherLocation', label: 'City', type: 'text', autoComplete: 'address-level2' },
      {
        name: 'weatherUnits',
        label: 'Units',
        type: 'select',
        options: [
          { value: 'metric', label: 'Metric' },
          { value: 'imperial', label: 'Imperial' },
        ],
      },
    ],
  },
});

function StepIndicator({ activeIndex, total }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <span
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className={`h-1.5 w-12 rounded-full ${
            index <= activeIndex ? 'bg-slate-900' : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  );
}

StepIndicator.propTypes = {
  activeIndex: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
};

function FieldControl({ field, value, onChange }) {
  const commonProps = {
    id: field.name,
    name: field.name,
    value: value ?? '',
    onChange,
    className:
      'w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20',
  };

  if (field.type === 'textarea') {
    return (
      <textarea
        {...commonProps}
        rows={field.rows ?? 3}
        placeholder=""
      />
    );
  }

  if (field.type === 'select') {
    return (
      <select {...commonProps}>
        {(field.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      {...commonProps}
      type={field.type}
      min={field.min}
      max={field.max}
      step={field.step}
      autoComplete={field.autoComplete}
    />
  );
}

FieldControl.propTypes = {
  field: PropTypes.shape({
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    rows: PropTypes.number,
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    autoComplete: PropTypes.string,
    options: PropTypes.arrayOf(
      PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired }),
    ),
  }).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
};

export default function OverviewWizardModal({ open, initialValues, onClose, onSubmit, saving }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState(initialValues);

  useEffect(() => {
    if (open) {
      setDraft(initialValues);
      setStepIndex(0);
    }
  }, [initialValues, open]);

  const currentStep = STEP_ORDER[stepIndex];
  const currentConfig = useMemo(() => STEP_COPY[currentStep], [currentStep]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setDraft((previous) => ({ ...previous, [name]: value }));
  };

  const goNext = () => {
    if (stepIndex < STEP_ORDER.length - 1) {
      setStepIndex((index) => Math.min(STEP_ORDER.length - 1, index + 1));
      return;
    }
    onSubmit(draft);
  };

  const goPrevious = () => {
    setStepIndex((index) => Math.max(0, index - 1));
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
          <div className="fixed inset-0 bg-slate-900/60" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl rounded-4xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-slate-900">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
                      <SparklesIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <Dialog.Title className="text-xl font-semibold">{currentConfig.title}</Dialog.Title>
                      <p className="text-sm font-medium text-slate-500">
                        Step {stepIndex + 1} of {STEP_ORDER.length}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-6 space-y-6">
                  <StepIndicator activeIndex={stepIndex} total={STEP_ORDER.length} />

                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      goNext();
                    }}
                    className="space-y-6"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      {currentConfig.fields.map((field) => (
                        <label key={field.name} className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
                          <span>{field.label}</span>
                          <FieldControl field={field} value={draft[field.name]} onChange={handleChange} />
                        </label>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={goPrevious}
                        disabled={stepIndex === 0 || saving}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <ArrowLongLeftIcon className="h-4 w-4" />
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                      >
                        {stepIndex === STEP_ORDER.length - 1 ? 'Save' : 'Next'}
                        <ArrowLongRightIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

OverviewWizardModal.propTypes = {
  open: PropTypes.bool.isRequired,
  initialValues: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
