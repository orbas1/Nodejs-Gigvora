import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';

function extractToken(req) {
  const header = req.headers?.authorization ?? req.headers?.Authorization;
  if (!header || typeof header !== 'string') {
    throw new AuthenticationError('Authentication token missing.');
  }
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    throw new AuthenticationError('Authentication token is malformed.');
  }
  const token = parts[1].trim();
  if (!token) {
    throw new AuthenticationError('Authentication token is malformed.');
  }
  return token;
}

async function resolveUserFromToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AuthenticationError('Authentication configuration is invalid.');
  }
  let payload;
  try {
    payload = jwt.verify(token, secret);
  } catch (error) {
    throw new AuthenticationError('Authentication token is invalid or expired.');
  }
  const userId = payload?.id;
  if (!userId) {
    throw new AuthenticationError('Authentication token is invalid.');
  }
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AuthenticationError('Authenticated user could not be found.');
  }
  return { user, payload };
}

export async function authenticate(req, res, next) {
  try {
    const token = extractToken(req);
    const { user, payload } = await resolveUserFromToken(token);
    req.user = {
      id: user.id,
      role: user.userType,
      email: user.email,
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
      if (!allowed.includes(role)) {
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
