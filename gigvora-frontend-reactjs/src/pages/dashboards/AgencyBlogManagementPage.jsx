import { useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import useSession from '../../hooks/useSession.js';
import AgencyBlogManager from '../../components/agency/blog/AgencyBlogManager.jsx';
import { AGENCY_DASHBOARD_MENU_SECTIONS } from '../../constants/agencyDashboardMenu.js';
import { deriveAgencyAccess } from '../../utils/agencyAccess.js';

const AVAILABLE_DASHBOARDS = ['agency', 'company', 'freelancer', 'user', 'headhunter'];

export default function AgencyBlogManagementPage() {
  const { session, isAuthenticated } = useSession();
  const { hasAgencyAccess } = useMemo(() => deriveAgencyAccess(session), [session]);

  if (!isAuthenticated) {
    return (
      <DashboardLayout
        currentDashboard="agency"
        title="Blog"
        subtitle="Workspace posts"
        description=""
        menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
        availableDashboards={AVAILABLE_DASHBOARDS}
        activeMenuItem="blog-management"
      >
        <AccessDeniedPanel role="agency" availableDashboards={AVAILABLE_DASHBOARDS.filter((item) => item !== 'agency')} />
      </DashboardLayout>
    );
  }

  if (!hasAgencyAccess) {
    return (
      <DashboardLayout
        currentDashboard="agency"
        title="Blog"
        subtitle="Workspace posts"
        description=""
        menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
        availableDashboards={AVAILABLE_DASHBOARDS}
        activeMenuItem="blog-management"
      >
        <AccessDeniedPanel
          role="agency"
          availableDashboards={AVAILABLE_DASHBOARDS.filter((item) => item !== 'agency')}
          reason="Agency workspace membership required"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Blog"
      subtitle="Workspace posts"
      description=""
      menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      activeMenuItem="blog-management"
    >
      <AgencyBlogManager />
    </DashboardLayout>
  );
}
