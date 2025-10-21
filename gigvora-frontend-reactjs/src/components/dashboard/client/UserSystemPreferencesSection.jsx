import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { saveWebsitePreferences } from '../../../services/websitePreferences.js';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'it', label: 'Italian' },
  { value: 'nl', label: 'Dutch' },
];

const BACKGROUND_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'gradient', label: 'Gradient' },
];

const BUTTON_SHAPES = [
  { value: 'rounded', label: 'Rounded' },
  { value: 'pill', label: 'Pill' },
  { value: 'square', label: 'Square' },
];

const MEDIA_TYPES = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'none', label: 'None' },
];

const DEFAULT_PREFERENCES = {
  settings: {
    siteTitle: 'My site',
    tagline: '',
    siteSlug: 'my-site',
    published: false,
    language: 'en',
    customDomain: '',
  },
  theme: {
    primaryColor: '#2563EB',
    accentColor: '#0EA5E9',
    backgroundStyle: 'light',
    buttonShape: 'rounded',
    fontFamily: 'Inter',
    logoUrl: '',
    faviconUrl: '',
  },
  hero: {
    kicker: '',
    headline: 'Let’s work together.',
    subheadline: '',
    primaryCtaLabel: 'Book call',
    primaryCtaLink: '#contact',
    secondaryCtaLabel: '',
    secondaryCtaLink: '',
    backgroundImageUrl: '',
    media: { type: 'image', url: '', alt: '' },
  },
  about: { title: 'About', body: '', highlights: [] },
  navigation: { links: [] },
  services: { items: [] },
  testimonials: { items: [] },
  gallery: { items: [] },
  contact: {
    email: '',
    phone: '',
    location: '',
    formRecipient: '',
    showForm: true,
    availabilityNote: '',
    bookingLink: '',
  },
  seo: { metaTitle: '', metaDescription: '', keywordsInput: '', ogImageUrl: '', twitterHandle: '' },
  social: { links: [] },
};

function mergePreferences(preferences) {
  if (!preferences) {
    return JSON.parse(JSON.stringify(DEFAULT_PREFERENCES));
  }
  const clone = JSON.parse(JSON.stringify(DEFAULT_PREFERENCES));
  return {
    ...clone,
    ...preferences,
    settings: { ...clone.settings, ...(preferences.settings ?? {}) },
    theme: { ...clone.theme, ...(preferences.theme ?? {}) },
    hero: {
      ...clone.hero,
      ...(preferences.hero ?? {}),
      media: { ...clone.hero.media, ...(preferences.hero?.media ?? {}) },
    },
    contact: { ...clone.contact, ...(preferences.contact ?? {}) },
    social: {
      links: Array.isArray(preferences.social?.links) ? preferences.social.links.map((link, index) => ({
        id: link.id ?? `link_${index}`,
        label: link.label ?? '',
        url: link.url ?? '',
      })) : [],
    },
  };
}

function SocialLinksEditor({ links, onChange, disabled }) {
  const handleLinkChange = (index, field, value) => {
    onChange((previous) => {
      const next = previous.slice();
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemove = (index) => {
    onChange((previous) => previous.filter((_, idx) => idx !== index));
  };

  const handleAdd = () => {
    onChange((previous) => [...previous, { id: `link_${Date.now()}`, label: '', url: '' }]);
  };

  return (
    <div className="space-y-4">
      {links.length ? (
        links.map((link, index) => (
          <div key={link.id || index} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-[1fr_1fr_auto]">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Label</span>
              <input
                type="text"
                value={link.label}
                onChange={(event) => handleLinkChange(index, 'label', event.target.value)}
                placeholder="LinkedIn"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                disabled={disabled}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">URL</span>
              <input
                type="url"
                value={link.url}
                onChange={(event) => handleLinkChange(index, 'url', event.target.value)}
                placeholder="https://linkedin.com/in/you"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                disabled={disabled}
              />
            </label>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="self-end rounded-2xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disabled}
            >
              Remove
            </button>
          </div>
        ))
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
          Add links to surface your external profiles.
        </p>
      )}
      <button
        type="button"
        onClick={handleAdd}
        className="rounded-2xl border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-600 transition hover:border-purple-300 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
      >
        Add link
      </button>
    </div>
  );
}

SocialLinksEditor.propTypes = {
  links: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

SocialLinksEditor.defaultProps = {
  disabled: false,
};

export default function UserSystemPreferencesSection({ userId, preferences, onUpdated }) {
  const [form, setForm] = useState(() => mergePreferences(preferences));
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const heroMediaType = form.hero.media?.type ?? 'image';

  const handleSettingsChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({
      ...previous,
      settings: {
        ...previous.settings,
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  }, []);

  const handleThemeChange = useCallback((event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      theme: { ...previous.theme, [name]: value },
    }));
  }, []);

  const handleHeroChange = useCallback((event) => {
    const { name, value } = event.target;
    if (name.startsWith('media.')) {
      const key = name.split('.')[1];
      setForm((previous) => ({
        ...previous,
        hero: {
          ...previous.hero,
          media: { ...previous.hero.media, [key]: value },
        },
      }));
      return;
    }
    setForm((previous) => ({
      ...previous,
      hero: { ...previous.hero, [name]: value },
    }));
  }, []);

  const handleContactChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({
      ...previous,
      contact: {
        ...previous.contact,
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  }, []);

  const handleSocialChange = useCallback((updater) => {
    setForm((previous) => ({
      ...previous,
      social: { ...previous.social, links: updater(previous.social?.links ?? []) },
    }));
  }, []);

  const heroDescription = useMemo(() => {
    if (heroMediaType === 'video') {
      return 'Paste an embeddable video URL. Sizzle reels perform well for cohort launches and product walkthroughs.';
    }
    if (heroMediaType === 'none') {
      return 'Keep the hero minimal if you prefer typography-led designs or plan to embed interactive widgets later.';
    }
    return 'High-resolution imagery keeps your story vivid across the Explorer, Launchpad, and client portals.';
  }, [heroMediaType]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!userId) return;
    setBusy(true);
    setFeedback('');
    setError('');
    try {
      const payload = {
        ...form,
        social: { links: form.social.links.map((link) => ({ label: link.label ?? '', url: link.url ?? '' })) },
      };
      const response = await saveWebsitePreferences(userId, payload);
      setForm(mergePreferences(response));
      setFeedback('System preferences updated. Preview refreshed across your public surfaces.');
      onUpdated?.(response);
    } catch (err) {
      setError(err?.message ?? 'Unable to update preferences.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      id="user-system-preferences"
      className="space-y-8 rounded-3xl border border-slate-200 bg-gradient-to-br from-purple-50 via-white to-white p-6 shadow-sm"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-purple-500">System preferences</p>
          <h2 className="text-3xl font-semibold text-slate-900">Website, branding, and conversion surfaces</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Tune the hosted profile experience that powers Explorer cards, Launchpad briefings, and client-ready landing pages.
            Changes ship instantly with CDN-level caching.
          </p>
        </div>
        <div className="rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3 text-xs font-semibold text-purple-600 shadow-sm">
          Production ready
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Site identity</h3>
            <p className="text-sm text-slate-500">Update the metadata and domains mirrored across marketing and partner portals.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Site title</span>
              <input
                type="text"
                name="siteTitle"
                value={form.settings.siteTitle}
                onChange={handleSettingsChange}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Tagline</span>
              <input
                type="text"
                name="tagline"
                value={form.settings.tagline}
                onChange={handleSettingsChange}
                placeholder="Designing high-impact community launches."
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Slug</span>
              <input
                type="text"
                name="siteSlug"
                value={form.settings.siteSlug}
                onChange={handleSettingsChange}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Custom domain</span>
              <input
                type="text"
                name="customDomain"
                value={form.settings.customDomain}
                onChange={handleSettingsChange}
                placeholder="studio.yourdomain.com"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Language</span>
              <select
                name="language"
                value={form.settings.language}
                onChange={handleSettingsChange}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              name="published"
              checked={Boolean(form.settings.published)}
              onChange={handleSettingsChange}
              className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            Publish site immediately
          </label>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Visual system</h3>
            <p className="text-sm text-slate-500">Brand controls cascade to Explorer cards, Launchpad recruitment decks, and live previews.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Primary colour</span>
              <input
                type="color"
                name="primaryColor"
                value={form.theme.primaryColor}
                onChange={handleThemeChange}
                className="h-12 w-full rounded-2xl border border-slate-200"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Accent colour</span>
              <input
                type="color"
                name="accentColor"
                value={form.theme.accentColor}
                onChange={handleThemeChange}
                className="h-12 w-full rounded-2xl border border-slate-200"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Background style</span>
              <div className="grid gap-3 sm:grid-cols-3">
                {BACKGROUND_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                      form.theme.backgroundStyle === option.value
                        ? 'border-purple-400 bg-purple-50 text-purple-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-purple-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="backgroundStyle"
                      value={option.value}
                      checked={form.theme.backgroundStyle === option.value}
                      onChange={handleThemeChange}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Button shape</span>
              <select
                name="buttonShape"
                value={form.theme.buttonShape}
                onChange={handleThemeChange}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                {BUTTON_SHAPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Logo URL</span>
              <input
                type="url"
                name="logoUrl"
                value={form.theme.logoUrl}
                onChange={handleThemeChange}
                placeholder="https://cdn.gigvora.com/logo.png"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Favicon URL</span>
              <input
                type="url"
                name="faviconUrl"
                value={form.theme.faviconUrl}
                onChange={handleThemeChange}
                placeholder="https://cdn.gigvora.com/favicon.ico"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </label>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Hero narrative</h3>
            <p className="text-sm text-slate-500">Craft the opening moment that appears across your Gigvora microsite and rich cards.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Kicker</span>
              <input
                type="text"
                name="kicker"
                value={form.hero.kicker}
                onChange={handleHeroChange}
                placeholder="Launchpad alumni"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Headline</span>
              <input
                type="text"
                name="headline"
                value={form.hero.headline}
                onChange={handleHeroChange}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Subheadline</span>
            <textarea
              name="subheadline"
              value={form.hero.subheadline}
              onChange={handleHeroChange}
              rows={3}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Primary CTA label</span>
              <input
                type="text"
                name="primaryCtaLabel"
                value={form.hero.primaryCtaLabel}
                onChange={handleHeroChange}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Primary CTA link</span>
              <input
                type="text"
                name="primaryCtaLink"
                value={form.hero.primaryCtaLink}
                onChange={handleHeroChange}
                placeholder="https://cal.com/you"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Hero media type</span>
              <select
                name="media.type"
                value={heroMediaType}
                onChange={handleHeroChange}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {MEDIA_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Media URL</span>
              <input
                type="text"
                name="media.url"
                value={form.hero.media?.url ?? ''}
                onChange={handleHeroChange}
                placeholder="https://cdn.gigvora.com/hero.jpg"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
          </div>
          <p className="text-xs text-slate-500">{heroDescription}</p>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Contact and social</h3>
            <p className="text-sm text-slate-500">Keep prospective collaborators and Launchpad scouts in the loop with live contact routes.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Contact email</span>
              <input
                type="email"
                name="email"
                value={form.contact.email}
                onChange={handleContactChange}
                placeholder="hello@gigvora.com"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Phone</span>
              <input
                type="text"
                name="phone"
                value={form.contact.phone}
                onChange={handleContactChange}
                placeholder="+44 20 7946 0958"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Location</span>
              <input
                type="text"
                name="location"
                value={form.contact.location}
                onChange={handleContactChange}
                placeholder="London · Remote"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Booking link</span>
              <input
                type="text"
                name="bookingLink"
                value={form.contact.bookingLink}
                onChange={handleContactChange}
                placeholder="https://cal.com/you"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Availability note</span>
            <textarea
              name="availabilityNote"
              value={form.contact.availabilityNote}
              onChange={handleContactChange}
              rows={2}
              placeholder="Accepting product transformation engagements from June."
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
          </label>
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              name="showForm"
              checked={Boolean(form.contact.showForm)}
              onChange={handleContactChange}
              className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
            />
            Enable lead capture form
          </label>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">Social links</p>
            <SocialLinksEditor links={form.social.links} onChange={handleSocialChange} disabled={busy} />
          </div>
        </section>

        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        ) : null}
        {feedback ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-2xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={busy}
          >
            {busy ? 'Saving…' : 'Save system preferences'}
          </button>
        </div>
      </form>
    </section>
  );
}

UserSystemPreferencesSection.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  preferences: PropTypes.object,
  onUpdated: PropTypes.func,
};

UserSystemPreferencesSection.defaultProps = {
  preferences: null,
  onUpdated: null,
};
