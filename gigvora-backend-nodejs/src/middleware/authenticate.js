import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';

function extractToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (typeof header === 'string' && header.toLowerCase().startsWith('bearer ')) {
    return header.slice('bearer '.length).trim();
  }

  if (req.headers?.['x-access-token']) {
    return `${req.headers['x-access-token']}`.trim();
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
    for (const role of payload.roles) {
      if (role) {
        roles.add(`${role}`.toLowerCase());
      }
    }
  }
  if (payload?.type) {
    roles.add(`${payload.type}`.toLowerCase());
  }
  if (payload?.userType) {
    roles.add(`${payload.userType}`.toLowerCase());
  }
  return Array.from(roles.values());
}

function buildAuthenticate({ roles = [], matchParam = null, allowAdminOverride = true } = {}) {
  const requiredRoles = Array.isArray(roles) ? roles.map((role) => `${role}`.toLowerCase()) : [];

  return (req, _res, next) => {
    try {
      const token = extractToken(req);
      if (!token) {
        throw new AuthenticationError('Authentication required.');
      }

      const payload = jwt.verify(token, JWT_SECRET);
      const userId = payload?.id ?? payload?.userId;
      if (!userId) {
        throw new AuthenticationError('Invalid authentication token.');
      }

      const rolesFromToken = normalizeRoles(payload);
      const isAdmin = rolesFromToken.includes('admin');

      if (
        requiredRoles.length &&
        !rolesFromToken.some((role) => requiredRoles.includes(role)) &&
        !(allowAdminOverride && isAdmin)
      ) {
        throw new AuthorizationError('You do not have permission to access this resource.');
      }

      if (matchParam) {
        const paramValue = req.params?.[matchParam];
        const numericParam = Number.parseInt(paramValue, 10);
        const numericUserId = Number.parseInt(userId, 10);
        if (
          Number.isInteger(numericParam) &&
          Number.isInteger(numericUserId) &&
          numericParam !== numericUserId &&
          !(allowAdminOverride && isAdmin)
        ) {
          throw new AuthorizationError('You can only access your own resources.');
        }
      }

      req.user = {
        id: Number.isNaN(Number(userId)) ? userId : Number(userId),
        type: rolesFromToken[0] ?? null,
        roles: rolesFromToken,
        email: payload?.email ?? null,
      };

      return next();
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        return next(error);
      }
      if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
        return next(new AuthenticationError('Invalid or expired authentication token.'));
      }
      return next(error);
    }
  };
}

export const authenticate = buildAuthenticate;
export const requireAdmin = buildAuthenticate({ roles: ['admin'], allowAdminOverride: false });

export function requireRoles(...roles) {
  const normalized = roles.map((role) => `${role}`.toLowerCase());
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required.'));
    }
    const grantedRoles = Array.isArray(req.user.roles) ? req.user.roles : [];
    if (normalized.length && !grantedRoles.some((role) => normalized.includes(role))) {
      return next(new AuthorizationError('You do not have permission to access this resource.'));
    }
    return next();
  };
}

export default buildAuthenticate;
