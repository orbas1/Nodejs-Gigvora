import jwt from 'jsonwebtoken';
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
