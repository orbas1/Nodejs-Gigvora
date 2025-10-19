import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import useSession from '../../../hooks/useSession.js';
import NetworkSection from './sections/NetworkSection.jsx';
import { AVAILABLE_DASHBOARDS } from './menuConfig.js';

const MENU_SECTIONS = [
  {
    label: 'Network',
    items: [
      {
        id: 'network-hub',
        name: 'Hub',
        sectionId: 'network-hub',
      },
    ],
  },
];

export default function FreelancerNetworkingPage() {
  const { session } = useSession();
  const heading = session?.firstName ? `${session.firstName}'s Network` : 'Network';

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title={heading}
      subtitle="Sessions · Spend · Contacts"
      description="Book smartly and keep every introduction moving."
      menuSections={MENU_SECTIONS}
      sections={[]}
      availableDashboards={AVAILABLE_DASHBOARDS}
      activeMenuItem="network-hub"
    >
      <div className="mx-auto w-full max-w-7xl space-y-10 px-6 py-10">
        <NetworkSection />
      </div>
    </DashboardLayout>
  );
}
