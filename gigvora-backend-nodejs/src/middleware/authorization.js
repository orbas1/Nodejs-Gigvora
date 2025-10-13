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

function normaliseRole(role) {
  if (!role) {
    return null;
  }

  if (typeof role !== 'string') {
    return normaliseRole(String(role));
  }

  const trimmed = role.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

function extractRoles(input) {
  const roles = new Set();

  if (!input) {
    return roles;
  }

  const pushRole = (value) => {
    const normalised = normaliseRole(value);
    if (normalised) {
      roles.add(normalised);
    }
  };

  if (Array.isArray(input)) {
    input.forEach(pushRole);
    return roles;
  }

  if (typeof input === 'string') {
    input
      .split(/[,\s]+/)
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach(pushRole);
    return roles;
  }

  pushRole(input);
  return roles;
}

function collectRequestRoles(req) {
  const aggregated = new Set();

  const merge = (values) => {
    extractRoles(values).forEach((value) => aggregated.add(value));
  };

  merge(req?.user?.roles);
  merge(req?.user?.memberships);
  merge(req?.user?.role);
  merge(req?.user?.accountTypes);
  merge(req?.headers?.['x-roles']);
  merge(req?.headers?.['x-role']);
  merge(req?.headers?.['x-workspace-roles']);
  merge(req?.headers?.['x-memberships']);
  merge(req?.query?.roles);
  merge(req?.query?.memberships);
  merge(req?.body?.roles);
  merge(req?.body?.memberships);

  return aggregated;
}

export function hasProjectManagementAccess(req) {
  const roles = collectRequestRoles(req);
  if (!roles.size) {
    return false;
  }

  for (const role of roles) {
    if (PROJECT_MANAGEMENT_ROLES.has(role)) {
      return true;
    }
  }

  return false;
}

export function requireProjectManagementRole(req, res, next) {
  if (hasProjectManagementAccess(req)) {
    return next();
  }

  return res.status(403).json({
    message:
      'You do not have permission to manage projects. Contact an operations lead to obtain the correct workspace role.',
  });
}

export default {
  hasProjectManagementAccess,
  requireProjectManagementRole,
};
