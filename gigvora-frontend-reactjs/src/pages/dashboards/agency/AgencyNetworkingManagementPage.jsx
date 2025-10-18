import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import useSession from '../../../hooks/useSession.js';
import { AGENCY_DASHBOARD_MENU_SECTIONS, AGENCY_AVAILABLE_DASHBOARDS } from '../../../constants/agencyDashboardMenu.js';
import AgencyNetworkingSection from '../../../components/agency/networking/AgencyNetworkingSection.jsx';

function resolveWorkspace(session) {
  if (!session) {
    return { id: null, slug: null };
  }
  const workspace = session.workspace || session.agencyWorkspace || null;
  if (workspace && typeof workspace === 'object') {
    return {
      id: workspace.id ?? null,
      slug: workspace.slug ?? null,
    };
  }
  return {
    id: session.workspaceId ?? null,
    slug: session.workspaceSlug ?? null,
  };
}

export default function AgencyNetworkingManagementPage() {
  const { session } = useSession();
  const workspace = resolveWorkspace(session);

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Networking"
      subtitle="Session management & connections"
      description="Run networking sessions, track spend, and nurture every new relationship from one workspace."
      menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={AGENCY_AVAILABLE_DASHBOARDS}
      activeMenuItem="agency-networking"
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <AgencyNetworkingSection workspaceId={workspace.id} workspaceSlug={workspace.slug} />
      </div>
    </DashboardLayout>
  );
}
