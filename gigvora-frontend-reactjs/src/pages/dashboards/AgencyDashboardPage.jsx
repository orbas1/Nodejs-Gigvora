import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import useAgencyWorkforceDashboard from '../../hooks/useAgencyWorkforceDashboard.js';
import AgencyWorkforceDashboard from '../../components/agency/workforce/AgencyWorkforceDashboard.jsx';
import { AGENCY_DASHBOARD_MENU_SECTIONS } from '../../constants/agencyDashboardMenu.js';
import {
  createAvailabilityEntry,
  createGigDelegation,
  createPayDelegation,
  createProjectDelegation,
  createWorkforceMember,
  deleteAvailabilityEntry,
  deleteCapacitySnapshot,
  deleteGigDelegation,
  deletePayDelegation,
  deleteProjectDelegation,
  deleteWorkforceMember,
  recordCapacitySnapshot,
  updateAvailabilityEntry,
  updateCapacitySnapshot,
  updateGigDelegation,
  updatePayDelegation,
  updateProjectDelegation,
  updateWorkforceMember,
} from '../../services/agencyWorkforce.js';

const availableDashboards = ['agency', 'company', 'freelancer', 'user'];

function parseWorkspaceId(value) {
  if (!value) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

export default function AgencyDashboardPage() {
  const { session } = useSession();
  const [searchParams] = useSearchParams();
  const workspaceIdParam = searchParams.get('workspaceId');
  const workspaceId = parseWorkspaceId(workspaceIdParam);

  const { data, loading, error, summaryCards, refresh } = useAgencyWorkforceDashboard({ workspaceId });

  const roles = session?.memberships ?? session?.roles ?? [];
  const canEdit = useMemo(() => {
    return roles.some((role) => {
      const normalized = `${role}`.toLowerCase();
      return normalized === 'agency_admin' || normalized === 'admin' || normalized === 'agency';
    });
  }, [roles]);

  const actions = useMemo(() => ({
    createMember: async (payload) => {
      await createWorkforceMember(payload);
      await refresh({ force: true });
    },
    updateMember: async (memberId, payload) => {
      await updateWorkforceMember(memberId, payload);
      await refresh({ force: true });
    },
    deleteMember: async (memberId, params) => {
      await deleteWorkforceMember(memberId, params);
      await refresh({ force: true });
    },
    createPayDelegation: async (payload) => {
      await createPayDelegation(payload);
      await refresh({ force: true });
    },
    updatePayDelegation: async (delegationId, payload) => {
      await updatePayDelegation(delegationId, payload);
      await refresh({ force: true });
    },
    deletePayDelegation: async (delegationId, params) => {
      await deletePayDelegation(delegationId, params);
      await refresh({ force: true });
    },
    createProjectDelegation: async (payload) => {
      await createProjectDelegation(payload);
      await refresh({ force: true });
    },
    updateProjectDelegation: async (delegationId, payload) => {
      await updateProjectDelegation(delegationId, payload);
      await refresh({ force: true });
    },
    deleteProjectDelegation: async (delegationId, params) => {
      await deleteProjectDelegation(delegationId, params);
      await refresh({ force: true });
    },
    createGigDelegation: async (payload) => {
      await createGigDelegation(payload);
      await refresh({ force: true });
    },
    updateGigDelegation: async (delegationId, payload) => {
      await updateGigDelegation(delegationId, payload);
      await refresh({ force: true });
    },
    deleteGigDelegation: async (delegationId, params) => {
      await deleteGigDelegation(delegationId, params);
      await refresh({ force: true });
    },
    recordCapacitySnapshot: async (payload) => {
      await recordCapacitySnapshot(payload);
      await refresh({ force: true });
    },
    updateCapacitySnapshot: async (snapshotId, payload) => {
      await updateCapacitySnapshot(snapshotId, payload);
      await refresh({ force: true });
    },
    deleteCapacitySnapshot: async (snapshotId, params) => {
      await deleteCapacitySnapshot(snapshotId, params);
      await refresh({ force: true });
    },
    createAvailabilityEntry: async (payload) => {
      await createAvailabilityEntry(payload);
      await refresh({ force: true });
    },
    updateAvailabilityEntry: async (entryId, payload) => {
      await updateAvailabilityEntry(entryId, payload);
      await refresh({ force: true });
    },
    deleteAvailabilityEntry: async (entryId, params) => {
      await deleteAvailabilityEntry(entryId, params);
      await refresh({ force: true });
    },
  }), [refresh]);

  const subtitle = useMemo(() => {
    const { totalMembers, utilizationPercent } = data?.metrics ?? {};
    return `Headcount ${totalMembers ?? 0} · Utilisation ${utilizationPercent?.toFixed?.(1) ?? '0.0'}%`;
  }, [data?.metrics]);

  const title = useMemo(() => {
    const displayName = session?.name ?? session?.firstName ?? 'Agency team';
    return `${displayName} workforce hub`;
  }, [session?.firstName, session?.name]);

  return (
    <DashboardLayout
      currentDashboard="agency"
      title={title}
      subtitle={subtitle}
      description=""
      menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={availableDashboards}
      activeMenuItem="home"
    >
      <div className="flex min-h-[calc(100vh-6rem)] flex-col gap-8 px-4 py-10 sm:px-6 lg:px-10 xl:px-16">
        <AgencyWorkforceDashboard
          data={data}
          loading={loading}
          error={error}
          summaryCards={summaryCards}
          onRefresh={refresh}
          workspaceId={workspaceId ?? data?.workspaceId ?? null}
          permissions={{ canEdit }}
          actions={actions}
        />
      </div>
    </DashboardLayout>
  );
}
