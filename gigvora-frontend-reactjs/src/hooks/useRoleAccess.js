import { useEffect, useMemo } from 'react';
import useSession from './useSession.js';
import {
  getMembershipMetadata,
  normaliseMembershipKey,
  resolveAuthorizationState,
} from '../authorization/permissionMatrix.js';

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
    const values = [];
    if (Array.isArray(session?.memberships)) {
      session.memberships.forEach((membership) => {
        if (typeof membership === 'string') {
          const normalised = normaliseMembershipKey(membership);
          if (normalised) {
            values.push(normalised);
          }
          return;
        }
        if (membership && typeof membership === 'object') {
          const candidate = membership.role ?? membership.key;
          const normalised = normaliseMembershipKey(candidate);
          if (normalised) {
            values.push(normalised);
          }
        }
      });
    }
    if (session?.activeMembership) {
      const active = normaliseMembershipKey(session.activeMembership);
      if (active) {
        values.unshift(active);
      }
    }
    return Array.from(new Set(values));
  }, [session?.activeMembership, session?.memberships]);

  const authorizationState = useMemo(
    () =>
      resolveAuthorizationState({
        memberships: membershipList,
        permissions: [
          ...(Array.isArray(session?.permissions) ? session.permissions : []),
          ...(Array.isArray(session?.grants) ? session.grants : []),
          ...(Array.isArray(session?.capabilities) ? session.capabilities : []),
          ...(Array.isArray(session?.scopes) ? session.scopes : []),
        ],
      }),
    [membershipList, session?.capabilities, session?.grants, session?.permissions, session?.scopes],
  );

  const membershipSet = useMemo(() => new Set(membershipList), [membershipList]);

  const allowedRoleDetails = useMemo(() => {
    const required = new Set([...normalizedAllowed.anyOf, ...normalizedAllowed.allOf]);
    if (!required.size) {
      return [];
    }
    return Array.from(required)
      .map((role) => getMembershipMetadata(role))
      .filter(Boolean);
  }, [normalizedAllowed.allOf, normalizedAllowed.anyOf]);

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

  const missingRoleDetails = useMemo(
    () => missingRoles.map((role) => getMembershipMetadata(role)).filter(Boolean),
    [missingRoles],
  );

  return {
    session,
    isAuthenticated: Boolean(isAuthenticated),
    allowedRoles: normalizedAllowed.anyOf,
    requiredRoles: normalizedAllowed.allOf,
    matchedRole,
    activeMembership: matchedRole ?? membershipList[0] ?? null,
    hasAccess,
    missingRoles,
    allowedRoleDetails,
    missingRoleDetails,
    authorization: authorizationState,
  };
}

export default useRoleAccess;
