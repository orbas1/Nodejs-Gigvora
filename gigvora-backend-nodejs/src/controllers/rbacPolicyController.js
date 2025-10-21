import {
  getPolicyMatrix,
  listPolicyAuditEvents,
  evaluateAccess,
  recordPolicyEvent,
} from '../services/rbacPolicyService.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions, resolveRequestUserId } from '../utils/requestContext.js';

const ROLE_TO_PERSONA = new Map([
  ['admin', 'platform_admin'],
  ['platform_admin', 'platform_admin'],
  ['platform-operations', 'platform_admin'],
  ['security', 'security_officer'],
  ['security_officer', 'security_officer'],
  ['security-ops', 'security_officer'],
  ['security_operations', 'security_officer'],
  ['compliance', 'compliance_manager'],
  ['compliance_manager', 'compliance_manager'],
  ['legal', 'compliance_manager'],
  ['operations', 'operations_lead'],
  ['operations_lead', 'operations_lead'],
  ['site-reliability', 'operations_lead'],
  ['sre', 'operations_lead'],
]);

const VIEW_PERMISSIONS = new Set([
  'governance:rbac:view',
  'governance:rbac:manage',
  'rbac:view',
  'rbac:manage',
  'security:rbac:view',
  'security:rbac',
]);

const MANAGE_PERMISSIONS = new Set(['governance:rbac:manage', 'rbac:manage', 'security:rbac']);

const VIEW_ROLES = new Set([
  'admin',
  'platform_admin',
  'security',
  'security_officer',
  'security-ops',
  'security_operations',
  'compliance',
  'compliance_manager',
  'legal',
  'operations',
  'operations_lead',
  'site-reliability',
  'sre',
]);

const MANAGE_ROLES = new Set([
  'admin',
  'platform_admin',
  'security',
  'security_officer',
  'security-ops',
  'security_operations',
]);

function normalise(value) {
  if (!value) {
    return null;
  }
  return `${value}`.trim().toLowerCase();
}

function collectRoles(req) {
  const roles = new Set();
  if (Array.isArray(req.user?.roles)) {
    req.user.roles.forEach((role) => {
      const normalised = normalise(role);
      if (normalised) {
        roles.add(normalised);
      }
    });
  }

  const headerRoles = req.headers?.['x-roles'];
  if (typeof headerRoles === 'string') {
    headerRoles
      .split(',')
      .map((value) => normalise(value))
      .filter(Boolean)
      .forEach((role) => roles.add(role));
  }

  const primaryRole = normalise(req.user?.type ?? req.user?.role);
  if (primaryRole) {
    roles.add(primaryRole);
  }

  return roles;
}

function collectPermissions(req) {
  return new Set(resolveRequestPermissions(req).map((permission) => normalise(permission)).filter(Boolean));
}

function resolveAllowedPersonas(roles, permissions) {
  const personas = new Set();
  roles.forEach((role) => {
    const persona = ROLE_TO_PERSONA.get(role);
    if (persona) {
      personas.add(persona);
    }
  });

  if (permissions.has('governance:rbac:manage') || roles.has('admin') || roles.has('platform_admin')) {
    personas.add('platform_admin');
    personas.add('security_officer');
    personas.add('compliance_manager');
    personas.add('operations_lead');
  }

  return personas;
}

function ensureGovernanceAccess(req, { manage = false } = {}) {
  const actorId = resolveRequestUserId(req);
  if (!actorId) {
    throw new AuthenticationError('Authentication is required for RBAC governance.');
  }

  const roles = collectRoles(req);
  const permissions = collectPermissions(req);
  const allowedPersonas = resolveAllowedPersonas(roles, permissions);

  const hasViewPrivilege =
    allowedPersonas.size > 0 ||
    rolesHasAny(roles, VIEW_ROLES) ||
    permissionsHasAny(permissions, VIEW_PERMISSIONS);

  if (!hasViewPrivilege) {
    throw new AuthorizationError('RBAC governance access is restricted to security and operations personnel.');
  }

  const hasManagePrivilege =
    rolesHasAny(roles, MANAGE_ROLES) || permissionsHasAny(permissions, MANAGE_PERMISSIONS);

  if (manage && !hasManagePrivilege) {
    throw new AuthorizationError('RBAC policy simulations require elevated governance permissions.');
  }

  return {
    actorId,
    roles,
    permissions,
    personas: allowedPersonas,
    canManage: hasManagePrivilege,
  };
}

function rolesHasAny(roles, allowed) {
  for (const role of roles) {
    if (allowed.has(role)) {
      return true;
    }
  }
  return false;
}

function permissionsHasAny(permissions, allowed) {
  for (const permission of permissions) {
    if (allowed.has(permission)) {
      return true;
    }
  }
  return false;
}

function resolvePersonaKey(req, context) {
  const requested = normalise(req.body?.persona ?? req.query?.persona);
  if (!requested) {
    return context.personas.values().next().value ?? 'platform_admin';
  }

  if (context.personas.has(requested)) {
    return requested;
  }

  const roleBasedPersona = ROLE_TO_PERSONA.get(requested);
  if (roleBasedPersona && context.personas.has(roleBasedPersona)) {
    return roleBasedPersona;
  }

  if (context.canManage) {
    return roleBasedPersona ?? requested;
  }

  throw new AuthorizationError('You are not permitted to act as the requested persona.');
}

function resolveActor(req, context) {
  return {
    id: context?.actorId ?? req.user?.id ?? null,
    type: req.user?.type ?? 'admin',
    email: req.user?.email || req.headers?.['x-user-email'] || null,
  };
}

function resolveRequestContext(req) {
  return {
    id: req.id ?? req.correlationId ?? null,
    path: req.path,
    method: req.method,
    ip: req.ip ?? req.connection?.remoteAddress ?? null,
    userAgent: req.headers?.['user-agent'] ?? null,
  };
}

async function audit({ req, policyKey, persona, resource, action, decision, reason, constraints, metadata, status, context }) {
  await recordPolicyEvent({
    policyKey,
    persona,
    resource,
    action,
    decision,
    reason,
    constraints,
    actor: resolveActor(req, context),
    request: resolveRequestContext(req),
    responseStatus: status,
    metadata,
  });
}

function parseLimit(value) {
  if (value == null || value === '') {
    return undefined;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('limit must be a positive integer.');
  }
  return Math.min(numeric, 200);
}

function parseOffset(value) {
  if (value == null || value === '') {
    return undefined;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric < 0) {
    throw new ValidationError('offset must be zero or a positive integer.');
  }
  return numeric;
}

export async function matrix(req, res) {
  const context = ensureGovernanceAccess(req, { manage: false });
  const persona = resolvePersonaKey(req, context);
  const matrix = getPolicyMatrix();

  await audit({
    req,
    context,
    policyKey: 'governance.rbac.matrix',
    persona,
    resource: 'governance.rbac',
    action: 'view',
    decision: 'allow',
    metadata: { route: 'matrix' },
    status: 200,
  });

  res.json({
    version: matrix.version,
    publishedAt: matrix.publishedAt,
    reviewCadenceDays: matrix.reviewCadenceDays,
    personas: matrix.personas,
    guardrails: matrix.guardrails,
    resources: matrix.resources,
  });
}

export async function auditLog(req, res) {
  const context = ensureGovernanceAccess(req, { manage: true });
  const persona = resolvePersonaKey(req, context);
  const filters = {
    policyKey: req.query?.policyKey,
    persona: req.query?.persona,
    resource: req.query?.resource,
    action: req.query?.action,
    decision: req.query?.decision,
    search: req.query?.search,
    from: req.query?.from,
    to: req.query?.to,
    limit: parseLimit(req.query?.limit),
    offset: parseOffset(req.query?.offset),
  };
  const result = await listPolicyAuditEvents(filters);

  await audit({
    req,
    context,
    policyKey: 'governance.rbac.matrix',
    persona,
    resource: 'governance.rbac',
    action: 'audit-log',
    decision: 'allow',
    metadata: { route: 'audit-log', query: filters },
    status: 200,
  });

  res.json(result);
}

export async function simulate(req, res) {
  const context = ensureGovernanceAccess(req, { manage: true });
  const personaKey = resolvePersonaKey(req, context);
  const resourceKey = normalise(req.body?.resource);
  const action = normalise(req.body?.action);

  if (!resourceKey) {
    throw new ValidationError('resource is required for policy simulation.');
  }
  if (!action) {
    throw new ValidationError('action is required for policy simulation.');
  }

  const evaluation = evaluateAccess({ personaKey, resourceKey, action });
  const status = evaluation.allowed ? 200 : 403;

  await audit({
    req,
    context,
    policyKey: evaluation.policyKey ?? 'governance.rbac.matrix',
    persona: personaKey,
    resource: resourceKey,
    action,
    decision: evaluation.allowed ? 'allow' : 'deny',
    reason: evaluation.reason,
    constraints: evaluation.constraints,
    metadata: { route: 'simulate' },
    status,
  });

  res.status(status).json({
    persona: personaKey,
    resource: resourceKey,
    action,
    decision: evaluation.allowed ? 'allow' : 'deny',
    reason: evaluation.reason ?? null,
    constraints: evaluation.constraints ?? [],
    policyKey: evaluation.policyKey ?? null,
    auditRetentionDays: evaluation.auditRetentionDays ?? null,
  });
}

export default {
  matrix,
  auditLog,
  simulate,
};
