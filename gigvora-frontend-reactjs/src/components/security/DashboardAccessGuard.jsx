import PropTypes from 'prop-types';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import useSession from '../../hooks/useSession.js';

function normaliseKey(value) {
  if (value == null) {
    return null;
  }

  if (typeof value === 'object' && 'key' in value) {
    return normaliseKey(value.key);
  }

  const stringValue = typeof value === 'string' ? value : String(value);
  const trimmed = stringValue.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/[^a-z0-9]+/g, '_');
}

function normalizeRoles(session) {
  const roles = new Set();
  if (!session) {
    return roles;
  }

  const register = (value) => {
    const normalised = normaliseKey(value);
    if (normalised) {
      roles.add(normalised);
    }
  };

  if (Array.isArray(session.roles)) {
    session.roles.forEach(register);
  }

  if (typeof session.role === 'string') {
    register(session.role);
  }

  if (Array.isArray(session.memberships)) {
    session.memberships.forEach(register);
  }

  if (Array.isArray(session.accountTypes)) {
    session.accountTypes.forEach(register);
  }

  if (Array.isArray(session.roleKeys)) {
    session.roleKeys.forEach(register);
  }

  if (session.dashboards && typeof session.dashboards === 'object') {
    Object.keys(session.dashboards).forEach(register);
  }

  if (session.primaryDashboard) {
    register(session.primaryDashboard);
  }

  return roles;
}

function normalizePermissions(session) {
  const permissions = new Set();
  if (!session) {
    return permissions;
  }

  const register = (value) => {
    const normalised = normaliseKey(value);
    if (normalised) {
      permissions.add(normalised);
    }
  };

  if (Array.isArray(session.permissions)) {
    session.permissions.forEach(register);
  }

  if (Array.isArray(session.permissionKeys)) {
    session.permissionKeys.forEach(register);
  }

  if (session.capabilities && typeof session.capabilities === 'object') {
    Object.entries(session.capabilities).forEach(([key, value]) => {
      if (value) {
        register(key);
      }
    });
  }

  if (Array.isArray(session.features)) {
    session.features.forEach(register);
  }

  if (Array.isArray(session.scopes)) {
    session.scopes.forEach(register);
  }

  return permissions;
}

export default function DashboardAccessGuard({
  requiredRoles,
  requiredPermissions,
  fallback,
  children,
}) {
  const { session, isAuthenticated } = useSession();

  if (!isAuthenticated) {
    return (
      fallback ?? (
        <div className="flex min-h-[50vh] items-center justify-center bg-slate-50 px-6 py-16">
          <div className="max-w-lg space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <ShieldCheckIcon className="h-8 w-8" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Sign in to access this dashboard</h1>
            <p className="text-sm text-slate-600">
              You need to be authenticated with the appropriate workspace permissions to view this area. Contact your Gigvora
              administrator if you believe this is an error.
            </p>
          </div>
        </div>
      )
    );
  }

  const normalizedRoles = normalizeRoles(session);
  const normalizedPermissions = normalizePermissions(session);

  const requiredRoleKeys = (requiredRoles ?? [])
    .map(normaliseKey)
    .filter(Boolean);
  const requiredPermissionKeys = (requiredPermissions ?? [])
    .map(normaliseKey)
    .filter(Boolean);

  const hasRole = !requiredRoleKeys.length || requiredRoleKeys.some((role) => normalizedRoles.has(role));
  const hasPermission =
    !requiredPermissionKeys.length ||
    requiredPermissionKeys.some((permission) => normalizedPermissions.has(permission));

  if (!hasRole || !hasPermission) {
    return (
      fallback ?? (
        <div className="flex min-h-[50vh] items-center justify-center bg-slate-50 px-6 py-16">
          <div className="max-w-lg space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <ShieldCheckIcon className="h-8 w-8" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Access restricted</h1>
            <p className="text-sm text-slate-600">
              This dashboard is limited to approved roles. Please switch to an account with headhunter permissions or request
              access from your workspace owner.
            </p>
          </div>
        </div>
      )
    );
  }

  return children;
}

DashboardAccessGuard.propTypes = {
  requiredRoles: PropTypes.arrayOf(PropTypes.string),
  requiredPermissions: PropTypes.arrayOf(PropTypes.string),
  fallback: PropTypes.node,
  children: PropTypes.node.isRequired,
};
