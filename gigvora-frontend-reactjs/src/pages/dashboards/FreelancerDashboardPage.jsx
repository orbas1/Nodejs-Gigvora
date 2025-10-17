import { useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import { MENU_GROUPS, AVAILABLE_DASHBOARDS } from './freelancer/menuConfig.js';
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
  EscrowManagementSection,
  WorkspaceSettingsSection,
  ProfileShowcaseSection,
  ReferencesSection,
  NetworkSection,
  GrowthPartnershipSection,
  OperationalQuickAccessSection,
  SupportSection,
} from './freelancer/sections/index.js';

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
  'escrow-management': EscrowManagementSection,
  'workspace-settings': WorkspaceSettingsSection,
  'profile-showcase': ProfileShowcaseSection,
  references: ReferencesSection,
  network: NetworkSection,
  'growth-partnerships': GrowthPartnershipSection,
  'quick-access': OperationalQuickAccessSection,
  support: SupportSection,
};

export default function FreelancerDashboardPage() {
  const { session } = useSession();
  const [activeSection, setActiveSection] = useState('profile-overview');

  const menuSections = useMemo(() => MENU_GROUPS, []);
  const availableDashboards = useMemo(() => AVAILABLE_DASHBOARDS, []);

  const profile = useMemo(() => {
    const base = { ...DEFAULT_PROFILE };
    if (session?.name) {
      base.name = session.name;
    }
    if (session?.title) {
      base.role = session.title;
    } else if (session?.role) {
      base.role = session.role;
    }
    if (session?.avatarUrl) {
      base.avatarUrl = session.avatarUrl;
    }
    return base;
  }, [session]);

  const renderSection = () => {
    const Component = SECTION_COMPONENTS[activeSection] ?? OverviewSection;
    if (Component === OverviewSection) {
      return <OverviewSection profile={profile} />;
    }
    return <Component profile={profile} />;
  };

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title="Freelancer mission control"
      subtitle="Operations, commerce, and trust in one workspace"
      description="Navigate your pipeline, manage delivery, and automate financial operations across every engagement."
      menuSections={menuSections}
      availableDashboards={availableDashboards}
      profile={profile}
      activeMenuItem={activeSection}
      onMenuItemSelect={setActiveSection}
    >
      <div className="mx-auto w-full max-w-6xl space-y-12 px-6 py-10">{renderSection()}</div>
    </DashboardLayout>
  );
}
