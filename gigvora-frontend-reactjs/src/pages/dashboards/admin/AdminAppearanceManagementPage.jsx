import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import ThemeEditor from '../../../components/admin/appearance/ThemeEditor.jsx';
import AssetLibrary from '../../../components/admin/appearance/AssetLibrary.jsx';
import LayoutManager from '../../../components/admin/appearance/LayoutManager.jsx';
import useSession from '../../../hooks/useSession.js';
import {
  fetchAppearanceSummary,
  createAppearanceTheme,
  updateAppearanceTheme,
  activateAppearanceTheme,
  deleteAppearanceTheme,
  createAppearanceAsset,
  updateAppearanceAsset,
  deleteAppearanceAsset,
  createAppearanceLayout,
  updateAppearanceLayout,
  publishAppearanceLayout,
  deleteAppearanceLayout,
} from '../../../services/appearanceManagement.js';

const MENU_SECTIONS = [
  {
    label: 'Style',
    items: [
      { id: 'themes', name: 'Themes', sectionId: 'view-themes' },
      { id: 'media', name: 'Media', sectionId: 'view-media' },
      { id: 'layouts', name: 'Layouts', sectionId: 'view-layouts' },
    ],
  },
];

const AVAILABLE_DASHBOARDS = [
  { id: 'admin', label: 'Admin', href: '/dashboard/admin' },
  { id: 'admin-appearance', label: 'Style', href: '/dashboard/admin/appearance' },
  'user',
  'freelancer',
  'company',
  'agency',
  'headhunter',
];

const DEFAULT_SUMMARY = Object.freeze({
  themes: [],
  assets: [],
  layouts: [],
  stats: {},
});

function normalizeSummary(response) {
  if (!response || typeof response !== 'object') {
    return { ...DEFAULT_SUMMARY };
  }
  return {
    themes: Array.isArray(response.themes) ? response.themes : [],
    assets: Array.isArray(response.assets) ? response.assets : [],
    layouts: Array.isArray(response.layouts) ? response.layouts : [],
    stats: response.stats ?? {},
  };
}

function ToastBanner({ toast, onDismiss }) {
  if (!toast?.message) {
    return null;
  }
  const tone = toast.type ?? 'info';
  const toneStyles = {
    success: {
      container: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      icon: <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />,
    },
    error: {
      container: 'border-red-200 bg-red-50 text-red-700',
      icon: <ExclamationCircleIcon className="h-5 w-5" aria-hidden="true" />,
    },
    info: {
      container: 'border-sky-200 bg-sky-50 text-sky-700',
      icon: <InformationCircleIcon className="h-5 w-5" aria-hidden="true" />,
    },
  };
  const styles = toneStyles[tone] ?? toneStyles.info;
  return (
    <div className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm ${styles.container}`}>
      <div className="flex items-center gap-2">
        {styles.icon}
        <span>{toast.message}</span>
      </div>
      <button type="button" onClick={onDismiss} className="text-xs font-semibold uppercase tracking-wide text-current">
        Dismiss
      </button>
    </div>
  );
}

export default function AdminAppearanceManagementPage() {
  const { session } = useSession();
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [toast, setToast] = useState({ type: '', message: '' });
  const [activeTab, setActiveTab] = useState('themes');

  const isAdmin = useMemo(() => {
    return (session?.memberships ?? []).some((membership) => `${membership}`.toLowerCase() === 'admin');
  }, [session]);

  const refresh = useCallback(() => setRefreshIndex((index) => index + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchAppearanceSummary()
      .then((response) => {
        if (cancelled) return;
        setSummary(normalizeSummary(response));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message ?? 'Unable to load appearance data.');
        setSummary(DEFAULT_SUMMARY);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [refreshIndex]);

  useEffect(() => {
    if (!toast.message) {
      return undefined;
    }
    const timeout = setTimeout(() => setToast({ type: '', message: '' }), 4000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const handleNotify = useCallback((message, type = 'info') => {
    if (!message) {
      return;
    }
    setToast({ message, type });
  }, []);

  const handleCreateTheme = useCallback(
    async (payload) => {
      const result = await createAppearanceTheme(payload);
      refresh();
      return result;
    },
    [refresh],
  );

  const handleUpdateTheme = useCallback(
    async (themeId, payload) => {
      const result = await updateAppearanceTheme(themeId, payload);
      refresh();
      return result;
    },
    [refresh],
  );

  const handleActivateTheme = useCallback(
    async (themeId) => {
      const result = await activateAppearanceTheme(themeId);
      refresh();
      return result;
    },
    [refresh],
  );

  const handleDeleteTheme = useCallback(
    async (themeId) => {
      await deleteAppearanceTheme(themeId);
      refresh();
    },
    [refresh],
  );

  const handleCreateAsset = useCallback(
    async (payload) => {
      const result = await createAppearanceAsset(payload);
      refresh();
      return result;
    },
    [refresh],
  );

  const handleUpdateAsset = useCallback(
    async (assetId, payload) => {
      const result = await updateAppearanceAsset(assetId, payload);
      refresh();
      return result;
    },
    [refresh],
  );

  const handleDeleteAsset = useCallback(
    async (assetId) => {
      await deleteAppearanceAsset(assetId);
      refresh();
    },
    [refresh],
  );

  const handleCreateLayout = useCallback(
    async (payload) => {
      const result = await createAppearanceLayout(payload);
      refresh();
      return result;
    },
    [refresh],
  );

  const handleUpdateLayout = useCallback(
    async (layoutId, payload) => {
      const result = await updateAppearanceLayout(layoutId, payload);
      refresh();
      return result;
    },
    [refresh],
  );

  const handlePublishLayout = useCallback(
    async (layoutId, payload) => {
      const result = await publishAppearanceLayout(layoutId, payload);
      refresh();
      return result;
    },
    [refresh],
  );

  const handleDeleteLayout = useCallback(
    async (layoutId) => {
      await deleteAppearanceLayout(layoutId);
      refresh();
    },
    [refresh],
  );

  const stats = summary.stats ?? {};
  const themes = summary.themes ?? [];
  const assets = summary.assets ?? [];
  const layouts = summary.layouts ?? [];

  const metrics = [
    { label: 'Themes', value: stats.totalThemes ?? themes.length },
    { label: 'Media', value: stats.totalAssets ?? assets.length },
    { label: 'Layouts', value: stats.totalLayouts ?? layouts.length },
    { label: 'Live', value: stats.publishedLayouts ?? layouts.filter((item) => item.status === 'published').length },
  ];

  const renderActiveTab = () => {
    if (activeTab === 'themes') {
      return (
        <ThemeEditor
          themes={themes}
          isLoading={loading}
          onCreateTheme={handleCreateTheme}
          onUpdateTheme={handleUpdateTheme}
          onActivateTheme={handleActivateTheme}
          onDeleteTheme={handleDeleteTheme}
          onNotify={handleNotify}
        />
      );
    }
    if (activeTab === 'media') {
      return (
        <AssetLibrary
          assets={assets}
          themes={themes}
          isLoading={loading}
          onCreateAsset={handleCreateAsset}
          onUpdateAsset={handleUpdateAsset}
          onDeleteAsset={handleDeleteAsset}
          onNotify={handleNotify}
        />
      );
    }
    return (
      <LayoutManager
        layouts={layouts}
        themes={themes}
        isLoading={loading}
        onCreateLayout={handleCreateLayout}
        onUpdateLayout={handleUpdateLayout}
        onPublishLayout={handlePublishLayout}
        onDeleteLayout={handleDeleteLayout}
        onNotify={handleNotify}
      />
    );
  };

  if (!isAdmin) {
    return (
      <DashboardLayout
        currentDashboard="admin-appearance"
        title="Style Console"
        subtitle="Reserved for admins"
        description="Only administrators can manage themes, media, and layouts."
        menuSections={MENU_SECTIONS}
        sections={[]}
        availableDashboards={AVAILABLE_DASHBOARDS}
        adSurface="admin_dashboard"
      >
        <div className="mx-auto max-w-xl rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-amber-800">Access blocked</h2>
          <p className="mt-2 text-sm text-amber-700">Contact operations to request admin rights.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      currentDashboard="admin-appearance"
      title="Style Console"
      subtitle="Design system controls"
      description="Manage live themes, media, and layout presets in one place."
      menuSections={MENU_SECTIONS}
      sections={[]}
      availableDashboards={AVAILABLE_DASHBOARDS}
      adSurface="admin_dashboard"
    >
      <div className="space-y-6">
        {toast.message ? <ToastBanner toast={toast} onDismiss={() => setToast({ type: '', message: '' })} /> : null}
        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-center shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-3">
          <nav className="flex gap-2 rounded-2xl bg-slate-50 p-2">
            {['themes', 'media', 'layouts'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab === 'themes' ? 'Themes' : tab === 'media' ? 'Media' : 'Layouts'}
              </button>
            ))}
          </nav>
        </div>

        {renderActiveTab()}
      </div>
    </DashboardLayout>
  );
}
