const AGENCY_ACCESS_ALIASES = new Set([
  'agency',
  'agency_member',
  'agency-admin',
  'agency_admin',
  'agency-owner',
  'agency_owner',
  'agency-manager',
  'agency_manager',
  'agency-lead',
  'agency_lead',
  'agency-operator',
  'agency_operator',
  'agency-ops',
  'agency_ops',
  'admin',
  'administrator',
  'superadmin',
  'super-admin',
]);

const AGENCY_MANAGEMENT_ALIASES = new Set([
  'agency-admin',
  'agency_admin',
  'agency-owner',
  'agency_owner',
  'agency-manager',
  'agency_manager',
  'agency-lead',
  'agency_lead',
  'agency-operator',
  'agency_operator',
  'agency-director',
  'agency_director',
  'agency-executive',
  'agency_executive',
  'admin',
  'administrator',
  'superadmin',
  'super-admin',
]);

const ACCESS_PERMISSIONS = new Set(['agency:access', 'agency:read', 'agency:full', 'admin:full']);
const MANAGEMENT_PERMISSIONS = new Set(['agency:manage', 'agency:admin', 'agency:full', 'admin:full']);

const ACCESS_CAPABILITIES = new Set(['agency:access', 'agency:read', 'agency:full', 'platform:agency']);
const MANAGEMENT_CAPABILITIES = new Set(['agency:manage', 'agency:admin', 'agency:full', 'platform:agency']);

function normalizeList(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => (entry == null ? '' : String(entry).trim().toLowerCase()))
      .filter(Boolean);
  }
  return [String(value).trim().toLowerCase()].filter(Boolean);
}

export function deriveAgencyAccess(session) {
  if (!session) {
    return {
      hasAgencyAccess: false,
      hasAgencyManagementAccess: false,
      memberships: [],
      roles: [],
      permissions: [],
      capabilities: [],
    };
  }

  const memberships = normalizeList(session.memberships);
  const roles = normalizeList(session.roles);
  const permissions = normalizeList(session.permissions);
  const capabilities = normalizeList(session.capabilities);
  const userType = normalizeList(session.userType);
  const primaryDashboard = normalizeList(session.primaryDashboard);
  const accountRole = normalizeList(session.role);

  const aliasCandidates = new Set([
    ...memberships,
    ...roles,
    ...userType,
    ...accountRole,
  ]);

  const hasAliasAccess = Array.from(aliasCandidates).some((value) => AGENCY_ACCESS_ALIASES.has(value));
  const hasAliasManagement = Array.from(aliasCandidates).some((value) => AGENCY_MANAGEMENT_ALIASES.has(value));

  const hasPermissionAccess = permissions.some((value) => ACCESS_PERMISSIONS.has(value));
  const hasPermissionManagement = permissions.some((value) => MANAGEMENT_PERMISSIONS.has(value));

  const hasCapabilityAccess = capabilities.some((value) => ACCESS_CAPABILITIES.has(value));
  const hasCapabilityManagement = capabilities.some((value) => MANAGEMENT_CAPABILITIES.has(value));

  const hasAgencyAccess =
    hasAliasAccess || hasPermissionAccess || hasCapabilityAccess || primaryDashboard.includes('agency');

  const hasAgencyManagementAccess = hasAliasManagement || hasPermissionManagement || hasCapabilityManagement;

  return {
    hasAgencyAccess,
    hasAgencyManagementAccess,
    memberships,
    roles,
    permissions,
    capabilities,
  };
}

export default deriveAgencyAccess;
