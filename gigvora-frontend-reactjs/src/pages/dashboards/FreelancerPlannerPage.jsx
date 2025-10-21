import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DashboardAccessGuard from '../../components/security/DashboardAccessGuard.jsx';
import useSession from '../../hooks/useSession.js';
import { MENU_GROUPS, AVAILABLE_DASHBOARDS } from './freelancer/menuConfig.js';
import PlannerWorkspace from './freelancer/planner/PlannerWorkspace.jsx';

const ALLOWED_ROLES = ['freelancer'];

export default function FreelancerPlannerPage() {
  const { session } = useSession();

  return (
    <DashboardAccessGuard requiredRoles={ALLOWED_ROLES}>
      <DashboardLayout
        currentDashboard="freelancer"
        title="Planner"
        subtitle="Unified schedule hub"
        description="Track gigs, interviews, mentorship, and volunteering in one focused workspace."
        menuSections={MENU_GROUPS}
        availableDashboards={AVAILABLE_DASHBOARDS}
        activeMenuItem="planning"
      >
        <PlannerWorkspace session={session} />
      </DashboardLayout>
    </DashboardAccessGuard>
  );
}
