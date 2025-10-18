import { useMemo } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import useCachedResource from '../../../hooks/useCachedResource.js';
import DataStatus from '../../../components/DataStatus.jsx';
import { fetchUserDashboard } from '../../../services/userDashboard.js';
import useSession from '../../../hooks/useSession.js';
import DashboardAccessGuard from '../../../components/security/DashboardAccessGuard.jsx';
import UserCalendarSection from '../../../components/calendar/UserCalendarSection.jsx';
import { buildUserDashboardMenuSections, buildProfileCard } from '../UserDashboardPage.jsx';

const DEFAULT_USER_ID = 1;
const allowedDashboardRoles = ['user', 'freelancer', 'agency', 'company', 'headhunter'];
const availableDashboards = allowedDashboardRoles;

function resolveUserId(session) {
  if (!session) {
    return DEFAULT_USER_ID;
  }
  return session.userId ?? session.user?.id ?? session.id ?? DEFAULT_USER_ID;
}

export default function UserCalendarPage() {
  const { session, isAuthenticated } = useSession();
  const userId = session ? resolveUserId(session) : null;
  const shouldLoad = Boolean(isAuthenticated && userId);

  const { data, error, loading, fromCache, lastUpdated, refresh } = useCachedResource(
    `dashboard:user:calendar:${userId ?? 'anonymous'}`,
    ({ signal }) => {
      if (!userId) {
        throw new Error('A valid userId is required to load the calendar view.');
      }
      return fetchUserDashboard(userId, { signal });
    },
    {
      ttl: 1000 * 60,
      dependencies: [userId],
      enabled: shouldLoad,
    },
  );

  const summary = data?.summary ?? {};
  const menuSections = useMemo(() => buildUserDashboardMenuSections(data), [data]);
  const profileCard = useMemo(() => buildProfileCard(data, summary, session), [data, summary, session]);
  const calendarInsights = data?.insights?.calendar ?? null;

  const dashboardView = (
    <DashboardLayout
      currentDashboard="user"
      title="Calendar"
      subtitle="Timeline"
      menuSections={menuSections}
      profile={profileCard}
      availableDashboards={availableDashboards}
    >
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <DataStatus
            loading={loading}
            error={error?.message}
            fromCache={fromCache}
            lastUpdated={lastUpdated}
            onRetry={refresh}
          />
        </div>

        <UserCalendarSection userId={userId} insights={calendarInsights} canManage={Boolean(session)} />
      </div>
    </DashboardLayout>
  );

  return <DashboardAccessGuard requiredRoles={allowedDashboardRoles}>{dashboardView}</DashboardAccessGuard>;
}
