import jwt from 'jsonwebtoken';
import {
  User,
  ProviderWorkspaceMember,
  ProviderWorkspace,
} from '../models/index.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';
import { resolveAccessTokenSecret } from '../utils/jwtSecrets.js';

const HEADER_OVERRIDE_ENABLED = (process.env.AUTH_HEADER_OVERRIDE ?? '').toLowerCase() === 'true';
const NODE_ENV = (process.env.NODE_ENV ?? '').toLowerCase();
const HEADER_OVERRIDE_ALLOWED =
  NODE_ENV === 'test' || (HEADER_OVERRIDE_ENABLED && NODE_ENV !== 'production');

function extractToken(req) {
  const header = req.headers?.authorization ?? req.headers?.Authorization;
  if (typeof header === 'string' && header.trim().toLowerCase().startsWith('bearer ')) {
    return header.trim().slice('bearer '.length);
  }
  if (Array.isArray(header) && header.length > 0) {
    return extractToken({ headers: { authorization: header[0] } });
  }
  if (req.headers?.['x-access-token']) {
    return String(req.headers['x-access-token']);
  }
  if (req.cookies?.accessToken) {
    return String(req.cookies.accessToken);
  }
  if (req.query?.accessToken) {
    return String(req.query.accessToken);
  }
  return null;
}

function parseHeaderOverride(req) {
  if (!HEADER_OVERRIDE_ALLOWED) {
    return null;
  }
  const rawId = req.headers?.['x-user-id'] ?? req.headers?.['x-actor-id'];
  const parsedId = Number.parseInt(rawId, 10);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return null;
  }
  const rawRoles = req.headers?.['x-roles'] ?? req.headers?.['x-user-roles'];
  const declaredType = req.headers?.['x-user-type'] ?? req.headers?.['x-session-type'];
  const roles = new Set();
  if (rawRoles) {
    String(rawRoles)
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
      .forEach((role) => roles.add(role));
  }
  if (declaredType) {
    roles.add(String(declaredType).trim().toLowerCase());
  }
  return {
    id: parsedId,
    roles: Array.from(roles),
    userType: declaredType ? String(declaredType).trim().toLowerCase() : null,
    source: 'header-override',
  };
}

async function hydrateUser(user, payload) {
  if (!user) {
    return null;
  }

  const memberships = await ProviderWorkspaceMember.findAll({
    where: { userId: user.id, status: 'active' },
    include: [
      {
        model: ProviderWorkspace,
        as: 'workspace',
        attributes: ['id', 'name', 'slug', 'type'],
      },
    ],
  });

  const membershipPayload = memberships.map((membership) => ({
    id: membership.id,
    workspaceId: membership.workspaceId,
    role: membership.role,
    status: membership.status,
    workspace: membership.workspace
      ? {
          id: membership.workspace.id,
          name: membership.workspace.name,
          slug: membership.workspace.slug,
          type: membership.workspace.type,
        }
      : null,
  }));

  const permissions = Array.isArray(payload?.permissions) ? payload.permissions : [];

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    userType: user.userType,
    memberships: membershipPayload,
    permissions,
  };
}

export async function resolveAuthenticatedUser(
  req,
  { optional = false, allowHeaderOverride = true } = {},
) {
  const token = extractToken(req);
  if (token) {
    let payload;
    try {
      payload = jwt.verify(token, resolveAccessTokenSecret());
    } catch (error) {
      throw new AuthenticationError('Invalid or expired authentication token.', { cause: error });
    }
    if (!payload?.id) {
      throw new AuthenticationError('Invalid authentication token.');
    }
    const user = await User.findByPk(payload.id, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'userType'],
    });
    if (!user) {
      throw new AuthenticationError('Account not found or inactive.');
    }
    return hydrateUser(user, payload);
  }

  const override = parseHeaderOverride(req);
  if (override) {
    return override;
  }

  if (optional) {
    return null;
  }
  throw new AuthenticationError('Authentication required.');
}

export function authenticateRequest({ optional = false, allowHeaderOverride = true } = {}) {
  return async function authenticationMiddleware(req, res, next) {
    try {
      const user = await resolveAuthenticatedUser(req, { optional, allowHeaderOverride });
      if (!user && !optional) {
        throw new AuthenticationError('Authentication required.');
      }
      if (user) {
        req.user = user;
      }
      return next();
    } catch (error) {
      if (optional && (error instanceof AuthenticationError || error instanceof AuthorizationError)) {
        return next();
      }
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        return res.status(401).json({ message: error.message });
      }
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        if (optional) {
          return next();
        }
        return res.status(401).json({ message: 'Authentication required.' });
      }
      return next(error);
    }
  };
}

export function authenticate(options = {}) {
  return authenticateRequest(options);
}

export function extractRoleSet(user) {
  const roles = new Set();
  if (!user) {
    return roles;
  }
  if (Array.isArray(user.roles)) {
    user.roles.map((role) => String(role).toLowerCase()).forEach((role) => roles.add(role));
  }
  if (user.userType) {
    roles.add(String(user.userType).toLowerCase());
  }
  if (Array.isArray(user.memberships)) {
    user.memberships
      .map((membership) => membership.role)
      .filter(Boolean)
      .map((role) => String(role).toLowerCase())
      .forEach((role) => roles.add(role));
  }
  return roles;
}

export function requireRoles(...allowedRoles) {
  const normalized = allowedRoles.flat().map((role) => String(role).toLowerCase());
  return function requireRolesMiddleware(req, _res, next) {
    if (!normalized.length) {
      return next();
    }
    const roles = extractRoleSet(req.user);
    const hasRole = normalized.some((role) => roles.has(role));
    if (!hasRole) {
      return next(new AuthorizationError('You do not have permission to access this resource.'));
    }
    return next();
  };
}

export default authenticateRequest;
