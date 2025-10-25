import { useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  CheckBadgeIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import SectionShell from '../SectionShell.jsx';
import useSession from '../../../../hooks/useSession.js';
import useFreelancerReferences from '../../../../hooks/useFreelancerReferences.js';
import StatusBadge from '../../../../components/common/StatusBadge.jsx';

function ReferenceStatusBadge({ status, verified }) {
  const resolvedStatus = verified ? 'verified' : status;
  return (
    <StatusBadge
      status={resolvedStatus}
      category="reference"
      icon={verified ? ShieldCheckIcon : undefined}
      uppercase
    />
  );
}

function ReferenceCard({ reference, onVerify }) {
  const actionable = !reference.verified && reference.status !== 'declined';
  const handleVerify = async () => {
    try {
      await onVerify?.(reference.id);
    } catch (verifyError) {
      console.error('Unable to verify reference', verifyError);
    }
  };
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{reference.client}</p>
            <p className="text-xs text-slate-500">{reference.company || reference.relationship}</p>
          </div>
          <ReferenceStatusBadge status={reference.status} verified={reference.verified} />
        </div>
        {reference.quote ? <p className="text-sm text-slate-600">“{reference.quote}”</p> : null}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          {reference.rating ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-blue-700">
              <StarIcon className="h-4 w-4 text-amber-400" />
              {reference.rating.toFixed ? reference.rating.toFixed(1) : reference.rating}
            </span>
          ) : null}
          {reference.weight ? <span className="text-xs text-slate-500">{reference.weight}</span> : null}
        </div>
        {actionable ? (
          <button
            type="button"
            onClick={handleVerify}
            className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
          >
            <CheckBadgeIcon className="h-4 w-4" />
            Verify
          </button>
        ) : null}
      </div>
    </article>
  );
}

function SummaryCard({ item }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{item.value}</p>
      <p className="mt-1 text-xs text-slate-500">{item.hint}</p>
    </div>
  );
}

function formatDate(date) {
  if (!date) {
    return '—';
  }
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date instanceof Date ? date : new Date(date));
  } catch (error) {
    return `${date}`;
  }
}

export default function ReferencesSection() {
  const { session } = useSession();
  const [requestState, setRequestState] = useState({ status: 'idle', error: null });
  const [formValues, setFormValues] = useState({
    clientName: '',
    email: '',
    relationship: '',
    message: '',
  });

  const role = (session?.activeRole ?? session?.role ?? session?.workspace?.role ?? '').toString().toLowerCase();
  const memberships = Array.isArray(session?.memberships)
    ? session.memberships.map((membership) => membership.toString().toLowerCase())
    : [];
  const workspaceType = (session?.workspace?.type ?? '').toString().toLowerCase();
  const hasAccess =
    role.includes('freelancer') ||
    memberships.some((membership) => membership.includes('freelancer')) ||
    workspaceType.includes('freelancer');

  const freelancerId =
    session?.freelancerId ??
    session?.profileId ??
    session?.primaryProfileId ??
    session?.userId ??
    session?.id ??
    null;

  const {
    references,
    publishedReferences,
    pendingReferences,
    summary,
    insights,
    compliance,
    timeline,
    settings,
    settingsSaving,
    settingsError,
    updateSettings,
    requestReference,
    verifyReference,
    loading,
    error,
    refresh,
    lastUpdated,
    fromCache,
  } = useFreelancerReferences({ freelancerId, enabled: hasAccess });

  const pendingTimeline = useMemo(() => timeline.filter((entry) => !entry.verified), [timeline]);

  const handleToggleChange = async (key) => {
    try {
      await updateSettings({ [key]: !settings[key] });
    } catch (updateError) {
      console.error('Unable to update reference setting', updateError);
    }
  };

  const handleSubmitRequest = async (event) => {
    event.preventDefault();
    setRequestState({ status: 'submitting', error: null });
    try {
      await requestReference(formValues);
      setRequestState({ status: 'success', error: null });
      setFormValues({ clientName: '', email: '', relationship: '', message: '' });
    } catch (submitError) {
      setRequestState({ status: 'error', error: submitError });
    }
  };

  const renderUnauthorized = () => (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 shadow-sm">
      <p className="font-semibold">Freelancer access required</p>
      <p className="mt-2 text-sm">
        References governance lives within the freelancer workspace. Switch to a freelancer profile with the secure role toggle
        to manage testimonials and endorsements.
      </p>
    </div>
  );

  return (
    <SectionShell
      id="references"
      title="References & reviews"
      description="Curate testimonials, references, and optional private endorsements."
      actions={
        hasAccess ? (
          <button
            type="button"
            onClick={() => refresh({ force: true })}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        ) : null
      }
    >
      {!hasAccess ? (
        renderUnauthorized()
      ) : (
        <div className="space-y-6">
          {error ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
              <p className="font-semibold">We could not load the latest references.</p>
              <p className="mt-1 text-sm">{error.message ?? 'Try refreshing or check your connection.'}</p>
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Trust & social proof snapshot</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {lastUpdated ? `Updated ${formatDate(lastUpdated)}` : 'Live reputation telemetry'}
                      {fromCache ? ' • Showing cached insights while we secure the network' : ''}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <ShieldCheckIcon className="h-4 w-4" />
                    {Math.round(compliance.verifiedRatio * 100) || 0}% verified coverage
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {summary.map((item) => (
                    <SummaryCard key={item.label} item={item} />
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Live references</p>
                    <p className="mt-1 text-xs text-slate-500">Published testimonials surfaced across your funnels.</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    <SparklesIcon className="h-4 w-4" />
                    Signal-ready
                  </div>
                </div>
                <div className={`mt-4 grid gap-4 sm:grid-cols-2 ${loading ? 'opacity-70' : ''}`}>
                  {publishedReferences.length ? (
                    publishedReferences.map((reference) => (
                      <ReferenceCard key={reference.id} reference={reference} onVerify={verifyReference} />
                    ))
                  ) : (
                    <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                      No published references yet. Invite a client below to capture their endorsement.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Follow-ups & verifications</p>
                    <p className="mt-1 text-xs text-slate-500">Keep the pipeline healthy by nudging clients still in review.</p>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    <EnvelopeIcon className="h-4 w-4" />
                    {pendingReferences.length} outstanding
                  </div>
                </div>

                <ol className="mt-4 space-y-3 text-sm text-slate-600">
                  {pendingTimeline.length ? (
                    pendingTimeline.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{entry.title}</p>
                          <p className="text-xs text-slate-500">Last contact {formatDate(entry.interactionDate)}</p>
                        </div>
                        <ReferenceStatusBadge status={entry.status} verified={entry.verified} />
                      </li>
                    ))
                  ) : (
                    <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                      All reference requests are verified. Great job maintaining your trust signals.
                    </li>
                  )}
                </ol>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Automation controls</p>
                <p className="mt-1 text-xs text-slate-500">
                  Toggle sharing and privacy with instant sync to mobile, web, and API surfaces.
                </p>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  {[{
                    key: 'allowPrivate',
                    label: 'Allow private references',
                    description: 'Keep select references internal for enterprise diligence requests.',
                  },
                  {
                    key: 'showBadges',
                    label: 'Showcase review badges',
                    description: 'Surface verified reference badges across public profiles and pitch decks.',
                  },
                  {
                    key: 'autoShareToFeed',
                    label: 'Share wins to community feed',
                    description: 'Automatically celebrate new testimonials with opt-in social posts.',
                  },
                  {
                    key: 'autoRequest',
                    label: 'Auto-request after delivery',
                    description: 'Send reference invites after milestones close, respecting quiet hours.',
                  },
                  {
                    key: 'escalateConcerns',
                    label: 'Escalate flagged responses',
                    description: 'Route negative feedback to support for proactive mitigation.',
                  }].map((item) => (
                    <label
                      key={item.key}
                      className={`block rounded-2xl border px-4 py-3 ${
                        settings[item.key]
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{item.label}</p>
                          <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={Boolean(settings[item.key])}
                          onChange={() => handleToggleChange(item.key)}
                          disabled={settingsSaving}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                        />
                      </div>
                    </label>
                  ))}
                </div>
                {settingsSaving ? (
                  <p className="mt-3 text-xs font-semibold text-blue-600">Saving updates…</p>
                ) : null}
                {settingsError ? (
                  <p className="mt-2 text-xs font-semibold text-rose-600">
                    We could not update the automation preferences. Please try again.
                  </p>
                ) : null}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Request a new reference</p>
                <p className="mt-1 text-xs text-slate-500">Secure invites send from Gigvora with audit trails and encryption.</p>
                <form className="mt-4 space-y-4" onSubmit={handleSubmitRequest}>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="reference-client">
                      Client name
                    </label>
                    <input
                      id="reference-client"
                      type="text"
                      required
                      value={formValues.clientName}
                      onChange={(event) => setFormValues((previous) => ({ ...previous, clientName: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                      placeholder="e.g. Priya Desai"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="reference-email">
                      Email
                    </label>
                    <input
                      id="reference-email"
                      type="email"
                      value={formValues.email}
                      onChange={(event) => setFormValues((previous) => ({ ...previous, email: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                      placeholder="client@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                      htmlFor="reference-relationship"
                    >
                      Relationship
                    </label>
                    <input
                      id="reference-relationship"
                      type="text"
                      value={formValues.relationship}
                      onChange={(event) =>
                        setFormValues((previous) => ({ ...previous, relationship: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                      placeholder="e.g. Chief Product Officer"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="reference-message">
                      Personal note (optional)
                    </label>
                    <textarea
                      id="reference-message"
                      rows={3}
                      value={formValues.message}
                      onChange={(event) => setFormValues((previous) => ({ ...previous, message: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                      placeholder="Share context or outcomes to help your client craft a strong testimonial."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={requestState.status === 'submitting'}
                    className="w-full rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {requestState.status === 'submitting' ? 'Sending secure invite…' : 'Send secure reference invite'}
                  </button>
                </form>
                {requestState.status === 'success' ? (
                  <p className="mt-3 text-xs font-semibold text-emerald-600">Invite sent. We’ll notify you once it’s complete.</p>
                ) : null}
                {requestState.status === 'error' ? (
                  <p className="mt-3 text-xs font-semibold text-rose-600">
                    {requestState.error?.message ?? 'Unable to send the invite. Please verify the details and retry.'}
                  </p>
                ) : null}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Security & compliance</p>
                <p className="mt-1 text-xs text-slate-500">
                  Endorsements are encrypted in transit and at rest. Only verified teammates can access sensitive detail.
                </p>
                <ul className="mt-4 space-y-3 text-xs text-slate-600">
                  <li className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <LockClosedIcon className="h-4 w-4 text-slate-400" />
                    {compliance.privateReferences} private references stored with zero-trust policies.
                  </li>
                  <li className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <ShieldCheckIcon className="h-4 w-4 text-slate-400" />
                    {references.length} total references monitored for tamper signals.
                  </li>
                  <li className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <SparklesIcon className="h-4 w-4 text-slate-400" />
                    Response rate {Math.round((insights.responseRate ?? 0) * 100) || 0}% tracked against service level guardrails.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </SectionShell>
  );
}
