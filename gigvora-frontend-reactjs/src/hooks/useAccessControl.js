import { useMemo } from 'react';
import useSession from './useSession.js';
import { DASHBOARD_LINKS } from '../constants/dashboardLinks.js';

function normaliseList(input) {
  if (!input) {
    return [];
  }
  const values = Array.isArray(input) ? input : [input];
  return values
    .map((value) => {
      if (!value) {
        return null;
      }
      if (typeof value === 'string') {
        return value.trim().toLowerCase();
      }
      return String(value).trim().toLowerCase();
    })
    .filter(Boolean);
}

function collectMemberships(session) {
  if (!session) {
    return [];
  }
  const collections = [session.memberships, session.accountTypes, session.roles];
  return Array.from(
    new Set(
      collections
        .filter(Array.isArray)
        .flat()
        .concat(session.primaryDashboard ? [session.primaryDashboard] : [])
        .map((value) => (typeof value === 'string' ? value.trim().toLowerCase() : ''))
        .filter(Boolean),
    ),
  );
}

function collectRoles(session) {
  if (!session) {
    return [];
  }
  const candidates = [
    session.userType,
    session.primaryDashboard,
    ...(Array.isArray(session.roles) ? session.roles : []),
    ...(Array.isArray(session.accountTypes) ? session.accountTypes : []),
    ...(Array.isArray(session.memberships) ? session.memberships : []),
  ];
  return Array.from(
    new Set(
      candidates
        .map((value) => {
          if (!value) {
            return null;
          }
          if (typeof value === 'string') {
            return value.trim().toLowerCase().replace(/\s+/g, '-');
          }
          return String(value).trim().toLowerCase();
        })
        .filter(Boolean),
    ),
  );
}

function resolveDashboardRedirect(session, fallback = '/login') {
  if (!session) {
    return fallback;
  }
  const preferred = session.primaryDashboard?.toLowerCase();
  if (preferred && DASHBOARD_LINKS[preferred]?.path) {
    return DASHBOARD_LINKS[preferred].path;
  }
  const memberships = Array.isArray(session.memberships) ? session.memberships : [];
  for (const membership of memberships) {
    const link = DASHBOARD_LINKS[membership];
    if (link?.path) {
      return link.path;
    }
  }
  return fallback;
}

export default function useAccessControl({
  requireAuth = false,
  allowedMemberships = [],
  allowedRoles = [],
  fallbackPath = '/login',
  preferDashboardRedirect = true,
} = {}) {
  const { isAuthenticated, session } = useSession();

  const memberships = useMemo(() => collectMemberships(session), [session]);
  const roles = useMemo(() => collectRoles(session), [session]);

  const requiredMemberships = useMemo(() => normaliseList(allowedMemberships), [allowedMemberships]);
  const requiredRoles = useMemo(() => normaliseList(allowedRoles), [allowedRoles]);

  const membershipAllowed = useMemo(() => {
    if (!requiredMemberships.length) {
      return true;
    }
    const membershipSet = new Set(memberships);
    return requiredMemberships.some((membership) => membershipSet.has(membership));
  }, [memberships, requiredMemberships]);

  const roleAllowed = useMemo(() => {
    if (!requiredRoles.length) {
      return true;
    }
    const roleSet = new Set(roles);
    return requiredRoles.some((role) => roleSet.has(role));
  }, [requiredRoles, roles]);

  const status = useMemo(() => {
    if (requireAuth && !isAuthenticated) {
      return 'unauthenticated';
    }
    if (!membershipAllowed || !roleAllowed) {
      return 'forbidden';
    }
    return 'granted';
  }, [isAuthenticated, membershipAllowed, requireAuth, roleAllowed]);

  const missingMemberships = useMemo(() => {
    if (status !== 'forbidden' || !requiredMemberships.length) {
      return [];
    }
    const membershipSet = new Set(memberships);
    return requiredMemberships.filter((membership) => !membershipSet.has(membership));
  }, [memberships, requiredMemberships, status]);

  const missingRoles = useMemo(() => {
    if (status !== 'forbidden' || !requiredRoles.length) {
      return [];
    }
    const roleSet = new Set(roles);
    return requiredRoles.filter((role) => !roleSet.has(role));
  }, [requiredRoles, roles, status]);

  const redirectPath = useMemo(() => {
    if (status === 'unauthenticated') {
      return fallbackPath;
    }
    if (status === 'forbidden' && preferDashboardRedirect) {
      return resolveDashboardRedirect(session, fallbackPath);
    }
    return null;
  }, [fallbackPath, preferDashboardRedirect, session, status]);

  return {
    status,
    isAuthenticated,
    session,
    memberships,
    roles,
    missingMemberships,
    missingRoles,
    redirectPath,
    hasAccess: status === 'granted',
  };
}
