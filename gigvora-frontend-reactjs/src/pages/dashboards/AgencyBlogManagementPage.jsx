import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AgencyBlogManager from '../../components/agency/blog/AgencyBlogManager.jsx';
import { AGENCY_DASHBOARD_MENU_SECTIONS } from '../../constants/agencyDashboardMenu.js';

export default function AgencyBlogManagementPage() {
  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Blog"
      subtitle="Workspace posts"
      description=""
      menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={['agency', 'company', 'freelancer', 'user']}
      activeMenuItem="blog-management"
    >
      <AgencyBlogManager />
    </DashboardLayout>
  );
}
