import { useMemo } from 'react';
import useSession from './useSession.js';

const PROJECT_MANAGEMENT_ROLES = new Set([
  'project_manager',
  'project_management',
  'operations_lead',
  'operations',
  'agency',
  'agency_admin',
  'company',
  'company_admin',
  'workspace_admin',
  'admin',
]);

function normaliseRole(value) {
  if (!value) {
    return null;
  }
  const stringified = typeof value === 'string' ? value : String(value);
  const trimmed = stringified.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

function mergeRoles(target, candidates) {
  if (!candidates) {
    return;
  }
  if (Array.isArray(candidates)) {
    candidates.forEach((candidate) => {
      const normalised = normaliseRole(candidate);
      if (normalised) {
        target.add(normalised);
      }
    });
    return;
  }

  const normalised = normaliseRole(candidates);
  if (normalised) {
    target.add(normalised);
  }
}

export default function useAuthorization() {
  const { session } = useSession();

  const roles = useMemo(() => {
    const collected = new Set();
    mergeRoles(collected, session?.memberships);
    mergeRoles(collected, session?.primaryDashboard);
    mergeRoles(collected, session?.accountTypes);
    mergeRoles(collected, session?.roles);
    mergeRoles(collected, session?.activeMembership);
    return collected;
  }, [session?.accountTypes, session?.activeMembership, session?.memberships, session?.primaryDashboard, session?.roles]);

  const canManageProjects = useMemo(() => {
    if (!roles.size) {
      return false;
    }
    for (const role of roles) {
      if (PROJECT_MANAGEMENT_ROLES.has(role)) {
        return true;
      }
    }
    return false;
  }, [roles]);

  const denialReason = canManageProjects
    ? null
    : 'Project workspaces are restricted to agency, company, operations, and admin leads. Request access from your workspace administrator.';

  return {
    roles: Array.from(roles),
    canManageProjects,
    denialReason,
    session,
  };
}

export function useProjectManagementAccess() {
  const authorization = useAuthorization();
  return authorization;
}
import { useCallback, useMemo } from 'react';
import useSession from './useSession.js';

const NOTIFICATION_ROLES = [
  'user',
  'freelancer',
  'agency',
  'company',
  'headhunter',
  'mentor',
  'admin',
];

const RESOURCE_POLICIES = {
  'notifications:center': {
    roles: NOTIFICATION_ROLES,
    permissionsAny: ['notifications:read', 'notifications:manage'],
    requireAuthentication: true,
  },
  'notifications:push': {
    roles: NOTIFICATION_ROLES,
    permissionsAny: ['notifications:manage', 'notifications:push:register'],
    requireAuthentication: true,
  },
};

function createStringSet(values = []) {
  const set = new Set();
  values.forEach((value) => {
    if (typeof value !== 'string') {
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    set.add(trimmed);
  });
  return set;
}

export default function useAuthorization() {
  const { session, isAuthenticated } = useSession();

  const roleSet = useMemo(() => {
    if (!session) {
      return new Set();
    }
    const roles = [];
    if (Array.isArray(session.memberships)) {
      roles.push(...session.memberships);
    }
    if (Array.isArray(session.roles)) {
      roles.push(...session.roles);
    }
    if (typeof session.activeMembership === 'string') {
      roles.push(session.activeMembership);
    }
    if (typeof session.primaryDashboard === 'string') {
      roles.push(session.primaryDashboard);
    }
    return createStringSet(roles);
  }, [session]);

  const permissionSet = useMemo(() => {
    if (!session) {
      return new Set();
    }
    const permissions = [];
    if (Array.isArray(session.permissions)) {
      permissions.push(...session.permissions);
    }
    if (Array.isArray(session.capabilities)) {
      permissions.push(...session.capabilities);
    }
    if (Array.isArray(session.grants)) {
      permissions.push(...session.grants);
    }
    return createStringSet(permissions);
  }, [session]);

  const hasRole = useCallback((role) => roleSet.has(role), [roleSet]);

  const hasPermission = useCallback((permission) => permissionSet.has(permission), [permissionSet]);

  const canAccess = useCallback(
    (resource, { requireAuthentication = true } = {}) => {
      const policy = RESOURCE_POLICIES[resource];
      if (!policy) {
        return requireAuthentication ? Boolean(isAuthenticated) : true;
      }
      if (policy.requireAuthentication !== false && !isAuthenticated) {
        return false;
      }
      if (Array.isArray(policy.roles) && policy.roles.length && !policy.roles.some(hasRole)) {
        return false;
      }
      if (Array.isArray(policy.permissionsAll) && policy.permissionsAll.length) {
        const hasAll = policy.permissionsAll.every(hasPermission);
        if (!hasAll) {
          return false;
        }
      }
      if (Array.isArray(policy.permissionsAny) && policy.permissionsAny.length) {
        const hasAny = policy.permissionsAny.some(hasPermission);
        if (!hasAny) {
          return false;
        }
      }
      if (typeof policy.condition === 'function') {
        return policy.condition({ session, isAuthenticated, hasPermission, hasRole });
      }
      return true;
    },
    [hasPermission, hasRole, isAuthenticated, session],
  );

  return {
    canAccess,
    hasRole,
    hasPermission,
    roles: roleSet,
    permissions: permissionSet,
  };
}
