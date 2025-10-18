import { Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import CompanyGroupManagementSection from '../../components/company/groups/CompanyGroupManagementSection.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import useSession from '../../hooks/useSession.js';
import { COMPANY_DASHBOARD_MENU_SECTIONS } from '../../constants/companyDashboardMenu.js';

const AVAILABLE_DASHBOARDS = ['company', 'agency', 'headhunter', 'user', 'freelancer'];
const PAGE_SECTIONS = [
  { id: 'group-overview', label: 'Overview' },
  { id: 'group-collection', label: 'Groups' },
  { id: 'group-create', label: 'New' },
];

function buildProfile(session) {
  if (!session) {
    return null;
  }
  const name = session.companyName ?? session.organisation ?? session.name ?? 'Company workspace';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return {
    name,
    role: 'Workspace owner',
    initials: initials || 'CO',
    status: 'Groups enabled',
    badges: ['Groups'],
    metrics: [],
  };
}

export default function CompanyGroupManagementPage() {
  const navigate = useNavigate();
  const { session, isAuthenticated } = useSession();
  const memberships = session?.memberships ?? [];
  const isCompanyMember = memberships.includes('company');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirectTo: '/dashboard/company/groups' }} />;
  }

  if (!isCompanyMember) {
    const fallbackDashboards = memberships.filter((membership) => membership !== 'company');
    return (
      <DashboardLayout
        currentDashboard="company"
        title="Groups"
        subtitle="Community"
        description="Company membership required."
        menuSections={COMPANY_DASHBOARD_MENU_SECTIONS}
        availableDashboards={AVAILABLE_DASHBOARDS}
      >
        <AccessDeniedPanel
          availableDashboards={fallbackDashboards}
          onNavigate={(dashboard) => navigate(`/dashboard/${dashboard}`)}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      currentDashboard="company"
      title="Groups"
      subtitle="Community"
      description="Run workspace circles, approvals, and invites from one place."
      menuSections={COMPANY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      activeMenuItem="company-group-management"
      sections={PAGE_SECTIONS}
      profile={buildProfile(session)}
    >
      <CompanyGroupManagementSection />
    </DashboardLayout>
  );
}
