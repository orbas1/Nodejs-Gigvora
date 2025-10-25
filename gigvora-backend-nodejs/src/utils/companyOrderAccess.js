import { AuthorizationError } from './errors.js';
import { resolveRequestRoles } from '../middleware/authorization.js';
import { resolveRequestPermissions, resolveRequestUserId } from './requestContext.js';

const ORDER_MANAGER_ROLES = new Set([
  'company_admin',
  'company',
  'operations_lead',
  'operations',
  'project_manager',
  'project_management',
  'workspace_admin',
  'agency',
  'agency_admin',
  'admin',
]);

const ESCROW_MANAGER_ROLES = new Set([
  'finance',
  'finance_admin',
  'finance_manager',
  'trust',
  'compliance',
  'legal',
  'treasury',
  'company_admin',
  'workspace_admin',
  'admin',
]);

const MESSAGE_ROLES = new Set([
  'support',
  'customer_success',
  'account_manager',
  'community_manager',
  'operations',
  'operations_lead',
  'project_manager',
  'company',
  'company_admin',
  'workspace_admin',
  'admin',
]);

const ORDER_PERMISSION_SCOPES = new Set([
  'orders.manage',
  'orders.company.manage',
  'workspace.manage',
]);

const ESCROW_PERMISSION_SCOPES = new Set([
  'escrow.manage',
  'escrow.company.manage',
  'finance.manage',
]);

const MESSAGE_PERMISSION_SCOPES = new Set([
  'orders.chat.post',
  'orders.messages.manage',
  'support.manage',
]);

function toLowerSet(values) {
  if (!values) {
    return new Set();
  }
  if (values instanceof Set) {
    return new Set(Array.from(values, (value) => String(value).toLowerCase()));
  }
  if (Array.isArray(values)) {
    return new Set(values.map((value) => String(value).toLowerCase()));
  }
  return new Set([String(values).toLowerCase()]);
}

function hasMatchingScope(scopes, allowed) {
  for (const scope of scopes) {
    if (allowed.has(scope)) {
      return true;
    }
  }
  return false;
}

export function deriveCompanyOrderPermissions({
  ownerId,
  actorId,
  roles = new Set(),
  explicitPermissions = [],
} = {}) {
  const normalisedRoles = toLowerSet(roles);
  const normalisedPermissions = toLowerSet(explicitPermissions);
  const isOwner = actorId != null && ownerId != null && Number(ownerId) === Number(actorId);

  const canManageOrders =
    isOwner ||
    hasMatchingScope(normalisedPermissions, ORDER_PERMISSION_SCOPES) ||
    Array.from(normalisedRoles).some((role) => ORDER_MANAGER_ROLES.has(role));

  const canManageEscrow =
    isOwner ||
    hasMatchingScope(normalisedPermissions, ESCROW_PERMISSION_SCOPES) ||
    Array.from(normalisedRoles).some((role) => ESCROW_MANAGER_ROLES.has(role));

  const canPostMessages =
    canManageOrders ||
    hasMatchingScope(normalisedPermissions, MESSAGE_PERMISSION_SCOPES) ||
    Array.from(normalisedRoles).some((role) => MESSAGE_ROLES.has(role));

  return {
    canManageOrders,
    canManageEscrow,
    canPostMessages,
  };
}

export function buildCompanyOrderRequestContext(req, ownerId) {
  const actorId = resolveRequestUserId(req);
  const roles = resolveRequestRoles(req);
  const permissions = resolveRequestPermissions(req);
  const derived = deriveCompanyOrderPermissions({ ownerId, actorId, roles, explicitPermissions: permissions });
  return {
    ownerId,
    actorId,
    roles: Array.from(roles ?? []),
    permissions: derived,
  };
}

export function assertCanManageOrders(context) {
  if (context?.permissions?.canManageOrders) {
    return;
  }
  throw new AuthorizationError('Company order management requires an operations or admin role.', {
    code: 'ORDER_MANAGEMENT_FORBIDDEN',
  });
}

export function assertCanManageEscrow(context) {
  if (context?.permissions?.canManageEscrow) {
    return;
  }
  throw new AuthorizationError('Escrow updates require finance, trust, or admin permissions.', {
    code: 'ESCROW_MANAGEMENT_FORBIDDEN',
  });
}

export function assertCanPostMessages(context) {
  if (context?.permissions?.canPostMessages) {
    return;
  }
  throw new AuthorizationError('Posting timeline messages requires support, operations, or admin permissions.', {
    code: 'ORDER_MESSAGING_FORBIDDEN',
  });
}

export default {
  deriveCompanyOrderPermissions,
  buildCompanyOrderRequestContext,
  assertCanManageOrders,
  assertCanManageEscrow,
  assertCanPostMessages,
};
