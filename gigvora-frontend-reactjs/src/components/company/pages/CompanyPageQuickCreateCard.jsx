import { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

const DEFAULT_FORM = {
  title: '',
  headline: '',
  blueprint: 'employer_brand',
  visibility: 'private',
  summary: '',
  scheduledFor: '',
  tags: '',
};

export default function CompanyPageQuickCreateCard({ blueprints, onCreate, isSubmitting, visibilityOptions }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState(null);

  const blueprintOptions = blueprints?.length
    ? blueprints
    : [
        { id: 'employer_brand', name: 'Employer brand', description: 'Company story with benefits and culture.' },
        { id: 'program_landing', name: 'Program landing', description: 'Launch an initiative or cohort.' },
      ];

  const visibilityChoices = visibilityOptions?.length
    ? visibilityOptions
    : [
        { value: 'private', label: 'Private draft' },
        { value: 'internal', label: 'Internal review' },
        { value: 'public', label: 'Public' },
      ];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    if (!form.title.trim() || !form.headline.trim()) {
      setError('Title and headline are required.');
      return;
    }
    try {
      await onCreate?.({
        title: form.title,
        headline: form.headline,
        blueprint: form.blueprint,
        visibility: form.visibility,
        summary: form.summary,
        scheduledFor: form.scheduledFor || undefined,
        tags: form.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      setForm(DEFAULT_FORM);
    } catch (createError) {
      setError(createError?.message ?? 'Unable to create page.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Create new page</p>
          <h3 className="text-xl font-semibold text-slate-900">Launch in minutes</h3>
          <p className="mt-1 text-sm text-slate-600">
            Choose a blueprint, capture the essentials, and publish to your Gigvora presence instantly.
          </p>
        </div>
        <SparklesIcon className="hidden h-10 w-10 text-accent sm:block" />
      </div>

      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-2 text-sm text-rose-600">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="page-title" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Page title
          </label>
          <input
            id="page-title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="People team manifesto"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="page-headline" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Headline
          </label>
          <input
            id="page-headline"
            name="headline"
            value={form.headline}
            onChange={handleChange}
            placeholder="How our team shapes candidate experience across the globe"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            required
          />
        </div>

        <div>
          <label htmlFor="page-blueprint" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Blueprint
          </label>
          <select
            id="page-blueprint"
            name="blueprint"
            value={form.blueprint}
            onChange={handleChange}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {blueprintOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="page-visibility" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Visibility
          </label>
          <select
            id="page-visibility"
            name="visibility"
            value={form.visibility}
            onChange={handleChange}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {visibilityChoices.map((option) => (
              <option key={option.value ?? option} value={option.value ?? option}>
                {option.label ?? option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="page-schedule" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Schedule launch (optional)
          </label>
          <input
            id="page-schedule"
            name="scheduledFor"
            type="datetime-local"
            value={form.scheduledFor}
            onChange={handleChange}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div>
          <label htmlFor="page-tags" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Audience tags
          </label>
          <input
            id="page-tags"
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="Hiring, Mission, Benefits"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <p className="mt-1 text-xs text-slate-500">Comma separate tags to power search and analytics.</p>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="page-summary" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Summary
          </label>
          <textarea
            id="page-summary"
            name="summary"
            value={form.summary}
            onChange={handleChange}
            rows={3}
            placeholder="Introduce the page in a few sentences."
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">Publishing workflow enforces approvals and accessibility checks.</p>
        <button
          type="submit"
          disabled={isSubmitting || !form.title.trim() || !form.headline.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition hover:-translate-y-0.5 hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {isSubmitting ? 'Creating…' : 'Create page'}
        </button>
      </div>
    </form>
  );
}
