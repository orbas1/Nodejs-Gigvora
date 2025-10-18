import { useEffect, useMemo } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import CreationStudioSection from '../../components/company/CreationStudioSection.jsx';
import { useSession } from '../../context/SessionContext.jsx';
import { useCreationStudio } from '../../hooks/useCreationStudio.js';
import { COMPANY_DASHBOARD_MENU_SECTIONS } from '../../constants/companyDashboardMenu.js';

const AVAILABLE_DASHBOARDS = ['company', 'headhunter', 'user', 'agency'];

function normaliseWorkspaceId(value) {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : undefined;
}

export default function CompanyCreationStudioPage() {
  const { session, isAuthenticated } = useSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const workspaceIdParam = searchParams.get('workspaceId');
  const selectedWorkspaceId = normaliseWorkspaceId(workspaceIdParam);

  const memberships = session?.memberships ?? [];
  const isCompanyMember = isAuthenticated && memberships.includes('company');

  const { data, loading, error, fromCache, lastUpdated, refresh } = useCreationStudio({
    workspaceId: selectedWorkspaceId,
    enabled: isAuthenticated && isCompanyMember,
  });

  const workspaceOptions = useMemo(() => data?.meta?.availableWorkspaces ?? [], [data?.meta?.availableWorkspaces]);
  const permissions = data?.permissions ?? { canManage: true };

  useEffect(() => {
    if (!selectedWorkspaceId && data?.meta?.selectedWorkspaceId) {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.set('workspaceId', `${data.meta.selectedWorkspaceId}`);
        return next;
      }, { replace: true });
    }
  }, [selectedWorkspaceId, data?.meta?.selectedWorkspaceId, setSearchParams]);

  const handleWorkspaceChange = (nextValue) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (nextValue && `${nextValue}`.length > 0) {
        next.set('workspaceId', `${nextValue}`);
      } else {
        next.delete('workspaceId');
      }
      return next;
    });
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirectTo: '/dashboard/company/creation-studio' }} />;
  }

  if (!isCompanyMember) {
    return (
      <DashboardLayout
        currentDashboard="company"
        title="Studio"
        subtitle="Create and manage assets"
        description="Keep jobs, gigs, pages, ads, and sessions organised with approvals and scheduling."
        menuSections={COMPANY_DASHBOARD_MENU_SECTIONS}
        availableDashboards={AVAILABLE_DASHBOARDS}
        activeMenuItem="creation-studio"
      >
        <AccessDeniedPanel
          availableDashboards={memberships.filter((membership) => membership !== 'company')}
          onNavigate={(dashboard) => navigate(`/dashboard/${dashboard}`)}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      currentDashboard="company"
      title="Studio"
      subtitle="Create and manage assets"
      description="Keep jobs, gigs, pages, ads, and sessions organised with approvals and scheduling."
      menuSections={COMPANY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      activeMenuItem="creation-studio"
    >
      <CreationStudioSection
        overview={data}
        workspaceOptions={workspaceOptions}
        workspaceId={selectedWorkspaceId ?? ''}
        onWorkspaceChange={handleWorkspaceChange}
        onRefresh={refresh}
        loading={loading}
        fromCache={fromCache}
        lastUpdated={lastUpdated}
        error={error}
        permissions={permissions}
      />
    </DashboardLayout>
  );
}
