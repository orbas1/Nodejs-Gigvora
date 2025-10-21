import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';
import { resolveAccessTokenSecret } from '../utils/jwtSecrets.js';

function extractToken(req) {
  let header = req.headers?.authorization ?? req.headers?.Authorization;
  if (Array.isArray(header)) {
    header = header.find((value) => typeof value === 'string' && value.trim().length > 0);
  }
  if (typeof header === 'string') {
    const parts = header.trim().split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer' && parts[1].trim()) {
      return parts[1].trim();
    }
  }

  if (req.cookies?.accessToken) {
    const token = `${req.cookies.accessToken}`.trim();
    if (token) {
      return token;
    }
  }

  if (req.query?.accessToken) {
    const token = `${req.query.accessToken}`.trim();
    if (token) {
      return token;
    }
  }

  throw new AuthenticationError('Authentication token missing.');
}

async function resolveUserFromToken(token) {
  const secret = resolveAccessTokenSecret();
  let payload;
  try {
    payload = jwt.verify(token, secret);
  } catch (error) {
    throw new AuthenticationError('Authentication token is invalid or expired.', { cause: error });
  }
  const userId = payload?.id;
  if (!userId) {
    throw new AuthenticationError('Authentication token is invalid.');
  }
  const user = await User.findByPk(userId, {
    attributes: ['id', 'email', 'userType'],
  });
  if (!user) {
    throw new AuthenticationError('Authenticated user could not be found.');
  }
  return { user, payload };
}

export async function authenticate(req, res, next) {
  try {
    const token = extractToken(req);
    const { user, payload } = await resolveUserFromToken(token);
    const normalizedRoles = Array.isArray(payload?.roles)
      ? payload.roles.map((role) => `${role}`.trim().toLowerCase()).filter(Boolean)
      : payload?.role
        ? [`${payload.role}`.trim().toLowerCase()].filter(Boolean)
        : [];
    req.user = {
      id: user.id,
      role: user.userType,
      email: user.email,
      roles: normalizedRoles,
      payload,
    };
    req.auth = {
      userId: user.id,
      token,
      payload,
    };
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles) {
  const allowed = roles.map((role) => `${role}`.trim().toLowerCase()).filter(Boolean);
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required.');
      }
      const role = `${req.user.role ?? req.user.userType ?? ''}`.trim().toLowerCase();
      const normalizedRoles = Array.isArray(req.user.roles)
        ? req.user.roles.map((entry) => `${entry}`.trim().toLowerCase()).filter(Boolean)
        : [];
      const granted = new Set([role, ...normalizedRoles]);
      if (!allowed.some((value) => granted.has(value))) {
        throw new AuthorizationError('You do not have access to this resource.');
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

export default {
  authenticate,
  requireRole,
};
