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
