import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import CompanyPagesManagementSection from '../../components/company/CompanyPagesManagementSection.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import { COMPANY_DASHBOARD_MENU_SECTIONS } from '../../constants/companyDashboardMenu.js';
import useCompanyDashboard from '../../hooks/useCompanyDashboard.js';
import { useSession } from '../../context/SessionContext.jsx';

const availableDashboards = ['company', 'headhunter', 'user', 'agency'];

export default function CompanyPagesManagementPage() {
  const { session, isAuthenticated } = useSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const workspaceIdParam = searchParams.get('workspaceId');
  const membershipsList = session?.memberships ?? [];
  const isCompanyMember = isAuthenticated && membershipsList.includes('company');

  const { data, loading, error, refresh } = useCompanyDashboard({
    workspaceId: workspaceIdParam,
    enabled: isAuthenticated && isCompanyMember,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (!isCompanyMember) {
      const fallback = session?.primaryDashboard ?? membershipsList.find((role) => role !== 'company');
      if (fallback) {
        navigate(`/dashboard/${fallback}`, { replace: true, state: { from: '/dashboard/company/pages' } });
      }
    }
  }, [isAuthenticated, isCompanyMember, navigate, session?.primaryDashboard, membershipsList]);

  const workspaceOptions = data?.meta?.availableWorkspaces ?? [];
  const companyWorkspaceId = useMemo(() => {
    const selected = data?.meta?.selectedWorkspaceId;
    const param = workspaceIdParam ? Number.parseInt(workspaceIdParam, 10) : null;
    const fallback = data?.workspace?.id ?? null;
    return selected ?? param ?? fallback ?? null;
  }, [data?.meta?.selectedWorkspaceId, data?.workspace?.id, workspaceIdParam]);

  useEffect(() => {
    if (!workspaceIdParam && data?.meta?.selectedWorkspaceId) {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.set('workspaceId', `${data.meta.selectedWorkspaceId}`);
        return next;
      }, { replace: true });
    }
  }, [workspaceIdParam, data?.meta?.selectedWorkspaceId, setSearchParams]);

  const handleWorkspaceChange = (event) => {
    const nextWorkspaceId = event.target.value;
    const next = new URLSearchParams(searchParams);
    if (nextWorkspaceId) {
      next.set('workspaceId', nextWorkspaceId);
    } else {
      next.delete('workspaceId');
    }
    setSearchParams(next);
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirectTo: '/dashboard/company/pages' }} />;
  }

  if (!isCompanyMember) {
    return (
      <DashboardLayout
        currentDashboard="company"
        title="Company pages studio"
        subtitle="Manage Gigvora destinations"
        description="Launch, edit, and govern public pages for your company workspace."
        menuSections={COMPANY_DASHBOARD_MENU_SECTIONS}
        availableDashboards={availableDashboards}
      >
        <AccessDeniedPanel
          availableDashboards={membershipsList.filter((membership) => membership !== 'company')}
          onNavigate={(dashboard) => navigate(`/dashboard/${dashboard}`)}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      currentDashboard="company"
      title="Company pages studio"
      subtitle="Manage Gigvora destinations"
      description="Create blueprinted pages, manage collaborators, and orchestrate approvals."
      menuSections={COMPANY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={availableDashboards}
      activeMenuItem="pages-studio"
    >
      <div className="space-y-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Workspace selection</h2>
            <p className="mt-1 text-sm text-slate-600">
              Switch between company workspaces to configure their public pages.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="pages-workspace">
              Workspace
            </label>
            <select
              id="pages-workspace"
              value={companyWorkspaceId ?? ''}
              onChange={handleWorkspaceChange}
              className="min-w-[200px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="">Select workspace</option>
              {workspaceOptions.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => refresh({ force: true })}
              className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
            >
              Refresh
            </button>
          </div>
        </div>

        <DataStatus
          loading={loading}
          error={error}
          empty={!companyWorkspaceId}
          emptyTitle="Select a workspace"
          emptyDescription="Choose a company workspace to manage its public pages."
        >
          {companyWorkspaceId ? (
            <CompanyPagesManagementSection workspaceId={companyWorkspaceId} />
          ) : null}
        </DataStatus>
      </div>
    </DashboardLayout>
  );
}
