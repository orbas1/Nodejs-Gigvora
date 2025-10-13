import jwt from 'jsonwebtoken';
import {
  User,
  ProviderWorkspaceMember,
  ProviderWorkspace,
} from '../models/index.js';

const DEFAULT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret';

function extractToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
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

async function buildRequestUser(user, tokenPayload) {
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

  const permissions = Array.isArray(tokenPayload?.permissions)
    ? tokenPayload.permissions
    : [];

  const defaultCompanyMembership = membershipPayload.find(
    (membership) => membership.workspace?.type === 'company',
  );

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    userType: user.userType,
    memberships: membershipPayload,
    permissions,
    companyId: defaultCompanyMembership?.workspaceId ?? null,
  };
}

export function authenticateRequest({ optional = false } = {}) {
  return async function authenticateMiddleware(req, res, next) {
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
        return res.status(401).json({ message: 'Authentication required.' });
      }

      const payload = jwt.verify(token, DEFAULT_SECRET);
      const user = await User.findByPk(payload.id, {
        attributes: ['id', 'email', 'firstName', 'lastName', 'userType'],
      });

      if (!user) {
        if (optional) {
          return next();
        }
        return res.status(401).json({ message: 'Authentication required.' });
      }

      req.user = await buildRequestUser(user, payload);
      return next();
    } catch (error) {
      if (optional && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
        return next();
      }
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Authentication required.' });
      }
      return next(error);
    }
  };
}

export default authenticateRequest;
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
import { User, FreelancerProfile } from '../models/index.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';

function normaliseRole(value) {
  if (!value) return null;
  return `${value}`.trim().toLowerCase().replace(/\s+/g, '-');
}

function parseHeaderRoles(headerValue) {
  if (!headerValue) return [];
  return `${headerValue}`
    .split(',')
    .map(normaliseRole)
    .filter(Boolean);
}

const HEADER_OVERRIDE_ENABLED = (process.env.AUTH_HEADER_OVERRIDE ?? '').toLowerCase() === 'true';

export function authenticate({ optional = false } = {}) {
  return async function authenticateMiddleware(req, _res, next) {
    const authHeader = req.headers?.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : null;

    if (!token) {
      const allowHeaderFallback =
        HEADER_OVERRIDE_ENABLED || (process.env.NODE_ENV !== 'production' && process.env.AUTH_HEADER_OVERRIDE !== 'false');

      if (allowHeaderFallback) {
        const headerUserId = req.headers?.['x-user-id'] ?? req.headers?.['x-actor-id'];
        const parsedUserId = Number.parseInt(headerUserId, 10);
        if (Number.isInteger(parsedUserId) && parsedUserId > 0) {
          const roles = new Set(parseHeaderRoles(req.headers?.['x-roles'] ?? req.headers?.['x-user-roles']));
          const declaredType = req.headers?.['x-user-type'] ?? req.headers?.['x-session-type'];
          if (declaredType) {
            roles.add(normaliseRole(declaredType));
          }
          req.user = {
            id: parsedUserId,
            type: declaredType ? normaliseRole(declaredType) : null,
            roles: Array.from(roles.values()).filter(Boolean),
            source: 'header-override',
          };
          return next();
        }
      }

      if (optional) {
        return next();
      }

      return next(new AuthenticationError('Authentication token is required.'));
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(payload.id, { attributes: ['id', 'userType'] });
      if (!user) {
        throw new AuthenticationError('The authenticated user could not be resolved.');
      }

      const roles = new Set();
      if (payload.type) {
        roles.add(normaliseRole(payload.type));
      }
      if (Array.isArray(payload.roles)) {
        payload.roles.map(normaliseRole).forEach((role) => role && roles.add(role));
      }
      if (user.userType) {
        roles.add(normaliseRole(user.userType));
      }

      if (!roles.has('freelancer')) {
        const freelancerProfile = await FreelancerProfile.findOne({
          where: { userId: user.id },
          attributes: ['id'],
        });
        if (freelancerProfile) {
          roles.add('freelancer');
        }
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
        type: normaliseRole(user.userType),
        roles: Array.from(roles.values()).filter(Boolean),
        source: 'bearer-token',
      };
      return next();
    } catch (error) {
      const message =
        error instanceof AuthenticationError || error.name === 'JsonWebTokenError'
          ? 'Invalid or expired authentication token.'
          : 'Unable to authenticate request.';
      return next(new AuthenticationError(message, { cause: error instanceof Error ? error.message : String(error) }));
    }
  };
}

export function requireRoles(allowedRoles = []) {
  const required = allowedRoles.map(normaliseRole).filter(Boolean);
  return function requireRolesMiddleware(req, _res, next) {
    if (!req.user) {
      return next(new AuthenticationError('Authentication is required for this action.'));
    }
    if (required.length === 0) {
      return next();
    }

    const availableRoles = new Set((req.user.roles ?? []).map(normaliseRole).filter(Boolean));
    if (req.user.type) {
      availableRoles.add(normaliseRole(req.user.type));
    }

    const hasRole = required.some((role) => availableRoles.has(role));
    if (!hasRole) {
      return next(
        new AuthorizationError('You do not have the required permissions to access this workspace.', {
          required,
          available: Array.from(availableRoles),
        }),
      );
    }

    return next();
  };
}

export default {
  authenticate,
  requireRoles,
};
