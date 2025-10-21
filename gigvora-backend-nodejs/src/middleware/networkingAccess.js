import { AuthorizationError } from '../utils/errors.js';

const ALLOWED_WORKSPACE_TYPES = new Set(['company', 'agency']);
const ALLOWED_ROLES = new Set(['owner', 'admin', 'manager']);

function mergePermissions(user, auth) {
  const userPermissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const authPermissions = Array.isArray(auth?.permissions)
    ? auth.permissions
    : Array.isArray(auth?.scopes)
    ? auth.scopes
    : [];

  return new Set(
    [...userPermissions, ...authPermissions].map((value) => `${value}`.trim().toLowerCase()).filter(Boolean),
  );
}

function resolveWorkspaceId(value) {
  const numeric = Number.parseInt(value, 10);
  return Number.isInteger(numeric) ? numeric : null;
}

function normaliseWorkspaceIds(ids) {
  if (!Array.isArray(ids)) {
    return [];
  }
  const seen = new Set();
  const normalised = [];
  for (const value of ids) {
    const resolved = resolveWorkspaceId(value?.workspaceId ?? value);
    if (Number.isInteger(resolved) && !seen.has(resolved)) {
      seen.add(resolved);
      normalised.push(resolved);
    }
  }
  return normalised;
}

export function requireNetworkingManager() {
  return function networkingAccessMiddleware(req, res, next) {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const memberships = Array.isArray(user.memberships) ? user.memberships : [];
    const activeMemberships = memberships.filter((membership) => membership?.status === 'active');

    const allowedMemberships = activeMemberships.filter((membership) => {
      const workspaceType = membership?.workspace?.type;
      const role = membership?.role;
      return workspaceType && ALLOWED_WORKSPACE_TYPES.has(workspaceType) && ALLOWED_ROLES.has(role);
    });

    const permissionSet = mergePermissions(user, req.auth);

    const hasGlobalPermission =
      permissionSet.has('networking.manage') || permissionSet.has('networking.manage.any');

    if (!allowedMemberships.length && !hasGlobalPermission) {
      const error = new AuthorizationError(
        'Networking hub access is limited to approved company or agency managers.',
      );
      return next(error);
    }

    const permittedWorkspaceIds = hasGlobalPermission
      ? normaliseWorkspaceIds(activeMemberships)
      : normaliseWorkspaceIds(allowedMemberships);

    const companyWorkspaceId = resolveWorkspaceId(user?.companyId);
    const defaultWorkspaceId =
      (hasGlobalPermission && companyWorkspaceId != null
        ? companyWorkspaceId
        : permittedWorkspaceIds[0] ?? companyWorkspaceId ?? null);

    req.networkingAccess = {
      permittedWorkspaceIds,
      defaultWorkspaceId,
    };

    return next();
  };
}

export default requireNetworkingManager;
