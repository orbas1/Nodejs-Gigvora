import { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../DataStatus.jsx';
import AccessDeniedPanel from '../dashboard/AccessDeniedPanel.jsx';
import { deriveAdminAccess } from '../../utils/adminAccess.js';
import useAdminGovernanceMenu from '../../hooks/useAdminGovernanceMenu.js';

const DEFAULT_AVAILABLE_DASHBOARDS = ['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter'];

function renderAction(action, index) {
  if (!action) {
    return null;
  }

  const {
    label,
    onClick,
    variant = 'secondary',
    icon: Icon,
    disabled,
    title,
  } = action;

  const baseClass =
    'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

  const variantClass =
    variant === 'primary'
      ? 'bg-slate-900 text-white hover:bg-slate-700 focus-visible:ring-slate-900'
      : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 focus-visible:ring-slate-300';

  return (
    <button
      key={label || index}
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${baseClass} ${variantClass} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      <span>{label}</span>
    </button>
  );
}

export default function AdminGovernanceLayout({
  session,
  title,
  subtitle,
  description,
  menuConfig,
  sections,
  statusLabel,
  fromCache,
  statusChildren,
  lastUpdated,
  loading,
  error,
  onRefresh,
  headerActions,
  availableDashboards = DEFAULT_AVAILABLE_DASHBOARDS,
  onNavigate,
  currentDashboard = 'admin',
  children,
}) {
  const navigation = useAdminGovernanceMenu({ session, menuConfig, sections });
  const access = navigation.access ?? deriveAdminAccess(session);

  const handleMenuItemSelect = useCallback(
    (itemId, item) => {
      if (item?.href) {
        onNavigate?.(item.href);
        return;
      }
      const targetId = item?.sectionId ?? item?.id ?? itemId;
      if (!targetId || typeof document === 'undefined') {
        return;
      }
      const element = document.getElementById(targetId);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [onNavigate],
  );

  const layoutSections = useMemo(() => navigation.sections ?? [], [navigation.sections]);

  if (!access.hasAdminAccess) {
    return (
      <DashboardLayout
        currentDashboard={currentDashboard}
        title={title}
        subtitle={subtitle}
        description={description}
        menuSections={navigation.menuSections}
        sections={layoutSections}
        availableDashboards={availableDashboards}
        onMenuItemSelect={handleMenuItemSelect}
      >
        <AccessDeniedPanel availableDashboards={availableDashboards} onNavigate={onNavigate} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      currentDashboard={currentDashboard}
      title={title}
      subtitle={subtitle}
      description={description}
      menuSections={navigation.menuSections}
      sections={layoutSections}
      availableDashboards={availableDashboards}
      onMenuItemSelect={handleMenuItemSelect}
    >
      <div className="space-y-10">
        {Array.isArray(headerActions) && headerActions.length ? (
          <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <div className="text-sm text-slate-500">
              <p className="font-semibold text-slate-700">Governance tooling</p>
              <p>Use the shortcuts to export, audit, or jump into specialist consoles.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {headerActions.map((action, index) => renderAction(action, index))}
            </div>
          </div>
        ) : null}
        <DataStatus
          loading={loading}
          lastUpdated={lastUpdated}
          error={error}
          onRefresh={onRefresh}
          statusLabel={statusLabel}
          fromCache={fromCache}
        >
          {statusChildren}
        </DataStatus>
        <div className="space-y-16">{children}</div>
      </div>
    </DashboardLayout>
  );
}

AdminGovernanceLayout.propTypes = {
  session: PropTypes.object,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  description: PropTypes.string,
  menuConfig: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      items: PropTypes.array,
    }),
  ),
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
    }),
  ),
  statusLabel: PropTypes.string,
  fromCache: PropTypes.bool,
  statusChildren: PropTypes.node,
  lastUpdated: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string, PropTypes.number]),
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.shape({ message: PropTypes.string })]),
  onRefresh: PropTypes.func,
  headerActions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func,
      variant: PropTypes.oneOf(['primary', 'secondary']),
      icon: PropTypes.elementType,
      disabled: PropTypes.bool,
      title: PropTypes.string,
    }),
  ),
  availableDashboards: PropTypes.array,
  onNavigate: PropTypes.func,
  currentDashboard: PropTypes.string,
  children: PropTypes.node,
};

AdminGovernanceLayout.defaultProps = {
  session: null,
  subtitle: '',
  description: '',
  menuConfig: [],
  sections: undefined,
  statusLabel: 'Live data',
  fromCache: false,
  statusChildren: null,
  lastUpdated: undefined,
  loading: false,
  error: undefined,
  onRefresh: undefined,
  headerActions: undefined,
  availableDashboards: DEFAULT_AVAILABLE_DASHBOARDS,
  onNavigate: undefined,
  currentDashboard: 'admin',
  children: null,
};
