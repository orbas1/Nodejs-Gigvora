import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AdminPageSettingsPanel from '../../components/admin/AdminPageSettingsPanel.jsx';
import useSession from '../../hooks/useSession.js';

const MENU_SECTIONS = [
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

export default function AdminPagesSettingsPage() {
  const { session } = useSession();

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Pages workspace"
      subtitle="Design, publish, and secure Gigvora marketing pages"
      description="Manage hero modules, content sections, navigation, and publishing controls from a dedicated CMS console."
      menuSections={MENU_SECTIONS}
      sections={[]}
      availableDashboards={AVAILABLE_DASHBOARDS}
    >
      <AdminPageSettingsPanel session={session} />
    </DashboardLayout>
  );
}
