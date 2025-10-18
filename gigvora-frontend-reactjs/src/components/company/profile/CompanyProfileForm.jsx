import { useEffect, useMemo, useState } from 'react';

const EMPTY_LINK = { label: '', url: '' };

function normalizeLinks(links) {
  if (!Array.isArray(links)) {
    return [];
  }
  return links
    .map((entry) => ({
      label: entry?.label ?? '',
      url: entry?.url ?? '',
    }))
    .filter((entry) => entry.label || entry.url);
}

export default function CompanyProfileForm({ profile, saving = false, onSubmit, onCancel }) {
  const initialState = useMemo(
    () => ({
      companyName: profile?.companyName ?? '',
      tagline: profile?.tagline ?? '',
      description: profile?.description ?? '',
      website: profile?.website ?? '',
      contactEmail: profile?.contactEmail ?? '',
      contactPhone: profile?.contactPhone ?? '',
      location: profile?.location ?? '',
      socialLinks: normalizeLinks(profile?.socialLinks ?? []),
    }),
    [profile],
  );

  const [formState, setFormState] = useState(initialState);

  useEffect(() => {
    setFormState(initialState);
  }, [initialState]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const handleSocialLinkChange = (index, field, value) => {
    setFormState((current) => {
      const links = [...(current.socialLinks ?? [])];
      links[index] = { ...links[index], [field]: value };
      return { ...current, socialLinks: links };
    });
  };

  const handleAddSocialLink = () => {
    setFormState((current) => ({
      ...current,
      socialLinks: [...(current.socialLinks ?? []), { ...EMPTY_LINK }],
    }));
  };

  const handleRemoveSocialLink = (index) => {
    setFormState((current) => {
      const links = [...(current.socialLinks ?? [])];
      links.splice(index, 1);
      return { ...current, socialLinks: links };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      ...formState,
      socialLinks: (formState.socialLinks ?? [])
        .map((entry) => ({ label: entry.label.trim(), url: entry.url.trim() }))
        .filter((entry) => entry.url.length > 0 || entry.label.length > 0),
    };
    onSubmit?.(payload);
  };

  const handleCancel = () => {
    setFormState(initialState);
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="companyName" className="text-sm font-semibold text-slate-700">
            Company name
          </label>
          <input
            id="companyName"
            name="companyName"
            required
            value={formState.companyName}
            onChange={handleChange}
            placeholder="Acme Labs"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="tagline" className="text-sm font-semibold text-slate-700">
            Tagline
          </label>
          <input
            id="tagline"
            name="tagline"
            value={formState.tagline}
            onChange={handleChange}
            placeholder="Build the future of hiring"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-semibold text-slate-700">
          Company overview
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={formState.description}
          onChange={handleChange}
          placeholder="Describe your mission and hiring focus."
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="website" className="text-sm font-semibold text-slate-700">
            Website
          </label>
          <input
            id="website"
            name="website"
            value={formState.website}
            onChange={handleChange}
            placeholder="https://example.com"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="location" className="text-sm font-semibold text-slate-700">
            Primary location
          </label>
          <input
            id="location"
            name="location"
            value={formState.location}
            onChange={handleChange}
            placeholder="San Francisco, CA"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="contactEmail" className="text-sm font-semibold text-slate-700">
            Contact email
          </label>
          <input
            id="contactEmail"
            name="contactEmail"
            value={formState.contactEmail}
            onChange={handleChange}
            placeholder="talent@example.com"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="contactPhone" className="text-sm font-semibold text-slate-700">
            Contact phone
          </label>
          <input
            id="contactPhone"
            name="contactPhone"
            value={formState.contactPhone}
            onChange={handleChange}
            placeholder="+1 555-123-4567"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Social links</p>
          <button
            type="button"
            onClick={handleAddSocialLink}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
          >
            Add link
          </button>
        </div>
        {(formState.socialLinks ?? []).length ? (
          <div className="space-y-3">
            {formState.socialLinks.map((link, index) => (
              <div key={`social-link-${index}`} className="grid gap-3 sm:grid-cols-[1fr_minmax(0,1fr)_auto]">
                <input
                  type="text"
                  value={link.label}
                  onChange={(event) => handleSocialLinkChange(index, 'label', event.target.value)}
                  placeholder="Label (optional)"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <input
                  type="url"
                  value={link.url}
                  onChange={(event) => handleSocialLinkChange(index, 'url', event.target.value)}
                  placeholder="https://..."
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSocialLink(index)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:border-rose-300 hover:text-rose-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
          disabled={saving}
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
