import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import DisputeManagementSection from '../../../components/disputes/DisputeManagementSection.jsx';

const MENU_SECTIONS = [
  {
    label: 'Workspace',
    items: [
      {
        id: 'agency-dispute-queue',
        name: 'Queue',
        sectionId: 'agency-dispute-queue',
      },
      {
        id: 'agency-dispute-detail',
        name: 'Case',
        sectionId: 'agency-dispute-detail',
      },
    ],
  },
];

const AVAILABLE_DASHBOARDS = ['agency', 'company', 'freelancer', 'user'];

export default function DisputeManagementPage() {
  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Dispute desk"
      subtitle="Escrow escalations"
      description="Route, review, and resolve cases with live evidence and fund controls."
      menuSections={MENU_SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      adSurface="agency_dashboard"
    >
      <div className="mx-auto w-full max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <DisputeManagementSection />
      </div>
    </DashboardLayout>
  );
}
