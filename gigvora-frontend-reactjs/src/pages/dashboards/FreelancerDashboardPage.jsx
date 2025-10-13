import { useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { AVAILABLE_DASHBOARDS, MENU_GROUPS } from './freelancer/menuConfig.js';
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
  ProjectWorkspaceExcellenceSection,
  ReferencesSection,
  SupportSection,
  WorkspaceSettingsSection,
} from './freelancer/sections/index.js';

const SECTION_RENDERERS = {
  'profile-overview': () => <OverviewSection profile={DEFAULT_PROFILE} />,
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

  const menuSections = useMemo(() => MENU_GROUPS, []);
  const renderSection = SECTION_RENDERERS[activeSection] ?? SECTION_RENDERERS['profile-overview'];

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title="Freelancer mission control"
      subtitle="Operate your Gigvora business with enterprise-grade tooling"
      description="Switch between delivery, growth, brand, and governance with a single, purposeful cockpit."
      menuSections={menuSections}
      profile={DEFAULT_PROFILE}
      availableDashboards={AVAILABLE_DASHBOARDS}
      activeMenuItem={activeSection}
      onMenuItemSelect={(itemId) => setActiveSection(itemId)}
    >
      <div className="mx-auto w-full max-w-7xl space-y-12 px-6 py-10">{renderSection()}</div>
    </DashboardLayout>
  );
}
