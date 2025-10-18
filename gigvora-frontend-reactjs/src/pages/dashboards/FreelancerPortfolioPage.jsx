import useSession from '../../hooks/useSession.js';
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

export default function FreelancerPortfolioPage() {
  const { session } = useSession();

  const freelancerId = resolveFreelancerId(session);
  const hasFreelancerAccess = canManagePortfolio(session);
  const canEdit = hasFreelancerAccess && Boolean(freelancerId);

  return (
    <div className="min-h-screen bg-surfaceMuted">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 pb-16 pt-14 sm:px-8 lg:px-12">
        <header className="border-b border-slate-200 pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Portfolio</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Work</h1>
        </header>

        <main className="flex-1 py-10">
          <PortfolioManagementSection freelancerId={freelancerId} canEdit={canEdit} />
        </main>
      </div>
    </div>
  );
}
