import { useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AdminPageSettingsPanel from '../../components/admin/AdminPageSettingsPanel.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import useSession from '../../hooks/useSession.js';
import { deriveAdminAccess } from '../../utils/adminAccess.js';

const BASE_MENU_SECTIONS = [
  {
    label: 'Workspace',
    items: [
      { name: 'Overview', href: '#admin-pages-settings' },
      { name: 'General details', href: '#page-settings-general' },
      { name: 'Hero & header', href: '#page-settings-hero' },
      { name: 'SEO & sharing', href: '#page-settings-seo' },
      { name: 'Calls to action', href: '#page-settings-cta' },
      { name: 'Navigation', href: '#page-settings-navigation' },
      { name: 'Content blocks', href: '#page-settings-sections' },
      { name: 'Theme', href: '#page-settings-theme' },
      { name: 'Permissions', href: '#page-settings-permissions' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Admin dashboard', href: '/dashboard/admin' },
      { name: 'Blog management', href: '/dashboard/admin/blog' },
    ],
  },
];

const AVAILABLE_DASHBOARDS = ['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter'];

const SECTIONS = [
  { id: 'admin-pages-settings', title: 'Overview' },
  { id: 'page-settings-general', title: 'General details' },
  { id: 'page-settings-hero', title: 'Hero & header' },
  { id: 'page-settings-seo', title: 'SEO & sharing' },
  { id: 'page-settings-cta', title: 'Calls to action' },
  { id: 'page-settings-navigation', title: 'Navigation' },
  { id: 'page-settings-sections', title: 'Content blocks' },
  { id: 'page-settings-theme', title: 'Theme' },
  { id: 'page-settings-permissions', title: 'Permissions' },
];

function buildMenuSections() {
  return BASE_MENU_SECTIONS.map((section) => ({
    ...section,
    items: Array.isArray(section.items) ? section.items.map((item) => ({ ...item })) : [],
  }));
}

function getUserScopes(session) {
  const permissions = Array.isArray(session?.permissions) ? session.permissions : [];
  const capabilities = Array.isArray(session?.capabilities) ? session.capabilities : [];
  return [...permissions, ...capabilities];
}

export default function AdminPagesSettingsPage() {
  const { session, isAuthenticated } = useSession();
  const { hasAdminAccess } = useMemo(() => deriveAdminAccess(session), [session]);
  const userScopes = useMemo(() => getUserScopes(session), [session]);
  const menuSections = useMemo(() => buildMenuSections(), []);

  if (!isAuthenticated || !hasAdminAccess) {
    return (
      <DashboardLayout
        currentDashboard="admin"
        title="Pages workspace"
        subtitle="Design, publish, and secure Gigvora marketing pages"
        description="Manage hero modules, content sections, navigation, and publishing controls from a dedicated CMS console."
        menuSections={menuSections}
        sections={[]}
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
      title="Pages workspace"
      subtitle="Design, publish, and secure Gigvora marketing pages"
      description="Manage hero modules, content sections, navigation, and publishing controls from a dedicated CMS console."
      menuSections={menuSections}
      sections={SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
    >
      <AdminPageSettingsPanel session={session} />
    </DashboardLayout>
  );
}
