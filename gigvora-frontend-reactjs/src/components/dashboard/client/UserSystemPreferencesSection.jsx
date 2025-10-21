import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import DataStatus from '../../DataStatus.jsx';
import { fetchWebsitePreferences, saveWebsitePreferences } from '../../../services/websitePreferences.js';

function clone(value) {
  try {
    return structuredClone(value);
  } catch (error) {
    return JSON.parse(JSON.stringify(value));
  }
}

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
    fontFamily: 'Inter',
    buttonShape: 'rounded',
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
  navigation: { links: [] },
  social: { links: [] },
  contact: {
    email: '',
    phone: '',
    location: '',
    formRecipient: '',
    showForm: true,
    availabilityNote: '',
    bookingLink: '',
  },
};

const SUPPORTED_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'it', label: 'Italian' },
  { value: 'nl', label: 'Dutch' },
];

const BACKGROUND_STYLES = [
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

function mergePreferences(preferences) {
  if (!preferences) return clone(DEFAULT_PREFERENCES);
  const merged = clone(DEFAULT_PREFERENCES);
  const assign = (target, source) => {
    Object.entries(source || {}).forEach(([key, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (!target[key]) target[key] = {};
        assign(target[key], value);
      } else {
        target[key] = value;
      }
    });
  };
  assign(merged, preferences);
  if (!Array.isArray(merged.navigation.links)) {
    merged.navigation.links = [];
  }
  if (!Array.isArray(merged.social.links)) {
    merged.social.links = [];
  }
  if (!merged.hero.media) {
    merged.hero.media = { ...DEFAULT_PREFERENCES.hero.media };
  }
  return merged;
}

function SectionHeader({ title, description }) {
  return (
    <header className="space-y-2">
      <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      {description ? <p className="text-sm text-slate-500">{description}</p> : null}
    </header>
  );
}

SectionHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.node,
};

SectionHeader.defaultProps = {
  description: null,
};

function NavigationList({ links, onEdit, onRemove }) {
  if (!links.length) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
        No navigation items yet. Add your first link to guide visitors.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {links.map((link, index) => (
        <li key={link.id ?? index} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm">
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900">{link.label}</span>
            <span className="text-xs text-slate-500">{link.url}</span>
          </div>
          <span className="ml-auto text-xs text-slate-400">{link.openInNewTab ? 'Opens in new tab' : 'Same tab'}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onEdit?.(index)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onRemove?.(index)}
              className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-600 transition hover:border-red-300 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

NavigationList.propTypes = {
  links: PropTypes.arrayOf(PropTypes.object).isRequired,
  onEdit: PropTypes.func,
  onRemove: PropTypes.func,
};

NavigationList.defaultProps = {
  onEdit: null,
  onRemove: null,
};

function SocialList({ links, onEdit, onRemove }) {
  if (!links.length) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
        No social profiles added. Add LinkedIn, Twitter, or community links.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {links.map((link, index) => (
        <li key={link.id ?? index} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm">
          <span className="font-semibold text-slate-900">{link.platform ?? link.label ?? 'Social'}</span>
          <span className="text-xs text-slate-500">{link.url}</span>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => onEdit?.(index)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onRemove?.(index)}
              className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-600 transition hover:border-red-300 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

SocialList.propTypes = {
  links: PropTypes.arrayOf(PropTypes.object).isRequired,
  onEdit: PropTypes.func,
  onRemove: PropTypes.func,
};

SocialList.defaultProps = {
  onEdit: null,
  onRemove: null,
};

function MicrositePreview({ form }) {
  const theme = form?.theme ?? {};
  const hero = form?.hero ?? {};
  const contact = form?.contact ?? {};
  const navLinks = Array.isArray(form?.navigation?.links) ? form.navigation.links : [];
  const socialLinks = Array.isArray(form?.social?.links) ? form.social.links : [];
  const isDark = theme.backgroundStyle === 'dark';
  const isGradient = theme.backgroundStyle === 'gradient';
  const heroOnDark = isDark || isGradient;
  const baseTone = heroOnDark
    ? isDark
      ? 'bg-slate-950 text-slate-100'
      : 'bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white'
    : 'bg-white text-slate-900';
  const buttonShape =
    theme.buttonShape === 'pill' ? 'rounded-full' : theme.buttonShape === 'square' ? 'rounded-lg' : 'rounded-2xl';
  const heroStyle = (() => {
    const style = {};
    if (hero.media?.type === 'image' && hero.media?.url) {
      const overlay = isDark
        ? 'linear-gradient(140deg, rgba(15,23,42,0.92), rgba(15,23,42,0.6))'
        : isGradient
        ? 'linear-gradient(140deg, rgba(15,23,42,0.75), rgba(37,99,235,0.45))'
        : 'linear-gradient(140deg, rgba(15,23,42,0.55), rgba(30,64,175,0.25))';
      style.backgroundImage = `${overlay}, url(${hero.media.url})`;
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
    } else if (isDark) {
      style.backgroundImage = 'radial-gradient(circle at top left, rgba(148,163,184,0.25), transparent 55%)';
    } else if (isGradient) {
      style.backgroundImage = 'radial-gradient(circle at top left, rgba(148,163,184,0.18), transparent 55%)';
    }
    if (isDark) {
      style.backgroundColor = '#0f172a';
    }
    return style;
  })();
  const navChipClasses = heroOnDark
    ? 'rounded-full bg-white/10 px-3 py-1 text-white/90'
    : 'rounded-full bg-slate-900/5 px-3 py-1 text-slate-600';
  const navEmptyClasses = heroOnDark
    ? 'rounded-full border border-white/15 px-3 py-1 text-white/80'
    : 'rounded-full border border-dashed border-slate-200 px-3 py-1 text-slate-500';
  const detailWrapperTone = isDark
    ? 'border-t border-slate-800 bg-slate-950/95 text-slate-300'
    : 'border-t border-slate-200 bg-white/90 text-slate-600';
  const detailEyebrowTone = isDark ? 'text-slate-400' : 'text-slate-500';
  const detailChipTone = isDark
    ? 'rounded-full border border-slate-700 px-3 py-1 text-slate-300'
    : 'rounded-full border border-slate-200 px-3 py-1 text-slate-500';
  const detailEmptyChipTone = isDark
    ? 'rounded-full border border-dashed border-slate-700 px-3 py-1 text-slate-500'
    : 'rounded-full border border-dashed border-slate-200 px-3 py-1 text-slate-400';
  const kickerTone = heroOnDark ? 'text-white/70' : 'text-slate-500';
  const bodyTone = heroOnDark ? 'text-white/85' : 'text-slate-600';
  const secondaryCtaTone = heroOnDark ? 'border-white/40 text-white' : 'border-slate-900/10 text-slate-900';

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-inner">
      <div className={`relative space-y-6 p-6 ${baseTone}`} style={heroStyle}>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.3em]">
          <span>{form?.settings?.siteTitle || 'Your microsite'}</span>
          <nav className="flex flex-wrap items-center gap-3 text-[10px]">
            {navLinks.length ? (
              navLinks.slice(0, 5).map((link) => (
                <span key={link.id ?? link.label} className={navChipClasses}>
                  {link.label}
                </span>
              ))
            ) : (
              <span className={navEmptyClasses}>Add navigation</span>
            )}
          </nav>
        </div>
        <div className="max-w-xl space-y-4">
          {hero.kicker ? (
            <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${kickerTone}`}>{hero.kicker}</p>
          ) : null}
          <h3 className="text-3xl font-semibold leading-tight">{hero.headline || 'Let’s launch your next project.'}</h3>
          <p className={`text-sm ${bodyTone}`}>
            {hero.subheadline || 'Preview how your hero section will appear to clients.'}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={hero.primaryCtaLink || '#contact'}
              className={`${buttonShape} border border-transparent px-4 py-2 text-sm font-semibold`}
              style={{ backgroundColor: theme.primaryColor || '#2563EB', color: '#fff' }}
            >
              {hero.primaryCtaLabel || 'Book intro call'}
            </a>
            {hero.secondaryCtaLabel ? (
              <a
                href={hero.secondaryCtaLink || '#work'}
                className={`${buttonShape} border px-4 py-2 text-sm font-semibold ${secondaryCtaTone}`}
              >
                {hero.secondaryCtaLabel}
              </a>
            ) : null}
          </div>
        </div>
        {hero.media?.type === 'video' && hero.media?.url ? (
          <div className="rounded-2xl border border-white/20 bg-black/30 p-3">
            <video controls className="h-40 w-full rounded-xl border border-white/10 bg-black/60">
              <source src={hero.media.url} />
              Your browser does not support video playback.
            </video>
          </div>
        ) : null}
      </div>
      <div className={`grid gap-4 p-6 text-sm md:grid-cols-2 ${detailWrapperTone}`}>
        <div className="space-y-2">
          <p className={`text-xs font-semibold uppercase tracking-wide ${detailEyebrowTone}`}>Contact</p>
          <p>{contact.email || 'team@gigvora.com'}</p>
          <p>{contact.phone || '+44 20 0000 0000'}</p>
          <p>{contact.location || 'Global remote team'}</p>
        </div>
        <div className="space-y-2">
          <p className={`text-xs font-semibold uppercase tracking-wide ${detailEyebrowTone}`}>Socials</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {socialLinks.length ? (
              socialLinks.slice(0, 5).map((link) => (
                <span key={link.id ?? link.label} className={detailChipTone}>
                  {link.label}
                </span>
              ))
            ) : (
              <span className={detailEmptyChipTone}>Add profiles</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

MicrositePreview.propTypes = {
  form: PropTypes.object.isRequired,
};

export default function UserSystemPreferencesSection({ userId, preferences, onUpdated }) {
  const [loading, setLoading] = useState(!preferences);
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [form, setForm] = useState(() => mergePreferences(preferences));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [saveError, setSaveError] = useState('');

  const [navDraft, setNavDraft] = useState({ label: '', url: '', openInNewTab: false });
  const [editingNavIndex, setEditingNavIndex] = useState(null);

  const [socialDraft, setSocialDraft] = useState({ platform: '', url: '' });
  const [editingSocialIndex, setEditingSocialIndex] = useState(null);

  const refresh = useCallback(() => {
    if (!userId) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchWebsitePreferences(userId, { signal: controller.signal })
      .then((payload) => {
        if (!controller.signal.aborted) {
          setForm(mergePreferences(payload));
          setLastSynced(new Date());
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [userId]);

  useEffect(() => {
    if (!preferences) {
      const abort = refresh();
      return () => abort?.();
    }
    setForm(mergePreferences(preferences));
  }, [preferences, refresh]);

  const heroPreview = useMemo(() => {
    const { hero, theme } = form;
    const bg = theme.backgroundStyle === 'dark'
      ? 'from-slate-900 via-slate-800 to-slate-900 text-white'
      : theme.backgroundStyle === 'gradient'
        ? 'from-indigo-500 via-purple-500 to-pink-500 text-white'
        : 'from-white via-slate-50 to-white text-slate-900';
    return {
      headline: hero.headline,
      kicker: hero.kicker,
      subheadline: hero.subheadline,
      primaryCtaLabel: hero.primaryCtaLabel,
      primaryCtaLink: hero.primaryCtaLink,
      secondaryCtaLabel: hero.secondaryCtaLabel,
      secondaryCtaLink: hero.secondaryCtaLink,
      backgroundClass: bg,
      backgroundImageUrl: hero.backgroundImageUrl,
    };
  }, [form]);

  const updateField = useCallback((path, value) => {
    setForm((previous) => {
      const clone = structuredClone(previous);
      const segments = path.split('.');
      let cursor = clone;
      for (let i = 0; i < segments.length - 1; i += 1) {
        const segment = segments[i];
        if (!cursor[segment] || typeof cursor[segment] !== 'object') {
          cursor[segment] = {};
        }
        cursor = cursor[segment];
      }
      cursor[segments[segments.length - 1]] = value;
      return clone;
    });
  }, []);

  const handleNavSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (!navDraft.label || !navDraft.url) {
        return;
      }
      setForm((previous) => {
        const links = [...previous.navigation.links];
        const entry = {
          id: links[editingNavIndex]?.id ?? `nav_${Date.now()}`,
          label: navDraft.label,
          url: navDraft.url,
          openInNewTab: Boolean(navDraft.openInNewTab),
        };
        if (editingNavIndex != null) {
          links.splice(editingNavIndex, 1, entry);
        } else {
          links.push(entry);
        }
        return {
          ...previous,
          navigation: { ...previous.navigation, links },
        };
      });
      setNavDraft({ label: '', url: '', openInNewTab: false });
      setEditingNavIndex(null);
    },
    [editingNavIndex, navDraft],
  );

  const handleNavEdit = useCallback((index) => {
    setEditingNavIndex(index);
    const entry = form.navigation.links[index];
    setNavDraft({ label: entry.label, url: entry.url, openInNewTab: Boolean(entry.openInNewTab) });
  }, [form.navigation.links]);

  const handleNavRemove = useCallback((index) => {
    setForm((previous) => {
      const links = previous.navigation.links.filter((_, idx) => idx !== index);
      return { ...previous, navigation: { ...previous.navigation, links } };
    });
    setEditingNavIndex(null);
    setNavDraft({ label: '', url: '', openInNewTab: false });
  }, []);

  const handleSocialSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (!socialDraft.platform || !socialDraft.url) {
        return;
      }
      setForm((previous) => {
        const links = [...previous.social.links];
        const entry = {
          id: links[editingSocialIndex]?.id ?? `social_${Date.now()}`,
          platform: socialDraft.platform,
          url: socialDraft.url,
        };
        if (editingSocialIndex != null) {
          links.splice(editingSocialIndex, 1, entry);
        } else {
          links.push(entry);
        }
        return {
          ...previous,
          social: { ...previous.social, links },
        };
      });
      setSocialDraft({ platform: '', url: '' });
      setEditingSocialIndex(null);
    },
    [editingSocialIndex, socialDraft],
  );

  const handleSocialEdit = useCallback((index) => {
    setEditingSocialIndex(index);
    const entry = form.social.links[index];
    setSocialDraft({ platform: entry.platform ?? entry.label ?? '', url: entry.url });
  }, [form.social.links]);

  const handleSocialRemove = useCallback((index) => {
    setForm((previous) => {
      const links = previous.social.links.filter((_, idx) => idx !== index);
      return { ...previous, social: { ...previous.social, links } };
    });
    setEditingSocialIndex(null);
    setSocialDraft({ platform: '', url: '' });
  }, []);

  const handleSave = useCallback(
    async (event) => {
      event.preventDefault();
      if (!userId) return;
      setSaving(true);
      setFeedback('');
      setSaveError('');
      try {
        const payload = clone(form);
        payload.navigation.links = payload.navigation.links.map((link) => ({
          id: link.id,
          label: link.label,
          url: link.url,
          openInNewTab: Boolean(link.openInNewTab),
        }));
        payload.social.links = payload.social.links.map((link) => ({
          id: link.id,
          platform: link.platform ?? link.label ?? '',
          url: link.url,
        }));
        const response = await saveWebsitePreferences(userId, payload);
        setForm(mergePreferences(response));
        setFeedback('Website preferences published.');
        setLastSynced(new Date());
        onUpdated?.();
      } catch (err) {
        setSaveError(err?.message ?? 'Unable to save website preferences.');
      } finally {
        setSaving(false);
      }
    },
    [form, onUpdated, userId],
  );

  return (
    <section id="user-system-preferences" className="space-y-8 rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-500">System preferences</p>
          <h2 className="text-3xl font-semibold text-slate-900">Digital presence & brand controls</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Launch an investor-ready microsite without leaving the dashboard. Configure hero storytelling, brand palettes, navigation, and contact funnels.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refresh()}
          className="rounded-full border border-indigo-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-indigo-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700"
        >
          Refresh preferences
        </button>
      </div>

      <DataStatus loading={loading} error={error} lastUpdated={lastSynced} statusLabel="Website preferences" />

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Published</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{form.settings.published ? 'Live' : 'Staging'}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Language</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{form.settings.language.toUpperCase()}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Domain</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{form.settings.customDomain || 'studio.gigvora.com'}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Navigation items</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{form.navigation.links.length}</p>
        </div>
      </div>

      <MicrositePreview form={form} />

      <form onSubmit={handleSave} className="space-y-8">
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-inner">
          <SectionHeader
            title="Site settings"
            description="Control the basics: naming, slug, language, and publish status."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Site title</span>
              <input
                type="text"
                value={form.settings.siteTitle}
                onChange={(event) => updateField('settings.siteTitle', event.target.value)}
                required
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Tagline</span>
              <input
                type="text"
                value={form.settings.tagline}
                onChange={(event) => updateField('settings.tagline', event.target.value)}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Site slug</span>
              <input
                type="text"
                value={form.settings.siteSlug}
                onChange={(event) => updateField('settings.siteSlug', event.target.value)}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Language</span>
              <select
                value={form.settings.language}
                onChange={(event) => updateField('settings.language', event.target.value)}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {SUPPORTED_LANGUAGES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Custom domain</span>
              <input
                type="text"
                value={form.settings.customDomain}
                onChange={(event) => updateField('settings.customDomain', event.target.value)}
                placeholder="launchpad.yourbrand.com"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
          </div>
          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.settings.published}
              onChange={(event) => updateField('settings.published', event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Publish microsite and enable public access
          </label>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-inner">
          <SectionHeader
            title="Theme and branding"
            description="Align colours, typography, and logos with your brand system."
          />
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Primary colour</span>
              <input
                type="text"
                value={form.theme.primaryColor}
                onChange={(event) => updateField('theme.primaryColor', event.target.value)}
                placeholder="#2563EB"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Accent colour</span>
              <input
                type="text"
                value={form.theme.accentColor}
                onChange={(event) => updateField('theme.accentColor', event.target.value)}
                placeholder="#0EA5E9"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Background style</span>
              <select
                value={form.theme.backgroundStyle}
                onChange={(event) => updateField('theme.backgroundStyle', event.target.value)}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {BACKGROUND_STYLES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Font family</span>
              <input
                type="text"
                value={form.theme.fontFamily}
                onChange={(event) => updateField('theme.fontFamily', event.target.value)}
                placeholder="Inter"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Button shape</span>
              <select
                value={form.theme.buttonShape}
                onChange={(event) => updateField('theme.buttonShape', event.target.value)}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {BUTTON_SHAPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Logo URL</span>
              <input
                type="url"
                value={form.theme.logoUrl}
                onChange={(event) => updateField('theme.logoUrl', event.target.value)}
                placeholder="https://cdn.brand.com/logo.svg"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Favicon URL</span>
            <input
              type="url"
              value={form.theme.faviconUrl}
              onChange={(event) => updateField('theme.faviconUrl', event.target.value)}
              placeholder="https://cdn.brand.com/favicon.png"
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </label>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-inner">
          <SectionHeader
            title="Hero layout"
            description="Craft the story above the fold and wire up CTAs."
          />
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Hero kicker</span>
              <input
                type="text"
                value={form.hero.kicker}
                onChange={(event) => updateField('hero.kicker', event.target.value)}
                placeholder="Experience Launchpad"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Headline</span>
              <input
                type="text"
                value={form.hero.headline}
                onChange={(event) => updateField('hero.headline', event.target.value)}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Subheadline</span>
            <textarea
              value={form.hero.subheadline}
              onChange={(event) => updateField('hero.subheadline', event.target.value)}
              rows={3}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Primary CTA label</span>
              <input
                type="text"
                value={form.hero.primaryCtaLabel}
                onChange={(event) => updateField('hero.primaryCtaLabel', event.target.value)}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Primary CTA link</span>
              <input
                type="text"
                value={form.hero.primaryCtaLink}
                onChange={(event) => updateField('hero.primaryCtaLink', event.target.value)}
                placeholder="#contact"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Secondary CTA label</span>
              <input
                type="text"
                value={form.hero.secondaryCtaLabel}
                onChange={(event) => updateField('hero.secondaryCtaLabel', event.target.value)}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Secondary CTA link</span>
              <input
                type="text"
                value={form.hero.secondaryCtaLink}
                onChange={(event) => updateField('hero.secondaryCtaLink', event.target.value)}
                placeholder="#services"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Background image URL</span>
            <input
              type="url"
              value={form.hero.backgroundImageUrl}
              onChange={(event) => updateField('hero.backgroundImageUrl', event.target.value)}
              placeholder="https://cdn.brand.com/hero.jpg"
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Hero media type</span>
              <select
                value={form.hero.media.type}
                onChange={(event) => updateField('hero.media.type', event.target.value)}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
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
                type="url"
                value={form.hero.media.url}
                onChange={(event) => updateField('hero.media.url', event.target.value)}
                placeholder="https://cdn.brand.com/demo.mp4"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Media alt text</span>
              <input
                type="text"
                value={form.hero.media.alt}
                onChange={(event) => updateField('hero.media.alt', event.target.value)}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </label>
          </div>
          <div className={`rounded-3xl border border-dashed border-slate-200 p-6 ${heroPreview.backgroundClass}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em]">{heroPreview.kicker || 'KICKER'}</p>
            <h4 className="mt-3 text-3xl font-semibold">{heroPreview.headline}</h4>
            <p className="mt-3 max-w-2xl text-sm opacity-80">{heroPreview.subheadline || 'Bring your mission, we orchestrate the launchpad.'}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {heroPreview.primaryCtaLabel ? (
                <span className="inline-flex items-center rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-900 shadow-sm">
                  {heroPreview.primaryCtaLabel}
                </span>
              ) : null}
              {heroPreview.secondaryCtaLabel ? (
                <span className="inline-flex items-center rounded-full border border-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/90">
                  {heroPreview.secondaryCtaLabel}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-inner">
          <SectionHeader
            title="Navigation"
            description="Design the customer journey with up to eight menu items."
          />
          <NavigationList links={form.navigation.links} onEdit={handleNavEdit} onRemove={handleNavRemove} />
          <form onSubmit={handleNavSubmit} className="grid gap-4 md:grid-cols-[2fr_3fr_auto] items-end rounded-2xl border border-slate-200 bg-white/70 px-4 py-3">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-slate-600">Label</span>
              <input
                type="text"
                value={navDraft.label}
                onChange={(event) => setNavDraft((previous) => ({ ...previous, label: event.target.value }))}
                required
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-slate-600">URL</span>
              <input
                type="text"
                value={navDraft.url}
                onChange={(event) => setNavDraft((previous) => ({ ...previous, url: event.target.value }))}
                required
                placeholder="#services"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
            <div className="flex flex-col gap-2 text-xs">
              <label className="inline-flex items-center gap-2 text-slate-600">
                <input
                  type="checkbox"
                  checked={navDraft.openInNewTab}
                  onChange={(event) => setNavDraft((previous) => ({ ...previous, openInNewTab: event.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                New tab
              </label>
              <button
                type="submit"
                className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-indigo-500"
              >
                {editingNavIndex != null ? 'Update link' : 'Add link'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-inner">
          <SectionHeader
            title="Contact & social"
            description="Route inbound interest to the right channel and showcase your presence."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Contact email</span>
              <input
                type="email"
                value={form.contact.email}
                onChange={(event) => updateField('contact.email', event.target.value)}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Contact phone</span>
              <input
                type="tel"
                value={form.contact.phone}
                onChange={(event) => updateField('contact.phone', event.target.value)}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Location</span>
              <input
                type="text"
                value={form.contact.location}
                onChange={(event) => updateField('contact.location', event.target.value)}
                placeholder="London, UK"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Booking link</span>
              <input
                type="url"
                value={form.contact.bookingLink}
                onChange={(event) => updateField('contact.bookingLink', event.target.value)}
                placeholder="https://cal.com/launchpad"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Availability note</span>
            <textarea
              value={form.contact.availabilityNote}
              onChange={(event) => updateField('contact.availabilityNote', event.target.value)}
              rows={3}
              placeholder="Typically replies within 24 hours."
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.contact.showForm}
              onChange={(event) => updateField('contact.showForm', event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Enable contact form submissions
          </label>

          <SectionHeader
            title="Social profiles"
            description="Spotlight communities, newsletters, and ecosystems."
          />
          <SocialList links={form.social.links} onEdit={handleSocialEdit} onRemove={handleSocialRemove} />
          <form onSubmit={handleSocialSubmit} className="grid gap-4 md:grid-cols-[2fr_3fr_auto] items-end rounded-2xl border border-slate-200 bg-white/70 px-4 py-3">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-slate-600">Platform</span>
              <input
                type="text"
                value={socialDraft.platform}
                onChange={(event) => setSocialDraft((previous) => ({ ...previous, platform: event.target.value }))}
                required
                placeholder="LinkedIn"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-slate-600">URL</span>
              <input
                type="url"
                value={socialDraft.url}
                onChange={(event) => setSocialDraft((previous) => ({ ...previous, url: event.target.value }))}
                required
                placeholder="https://linkedin.com/company/gigvora"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-emerald-500"
            >
              {editingSocialIndex != null ? 'Update' : 'Add'} profile
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-inner">
          {saving ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Publishing preferences…</p>
          ) : null}
          {feedback ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">{feedback}</p>
          ) : null}
          {saveError ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">{saveError}</p>
          ) : null}
          <div className="flex flex-wrap justify-between gap-3">
            <button
              type="button"
              onClick={() => setForm(clone(DEFAULT_PREFERENCES))}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
            >
              Reset defaults
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              Save and publish site
            </button>
          </div>
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
