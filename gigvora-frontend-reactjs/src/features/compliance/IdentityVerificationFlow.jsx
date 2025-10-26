import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowUpOnSquareIcon,
  CameraIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { classNames } from '../../utils/classNames.js';
import DataStatus from '../../components/DataStatus.jsx';
import { formatDateLabel, formatRelativeTime } from '../../utils/date.js';

const STEP_TONES = {
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  active: 'border-blue-200 bg-blue-50 text-blue-700',
  pending: 'border-slate-200 bg-white/70 text-slate-500',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  error: 'border-rose-200 bg-rose-50 text-rose-600',
};

const STATUS_COLORS = {
  verified: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  submitted: 'text-blue-600 bg-blue-50 border-blue-200',
  pending: 'text-slate-600 bg-slate-50 border-slate-200',
  rejected: 'text-rose-600 bg-rose-50 border-rose-200',
  expired: 'text-amber-600 bg-amber-50 border-amber-200',
};

function StepBadge({ step, isActive, onSelect }) {
  const tone = STEP_TONES[step.tone ?? (step.completed ? 'completed' : step.blocked ? 'warning' : 'pending')] ?? STEP_TONES.pending;

  return (
    <button
      type="button"
      onClick={() => onSelect(step)}
      className={classNames(
        'group relative flex w-full items-start gap-4 rounded-3xl border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200',
        tone,
        isActive ? 'ring-2 ring-offset-2 ring-blue-200' : 'hover:border-blue-200 hover:shadow-sm'
      )}
    >
      <span className="mt-1 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/80 text-sm font-semibold text-slate-600 shadow-sm">
        {step.order}
      </span>
      <span className="flex flex-1 flex-col gap-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wide text-slate-800">
            {step.title}
          </span>
          {step.completed ? (
            <CheckCircleIcon className="h-4 w-4 text-emerald-500" aria-hidden="true" />
          ) : null}
          {step.blocked ? (
            <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" aria-hidden="true" />
          ) : null}
        </span>
        <span className="text-xs text-slate-500">{step.description}</span>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {step.eta ? <span className="flex items-center gap-1"><ClockIcon className="h-3.5 w-3.5" />{step.eta}</span> : null}
          {step.updatedAt ? (
            <span title={formatDateLabel(step.updatedAt, { includeTime: true })}>
              Updated {formatRelativeTime(step.updatedAt)}
            </span>
          ) : null}
          {step.requires?.length ? <span>{step.requires.join(' • ')}</span> : null}
        </div>
      </span>
      <ChevronRightIcon className="mt-2 h-5 w-5 flex-shrink-0 text-slate-400 transition group-hover:translate-x-0.5" aria-hidden="true" />
    </button>
  );
}

StepBadge.propTypes = {
  step: PropTypes.shape({
    id: PropTypes.string.isRequired,
    order: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    completed: PropTypes.bool,
    blocked: PropTypes.bool,
    tone: PropTypes.oneOf(['completed', 'active', 'pending', 'warning', 'error']),
    updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    eta: PropTypes.string,
    requires: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  isActive: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};

function DocumentCard({ doc, onPreview, onUpload }) {
  const tone = doc.status && STATUS_COLORS[doc.status] ? STATUS_COLORS[doc.status] : 'text-slate-600 bg-white border-slate-200';
  const isBiometric = doc.category === 'biometric' || doc.type?.toLowerCase()?.includes('selfie');
  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-subtle">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">{doc.type}</p>
          <h4 className="mt-1 text-base font-semibold text-slate-900">{doc.label}</h4>
          <p className="mt-2 text-xs text-slate-500">{doc.hint}</p>
        </div>
        <span className={classNames('inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide', tone)}>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
          {doc.statusLabel ?? doc.status ?? 'pending'}
        </span>
      </div>
      <div className="mt-5 flex items-center gap-3 text-xs font-semibold">
        <button
          type="button"
          onClick={() => onPreview(doc)}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
        >
          <DocumentTextIcon className="h-4 w-4" aria-hidden="true" /> Preview
        </button>
        <button
          type="button"
          onClick={() => onUpload?.(doc)}
          className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-600 transition hover:border-blue-300 hover:bg-blue-100"
        >
          {isBiometric ? <CameraIcon className="h-4 w-4" aria-hidden="true" /> : <ArrowUpOnSquareIcon className="h-4 w-4" aria-hidden="true" />}
          {isBiometric ? 'Capture' : 'Upload'}
        </button>
      </div>
    </div>
  );
}

DocumentCard.propTypes = {
  doc: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    hint: PropTypes.string,
    status: PropTypes.string,
    statusLabel: PropTypes.string,
  }).isRequired,
  onPreview: PropTypes.func.isRequired,
  onUpload: PropTypes.func,
};

function TimelineEvent({ event, isActive }) {
  return (
    <div className={classNames('relative flex gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-subtle transition', isActive ? 'ring-2 ring-blue-200 ring-offset-2' : '')}>
      <span className="relative mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 via-white to-blue-100 text-blue-600 shadow-sm">
        {event.icon}
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">{event.title}</p>
          {event.severity ? (
            <span
              className={classNames(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                event.severity === 'critical'
                  ? 'bg-rose-100 text-rose-600'
                  : event.severity === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-600'
              )}
            >
              {event.severity}
            </span>
          ) : null}
        </div>
        <p className="text-xs text-slate-500">{event.description}</p>
        <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-slate-400">
          <span title={formatDateLabel(event.occurredAt, { includeTime: true })}>
            {formatRelativeTime(event.occurredAt)}
          </span>
          {event.actor ? (
            <span className="inline-flex items-center gap-1 text-slate-500">
              <UserCircleIcon className="h-4 w-4" aria-hidden="true" />
              {event.actor}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

TimelineEvent.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    occurredAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    actor: PropTypes.string,
    severity: PropTypes.oneOf(['info', 'warning', 'critical']),
    icon: PropTypes.node,
  }).isRequired,
  isActive: PropTypes.bool,
};

const FALLBACK_FLOW = {
  status: 'pending',
  statusLabel: 'Action required',
  riskLevel: 'medium',
  reviewEta: 'Under 24 hours',
  reviewer: 'Compliance Ops',
  updatedAt: new Date(),
  steps: [
    {
      id: 'profile',
      order: 1,
      title: 'Profile identity',
      description: 'Confirm legal name, birthdate, and home address before continuing.',
      completed: true,
      updatedAt: new Date(),
      eta: '2 mins',
    },
    {
      id: 'documents',
      order: 2,
      title: 'Upload government ID',
      description: 'Upload a high-resolution scan or photo of your passport or ID card.',
      completed: false,
      eta: '5 mins',
      requires: ['High-res photo', 'Full frame'],
    },
    {
      id: 'selfie',
      order: 3,
      title: 'Capture a live selfie',
      description: 'We use biometric checks to match your selfie to the document.',
      eta: '2 mins',
      blocked: false,
    },
    {
      id: 'review',
      order: 4,
      title: 'Compliance review',
      description: 'Our trust team verifies your submission and provides guidance if updates are needed.',
      eta: '4 hrs',
    },
  ],
  documents: [
    {
      id: 'passport',
      type: 'Document',
      label: 'Passport — Front',
      status: 'pending',
      hint: 'Upload a photo in colour showing all four corners clearly.',
    },
    {
      id: 'passport_back',
      type: 'Document',
      label: 'Passport — Back',
      status: 'pending',
      hint: 'Ensure MRZ line is readable and no glare is present.',
    },
    {
      id: 'selfie',
      type: 'Biometric',
      category: 'biometric',
      label: 'Real-time selfie',
      status: 'pending',
      hint: 'Find a bright space. Remove glasses and hats before recording.',
    },
  ],
  guidelines: [
    {
      id: 'lighting',
      title: 'Capture in a well-lit space',
      description:
        'Use natural lighting where possible and avoid harsh shadows. Keep your face and document entirely within the frame.',
    },
    {
      id: 'prepare_docs',
      title: 'Have your documents ready',
      description:
        'Accepted documents include passports, national identity cards, and driving licences issued within the last 10 years.',
    },
    {
      id: 'security',
      title: 'Your data is encrypted',
      description: 'All uploads use bank-grade encryption in transit and at rest. Only authorised reviewers can access them.',
    },
  ],
  timeline: [
    {
      id: 'created',
      title: 'Verification started',
      description: 'You triggered the process from the compliance checklist.',
      occurredAt: new Date(),
      actor: 'You',
      icon: <SparklesIcon className="h-4 w-4" aria-hidden="true" />,
      severity: 'info',
    },
    {
      id: 'documents_requested',
      title: 'Documents requested',
      description: 'We need a government-issued photo ID and selfie to complete verification.',
      occurredAt: new Date(),
      actor: 'Gigvora Trust',
      icon: <DocumentTextIcon className="h-4 w-4" aria-hidden="true" />,
      severity: 'info',
    },
  ],
};

const REVIEW_TONES = {
  low: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-rose-50 text-rose-600 border-rose-200',
};

export default function IdentityVerificationFlow({
  verification = FALLBACK_FLOW,
  loading,
  error,
  onRefresh,
  onUploadDocument,
  onCaptureSelfie,
  onSubmit,
  onRequestSupport,
  locale,
  timeZone,
}) {
  const [activeStep, setActiveStep] = useState(verification.steps?.[0] ?? FALLBACK_FLOW.steps[0]);
  const [preview, setPreview] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(verification.timeline?.[0]?.id ?? null);

  const statusTone = STATUS_COLORS[verification.status] ?? 'text-blue-700 bg-blue-50 border-blue-200';
  const riskTone = REVIEW_TONES[verification.riskLevel] ?? REVIEW_TONES.medium;

  const resolvedSteps = useMemo(() => verification.steps ?? FALLBACK_FLOW.steps, [verification.steps]);
  const resolvedDocuments = useMemo(() => verification.documents ?? FALLBACK_FLOW.documents, [verification.documents]);
  const resolvedTimeline = useMemo(() => verification.timeline ?? FALLBACK_FLOW.timeline, [verification.timeline]);
  const resolvedGuidelines = useMemo(() => verification.guidelines ?? FALLBACK_FLOW.guidelines, [verification.guidelines]);

  const activeEvent = useMemo(() => resolvedTimeline.find((item) => item.id === selectedEvent) ?? null, [resolvedTimeline, selectedEvent]);

  const handleDocumentPreview = (doc) => {
    setPreview({
      id: doc.id,
      title: doc.label,
      description: doc.hint,
      status: doc.status,
      updatedAt: doc.updatedAt ?? verification.updatedAt,
      url: doc.previewUrl,
    });
  };

  const handleDocumentUpload = (doc) => {
    if (doc.id === 'selfie' || doc.category === 'biometric') {
      onCaptureSelfie?.(doc);
    } else {
      onUploadDocument?.(doc);
    }
  };

  return (
    <section className="space-y-8 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Identity verification</p>
          <h2 className="text-2xl font-semibold text-slate-900">Verify your identity to unlock secure payouts</h2>
          <p className="text-sm text-slate-500">
            Submit your documents once. We guide you with real-time validation, secure document handling, and a transparent review status.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <span className={classNames('inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide', statusTone)}>
            <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
            {verification.statusLabel ?? verification.status ?? 'pending'}
          </span>
          <span className={classNames('inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-wide', riskTone)}>
            Risk: {verification.riskLevel ?? 'medium'}
          </span>
        </div>
      </header>

      <DataStatus
        loading={loading}
        error={error}
        lastUpdated={verification.updatedAt}
        fromCache={verification.fromCache}
        onRefresh={onRefresh}
        statusLabel="Verification status"
      >
        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <div className="space-y-4">
            {resolvedSteps.map((step) => (
              <StepBadge
                key={step.id}
                step={step}
                isActive={activeStep?.id === step.id}
                onSelect={(selected) => setActiveStep(selected)}
              />
            ))}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 p-6 shadow-subtle">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Step focus</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">{activeStep?.title ?? 'Compliance guidance'}</h3>
                  <p className="mt-2 text-sm text-slate-500">{activeStep?.description ?? 'Select a step to review the requirements and instructions.'}</p>
                </div>
                <SparklesIcon className="h-10 w-10 flex-shrink-0 text-blue-400" aria-hidden="true" />
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">What you&apos;ll need</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {(activeStep?.requirements ?? verification.requirements ?? ['Government-issued ID', 'Stable internet connection']).map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircleIcon className="mt-0.5 h-4 w-4 text-emerald-500" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Support &amp; SLA</p>
                  <ul className="mt-3 space-y-2 text-sm text-blue-700">
                    <li className="flex items-start gap-2">
                      <ClockIcon className="mt-0.5 h-4 w-4" aria-hidden="true" />
                      <span>Review ETA: {verification.reviewEta ?? 'Under 24 hours'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <InformationCircleIcon className="mt-0.5 h-4 w-4" aria-hidden="true" />
                      <span>Reviewer: {verification.reviewer ?? 'Compliance operations'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ShieldCheckIcon className="mt-0.5 h-4 w-4" aria-hidden="true" />
                      <span>All submissions are encrypted end-to-end.</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                <button
                  type="button"
                  onClick={() => onSubmit?.(activeStep)}
                  className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-600 px-4 py-2 text-white shadow-sm transition hover:bg-blue-500"
                >
                  Submit for review
                </button>
                <button
                  type="button"
                  onClick={() => onRequestSupport?.(activeStep)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                >
                  Need help?
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {resolvedDocuments.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} onPreview={handleDocumentPreview} onUpload={handleDocumentUpload} />
              ))}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Pro tips</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {resolvedGuidelines.map((tip) => (
                  <div key={tip.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-subtle">
                    <h4 className="text-sm font-semibold text-slate-900">{tip.title}</h4>
                    <p className="mt-2 text-xs text-slate-500">{tip.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-subtle">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Audit timeline</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">Track every change and reviewer touchpoint</h3>
                </div>
                <button
                  type="button"
                  onClick={() => onRequestSupport?.('timeline')}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
                >
                  Export audit trail
                </button>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-[320px,1fr]">
                <div className="space-y-3">
                  {resolvedTimeline.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setSelectedEvent(event.id)}
                      className={classNames(
                        'w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-left text-sm text-slate-600 transition hover:border-blue-200 hover:text-blue-600',
                        selectedEvent === event.id ? 'border-blue-300 bg-blue-50/80 text-blue-700 shadow-sm' : ''
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-800">{event.title}</span>
                        <span className="text-xs text-slate-400">{formatRelativeTime(event.occurredAt)}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{event.actor}</p>
                    </button>
                  ))}
                </div>
                <div className="space-y-4">
                  {activeEvent ? <TimelineEvent event={activeEvent} isActive /> : null}
                  {resolvedTimeline
                    .filter((event) => event.id !== activeEvent?.id)
                    .map((event) => (
                      <TimelineEvent key={event.id} event={event} />
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DataStatus>

      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-6 py-8">
          <div className="w-full max-w-3xl space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Document preview</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">{preview.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{preview.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
              >
                Close
              </button>
            </div>
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center">
              {preview.url ? (
                <img src={preview.url} alt={preview.title} className="mx-auto max-h-[360px] rounded-2xl object-contain" />
              ) : (
                <div className="space-y-3">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-slate-400" aria-hidden="true" />
                  <p className="text-sm text-slate-500">Preview unavailable until the file is uploaded.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setPreview(null);
                      onUploadDocument?.({ id: preview.id, label: preview.title });
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-500"
                  >
                    Upload now
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>Last updated {formatRelativeTime(preview.updatedAt)}</span>
              <span className="text-slate-300">•</span>
              <span>Status: {preview.status ?? 'pending'}</span>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

IdentityVerificationFlow.propTypes = {
  verification: PropTypes.shape({
    status: PropTypes.string,
    statusLabel: PropTypes.string,
    riskLevel: PropTypes.string,
    reviewEta: PropTypes.string,
    reviewer: PropTypes.string,
    updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    fromCache: PropTypes.bool,
    steps: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        order: PropTypes.number.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string,
        completed: PropTypes.bool,
        blocked: PropTypes.bool,
        tone: PropTypes.oneOf(['completed', 'active', 'pending', 'warning', 'error']),
        updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
        eta: PropTypes.string,
        requires: PropTypes.arrayOf(PropTypes.string),
        requirements: PropTypes.arrayOf(PropTypes.string),
      })
    ),
    documents: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        hint: PropTypes.string,
        status: PropTypes.string,
        statusLabel: PropTypes.string,
        updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
        previewUrl: PropTypes.string,
      })
    ),
    guidelines: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string,
      })
    ),
    timeline: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string,
        occurredAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
        actor: PropTypes.string,
        severity: PropTypes.oneOf(['info', 'warning', 'critical']),
        icon: PropTypes.node,
      })
    ),
    requirements: PropTypes.arrayOf(PropTypes.string),
  }),
  loading: PropTypes.bool,
  error: PropTypes.shape({
    message: PropTypes.string,
  }),
  onRefresh: PropTypes.func,
  onUploadDocument: PropTypes.func,
  onCaptureSelfie: PropTypes.func,
  onSubmit: PropTypes.func,
  onRequestSupport: PropTypes.func,
  locale: PropTypes.string,
  timeZone: PropTypes.string,
};

IdentityVerificationFlow.defaultProps = {
  locale: 'en-US',
};
