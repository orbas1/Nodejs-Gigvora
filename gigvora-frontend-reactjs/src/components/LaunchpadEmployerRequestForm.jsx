import { useMemo, useState } from 'react';
import analytics from '../services/analytics.js';
import { submitEmployerBrief } from '../services/launchpad.js';

export default function LaunchpadEmployerRequestForm({ launchpads, onSubmitted }) {
  const cohortOptions = useMemo(
    () => (Array.isArray(launchpads) ? launchpads.map((cohort) => ({ id: cohort.id, title: cohort.title })) : []),
    [launchpads],
  );

  const [formState, setFormState] = useState({
    launchpadId: cohortOptions[0]?.id ?? '',
    organizationName: '',
    contactName: '',
    contactEmail: '',
    headcount: '',
    engagementTypes: 'contract-to-hire, fractional',
    targetStartDate: '',
    idealCandidateProfile: '',
    hiringNotes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage('');

    try {
      const payload = {
        launchpadId: Number(formState.launchpadId) || undefined,
        organizationName: formState.organizationName.trim(),
        contactName: formState.contactName.trim(),
        contactEmail: formState.contactEmail.trim(),
        headcount: formState.headcount ? Number(formState.headcount) : undefined,
        engagementTypes: formState.engagementTypes,
        targetStartDate: formState.targetStartDate || undefined,
        idealCandidateProfile: formState.idealCandidateProfile.trim() || undefined,
        hiringNotes: formState.hiringNotes.trim() || undefined,
      };

      const brief = await submitEmployerBrief(payload);
      setSuccessMessage(
        `Request logged. We will curate launchpad fellows for ${brief.organizationName} within 48 hours.`,
      );
      analytics.track(
        'web_launchpad_employer_request_submitted',
        {
          launchpadId: brief.launchpadId,
          headcount: brief.headcount,
          engagementTypes: brief.engagementTypes,
        },
        { source: 'web_app' },
      );
      onSubmitted?.(brief);
    } catch (submissionError) {
      setError(submissionError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Request vetted fellows</h3>
        <p className="mt-1 text-sm text-slate-600">
          Tell us what your team needs and we will prepare a curated shortlist from the Launchpad pipeline, complete with
          readiness scores and interview availability.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
            Cohort
            <select
              name="launchpadId"
              value={formState.launchpadId}
              onChange={handleChange}
              required
              className="mt-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              {cohortOptions.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.title}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
            Headcount
            <input
              name="headcount"
              value={formState.headcount}
              onChange={handleChange}
              type="number"
              min="1"
              placeholder="e.g. 3"
              className="mt-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
            Organization
            <input
              name="organizationName"
              value={formState.organizationName}
              onChange={handleChange}
              required
              placeholder="Northwind Labs"
              className="mt-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
          <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
            Contact name
            <input
              name="contactName"
              value={formState.contactName}
              onChange={handleChange}
              required
              placeholder="Jules Carter"
              className="mt-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
            Contact email
            <input
              name="contactEmail"
              value={formState.contactEmail}
              onChange={handleChange}
              type="email"
              required
              placeholder="talent@northwindlabs.io"
              className="mt-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
          <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
            Target start date
            <input
              name="targetStartDate"
              value={formState.targetStartDate}
              onChange={handleChange}
              type="date"
              className="mt-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
        </div>
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Engagement types
          <input
            name="engagementTypes"
            value={formState.engagementTypes}
            onChange={handleChange}
            className="mt-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Ideal candidate profile
          <textarea
            name="idealCandidateProfile"
            value={formState.idealCandidateProfile}
            onChange={handleChange}
            rows={3}
            placeholder="Product leaders with analytics storytelling skills and mentorship track record."
            className="mt-2 rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Additional context
          <textarea
            name="hiringNotes"
            value={formState.hiringNotes}
            onChange={handleChange}
            rows={3}
            placeholder="Time-zone preferences, tech stack, mentoring expectations, interview windows…"
            className="mt-2 rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
        {error ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            {error.message || 'We could not log your request yet. Please verify the details and try again.'}
          </div>
        ) : null}
        {successMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Sending…' : 'Request shortlists'}
        </button>
      </form>
    </div>
  );
}
