import { useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DashboardAccessGuard from '../../components/security/DashboardAccessGuard.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import ProfileHubQuickPanel from '../../components/profileHub/ProfileHubQuickPanel.jsx';
import UserDashboardOverviewSection from '../../components/userDashboard/UserDashboardOverviewSection.jsx';
import ProfileSettingsSection from '../../components/profileSettings/ProfileSettingsSection.jsx';
import ProjectGigManagementContainer from '../../components/projectGigManagement/ProjectGigManagementContainer.jsx';
import EscrowManagementSection from '../../components/escrow/EscrowManagementSection.jsx';
import WalletManagementSection from '../../components/wallet/WalletManagementSection.jsx';
import UserMentoringSection from '../../components/mentoring/user/UserMentoringSection.jsx';
import FinanceControlTowerFeature from '../../components/dashboard/FinanceControlTowerFeature.jsx';
import UserDashboardQuickActions from '../../components/dashboard/UserDashboardQuickActions.jsx';
import useSession from '../../hooks/useSession.js';
import useCachedResource from '../../hooks/useCachedResource.js';
import { fetchUserDashboard } from '../../services/userDashboard.js';

const DEFAULT_USER_ID = 1;
const AVAILABLE_DASHBOARDS = ['user', 'freelancer', 'agency', 'company', 'headhunter'];
const ALLOWED_ROLES = AVAILABLE_DASHBOARDS;

const MENU_SECTIONS = [
  {
    id: 'home',
    label: 'Home',
    items: [
      {
        id: 'home-overview',
        name: 'Overview',
        description: 'Hero messaging, goals, and personal brand.',
        sectionId: 'home-overview',
      },
      {
        id: 'home-profile',
        name: 'Profile',
        description: 'Identity, availability, and brand settings.',
        sectionId: 'home-profile',
      },
    ],
  },
  {
    id: 'gig-management',
    label: 'Gig management',
    items: [
      {
        id: 'gig-management-workbench',
        name: 'Workspaces',
        description: 'Projects, vendors, bids, and deliveries.',
        sectionId: 'gig-management',
      },
    ],
  },
  {
    id: 'escrow-management',
    label: 'Escrow management',
    items: [
      {
        id: 'escrow-accounts',
        name: 'Escrow accounts',
        description: 'Balances, releases, disputes, and controls.',
        sectionId: 'escrow-management',
      },
    ],
  },
  {
    id: 'finance-management',
    label: 'Finance management',
    items: [
      {
        id: 'finance-wallet',
        name: 'Wallet & analytics',
        description: 'Funding sources, ledger, and control tower.',
        sectionId: 'finance-management',
      },
    ],
  },
  {
    id: 'mentors-booked',
    label: 'Mentors booked',
    items: [
      {
        id: 'mentoring-sessions',
        name: 'Mentoring hub',
        description: 'Sessions, packages, reviews, and favourites.',
        sectionId: 'mentors-booked',
      },
    ],
  },
];

function resolveUserId(session) {
  if (!session) {
    return DEFAULT_USER_ID;
  }
  return session.userId ?? session.user?.id ?? session.id ?? DEFAULT_USER_ID;
}

function UserDashboardPage() {
  const { session } = useSession();
  const userId = resolveUserId(session);
  const cacheKey = userId ? `dashboard:user:${userId}` : 'dashboard:user:guest';

  const { data, loading, error, refresh, fromCache, lastUpdated } = useCachedResource(
    cacheKey,
    ({ signal }) => fetchUserDashboard(userId, { signal }),
    { ttl: 1000 * 60 * 3, dependencies: [userId], enabled: Boolean(userId) },
  );

  const profile = data?.profile ?? {};
  const profileHub = data?.profileHub ?? {};
  const overview = data?.overview ?? null;
  const escrowManagement = data?.escrowManagement ?? {};
  const mentoring = data?.mentoring ?? {};

  const quickActionContext = useMemo(() => {
    const projectCollection = Array.isArray(data?.projectGigManagement?.projects)
      ? data.projectGigManagement.projects
      : Array.isArray(data?.projectGigManagement?.workspaces)
      ? data.projectGigManagement.workspaces
      : Array.isArray(data?.projectGigManagement?.items)
      ? data.projectGigManagement.items
      : [];

    const projectTemplates = Array.isArray(data?.projectGigManagement?.templates)
      ? data.projectGigManagement.templates
      : Array.isArray(data?.projectGigManagement?.projectTemplates)
      ? data.projectGigManagement.projectTemplates
      : [];

    const walletAccounts = Array.isArray(data?.finance?.wallets?.accounts)
      ? data.finance.wallets.accounts
      : Array.isArray(data?.wallet?.accounts)
      ? data.wallet.accounts
      : Array.isArray(data?.finance?.wallets)
      ? data.finance.wallets
      : [];

    const fundingSources = Array.isArray(data?.finance?.fundingSources)
      ? data.finance.fundingSources
      : Array.isArray(data?.wallet?.fundingSources)
      ? data.wallet.fundingSources
      : [];

    const mentorsCollection = Array.isArray(mentoring?.mentors)
      ? mentoring.mentors
      : Array.isArray(mentoring?.availableMentors)
      ? mentoring.availableMentors
      : Array.isArray(mentoring?.experts)
      ? mentoring.experts
      : [];

    const escrowAccounts = Array.isArray(escrowManagement?.accounts)
      ? escrowManagement.accounts
      : Array.isArray(escrowManagement?.wallets)
      ? escrowManagement.wallets
      : [];

    const activityFeed = Array.isArray(data?.activity?.items)
      ? data.activity.items
      : Array.isArray(data?.activityFeed)
      ? data.activityFeed
      : Array.isArray(data?.auditTrail)
      ? data.auditTrail
      : [];

    const summary = data?.projectGigManagement?.summary ?? {};
    const financeSummary = data?.finance?.summary ?? data?.wallet?.summary ?? {};
    const escrowSummary = escrowManagement?.summary ?? {};
    const mentoringSummary = mentoring?.summary ?? {};

    const defaultCurrency =
      financeSummary?.currency ??
      financeSummary?.defaultCurrency ??
      walletAccounts?.[0]?.currency ??
      'USD';

    return {
      projects: projectCollection,
      projectTemplates,
      walletAccounts,
      fundingSources,
      mentors: mentorsCollection,
      escrowAccounts,
      activityFeed,
      metrics: {
        activeProjects:
          summary?.activeProjects ?? summary?.projects?.active ?? projectCollection?.length ?? 0,
        openGigOrders: summary?.openGigOrders ?? summary?.orders?.open ?? summary?.activeOrders ?? 0,
        escrowHeld: escrowSummary?.totalHeld ?? escrowSummary?.heldAmount ?? 0,
        walletBalance: financeSummary?.totalBalance ?? financeSummary?.available ?? 0,
        mentorsUpcoming:
          mentoringSummary?.upcomingSessions ?? mentoring?.upcomingSessions?.length ?? mentoring?.sessions?.upcoming?.length ?? 0,
        currency: defaultCurrency,
      },
    };
  }, [data, escrowManagement, mentoring]);

  const welcomeHeadline = useMemo(() => {
    const name = profile?.name ?? session?.name ?? session?.user?.firstName;
    if (!name) {
      return 'Client dashboard';
    }
    return `${name.split(' ')[0]}'s command center`;
  }, [profile?.name, session?.name, session?.user?.firstName]);

  const welcomeSubtitle = useMemo(() => {
    const trust = profile?.metrics?.trustScore;
    const projects = data?.projectGigManagement?.summary?.activeProjects;
    const invites = data?.projectGigManagement?.invitations?.stats?.pending;
    if (trust != null && projects != null) {
      return `Trust score ${Number(trust).toFixed(1)} · ${projects} active engagements · ${invites ?? 0} invites awaiting.`;
    }
    return 'Manage every engagement, payout, and mentor relationship from one place.';
  }, [data?.projectGigManagement?.invitations?.stats?.pending, data?.projectGigManagement?.summary?.activeProjects, profile?.metrics?.trustScore]);

  const handleRefresh = (options = {}) => refresh({ force: options.force ?? true });

  return (
    <DashboardAccessGuard requiredRoles={ALLOWED_ROLES}>
      <DashboardLayout
        currentDashboard="user"
        title={welcomeHeadline}
        subtitle={welcomeSubtitle}
        description="End-to-end control over gigs, finance, trust, and mentoring."
        menuSections={MENU_SECTIONS}
        availableDashboards={AVAILABLE_DASHBOARDS}
        activeMenuItem="home-overview"
      >
        <div className="space-y-12">
          <DataStatus
            loading={loading}
            error={error}
            fromCache={fromCache}
            lastUpdated={lastUpdated}
            onRefresh={() => handleRefresh({ force: true })}
            statusLabel="Live production data"
          />

          <div className="rounded-4xl border border-slate-200 bg-white/90 p-8 shadow-soft">
            <UserDashboardQuickActions
              userId={userId}
              context={quickActionContext}
              onActionComplete={() => handleRefresh({ force: true })}
            />
          </div>

          <section id="home-overview" className="space-y-6">
            <div className="rounded-4xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-8 shadow-soft">
              <UserDashboardOverviewSection
                userId={userId}
                overview={overview}
                onOverviewUpdated={() => handleRefresh({ force: true })}
              />
            </div>
          </section>

          <section id="home-profile" className="space-y-6">
            <ProfileHubQuickPanel profileOverview={profile} profileHub={profileHub} />
            <div className="rounded-4xl border border-slate-200 bg-white/90 p-8 shadow-soft">
              <ProfileSettingsSection
                profile={profile}
                userId={userId}
                onRefresh={handleRefresh}
                session={session}
              />
            </div>
          </section>

          <section id="gig-management" className="space-y-6">
            <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-soft">
              <ProjectGigManagementContainer userId={userId} />
            </div>
          </section>

          <section id="escrow-management" className="space-y-6">
            <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-soft">
              <EscrowManagementSection
                data={escrowManagement}
                userId={userId}
                onRefresh={() => handleRefresh({ force: true })}
              />
            </div>
          </section>

          <section id="finance-management" className="space-y-6">
            <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-soft">
              <WalletManagementSection userId={userId} />
            </div>
            <div className="rounded-4xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-white p-8 shadow-soft">
              <FinanceControlTowerFeature userId={userId} />
            </div>
          </section>

          <section id="mentors-booked" className="space-y-6">
            <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-soft">
              <UserMentoringSection
                mentoring={mentoring}
                userId={userId}
                onRefresh={() => handleRefresh({ force: true })}
              />
            </div>
          </section>
        </div>
      </DashboardLayout>
    </DashboardAccessGuard>
  );
}

export default UserDashboardPage;
