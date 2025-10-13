import { ValidationError } from '../utils/errors.js';

function normaliseRoles(input) {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input.flatMap((value) => normaliseRoles(value));
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
  }
  if (typeof input === 'object') {
    return normaliseRoles(Object.values(input));
  }
  return [`${input}`.trim().toLowerCase()].filter(Boolean);
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

export default { requireUserType };
