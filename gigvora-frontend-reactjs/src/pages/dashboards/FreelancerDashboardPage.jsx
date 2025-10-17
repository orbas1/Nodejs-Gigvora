import { Fragment, useCallback, useMemo, useState } from 'react';
import { useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import {
  MENU_GROUPS,
  AVAILABLE_DASHBOARDS,
} from './freelancer/menuConfig.js';
import { DEFAULT_PROFILE } from './freelancer/sampleData.js';
import {
  OverviewSection,
  OperationsHQSection,
  DeliveryOperationsSection,
  TaskManagementSection,
  PlanningSection,
  ProjectWorkspaceExcellenceSection,
  ProjectLabSection,
  GigStudioSection,
  GigMarketplaceOperationsSection,
  AutomationSection,
  FinanceComplianceSection,
  GrowthPartnershipSection,
  NetworkSection,
  ProfileShowcaseSection,
  ReferencesSection,
  OperationalQuickAccessSection,
  WorkspaceSettingsSection,
  SupportSection,
} from './freelancer/sections/index.js';

function buildProfile(session) {
  if (!session) {
    return DEFAULT_PROFILE;
  }
  const derivedName = session.name ?? [session.firstName, session.lastName].filter(Boolean).join(' ').trim();
  const displayName = derivedName || session.email || DEFAULT_PROFILE.name;
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const avatarSeed = session.avatarSeed ?? displayName;
  const avatarUrl = session.avatarUrl ?? `https://avatar.vercel.sh/${encodeURIComponent(avatarSeed)}.svg?text=${initials}`;

  return {
    ...DEFAULT_PROFILE,
    name: displayName,
    role: session.title ?? DEFAULT_PROFILE.role,
    avatarUrl,
    badges: DEFAULT_PROFILE.badges,
  };
}
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import IdentityVerificationSection from './freelancer/sections/identity/IdentityVerificationSection.jsx';
import { ReviewManagementSection } from './freelancer/sections/index.js';
import { MENU_GROUPS, AVAILABLE_DASHBOARDS } from './freelancer/menuConfig.js';
import { DEFAULT_PROFILE } from './freelancer/sampleData.js';
import {
  AutomationSection,
  DeliveryOperationsSection,
  FinanceComplianceSection,
  GigMarketplaceOperationsSection,
  GigStudioSection,
  GrowthPartnershipSection,
  NetworkSection,
  OperationalQuickAccessSection,
  OperationsHQSection,
  OverviewSection,
  PlanningSection,
  ProfileShowcaseSection,
  ProjectLabSection,
  ProjectManagementSection,
  ProjectWorkspaceExcellenceSection,
  ReferencesSection,
  SupportSection,
  TaskManagementSection,
  WorkspaceSettingsSection,
} from './freelancer/sections/index.js';

function deriveFreelancerId(session) {
  if (!session || typeof session !== 'object') {
    return null;
  }

  const candidates = [
    session.freelancerId,
    session.profile?.freelancerId,
    session.profileId,
    session.primaryProfileId,
    session.userId,
    session.id,
  ];

  for (const candidate of candidates) {
    if (candidate == null) {
      continue;
    }
    const numeric = Number(candidate);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric;
    }
  }

  return null;
}

function buildProfileCard(session) {
  if (!session || typeof session !== 'object') {
    return DEFAULT_PROFILE;
  }

  const base = { ...DEFAULT_PROFILE };
  const fallbackName = [session.firstName, session.lastName].filter(Boolean).join(' ').trim();
  const name = session.name?.trim() || fallbackName || base.name;
  const headline = session.role || session.title || session.headline || base.role;
  const avatarUrl =
    session.avatarUrl || session.photoUrl || session.imageUrl || session.pictureUrl || base.avatarUrl;
  const initials =
    session.initials ||
    (name
      ? name
          .split(/\s+/)
          .filter(Boolean)
          .map((part) => part[0]?.toUpperCase())
          .join('')
          .slice(0, 2)
      : base.initials);

  return {
    ...base,
    name,
    role: headline,
    avatarUrl,
    initials: initials || base.initials,
  };
}
  TimelineManagementSection,
  WorkspaceSettingsSection,
} from './freelancer/sections/index.js';
import DisputeManagementSection from './freelancer/sections/DisputeManagementSection.jsx';

const HERO_METRICS = [
  { id: 'matches', label: 'New matches', value: 8, trend: '+2 this week' },
  { id: 'applications', label: 'Active applications', value: 5, trend: '2 awaiting review' },
  { id: 'saved', label: 'Saved gigs', value: 14, trend: 'Keep refining your preferences' },
];

const HERO_PIPELINE = [
  { id: 'discovery', title: 'Discovery call', description: 'Schedule time with the client success partner to confirm scope.' },
  { id: 'proposal', title: 'Proposal sent', description: 'Tailor your pricing pack and highlight relevant case studies.' },
  { id: 'interview', title: 'Interview', description: 'Prepare a short demo of your recent work to stand out.' },
];

const HERO_RESOURCES = [
  {
    id: 'profile',
    title: 'Refresh your profile',
    copy: 'Fine tune your expertise tags and headline so matching stays accurate.',
    to: '/profile/me',
  },
  {
    id: 'launchpad',
    title: 'Browse Launchpad gigs',
    copy: 'Explore curated, fast-moving projects looking for immediate contributors.',
    to: '/experience-launchpad',
  },
  {
    id: 'community',
    title: 'Join a guild session',
    copy: 'Share feedback and learn from other freelancers in the community.',
    to: '/groups',
  },
];

const SECTION_COMPONENTS = {
  'profile-overview': OverviewSection,
  'operations-hq': OperationsHQSection,
  'delivery-ops': DeliveryOperationsSection,
  'task-management': TaskManagementSection,
  planning: PlanningSection,
  'project-excellence': ProjectWorkspaceExcellenceSection,
  'project-lab': ProjectLabSection,
  'gig-studio': GigStudioSection,
  'gig-marketplace': GigMarketplaceOperationsSection,
  automation: AutomationSection,
  'finance-compliance': FinanceComplianceSection,
  'workspace-settings': WorkspaceSettingsSection,
  'profile-showcase': ProfileShowcaseSection,
  references: ReferencesSection,
  'timeline-management': TimelineManagementSection,
  network: NetworkSection,
  'growth-partnerships': GrowthPartnershipSection,
  'quick-access': OperationalQuickAccessSection,
  support: SupportSection,
};

function buildProfileCard(session) {
  if (!session) {
    return DEFAULT_PROFILE;
  }

  const resolvedName =
    session.name ||
    [session.firstName, session.lastName].filter(Boolean).join(' ').trim() ||
    session.email ||
    DEFAULT_PROFILE.name;

  const initials = resolvedName
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return {
    ...DEFAULT_PROFILE,
    name: resolvedName,
    role: session.title || session.userType || DEFAULT_PROFILE.role,
    initials: initials || DEFAULT_PROFILE.initials,
    avatarUrl: session.avatarUrl || DEFAULT_PROFILE.avatarUrl,
  };
}

export default function FreelancerDashboardPage() {
  const { session } = useSession();

  const profile = useMemo(() => buildProfile(session), [session]);

  const heroTitle = 'Freelancer Mission Control';
  const heroSubtitle = 'Delivery, growth, mentorship, and rituals';
  const heroDescription =
    'Design a production-grade operating system across projects, gigs, interviews, mentorship bookings, and volunteering commitments with Gigvora.';
  const menuSections = useMemo(() => MENU_GROUPS, []);
  const availableDashboards = useMemo(() => AVAILABLE_DASHBOARDS, []);
  const profileCard = useMemo(() => buildProfileCard(session), [session]);
  const freelancerId = useMemo(() => deriveFreelancerId(session), [session]);
  const [activeItem, setActiveItem] = useState('profile-overview');

  const handleMenuItemSelect = useCallback((itemId, item) => {
    setActiveItem(itemId);
    const targetId = item?.sectionId || item?.targetId || itemId;
    if (targetId && typeof document !== 'undefined') {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, []);

  const orderedSections = useMemo(
    () => [
      { id: 'profile-overview', element: <OverviewSection profile={profileCard} /> },
      { id: 'operations-hq', element: <OperationsHQSection /> },
      { id: 'project-management', element: <ProjectManagementSection freelancerId={freelancerId} /> },
      { id: 'delivery-ops', element: <DeliveryOperationsSection freelancerId={freelancerId} /> },
      { id: 'task-management', element: <TaskManagementSection /> },
      { id: 'planning', element: <PlanningSection /> },
      { id: 'project-excellence', element: <ProjectWorkspaceExcellenceSection /> },
      { id: 'project-lab', element: <ProjectLabSection /> },
      { id: 'gig-studio', element: <GigStudioSection /> },
      { id: 'gig-marketplace', element: <GigMarketplaceOperationsSection /> },
      { id: 'automation', element: <AutomationSection /> },
      { id: 'finance-compliance', element: <FinanceComplianceSection /> },
      { id: 'workspace-settings', element: <WorkspaceSettingsSection /> },
      { id: 'profile-showcase', element: <ProfileShowcaseSection /> },
      { id: 'references', element: <ReferencesSection /> },
      { id: 'network', element: <NetworkSection /> },
      { id: 'growth-partnerships', element: <GrowthPartnershipSection /> },
      { id: 'quick-access', element: <OperationalQuickAccessSection /> },
      { id: 'support', element: <SupportSection /> },
    ],
    [freelancerId, profileCard],
  );

  const heroTitle = 'Freelancer mission control';
  const heroSubtitle = 'Delivery, client success, and growth in one cockpit';
  const heroDescription =
    'Orchestrate project workspaces, automate gig delivery, and activate revenue programs with enterprise-grade tooling built for independent experts.';

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title={heroTitle}
      subtitle={heroSubtitle}
      description={heroDescription}
      menuSections={MENU_GROUPS}
      availableDashboards={AVAILABLE_DASHBOARDS}
    >
      <div className="space-y-12">
        <OverviewSection profile={profile} />
        <OperationsHQSection />
        <DeliveryOperationsSection />
        <TaskManagementSection />
        <PlanningSection />
        <ProjectWorkspaceExcellenceSection />
        <ProjectLabSection />
        <GigStudioSection />
        <GigMarketplaceOperationsSection />
        <AutomationSection />
        <FinanceComplianceSection />
        <GrowthPartnershipSection />
        <NetworkSection />
        <ProfileShowcaseSection />
        <ReferencesSection />
        <OperationalQuickAccessSection />
        <WorkspaceSettingsSection />
        <SupportSection />
      menuSections={menuSections}
      availableDashboards={availableDashboards}
      activeMenuItem={activeItem}
      onMenuItemSelect={handleMenuItemSelect}
    >
      <div className="mx-auto w-full max-w-6xl space-y-12 px-6 py-10">
        {orderedSections.map((section) => (
          <Fragment key={section.id}>{section.element}</Fragment>
        ))}
  const heroName = useMemo(() => {
    if (!session) {
      return 'Freelancer';
    }
    return session.name || session.firstName || session.email || 'Freelancer';
  }, [session]);

  const menuSections = useMemo(() => MENU_GROUPS, []);
  const orderedSectionIds = useMemo(() => {
    const fromMenu = menuSections.flatMap((group) =>
      Array.isArray(group.items) ? group.items.map((item) => item.id).filter(Boolean) : [],
    );
    const unique = [];
    fromMenu.forEach((id) => {
      if (SECTION_COMPONENTS[id] && !unique.includes(id)) {
        unique.push(id);
      }
    });
    Object.keys(SECTION_COMPONENTS).forEach((id) => {
      if (!unique.includes(id)) {
        unique.push(id);
      }
    });
    return unique;
  }, [menuSections]);

  const profileCard = useMemo(() => buildProfileCard(session), [session]);

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title="Freelancer mission control"
      subtitle="Enterprise-ready independent talent workspace"
      description="Coordinate delivery, growth, reputation, and analytics rituals without leaving your Gigvora cockpit."
      menuSections={menuSections}
      availableDashboards={AVAILABLE_DASHBOARDS}
    >
      <div className="mx-auto w-full max-w-6xl space-y-12 px-6 py-10">
        <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft">
          <header className="flex flex-col gap-4 border-b border-slate-200 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Welcome back</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">{heroName}</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-600">
                Keep momentum going by following the next actions in your pipeline, capturing delivery signals, and sharing
                updates with the Gigvora team.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {HERO_METRICS.map((metric) => (
                <div
                  key={metric.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-blue-200"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</p>
                  <p className="mt-2 text-xs text-slate-500">{metric.trend}</p>
                </div>
              ))}
            </div>
          </header>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-8">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-slate-900">Pipeline focus</h2>
                  <Link
                    to="/dashboard/freelancer/pipeline"
                    className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                  >
                    View detailed pipeline
                  </Link>
                </div>
                <ol className="mt-6 space-y-4">
                  {HERO_PIPELINE.map((step, index) => (
                    <li key={step.id} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                        <p className="text-xs text-slate-500">{step.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-8">
                <h2 className="text-xl font-semibold text-slate-900">Quick wins</h2>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                    <p className="text-sm text-slate-600">
                      Keep an eye on new invites—responding within the first hour improves conversion by 30%.
                    </p>
                  </li>
                  <li className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <span className="mt-0.5 h-2 w-2 rounded-full bg-sky-500" aria-hidden="true" />
                    <p className="text-sm text-slate-600">Upload a short video introduction to strengthen your applications.</p>
                  </li>
                  <li className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <span className="mt-0.5 h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
                    <p className="text-sm text-slate-600">Share updates with your talent partner weekly so we can advocate for you.</p>
                  </li>
                </ul>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <h2 className="text-lg font-semibold text-slate-900">Recommended resources</h2>
                <ul className="mt-4 space-y-3">
                  {HERO_RESOURCES.map((resource) => (
                    <li key={resource.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                      <p className="text-sm font-semibold text-slate-900">{resource.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{resource.copy}</p>
                      <Link
                        to={resource.to}
                        className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                      >
                        Explore
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6 shadow-soft">
                <h2 className="text-lg font-semibold text-slate-900">Need help?</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Your client success partner can walk through opportunities, feedback, and growth plans.
                </p>
                <Link
                  to="/inbox"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
                >
                  Send a message
                </Link>
              </div>
            </aside>
          </div>
        </section>

        <div className="mt-16 -mx-4 sm:-mx-6 lg:-mx-8">
          <IdentityVerificationSection />
        <section className="mt-16">
          <ReviewManagementSection />
        </section>
        {orderedSectionIds.map((sectionId) => {
          const SectionComponent = SECTION_COMPONENTS[sectionId];
          if (!SectionComponent) {
            return null;
          }

          if (sectionId === 'profile-overview') {
            return <SectionComponent key={sectionId} profile={profileCard} />;
          }

          return <SectionComponent key={sectionId} />;
        })}
        <div className="mt-12">
          <DisputeManagementSection />
        </div>
      </div>
    </DashboardLayout>
  );
}
