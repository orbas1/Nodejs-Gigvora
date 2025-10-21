import { Fragment, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition, Tab } from '@headlessui/react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

function humanize(value) {
  if (!value) return '';
  return value.replace(/[_-]/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
}

const DEFAULT_STATUS_VALUES = ['invited', 'active', 'suspended', 'archived'];
const DEFAULT_MEMBERSHIP_VALUES = ['user', 'freelancer', 'agency', 'company', 'mentor', 'headhunter', 'admin'];

const STEPS = [
  { id: 'account', label: 'Account' },
  { id: 'profile', label: 'Profile' },
  { id: 'access', label: 'Access' },
];

export default function CreateUserWizard({ open, onClose, metadata, onSubmit }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState(() => buildInitialForm());
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const statusOptions = useMemo(() => metadata?.statuses ?? DEFAULT_STATUS_VALUES, [metadata?.statuses]);
  const membershipOptions = useMemo(
    () => metadata?.memberships ?? DEFAULT_MEMBERSHIP_VALUES,
    [metadata?.memberships],
  );
  const roleOptions = useMemo(() => metadata?.roles ?? [], [metadata?.roles]);

  const step = STEPS[stepIndex];
  const nextDisabled = !canAdvance(step.id, form);

  const handleInputChange = (field) => (event) => {
    const value = field === 'twoFactorEnabled' ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRoleToggle = (role) => {
    setForm((prev) => {
      const nextRoles = new Set(prev.roles);
      if (nextRoles.has(role)) {
        nextRoles.delete(role);
      } else {
        nextRoles.add(role);
      }
      return { ...prev, roles: nextRoles };
    });
  };

  const goBack = () => {
    setError(null);
    setStatus('idle');
    setStepIndex((index) => Math.max(0, index - 1));
  };

  const goNext = () => {
    if (!canAdvance(step.id, form)) {
      setError('Please complete the required fields.');
      return;
    }
    setError(null);
    setStepIndex((index) => Math.min(STEPS.length - 1, index + 1));
  };

  const handleClose = () => {
    if (status === 'submitting') {
      return;
    }
    onClose?.();
    setTimeout(() => {
      setForm(buildInitialForm());
      setStepIndex(0);
      setStatus('idle');
      setError(null);
    }, 200);
  };

  const handleSubmit = async () => {
    if (status === 'submitting') {
      return;
    }
    if (!canAdvance(step.id, form)) {
      setError('Please complete the required fields.');
      return;
    }

    setStatus('submitting');
    setError(null);
    const payload = normalizePayload(form);

    try {
      await onSubmit?.(payload);
      setStatus('success');
    } catch (submissionError) {
      setError(submissionError?.message ?? 'Unable to create user.');
      setStatus('idle');
    }
  };

  return (
    <Transition.Root show={open} as={Fragment} afterLeave={() => setError(null)}>
      <Dialog as="div" className="relative z-30" onClose={handleClose}>
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

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="translate-y-6 scale-95 opacity-0"
              enterTo="translate-y-0 scale-100 opacity-100"
              leave="ease-in duration-150"
              leaveFrom="translate-y-0 scale-100 opacity-100"
              leaveTo="translate-y-6 scale-95 opacity-0"
            >
              <Dialog.Panel className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                      <PlusIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-slate-900">New user</Dialog.Title>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{step.label}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="grid gap-8 px-6 py-6 lg:grid-cols-[220px_1fr]">
                  <aside className="space-y-4">
                    <Tab.Group selectedIndex={stepIndex} onChange={setStepIndex}>
                      <Tab.List className="space-y-2">
                        {STEPS.map((item, index) => (
                          <Tab key={item.id} className="w-full">
                            {({ selected }) => (
                              <span
                                className={
                                  selected
                                    ? 'flex w-full items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white'
                                    : 'flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:border-slate-300'
                                }
                              >
                                {item.label}
                                {status === 'success' && index < STEPS.length && (
                                  <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
                                )}
                              </span>
                            )}
                          </Tab>
                        ))}
                      </Tab.List>
                    </Tab.Group>
                  </aside>

                  <div className="flex flex-col gap-6">
                    {status === 'success' ? (
                      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-16 text-center">
                        <CheckCircleIcon className="h-10 w-10 text-emerald-600" aria-hidden="true" />
                        <div className="text-xl font-semibold text-emerald-700">User ready</div>
                        <p className="text-sm text-emerald-700">Invite sent with secure defaults.</p>
                        <button
                          type="button"
                          onClick={handleClose}
                          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                        >
                          Close
                        </button>
                      </div>
                    ) : (
                      <>
                        {step.id === 'account' && (
                          <div className="grid gap-4 md:grid-cols-2">
                            <Field label="First name" required>
                              <input
                                type="text"
                                value={form.firstName}
                                onChange={handleInputChange('firstName')}
                                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                              />
                            </Field>
                            <Field label="Last name" required>
                              <input
                                type="text"
                                value={form.lastName}
                                onChange={handleInputChange('lastName')}
                                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                              />
                            </Field>
                            <Field label="Email" required className="md:col-span-2">
                              <input
                                type="email"
                                value={form.email}
                                onChange={handleInputChange('email')}
                                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                              />
                            </Field>
                            <Field label="Password" required>
                              <input
                                type="text"
                                minLength={8}
                                value={form.password}
                                onChange={handleInputChange('password')}
                                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                              />
                            </Field>
                            <Field label="Type" required>
                              <select
                                value={form.userType}
                                onChange={handleInputChange('userType')}
                                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                              >
                                {membershipOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {humanize(option)}
                                  </option>
                                ))}
                              </select>
                            </Field>
                            <Field label="Status" required>
                              <select
                                value={form.status}
                                onChange={handleInputChange('status')}
                                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                              >
                                {statusOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {humanize(option)}
                                  </option>
                                ))}
                              </select>
                            </Field>
                          </div>
                        )}

                        {step.id === 'profile' && (
                          <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Phone">
                              <input
                                type="tel"
                                value={form.phoneNumber}
                                onChange={handleInputChange('phoneNumber')}
                                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                              />
                            </Field>
                            <Field label="Job title">
                              <input
                                type="text"
                                value={form.jobTitle}
                                onChange={handleInputChange('jobTitle')}
                                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                              />
                            </Field>
                            <Field label="Location" className="md:col-span-2">
                              <input
                                type="text"
                                value={form.location}
                                onChange={handleInputChange('location')}
                                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                              />
                            </Field>
                            <div className="md:col-span-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                              <label className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={form.twoFactorEnabled}
                                  onChange={handleInputChange('twoFactorEnabled')}
                                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                />
                                Enforce two-factor at first login
                              </label>
                            </div>
                          </div>
                        )}

                        {step.id === 'access' && (
                          <div className="space-y-5">
                            {roleOptions.length > 0 && (
                              <section className="space-y-3">
                                <h3 className="text-sm font-semibold text-slate-700">Roles</h3>
                                <div className="grid gap-2 md:grid-cols-2">
                                  {roleOptions.map((role) => (
                                    <label
                                      key={role}
                                      className={
                                        form.roles.has(role)
                                          ? 'flex items-center gap-3 rounded-2xl border border-slate-900 bg-slate-900/5 px-4 py-3 text-sm font-semibold text-slate-900'
                                          : 'flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 hover:border-slate-300'
                                      }
                                    >
                                      <input
                                        type="checkbox"
                                        checked={form.roles.has(role)}
                                        onChange={() => handleRoleToggle(role)}
                                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                      />
                                      {humanize(role)}
                                    </label>
                                  ))}
                                </div>
                              </section>
                            )}
                            <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                              Password and welcome email are sent immediately after saving.
                            </div>
                          </div>
                        )}

                        {error && <p className="text-sm text-rose-600">{error}</p>}

                        <div className="flex items-center justify-between gap-3 pt-2">
                          <button
                            type="button"
                            onClick={stepIndex === 0 ? handleClose : goBack}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-800"
                          >
                            {stepIndex === 0 ? (
                              <>Cancel</>
                            ) : (
                              <>
                                <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" /> Back
                              </>
                            )}
                          </button>
                          {stepIndex < STEPS.length - 1 ? (
                            <button
                              type="button"
                              onClick={goNext}
                              disabled={nextDisabled}
                              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Next <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSubmit}
                              disabled={status === 'submitting'}
                              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {status === 'submitting' ? 'Saving…' : 'Create user'}
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

CreateUserWizard.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  metadata: PropTypes.shape({
    statuses: PropTypes.arrayOf(PropTypes.string),
    memberships: PropTypes.arrayOf(PropTypes.string),
    roles: PropTypes.arrayOf(PropTypes.string),
  }),
  onSubmit: PropTypes.func.isRequired,
};

CreateUserWizard.defaultProps = {
  open: undefined,
  onClose: undefined,
  metadata: null,
};

function buildInitialForm() {
  return {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    userType: 'user',
    status: 'invited',
    phoneNumber: '',
    jobTitle: '',
    location: '',
    twoFactorEnabled: true,
    roles: new Set(),
  };
}

function normalizePayload(form) {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim().toLowerCase(),
    password: form.password,
    userType: form.userType,
    status: form.status,
    phoneNumber: form.phoneNumber.trim() || undefined,
    jobTitle: form.jobTitle.trim() || undefined,
    location: form.location.trim() || undefined,
    twoFactorEnabled: form.twoFactorEnabled,
    roles: Array.from(form.roles),
  };
}

function canAdvance(stepId, form) {
  if (stepId === 'account') {
    return Boolean(
      form.firstName.trim() &&
        form.lastName.trim() &&
        form.email.trim() &&
        form.password.trim().length >= 8 &&
        form.userType &&
        form.status,
    );
  }

  return true;
}

function Field({ label, required, className = '', children }) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}

Field.propTypes = {
  label: PropTypes.string.isRequired,
  required: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

Field.defaultProps = {
  required: false,
  className: '',
};

