import { useCallback, useMemo } from 'react';
import useSession from './useSession.js';

const PROJECT_MANAGEMENT_ROLES = [
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
];

const RESOURCE_POLICIES = {
  'notifications:center': {
    roles: ['user', 'freelancer', 'agency', 'company', 'headhunter', 'mentor', 'admin'],
    permissionsAny: ['notifications:read', 'notifications:manage'],
    requireAuthentication: true,
  },
  'notifications:push': {
    roles: ['user', 'freelancer', 'agency', 'company', 'headhunter', 'mentor', 'admin'],
    permissionsAny: ['notifications:manage', 'notifications:push:register'],
    requireAuthentication: true,
  },
};

const PROJECT_DENIAL_REASON =
  'Project workspaces are restricted to agency, company, operations, and admin leads. Request access from your workspace administrator.';

function normaliseKey(value) {
  if (value == null) {
    return null;
  }

  if (typeof value === 'object') {
    if (typeof value.key !== 'undefined') {
      return normaliseKey(value.key);
    }
    if (typeof value.role !== 'undefined') {
      return normaliseKey(value.role);
    }
  }

  const stringified = typeof value === 'string' ? value : String(value);
  const trimmed = stringified.trim().toLowerCase();

  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/[^a-z0-9]+/g, '_');
}

function mergeValues(target, candidate) {
  if (!candidate) {
    return;
  }

  if (Array.isArray(candidate) || candidate instanceof Set) {
    candidate.forEach((item) => {
      const normalised = normaliseKey(item);
      if (normalised) {
        target.add(normalised);
      }
    });
    return;
  }

  const normalised = normaliseKey(candidate);
  if (normalised) {
    target.add(normalised);
  }
}

export default function useAuthorization() {
  const { session, isAuthenticated } = useSession();

  const roleSet = useMemo(() => {
    const values = new Set();
    mergeValues(values, session?.memberships);
    mergeValues(values, session?.roles);
    mergeValues(values, session?.accountTypes);
    mergeValues(values, session?.primaryDashboard);
    mergeValues(values, session?.activeMembership);
    return values;
  }, [session?.accountTypes, session?.activeMembership, session?.memberships, session?.primaryDashboard, session?.roles]);

  const permissionSet = useMemo(() => {
    const values = new Set();
    mergeValues(values, session?.permissions);
    mergeValues(values, session?.capabilities);
    mergeValues(values, session?.grants);
    mergeValues(values, session?.scopes);
    return values;
  }, [session?.capabilities, session?.grants, session?.permissions, session?.scopes]);

  const hasRole = useCallback((role) => roleSet.has(normaliseKey(role)), [roleSet]);

  const hasPermission = useCallback(
    (permission) => permissionSet.has(normaliseKey(permission)),
    [permissionSet],
  );

  const canAccess = useCallback(
    (resource, { requireAuthentication = true } = {}) => {
      const policy = RESOURCE_POLICIES[resource];
      if (!policy) {
        return requireAuthentication ? Boolean(isAuthenticated) : true;
      }

      if (policy.requireAuthentication !== false && !isAuthenticated) {
        return false;
      }

      if (Array.isArray(policy.roles) && policy.roles.length) {
        const allowed = policy.roles.some((role) => hasRole(role));
        if (!allowed) {
          return false;
        }
      }

      if (Array.isArray(policy.permissionsAll) && policy.permissionsAll.length) {
        const hasAll = policy.permissionsAll.every((permission) => hasPermission(permission));
        if (!hasAll) {
          return false;
        }
      }

      if (Array.isArray(policy.permissionsAny) && policy.permissionsAny.length) {
        const hasAny = policy.permissionsAny.some((permission) => hasPermission(permission));
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

  const canManageProjects = useMemo(() => {
    if (!roleSet.size) {
      return false;
    }
    return PROJECT_MANAGEMENT_ROLES.some((role) => hasRole(role));
  }, [hasRole, roleSet]);

  const denialReason = canManageProjects ? null : PROJECT_DENIAL_REASON;

  return {
    session,
    isAuthenticated,
    canAccess,
    hasRole,
    hasPermission,
    roles: Array.from(roleSet),
    permissions: Array.from(permissionSet),
    canManageProjects,
    denialReason,
  };
}

export function useProjectManagementAccess() {
  return useAuthorization();
}
