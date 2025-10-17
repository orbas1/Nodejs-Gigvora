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

export default function FreelancerDashboardPage() {
  const { session } = useSession();

  const profile = useMemo(() => buildProfile(session), [session]);

  const heroTitle = 'Freelancer Mission Control';
  const heroSubtitle = 'Delivery, growth, mentorship, and rituals';
  const heroDescription =
    'Design a production-grade operating system across projects, gigs, interviews, mentorship bookings, and volunteering commitments with Gigvora.';

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
      </div>
    </DashboardLayout>
  );
}
