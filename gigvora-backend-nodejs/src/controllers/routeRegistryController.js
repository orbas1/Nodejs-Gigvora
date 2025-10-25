import { AuthorizationError, NotFoundError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions, resolveRequestUserId } from '../utils/requestContext.js';
import {
  findRouteById,
  listRouteRegistry,
  syncRouteRegistry,
} from '../services/routeRegistryService.js';

const ADMIN_ROLES = new Set(['admin', 'platform_admin']);
const ADMIN_PERMISSIONS = new Set(['platform:routes:manage', 'platform:admin']);

function normaliseToken(value) {
  if (!value) {
    return null;
  }
  return `${value}`.trim().toLowerCase();
}

function ensureAdminActor(req) {
  const actorId = resolveRequestUserId(req);
  if (!actorId) {
    throw new AuthorizationError('Authentication is required.');
  }

  const roleTokens = new Set();
  const primaryRole = normaliseToken(req.user?.type ?? req.user?.role);
  if (primaryRole) {
    roleTokens.add(primaryRole);
  }
  if (Array.isArray(req.user?.roles)) {
    req.user.roles.forEach((role) => {
      const token = normaliseToken(role);
      if (token) {
        roleTokens.add(token);
      }
    });
  }

  const permissionTokens = new Set(
    resolveRequestPermissions(req)
      .map((permission) => normaliseToken(permission))
      .filter(Boolean),
  );

  const hasRole = Array.from(roleTokens).some((role) => ADMIN_ROLES.has(role));
  const hasPermission = Array.from(permissionTokens).some((permission) => ADMIN_PERMISSIONS.has(permission));

  if (!hasRole && !hasPermission) {
    throw new AuthorizationError('Route registry access requires administrator privileges.');
  }

  return {
    actorId,
    roles: Array.from(roleTokens),
    permissions: Array.from(permissionTokens),
  };
}

export async function index(req, res) {
  ensureAdminActor(req);
  const includeInactive = req.query?.includeInactive === 'true';
  const entries = await listRouteRegistry({ includeInactive });
  res.json({ routes: entries });
}

export async function sync(req, res) {
  const actor = ensureAdminActor(req);
  const summary = await syncRouteRegistry({ actor });
  res.json({ summary });
}

export async function show(req, res) {
  ensureAdminActor(req);
  const routeId = normaliseToken(req.params?.routeId);
  if (!routeId) {
    throw new ValidationError('routeId is required.');
  }
  const entry = await findRouteById(routeId);
  if (!entry) {
    throw new NotFoundError('Route not found.');
  }
  res.json({ route: entry });
}

export default {
  index,
  show,
  sync,
};
