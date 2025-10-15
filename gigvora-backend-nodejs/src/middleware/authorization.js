import { ValidationError } from '../utils/errors.js';

function normaliseMemberships(input) {
  if (input == null) {
    return [];
  }
  if (Array.isArray(input)) {
    const aggregated = [];
    input.forEach((value) => {
      normaliseMemberships(value).forEach((entry) => {
        if (entry && !aggregated.includes(entry)) {
          aggregated.push(entry);
        }
      });
    });
    return aggregated;
  }
  if (typeof input === 'string') {
    return input
      .split(/[,\s]+/)
      .map((value) => value.trim().toLowerCase())
      .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);
  }
  if (typeof input === 'object') {
    return normaliseMemberships(Object.values(input));
  }
  const normalised = `${input}`.trim().toLowerCase();
  return normalised ? [normalised] : [];
}

function normalizeToArray(input) {
  if (input == null) {
    return [];
  }
  if (Array.isArray(input)) {
    return input
      .flatMap((value) => normaliseMemberships(value))
      .filter((value) => value.length > 0);
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length > 0);
  }
  if (typeof input === 'object') {
    return normaliseMemberships(Object.values(input));
  }
  return [`${input}`.trim().toLowerCase()].filter((value) => value.length > 0);
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
  const allowedValues = normaliseMemberships(allowed);
  if (!allowedValues.length) {
    throw new ValidationError('requireMembership middleware requires a non-empty array of allowed roles.');
  }
  const allowedSet = new Set(allowedValues);

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
  const pushRole = (value) => {
    const normalised = normaliseRole(value);
    if (normalised) {
      roles.add(normalised);
    }
  };

  if (!input) {
    return roles;
  }
  if (Array.isArray(input)) {
    input.forEach((value) => extractRoles(value).forEach((item) => roles.add(item)));
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
    message: 'You do not have permission to manage projects. Contact an operations lead to obtain the correct workspace role.',
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

export function requireRoles(roles, options) {
  return requireMembership(roles, options);
}

export default {
  extractMemberships,
  requireMembership,
  requireRoles,
  hasProjectManagementAccess,
  requireProjectManagementRole,
  requireUserType,
};
