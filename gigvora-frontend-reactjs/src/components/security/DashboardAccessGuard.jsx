import PropTypes from 'prop-types';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import useSession from '../../hooks/useSession.js';

function formatList(values, { transform } = {}) {
  if (!Array.isArray(values)) {
    return null;
  }

  const normalized = values
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean)
    .map((value) => (transform ? transform(value) : value))
    .filter(Boolean);

  if (!normalized.length) {
    return null;
  }

  if (normalized.length === 1) {
    return normalized[0];
  }

  return `${normalized.slice(0, -1).join(', ')} or ${normalized.at(-1)}`;
}

function toTitleCase(value) {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeRoles(session) {
  const roles = new Set();
  if (!session) {
    return roles;
  }

  if (Array.isArray(session.roles)) {
    session.roles.filter(Boolean).forEach((role) => roles.add(role));
  }

  if (typeof session.role === 'string' && session.role) {
    roles.add(session.role);
  }

  if (Array.isArray(session.memberships)) {
    session.memberships.filter(Boolean).forEach((role) => roles.add(role));
  }

  if (session.dashboards && typeof session.dashboards === 'object') {
    Object.keys(session.dashboards)
      .filter(Boolean)
      .forEach((role) => roles.add(role));
  }

  return roles;
}

function normalizePermissions(session) {
  const permissions = new Set();
  if (!session) {
    return permissions;
  }

  if (Array.isArray(session.permissions)) {
    session.permissions.filter(Boolean).forEach((perm) => permissions.add(perm));
  }

  if (session.capabilities && typeof session.capabilities === 'object') {
    Object.entries(session.capabilities).forEach(([key, value]) => {
      if (value) {
        permissions.add(key);
      }
    });
  }

  return permissions;
}

export default function DashboardAccessGuard({
  requiredRoles,
  allowedRoles,
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

  const roleRequirements = requiredRoles ?? allowedRoles;
  const hasRole = !roleRequirements?.length || roleRequirements.some((role) => normalizedRoles.has(role));
  const hasPermission =
    !requiredPermissions?.length ||
    requiredPermissions.some((permission) => normalizedPermissions.has(permission));

  const formattedRoles = formatList(roleRequirements, { transform: toTitleCase });
  const formattedPermissions = formatList(requiredPermissions);
  const roleRequirementText = formattedRoles
    ? `This dashboard is limited to ${formattedRoles} workspaces.`
    : 'This dashboard is limited to approved workspaces.';
  const permissionRequirementText = formattedPermissions
    ? ` It also requires ${formattedPermissions} permissions.`
    : '';

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
              {roleRequirementText}
              {permissionRequirementText}
              {' '}
              Please switch to an account with the proper access or contact your workspace owner.
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
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  requiredPermissions: PropTypes.arrayOf(PropTypes.string),
  fallback: PropTypes.node,
  children: PropTypes.node.isRequired,
};
