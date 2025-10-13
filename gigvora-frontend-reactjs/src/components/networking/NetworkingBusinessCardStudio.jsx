import { useState } from 'react';

export default function NetworkingBusinessCardStudio({
  cards = [],
  onCreateCard,
  onRefresh,
  disabled,
  loading = false,
  errorMessage = null,
}) {
  const [form, setForm] = useState({
    title: 'Founder intro card',
    headline: 'Building the future of remote work marketplaces',
    contactEmail: '',
    contactPhone: '',
    websiteUrl: '',
    linkedinUrl: '',
    status: 'draft',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!onCreateCard) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onCreateCard(form);
      setForm((previous) => ({ ...previous, contactEmail: '', contactPhone: '' }));
    } catch (submissionError) {
      setError(submissionError.message || 'Failed to create card.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = Boolean(disabled || isSubmitting || loading);

  const handleManualRefresh = () => {
    if (!onRefresh) return;
    Promise.resolve(onRefresh()).catch(() => {});
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Digital business cards</h2>
          <p className="text-sm text-slate-600">
            Create rich digital cards so attendees can exchange context instantly — contact details, key links, and follow-up CTAs.
          </p>
        </div>
        <button
          type="button"
          onClick={handleManualRefresh}
          className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Create a card template</p>
          <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
            <label className="flex flex-col gap-1">
              <span className="text-slate-600">Card title</span>
              <input
                type="text"
                value={form.title}
                onChange={(event) => handleChange('title', event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-slate-600">Headline</span>
              <input
                type="text"
                value={form.headline}
                onChange={(event) => handleChange('headline', event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-slate-600">Contact email</span>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(event) => handleChange('contactEmail', event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="you@gigvora.com"
                required
              />
            </label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-slate-600">Phone</span>
                <input
                  type="tel"
                  value={form.contactPhone}
                  onChange={(event) => handleChange('contactPhone', event.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-slate-600">LinkedIn</span>
                <input
                  type="url"
                  value={form.linkedinUrl}
                  onChange={(event) => handleChange('linkedinUrl', event.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="https://www.linkedin.com/in/you"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-slate-600">Website</span>
              <input
                type="url"
                value={form.websiteUrl}
                onChange={(event) => handleChange('websiteUrl', event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="https://yourcompany.com"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-slate-600">Status</span>
              <select
                value={form.status}
                onChange={(event) => handleChange('status', event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>
          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
          <button
            type="submit"
            className="mt-4 inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={isBusy}
          >
            {isSubmitting ? 'Saving…' : 'Save card'}
          </button>
        </form>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-900">Library</p>
          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
                <p>Loading cards…</p>
              </div>
            ) : cards.length ? (
              cards.map((card) => (
                <div key={card.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                      <p className="text-xs text-slate-500">{card.headline}</p>
                    </div>
                    <span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600">{card.status}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-500 md:grid-cols-2">
                    <p>
                      <span className="font-semibold text-slate-700">Email:</span> {card.contactEmail}
                    </p>
                    {card.websiteUrl ? (
                      <p>
                        <span className="font-semibold text-slate-700">Website:</span> {card.websiteUrl}
                      </p>
                    ) : null}
                    {card.linkedinUrl ? (
                      <p>
                        <span className="font-semibold text-slate-700">LinkedIn:</span> {card.linkedinUrl}
                      </p>
                    ) : null}
                    <p>
                      <span className="font-semibold text-slate-700">Shares:</span> {card.shareCount ?? 0}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
                <p>No cards yet. Start with the template to the left.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
