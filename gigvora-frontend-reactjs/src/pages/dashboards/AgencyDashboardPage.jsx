import useSession from '../../hooks/useSession.js';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AgencyOverviewContent from '../../components/agency/AgencyOverviewContent.jsx';
import { AGENCY_AVAILABLE_DASHBOARDS, AGENCY_DASHBOARD_MENU } from '../../constants/agencyDashboardMenu.js';

export default function AgencyDashboardPage() {
  const { session } = useSession();
  const displayName = session?.name || session?.firstName || 'Agency team';

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Agency control tower"
      subtitle="Visibility across clients, teams, and delivery."
      description="Monitor delivery, balance the bench, and collaborate with clients in real time."
      menuSections={AGENCY_DASHBOARD_MENU}
      availableDashboards={AGENCY_AVAILABLE_DASHBOARDS}
      activeMenuItem="agency-overview"
    >
      <AgencyOverviewContent displayName={displayName} />
    </DashboardLayout>
  );
}
