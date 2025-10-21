import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DashboardAccessGuard from '../../components/security/DashboardAccessGuard.jsx';
import VolunteeringManagementSection from './freelancer/sections/volunteering/VolunteeringManagementSection.jsx';
import { MENU_GROUPS, AVAILABLE_DASHBOARDS } from './freelancer/menuConfig.js';

const ALLOWED_ROLES = ['freelancer'];

function VolunteerContent() {
  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title="Volunteer"
      subtitle="Pro bono engagements"
      description="Run purpose-led work with the same rigour you bring to paid projects."
      menuSections={MENU_GROUPS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      activeMenuItem="volunteer"
    >
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <header className="space-y-3 border-b border-slate-200 pb-8">
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Volunteer</p>
          <h1 className="text-3xl font-semibold text-slate-900">Run pro bono engagements with confidence</h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Track every application, response, agreement, and expense in one workspace built for high-trust volunteering.
          </p>
        </header>
        <VolunteeringManagementSection />
      </div>
    </DashboardLayout>
  );
}

export default function FreelancerVolunteerPage() {
  return (
    <DashboardAccessGuard requiredRoles={ALLOWED_ROLES}>
      <VolunteerContent />
    </DashboardAccessGuard>
  );
}
