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
const availableDashboards = ['user', 'freelancer', 'agency', 'company', 'headhunter'];
const allowedDashboardRoles = [...availableDashboards, 'platform:admin'];
const calendarViewPermissionCandidates = ['calendar:view', 'calendar:manage'];
const calendarManagePermissionCandidates = ['calendar:manage'];
const calendarFallbackRoles = ['platform:admin'];

function normalizeKey(value) {
  if (value == null) {
    return null;
  }
  const stringValue = typeof value === 'string' ? value : String(value);
  const trimmed = stringValue.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }
  return trimmed.replace(/[^a-z0-9]+/g, '_');
}

function normalizeCandidates(candidates) {
  return candidates.reduce((set, candidate) => {
    const normalized = normalizeKey(candidate);
    if (normalized) {
      set.add(normalized);
    }
    return set;
  }, new Set());
}

function collectionIncludes(values, normalizedCandidates, prefix = '') {
  if (!values || !normalizedCandidates.size) {
    return false;
  }

  if (Array.isArray(values) || values instanceof Set) {
    for (const entry of values) {
      const normalizedEntry = normalizeKey(entry);
      if (normalizedEntry && normalizedCandidates.has(normalizedEntry)) {
        return true;
      }
      if (prefix) {
        const compound = normalizeKey(`${prefix}_${entry}`);
        if (compound && normalizedCandidates.has(compound)) {
          return true;
        }
      }
    }
    return false;
  }

  if (typeof values === 'object') {
    for (const [key, value] of Object.entries(values)) {
      const normalizedKey = normalizeKey(key);
      if (!normalizedKey) {
        continue;
      }
      if (value && typeof value === 'object') {
        if (collectionIncludes(value, normalizedCandidates, prefix ? `${prefix}_${key}` : key)) {
          return true;
        }
      } else if (value) {
        if (normalizedCandidates.has(normalizedKey)) {
          return true;
        }
        if (prefix) {
          const compound = normalizeKey(`${prefix}_${key}`);
          if (compound && normalizedCandidates.has(compound)) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

function hasCalendarAccess(session, hasPermission, hasRole, permissionCandidates, fallbackRoles) {
  const normalizedPermissionCandidates = normalizeCandidates(permissionCandidates);
  const normalizedFallbackRoles = normalizeCandidates(fallbackRoles);

  if (typeof hasPermission === 'function') {
    for (const candidate of permissionCandidates) {
      if (hasPermission(candidate)) {
        return true;
      }
    }
  }

  if (typeof hasRole === 'function') {
    for (const candidate of fallbackRoles) {
      if (hasRole(candidate)) {
        return true;
      }
    }
  }

  if (!session) {
    return false;
  }

  if (collectionIncludes(session.permissionKeys, normalizedPermissionCandidates)) {
    return true;
  }
  if (collectionIncludes(session.permissions, normalizedPermissionCandidates)) {
    return true;
  }
  if (collectionIncludes(session.capabilities, normalizedPermissionCandidates)) {
    return true;
  }

  if (normalizedFallbackRoles.size) {
    if (collectionIncludes(session.roleKeys, normalizedFallbackRoles)) {
      return true;
    }
    if (collectionIncludes(session.roles, normalizedFallbackRoles)) {
      return true;
    }
    if (collectionIncludes(session.memberships, normalizedFallbackRoles)) {
      return true;
    }
  }

  return false;
}

function resolveUserId(session) {
  if (!session) {
    return DEFAULT_USER_ID;
  }
  return session.userId ?? session.user?.id ?? session.id ?? DEFAULT_USER_ID;
}

export default function UserCalendarPage() {
  const { session, isAuthenticated, hasPermission, hasRole } = useSession();
  const userId = session ? resolveUserId(session) : null;
  const canViewCalendar = useMemo(
    () => hasCalendarAccess(session, hasPermission, hasRole, calendarViewPermissionCandidates, calendarFallbackRoles),
    [session, hasPermission, hasRole],
  );
  const canManageCalendar = useMemo(
    () => hasCalendarAccess(session, hasPermission, hasRole, calendarManagePermissionCandidates, calendarFallbackRoles),
    [session, hasPermission, hasRole],
  );
  const shouldLoad = Boolean(isAuthenticated && userId && canViewCalendar);

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

  const calendarContent = canViewCalendar ? (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <DataStatus
          loading={loading}
          error={error?.message}
          fromCache={fromCache}
          lastUpdated={lastUpdated}
          onRetry={refresh}
        />
      </div>

      <UserCalendarSection userId={userId} insights={calendarInsights} canManage={canManageCalendar} />
    </>
  ) : (
    <div
      className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-700 shadow-sm"
      data-testid="calendar-permission-alert"
    >
      <h2 className="text-lg font-semibold text-amber-800">Calendar access requires additional permissions</h2>
      <p className="mt-2 text-sm">
        Your workspace does not currently include the calendar scheduling entitlement. Request the{' '}
        <code className="mx-1 rounded bg-amber-100 px-1 py-0.5 text-xs font-medium text-amber-800">calendar:view</code>{' '}
        or{' '}
        <code className="mx-1 rounded bg-amber-100 px-1 py-0.5 text-xs font-medium text-amber-800">calendar:manage</code>{' '}
        permission from an administrator to explore focus sessions, sync rules, and smart scheduling tools.
      </p>
      <p className="mt-4 text-sm">
        If you are an administrator, switch to a workspace with calendar privileges or add the entitlement in the control
        tower before returning to this dashboard.
      </p>
    </div>
  );

  const dashboardView = (
    <DashboardLayout
      currentDashboard="user"
      title="Calendar"
      subtitle="Timeline"
      menuSections={menuSections}
      profile={profileCard}
      availableDashboards={availableDashboards}
    >
      <div className="space-y-8">{calendarContent}</div>
    </DashboardLayout>
  );

  return <DashboardAccessGuard requiredRoles={allowedDashboardRoles}>{dashboardView}</DashboardAccessGuard>;
}
