import { useMemo, useState } from 'react';
import { submitMentorProfile } from '../../services/mentorship.js';

const DEFAULT_FORM = {
  name: '',
  headline: '',
  email: '',
  timezone: '',
  expertise: '',
  sessionFee: 180,
  currency: '£',
  availabilityNotes: '',
  packages: '',
};

export default function MentorOnboardingForm({ onSubmitted, ctaLabel = 'Apply as mentor' }) {
  const [formState, setFormState] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const isValid = useMemo(() => {
    return formState.name.trim() && formState.email.trim() && formState.timezone.trim();
  }, [formState.name, formState.email, formState.timezone]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValid || submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitMentorProfile({
        name: formState.name,
        email: formState.email,
        headline: formState.headline,
        timezone: formState.timezone,
        expertise: formState.expertise.split(',').map((item) => item.trim()).filter(Boolean),
        sessionFee: {
          amount: Number(formState.sessionFee) || 0,
          currency: formState.currency,
        },
        availabilityNotes: formState.availabilityNotes,
        packages: formState.packages,
      });
      setSuccess(true);
      setFormState(DEFAULT_FORM);
      if (typeof onSubmitted === 'function') {
        onSubmitted();
      }
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit mentor profile right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Share your mentorship practice</h3>
        <p className="mt-1 text-sm text-slate-500">
          Tell us about your focus areas, pricing, and availability. We will activate your mentor profile and sync it to Explorer search.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Name
          <input
            type="text"
            value={formState.name}
            onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Jordan Patel"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Email
          <input
            type="email"
            value={formState.email}
            onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="mentor@gigvora.com"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Headline
          <input
            type="text"
            value={formState.headline}
            onChange={(event) => setFormState((current) => ({ ...current, headline: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Product strategy mentor & former CPO"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Preferred timezone
          <input
            type="text"
            value={formState.timezone}
            onChange={(event) => setFormState((current) => ({ ...current, timezone: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="GMT / London"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600 md:col-span-2">
          Focus areas
          <textarea
            rows="3"
            value={formState.expertise}
            onChange={(event) => setFormState((current) => ({ ...current, expertise: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Leadership sprints, strategic roadmaps, storytelling reviews"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Currency
          <input
            type="text"
            value={formState.currency}
            onChange={(event) => setFormState((current) => ({ ...current, currency: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Session fee
          <input
            type="number"
            min="0"
            value={formState.sessionFee}
            onChange={(event) => setFormState((current) => ({ ...current, sessionFee: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600 md:col-span-2">
          Availability notes
          <textarea
            rows="3"
            value={formState.availabilityNotes}
            onChange={(event) => setFormState((current) => ({ ...current, availabilityNotes: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Tuesday & Thursday afternoons for deep dives, Friday mornings for async reviews."
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600 md:col-span-2">
          Package overview
          <textarea
            rows="3"
            value={formState.packages}
            onChange={(event) => setFormState((current) => ({ ...current, packages: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="e.g. 6-week leadership pod (£1800), async storytelling lab (£650)"
          />
        </label>
      </div>
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-2 text-sm text-rose-600">{error}</p> : null}
      {success ? <p className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm text-emerald-600">Thanks – the mentor team will be in touch shortly.</p> : null}
      <button
        type="submit"
        disabled={!isValid || submitting}
        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {submitting ? 'Submitting…' : ctaLabel}
      </button>
    </form>
  );
}
