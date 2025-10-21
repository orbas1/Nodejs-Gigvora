import { useEffect, useMemo, useState } from 'react';
import { ClipboardDocumentCheckIcon, LinkIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import useSession from '../../../hooks/useSession.js';
import {
  fetchSiteManagementOverview,
  updateSiteSettings,
  createSitePage,
  updateSitePage,
  deleteSitePage,
  createNavigationLink,
  updateNavigationLink,
  deleteNavigationLink,
} from '../../../services/siteManagement.js';
import { ADMIN_MENU_SECTIONS } from '../AdminDashboardPage.jsx';
import SiteSettingsForm from '../../../components/admin/site-management/SiteSettingsForm.jsx';
import SiteNavigationManager from '../../../components/admin/site-management/SiteNavigationManager.jsx';
import SitePagesTable from '../../../components/admin/site-management/SitePagesTable.jsx';
import SitePageEditorDrawer from '../../../components/admin/site-management/SitePageEditorDrawer.jsx';

const ADMIN_ALIASES = new Set(['admin', 'administrator', 'super-admin', 'superadmin']);

const PANE_OPTIONS = [
  { id: 'brand', label: 'Brand' },
  { id: 'pages', label: 'Pages' },
  { id: 'menu', label: 'Menu' },
];

function normalizeList(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (typeof item === 'string' ? item.trim().toLowerCase() : null))
    .filter(Boolean);
}

function normalizeScalar(value) {
  if (!value) {
    return '';
  }
  return `${value}`.trim().toLowerCase();
}

function setNestedValue(source, path, value) {
  if (!Array.isArray(path) || path.length === 0) {
    return value;
  }
  const [head, ...rest] = path;
  const base = source && typeof source === 'object' ? source : {};
  const clone = Array.isArray(base) ? [...base] : { ...base };
  clone[head] = rest.length ? setNestedValue(base?.[head], rest, value) : value;
  return clone;
}

export default function AdminSiteManagementPage() {
  const { session, isAuthenticated } = useSession();
  const normalizedMemberships = useMemo(() => normalizeList(session?.memberships), [session?.memberships]);
  const normalizedRoles = useMemo(() => normalizeList(session?.roles ?? session?.user?.roles), [session?.roles, session?.user?.roles]);
  const normalizedCapabilities = useMemo(
    () => normalizeList(session?.capabilities ?? session?.user?.capabilities),
    [session?.capabilities, session?.user?.capabilities],
  );
  const primaryDashboard = useMemo(
    () => normalizeScalar(session?.primaryDashboard ?? session?.user?.primaryDashboard),
    [session?.primaryDashboard, session?.user?.primaryDashboard],
  );
  const sessionRole = useMemo(() => normalizeScalar(session?.role ?? session?.user?.role), [session?.role, session?.user?.role]);
  const userType = useMemo(() => normalizeScalar(session?.userType ?? session?.user?.userType), [session?.userType, session?.user?.userType]);

  const hasAdminSeat = useMemo(() => {
    if (!session) {
      return false;
    }
    const pools = [normalizedMemberships, normalizedRoles, normalizedCapabilities];
    return (
      pools.some((list) => list.some((role) => ADMIN_ALIASES.has(role))) ||
      ADMIN_ALIASES.has(sessionRole) ||
      ADMIN_ALIASES.has(userType)
    );
  }, [session, normalizedMemberships, normalizedRoles, normalizedCapabilities, sessionRole, userType]);

  const hasAccess = hasAdminSeat || primaryDashboard === 'admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(null);
  const [settingsDraft, setSettingsDraft] = useState(null);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState('');
  const [navigation, setNavigation] = useState({});
  const [pages, setPages] = useState([]);
  const [stats, setStats] = useState({});
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState('');

  const [pageEditorOpen, setPageEditorOpen] = useState(false);
  const [pageEditorMode, setPageEditorMode] = useState('create');
  const [selectedPage, setSelectedPage] = useState(null);
  const [pageSaving, setPageSaving] = useState(false);
  const [pageError, setPageError] = useState('');
  const [activePane, setActivePane] = useState('brand');

  useEffect(() => {
    if (!isAuthenticated || !hasAccess) {
      setLoading(false);
      setError('');
      setSettings(null);
      setSettingsDraft(null);
      setSettingsDirty(false);
      setNavigation({});
      setPages([]);
      setStats({});
      setLastSyncedAt(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError('');

    fetchSiteManagementOverview()
      .then((response) => {
        if (!isMounted) {
          return;
        }
        const receivedSettings = response?.settings ?? {};
        setSettings(receivedSettings);
        setSettingsDraft(receivedSettings);
        setSettingsDirty(false);
        setNavigation(response?.navigation ?? {});
        setPages(Array.isArray(response?.pages) ? response.pages : []);
        setStats(response?.stats ?? {});
        setLastSyncedAt(response?.updatedAt ?? new Date().toISOString());
      })
      .catch((err) => {
        if (!isMounted) {
          return;
        }
        setError(err?.message || 'Unable to load site management data.');
        setSettings(null);
        setSettingsDraft(null);
        setNavigation({});
        setPages([]);
        setStats({});
        setLastSyncedAt(null);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, hasAccess]);

  const handleRefresh = () => {
    if (!hasAccess) {
      return;
    }
    setLoading(true);
    setError('');
    setPageError('');
    fetchSiteManagementOverview()
      .then((response) => {
        const receivedSettings = response?.settings ?? {};
        setSettings(receivedSettings);
        setSettingsDraft(receivedSettings);
        setSettingsDirty(false);
        setNavigation(response?.navigation ?? {});
        setPages(Array.isArray(response?.pages) ? response.pages : []);
        setStats(response?.stats ?? {});
        setLastSyncedAt(response?.updatedAt ?? new Date().toISOString());
      })
      .catch((err) => {
        setError(err?.message || 'Unable to refresh site management data.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!copyFeedback) {
      return undefined;
    }
    const timeout = setTimeout(() => setCopyFeedback(''), 2500);
    return () => clearTimeout(timeout);
  }, [copyFeedback]);

  const updateSettingsDraft = (path, value) => {
    setSettingsDraft((current) => {
      const baseline = current ?? settings ?? {};
      const next = setNestedValue(baseline, path, value);
      setSettingsDirty(true);
      setSettingsStatus('');
      return next;
    });
  };

  const handleSaveSettings = async () => {
    if (!settingsDraft || settingsSaving) {
      return;
    }
    setSettingsSaving(true);
    setSettingsStatus('');
    try {
      const payload = { ...settingsDraft };
      const response = await updateSiteSettings(payload);
      const updatedSettings = response?.settings ?? response ?? payload;
      setSettings(updatedSettings);
      setSettingsDraft(updatedSettings);
      setSettingsDirty(false);
      setSettingsStatus('Settings saved');
      setLastSyncedAt(new Date().toISOString());
    } catch (err) {
      setError(err?.message || 'Failed to save site settings.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (!settings) {
      setSettingsDraft(null);
      setSettingsDirty(false);
      return;
    }
    setSettingsDraft(settings);
    setSettingsDirty(false);
    setSettingsStatus('Draft reset');
  };

  const handleCreateNavigation = async (payload) => {
    const response = await createNavigationLink(payload);
    const created = response?.link ?? response;
    const menuKey = created.menuKey ?? payload.menuKey ?? 'primary';
    setNavigation((current) => {
      const next = { ...(current ?? {}) };
      const list = Array.isArray(next[menuKey]) ? [...next[menuKey]] : [];
      list.push(created);
      next[menuKey] = list;
      return next;
    });
    return created;
  };

  const handleUpdateNavigation = async (linkId, payload) => {
    const response = await updateNavigationLink(linkId, payload);
    const updated = response?.link ?? response;
    setNavigation((current) => {
      const next = { ...(current ?? {}) };
      Object.keys(next).forEach((key) => {
        next[key] = Array.isArray(next[key])
          ? next[key].map((link) => (link.id === linkId ? { ...link, ...updated } : link))
          : next[key];
      });
      return next;
    });
    return updated;
  };

  const handleDeleteNavigation = async (linkId) => {
    await deleteNavigationLink(linkId);
    setNavigation((current) => {
      const next = { ...(current ?? {}) };
      Object.keys(next).forEach((key) => {
        next[key] = Array.isArray(next[key]) ? next[key].filter((link) => link.id !== linkId) : next[key];
      });
      return next;
    });
  };

  const openCreatePage = () => {
    setSelectedPage(null);
    setPageEditorMode('create');
    setPageEditorOpen(true);
    setPageError('');
  };

  const openEditPage = (page) => {
    setSelectedPage(page);
    setPageEditorMode('edit');
    setPageEditorOpen(true);
    setPageError('');
  };

  const handleDeletePage = async (page) => {
    if (!page?.id) {
      return;
    }
    const confirmed = window.confirm(
      `Remove ${page.title}? Published pages will be immediately unavailable to visitors.`,
    );
    if (!confirmed) {
      return;
    }
    try {
      await deleteSitePage(page.id);
      setPages((current) => current.filter((item) => item.id !== page.id));
      setStats((current) => ({
        ...current,
        published:
          (current?.published ?? 0) - (page.status === 'published' ? 1 : 0) >= 0
            ? (current?.published ?? 0) - (page.status === 'published' ? 1 : 0)
            : 0,
      }));
    } catch (err) {
      setError(err?.message || 'Unable to remove page.');
    }
  };

  const handleSavePage = async (payload) => {
    setPageSaving(true);
    setPageError('');
    try {
      if (pageEditorMode === 'edit' && selectedPage?.id) {
        const response = await updateSitePage(selectedPage.id, payload);
        const updated = response?.page ?? response;
        setPages((current) => current.map((page) => (page.id === updated.id ? { ...page, ...updated } : page)));
      } else {
        const response = await createSitePage(payload);
        const created = response?.page ?? response;
        setPages((current) => [{ ...created }, ...current]);
      }
      setPageEditorOpen(false);
      setSelectedPage(null);
      setPageEditorMode('create');
      handleRefresh();
    } catch (err) {
      setPageError(err?.message || 'Unable to save page.');
    } finally {
      setPageSaving(false);
    }
  };

  const handlePreviewPage = (page) => {
    if (!page?.slug) {
      return;
    }
    const baseDomain = settingsDraft?.domain ? `https://${settingsDraft.domain}` : window.location.origin;
    const url = `${baseDomain.replace(/\/$/, '')}/${page.slug}`;
    window.open(url, '_blank', 'noopener');
  };

  const totalNavigationLinks = useMemo(() => {
    if (!navigation) {
      return 0;
    }
    return Object.values(navigation).reduce((acc, list) => {
      if (!Array.isArray(list)) {
        return acc;
      }
      return acc + list.length;
    }, 0);
  }, [navigation]);

  const statCards = useMemo(
    () => [
      { id: 'published', label: 'Live pages', value: stats?.published ?? 0 },
      { id: 'draft', label: 'Drafts', value: stats?.draft ?? 0 },
      { id: 'links', label: 'Menu links', value: totalNavigationLinks },
      {
        id: 'synced',
        label: 'Synced',
        value: lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : '—',
      },
    ],
    [stats?.draft, stats?.published, totalNavigationLinks, lastSyncedAt],
  );

  const heroPreview = settingsDraft?.hero ?? {};
  const previewUrl = useMemo(() => {
    if (!settingsDraft?.domain) {
      return '';
    }
    const trimmed = `${settingsDraft.domain}`.trim();
    const normalized = trimmed.replace(/^https?:\/\//i, '').replace(/\/$/, '');
    return normalized ? `https://${normalized}` : '';
  }, [settingsDraft?.domain]);

  const heroBackgroundStyle = useMemo(() => {
    if (heroPreview.backgroundImageUrl) {
      return {
        backgroundImage: `linear-gradient(to bottom, rgba(15,23,42,0.55), rgba(15,23,42,0.75)), url(${heroPreview.backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return {
      backgroundImage: 'linear-gradient(120deg, rgba(37,99,235,0.75), rgba(79,70,229,0.6))',
    };
  }, [heroPreview.backgroundImageUrl]);

  const handleCopyPreviewUrl = async () => {
    if (!previewUrl) {
      return;
    }
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(previewUrl);
        setCopyFeedback('Copied to clipboard');
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = previewUrl;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopyFeedback('Copied to clipboard');
      }
    } catch (err) {
      console.warn('Unable to copy preview URL', err);
      setCopyFeedback('Unable to copy URL');
    }
  };

  const profileName = useMemo(() => {
    if (session?.name) {
      return session.name;
    }
    const first = session?.firstName ?? '';
    const last = session?.lastName ?? '';
    const combined = `${first} ${last}`.trim();
    return combined || 'Admin';
  }, [session?.name, session?.firstName, session?.lastName]);

  if (!isAuthenticated) {
    return (
      <DashboardLayout
        currentDashboard="admin"
        title="Gigvora Admin Control Tower"
        subtitle="Site"
        description="Brand, pages, menu workspace."
        menuSections={ADMIN_MENU_SECTIONS}
        activeMenuItem="site"
        availableDashboards={['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter']}
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-soft">
          <h2 className="text-2xl font-semibold text-slate-900">Sign in required</h2>
          <p className="mt-3 text-sm text-slate-600">Sign in with an admin seat to open site tools.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasAccess) {
    return (
      <DashboardLayout
        currentDashboard="admin"
        title="Gigvora Admin Control Tower"
        subtitle="Site"
        description="Brand, pages, menu workspace."
        menuSections={ADMIN_MENU_SECTIONS}
        activeMenuItem="site"
        availableDashboards={['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter']}
      >
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-10 text-center text-amber-900">
          <h2 className="text-2xl font-semibold">Admin clearance needed</h2>
          <p className="mt-3 text-sm">Ask operations to grant an admin role for site work.</p>
        </div>
      </DashboardLayout>
    );
  }

  const settingsSection = (
    <SiteSettingsForm
      value={settingsDraft}
      loading={loading}
      dirty={settingsDirty}
      saving={settingsSaving}
      status={settingsStatus || (lastSyncedAt ? `Synced ${new Date(lastSyncedAt).toLocaleTimeString()}` : '')}
      error={error}
      disableInputs={settingsSaving}
      onChange={updateSettingsDraft}
      onSave={handleSaveSettings}
      onReset={handleResetSettings}
      onRefresh={handleRefresh}
    />
  );

  const navigationSection = (
    <SiteNavigationManager
      navigation={navigation}
      onCreate={handleCreateNavigation}
      onUpdate={handleUpdateNavigation}
      onDelete={handleDeleteNavigation}
    />
  );

  const pagesSection = (
    <SitePagesTable
      pages={pages}
      stats={stats}
      onCreateClick={openCreatePage}
      onEdit={openEditPage}
      onDelete={handleDeletePage}
      onPreview={handlePreviewPage}
    />
  );

  const paneContent = (() => {
    if (activePane === 'pages') {
      return (
        <>
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          ) : null}
          {pagesSection}
          {pageError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{pageError}</div>
          ) : null}
        </>
      );
    }
    if (activePane === 'menu') {
      return (
        <>
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          ) : null}
          {navigationSection}
        </>
      );
    }
    return settingsSection;
  })();

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Gigvora Admin Control Tower"
      subtitle="Site"
      description="Brand, pages, menu workspace."
      menuSections={ADMIN_MENU_SECTIONS}
      activeMenuItem="site"
      profile={{
        name: profileName,
        role: 'Administrator',
        badges: ['Site'],
      }}
      availableDashboards={['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter']}
    >
      <div className="px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.id}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-left shadow-sm shadow-slate-100"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
            </div>
          ))}
          </div>
          <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm lg:grid-cols-[2fr,1fr]">
            <div className="relative overflow-hidden rounded-3xl text-white" style={heroBackgroundStyle}>
              <div className="relative flex min-h-[220px] flex-col justify-between gap-6 p-6">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-200">
                    {settingsDraft?.tagline || 'Brand tone'}
                  </p>
                  <h3 className="text-2xl font-semibold leading-tight sm:text-3xl">
                    {heroPreview.title || 'Launch high-trust squads in days'}
                  </h3>
                  <p className="text-sm text-slate-100/90">
                    {heroPreview.subtitle || 'Preview how your marketing surfaces render directly from the admin workspace.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={heroPreview.ctaUrl || previewUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/25"
                  >
                    <LinkIcon className="h-4 w-4" aria-hidden="true" />
                    {heroPreview.ctaLabel || 'Open landing page'}
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyPreviewUrl}
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                    disabled={!previewUrl}
                  >
                    <ClipboardDocumentCheckIcon className="h-4 w-4" aria-hidden="true" />
                    {previewUrl ? copyFeedback || 'Copy preview link' : 'Preview link unavailable'}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5 shadow-inner">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Preview details</h4>
                <p className="mt-2 text-xs text-slate-500">
                  Your live marketing site pulls directly from these settings. Changes appear within minutes of publishing.
                </p>
              </div>
              <dl className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <dt>Primary domain</dt>
                  <dd className="font-semibold text-slate-800">{previewUrl || 'Not configured'}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>CTA label</dt>
                  <dd className="font-semibold text-slate-800">{heroPreview.ctaLabel || 'Book a demo'}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Media asset</dt>
                  <dd className="font-semibold text-slate-800">
                    {heroPreview.backgroundImageUrl ? 'Custom backdrop' : 'Gradient fallback'}
                  </dd>
                </div>
              </dl>
              {copyFeedback ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{copyFeedback}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm shadow-slate-100">
            {PANE_OPTIONS.map((option) => {
              const isActive = activePane === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setActivePane(option.id)}
                  className={`min-w-[96px] flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {paneContent}
        </div>
      </div>
      <SitePageEditorDrawer
        open={pageEditorOpen}
        mode={pageEditorMode}
        page={selectedPage}
        saving={pageSaving}
        onClose={() => {
          setPageEditorOpen(false);
          setPageError('');
        }}
        onSave={handleSavePage}
      />
    </DashboardLayout>
  );
}
