import { useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { AVAILABLE_DASHBOARDS, MENU_GROUPS } from './freelancer/menuConfig.js';
import { DEFAULT_PROFILE } from './freelancer/sampleData.js';
import RoleGate from '../../components/access/RoleGate.jsx';
import useRoleAccess from '../../hooks/useRoleAccess.js';
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
  ProjectWorkspaceExcellenceSection,
  ReferencesSection,
  SupportSection,
  WorkspaceSettingsSection,
} from './freelancer/sections/index.js';

const SECTION_RENDERERS = {
  'profile-overview': ({ profile }) => <OverviewSection profile={profile ?? DEFAULT_PROFILE} />,
  'operations-hq': () => <OperationsHQSection />,
  'delivery-ops': () => <DeliveryOperationsSection />,
  planning: () => <PlanningSection />,
  'project-excellence': () => <ProjectWorkspaceExcellenceSection />,
  'project-lab': () => <ProjectLabSection />,
  'gig-studio': () => <GigStudioSection />,
  'gig-marketplace': () => <GigMarketplaceOperationsSection />,
  automation: () => <AutomationSection />,
  'finance-compliance': () => <FinanceComplianceSection />,
  'workspace-settings': () => <WorkspaceSettingsSection />,
  'profile-showcase': () => <ProfileShowcaseSection />,
  references: () => <ReferencesSection />,
  network: () => <NetworkSection />,
  'growth-partnerships': () => <GrowthPartnershipSection />,
  'quick-access': () => <OperationalQuickAccessSection />,
  support: () => <SupportSection />,
};

export default function FreelancerDashboardPage() {
  const [activeSection, setActiveSection] = useState('profile-overview');
  const { session } = useRoleAccess(['freelancer']);

  const menuSections = useMemo(() => MENU_GROUPS, []);
  const profile = useMemo(() => {
    if (!session) {
      return DEFAULT_PROFILE;
    }
    const name = session.name ?? DEFAULT_PROFILE.name;
    const initials = name
      .split(' ')
      .map((part) => part?.[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase() || DEFAULT_PROFILE.initials;

    return {
      ...DEFAULT_PROFILE,
      name,
      role: session.title ? `Freelance ${session.title}` : DEFAULT_PROFILE.role,
      initials,
      avatarUrl: session.avatarSeed
        ? `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(session.avatarSeed)}`
        : DEFAULT_PROFILE.avatarUrl,
    };
  }, [session]);

  const availableDashboards = useMemo(
    () => [
      { id: 'freelancer', label: 'Freelancer', href: '/dashboard/freelancer' },
      { id: 'freelancer-pipeline', label: 'Pipeline HQ', href: '/dashboard/freelancer/pipeline' },
      { id: 'company', label: 'Company', href: '/dashboard/company' },
      { id: 'headhunter', label: 'Headhunter', href: '/dashboard/headhunter' },
    ],
    [],
  );

  const renderSection = (SECTION_RENDERERS[activeSection] ?? SECTION_RENDERERS['profile-overview'])({
    profile,
  });

  return (
    <RoleGate allowedRoles={['freelancer']} featureName="Freelancer mission control">
      <DashboardLayout
        currentDashboard="freelancer"
        title="Freelancer mission control"
        subtitle="Operate your Gigvora business with enterprise-grade tooling"
        description="Switch between delivery, growth, brand, and governance with a single, purposeful cockpit."
        menuSections={menuSections}
        profile={profile}
        availableDashboards={availableDashboards.length ? availableDashboards : AVAILABLE_DASHBOARDS}
        activeMenuItem={activeSection}
        onMenuItemSelect={(itemId) => setActiveSection(itemId)}
      >
        <div className="mx-auto w-full max-w-7xl space-y-12 px-6 py-10">{renderSection}</div>
      </DashboardLayout>
    </RoleGate>
  );
}
