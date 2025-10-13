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
