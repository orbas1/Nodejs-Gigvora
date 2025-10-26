import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog } from '@headlessui/react';
import {
  ArrowLeftIcon,
  ArrowLongRightIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  PaperClipIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { BoltIcon, ClipboardDocumentListIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { classNames } from '../../utils/classNames.js';

const FilePropType = typeof File === 'undefined' ? PropTypes.any : PropTypes.instanceOf(File);

const INITIAL_FORM_STATE = Object.freeze({
  fullName: '',
  email: '',
  phone: '',
  location: '',
  linkedinUrl: '',
  portfolioUrl: '',
  coverLetter: '',
  achievements: [''],
  startDate: '',
  availabilityNotes: '',
  salaryExpectation: '',
  remotePreference: 'remote',
  relocationWilling: false,
  interviewAvailability: '',
  timezone: '',
  attachments: [],
  additionalNotes: '',
  consentToShareProfile: true,
});

const DEFAULT_STEPS = [
  { id: 'profile', title: 'Profile snapshot', description: 'Confirm essentials recruiters need in the first handshake.' },
  { id: 'story', title: 'Narrative & highlights', description: 'Surface achievements and answer smart questions.' },
  { id: 'availability', title: 'Availability & logistics', description: 'Lock in timelines, preferences, and expectations.' },
  { id: 'review', title: 'Review & submit', description: 'Double-check details before routing to the hiring pod.' },
];

function mergeFormState(base, defaults) {
  if (!defaults) return { ...base };
  const next = { ...base, ...defaults };
  next.achievements = (defaults.achievements && defaults.achievements.length ? defaults.achievements : base.achievements).map(
    (item) => item ?? ''
  );
  next.attachments = Array.isArray(defaults.attachments) ? defaults.attachments : base.attachments;
  return next;
}

function Stepper({ steps, activeStep }) {
  return (
    <ol className="grid grid-cols-4 gap-3">
      {steps.map((step, index) => {
        const state =
          index < activeStep ? 'complete' : index === activeStep ? 'active' : 'upcoming';
        return (
          <li
            key={step.id}
            className={classNames(
              'flex flex-col gap-2 rounded-2xl border p-3 text-xs font-semibold uppercase tracking-wide transition',
              state === 'complete'
                ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm'
                : state === 'active'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-slate-200 bg-white text-slate-500'
            )}
          >
            <span className="flex items-center gap-2 text-sm font-semibold normal-case">
              <span
                className={classNames(
                  'flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold',
                  state === 'complete'
                    ? 'border-emerald-400 bg-emerald-500 text-white'
                    : state === 'active'
                    ? 'border-accent bg-accent text-white'
                    : 'border-slate-200 bg-white text-slate-500'
                )}
              >
                {index + 1}
              </span>
              {step.title}
            </span>
            <span className="text-[11px] font-normal normal-case text-slate-500">{step.description}</span>
          </li>
        );
      })}
    </ol>
  );
}

Stepper.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
    })
  ).isRequired,
  activeStep: PropTypes.number.isRequired,
};

function AchievementField({ value, onChange, onRemove, canRemove }) {
  return (
    <div className="flex items-start gap-3">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Share a measurable achievement, result, or story."
        rows={3}
        className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
      {canRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:text-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
          aria-label="Remove achievement"
        >
          <XMarkIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

AchievementField.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  canRemove: PropTypes.bool,
};

AchievementField.defaultProps = {
  canRemove: true,
};

function ReviewRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-slate-900">{value || '—'}</span>
    </div>
  );
}

ReviewRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
};

ReviewRow.defaultProps = {
  value: null,
};

function formatAchievements(values) {
  return values.filter((item) => item && item.trim().length).join('\n\n');
}

function buildSubmissionPayload(formState, job) {
  return {
    jobId: job?.id ?? null,
    jobTitle: job?.title ?? null,
    submittedAt: new Date().toISOString(),
    ...formState,
    attachments: formState.attachments.map((item) => item.file ?? item),
  };
}

export default function JobApplyDrawer({
  open,
  onClose,
  job,
  onSubmit,
  defaultValues,
  submitting,
  steps,
  onStepChange,
  aiAssistant,
  onRequestAIDraft,
}) {
  const resolvedSteps = steps && steps.length ? steps : DEFAULT_STEPS;
  const [activeStep, setActiveStep] = useState(0);
  const [formState, setFormState] = useState(() => mergeFormState(INITIAL_FORM_STATE, defaultValues));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setFormState(mergeFormState(INITIAL_FORM_STATE, defaultValues));
      setActiveStep(0);
      setErrors({});
    }
  }, [open, defaultValues]);

  useEffect(() => {
    onStepChange?.(resolvedSteps[activeStep]?.id ?? null);
  }, [activeStep, resolvedSteps, onStepChange]);

  const handleFieldChange = (field, value) => {
    setFormState((previous) => ({ ...previous, [field]: value }));
  };

  const handleToggle = (field) => {
    setFormState((previous) => ({ ...previous, [field]: !previous[field] }));
  };

  const handleAchievementChange = (index, value) => {
    setFormState((previous) => {
      const next = [...previous.achievements];
      next[index] = value;
      return { ...previous, achievements: next };
    });
  };

  const addAchievement = () => {
    setFormState((previous) => ({ ...previous, achievements: [...previous.achievements, ''] }));
  };

  const removeAchievement = (index) => {
    setFormState((previous) => ({
      ...previous,
      achievements: previous.achievements.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleAttachmentUpload = (event) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setFormState((previous) => ({
      ...previous,
      attachments: [
        ...previous.attachments,
        ...files.map((file) => ({
          id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          size: file.size,
          file,
        })),
      ],
    }));
    event.target.value = '';
  };

  const removeAttachment = (id) => {
    setFormState((previous) => ({
      ...previous,
      attachments: previous.attachments.filter((item) => (item.id ?? item.name) !== id),
    }));
  };

  const validateStep = (stepId) => {
    const nextErrors = {};
    if (stepId === 'profile') {
      if (!formState.fullName.trim()) {
        nextErrors.fullName = 'Tell us who the hiring team will meet.';
      }
      if (!formState.email.trim()) {
        nextErrors.email = 'Add the best email for scheduling.';
      }
    }
    if (stepId === 'story') {
      const hasNarrative = formState.coverLetter.trim().length > 0 ||
        formState.achievements.some((item) => item.trim().length > 0);
      if (!hasNarrative) {
        nextErrors.story = 'Share at least one highlight so we can champion you.';
      }
    }
    if (stepId === 'availability') {
      if (!formState.startDate && !formState.availabilityNotes.trim()) {
        nextErrors.availability = 'Confirm a target start or share context so planning is smooth.';
      }
    }
    if (stepId === 'review') {
      if (!formState.consentToShareProfile) {
        nextErrors.consentToShareProfile = 'Consent is required to introduce you to the hiring pod.';
      }
    }
    setErrors(nextErrors);
    return nextErrors;
  };

  const goNext = () => {
    const stepId = resolvedSteps[activeStep]?.id;
    const stepErrors = validateStep(stepId);
    if (Object.keys(stepErrors).length) return;
    if (activeStep < resolvedSteps.length - 1) {
      setActiveStep((value) => value + 1);
    } else {
      handleSubmit();
    }
  };

  const goBack = () => {
    if (activeStep === 0) return;
    setActiveStep((value) => value - 1);
    setErrors({});
  };

  const handleSubmit = () => {
    const finalErrors = validateStep('review');
    if (Object.keys(finalErrors).length) {
      setActiveStep(resolvedSteps.findIndex((step) => step.id === 'review'));
      return;
    }
    onSubmit?.(buildSubmissionPayload(formState, job));
  };

  const attachmentsLabel = useMemo(() => {
    if (!formState.attachments.length) return 'No attachments yet';
    const totalSize = formState.attachments.reduce((acc, item) => acc + (item.size ?? 0), 0);
    const sizeInMb = totalSize / (1024 * 1024);
    return `${formState.attachments.length} attachment${formState.attachments.length === 1 ? '' : 's'} • ${sizeInMb.toFixed(1)} MB`;
  }, [formState.attachments]);

  const renderStoryAssist = () => (
    <div className="rounded-2xl border border-dashed border-accent/40 bg-accent/5 p-4 text-sm text-slate-600">
      <div className="flex items-start gap-3">
        <SparklesIcon className="h-6 w-6 text-accent" aria-hidden="true" />
        <div className="flex-1">
          <p className="font-semibold text-slate-900">Need a boost?</p>
          <p className="mt-1 text-xs text-slate-500">
            Summarize your impact and let Gigvora craft a concise narrative tuned to the role.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onRequestAIDraft?.({ job, formState })}
              className="inline-flex items-center gap-2 rounded-full border border-accent bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-accent transition hover:bg-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <BoltIcon className="h-4 w-4" aria-hidden="true" />
              Generate AI draft
            </button>
            {aiAssistant?.tips?.length ? (
              <ul className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                {aiAssistant.tips.map((tip) => (
                  <li key={tip} className="rounded-full bg-white px-3 py-1 shadow-sm">
                    {tip}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );

  const stepId = resolvedSteps[activeStep]?.id;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-slate-900/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-stretch justify-end">
        <Dialog.Panel className="flex h-full w-full max-w-3xl flex-col gap-6 overflow-y-auto border-l border-slate-200 bg-gradient-to-b from-white via-white/95 to-slate-50 p-6 shadow-2xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Dialog.Title className="text-2xl font-semibold text-slate-900">Smart apply</Dialog.Title>
              <p className="text-sm text-slate-600">
                Tailor your submission for <span className="font-semibold text-slate-900">{job?.title ?? 'this opportunity'}</span> and send it directly to the hiring pod.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Close apply drawer</span>
              </button>
            </div>
          </header>

          <Stepper steps={resolvedSteps} activeStep={activeStep} />

          <div className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-inner">
            {stepId === 'profile' ? (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="apply-full-name" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Full name
                    </label>
                    <input
                      id="apply-full-name"
                      type="text"
                      value={formState.fullName}
                      onChange={(event) => handleFieldChange('fullName', event.target.value)}
                      className={classNames(
                        'w-full rounded-2xl border px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30',
                        errors.fullName ? 'border-rose-400' : 'border-slate-200'
                      )}
                      placeholder="Alex Morgan"
                    />
                    {errors.fullName ? (
                      <p className="text-xs text-rose-500">{errors.fullName}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="apply-email" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Email
                    </label>
                    <input
                      id="apply-email"
                      type="email"
                      value={formState.email}
                      onChange={(event) => handleFieldChange('email', event.target.value)}
                      className={classNames(
                        'w-full rounded-2xl border px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30',
                        errors.email ? 'border-rose-400' : 'border-slate-200'
                      )}
                      placeholder="alex@gigvora.com"
                    />
                    {errors.email ? <p className="text-xs text-rose-500">{errors.email}</p> : null}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="apply-phone" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Phone / WhatsApp
                    </label>
                    <input
                      id="apply-phone"
                      type="tel"
                      value={formState.phone}
                      onChange={(event) => handleFieldChange('phone', event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      placeholder="+1 555 123 4567"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="apply-location" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Location
                    </label>
                    <input
                      id="apply-location"
                      type="text"
                      value={formState.location}
                      onChange={(event) => handleFieldChange('location', event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      placeholder="Berlin, Germany"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="apply-linkedin" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      LinkedIn or public profile
                    </label>
                    <input
                      id="apply-linkedin"
                      type="url"
                      value={formState.linkedinUrl}
                      onChange={(event) => handleFieldChange('linkedinUrl', event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      placeholder="https://linkedin.com/in/"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="apply-portfolio" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Portfolio / case studies
                    </label>
                    <input
                      id="apply-portfolio"
                      type="url"
                      value={formState.portfolioUrl}
                      onChange={(event) => handleFieldChange('portfolioUrl', event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      placeholder="https://work.example.com"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="apply-timezone" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Timezone
                    </label>
                    <input
                      id="apply-timezone"
                      type="text"
                      value={formState.timezone}
                      onChange={(event) => handleFieldChange('timezone', event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      placeholder="UTC+1"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {stepId === 'story' ? (
              <div className="space-y-6">
                {renderStoryAssist()}
                <div className="flex flex-col gap-2">
                  <label htmlFor="apply-cover-letter" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Cover letter / intro message
                  </label>
                  <textarea
                    id="apply-cover-letter"
                    value={formState.coverLetter}
                    onChange={(event) => handleFieldChange('coverLetter', event.target.value)}
                    rows={6}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    placeholder="Share context, motivation, and what impact you unlock in the first 90 days."
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Signature achievements</span>
                    <button
                      type="button"
                      onClick={addAchievement}
                      className="inline-flex items-center gap-2 rounded-full border border-accent bg-white px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    >
                      Add achievement
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {formState.achievements.map((achievement, index) => (
                      <AchievementField
                        key={`achievement-${index}`}
                        value={achievement}
                        onChange={(value) => handleAchievementChange(index, value)}
                        onRemove={() => removeAchievement(index)}
                        canRemove={formState.achievements.length > 1}
                      />
                    ))}
                  </div>
                </div>
                {errors.story ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-2 text-xs font-semibold text-rose-600">
                    <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
                    {errors.story}
                  </div>
                ) : null}
              </div>
            ) : null}

            {stepId === 'availability' ? (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="apply-start-date" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Target start date
                    </label>
                    <input
                      id="apply-start-date"
                      type="date"
                      value={formState.startDate}
                      onChange={(event) => handleFieldChange('startDate', event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="apply-availability-notes" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Interview availability
                    </label>
                    <input
                      id="apply-availability-notes"
                      type="text"
                      value={formState.interviewAvailability}
                      onChange={(event) => handleFieldChange('interviewAvailability', event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      placeholder="Weekdays after 2pm CET"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="apply-salary" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Compensation expectations
                    </label>
                    <input
                      id="apply-salary"
                      type="text"
                      value={formState.salaryExpectation}
                      onChange={(event) => handleFieldChange('salaryExpectation', event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      placeholder="$120k base + performance bonus"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="apply-availability" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Notes & flexibility
                    </label>
                    <textarea
                      id="apply-availability"
                      value={formState.availabilityNotes}
                      onChange={(event) => handleFieldChange('availabilityNotes', event.target.value)}
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      placeholder="Notice period, travel preferences, or relocation support."
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('remotePreference', 'remote')}
                    className={classNames(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
                      formState.remotePreference === 'remote'
                        ? 'border-accent bg-accent text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-accent/60 hover:text-accent'
                    )}
                  >
                    Remote first
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('remotePreference', 'hybrid')}
                    className={classNames(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
                      formState.remotePreference === 'hybrid'
                        ? 'border-accent bg-accent text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-accent/60 hover:text-accent'
                    )}
                  >
                    Hybrid
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('remotePreference', 'onsite')}
                    className={classNames(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
                      formState.remotePreference === 'onsite'
                        ? 'border-accent bg-accent text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-accent/60 hover:text-accent'
                    )}
                  >
                    Onsite preferred
                  </button>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={formState.relocationWilling}
                      onChange={() => handleToggle('relocationWilling')}
                      className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                    />
                    Open to relocation
                  </label>
                </div>
                {errors.availability ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-2 text-xs font-semibold text-rose-600">
                    <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
                    {errors.availability}
                  </div>
                ) : null}
              </div>
            ) : null}

            {stepId === 'review' ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  <div className="flex items-center gap-3">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-accent" aria-hidden="true" />
                    <div>
                      <p className="text-base font-semibold text-slate-900">Snapshot</p>
                      <p className="text-xs text-slate-500">Preview what the hiring pod will see when we champion you.</p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ReviewRow label="Full name" value={formState.fullName} />
                    <ReviewRow label="Email" value={formState.email} />
                    <ReviewRow label="Location" value={formState.location} />
                    <ReviewRow label="Timezone" value={formState.timezone} />
                    <ReviewRow label="LinkedIn" value={formState.linkedinUrl} />
                    <ReviewRow label="Portfolio" value={formState.portfolioUrl} />
                    <ReviewRow label="Start date" value={formState.startDate} />
                    <ReviewRow label="Compensation" value={formState.salaryExpectation} />
                    <ReviewRow label="Remote preference" value={formState.remotePreference} />
                  </div>
                  <ReviewRow label="Highlights" value={formatAchievements(formState.achievements)} />
                  <ReviewRow label="Cover letter" value={formState.coverLetter} />
                  <ReviewRow label="Availability notes" value={formState.availabilityNotes} />
                  <ReviewRow label="Attachments" value={attachmentsLabel} />
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="apply-attachments" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Upload attachments
                    </label>
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-600">
                      <input id="apply-attachments" type="file" multiple className="hidden" onChange={handleAttachmentUpload} />
                      <label htmlFor="apply-attachments" className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-accent bg-white px-4 py-2 text-xs font-semibold text-accent transition hover:bg-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
                        <PaperClipIcon className="h-4 w-4" aria-hidden="true" />
                        Add files
                      </label>
                      <p className="mt-2 text-xs text-slate-500">Upload resumes, case studies, or reference decks (PDF, DOCX, PPT).</p>
                    </div>
                  </div>
                  {formState.attachments.length ? (
                    <ul className="space-y-2 text-sm text-slate-600">
                      {formState.attachments.map((attachment) => (
                        <li key={attachment.id ?? attachment.name} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">{attachment.name}</span>
                            <span className="text-xs text-slate-500">{attachment.size ? `${(attachment.size / (1024 * 1024)).toFixed(2)} MB` : 'Attachment'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(attachment.id ?? attachment.name)}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-rose-200 hover:text-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={formState.consentToShareProfile}
                    onChange={() => handleToggle('consentToShareProfile')}
                    className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                  />
                  I authorize Gigvora to share my profile and application details with the hiring pod.
                </label>
                {errors.consentToShareProfile ? (
                  <p className="text-xs text-rose-500">{errors.consentToShareProfile}</p>
                ) : null}
                <textarea
                  value={formState.additionalNotes}
                  onChange={(event) => handleFieldChange('additionalNotes', event.target.value)}
                  rows={3}
                  placeholder="Any additional context we should relay to the hiring team?"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            ) : null}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircleIcon className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              Securely synced to your Gigvora job hub.
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goBack}
                disabled={activeStep === 0 || submitting}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
                Back
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-accentDark focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {activeStep === resolvedSteps.length - 1 ? (
                  <>
                    {submitting ? <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                    Submit application
                  </>
                ) : (
                  <>
                    Next step
                    <ArrowLongRightIcon className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </footer>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

const JobShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  title: PropTypes.string,
});

JobApplyDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  job: JobShape,
  onSubmit: PropTypes.func,
  defaultValues: PropTypes.shape({
    fullName: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    location: PropTypes.string,
    linkedinUrl: PropTypes.string,
    portfolioUrl: PropTypes.string,
    coverLetter: PropTypes.string,
    achievements: PropTypes.arrayOf(PropTypes.string),
    startDate: PropTypes.string,
    availabilityNotes: PropTypes.string,
    salaryExpectation: PropTypes.string,
    remotePreference: PropTypes.string,
    relocationWilling: PropTypes.bool,
    interviewAvailability: PropTypes.string,
    timezone: PropTypes.string,
    attachments: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.shape({
          id: PropTypes.string,
          name: PropTypes.string,
          size: PropTypes.number,
          file: FilePropType,
        }),
        FilePropType,
      ])
    ),
    additionalNotes: PropTypes.string,
    consentToShareProfile: PropTypes.bool,
  }),
  submitting: PropTypes.bool,
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
    })
  ),
  onStepChange: PropTypes.func,
  aiAssistant: PropTypes.shape({
    tips: PropTypes.arrayOf(PropTypes.string),
  }),
  onRequestAIDraft: PropTypes.func,
};

JobApplyDrawer.defaultProps = {
  job: null,
  onSubmit: undefined,
  defaultValues: undefined,
  submitting: false,
  steps: undefined,
  onStepChange: undefined,
  aiAssistant: undefined,
  onRequestAIDraft: undefined,
};
