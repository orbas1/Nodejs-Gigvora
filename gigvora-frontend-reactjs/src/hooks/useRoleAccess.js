import { useEffect, useMemo } from 'react';
import useSession from './useSession.js';

function normalizeRoles(roles) {
  if (!roles) {
    return [];
  }
  const list = Array.isArray(roles) ? roles : [roles];
  return list
    .map((role) => (typeof role === 'string' ? role.trim().toLowerCase() : ''))
    .filter(Boolean);
}

export function useRoleAccess(allowedRoles, { autoSelectActive = true } = {}) {
  const { session, isAuthenticated, updateSession } = useSession();

  const normalizedAllowedRoles = useMemo(() => normalizeRoles(allowedRoles), [allowedRoles]);
  const membershipSet = useMemo(() => {
    const memberships = Array.isArray(session?.memberships) ? session.memberships : [];
    return new Set(memberships.map((role) => (typeof role === 'string' ? role.toLowerCase() : '')));
  }, [session?.memberships]);

  const matchedRole = useMemo(() => {
    if (!normalizedAllowedRoles.length) {
      return null;
    }
    return normalizedAllowedRoles.find((role) => membershipSet.has(role)) ?? null;
  }, [normalizedAllowedRoles, membershipSet]);

  useEffect(() => {
    if (!autoSelectActive || !matchedRole) {
      return;
    }
    const active = typeof session?.activeMembership === 'string' ? session.activeMembership.toLowerCase() : null;
    if (active === matchedRole) {
      return;
    }
    if (typeof updateSession === 'function') {
      updateSession({ activeMembership: matchedRole });
    }
  }, [autoSelectActive, matchedRole, session?.activeMembership, updateSession]);

  return {
    session,
    isAuthenticated: Boolean(isAuthenticated),
    allowedRoles: normalizedAllowedRoles,
    matchedRole,
    hasAccess: Boolean(isAuthenticated && matchedRole),
  };
}

export default useRoleAccess;
