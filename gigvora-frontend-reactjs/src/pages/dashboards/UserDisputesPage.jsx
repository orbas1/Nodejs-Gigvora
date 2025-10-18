import { useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import DashboardAccessGuard from '../../components/security/DashboardAccessGuard.jsx';
import useCachedResource from '../../hooks/useCachedResource.js';
import { fetchUserDashboard } from '../../services/userDashboard.js';
import DisputeWorkspace from '../../components/disputes/workspace/DisputeWorkspace.jsx';
import DataStatus from '../../components/DataStatus.jsx';

const allowedDashboardRoles = ['user', 'freelancer', 'agency', 'company', 'headhunter'];
const availableDashboards = ['user', 'freelancer', 'agency', 'company', 'headhunter'];

function resolveUserId(session) {
  if (!session) {
    return null;
  }

  return session.userId ?? session.user?.id ?? session.id ?? null;
}

export default function UserDisputesPage() {
  const { session, isAuthenticated } = useSession();
  const userId = session ? resolveUserId(session) : null;
  const shouldLoadOverview = Boolean(isAuthenticated && userId);

  const { data, loading, error, fromCache, lastUpdated, refresh } = useCachedResource(
    `dashboard:user:${userId ?? 'anonymous'}:overview`,
    ({ signal }) => {
      if (!userId) {
        throw new Error('A valid userId is required to load disputes.');
      }
      return fetchUserDashboard(userId, { signal });
    },
    {
      enabled: shouldLoadOverview,
      ttl: 1000 * 60,
      dependencies: [userId],
    },
  );

  const overview = data?.disputeManagement ?? null;

  const menuSections = useMemo(
    () => [
      {
        label: 'Cases',
        items: [
          {
            id: 'case-board',
            name: 'Board',
            sectionId: 'case-board',
          },
        ],
      },
    ],
    [],
  );

  return (
    <DashboardAccessGuard requiredRoles={allowedDashboardRoles}>
      <DashboardLayout
        currentDashboard="user"
        title="Disputes"
        subtitle="Escrow cases"
        description="Resolve holds, share evidence, and keep payouts on track."
        menuSections={menuSections}
        availableDashboards={availableDashboards}
      >
        <div className="space-y-6 px-6 py-6">
          <DataStatus
            loading={loading}
            error={error}
            fromCache={fromCache}
            lastUpdated={lastUpdated}
            onRefresh={() => refresh({ force: true })}
            statusLabel="Live escrow data"
          />
          <section id="case-board" className="rounded-4xl bg-white/40 p-6 shadow-sm ring-1 ring-slate-100">
            <DisputeWorkspace userId={userId} overview={overview} />
          </section>
        </div>
      </DashboardLayout>
    </DashboardAccessGuard>
  );
}
