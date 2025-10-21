import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminMobileAppManagementPanel from '../dashboards/admin/AdminMobileAppManagementPanel.jsx';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import { ADMIN_DASHBOARD_MENU_SECTIONS } from '../../constants/adminDashboardMenu.js';
import useSession from '../../hooks/useSession.js';
import { deriveAdminAccess } from '../../utils/adminAccess.js';

const AVAILABLE_DASHBOARDS = ['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter'];

const MENU_SECTIONS = ADMIN_DASHBOARD_MENU_SECTIONS.map((section) => ({
  ...section,
  items: Array.isArray(section.items) ? section.items.map((item) => ({ ...item })) : [],
})).concat([
  {
    label: 'Mobile apps',
    items: [
      {
        id: 'admin-mobile-apps-overview',
        name: 'Overview',
        sectionId: 'admin-mobile-apps-overview',
      },
      {
        id: 'admin-mobile-apps-operations',
        name: 'Operations',
        sectionId: 'admin-mobile-apps-operations',
      },
    ],
  },
]);

const SECTIONS = [
  { id: 'admin-mobile-apps-overview', title: 'Overview' },
  { id: 'admin-mobile-apps-operations', title: 'Operations' },
];

export default function AdminMobileAppManagementPage() {
  const navigate = useNavigate();
  const { session, isAuthenticated } = useSession();
  const { hasAdminAccess } = useMemo(() => deriveAdminAccess(session), [session]);
  const userScopes = useMemo(() => {
    const permissions = Array.isArray(session?.permissions) ? session.permissions : [];
    const capabilities = Array.isArray(session?.capabilities) ? session.capabilities : [];
    return [...permissions, ...capabilities];
  }, [session]);

  const handleMenuItemSelect = useCallback(
    (itemId, item) => {
      if (item?.href) {
        navigate(item.href);
        return;
      }
      const targetId = item?.sectionId ?? itemId;
      if (!targetId || typeof document === 'undefined') {
        return;
      }
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [navigate],
  );

  if (!isAuthenticated || !hasAdminAccess) {
    return (
      <DashboardLayout
        currentDashboard="admin"
        title="Mobile app command center"
        subtitle="Access governance"
        description="Manage native app releases, compliance gates, and rollout operations."
        menuSections={MENU_SECTIONS}
        sections={[]}
        availableDashboards={AVAILABLE_DASHBOARDS}
        onMenuItemSelect={handleMenuItemSelect}
      >
        <AccessDeniedPanel role="admin" availableDashboards={AVAILABLE_DASHBOARDS} userScopes={userScopes} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Mobile app command center"
      subtitle="Launch and compliance"
      description="Coordinate iOS and Android releases, approvals, and feature rollouts in real time."
      menuSections={MENU_SECTIONS}
      sections={SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      onMenuItemSelect={handleMenuItemSelect}
    >
      <section
        id="admin-mobile-apps-overview"
        className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white via-slate-50 to-blue-50/40 p-8 shadow-sm"
      >
        <div className="mx-auto max-w-6xl">
          <AdminMobileAppManagementPanel standalone />
        </div>
      </section>
    </DashboardLayout>
  );
}
