import { Fragment, useCallback, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
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

export default function FreelancerDashboardPage() {
  const { session } = useSession();

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
      menuSections={menuSections}
      availableDashboards={availableDashboards}
      activeMenuItem={activeItem}
      onMenuItemSelect={handleMenuItemSelect}
    >
      <div className="mx-auto w-full max-w-6xl space-y-12 px-6 py-10">
        {orderedSections.map((section) => (
          <Fragment key={section.id}>{section.element}</Fragment>
        ))}
      </div>
    </DashboardLayout>
  );
}
