import jwt from 'jsonwebtoken';
import { resolveAccessTokenSecret } from '../utils/jwtSecrets.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';

function extractToken(req) {
  let header = req.headers?.authorization ?? req.headers?.Authorization;
  if (Array.isArray(header)) {
    header = header.find((value) => typeof value === 'string' && value.trim().length > 0);
  }
  if (typeof header === 'string') {
    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() === 'bearer' && token) {
      return token.trim();
    }
  }

  if (req.cookies?.accessToken) {
    return `${req.cookies.accessToken}`.trim();
  }

  if (req.query?.accessToken) {
    return `${req.query.accessToken}`.trim();
  }

  return null;
}

function normalizeRoles(payload) {
  const roles = new Set();
  if (Array.isArray(payload?.roles)) {
    payload.roles.forEach((role) => {
      if (role != null) {
        roles.add(`${role}`.toLowerCase());
      }
    });
  }
  if (payload?.type) {
    roles.add(`${payload.type}`.toLowerCase());
  }
  if (payload?.role) {
    roles.add(`${payload.role}`.toLowerCase());
  }
  return Array.from(roles);
}

function coerceIdentifier(value) {
  if (value == null) {
    return null;
  }
  const numeric = Number.parseInt(value, 10);
  if (Number.isFinite(numeric) && `${numeric}` === `${value}`.trim()) {
    return numeric;
  }
  return value;
}

export function authenticate(options = {}) {
  const {
    roles = [],
    matchParam,
    allowAdminOverride = true,
    requireAdmin = false,
  } = options;
  const normalizedRequiredRoles = roles
    .filter(Boolean)
    .map((role) => `${role}`.toLowerCase());

  return (req, res, next) => {
    const token = extractToken(req);
    if (!token) {
      return next(new AuthenticationError('Authentication required.'));
    }

    let payload;
    try {
      payload = jwt.verify(token, resolveAccessTokenSecret());
    } catch (error) {
      return next(new AuthenticationError('Invalid or expired authentication token.', { cause: error.message }));
    }

    const rolesFromToken = normalizeRoles(payload);
    const isAdmin = rolesFromToken.includes('admin');

    if (requireAdmin && !isAdmin) {
      return next(new AuthorizationError('Admin access required.'));
    }

    if (
      normalizedRequiredRoles.length &&
      !rolesFromToken.some((role) => normalizedRequiredRoles.includes(role)) &&
      !(allowAdminOverride && isAdmin)
    ) {
      return next(new AuthorizationError('You do not have permission to access this resource.'));
    }

    if (matchParam && payload?.id != null) {
      const routeValue = req.params?.[matchParam];
      if (routeValue != null) {
        const expectedId = coerceIdentifier(payload.id);
        const providedId = coerceIdentifier(routeValue);
        if (expectedId != null && providedId != null && expectedId !== providedId && !(allowAdminOverride && isAdmin)) {
          return next(new AuthorizationError('You can only access your own workspace.'));
        }
      }
    }

    const userId = coerceIdentifier(payload?.id);

    req.user = {
      id: userId,
      type: payload?.type ?? null,
      roles: rolesFromToken,
    };
    req.auth = {
      userId,
      userType: payload?.type ?? null,
      token,
    };

    return next();
  };
}

export const requireAdmin = authenticate({ requireAdmin: true });

export function requireRoles(...roles) {
  const normalized = roles.filter(Boolean).map((role) => `${role}`.toLowerCase());
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required.'));
    }
    if (normalized.length && !req.user.roles.some((role) => normalized.includes(role))) {
      return next(new AuthorizationError('You do not have permission to access this resource.'));
    }
    return next();
  };
}

export default authenticate;
