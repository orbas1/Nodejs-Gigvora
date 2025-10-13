import { ValidationError } from '../utils/errors.js';

function normaliseMemberships(input) {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input
      .flatMap((value) => `${value}`.split(','))
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length > 0);
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length > 0);
  }
  if (typeof input === 'object') {
    return Object.values(input)
      .flatMap((value) => normaliseMemberships(value))
      .filter((value) => value.length > 0);
  }
  return [];
}

export function extractMemberships(req) {
  const header =
    req.headers['x-gigvora-memberships'] ??
    req.headers['x-gigvora-membership'] ??
    req.headers['x-gigvora-roles'];

  const memberships = normaliseMemberships(header);

  if (memberships.length) {
    return memberships;
  }

  if (req.user && Array.isArray(req.user.memberships)) {
    return normaliseMemberships(req.user.memberships);
  }

  return [];
}

export function requireMembership(allowed = [], { allowAdmin = true } = {}) {
  if (!Array.isArray(allowed) || allowed.length === 0) {
    throw new ValidationError('requireMembership middleware requires a non-empty array of allowed roles.');
  }

  const allowedSet = new Set(allowed.map((value) => `${value}`.trim().toLowerCase()).filter(Boolean));

  return (req, res, next) => {
    const memberships = extractMemberships(req);

    if (!Array.isArray(memberships) || memberships.length === 0) {
      return res.status(403).json({
        message: 'Volunteer workspace access requires an authenticated volunteer membership.',
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

export default requireMembership;
