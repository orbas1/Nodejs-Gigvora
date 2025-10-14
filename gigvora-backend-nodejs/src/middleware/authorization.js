import { ValidationError } from '../utils/errors.js';

function normalizeToArray(input) {
  if (input == null) {
    return [];
  }
  if (Array.isArray(input)) {
    return input;
  }
  return [input];
}

function normaliseMemberships(input) {
  return normalizeToArray(input)
    .flatMap((value) => `${value}`.split(','))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function extractMemberships(req) {
  const header =
    req.headers?.['x-gigvora-memberships'] ??
    req.headers?.['x-gigvora-membership'] ??
    req.headers?.['x-gigvora-roles'];

  const memberships = normaliseMemberships(header);
  if (memberships.length) {
    return memberships;
  }

  if (Array.isArray(req.user?.memberships)) {
    return normaliseMemberships(req.user.memberships);
  }

  return [];
}

export function requireMembership(allowed = [], { allowAdmin = true } = {}) {
  if (!Array.isArray(allowed) || allowed.length === 0) {
    throw new ValidationError('requireMembership middleware requires at least one allowed role.');
  }

  const allowedSet = new Set(allowed.map((value) => `${value}`.trim().toLowerCase()).filter(Boolean));

  return (req, res, next) => {
    const memberships = extractMemberships(req);

    if (!memberships.length) {
      return res.status(403).json({
        message: 'Volunteer workspace access requires an authenticated membership.',
        code: 'volunteer_access_required',
      });
    }

    const hasAccess = memberships.some((membership) => {
      if (allowAdmin && membership === 'admin') {
        return true;
      }
      return allowedSet.has(membership);
    });

    if (!hasAccess) {
      return res.status(403).json({
        message: 'Volunteer workspace access requires an active volunteer or mentor membership.',
        code: 'volunteer_membership_required',
      });
    }

    req.memberships = memberships;
    return next();
  };
}

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
  if (value == null) {
    return null;
  }
  const normalised = `${value}`.trim().toLowerCase();
  return normalised ? normalised.replace(/[^a-z0-9]+/g, '_') : null;
}

function collectRequestRoles(req) {
  const aggregated = new Set();
  const push = (value) => {
    const role = normaliseRole(value);
    if (role) {
      aggregated.add(role);
    }
  };

  const sources = [
    req.user?.roles,
    req.user?.memberships,
    req.user?.role,
    req.user?.accountTypes,
    req.headers?.['x-roles'],
    req.headers?.['x-role'],
    req.headers?.['x-workspace-roles'],
    req.headers?.['x-memberships'],
    req.query?.roles,
    req.query?.memberships,
    req.body?.roles,
    req.body?.memberships,
  ];

  for (const source of sources) {
    normalizeToArray(source).forEach((entry) => {
      if (typeof entry === 'string') {
        entry
          .split(/[,\s]+/)
          .map((part) => part.trim())
          .filter(Boolean)
          .forEach(push);
      } else {
        push(entry);
      }
    });
  }

  return aggregated;
}

export function hasProjectManagementAccess(req) {
  const roles = collectRequestRoles(req);
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

function normaliseRoles(input) {
  return normalizeToArray(input)
    .flatMap((value) => `${value}`.split(','))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function requireUserType(allowedUserTypes = [], { allowHeaderFallback = true, raise = true } = {}) {
  const allowed = new Set(normaliseRoles(allowedUserTypes));
  if (!allowed.size) {
    throw new ValidationError('requireUserType middleware requires at least one allowed user type.');
  }

  return function enforceUserType(req, res, next) {
    const sources = [req.user?.userType, req.userType, req.context?.userType];

    if (allowHeaderFallback) {
      sources.push(
        req.headers?.['x-user-type'],
        req.headers?.['x-user-role'],
        req.headers?.['x-user-types'],
        req.headers?.['x-roles'],
      );
    }

    sources.push(req.body?.userType, req.query?.userType);

    const resolvedRoles = normaliseRoles(sources);
    const hasAccess = resolvedRoles.some((role) => allowed.has(role));

    if (!hasAccess) {
      if (!raise) {
        res.status(403).json({ message: 'Access to this resource is restricted.' });
        return;
      }
      res.status(403).json({ message: 'Only authorised administrators can access Gigvora ads endpoints.' });
      return;
    }

    next();
  };
}

export default {
  requireMembership,
  hasProjectManagementAccess,
  requireProjectManagementRole,
  requireUserType,
};
