import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { AuthorizationError } from '../utils/errors.js';

function extractToken(req) {
  const header = req.headers?.authorization ?? req.headers?.Authorization;
  if (!header) {
    return null;
  }
  if (Array.isArray(header)) {
    return extractToken({ headers: { authorization: header[0] } });
  }
  const value = header.trim();
  if (!value) {
    return null;
  }
  if (value.startsWith('Bearer ')) {
    return value.slice(7).trim();
  }
  return value;
}

export function authenticate({ optional = false } = {}) {
  return async function authenticateRequest(req, _res, next) {
    try {
      const token = extractToken(req);
      if (!token) {
        if (optional) {
          return next();
        }
        throw new AuthorizationError('Authentication required');
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (!payload?.id) {
        throw new AuthorizationError('Invalid authentication token');
      }

      const user = await User.findByPk(payload.id, {
        attributes: ['id', 'firstName', 'lastName', 'email', 'userType'],
      });
      if (!user) {
        throw new AuthorizationError('Account not found or inactive');
      }

      req.user = {
        id: user.id,
        userType: user.userType,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      };

      return next();
    } catch (error) {
      if (optional && error instanceof AuthorizationError) {
        return next();
      }
      return next(
        error instanceof AuthorizationError
          ? error
          : new AuthorizationError('Authentication failed'),
      );
    }
  };
}

export function requireRoles(...roles) {
  const allowed = roles.filter(Boolean);
  return function enforceRole(req, _res, next) {
    if (!req.user) {
      return next(new AuthorizationError('Authentication required'));
    }
    if (allowed.length && !allowed.includes(req.user.userType)) {
      return next(new AuthorizationError('You do not have permission to perform this action.'));
    }
    return next();
  };
}

export default {
  authenticate,
  requireRoles,
};
