import { useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import ProjectGigManagementContainer from '../../components/projectGigManagement/ProjectGigManagementContainer.jsx';
import useSession from '../../hooks/useSession.js';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';

const MENU_SECTIONS = [
  {
    label: 'Plan',
    items: [
      { name: 'Templates', sectionId: 'projects-create' },
      { name: 'Open', sectionId: 'projects-open' },
      { name: 'Closed', sectionId: 'projects-closed' },
    ],
  },
  {
    label: 'Run',
    items: [
      { name: 'Board', sectionId: 'projects-board' },
      { name: 'Assets', sectionId: 'projects-assets' },
      { name: 'Vendors', sectionId: 'projects-vendors' },
      { name: 'Stories', sectionId: 'projects-stories' },
    ],
  },
];

const AVAILABLE_DASHBOARDS = ['company', 'agency', 'user', 'freelancer'];

export default function CompanyProjectManagementPage() {
  const navigate = useNavigate();
  const { session, isAuthenticated } = useSession();
  const userId = useMemo(() => {
    const parsed = Number.parseInt(session?.id, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }, [session?.id]);

  const membershipsList = session?.memberships ?? [];
  const isCompanyMember = membershipsList.includes('company');

  const sections = useMemo(
    () => [
      { id: 'projects-create', label: 'Templates' },
      { id: 'projects-open', label: 'Open' },
      { id: 'projects-closed', label: 'Closed' },
      { id: 'projects-board', label: 'Board' },
      { id: 'projects-assets', label: 'Assets' },
      { id: 'projects-vendors', label: 'Vendors' },
      { id: 'projects-stories', label: 'Stories' },
    ],
    [],
  );

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirectTo: '/dashboard/company/projects' }} />;
  }

  if (!isCompanyMember) {
    const fallbackDashboards = membershipsList.filter((membership) => membership !== 'company');
    return (
      <DashboardLayout
        currentDashboard="company"
        title="Project hub"
        subtitle="Create, track, and close company projects in one view."
        menuSections={MENU_SECTIONS}
        sections={sections}
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
      title="Project hub"
      subtitle="Create, track, and close company projects in one view."
      menuSections={MENU_SECTIONS}
      sections={sections}
      availableDashboards={AVAILABLE_DASHBOARDS}
    >
      <div className="mx-auto w-full max-w-6xl space-y-12 px-6 py-10">
        {userId ? (
          <ProjectGigManagementContainer userId={userId} />
        ) : (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700">
            We could not resolve your workspace owner. Refresh the page or sign in again to manage projects.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

