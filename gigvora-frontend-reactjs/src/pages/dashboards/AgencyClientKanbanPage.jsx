import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import useSession from '../../hooks/useSession.js';
import useAgencyClientKanban from '../../hooks/useAgencyClientKanban.js';
import ClientKanbanBoard from '../../components/agency/clientKanban/ClientKanbanBoard.jsx';
import { AGENCY_DASHBOARD_MENU_SECTIONS } from '../../constants/agencyDashboardMenu.js';
import { deriveAgencyAccess } from '../../utils/agencyAccess.js';

const AVAILABLE_DASHBOARDS = ['agency', 'company', 'freelancer', 'user', 'headhunter'];

export default function AgencyClientKanbanPage() {
  const { session, isAuthenticated } = useSession();
  const { hasAgencyAccess } = useMemo(() => deriveAgencyAccess(session), [session]);
  const [searchParams, setSearchParams] = useSearchParams();
  const workspaceParam = searchParams.get('workspaceId');
  const workspaceId = useMemo(() => {
    if (!workspaceParam || !Number.isFinite(Number.parseInt(workspaceParam, 10))) {
      return null;
    }
    return Number.parseInt(workspaceParam, 10);
  }, [workspaceParam]);

  const { data, loading, error, actions } = useAgencyClientKanban({
    workspaceId,
    enabled: isAuthenticated && hasAgencyAccess,
  });

  const handleWorkspaceChange = (event) => {
    const value = event.target.value;
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set('workspaceId', value);
    } else {
      next.delete('workspaceId');
    }
    setSearchParams(next, { replace: true });
  };

  const workspaceOptions = useMemo(() => {
    const memberships = Array.isArray(session?.memberships) ? session.memberships : [];
    const workspaces = memberships
      .map((membership) => {
        if (membership && typeof membership === 'object') {
          return {
            id: membership.id ?? membership.workspaceId ?? null,
            label: membership.name ?? membership.label ?? membership.slug ?? 'Workspace',
          };
        }
        return null;
      })
      .filter((item) => item?.id);
    return workspaces;
  }, [session?.memberships]);

  if (!isAuthenticated) {
    return (
      <DashboardLayout
        currentDashboard="agency"
        title="Client Kanban"
        subtitle="Run delivery in real time."
        description={null}
        menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
        availableDashboards={AVAILABLE_DASHBOARDS}
        activeMenuItem="agency-client-kanban"
      >
        <AccessDeniedPanel role="agency" availableDashboards={AVAILABLE_DASHBOARDS.filter((item) => item !== 'agency')} />
      </DashboardLayout>
    );
  }

  if (!hasAgencyAccess) {
    return (
      <DashboardLayout
        currentDashboard="agency"
        title="Client Kanban"
        subtitle="Run delivery in real time."
        description={null}
        menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
        availableDashboards={AVAILABLE_DASHBOARDS}
        activeMenuItem="agency-client-kanban"
      >
        <AccessDeniedPanel
          role="agency"
          availableDashboards={AVAILABLE_DASHBOARDS.filter((item) => item !== 'agency')}
          reason="Agency workspace membership required"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Client Kanban"
      subtitle="Run delivery in real time."
      description={null}
      menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      activeMenuItem="agency-client-kanban"
    >
      {workspaceOptions.length ? (
        <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <label className="text-xs font-semibold text-slate-500" htmlFor="workspace-select">
            Workspace
          </label>
          <select
            id="workspace-select"
            value={workspaceId ?? ''}
            onChange={handleWorkspaceChange}
            className="min-w-[200px] rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <option value="">Primary agency workspace</option>
            {workspaceOptions.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <ClientKanbanBoard data={data} loading={loading} error={error} actions={actions} />
    </DashboardLayout>
  );
}

