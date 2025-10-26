import { useCallback, useMemo } from 'react';
import useSession from './useSession.js';
import {
  describePermissionRequirement,
  hasPermission as matrixHasPermission,
  normaliseMembershipKey,
  resolveAuthorizationState,
} from '../authorization/permissionMatrix.js';

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
  'Project workspaces are limited to agency, company, operations, or admin leads. Ask your workspace admin for access.';

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

  const membershipInputs = useMemo(() => {
    const values = [];
    const pushValue = (entry) => {
      if (!entry) {
        return;
      }
      if (Array.isArray(entry) || entry instanceof Set) {
        entry.forEach((item) => pushValue(item));
        return;
      }
      values.push(entry);
    };
    if (Array.isArray(session?.memberships)) {
      session.memberships.forEach((membership) => {
        if (typeof membership === 'string') {
          values.push(membership);
          return;
        }
        if (membership && typeof membership === 'object') {
          if (membership.role) {
            values.push(membership.role);
          }
          if (membership.key) {
            values.push(membership.key);
          }
        }
      });
    }
    pushValue(session?.roles);
    pushValue(session?.accountTypes);
    pushValue(session?.primaryDashboard);
    pushValue(session?.activeMembership);
    return values;
  }, [
    session?.accountTypes,
    session?.activeMembership,
    session?.memberships,
    session?.primaryDashboard,
    session?.roles,
  ]);

  const explicitPermissions = useMemo(() => {
    const values = [];
    [session?.permissions, session?.capabilities, session?.grants, session?.scopes]
      .filter(Array.isArray)
      .forEach((collection) => {
        collection.forEach((entry) => values.push(entry));
      });
    return values;
  }, [session?.capabilities, session?.grants, session?.permissions, session?.scopes]);

  const authorizationState = useMemo(
    () => resolveAuthorizationState({ memberships: membershipInputs, permissions: explicitPermissions }),
    [explicitPermissions, membershipInputs],
  );

  const roleSet = useMemo(() => {
    const values = new Set();
    membershipInputs.forEach((role) => {
      const normalised = normaliseMembershipKey(role);
      if (normalised) {
        values.add(normalised);
      }
    });
    authorizationState.membershipKeys.forEach((membership) => values.add(membership));
    mergeValues(values, session?.primaryDashboard);
    return values;
  }, [authorizationState.membershipKeys, membershipInputs, session?.primaryDashboard]);

  const permissionSet = useMemo(() => new Set(authorizationState.permissionKeys), [
    authorizationState.permissionKeys,
  ]);

  const hasRole = useCallback((role) => roleSet.has(normaliseKey(role)), [roleSet]);

  const hasPermission = useCallback(
    (permission) => {
      if (permissionSet.has(normaliseKey(permission))) {
        return true;
      }
      return matrixHasPermission(authorizationState, permission);
    },
    [authorizationState, permissionSet],
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
    if (matrixHasPermission(authorizationState, 'projects:manage')) {
      return true;
    }
    if (!roleSet.size) {
      return false;
    }
    return PROJECT_MANAGEMENT_ROLES.some((role) => hasRole(role));
  }, [authorizationState, hasRole, roleSet]);

  const projectRequirement = useMemo(
    () => describePermissionRequirement('projects:manage'),
    [],
  );

  const denialReason = canManageProjects
    ? null
    : projectRequirement?.message ?? PROJECT_DENIAL_REASON;

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
    authorization: authorizationState,
    projectRequirement,
  };
}

export function useProjectManagementAccess() {
  return useAuthorization();
}
