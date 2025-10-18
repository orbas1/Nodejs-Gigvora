export const ADMIN_ACCESS_ALIASES = new Set(['admin', 'administrator', 'super-admin', 'superadmin']);

export function normalizeToLowercaseArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item !== 'string') {
        return null;
      }
      const trimmed = item.trim();
      return trimmed ? trimmed.toLowerCase() : null;
    })
    .filter(Boolean);
}

export function normalizeToLowercaseString(value) {
  if (value == null) {
    return '';
  }

  return `${value}`.trim().toLowerCase();
}

export function deriveAdminAccess(session) {
  const normalizedMemberships = normalizeToLowercaseArray(session?.memberships);
  const normalizedRoles = normalizeToLowercaseArray(session?.roles);
  const normalizedPermissions = normalizeToLowercaseArray(session?.permissions);
  const normalizedCapabilities = normalizeToLowercaseArray(session?.capabilities);
  const sessionRole = normalizeToLowercaseString(session?.role ?? session?.user?.role);
  const sessionUserType = normalizeToLowercaseString(session?.user?.userType ?? session?.userType);
  const primaryDashboard = normalizeToLowercaseString(session?.primaryDashboard ?? session?.user?.primaryDashboard);

  const permissionAccess =
    normalizedPermissions.includes('admin:full') || normalizedCapabilities.includes('admin:access');

  const hasAdminSeat =
    permissionAccess ||
    normalizedMemberships.some((membership) => ADMIN_ACCESS_ALIASES.has(membership)) ||
    normalizedRoles.some((role) => ADMIN_ACCESS_ALIASES.has(role)) ||
    ADMIN_ACCESS_ALIASES.has(sessionRole) ||
    ADMIN_ACCESS_ALIASES.has(sessionUserType);

  const hasAdminAccess = hasAdminSeat || primaryDashboard === 'admin';

  return {
    normalizedMemberships,
    normalizedRoles,
    normalizedPermissions,
    normalizedCapabilities,
    sessionRole,
    sessionUserType,
    primaryDashboard,
    hasAdminSeat,
    hasAdminAccess,
  };
}

export default {
  ADMIN_ACCESS_ALIASES,
  normalizeToLowercaseArray,
  normalizeToLowercaseString,
  deriveAdminAccess,
};
