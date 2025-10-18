import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import PolicyManager from '../../../components/admin/legal/PolicyManager.jsx';

const MENU_SECTIONS = [
  {
    label: 'Legal',
    items: [
      { id: 'library', name: 'Library', sectionId: 'policy-library' },
      { id: 'workflow', name: 'Workflow', sectionId: 'policy-workflow' },
    ],
  },
  {
    label: 'Back',
    items: [{ id: 'home', name: 'Home', href: '/dashboard/admin' }],
  },
];

export default function AdminPolicyManagementPage() {
  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Legal"
      subtitle="Policies"
      description=""
      menuSections={MENU_SECTIONS}
      sections={[]}
      availableDashboards={['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter']}
    >
      <div className="min-h-screen bg-slate-50/60 px-6 pb-12 pt-6">
        <PolicyManager />
      </div>
    </DashboardLayout>
  );
}
