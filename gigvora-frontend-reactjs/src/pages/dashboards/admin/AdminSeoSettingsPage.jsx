import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import { ADMIN_MENU_SECTIONS } from '../../../constants/adminMenuSections.js';
import { fetchSeoSettings, updateSeoSettings } from '../../../services/seoSettings.js';
import useSession from '../../../hooks/useSession.js';
import SeoSettingsForm from '../../../components/admin/seo/SeoSettingsForm.jsx';
import SeoOverrideDrawer from '../../../components/admin/seo/SeoOverrideDrawer.jsx';

const ADMIN_ACCESS_ALIASES = new Set(['admin', 'administrator', 'super-admin', 'superadmin']);

const DEFAULT_VERIFICATION_CODES = Object.freeze({
  google: '',
  bing: '',
  yandex: '',
  pinterest: '',
  baidu: '',
});

const DEFAULT_SOCIAL_DEFAULTS = Object.freeze({
  ogTitle: '',
  ogDescription: '',
  ogImageUrl: '',
  ogImageAlt: '',
  twitterHandle: '',
  twitterTitle: '',
  twitterDescription: '',
  twitterCardType: 'summary_large_image',
  twitterImageUrl: '',
});

const DEFAULT_STRUCTURED_DATA = Object.freeze({
  organization: {
    name: '',
    url: '',
    logoUrl: '',
    contactEmail: '',
    sameAs: [],
  },
  customJson: {},
  customJsonText: '',
});

const DEFAULT_SETTINGS = Object.freeze({
  siteName: 'Gigvora',
  defaultTitle: 'Gigvora',
  defaultDescription: '',
  defaultKeywords: [],
  canonicalBaseUrl: '',
  sitemapUrl: '',
  allowIndexing: true,
  robotsPolicy: 'User-agent: *\nDisallow:',
  noindexPaths: [],
  verificationCodes: DEFAULT_VERIFICATION_CODES,
  socialDefaults: DEFAULT_SOCIAL_DEFAULTS,
  structuredData: DEFAULT_STRUCTURED_DATA,
  pageOverrides: [],
  createdAt: null,
  updatedAt: null,
});

function stringifyJson(value) {
  if (!value || typeof value !== 'object') {
    return '';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return '';
  }
}

function cloneSettings(settings) {
  return JSON.parse(JSON.stringify(settings));
}

function normalizeOverride(raw) {
  if (!raw || typeof raw !== 'object') {
    return cloneSettings(createEmptyOverride());
  }
  const structured = raw.structuredData ?? {};
  const customJson = structured.customJson ?? structured ?? {};
  return {
    id: raw.id ?? null,
    path: raw.path ?? '/',
    title: raw.title ?? '',
    description: raw.description ?? '',
    keywords: Array.isArray(raw.keywords) ? raw.keywords : [],
    canonicalUrl: raw.canonicalUrl ?? '',
    ogTitle: raw.ogTitle ?? raw.social?.ogTitle ?? '',
    ogDescription: raw.ogDescription ?? raw.social?.ogDescription ?? '',
    ogImageUrl: raw.ogImageUrl ?? raw.social?.ogImageUrl ?? '',
    ogImageAlt: raw.ogImageAlt ?? raw.social?.ogImageAlt ?? '',
    twitterTitle: raw.twitterTitle ?? raw.social?.twitterTitle ?? raw.twitter?.title ?? '',
    twitterDescription:
      raw.twitterDescription ?? raw.social?.twitterDescription ?? raw.twitter?.description ?? '',
    twitterCardType: raw.twitterCardType ?? raw.social?.twitterCardType ?? raw.twitter?.cardType ?? 'summary_large_image',
    twitterImageUrl: raw.twitterImageUrl ?? raw.social?.twitterImageUrl ?? raw.twitter?.imageUrl ?? '',
    metaTags: Array.isArray(raw.metaTags) ? raw.metaTags : [],
    noindex: Boolean(raw.noindex),
    structuredData: {
      customJson,
      customJsonText: stringifyJson(customJson),
    },
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null,
  };
}

function createEmptyOverride() {
  return {
    id: null,
    path: '/',
    title: '',
    description: '',
    keywords: [],
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImageUrl: '',
    ogImageAlt: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterCardType: 'summary_large_image',
    twitterImageUrl: '',
    metaTags: [],
    noindex: false,
    structuredData: {
      customJson: {},
      customJsonText: '',
    },
  };
}

function normalizeSettingsResponse(payload) {
  if (!payload || typeof payload !== 'object') {
    return cloneSettings(DEFAULT_SETTINGS);
  }
  const verificationCodes = {
    ...DEFAULT_VERIFICATION_CODES,
    ...(payload.verificationCodes ?? {}),
  };
  const socialDefaults = {
    ...DEFAULT_SOCIAL_DEFAULTS,
    ...(payload.socialDefaults ?? {}),
  };
  const structured = payload.structuredData ?? {};
  const organization = {
    ...DEFAULT_STRUCTURED_DATA.organization,
    ...(structured.organization ?? {}),
  };
  const customJson = structured.customJson ?? structured ?? {};

  const overrides = Array.isArray(payload.pageOverrides) ? payload.pageOverrides.map(normalizeOverride) : [];

  return {
    siteName: payload.siteName ?? DEFAULT_SETTINGS.siteName,
    defaultTitle: payload.defaultTitle ?? payload.siteName ?? DEFAULT_SETTINGS.defaultTitle,
    defaultDescription: payload.defaultDescription ?? DEFAULT_SETTINGS.defaultDescription,
    defaultKeywords: Array.isArray(payload.defaultKeywords) ? payload.defaultKeywords : [],
    canonicalBaseUrl: payload.canonicalBaseUrl ?? '',
    sitemapUrl: payload.sitemapUrl ?? '',
    allowIndexing: payload.allowIndexing !== undefined ? Boolean(payload.allowIndexing) : true,
    robotsPolicy: payload.robotsPolicy ?? DEFAULT_SETTINGS.robotsPolicy,
    noindexPaths: Array.isArray(payload.noindexPaths) ? payload.noindexPaths : [],
    verificationCodes,
    socialDefaults,
    structuredData: {
      organization,
      customJson,
      customJsonText: stringifyJson(customJson),
    },
    pageOverrides: overrides,
    createdAt: payload.createdAt ?? null,
    updatedAt: payload.updatedAt ?? null,
  };
}

function parseJsonInput(label, text) {
  if (!text || !text.trim()) {
    return {};
  }
  try {
    const parsed = JSON.parse(text);
    return parsed ?? {};
  } catch (error) {
    throw new Error(`${label} contains invalid JSON.`);
  }
}

function buildPayloadFromDraft(draft) {
  if (!draft) {
    throw new Error('Draft not initialised.');
  }

  const structuredData = {
    organization: {
      name: draft.structuredData?.organization?.name ?? '',
      url: draft.structuredData?.organization?.url ?? '',
      logoUrl: draft.structuredData?.organization?.logoUrl ?? '',
      contactEmail: draft.structuredData?.organization?.contactEmail ?? '',
      sameAs: Array.isArray(draft.structuredData?.organization?.sameAs)
        ? draft.structuredData.organization.sameAs
        : [],
    },
    customJson: parseJsonInput('Global structured data', draft.structuredData?.customJsonText ?? ''),
  };

  const pageOverrides = Array.isArray(draft.pageOverrides)
    ? draft.pageOverrides.map((override) => ({
        id: override.id ?? undefined,
        path: override.path,
        title: override.title,
        description: override.description,
        keywords: override.keywords ?? [],
        canonicalUrl: override.canonicalUrl,
        ogTitle: override.ogTitle,
        ogDescription: override.ogDescription,
        ogImageUrl: override.ogImageUrl,
        ogImageAlt: override.ogImageAlt,
        twitterTitle: override.twitterTitle,
        twitterDescription: override.twitterDescription,
        twitterCardType: override.twitterCardType,
        twitterImageUrl: override.twitterImageUrl,
        metaTags: override.metaTags ?? [],
        noindex: Boolean(override.noindex),
        structuredData: {
          customJson: parseJsonInput(
            `Structured data for ${override.path}`,
            override.structuredData?.customJsonText ?? '',
          ),
        },
      }))
    : [];

  return {
    siteName: draft.siteName,
    defaultTitle: draft.defaultTitle,
    defaultDescription: draft.defaultDescription,
    defaultKeywords: draft.defaultKeywords ?? [],
    canonicalBaseUrl: draft.canonicalBaseUrl ?? '',
    sitemapUrl: draft.sitemapUrl ?? '',
    allowIndexing: Boolean(draft.allowIndexing),
    robotsPolicy: draft.robotsPolicy ?? '',
    noindexPaths: draft.noindexPaths ?? [],
    verificationCodes: draft.verificationCodes ?? DEFAULT_VERIFICATION_CODES,
    socialDefaults: draft.socialDefaults ?? DEFAULT_SOCIAL_DEFAULTS,
    structuredData,
    pageOverrides,
  };
}

function formatRelativeTime(value) {
  if (!value) {
    return 'just now';
  }
  try {
    const date = typeof value === 'string' ? new Date(value) : value;
    const deltaSeconds = Math.round((Date.now() - date.getTime()) / 1000);
    const divisions = [
      { amount: 60, name: 'seconds' },
      { amount: 60, name: 'minutes' },
      { amount: 24, name: 'hours' },
      { amount: 7, name: 'days' },
      { amount: 4.34524, name: 'weeks' },
      { amount: 12, name: 'months' },
      { amount: Number.POSITIVE_INFINITY, name: 'years' },
    ];
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    let duration = deltaSeconds;
    for (const division of divisions) {
      if (Math.abs(duration) < division.amount) {
        return rtf.format(-Math.round(duration), division.name.replace(/s$/, ''));
      }
      duration /= division.amount;
    }
    return 'just now';
  } catch (error) {
    return 'just now';
  }
}

export default function AdminSeoSettingsPage() {
  const { session, isAuthenticated } = useSession();
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [dirty, setDirty] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [overrideDrawer, setOverrideDrawer] = useState({ open: false, mode: 'create', override: null });

  const normalizedMemberships = useMemo(
    () => (session?.memberships ?? []).map((value) => value?.toLowerCase()).filter(Boolean),
    [session?.memberships],
  );
  const normalizedRoles = useMemo(
    () => (session?.roles ?? []).map((value) => value?.toLowerCase()).filter(Boolean),
    [session?.roles],
  );
  const primaryRole = useMemo(
    () => (session?.role ?? session?.user?.role ?? session?.userType ?? '').toLowerCase(),
    [session?.role, session?.user?.role, session?.userType],
  );
  const hasAdminAccess = useMemo(() => {
    if (!isAuthenticated) {
      return false;
    }
    if (ADMIN_ACCESS_ALIASES.has(primaryRole)) {
      return true;
    }
    return (
      normalizedMemberships.some((membership) => ADMIN_ACCESS_ALIASES.has(membership)) ||
      normalizedRoles.some((role) => ADMIN_ACCESS_ALIASES.has(role))
    );
  }, [isAuthenticated, normalizedMemberships, normalizedRoles, primaryRole]);

  const disableInputs = loading || saving;

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    setStatus('');
    try {
      const response = await fetchSeoSettings();
      const normalized = normalizeSettingsResponse(response);
      setSettings(normalized);
      setDraft(cloneSettings(normalized));
      setDirty(false);
      setLastSyncedAt(normalized.updatedAt ?? new Date().toISOString());
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load SEO settings.');
      setSettings(cloneSettings(DEFAULT_SETTINGS));
      setDraft(cloneSettings(DEFAULT_SETTINGS));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasAdminAccess) {
      loadSettings();
    }
  }, [hasAdminAccess, loadSettings]);

  const handleDraftChange = useCallback((updater) => {
    setDraft((previous) => {
      const nextDraft = typeof updater === 'function' ? updater(previous ?? cloneSettings(DEFAULT_SETTINGS)) : updater;
      return nextDraft;
    });
    setDirty(true);
    setError('');
    setStatus('');
  }, []);

  const handleSave = useCallback(async () => {
    if (!draft) return;
    setSaving(true);
    setError('');
    setStatus('');
    try {
      const payload = buildPayloadFromDraft(draft);
      const response = await updateSeoSettings(payload);
      const normalized = normalizeSettingsResponse(response);
      setSettings(normalized);
      setDraft(cloneSettings(normalized));
      setDirty(false);
      setStatus('SEO settings updated successfully.');
      setLastSyncedAt(normalized.updatedAt ?? new Date().toISOString());
    } catch (saveError) {
      setError(saveError?.message || 'Failed to update SEO settings.');
    } finally {
      setSaving(false);
    }
  }, [draft]);

  const handleReset = useCallback(() => {
    if (settings) {
      setDraft(cloneSettings(settings));
    } else {
      setDraft(cloneSettings(DEFAULT_SETTINGS));
    }
    setDirty(false);
    setError('');
    setStatus('Draft reset to last saved configuration.');
  }, [settings]);

  const handleAddOverride = useCallback(() => {
    setOverrideDrawer({ open: true, mode: 'create', override: createEmptyOverride() });
  }, []);

  const handleEditOverride = useCallback((override) => {
    setOverrideDrawer({ open: true, mode: 'edit', override });
  }, []);

  const handleRemoveOverride = useCallback(
    (override) => {
      if (!override) return;
      // eslint-disable-next-line no-alert
      const confirmed = window.confirm('Remove this override?');
      if (!confirmed) {
        return;
      }
      handleDraftChange((previous) => ({
        ...previous,
        pageOverrides: (previous.pageOverrides ?? []).filter((item) => {
          if (override.id != null) {
            return item.id !== override.id;
          }
          return item.path !== override.path;
        }),
      }));
    },
    [handleDraftChange],
  );

  const handleOverrideDrawerClose = useCallback(() => {
    setOverrideDrawer((previous) => ({ ...previous, open: false }));
  }, []);

  const handleOverrideSave = useCallback(
    (override) => {
      const drawerState = overrideDrawer;
      setOverrideDrawer({ open: false, mode: 'create', override: null });
      const normalized = normalizeOverride(override);
      handleDraftChange((previous) => {
        const currentOverrides = Array.isArray(previous.pageOverrides) ? [...previous.pageOverrides] : [];
        if (drawerState.mode === 'edit') {
          const index = currentOverrides.findIndex((item) => {
            if (normalized.id != null && item.id != null) {
              return item.id === normalized.id;
            }
            return item.path === drawerState.override?.path;
          });
          if (index >= 0) {
            currentOverrides[index] = normalized;
          } else {
            currentOverrides.push(normalized);
          }
        } else {
          currentOverrides.push(normalized);
        }
        return {
          ...previous,
          pageOverrides: currentOverrides,
        };
      });
    },
    [handleDraftChange, overrideDrawer],
  );

  const handleOverrideDelete = useCallback(
    (override) => {
      if (!override) return;
      setOverrideDrawer({ open: false, mode: 'create', override: null });
      handleDraftChange((previous) => ({
        ...previous,
        pageOverrides: (previous.pageOverrides ?? []).filter((item) => {
          if (override.id != null && item.id != null) {
            return item.id !== override.id;
          }
          return item.path !== override.path;
        }),
      }));
    },
    [handleDraftChange],
  );

  if (!hasAdminAccess) {
    return (
      <DashboardLayout
        currentDashboard="admin"
        title="Gigvora Admin Control Tower"
        subtitle="Enterprise governance & compliance"
        description="Centralize every lever that powers Gigvora—from member growth and financial operations to trust, support, analytics, and launch readiness."
        menuSections={ADMIN_MENU_SECTIONS}
        sections={[]}
        availableDashboards={['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter']}
        activeMenuItem="admin-seo-settings"
      >
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-8 text-sm text-amber-800">
          Elevated access is required to manage SEO infrastructure. Contact operations to request an admin seat.
        </div>
      </DashboardLayout>
    );
  }

  const overridePaths = useMemo(
    () => (draft?.pageOverrides ?? []).map((override) => override.path).filter(Boolean),
    [draft?.pageOverrides],
  );

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Gigvora Admin Control Tower"
      subtitle="Enterprise governance & compliance"
      description="Centralize every lever that powers Gigvora—from member growth and financial operations to trust, support, analytics, and launch readiness."
      menuSections={ADMIN_MENU_SECTIONS}
      sections={[]}
      availableDashboards={['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter']}
      activeMenuItem="admin-seo-settings"
    >
      <div className="space-y-10">
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-indigo-50/20 p-6 shadow-lg shadow-blue-100/40 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Discovery & growth</p>
              <h1 className="mt-3 text-3xl font-bold text-slate-900">SEO operations console</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-600">
                Govern the metadata, verification codes, and structured data powering Gigvora’s public footprint. Every change is
                versioned and broadcast to the CDN in real time.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">
                  {loading ? 'Syncing…' : lastSyncedAt ? `Last updated ${formatRelativeTime(lastSyncedAt)}` : 'Ready to sync'}
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
                onClick={loadSettings}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading || saving}
              >
                <ArrowPathIcon className="mr-2 h-4 w-4" /> Re-sync
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
          {status ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status}</div>
          ) : null}
        </section>

        <SeoSettingsForm
          draft={draft}
          onDraftChange={handleDraftChange}
          disableInputs={disableInputs}
          onAddOverride={handleAddOverride}
          onEditOverride={handleEditOverride}
          onRemoveOverride={handleRemoveOverride}
        />
      </div>

      <SeoOverrideDrawer
        open={overrideDrawer.open}
        mode={overrideDrawer.mode}
        initialValue={overrideDrawer.override}
        existingPaths={overridePaths}
        onClose={handleOverrideDrawerClose}
        onSave={handleOverrideSave}
        onDelete={handleOverrideDelete}
        disableInputs={saving}
      />
    </DashboardLayout>
  );
}
