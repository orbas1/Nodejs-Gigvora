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
import JobApplicationWorkspaceContainer from '../../components/jobApplications/JobApplicationWorkspaceContainer.jsx';
import UserInterviewsSection from '../../components/dashboard/UserInterviewsSection.jsx';
import UserCalendarSection from '../../components/calendar/UserCalendarSection.jsx';
import SupportDeskPanel from '../../components/support/SupportDeskPanel.jsx';
import UserProjectsWorkspace from './user/projects/UserProjectsWorkspace.jsx';
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
        description: 'Hero messaging, quick actions, and readiness.',
        sectionId: 'home-overview',
      },
      {
        id: 'home-profile',
        name: 'Profile',
        description: 'Identity, availability, and collaboration settings.',
        sectionId: 'home-profile',
      },
    ],
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    items: [
      {
        id: 'pipeline-job-applications',
        name: 'Job hub',
        description: 'Applications, saved roles, responses, and interviews.',
        sectionId: 'job-applications',
      },
      {
        id: 'pipeline-interviews',
        name: 'Interview operations',
        description: 'Schedulers, prep portals, and candidate care.',
        sectionId: 'interview-operations',
      },
    ],
  },
  {
    id: 'projects',
    label: 'Projects & gigs',
    items: [
      {
        id: 'project-automation-section',
        name: 'Project automation',
        description: 'Launch projects, auto-match talent, and manage invites.',
        sectionId: 'project-automation',
      },
      {
        id: 'gig-management-section',
        name: 'Gig workspaces',
        description: 'Orders, submissions, and delivery tracking.',
        sectionId: 'gig-management',
      },
    ],
  },
  {
    id: 'escrow-management',
    label: 'Escrow management',
    items: [
      {
        id: 'escrow-management-section',
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
        id: 'finance-management-section',
        name: 'Wallet & analytics',
        description: 'Wallets, funding sources, and finance insights.',
        sectionId: 'finance-management',
      },
    ],
  },
  {
    id: 'mentors-booked',
    label: 'Mentors booked',
    items: [
      {
        id: 'mentors-booked-section',
        name: 'Mentoring hub',
        description: 'Sessions, favourites, reviews, and packages.',
        sectionId: 'mentors-booked',
      },
    ],
  },
  {
    id: 'calendar-orchestrator',
    label: 'Calendar',
    items: [
      {
        id: 'calendar-orchestrator-section',
        name: 'Calendar & focus',
        description: 'Events, focus sessions, and integrations.',
        sectionId: 'calendar-orchestrator',
      },
    ],
  },
  {
    id: 'support-desk',
    label: 'Support & care',
    items: [
      {
        id: 'support-desk-section',
        name: 'Support desk',
        description: 'Escalations, disputes, and knowledge base.',
        sectionId: 'support-desk',
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

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value && typeof value === 'object') {
    return Object.values(value);
  }
  return [];
}

function scrollToSection(sectionId) {
  if (!sectionId) {
    return;
  }
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
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
  const projectGigManagement = data?.projectGigManagement ?? {};
  const escrowManagement = data?.escrowManagement ?? {};
  const finance = data?.finance ?? data?.wallet ?? {};
  const mentoring = data?.mentoring ?? {};
  const activity = normalizeArray(data?.activity?.items ?? data?.activity ?? []);
  const jobApplicationsWorkspace = data?.jobApplicationsWorkspace ?? null;
  const calendarInsights = data?.insights?.calendar ?? null;
  const supportDeskSnapshot = data?.insights?.supportDesk ?? null;

  const quickActionContext = useMemo(() => {
    const projects = normalizeArray(projectGigManagement.projects ?? projectGigManagement.workspaces);
    const gigOrders = normalizeArray(projectGigManagement.gigOrders ?? projectGigManagement.orders);
    const projectTemplates = normalizeArray(projectGigManagement.templates ?? projectGigManagement.projectTemplates);
    const escrowAccounts = normalizeArray(escrowManagement.accounts ?? escrowManagement.wallets);
    const walletAccounts = normalizeArray(
      finance.accounts ??
        finance.wallets?.accounts ??
        finance.wallets?.items ??
        finance.wallets,
    );
    const mentors = normalizeArray(mentoring.mentors ?? mentoring.availableMentors ?? mentoring.experts);
    const currencies = normalizeArray(
      finance.currencies ??
        finance.wallets?.currencies ??
        finance.supportedCurrencies ??
        [],
    );

    return {
      projects,
      gigOrders,
      projectTemplates,
      escrowAccounts,
      walletAccounts,
      mentors,
      currencies,
    };
  }, [projectGigManagement, escrowManagement, finance, mentoring]);

  const quickActionMetrics = useMemo(() => {
    const metrics = data?.metrics ?? {};
    const walletTotals = finance?.wallets?.totals ?? {};
    const projectsActive =
      metrics.projectsActive ?? projectGigManagement.summary?.activeProjects ?? quickActionContext.projects.length;
    const gigOrdersOpen =
      metrics.gigOrdersOpen ?? projectGigManagement.summary?.openGigOrders ?? quickActionContext.gigOrders.length;
    const escrowInFlight =
      metrics.escrowInFlight ?? escrowManagement.summary?.openMilestones ?? quickActionContext.escrowAccounts.length;
    const walletBalance = metrics.walletBalance ?? walletTotals.balance ?? finance.totalBalance;
    const walletCurrency =
      metrics.walletCurrency ?? walletTotals.currency ?? finance.primaryCurrency ?? finance.defaultCurrency ?? 'USD';

    return {
      projectsActive,
      gigOrdersOpen,
      escrowInFlight,
      walletBalance,
      walletCurrency,
    };
  }, [
    data?.metrics,
    finance.defaultCurrency,
    finance.primaryCurrency,
    finance.totalBalance,
    finance?.wallets?.totals,
    projectGigManagement.summary,
    escrowManagement.summary,
    quickActionContext.projects.length,
    quickActionContext.gigOrders.length,
    quickActionContext.escrowAccounts.length,
  ]);

  const handleMenuSelect = (item) => {
    if (!item?.sectionId) {
      return;
    }
    scrollToSection(item.sectionId);
  };

  return (
    <DashboardAccessGuard allowedRoles={ALLOWED_ROLES}>
      <DashboardLayout
        currentDashboard="user"
        title="Client command center"
        subtitle="Oversee gigs, escrow, finances, and expert support from a single workspace."
        description="Every surface below stays wired into live services so your operations remain production-ready."
        menuSections={MENU_SECTIONS}
        availableDashboards={AVAILABLE_DASHBOARDS}
        onMenuItemSelect={handleMenuSelect}
        adSurface="user_dashboard"
      >
        <div className="space-y-14 pb-16">
          <section id="home-overview" className="space-y-8">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-3xl font-semibold text-slate-900">Home overview</h2>
                <p className="text-sm text-slate-500">
                  Keep your personal brand ready for prospects and collaborators.
                </p>
              </div>
              <DataStatus
                loading={loading}
                error={error}
                lastUpdated={lastUpdated}
                fromCache={fromCache}
                onRefresh={refresh}
              />
            </header>
            <UserDashboardOverviewSection userId={userId} overview={overview} onOverviewUpdated={refresh} />
            <UserDashboardQuickActions
              userId={userId}
              context={quickActionContext}
              metrics={quickActionMetrics}
              activity={activity}
              onCompleted={refresh}
            />
          </section>

          <section id="home-profile" className="space-y-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-semibold text-slate-900">Profile readiness</h2>
              <p className="text-sm text-slate-500">
                Update your availability, storytelling, and collaboration preferences so stakeholders have everything they need.
              </p>
            </div>
            <ProfileHubQuickPanel profileOverview={profile} profileHub={profileHub} />
            <ProfileSettingsSection profile={profile} userId={userId} onRefresh={refresh} session={session} />
          </section>

          <section id="job-applications" className="space-y-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-semibold text-slate-900">Job applications</h2>
              <p className="text-sm text-slate-500">
                Stay on top of every application, favourite role, recruiter reply, and scheduled meeting.
              </p>
            </div>
            <JobApplicationWorkspaceContainer userId={userId} initialData={jobApplicationsWorkspace} />
          </section>

          <UserInterviewsSection userId={userId} initialWorkspace={jobApplicationsWorkspace} />

          <section id="project-automation" className="space-y-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-semibold text-slate-900">Project automation</h2>
              <p className="text-sm text-slate-500">
                Launch engagements, auto-match specialists, and coordinate invites without leaving the dashboard.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm sm:p-6">
              <UserProjectsWorkspace userId={userId} session={session} />
            </div>
          </section>

          <section id="gig-management" className="space-y-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-semibold text-slate-900">Gig management</h2>
              <p className="text-sm text-slate-500">
                Command fulfilment with full CRUD workflows for bids, orders, submissions, and reviews.
              </p>
            </div>
            <ProjectGigManagementContainer userId={userId} />
          </section>

          <section id="escrow-management" className="space-y-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-semibold text-slate-900">Escrow management</h2>
              <p className="text-sm text-slate-500">
                Track balances, releases, and dispute guardrails with production-ready controls.
              </p>
            </div>
            <EscrowManagementSection userId={userId} data={escrowManagement} onRefresh={refresh} />
          </section>

          <section id="finance-management" className="space-y-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-semibold text-slate-900">Finance management</h2>
              <p className="text-sm text-slate-500">
                Manage wallets, funding sources, analytics, and treasury automations confidently.
              </p>
            </div>
            <WalletManagementSection userId={userId} />
            <FinanceControlTowerFeature userId={userId} currency={quickActionMetrics.walletCurrency} />
          </section>

          <section id="mentors-booked" className="space-y-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-semibold text-slate-900">Mentors booked</h2>
              <p className="text-sm text-slate-500">
                Collaborate with your expert bench, manage packages, and capture post-session insights.
              </p>
            </div>
            <UserMentoringSection userId={userId} mentoring={mentoring} onRefresh={refresh} />
          </section>

          <section id="calendar-orchestrator" className="space-y-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-semibold text-slate-900">Calendar & focus</h2>
              <p className="text-sm text-slate-500">
                Sync interviews, focus blocks, and rituals with live integrations and automation-ready preferences.
              </p>
            </div>
            <UserCalendarSection userId={userId} insights={calendarInsights} canManage={Boolean(session)} />
          </section>

          <section id="support-desk" className="space-y-6">
            <SupportDeskPanel userId={userId} initialSnapshot={supportDeskSnapshot} />
          </section>
        </div>
      </DashboardLayout>
    </DashboardAccessGuard>
  );
}

export default UserDashboardPage;
