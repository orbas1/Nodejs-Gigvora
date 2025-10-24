import { useMemo } from 'react';
import { AcademicCapIcon, BanknotesIcon, BoltIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DashboardAccessGuard from '../../components/security/DashboardAccessGuard.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import ProfileHubQuickPanel from '../../components/profileHub/ProfileHubQuickPanel.jsx';
import UserDashboardOverviewSection from '../../components/userDashboard/UserDashboardOverviewSection.jsx';
import ProfileSettingsSection from '../../components/profileSettings/ProfileSettingsSection.jsx';
import EscrowManagementSection from '../../components/escrow/EscrowManagementSection.jsx';
import UserMentoringSection from '../../components/mentoring/user/UserMentoringSection.jsx';
import UserDashboardQuickActions from '../../components/dashboard/UserDashboardQuickActions.jsx';
import JobApplicationWorkspaceContainer from '../../components/jobApplications/JobApplicationWorkspaceContainer.jsx';
import UserInterviewsSection from '../../components/dashboard/UserInterviewsSection.jsx';
import UserCalendarSection from '../../components/calendar/UserCalendarSection.jsx';
import SupportDeskPanel from '../../components/support/SupportDeskPanel.jsx';
import UserProjectsWorkspace from './user/projects/UserProjectsWorkspace.jsx';
import UserProjectWorkspaceSection from '../../components/dashboard/client/UserProjectWorkspaceSection.jsx';
import UserGigWorkspaceSection from '../../components/dashboard/client/UserGigWorkspaceSection.jsx';
import UserOrdersSection from '../../components/dashboard/client/UserOrdersSection.jsx';
import UserLaunchpadJobsSection from '../../components/dashboard/client/UserLaunchpadJobsSection.jsx';
import UserVolunteerJobsSection from '../../components/dashboard/client/UserVolunteerJobsSection.jsx';
import UserSettingsSection from '../../components/dashboard/client/UserSettingsSection.jsx';
import UserSystemPreferencesSection from '../../components/dashboard/client/UserSystemPreferencesSection.jsx';
import UserInboxSection from '../../components/dashboard/client/UserInboxSection.jsx';
import UserWalletSection from '../../components/dashboard/client/UserWalletSection.jsx';
import UserHubSection from '../../components/dashboard/client/UserHubSection.jsx';
import UserMetricsSection from '../../components/dashboard/client/UserMetricsSection.jsx';
import useSession from '../../hooks/useSession.js';
import useCachedResource from '../../hooks/useCachedResource.js';
import { fetchUserDashboard } from '../../services/userDashboard.js';
import DashboardInsightsBand from '../../components/dashboard/shared/DashboardInsightsBand.jsx';

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
    id: 'client-operations',
    label: 'Operations',
    items: [
      {
        id: 'client-project-workspace',
        name: 'Project workspace',
        description: 'Provision projects, rituals, and risk controls.',
        sectionId: 'client-project-workspace',
      },
      {
        id: 'client-gig-workspace',
        name: 'Gig workspace',
        description: 'Orders, submissions, delivery, and reviews.',
        sectionId: 'client-gig-workspace',
      },
      {
        id: 'client-orders',
        name: 'Orders',
        description: 'Status changes, notes, and delivery history.',
        sectionId: 'user-orders',
      },
      {
        id: 'client-inbox',
        name: 'Inbox',
        description: 'Conversations, saved replies, and routing rules.',
        sectionId: 'client-inbox',
      },
      {
        id: 'client-wallet',
        name: 'Wallet',
        description: 'Treasury automation, ledgers, and payouts.',
        sectionId: 'client-wallet',
      },
    ],
  },
  {
    id: 'talent-programmes',
    label: 'Programmes',
    items: [
      {
        id: 'experience-launchpad-jobs',
        name: 'Launchpad jobs',
        description: 'Eligibility scoring, interview readiness, and cohort submissions.',
        sectionId: 'user-launchpad-jobs',
      },
      {
        id: 'volunteer-jobs',
        name: 'Volunteer jobs',
        description: 'Applications, responses, contracts, and spend tracking.',
        sectionId: 'user-volunteer-jobs',
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
    id: 'client-intelligence',
    label: 'Intelligence',
    items: [
      {
        id: 'client-insights-band',
        name: 'Cross-marketplace insights',
        description: 'Unified analytics across jobs, gigs, mentors, and treasury.',
        sectionId: 'cross-marketplace-insights',
      },
      {
        id: 'client-hub',
        name: 'Hub',
        description: 'Profile workspace, community moves, and brand assets.',
        sectionId: 'client-hub',
      },
      {
        id: 'client-metrics',
        name: 'Metrics',
        description: 'Delivery signals, health metrics, and activity.',
        sectionId: 'client-metrics',
      },
    ],
  },
  {
    id: 'client-settings',
    label: 'Settings',
    items: [
      {
        id: 'user-settings',
        name: 'Settings',
        description: 'Account controls, notifications, and AI concierge.',
        sectionId: 'user-settings',
      },
      {
        id: 'user-system-preferences',
        name: 'System preferences',
        description: 'Website themes, hero content, and social presence.',
        sectionId: 'user-system-preferences',
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

function cloneMenuSections() {
  return MENU_SECTIONS.map((section) => ({
    ...section,
    items: section.items.map((item) => ({ ...item })),
  }));
}

function toInteger(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return null;
  }
  return number;
}

function buildProfileName(profile, session) {
  if (!profile && !session) {
    return 'Client workspace';
  }

  const preferred =
    profile?.displayName ||
    profile?.fullName ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
    session?.user?.name ||
    session?.user?.fullName;

  return preferred || 'Client workspace';
}

export function buildUserDashboardMenuSections(data) {
  const summary = data?.summary ?? {};
  const jobMetrics = data?.jobApplicationsWorkspace?.metrics ?? {};
  const projectSummary = data?.projectGigManagement?.summary ?? {};
  const mentoringSummary = data?.mentoring?.summary ?? {};
  const calendarInsights = data?.insights?.calendar ?? {};

  const badges = new Map();

  const openJobs = toInteger(summary.openJobApplications ?? jobMetrics.open ?? jobMetrics.active);
  if (openJobs != null) {
    badges.set('pipeline-job-applications', openJobs);
  }

  const interviewsScheduled = toInteger(summary.interviewsScheduled ?? jobMetrics.interviewsScheduled);
  if (interviewsScheduled != null) {
    badges.set('pipeline-interviews', interviewsScheduled);
  }

  const activeProjects = toInteger(summary.activeProjects ?? projectSummary.activeProjects);
  if (activeProjects != null) {
    badges.set('client-project-workspace', activeProjects);
  }

  const openGigOrders = toInteger(summary.openGigOrders ?? projectSummary.openGigOrders);
  if (openGigOrders != null) {
    badges.set('client-gig-workspace', openGigOrders);
  }

  const mentorsBooked = toInteger(mentoringSummary.activeSessions ?? mentoringSummary.booked ?? summary.mentorsBooked);
  if (mentorsBooked != null) {
    badges.set('mentors-booked-section', mentorsBooked);
  }

  const calendarEvents = toInteger(calendarInsights?.upcomingEvents ?? summary.calendarEvents);
  if (calendarEvents != null) {
    badges.set('calendar-orchestrator-section', calendarEvents);
  }

  return cloneMenuSections().map((section) => ({
    ...section,
    items: section.items.map((item) => {
      const badgeValue = badges.get(item.id);
      if (badgeValue == null) {
        return item;
      }
      return { ...item, badge: badgeValue };
    }),
  }));
}

export function buildProfileCard(data, summary = {}, session = null) {
  const profile = data?.profile ?? {};
  const profileHub = data?.profileHub ?? {};
  const wallet = data?.finance ?? data?.wallet ?? {};
  const metrics = data?.metrics ?? {};

  const name = buildProfileName(profile, session);
  const title = profile?.title || profile?.headline || profileHub?.headline || 'Client operations hub';
  const avatarUrl =
    profile?.avatarUrl ||
    profile?.photoUrl ||
    profile?.imageUrl ||
    profileHub?.avatarUrl ||
    profileHub?.photoUrl ||
    null;

  const locationParts = [profile?.city || profileHub?.city, profile?.country || profileHub?.country]
    .filter(Boolean)
    .map((part) => String(part));
  const location = locationParts.join(', ') || profile?.location || profileHub?.location || null;

  const stats = [
    {
      label: 'Active projects',
      value: summary.activeProjects ?? data?.projectGigManagement?.summary?.activeProjects ?? metrics.projectsActive,
    },
    {
      label: 'Gig orders',
      value: summary.openGigOrders ?? data?.projectGigManagement?.summary?.openGigOrders ?? metrics.gigOrdersOpen,
    },
    {
      label: 'Wallet balance',
      value: wallet?.totalBalance ?? metrics.walletBalance,
      suffix: wallet?.primaryCurrency ?? wallet?.defaultCurrency ?? metrics.walletCurrency,
    },
  ]
    .filter((entry) => entry.value != null && entry.value !== '')
    .map((entry) => {
      const numberValue = Number(entry.value);
      const formatted = Number.isFinite(numberValue)
        ? numberValue.toLocaleString(undefined, { maximumFractionDigits: 1 })
        : String(entry.value);
      return entry.suffix ? { label: entry.label, value: formatted, suffix: entry.suffix } : { label: entry.label, value: formatted };
    });

  const badges = [];
  if (profile?.status) {
    badges.push({ label: profile.status });
  }
  if (profileHub?.availability) {
    badges.push({ label: profileHub.availability });
  }

  const card = {
    id: profile?.id ?? profile?.userId ?? session?.userId ?? session?.user?.id ?? 'user',
    name,
    title,
    company: profile?.company ?? profileHub?.company ?? profileHub?.organization ?? null,
    avatarUrl: avatarUrl ?? undefined,
    location: location || undefined,
    email: profile?.email ?? session?.user?.email ?? undefined,
    stats,
    badges,
  };

  if (!card.badges.length) {
    delete card.badges;
  }

  return card;
}

function resolveUserId(session) {
  if (!session) {
    return null;
  }

  const candidates = [session.userId, session.id, session.user?.id, session.user?.userId];
  for (const candidate of candidates) {
    const numeric = Number(candidate);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric;
    }
  }

  return null;
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

function parseNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return numeric;
}

function formatCount(value) {
  const numeric = parseNumber(value);
  if (numeric == null) {
    return '0';
  }
  if (Math.abs(numeric) >= 1000) {
    return new Intl.NumberFormat(undefined, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(numeric);
  }
  return numeric.toLocaleString();
}

function formatCurrency(value, currency = 'USD') {
  const numeric = parseNumber(value);
  if (numeric == null) {
    return `${currency} 0`;
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: Math.abs(numeric) >= 1000 ? 0 : 2,
    }).format(numeric);
  } catch (error) {
    return `${currency} ${numeric.toLocaleString()}`;
  }
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
  const communityManagement = data?.communityManagement ?? null;
  const websitePreferences = data?.websitePreferences ?? null;
  const launchpad = data?.launchpad ?? null;
  const volunteeringManagement = data?.volunteeringManagement ?? null;
  const notificationPreferences = data?.notifications?.preferences ?? null;
  const weeklyDigest = data?.insights?.weeklyDigest ?? null;

  const menuSectionsWithBadges = useMemo(() => buildUserDashboardMenuSections(data), [data]);

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

  const crossMarketplaceInsights = useMemo(() => {
    const summary = data?.summary ?? {};
    const jobMetrics = data?.jobApplicationsWorkspace?.metrics ?? {};
    const projectSummary = projectGigManagement?.summary ?? {};
    const mentoringSummary = mentoring?.summary ?? {};
    const walletTotals = finance?.wallets?.totals ?? {};

    const walletBalance =
      quickActionMetrics.walletBalance ??
      finance?.totalBalance ??
      walletTotals.balance ??
      summary.walletBalance ??
      null;

    const walletCurrency =
      quickActionMetrics.walletCurrency ??
      walletTotals.currency ??
      finance?.primaryCurrency ??
      finance?.defaultCurrency ??
      summary.walletCurrency ??
      'USD';

    const items = [];

    const activeApplications =
      parseNumber(
        jobMetrics.open ??
          jobMetrics.active ??
          summary.openJobApplications ??
          summary.jobApplicationsOpen ??
          jobApplicationsWorkspace?.applications?.length,
      );

    if (activeApplications != null) {
      const interviewsScheduled = parseNumber(
        jobMetrics.interviewsScheduled ?? summary.interviewsScheduled ?? summary.interviews ?? null,
      );

      items.push({
        id: 'insight-applications',
        icon: BriefcaseIcon,
        label: 'Active applications',
        value: formatCount(activeApplications),
        description: 'Roles in play across jobs & Launchpad.',
        trend:
          interviewsScheduled != null && interviewsScheduled >= 0
            ? {
                direction: interviewsScheduled > 0 ? 'increase' : 'neutral',
                label: `${formatCount(interviewsScheduled)} interviews queued`,
              }
            : undefined,
        iconBackgroundClassName: 'bg-sky-600/15 text-sky-700',
      });
    }

    const activeProjects = parseNumber(
      projectSummary.activeProjects ?? summary.activeProjects ?? projectGigManagement?.projects?.length,
    );

    if (activeProjects != null) {
      const openGigOrders = parseNumber(
        projectSummary.openGigOrders ?? summary.openGigOrders ?? projectGigManagement?.gigOrders?.length,
      );

      items.push({
        id: 'insight-projects',
        icon: BoltIcon,
        label: 'Live projects',
        value: formatCount(activeProjects),
        description: 'Delivery pods operating right now.',
        trend:
          openGigOrders != null
            ? { direction: 'neutral', label: `${formatCount(openGigOrders)} gig orders open` }
            : undefined,
        iconBackgroundClassName: 'bg-violet-600/15 text-violet-700',
      });
    }

    const mentorSessions = parseNumber(
      mentoringSummary.activeSessions ?? mentoringSummary.booked ?? mentoringSummary.current ?? mentoring?.sessions?.length,
    );

    if (mentorSessions != null) {
      const upcomingMentors = parseNumber(
        mentoringSummary.upcomingSessions ?? mentoringSummary.upcoming ?? mentoringSummary.scheduled ?? null,
      );

      items.push({
        id: 'insight-mentors',
        icon: AcademicCapIcon,
        label: 'Mentor sessions',
        value: formatCount(mentorSessions),
        description: 'Expert engagements this cycle.',
        trend:
          upcomingMentors != null
            ? { direction: 'increase', label: `${formatCount(upcomingMentors)} upcoming` }
            : undefined,
        iconBackgroundClassName: 'bg-indigo-600/15 text-indigo-700',
      });
    }

    if (walletBalance != null) {
      const walletChange = parseNumber(walletTotals.weeklyChange ?? walletTotals.delta ?? summary.walletChange ?? null);

      items.push({
        id: 'insight-wallet',
        icon: BanknotesIcon,
        label: 'Wallet balance',
        value: formatCurrency(walletBalance, walletCurrency),
        description: 'Treasury coverage across wallets.',
        trend:
          walletChange != null && walletChange !== 0
            ? {
                direction: walletChange > 0 ? 'increase' : 'decrease',
                label: `${walletChange > 0 ? '+' : '-'}${formatCurrency(Math.abs(walletChange), walletCurrency)} week`,
              }
            : undefined,
        iconBackgroundClassName: 'bg-emerald-600/15 text-emerald-700',
      });
    }

    return items;
  }, [
    data,
    finance,
    jobApplicationsWorkspace,
    mentoring,
    projectGigManagement,
    quickActionMetrics,
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
        menuSections={menuSectionsWithBadges}
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

          <section id="cross-marketplace-insights" className="space-y-6">
            <DashboardInsightsBand
              insights={crossMarketplaceInsights}
              loading={loading}
              onRefresh={refresh}
              subtitle="Unified telemetry spanning jobs, gigs, mentors, and treasury."
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

          <UserProjectWorkspaceSection
            userId={userId}
            loading={loading}
            error={error}
            lastUpdated={lastUpdated}
            fromCache={fromCache}
            onRefresh={refresh}
            session={session}
          >
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm sm:p-6">
              <UserProjectsWorkspace userId={userId} session={session} />
            </div>
          </UserProjectWorkspaceSection>

          <UserGigWorkspaceSection userId={userId} initialWorkspace={projectGigManagement} />

          <UserOrdersSection userId={userId} initialWorkspace={projectGigManagement} />

          <UserInboxSection userId={userId} />

          <section id="escrow-management" className="space-y-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-semibold text-slate-900">Escrow management</h2>
              <p className="text-sm text-slate-500">
                Track balances, releases, and dispute guardrails with production-ready controls.
              </p>
            </div>
            <EscrowManagementSection userId={userId} data={escrowManagement} onRefresh={refresh} />
          </section>

          <UserWalletSection userId={userId} currency={quickActionMetrics.walletCurrency} />

          <UserHubSection
            profileOverview={profile}
            profileHub={profileHub}
            mentoring={mentoring}
            community={communityManagement}
            websitePreferences={websitePreferences}
            loading={loading}
            error={error}
            lastUpdated={lastUpdated}
            fromCache={fromCache}
            onRefresh={refresh}
          />

          <UserLaunchpadJobsSection applications={launchpad?.applications ?? []} onRefresh={refresh} />

          <UserVolunteerJobsSection userId={userId} data={volunteeringManagement} onRefresh={refresh} />

          <UserMetricsSection
            metrics={data?.metrics ?? {}}
            quickMetrics={quickActionMetrics}
            activity={activity}
            currency={quickActionMetrics.walletCurrency}
            loading={loading}
            error={error}
            lastUpdated={lastUpdated}
            fromCache={fromCache}
            onRefresh={refresh}
          />

          <UserSettingsSection
            userId={userId}
            session={session}
            initialNotificationPreferences={notificationPreferences}
            weeklyDigest={weeklyDigest}
          />

          <UserSystemPreferencesSection
            userId={userId}
            preferences={websitePreferences}
            onUpdated={refresh}
          />

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
