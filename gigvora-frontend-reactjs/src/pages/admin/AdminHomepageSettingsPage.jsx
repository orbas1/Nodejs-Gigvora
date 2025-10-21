import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import { fetchHomepageSettings, updateHomepageSettings } from '../../services/homepageSettings.js';
import HomepageAnnouncementForm from '../../components/admin/homepage/HomepageAnnouncementForm.jsx';
import HomepageHeroForm from '../../components/admin/homepage/HomepageHeroForm.jsx';
import HomepageHighlightsForm from '../../components/admin/homepage/HomepageHighlightsForm.jsx';
import HomepageFeatureSectionsForm from '../../components/admin/homepage/HomepageFeatureSectionsForm.jsx';
import HomepageTestimonialsForm from '../../components/admin/homepage/HomepageTestimonialsForm.jsx';
import HomepageFaqForm from '../../components/admin/homepage/HomepageFaqForm.jsx';
import HomepageQuickLinksForm from '../../components/admin/homepage/HomepageQuickLinksForm.jsx';
import HomepageSeoForm from '../../components/admin/homepage/HomepageSeoForm.jsx';
import ADMIN_MENU_SECTIONS from '../../constants/adminMenu.js';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import { deriveAdminAccess } from '../../utils/adminAccess.js';

function cloneDeep(value) {
  if (value == null) {
    return value;
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    console.warn('Unable to clone value', error);
    return value;
  }
}

function formatRelativeTime(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  const now = Date.now();
  const deltaMs = date.getTime() - now;
  const absDelta = Math.abs(deltaMs);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (absDelta < minute) {
    return 'just now';
  }
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (absDelta < hour) {
    return rtf.format(Math.round(deltaMs / minute), 'minute');
  }
  if (absDelta < day) {
    return rtf.format(Math.round(deltaMs / hour), 'hour');
  }
  return rtf.format(Math.round(deltaMs / day), 'day');
}

const HOMEPAGE_SECTION_ITEMS = [
  { id: 'admin-homepage-announcement-nav', name: 'Announcement bar', sectionId: 'admin-homepage-announcement' },
  { id: 'admin-homepage-hero-nav', name: 'Hero', sectionId: 'admin-homepage-hero' },
  { id: 'admin-homepage-highlights-nav', name: 'Highlights', sectionId: 'admin-homepage-highlights' },
  { id: 'admin-homepage-sections-nav', name: 'Feature sections', sectionId: 'admin-homepage-sections' },
  { id: 'admin-homepage-testimonials-nav', name: 'Testimonials', sectionId: 'admin-homepage-testimonials' },
  { id: 'admin-homepage-faqs-nav', name: 'FAQs', sectionId: 'admin-homepage-faqs' },
  { id: 'admin-homepage-quick-links-nav', name: 'Quick links', sectionId: 'admin-homepage-quick-links' },
  { id: 'admin-homepage-seo-nav', name: 'SEO metadata', sectionId: 'admin-homepage-seo' },
];

const AVAILABLE_DASHBOARDS = ['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter'];

const SECTIONS = HOMEPAGE_SECTION_ITEMS.map((item) => ({ id: item.sectionId, title: item.name }));

function buildMenuSections() {
  const baseSections = ADMIN_MENU_SECTIONS.map((section) => ({
    ...section,
    items: Array.isArray(section.items) ? section.items.map((item) => ({ ...item })) : [],
  }));
  baseSections.push({
    label: 'Homepage builder',
    items: HOMEPAGE_SECTION_ITEMS.map((item) => ({ ...item })),
  });
  return baseSections;
}

function getUserScopes(session) {
  const permissions = Array.isArray(session?.permissions) ? session.permissions : [];
  const capabilities = Array.isArray(session?.capabilities) ? session.capabilities : [];
  return [...permissions, ...capabilities];
}

function AdminHomepageSettingsPageContent() {
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [dirty, setDirty] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const loadHomepageSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStatus('');
    try {
      const response = await fetchHomepageSettings();
      const normalised = cloneDeep(response ?? {});
      setSettings(normalised);
      setDraft(normalised);
      setDirty(false);
      setLastSyncedAt(new Date());
    } catch (loadError) {
      setError(loadError?.message || 'Failed to load homepage settings.');
      setSettings(null);
      setDraft(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHomepageSettings();
  }, [loadHomepageSettings, refreshIndex]);

  const handleRefresh = useCallback(() => {
    setRefreshIndex((current) => current + 1);
  }, []);

  const handleSave = useCallback(async () => {
    if (!draft) {
      return;
    }
    setSaving(true);
    setError(null);
    setStatus('');
    try {
      const response = await updateHomepageSettings(draft);
      const normalised = cloneDeep(response ?? {});
      setSettings(normalised);
      setDraft(normalised);
      setDirty(false);
      setStatus('Homepage settings saved successfully.');
      setLastSyncedAt(new Date());
    } catch (saveError) {
      setError(saveError?.message || 'Unable to save homepage settings.');
    } finally {
      setSaving(false);
    }
  }, [draft]);

  const handleReset = useCallback(() => {
    if (!settings) {
      setDraft(null);
      setDirty(false);
      setStatus('');
      return;
    }
    const baseline = cloneDeep(settings);
    setDraft(baseline);
    setDirty(false);
    setStatus('Draft reset to last saved configuration.');
  }, [settings]);

  const disableInputs = loading || saving || !draft;

  const handleAnnouncementChange = useCallback(
    (announcement) => {
      setDraft((current) => {
        const baseline = cloneDeep(current ?? settings ?? {});
        baseline.announcementBar = announcement;
        return baseline;
      });
      setDirty(true);
    },
    [settings],
  );

  const handleHeroChange = useCallback(
    (hero) => {
      setDraft((current) => {
        const baseline = cloneDeep(current ?? settings ?? {});
        baseline.hero = hero;
        return baseline;
      });
      setDirty(true);
    },
    [settings],
  );

  const handleHighlightsChange = useCallback(
    (highlights) => {
      setDraft((current) => {
        const baseline = cloneDeep(current ?? settings ?? {});
        baseline.valueProps = highlights;
        return baseline;
      });
      setDirty(true);
    },
    [settings],
  );

  const handleSectionsChange = useCallback(
    (sections) => {
      setDraft((current) => {
        const baseline = cloneDeep(current ?? settings ?? {});
        baseline.featureSections = sections;
        return baseline;
      });
      setDirty(true);
    },
    [settings],
  );

  const handleTestimonialsChange = useCallback(
    (testimonials) => {
      setDraft((current) => {
        const baseline = cloneDeep(current ?? settings ?? {});
        baseline.testimonials = testimonials;
        return baseline;
      });
      setDirty(true);
    },
    [settings],
  );

  const handleFaqChange = useCallback(
    (faqs) => {
      setDraft((current) => {
        const baseline = cloneDeep(current ?? settings ?? {});
        baseline.faqs = faqs;
        return baseline;
      });
      setDirty(true);
    },
    [settings],
  );

  const handleQuickLinksChange = useCallback(
    (links) => {
      setDraft((current) => {
        const baseline = cloneDeep(current ?? settings ?? {});
        baseline.quickLinks = links;
        return baseline;
      });
      setDirty(true);
    },
    [settings],
  );

  const handleSeoChange = useCallback(
    (seo) => {
      setDraft((current) => {
        const baseline = cloneDeep(current ?? settings ?? {});
        baseline.seo = seo;
        return baseline;
      });
      setDirty(true);
    },
    [settings],
  );

  const announcementValue = draft?.announcementBar ?? settings?.announcementBar ?? {};
  const heroValue = draft?.hero ?? settings?.hero ?? {};
  const highlightValue = draft?.valueProps ?? settings?.valueProps ?? [];
  const featureSectionsValue = draft?.featureSections ?? settings?.featureSections ?? [];
  const testimonialValue = draft?.testimonials ?? settings?.testimonials ?? [];
  const faqValue = draft?.faqs ?? settings?.faqs ?? [];
  const quickLinksValue = draft?.quickLinks ?? settings?.quickLinks ?? [];
  const seoValue = draft?.seo ?? settings?.seo ?? {};

  const statusLabel = lastSyncedAt ? `Last synced ${formatRelativeTime(lastSyncedAt)}` : 'Awaiting sync';

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Homepage settings</h1>
            <p className="mt-1 text-sm text-slate-600">
              Orchestrate the public landing page with announcement bars, hero content, highlights, and social metadata.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                {loading ? 'Syncing settings…' : statusLabel}
              </span>
              {dirty ? (
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                  Unsaved changes
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
            >
              <ArrowPathIcon className="mr-2 h-4 w-4" /> Re-sync data
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!dirty || saving || loading}
            >
              Discard draft
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
              disabled={!dirty || saving || loading}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}
        {status && !error ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status}</div>
        ) : null}
      </section>

      <HomepageAnnouncementForm value={announcementValue} onChange={handleAnnouncementChange} disabled={disableInputs} />
      <HomepageHeroForm value={heroValue} onChange={handleHeroChange} disabled={disableInputs} />
      <HomepageHighlightsForm value={highlightValue} onChange={handleHighlightsChange} disabled={disableInputs} />
      <HomepageFeatureSectionsForm value={featureSectionsValue} onChange={handleSectionsChange} disabled={disableInputs} />
      <HomepageTestimonialsForm value={testimonialValue} onChange={handleTestimonialsChange} disabled={disableInputs} />
      <HomepageFaqForm value={faqValue} onChange={handleFaqChange} disabled={disableInputs} />
      <HomepageQuickLinksForm value={quickLinksValue} onChange={handleQuickLinksChange} disabled={disableInputs} />
      <HomepageSeoForm value={seoValue} onChange={handleSeoChange} disabled={disableInputs} />
    </div>
  );
}

export default function AdminHomepageSettingsPage() {
  const { session, profile, isAuthenticated } = useSession();
  const { hasAdminAccess } = useMemo(() => deriveAdminAccess(session), [session]);
  const userScopes = useMemo(() => getUserScopes(session), [session]);
  const menuSections = useMemo(() => buildMenuSections(), []);

  if (!isAuthenticated || !hasAdminAccess) {
    return (
      <DashboardLayout
        currentDashboard="admin"
        title="Gigvora Admin Control Tower"
        subtitle="Enterprise governance & compliance"
        description="Configure platform governance and the public homepage experience from one control tower."
        menuSections={menuSections}
        sections={[]}
        profile={profile}
        activeMenuItem="admin-homepage-settings"
        availableDashboards={AVAILABLE_DASHBOARDS}
      >
        <AccessDeniedPanel
          role="admin"
          availableDashboards={AVAILABLE_DASHBOARDS}
          userScopes={userScopes}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Gigvora Admin Control Tower"
      subtitle="Enterprise governance & compliance"
      description="Configure platform governance and the public homepage experience from one control tower."
      menuSections={menuSections}
      sections={SECTIONS}
      profile={profile}
      activeMenuItem="admin-homepage-settings"
      availableDashboards={AVAILABLE_DASHBOARDS}
    >
      <AdminHomepageSettingsPageContent />
    </DashboardLayout>
  );
}
