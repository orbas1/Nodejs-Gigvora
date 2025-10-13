import { useMemo, useState } from 'react';
import analytics from '../services/analytics.js';
import { submitTalentApplication } from '../services/launchpad.js';

export default function LaunchpadTalentApplicationForm({ launchpads, onSubmitted }) {
  const cohortOptions = useMemo(
    () => (Array.isArray(launchpads) ? launchpads.map((cohort) => ({ id: cohort.id, title: cohort.title })) : []),
    [launchpads],
  );
  const [formState, setFormState] = useState({
    launchpadId: cohortOptions[0]?.id ?? '',
    applicantFirstName: '',
    applicantLastName: '',
    applicantEmail: '',
    yearsExperience: '',
    skills: '',
    targetSkills: '',
    portfolioUrl: '',
    availabilityDate: '',
    motivations: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        launchpadId: Number(formState.launchpadId) || undefined,
        applicantFirstName: formState.applicantFirstName.trim() || undefined,
        applicantLastName: formState.applicantLastName.trim() || undefined,
        applicantEmail: formState.applicantEmail.trim() || undefined,
        yearsExperience: formState.yearsExperience ? Number(formState.yearsExperience) : undefined,
        skills: formState.skills,
        targetSkills: formState.targetSkills,
        portfolioUrl: formState.portfolioUrl.trim() || undefined,
        availabilityDate: formState.availabilityDate || undefined,
        motivations: formState.motivations.trim() || undefined,
      };

      const application = await submitTalentApplication(payload);
      setResult(application);
      analytics.track(
        'web_launchpad_application_submitted',
        {
          launchpadId: application.launchpadId,
          status: application.status,
          qualificationScore: application.qualificationScore,
        },
        { source: 'web_app' },
      );
      onSubmitted?.(application);
    } catch (submissionError) {
      setError(submissionError);
    } finally {
      setSubmitting(false);
    }
  };

  const recommendedStatus = result?.eligibilitySnapshot?.recommendation?.recommendedStatus ?? result?.status;
  const readinessScore =
    result?.eligibilitySnapshot?.recommendation?.qualificationScore ?? result?.qualificationScore ?? 'N/A';

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Join as a fellow</h3>
        <p className="mt-1 text-sm text-slate-600">
          Share your experience so the Launchpad team can evaluate your readiness and line up the right mentor pods.
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
            Years of experience
            <input
              name="yearsExperience"
              value={formState.yearsExperience}
              onChange={handleChange}
              type="number"
              min="0"
              step="0.5"
              placeholder="e.g. 4"
              className="mt-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
            First name
            <input
              name="applicantFirstName"
              value={formState.applicantFirstName}
              onChange={handleChange}
              required
              className="mt-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              placeholder="Avery"
            />
          </label>
          <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
            Last name
            <input
              name="applicantLastName"
              value={formState.applicantLastName}
              onChange={handleChange}
              required
              className="mt-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              placeholder="Johnson"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
            Email
            <input
              name="applicantEmail"
              value={formState.applicantEmail}
              onChange={handleChange}
              type="email"
              required
              className="mt-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              placeholder="you@example.com"
            />
          </label>
          <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
            Availability date
            <input
              name="availabilityDate"
              value={formState.availabilityDate}
              onChange={handleChange}
              type="date"
              className="mt-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
        </div>
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Skills and focus areas
          <input
            name="skills"
            value={formState.skills}
            onChange={handleChange}
            required
            placeholder="Product strategy, Analytics storytelling"
            className="mt-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Skills you want to develop
          <input
            name="targetSkills"
            value={formState.targetSkills}
            onChange={handleChange}
            placeholder="Service design, Product analytics"
            className="mt-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Portfolio URL
          <input
            name="portfolioUrl"
            value={formState.portfolioUrl}
            onChange={handleChange}
            type="url"
            placeholder="https://portfolio.example.com"
            className="mt-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          What impact are you aiming for?
          <textarea
            name="motivations"
            value={formState.motivations}
            onChange={handleChange}
            rows={4}
            placeholder="Outline the type of leadership outcomes you want to unlock through the Launchpad."
            className="mt-2 rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
        {error ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            {error.message || 'Unable to submit your application right now. Try again shortly.'}
          </div>
        ) : null}
        {result ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Application received. Our team marked you as
            <span className="font-semibold"> {recommendedStatus}</span> with a readiness score of{' '}
            <span className="font-semibold">{readinessScore}</span>. We'll now queue you for Launchpad matches that reflect
            both your existing skills and the areas you want to grow into.
          </div>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit application'}
        </button>
      </form>
    </div>
  );
}
