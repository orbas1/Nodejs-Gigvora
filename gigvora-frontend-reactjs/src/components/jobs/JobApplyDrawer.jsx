import { useEffect, useMemo, useState } from 'react';
import { formatRelativeTime } from '../../utils/date.js';

const STEPS = [
  { id: 'profile', title: 'Profile & intent' },
  { id: 'documents', title: 'Documents & evidence' },
  { id: 'review', title: 'Review & submit' },
];

function createDefaultState(job, session, resumeInsights) {
  return {
    name: session?.name ?? '',
    email: session?.email ?? '',
    phone: session?.phone ?? '',
    availability: '',
    message: '',
    resumeUrl: resumeInsights?.baselineUrl ?? '',
    coverLetter: '',
    portfolio: '',
    includeMentorReview: true,
    allowResumeDownload: true,
    subscribeAlerts: true,
    shareProfile: true,
    acknowledgement: false,
    metadata: {
      jobId: job?.id ?? null,
      jobTitle: job?.title ?? null,
    },
  };
}

function getStorageKey(job, session) {
  if (!job) {
    return null;
  }
  const id = job.id ?? job.slug ?? job.title ?? 'unknown-job';
  const userId = session?.id ?? session?.userId ?? 'guest';
  return `gigvora:web:apply-draft:${userId}:${id}`;
}

export default function JobApplyDrawer({
  open,
  job,
  onClose,
  onSubmit,
  resumeInsights,
  session,
}) {
  const storageKey = useMemo(() => getStorageKey(job, session), [job, session]);
  const [stepIndex, setStepIndex] = useState(0);
  const [formState, setFormState] = useState(() => createDefaultState(job, session, resumeInsights));
  const [status, setStatus] = useState({ saving: false, success: null, error: null });

  useEffect(() => {
    if (!open) {
      return;
    }
    setStepIndex(0);
    setStatus({ saving: false, success: null, error: null });
    setFormState((previous) => {
      const base = createDefaultState(job, session, resumeInsights);
      if (typeof window === 'undefined' || !storageKey) {
        return base;
      }
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) {
          return base;
        }
        const parsed = JSON.parse(raw);
        return { ...base, ...parsed, metadata: { ...base.metadata, ...parsed?.metadata } };
      } catch (error) {
        console.warn('Unable to parse application draft', error);
        return base;
      }
    });
  }, [open, job, session, resumeInsights, storageKey]);

  useEffect(() => {
    if (!open || typeof window === 'undefined' || !storageKey) {
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify({ ...formState, stepIndex }));
  }, [formState, stepIndex, storageKey, open]);

  const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100);

  const updateField = (field, value) => {
    setFormState((previous) => ({ ...previous, [field]: value }));
  };

  const canAdvanceProfile = Boolean(formState.name && formState.email);
  const canAdvanceDocuments = Boolean(formState.resumeUrl || formState.coverLetter || formState.portfolio);

  const handleNext = () => {
    if (stepIndex === 0 && !canAdvanceProfile) {
      setStatus({ saving: false, success: null, error: 'Add your name and email before continuing.' });
      return;
    }
    if (stepIndex === 1 && !canAdvanceDocuments) {
      setStatus({ saving: false, success: null, error: 'Share a resume, cover letter, or portfolio link to proceed.' });
      return;
    }
    setStatus({ saving: false, success: null, error: null });
    setStepIndex((index) => Math.min(STEPS.length - 1, index + 1));
  };

  const handlePrevious = () => {
    setStatus({ saving: false, success: null, error: null });
    setStepIndex((index) => Math.max(0, index - 1));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!job || status.saving) {
      return;
    }
    setStatus({ saving: true, success: null, error: null });
    try {
      await onSubmit?.({ job, payload: formState, stepIndex });
      if (typeof window !== 'undefined' && storageKey) {
        window.localStorage.removeItem(storageKey);
      }
      setStatus({ saving: false, success: 'Application submitted. We emailed a confirmation and saved it to your workspace.', error: null });
    } catch (error) {
      const message = error?.message || 'We could not submit your application right now. Try again in a moment.';
      setStatus({ saving: false, success: null, error: message });
    }
  };

  const reviewItems = useMemo(() => {
    return [
      { label: 'Role', value: job?.title ?? 'Unknown role' },
      { label: 'Company', value: job?.companyName ?? job?.clientName ?? '—' },
      { label: 'Resume', value: formState.resumeUrl || 'Attach a resume link or upload to continue.' },
      { label: 'Cover letter', value: formState.coverLetter ? `${formState.coverLetter.length} characters` : 'Optional' },
      { label: 'Portfolio', value: formState.portfolio || 'Optional' },
      { label: 'Availability', value: formState.availability || 'Add your first available start date.' },
      { label: 'Mentor review', value: formState.includeMentorReview ? 'Yes, route to mentor' : 'No mentor review needed' },
      { label: 'Share profile', value: formState.shareProfile ? 'Share my profile with the hiring team' : 'Only share application package' },
    ];
  }, [formState, job?.clientName, job?.companyName, job?.title]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-stretch justify-end" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        aria-hidden="true"
        onClick={() => onClose?.()}
      />
      <form onSubmit={handleSubmit} className="relative ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <header className="border-b border-slate-200 bg-gradient-to-r from-accent/10 via-white to-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Apply to</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">{job?.title ?? 'Opportunity'}</h2>
              <p className="text-sm text-slate-600">{job?.companyName ?? job?.clientName ?? 'Gigvora marketplace'}</p>
            </div>
            <button
              type="button"
              onClick={() => onClose?.()}
              className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            >
              Close
            </button>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>
                {stepIndex + 1} of {STEPS.length} · {STEPS[stepIndex].title}
              </span>
              <span>{progress}% complete</span>
            </div>
            <div className="h-1 rounded-full bg-slate-100">
              <div
                className="h-1 rounded-full bg-accent transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {status.error ? (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
              {status.error}
            </div>
          ) : null}
          {status.success ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
              {status.success}
            </div>
          ) : null}

          {stepIndex === 0 ? (
            <section className="space-y-4">
              <div>
                <label htmlFor="apply-name" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Full name
                </label>
                <input
                  id="apply-name"
                  type="text"
                  value={formState.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  autoComplete="name"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label htmlFor="apply-email" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Email
                </label>
                <input
                  id="apply-email"
                  type="email"
                  value={formState.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  autoComplete="email"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="apply-phone" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Phone (optional)
                </label>
                <input
                  id="apply-phone"
                  type="tel"
                  value={formState.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  autoComplete="tel"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  placeholder="+1 555 123 4567"
                />
              </div>
              <div>
                <label htmlFor="apply-availability" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  First available start date
                </label>
                <input
                  id="apply-availability"
                  type="text"
                  value={formState.availability}
                  onChange={(event) => updateField('availability', event.target.value)}
                  placeholder="e.g. 1 May or 4 weeks notice"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <div>
                <label htmlFor="apply-message" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Introduce yourself
                </label>
                <textarea
                  id="apply-message"
                  value={formState.message}
                  onChange={(event) => updateField('message', event.target.value)}
                  rows={4}
                  placeholder="Share why this role excites you and how you accelerate outcomes."
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-500">
                {job?.updatedAt ? (
                  <p>Role refreshed {formatRelativeTime(job.updatedAt)}. Highlight any recent wins since your last resume update.</p>
                ) : (
                  <p>Gigvora mentors review introductions to make sure your application lands with momentum.</p>
                )}
              </div>
            </section>
          ) : null}

          {stepIndex === 1 ? (
            <section className="space-y-4">
              <div>
                <label htmlFor="apply-resume" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Resume link
                </label>
                <input
                  id="apply-resume"
                  type="url"
                  value={formState.resumeUrl}
                  onChange={(event) => updateField('resumeUrl', event.target.value)}
                  placeholder="https://"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <div>
                <label htmlFor="apply-portfolio" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Portfolio or work samples
                </label>
                <textarea
                  id="apply-portfolio"
                  value={formState.portfolio}
                  onChange={(event) => updateField('portfolio', event.target.value)}
                  rows={3}
                  placeholder="Add URLs separated by new lines to showcase your best work."
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <div>
                <label htmlFor="apply-cover-letter" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Cover letter
                </label>
                <textarea
                  id="apply-cover-letter"
                  value={formState.coverLetter}
                  onChange={(event) => updateField('coverLetter', event.target.value)}
                  rows={6}
                  placeholder="Tell the hiring team how you will drive impact in the first 90 days."
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
              {resumeInsights?.summary ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-700">
                  <p className="font-semibold">Resume guidance</p>
                  <p className="mt-1 text-emerald-800">{resumeInsights.summary}</p>
                  {resumeInsights.lastUpdated ? (
                    <p className="mt-2 text-[11px] text-emerald-700/70">Updated {formatRelativeTime(resumeInsights.lastUpdated)}</p>
                  ) : null}
                </div>
              ) : null}
              <fieldset className="space-y-3 rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-600">
                <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">Guardrails</legend>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={formState.includeMentorReview}
                    onChange={(event) => updateField('includeMentorReview', event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/40"
                  />
                  <span>Route to my mentor for feedback before the recruiter sees it.</span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={formState.allowResumeDownload}
                    onChange={(event) => updateField('allowResumeDownload', event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/40"
                  />
                  <span>Allow the hiring team to download my resume.</span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={formState.shareProfile}
                    onChange={(event) => updateField('shareProfile', event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/40"
                  />
                  <span>Share my Gigvora profile with the recruiter.</span>
                </label>
              </fieldset>
            </section>
          ) : null}

          {stepIndex === 2 ? (
            <section className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-600">
                <h3 className="text-sm font-semibold text-slate-900">Application summary</h3>
                <dl className="mt-3 space-y-2">
                  {reviewItems.map((item) => (
                    <div key={item.label} className="flex flex-col rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</dt>
                      <dd className="text-sm text-slate-700">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <fieldset className="space-y-3 rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-600">
                <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">Final preferences</legend>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={formState.subscribeAlerts}
                    onChange={(event) => updateField('subscribeAlerts', event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/40"
                  />
                  <span>Send me interview nudges, reminders, and feedback tips.</span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={formState.acknowledgement}
                    onChange={(event) => updateField('acknowledgement', event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/40"
                  />
                  <span>I confirm my details are accurate and agree to Gigvora&apos;s talent terms.</span>
                </label>
              </fieldset>
            </section>
          ) : null}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 p-6">
          <div className="text-xs text-slate-500">
            {status.saving ? 'Submitting your application…' : job?.updatedAt ? `Last refreshed ${formatRelativeTime(job.updatedAt)}` : 'Powered by Gigvora'}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={stepIndex === 0 || status.saving}
              className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Back
            </button>
            {stepIndex < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={status.saving}
                className="inline-flex items-center rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={status.saving || !formState.acknowledgement}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
              >
                Submit application
              </button>
            )}
          </div>
        </footer>
      </form>
    </div>
  );
}
