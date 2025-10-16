import {
  getPolicyMatrix,
  listPolicyAuditEvents,
  evaluateAccess,
  recordPolicyEvent,
} from '../services/rbacPolicyService.js';

const ROLE_TO_PERSONA = new Map([
  ['admin', 'platform_admin'],
  ['platform_admin', 'platform_admin'],
  ['platform-operations', 'platform_admin'],
  ['security', 'security_officer'],
  ['security_officer', 'security_officer'],
  ['security-ops', 'security_officer'],
  ['compliance', 'compliance_manager'],
  ['compliance_manager', 'compliance_manager'],
  ['legal', 'compliance_manager'],
  ['operations', 'operations_lead'],
  ['operations_lead', 'operations_lead'],
  ['site-reliability', 'operations_lead'],
]);

function normalise(value) {
  if (!value) {
    return null;
  }
  return `${value}`.trim().toLowerCase();
}

function resolvePersona(req) {
  const explicitPersona = normalise(req.body?.persona || req.query?.persona);
  if (explicitPersona && ROLE_TO_PERSONA.has(explicitPersona)) {
    return ROLE_TO_PERSONA.get(explicitPersona);
  }

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

  for (const role of roles) {
    if (ROLE_TO_PERSONA.has(role)) {
      return ROLE_TO_PERSONA.get(role);
    }
  }

  if (roles.has('admin') || roles.has('platform_admin')) {
    return 'platform_admin';
  }

  return explicitPersona ?? 'platform_admin';
}

function resolveActor(req) {
  return {
    id: req.user?.id ?? null,
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

async function audit({ req, policyKey, persona, resource, action, decision, reason, constraints, metadata, status }) {
  await recordPolicyEvent({
    policyKey,
    persona,
    resource,
    action,
    decision,
    reason,
    constraints,
    actor: resolveActor(req),
    request: resolveRequestContext(req),
    responseStatus: status,
    metadata,
  });
}

export async function matrix(req, res) {
  const persona = resolvePersona(req);
  const matrix = getPolicyMatrix();

  await audit({
    req,
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
  const persona = resolvePersona(req);
  const filters = {
    policyKey: req.query?.policyKey,
    persona: req.query?.persona,
    resource: req.query?.resource,
    action: req.query?.action,
    decision: req.query?.decision,
    search: req.query?.search,
    from: req.query?.from,
    to: req.query?.to,
    limit: req.query?.limit,
    offset: req.query?.offset,
  };
  const result = await listPolicyAuditEvents(filters);

  await audit({
    req,
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
  const personaKey = normalise(req.body?.persona) ?? resolvePersona(req);
  const resourceKey = req.body?.resource;
  const action = req.body?.action;

  const evaluation = evaluateAccess({ personaKey, resourceKey, action });
  const status = evaluation.allowed ? 200 : 403;

  await audit({
    req,
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
