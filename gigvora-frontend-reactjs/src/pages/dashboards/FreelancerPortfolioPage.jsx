import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DashboardAccessGuard from '../../components/security/DashboardAccessGuard.jsx';
import useSession from '../../hooks/useSession.js';
import { MENU_GROUPS, AVAILABLE_DASHBOARDS } from './freelancer/menuConfig.js';
import { PortfolioManagementSection } from './freelancer/sections/index.js';

function resolveFreelancerId(session) {
  if (!session || typeof session !== 'object') {
    return null;
  }

  return (
    session.freelancerId ??
    session.profileId ??
    session.primaryProfileId ??
    session.userId ??
    session.id ??
    null
  );
}

function canManagePortfolio(session) {
  if (!session) {
    return false;
  }

  const role = (session.activeRole ?? session.role ?? session.workspace?.role ?? '')
    .toString()
    .toLowerCase();
  const memberships = Array.isArray(session.memberships)
    ? session.memberships.map((membership) => membership.toString().toLowerCase())
    : [];
  const workspaceType = (session.workspace?.type ?? '')
    .toString()
    .toLowerCase();

  return (
    role.includes('freelancer') ||
    memberships.some((membership) => membership.includes('freelancer')) ||
    workspaceType.includes('freelancer')
  );
}

const ALLOWED_ROLES = ['freelancer'];

export default function FreelancerPortfolioPage() {
  const { session } = useSession();

  const freelancerId = resolveFreelancerId(session);
  const hasFreelancerAccess = canManagePortfolio(session);
  const canEdit = hasFreelancerAccess && Boolean(freelancerId);

  return (
    <DashboardAccessGuard requiredRoles={ALLOWED_ROLES}>
      <DashboardLayout
        currentDashboard="freelancer"
        title="Portfolio"
        subtitle="Showcase your best work"
        description="Curate case studies, testimonials, and assets so prospects see your capabilities instantly."
        menuSections={MENU_GROUPS}
        availableDashboards={AVAILABLE_DASHBOARDS}
        activeMenuItem="portfolio"
      >
        <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-10">
          <header className="border-b border-slate-200 pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Portfolio</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Work</h1>
            <p className="mt-2 text-sm text-slate-600">
              Highlight signature engagements, add new showcases, and keep your portfolio production ready.
            </p>
          </header>
          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
            <PortfolioManagementSection freelancerId={freelancerId} canEdit={canEdit} />
          </section>
        </div>
      </DashboardLayout>
    </DashboardAccessGuard>
  );
}
