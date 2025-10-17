import useSession from '../../hooks/useSession.js';
import AgencyDashboardLayout from './agency/AgencyDashboardLayout.jsx';
import AgencyOverview from './agency/AgencyOverview.jsx';

export default function AgencyDashboardPage() {
  const { session } = useSession();
  const displayName = session?.name || session?.firstName || 'Agency team';

  return (
    <AgencyDashboardLayout activeItem="overview">
      <AgencyOverview displayName={displayName} />
    </AgencyDashboardLayout>
  );
}

