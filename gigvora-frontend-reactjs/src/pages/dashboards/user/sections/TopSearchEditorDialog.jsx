import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition, Switch } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import TagInput from '../../../../components/TagInput.jsx';

const CATEGORY_OPTIONS = [
  { id: 'job', label: 'Jobs' },
  { id: 'gig', label: 'Gigs' },
  { id: 'project', label: 'Projects' },
  { id: 'launchpad', label: 'Launchpads' },
  { id: 'volunteering', label: 'Volunteering' },
  { id: 'people', label: 'People' },
  { id: 'mixed', label: 'Mixed' },
];

const FREQUENCY_OPTIONS = [
  { id: 'immediate', label: 'Immediate' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
];

const STEPS = ['Basics', 'Filters'];

function buildInitialState(initialValue) {
  return {
    name: initialValue?.name ?? '',
    category: initialValue?.category ?? 'job',
    query: initialValue?.query ?? '',
    sort: initialValue?.sort ?? '',
    frequency: initialValue?.frequency ?? 'daily',
    notifyByEmail: initialValue?.notifyByEmail ?? true,
    notifyInApp: initialValue?.notifyInApp ?? true,
    locations: Array.isArray(initialValue?.filters?.locations) ? initialValue.filters.locations : [],
    organizations: Array.isArray(initialValue?.filters?.organizations)
      ? initialValue.filters.organizations
      : [],
    isRemote: initialValue?.filters?.isRemote ?? false,
  };
}

export default function TopSearchEditorDialog({ open, mode, initialValue, onClose, onSubmit }) {
  const [form, setForm] = useState(() => buildInitialState(initialValue));
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm(buildInitialState(initialValue));
      setError(null);
      setSubmitting(false);
      setStep(0);
    }
  }, [open, initialValue]);

  const canContinue = useMemo(() => form.name.trim().length > 0, [form.name]);

  const handleNext = (event) => {
    event.preventDefault();
    if (!canContinue) {
      setError('Name is required.');
      return;
    }
    setError(null);
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const handleBack = (event) => {
    event.preventDefault();
    setError(null);
    setStep((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const payload = {
      name: form.name.trim(),
      category: form.category,
      query: form.query.trim() || null,
      sort: form.sort.trim() || null,
      frequency: form.frequency,
      notifyByEmail: form.notifyByEmail,
      notifyInApp: form.notifyInApp,
      filters: {},
    };

    if (form.locations.length) {
      payload.filters.locations = form.locations;
    }
    if (form.organizations.length) {
      payload.filters.organizations = form.organizations;
    }
    if (form.isRemote === true) {
      payload.filters.isRemote = true;
    }
    if (!Object.keys(payload.filters).length) {
      delete payload.filters;
    }

    if (!payload.name) {
      setError('Name is required.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(payload);
      setSubmitting(false);
      onClose();
    } catch (submitError) {
      setSubmitting(false);
      setError(submitError?.message ?? 'Unable to save.');
    }
  };

  const remoteTrack = form.isRemote ? 'bg-emerald-500' : 'bg-slate-200';
  const remoteThumb = form.isRemote ? 'translate-x-6' : 'translate-x-1';
  const emailTrack = form.notifyByEmail ? 'bg-accent' : 'bg-slate-200';
  const emailThumb = form.notifyByEmail ? 'translate-x-6' : 'translate-x-1';
  const appTrack = form.notifyInApp ? 'bg-accent' : 'bg-slate-200';
  const appThumb = form.notifyInApp ? 'translate-x-6' : 'translate-x-1';

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => (submitting ? null : onClose())}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-4xl rounded-3xl bg-white p-8 shadow-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-slate-900">
                      {mode === 'edit' ? 'Edit search' : 'New search'}
                    </Dialog.Title>
                    <div className="mt-3 flex gap-2 text-xs font-medium text-slate-500">
                      {STEPS.map((label, index) => (
                        <span
                          key={label}
                          className={`rounded-full px-3 py-1 ${
                            index === step ? 'bg-accent text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => (submitting ? null : onClose())}
                    className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    <span className="sr-only">Close</span>
                  </button>
                </div>

                {error ? (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
                ) : null}

                <form className="mt-6 space-y-6" onSubmit={step === STEPS.length - 1 ? handleSubmit : handleNext}>
                  {step === 0 ? (
                    <div className="grid gap-5 sm:grid-cols-2">
                      <label className="flex flex-col gap-2 text-sm">
                        <span className="font-semibold text-slate-700">Name</span>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
                          className="rounded-2xl border border-slate-200 px-3 py-2 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm">
                        <span className="font-semibold text-slate-700">Category</span>
                        <select
                          value={form.category}
                          onChange={(event) => setForm((state) => ({ ...state, category: event.target.value }))}
                          className="rounded-2xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        >
                          {CATEGORY_OPTIONS.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-2 text-sm">
                        <span className="font-semibold text-slate-700">Keywords</span>
                        <input
                          type="text"
                          value={form.query}
                          onChange={(event) => setForm((state) => ({ ...state, query: event.target.value }))}
                          className="rounded-2xl border border-slate-200 px-3 py-2 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm">
                        <span className="font-semibold text-slate-700">Sort</span>
                        <input
                          type="text"
                          value={form.sort}
                          onChange={(event) => setForm((state) => ({ ...state, sort: event.target.value }))}
                          className="rounded-2xl border border-slate-200 px-3 py-2 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                    </div>
                  ) : null}

                  {step === 1 ? (
                    <div className="space-y-6">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm">
                          <span className="font-semibold text-slate-700">Locations</span>
                          <TagInput
                            values={form.locations}
                            onChange={(values) => setForm((state) => ({ ...state, locations: values }))}
                            placeholder="Add location"
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-sm">
                          <span className="font-semibold text-slate-700">Teams</span>
                          <TagInput
                            values={form.organizations}
                            onChange={(values) => setForm((state) => ({ ...state, organizations: values }))}
                            placeholder="Add team"
                          />
                        </label>
                      </div>

                      <div className="flex flex-wrap items-center gap-6 text-sm">
                        <label className="flex items-center gap-3">
                          <Switch
                            checked={form.isRemote}
                            onChange={(value) => setForm((state) => ({ ...state, isRemote: value }))}
                            className={`${remoteTrack} relative inline-flex h-6 w-11 items-center rounded-full transition`}
                          >
                            <span className={`${remoteThumb} inline-block h-4 w-4 transform rounded-full bg-white transition`} />
                          </Switch>
                          <span className="text-slate-600">Remote</span>
                        </label>
                        <div className="flex items-center gap-3">
                          {FREQUENCY_OPTIONS.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setForm((state) => ({ ...state, frequency: option.id }))}
                              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                                form.frequency === option.id
                                  ? 'bg-accent text-white'
                                  : 'border border-slate-200 text-slate-600 hover:border-accent/60 hover:text-accent'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                          <span>Email alerts</span>
                          <Switch
                            checked={form.notifyByEmail}
                            onChange={(value) => setForm((state) => ({ ...state, notifyByEmail: value }))}
                            className={`${emailTrack} relative inline-flex h-6 w-11 items-center rounded-full transition`}
                          >
                            <span className={`${emailThumb} inline-block h-4 w-4 transform rounded-full bg-white transition`} />
                          </Switch>
                        </label>
                        <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                          <span>In-app alerts</span>
                          <Switch
                            checked={form.notifyInApp}
                            onChange={(value) => setForm((state) => ({ ...state, notifyInApp: value }))}
                            className={`${appTrack} relative inline-flex h-6 w-11 items-center rounded-full transition`}
                          >
                            <span className={`${appThumb} inline-block h-4 w-4 transform rounded-full bg-white transition`} />
                          </Switch>
                        </label>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between pt-4">
                    {step > 0 ? (
                      <button
                        type="button"
                        onClick={handleBack}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-accent/60 hover:text-accent"
                      >
                        Back
                      </button>
                    ) : (
                      <span />
                    )}
                    <button
                      type="submit"
                      disabled={submitting || (!canContinue && step === 0)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {step === STEPS.length - 1 ? (submitting ? 'Saving…' : 'Save') : 'Next'}
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

TopSearchEditorDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']),
  initialValue: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

TopSearchEditorDialog.defaultProps = {
  mode: 'create',
  initialValue: null,
};
