import { AuthorizationError } from '../utils/errors.js';

const ALLOWED_WORKSPACE_TYPES = new Set(['company', 'agency']);
const ALLOWED_ROLES = new Set(['owner', 'admin', 'manager']);

function normaliseWorkspaceIds(ids) {
  if (!Array.isArray(ids)) {
    return [];
  }
  return ids
    .map((value) => Number.parseInt(value?.workspaceId ?? value, 10))
    .filter((value) => Number.isInteger(value));
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

    const permissionSet = new Set(
      Array.isArray(user.permissions) ? user.permissions.map((value) => `${value}`.toLowerCase()) : [],
    );

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

    req.networkingAccess = {
      permittedWorkspaceIds,
      defaultWorkspaceId: permittedWorkspaceIds[0] ?? user.companyId ?? null,
    };

    return next();
  };
}

export default requireNetworkingManager;
