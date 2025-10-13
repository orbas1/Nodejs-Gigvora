import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';

function extractToken(authorizationHeader) {
  if (!authorizationHeader) {
    return null;
  }
  const [scheme, value] = authorizationHeader.split(' ');
  if (!value) {
    return null;
  }
  if (scheme && scheme.toLowerCase() !== 'bearer') {
    return null;
  }
  return value.trim();
}

function normalizeRoles(decoded) {
  if (Array.isArray(decoded?.roles) && decoded.roles.length) {
    return decoded.roles.map((role) => `${role}`.toLowerCase());
  }
  if (decoded?.type) {
    return [`${decoded.type}`.toLowerCase()];
  }
  return [];
}

export default function authenticate({ roles = [], matchParam = null, allowAdminOverride = true } = {}) {
  const requiredRoles = Array.isArray(roles) ? roles.map((role) => `${role}`.toLowerCase()) : [];

  return (req, res, next) => {
    try {
      const token = extractToken(req.headers.authorization || req.headers.Authorization);
      if (!token) {
        return res.status(401).json({ message: 'Authentication required.' });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
      }

      const rolesFromToken = normalizeRoles(decoded);
      const isAdmin = rolesFromToken.includes('admin');

      if (requiredRoles.length && !rolesFromToken.some((role) => requiredRoles.includes(role))) {
        return res.status(403).json({ message: 'You do not have permission to access this resource.' });
      }

      if (matchParam && decoded?.id != null) {
        const routeValue = req.params?.[matchParam];
        const numericParam = Number.parseInt(routeValue, 10);
        const numericId = Number.parseInt(decoded.id, 10);
        if (Number.isInteger(numericParam) && Number.isInteger(numericId) && numericParam !== numericId && !(allowAdminOverride && isAdmin)) {
          return res.status(403).json({ message: 'You can only access your own workspace.' });
        }
      }

      req.user = {
        id: decoded?.id ?? null,
        roles: rolesFromToken,
        type: decoded?.type ?? null,
      };

      return next();
    } catch (error) {
      return next(error);
    }
  };
}
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';

function extractToken(headerValue) {
  if (!headerValue || typeof headerValue !== 'string') {
    return null;
  }
  if (headerValue.startsWith('Bearer ')) {
    return headerValue.slice(7).trim();
  }
  return null;
}

export function authenticate(req, res, next) {
  const header = req.headers.authorization || req.headers.Authorization;
  const token = extractToken(header);
  if (!token) {
    return next(new AuthenticationError('Authentication required.'));
  }

  const secret = process.env.JWT_SECRET || 'dev-secret';
  try {
    const payload = jwt.verify(token, secret);
    if (!payload || typeof payload !== 'object' || !payload.id || !payload.type) {
      throw new Error('Invalid token payload');
    }

    req.user = { id: Number(payload.id), type: payload.type };
    return next();
  } catch (error) {
    return next(new AuthenticationError('Invalid or expired authentication token.', { cause: error.message }));
  }
}

export function requireRoles(...roles) {
  const normalized = roles.filter(Boolean);
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required.'));
    }
    if (normalized.length && !normalized.includes(req.user.type)) {
      return next(new AuthorizationError('You do not have permission to access this resource.'));
    }
    return next();
  };
}

export default {
  authenticate,
  requireRoles,
};
