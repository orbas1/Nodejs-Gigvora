import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AdminOverviewPanel from '../../components/admin/AdminOverviewPanel.jsx';
import AdminAgencyManagementSection from '../../components/admin/agency-management/AdminAgencyManagementSection.jsx';
import AdminCompanyManagementSection from '../../components/admin/company-management/AdminCompanyManagementSection.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import useSession from '../../hooks/useSession.js';
import { fetchAdminDashboard, updateAdminOverview } from '../../services/admin.js';
import { deriveAdminAccess } from '../../utils/adminAccess.js';

const MENU_SECTIONS = [
  {
    label: 'Start',
    items: [
      { id: 'overview-home', name: 'Home', sectionId: 'overview-home' },
      { id: 'overview-profile', name: 'Profile', sectionId: 'overview-profile' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'agency-management', name: 'Agency management', sectionId: 'admin-agency-management' },
      { id: 'company-management', name: 'Company management', sectionId: 'admin-company-management' },
    ],
  },
];

const SECTIONS = [
  { id: 'overview-home', title: 'Start' },
  { id: 'admin-agency-management', title: 'Agency management' },
  { id: 'admin-company-management', title: 'Company management' },
];

const AVAILABLE_DASHBOARDS = ['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter'];

export default function AdminDashboardPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const { hasAdminAccess } = useMemo(() => deriveAdminAccess(session), [session]);

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingOverview, setSavingOverview] = useState(false);
  const [overviewStatus, setOverviewStatus] = useState('');
  const [overviewError, setOverviewError] = useState('');

  const loadOverview = useCallback(async () => {
    if (!hasAdminAccess) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetchAdminDashboard({ lookbackDays: 30 });
      const snapshot = response?.overview ?? response ?? null;
      setOverview(snapshot);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Unable to load admin overview.');
    } finally {
      setLoading(false);
    }
  }, [hasAdminAccess]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const handleOverviewSave = useCallback(
    async (payload) => {
      setSavingOverview(true);
      setOverviewStatus('');
      setOverviewError('');
      try {
        const updated = await updateAdminOverview(payload);
        setOverview((previous) => ({ ...(previous ?? {}), ...(updated ?? {}) }));
        setOverviewStatus('Admin profile updated successfully.');
      } catch (saveError) {
        const message = saveError instanceof Error ? saveError.message : 'Unable to update admin overview.';
        setOverviewError(message);
        return Promise.reject(new Error(message));
      } finally {
        setSavingOverview(false);
      }
      return undefined;
    },
    [],
  );

  const handleRefresh = useCallback(() => {
    loadOverview();
  }, [loadOverview]);

  const handleMenuSelect = useCallback(
    (itemId, item) => {
      if (item?.href) {
        navigate(item.href);
        return;
      }
      const targetId = item?.sectionId ?? item?.id ?? itemId;
      if (!targetId) {
        return;
      }
      const element = typeof document !== 'undefined' ? document.getElementById(targetId) : null;
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [navigate],
  );

  if (!hasAdminAccess) {
    return (
      <DashboardLayout
        currentDashboard="admin"
        title="Gigvora Admin Control Tower"
        subtitle="Enterprise governance & compliance"
        description="Centralize every lever that powers Gigvora—from member growth and financial operations to trust, support, and analytics."
        menuSections={MENU_SECTIONS}
        sections={[]}
        availableDashboards={AVAILABLE_DASHBOARDS}
        onMenuItemSelect={handleMenuSelect}
      >
        <AccessDeniedPanel
          availableDashboards={AVAILABLE_DASHBOARDS}
          onNavigate={(href) => navigate(href)}
        />
      </DashboardLayout>
    );
  }

  const overviewContent = loading ? (
    <div className="rounded-[36px] border border-slate-200 bg-white/70 p-12 text-center">
      <p className="animate-pulse text-sm font-medium text-slate-500">Loading admin overview…</p>
    </div>
  ) : (
    <AdminOverviewPanel
      overview={overview}
      saving={savingOverview}
      status={overviewStatus}
      error={overviewError || error}
      onSave={handleOverviewSave}
      onRefresh={handleRefresh}
    />
  );

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Gigvora Admin Control Tower"
      subtitle="Enterprise governance & compliance"
      description="Centralize every lever that powers Gigvora—from member growth and financial operations to trust, support, and analytics."
      menuSections={MENU_SECTIONS}
      sections={SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      onMenuItemSelect={handleMenuSelect}
    >
      <div className="space-y-16">
        {overviewContent}
        <AdminAgencyManagementSection />
        <AdminCompanyManagementSection />
      </div>
    </DashboardLayout>
  );
}

