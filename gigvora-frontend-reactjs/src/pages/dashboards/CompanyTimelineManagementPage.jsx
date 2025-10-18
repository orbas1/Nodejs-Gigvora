import { useEffect, useMemo } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import TimelineManagementSection from '../../components/company/TimelineManagementSection.jsx';
import { useCompanyDashboard } from '../../hooks/useCompanyDashboard.js';
import { useSession } from '../../context/SessionContext.jsx';
import { COMPANY_DASHBOARD_MENU_SECTIONS } from '../../constants/companyDashboardMenu.js';

const LOOKBACK_OPTIONS = [30, 60, 90, 120];

export default function CompanyTimelineManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session, isAuthenticated } = useSession();

  const workspaceIdParam = searchParams.get('workspaceId');
  const workspaceSlugParam = searchParams.get('workspaceSlug');
  const lookbackParam = Number(searchParams.get('lookbackDays'));
  const lookbackDays = Number.isFinite(lookbackParam) ? lookbackParam : 30;

  const { data, loading, error, refresh, fromCache, lastUpdated } = useCompanyDashboard({
    workspaceId: workspaceIdParam ? Number(workspaceIdParam) : undefined,
    workspaceSlug: workspaceSlugParam ?? undefined,
    lookbackDays,
    enabled: isAuthenticated,
  });

  const memberships = session?.memberships ?? [];
  const isCompanyMember = memberships.includes('company');

  useEffect(() => {
    if (data?.meta?.selectedWorkspaceId && !workspaceIdParam) {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.set('workspaceId', `${data.meta.selectedWorkspaceId}`);
        return next;
      }, { replace: true });
    }
  }, [workspaceIdParam, data?.meta?.selectedWorkspaceId, setSearchParams]);

  const workspaceOptions = useMemo(() => data?.meta?.availableWorkspaces ?? [], [data?.meta]);
  const activeWorkspaceId = data?.meta?.selectedWorkspaceId ?? workspaceIdParam ?? data?.workspace?.id ?? null;

  const handleWorkspaceChange = (event) => {
    const value = event.target.value;
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) {
        next.set('workspaceId', value);
      } else {
        next.delete('workspaceId');
      }
      next.delete('workspaceSlug');
      return next;
    });
  };

  const handleLookbackChange = (event) => {
    const value = event.target.value;
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) {
        next.set('lookbackDays', value);
      } else {
        next.delete('lookbackDays');
      }
      return next;
    });
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirectTo: '/dashboard/company/timeline' }} />;
  }

  if (!isCompanyMember) {
    return (
      <DashboardLayout
        currentDashboard="company"
        title="Timeline"
        subtitle="Access required"
        description="Switch dashboards to continue."
        menuSections={COMPANY_DASHBOARD_MENU_SECTIONS}
        availableDashboards={['company', 'headhunter', 'user', 'agency']}
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
      title="Timeline"
      subtitle="Plan • Post • Measure"
      description="Run hiring announcements without clutter."
      menuSections={COMPANY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={['company', 'headhunter', 'user', 'agency']}
    >
      <div className="space-y-8">
        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="timeline-workspace-select">
              Workspace
            </label>
            <select
              id="timeline-workspace-select"
              value={activeWorkspaceId ?? ''}
              onChange={handleWorkspaceChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              <option value="">Select workspace</option>
              {workspaceOptions.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="timeline-lookback-select">
              Window
            </label>
            <select
              id="timeline-lookback-select"
              value={lookbackDays}
              onChange={handleLookbackChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              {LOOKBACK_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} days
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <DataStatus
              loading={loading}
              error={error}
              fromCache={fromCache}
              lastUpdated={lastUpdated}
              onRefresh={() => refresh({ force: true })}
              statusLabel="Timeline data"
            />
          </div>
        </div>

        <TimelineManagementSection
          workspaceId={activeWorkspaceId}
          lookbackDays={lookbackDays}
          data={data?.timelineManagement}
          onRefresh={refresh}
        />
      </div>
    </DashboardLayout>
  );
}
