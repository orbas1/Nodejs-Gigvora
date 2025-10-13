import jwt from 'jsonwebtoken';
import { resolveAccessTokenSecret } from '../utils/jwtSecrets.js';

function extractToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (typeof header === 'string') {
    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() === 'bearer' && token) {
      return token.trim();
    }
  }
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  if (req.query?.accessToken) {
    return req.query.accessToken;
  }
  return null;
}

export function authenticate({ requireAdmin = false } = {}) {
  return (req, res, next) => {
    try {
      const token = extractToken(req);
      if (!token) {
        throw Object.assign(new Error('Authentication required'), { status: 401 });
      }

      const payload = jwt.verify(token, resolveAccessTokenSecret());
      req.user = payload;
      req.auth = {
        userId: payload?.id ?? null,
        userType: payload?.type ?? null,
        token,
      };

      if (requireAdmin && payload?.type !== 'admin') {
        throw Object.assign(new Error('Admin access required'), { status: 403 });
      }

      return next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
        return next(Object.assign(new Error('Invalid or expired authentication token'), { status: 401 }));
      }
      return next(error);
    }
  };
}

export const requireAdmin = authenticate({ requireAdmin: true });

export default {
  authenticate,
  requireAdmin,
};
