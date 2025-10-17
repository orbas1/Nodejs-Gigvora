import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowPathIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { VERIFICATION_PROVIDERS } from './constants.js';
import { classNames } from './utils.js';

const steps = ['Member', 'Documents', 'Review'];

export default function IdVerificationCreateWizard({
  open,
  onClose,
  form,
  onChange,
  onSubmit,
  busy,
  reviewers,
  workspaceLocked,
}) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!open) {
      setCurrentStep(0);
    }
  }, [open]);

  const reviewerDataListId = 'id-verification-create-reviewers';

  function goNext() {
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  }

  function goPrev() {
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (currentStep < steps.length - 1) {
      goNext();
      return;
    }
    onSubmit();
  }

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
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl rounded-4xl bg-white p-6 shadow-2xl">
                <header className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">New ID check</Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-accent/50 hover:text-accent"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </header>

                <nav className="mt-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                  {steps.map((label, index) => (
                    <Fragment key={label}>
                      <span className={classNames('rounded-full px-3 py-1', index === currentStep ? 'bg-accent text-white' : 'bg-slate-100 text-slate-500')}>
                        {label}
                      </span>
                      {index < steps.length - 1 ? <span className="text-slate-300">→</span> : null}
                    </Fragment>
                  ))}
                </nav>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                  {currentStep === 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {!workspaceLocked ? (
                        <Field
                          label="Workspace ID"
                          type="number"
                          value={form.workspaceId}
                          onChange={(event) => onChange({ ...form, workspaceId: event.target.value })}
                          required
                        />
                      ) : null}
                      <Field
                        label="User ID"
                        type="number"
                        value={form.userId}
                        onChange={(event) => onChange({ ...form, userId: event.target.value })}
                        required
                      />
                      <Field
                        label="Profile ID"
                        type="number"
                        value={form.profileId}
                        onChange={(event) => onChange({ ...form, profileId: event.target.value })}
                      />
                      <Field
                        label="Full name"
                        value={form.fullName}
                        onChange={(event) => onChange({ ...form, fullName: event.target.value })}
                        required
                      />
                      <Field
                        label="Date of birth"
                        type="date"
                        value={form.dateOfBirth}
                        onChange={(event) => onChange({ ...form, dateOfBirth: event.target.value })}
                      />
                      <Field
                        label="ID type"
                        value={form.typeOfId}
                        onChange={(event) => onChange({ ...form, typeOfId: event.target.value })}
                      />
                      <Field
                        label="ID last 4"
                        value={form.idNumberLast4}
                        onChange={(event) => onChange({ ...form, idNumberLast4: event.target.value })}
                      />
                      <Field
                        label="Country"
                        value={form.country}
                        onChange={(event) => onChange({ ...form, country: event.target.value })}
                      />
                    </div>
                  ) : null}

                  {currentStep === 1 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field
                        label="Issued"
                        type="date"
                        value={form.issuedAt}
                        onChange={(event) => onChange({ ...form, issuedAt: event.target.value })}
                      />
                      <Field
                        label="Expires"
                        type="date"
                        value={form.expiresAt}
                        onChange={(event) => onChange({ ...form, expiresAt: event.target.value })}
                      />
                      <Field
                        label="Document front key"
                        value={form.documentFrontKey}
                        onChange={(event) => onChange({ ...form, documentFrontKey: event.target.value })}
                        required
                      />
                      <Field
                        label="Document back key"
                        value={form.documentBackKey}
                        onChange={(event) => onChange({ ...form, documentBackKey: event.target.value })}
                      />
                      <Field
                        label="Selfie key"
                        value={form.selfieKey}
                        onChange={(event) => onChange({ ...form, selfieKey: event.target.value })}
                      />
                      <Field
                        label="Address line 1"
                        value={form.addressLine1}
                        onChange={(event) => onChange({ ...form, addressLine1: event.target.value })}
                      />
                      <Field
                        label="Address line 2"
                        value={form.addressLine2}
                        onChange={(event) => onChange({ ...form, addressLine2: event.target.value })}
                      />
                      <Field
                        label="City"
                        value={form.city}
                        onChange={(event) => onChange({ ...form, city: event.target.value })}
                      />
                      <Field
                        label="State"
                        value={form.state}
                        onChange={(event) => onChange({ ...form, state: event.target.value })}
                      />
                      <Field
                        label="Postal code"
                        value={form.postalCode}
                        onChange={(event) => onChange({ ...form, postalCode: event.target.value })}
                      />
                    </div>
                  ) : null}

                  {currentStep === 2 ? (
                    <div className="space-y-4">
                      <Field
                        label="Provider"
                        as="select"
                        value={form.verificationProvider}
                        onChange={(event) => onChange({ ...form, verificationProvider: event.target.value })}
                      >
                        {VERIFICATION_PROVIDERS.map((provider) => (
                          <option key={provider.value} value={provider.value}>
                            {provider.label}
                          </option>
                        ))}
                      </Field>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field
                          label="Status"
                          value={form.status}
                          onChange={(event) => onChange({ ...form, status: event.target.value })}
                        />
                        <Field
                          label="Risk level"
                          value={form.riskLevel}
                          onChange={(event) => onChange({ ...form, riskLevel: event.target.value })}
                        />
                        <Field
                          label="Risk score"
                          type="number"
                          value={form.riskScore}
                          onChange={(event) => onChange({ ...form, riskScore: event.target.value })}
                        />
                        <Field
                          label="Assigned reviewer"
                          type="number"
                          list={reviewerDataListId}
                          value={form.assignedReviewerId}
                          onChange={(event) => onChange({ ...form, assignedReviewerId: event.target.value })}
                        />
                        <Field
                          label="Reviewer"
                          type="number"
                          list={reviewerDataListId}
                          value={form.reviewerId}
                          onChange={(event) => onChange({ ...form, reviewerId: event.target.value })}
                        />
                        <Field
                          label="Manual review"
                          as="select"
                          value={form.requiresManualReview ? 'yes' : 'no'}
                          onChange={(event) => onChange({ ...form, requiresManualReview: event.target.value === 'yes' })}
                        >
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </Field>
                        <Field
                          label="Reverify"
                          as="select"
                          value={form.requiresReverification ? 'yes' : 'no'}
                          onChange={(event) => onChange({ ...form, requiresReverification: event.target.value === 'yes' })}
                        >
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                        </Field>
                      </div>
                      <Field
                        label="Notes"
                        as="textarea"
                        rows={3}
                        value={form.reviewNotes}
                        onChange={(event) => onChange({ ...form, reviewNotes: event.target.value })}
                      />
                      <Field
                        label="Metadata (JSON)"
                        as="textarea"
                        rows={3}
                        value={form.metadata}
                        onChange={(event) => onChange({ ...form, metadata: event.target.value })}
                      />
                    </div>
                  ) : null}

                  <footer className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={goPrev}
                      disabled={currentStep === 0}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:opacity-60"
                    >
                      {busy ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />}
                      {currentStep === steps.length - 1 ? 'Create' : 'Next'}
                    </button>
                  </footer>
                </form>

                <datalist id={reviewerDataListId}>
                  {reviewers.map((reviewer) => (
                    <option key={reviewer.id} value={reviewer.id}>
                      {reviewer.name ?? reviewer.email ?? reviewer.id}
                    </option>
                  ))}
                </datalist>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

function Field({ label, as = 'input', children, ...rest }) {
  const Component = as;
  return (
    <label className="space-y-2 text-sm text-slate-700">
      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{label}</span>
      <Component
        {...rest}
        className={classNames(
          'w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none',
          as === 'textarea' ? 'min-h-[120px]' : '',
        )}
      >
        {children}
      </Component>
    </label>
  );
}
