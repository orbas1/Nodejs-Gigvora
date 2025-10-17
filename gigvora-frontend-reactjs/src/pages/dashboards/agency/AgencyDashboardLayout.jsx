import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import { AGENCY_MENU_SECTIONS, AGENCY_AVAILABLE_DASHBOARDS } from './menuConfig.js';

export default function AgencyDashboardLayout({
  children,
  activeItem = 'overview',
  title = 'Agency',
  subtitle = 'Run every engagement in one place.',
  description = '',
  onMenuItemSelect,
  adSurface = 'agency_dashboard',
}) {
import { AGENCY_DASHBOARD_MENU } from '../../../constants/agencyDashboardMenu.js';

function buildProfile(workspace) {
  if (!workspace) {
    return null;
  }
  const name = workspace.name ?? 'Agency workspace';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return {
    name,
    role: 'Agency workspace',
    initials: initials || 'AG',
    status: 'Operational',
  };
}

export default function AgencyDashboardLayout({
  children,
  title = 'Agency control tower',
  subtitle = 'Orchestrate delivery, partnerships, and trust from a unified view.',
  description,
  menuSections = AGENCY_DASHBOARD_MENU,
  activeMenuItem,
  workspace,
}) {
  const profile = buildProfile(workspace);

  return (
    <DashboardLayout
      currentDashboard="agency"
      title={title}
      subtitle={subtitle}
      description={description}
      menuSections={AGENCY_MENU_SECTIONS}
      availableDashboards={AGENCY_AVAILABLE_DASHBOARDS}
      activeMenuItem={activeItem}
      onMenuItemSelect={onMenuItemSelect}
      adSurface={adSurface}
    >
      {children}
      menuSections={menuSections}
      activeMenuItem={activeMenuItem}
      availableDashboards={['agency', 'company', 'freelancer', 'launchpad']}
      profile={profile}
    >
      <div className="px-4 pb-16 pt-8 sm:px-6 lg:px-12">{children}</div>
    </DashboardLayout>
  );
}
