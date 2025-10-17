import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import { AGENCY_DASHBOARD_MENU_SECTIONS } from '../../constants/agencyDashboardMenu.js';
import OverviewSection from './agency/sections/OverviewSection.jsx';
import { useAgencyOverview } from '../../hooks/useAgencyOverview.js';

const sections = [
  {
    id: 'agency-overview',
    title: 'Home',
    description: 'Daily snapshot',
  },
];

const availableDashboards = ['agency', 'company', 'freelancer', 'user'];

function normalizeRoles(memberships = []) {
  return memberships.map((role) => `${role}`.toLowerCase());
}

export default function AgencyDashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { session, isAuthenticated } = useSession();

  const memberships = useMemo(() => normalizeRoles(session?.memberships ?? session?.roles ?? []), [session?.memberships, session?.roles]);
  const isAgencyMember = memberships.some((role) => ['agency', 'agency_admin', 'admin'].includes(role));
  const canManageOverview = memberships.some((role) => ['agency_admin', 'admin'].includes(role));

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (!isAgencyMember) {
      const fallback = session?.primaryDashboard || memberships.find((role) => role !== 'agency') || 'user';
      navigate(`/dashboard/${fallback}`, { replace: true });
    }
  }, [isAuthenticated, isAgencyMember, navigate, session?.primaryDashboard, memberships]);

  const workspaceIdParam = searchParams.get('workspaceId');
  const workspaceSlugParam = searchParams.get('workspaceSlug');

  const {
    data,
    loading,
    error,
    fromCache,
    lastUpdated,
    refresh,
    save,
    saving,
  } = useAgencyOverview({
    workspaceId: workspaceIdParam,
    workspaceSlug: workspaceSlugParam,
    enabled: isAuthenticated && isAgencyMember,
  });

  useEffect(() => {
    const selectedWorkspaceId = data?.meta?.selectedWorkspaceId;
    if (!workspaceIdParam && selectedWorkspaceId) {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.set('workspaceId', `${selectedWorkspaceId}`);
        next.delete('workspaceSlug');
        return next;
      }, { replace: true });
    }
  }, [data?.meta?.selectedWorkspaceId, setSearchParams, workspaceIdParam]);

  const workspaceOptions = data?.meta?.availableWorkspaces ?? [];
  const selectedWorkspaceId = workspaceIdParam || (data?.workspace?.id ? `${data.workspace.id}` : workspaceOptions[0]?.id ?? '');

  const handleWorkspaceChange = (event) => {
    const nextId = event.target.value;
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (nextId) {
        next.set('workspaceId', nextId);
        next.delete('workspaceSlug');
      } else {
        next.delete('workspaceId');
      }
      return next;
    }, { replace: true });
  };

  const overview = data?.overview ?? null;
  const workspace = data?.workspace ?? null;

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Agency"
      subtitle={workspace?.name || 'Home'}
      description="Daily snapshot"
      menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
      sections={sections}
      availableDashboards={availableDashboards}
      activeMenuItem="home"
      adSurface="agency_dashboard"
    >
      <div className="space-y-10">
        <OverviewSection
          overview={overview}
          workspace={workspace}
          loading={loading}
          error={error}
          onRefresh={refresh}
          fromCache={fromCache}
          lastUpdated={lastUpdated}
          onSave={save}
          saving={saving}
          canManage={canManageOverview}
          workspaceOptions={workspaceOptions}
          selectedWorkspaceId={selectedWorkspaceId}
          onWorkspaceChange={workspaceOptions.length > 1 ? handleWorkspaceChange : undefined}
          currentDate={data?.currentDate}
        />
      </div>
    </DashboardLayout>
  );
}
