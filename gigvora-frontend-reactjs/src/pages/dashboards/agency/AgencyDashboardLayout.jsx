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
    </DashboardLayout>
  );
}
