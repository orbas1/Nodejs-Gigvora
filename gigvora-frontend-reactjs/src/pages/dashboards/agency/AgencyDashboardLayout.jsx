import PropTypes from 'prop-types';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import { AGENCY_MENU_SECTIONS, AGENCY_AVAILABLE_DASHBOARDS } from './menuConfig.js';

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
    role: workspace.role ?? 'Agency workspace',
    initials: initials || 'AG',
    status: workspace.status ?? 'Operational',
  };
}

export default function AgencyDashboardLayout({
  children,
  title = 'Agency control tower',
  subtitle = 'Orchestrate delivery, partnerships, and trust from a unified view.',
  description,
  menuSections = AGENCY_MENU_SECTIONS,
  activeMenuItem,
  workspace,
  adSurface = 'agency_dashboard',
}) {
  const profile = buildProfile(workspace);

  return (
    <DashboardLayout
      currentDashboard="agency"
      title={title}
      subtitle={subtitle}
      description={description}
      menuSections={menuSections}
      availableDashboards={AGENCY_AVAILABLE_DASHBOARDS}
      activeMenuItem={activeMenuItem}
      adSurface={adSurface}
      profile={profile}
    >
      <div className="px-4 pb-16 pt-8 sm:px-6 lg:px-12">{children}</div>
    </DashboardLayout>
  );
}

AgencyDashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  description: PropTypes.string,
  menuSections: PropTypes.array,
  activeMenuItem: PropTypes.string,
  workspace: PropTypes.shape({
    name: PropTypes.string,
    role: PropTypes.string,
    status: PropTypes.string,
  }),
  adSurface: PropTypes.string,
};

AgencyDashboardLayout.defaultProps = {
  title: 'Agency control tower',
  subtitle: 'Orchestrate delivery, partnerships, and trust from a unified view.',
  description: undefined,
  menuSections: AGENCY_MENU_SECTIONS,
  activeMenuItem: undefined,
  workspace: null,
  adSurface: 'agency_dashboard',
};
