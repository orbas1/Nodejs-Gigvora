import { useEffect, useMemo } from 'react';
import useSession from './useSession.js';

function normaliseRoles(value) {
  if (!value) {
    return [];
  }
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((role) => (typeof role === 'string' ? role.trim().toLowerCase() : ''))
    .filter(Boolean);
}

function normaliseAllowedRoles(input) {
  if (!input) {
    return { anyOf: [], allOf: [] };
  }

  if (typeof input === 'object' && !Array.isArray(input)) {
    const anyOf = normaliseRoles(input.anyOf ?? input.roles ?? []);
    const allOf = normaliseRoles(input.allOf ?? []);
    return { anyOf, allOf };
  }

  const roles = normaliseRoles(input);
  return { anyOf: roles, allOf: [] };
}

export function useRoleAccess(allowedRoles, { autoSelectActive = true } = {}) {
  const { session, isAuthenticated, updateSession } = useSession();

  const normalizedAllowed = useMemo(() => normaliseAllowedRoles(allowedRoles), [allowedRoles]);
  const membershipList = useMemo(() => {
    const source = Array.isArray(session?.memberships) ? session.memberships : [];
    return source
      .map((role) => (typeof role === 'string' ? role.trim().toLowerCase() : ''))
      .filter(Boolean);
  }, [session?.memberships]);

  const membershipSet = useMemo(() => new Set(membershipList), [membershipList]);

  const matchesAllRequired = useMemo(() => {
    if (!normalizedAllowed.allOf.length) {
      return true;
    }
    return normalizedAllowed.allOf.every((role) => membershipSet.has(role));
  }, [membershipSet, normalizedAllowed.allOf]);

  const matchedRole = useMemo(() => {
    if (!normalizedAllowed.anyOf.length) {
      return matchesAllRequired ? membershipList[0] ?? null : null;
    }
    return normalizedAllowed.anyOf.find((role) => membershipSet.has(role)) ?? null;
  }, [matchesAllRequired, membershipList, membershipSet, normalizedAllowed.anyOf]);

  const hasAccess = Boolean(isAuthenticated && matchesAllRequired && (matchedRole || !normalizedAllowed.anyOf.length));

  useEffect(() => {
    if (!autoSelectActive || !hasAccess || !matchedRole) {
      return;
    }
    const active = typeof session?.activeMembership === 'string' ? session.activeMembership.toLowerCase() : null;
    if (active === matchedRole) {
      return;
    }
    if (typeof updateSession === 'function') {
      updateSession({ activeMembership: matchedRole });
    }
  }, [autoSelectActive, hasAccess, matchedRole, session?.activeMembership, updateSession]);

  const missingRoles = useMemo(() => {
    if (hasAccess) {
      return [];
    }
    if (!normalizedAllowed.anyOf.length && !normalizedAllowed.allOf.length) {
      return [];
    }
    const required = new Set([...normalizedAllowed.anyOf, ...normalizedAllowed.allOf]);
    return Array.from(required).filter((role) => !membershipSet.has(role));
  }, [hasAccess, membershipSet, normalizedAllowed.allOf, normalizedAllowed.anyOf]);

  return {
    session,
    isAuthenticated: Boolean(isAuthenticated),
    allowedRoles: normalizedAllowed.anyOf,
    requiredRoles: normalizedAllowed.allOf,
    matchedRole,
    activeMembership: matchedRole ?? membershipList[0] ?? null,
    hasAccess,
    missingRoles,
  };
}

export default useRoleAccess;
