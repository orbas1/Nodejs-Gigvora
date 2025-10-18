import { Op } from 'sequelize';
import { RbacPolicyAuditEvent } from '../models/rbacPolicyAuditEvent.js';
import logger from '../utils/logger.js';

const RBAC_MATRIX_VERSION = '2024.10.21';
const RBAC_MATRIX = {
  version: RBAC_MATRIX_VERSION,
  publishedAt: '2024-10-21T08:00:00.000Z',
  reviewCadenceDays: 30,
  personas: [
    {
      key: 'platform_admin',
      label: 'Platform Administrator',
      description:
        'Owns production configuration, runtime observability, and emergency response for the Gigvora tenancy.',
      defaultChannels: ['email', 'slack'],
      escalationTarget: 'security.operations',
      grants: [
        {
          policyKey: 'platform.runtime.control',
          resource: 'runtime.telemetry',
          actions: ['view', 'acknowledge', 'export'],
          decision: 'allow',
          constraints: [
            'Session must be protected with platform-enforced WebAuthn or TOTP.',
            'Export actions require a recorded incident number before download completes.',
          ],
          auditRetentionDays: 365,
        },
        {
          policyKey: 'platform.settings.manage',
          resource: 'platform.settings',
          actions: ['view', 'update', 'rotate-secrets'],
          decision: 'allow',
          constraints: [
            'Changes limited to maintenance windows approved in platform settings.',
            'Secret rotations require dual-approval captured through runtime security audits.',
          ],
          auditRetentionDays: 730,
        },
        {
          policyKey: 'governance.rbac.matrix',
          resource: 'governance.rbac',
          actions: ['view', 'simulate', 'export'],
          decision: 'allow',
          constraints: [
            'Policy simulations must cite the incident or review ticket driving the analysis.',
            'Exports are watermarked and logged; distribution outside operations requires compliance approval.',
          ],
          auditRetentionDays: 365,
        },
      ],
    },
    {
      key: 'security_officer',
      label: 'Security Officer',
      description:
        'Responsible for abuse triage, RBAC governance, and security perimeter enforcement across web and mobile surfaces.',
      defaultChannels: ['pagerduty', 'slack'],
      escalationTarget: 'chief.security.officer',
      grants: [
        {
          policyKey: 'platform.runtime.control',
          resource: 'runtime.telemetry',
          actions: ['view', 'acknowledge'],
          decision: 'allow',
          constraints: [
            'Acknowledgements must include remediation summary for audit purposes.',
          ],
          auditRetentionDays: 365,
        },
        {
          policyKey: 'governance.rbac.matrix',
          resource: 'governance.rbac',
          actions: ['view', 'simulate'],
          decision: 'allow',
          constraints: [
            'Simulations that would reduce guard coverage require compliance sign-off before execution.',
          ],
          auditRetentionDays: 365,
        },
        {
          policyKey: 'security.perimeter.rules',
          resource: 'security.waf',
          actions: ['view', 'create-temporary-rule', 'expire-temporary-rule'],
          decision: 'allow',
          constraints: [
            'Temporary rules expire automatically after 6 hours unless extended by platform administrators.',
            'Abuse justifications are mandatory and included in audit metadata.',
          ],
          auditRetentionDays: 180,
        },
      ],
    },
    {
      key: 'compliance_manager',
      label: 'Compliance Manager',
      description:
        'Maintains legal policy parity, monitors consent and audit readiness, and coordinates regulator-facing reporting.',
      defaultChannels: ['email'],
      escalationTarget: 'chief.legal.officer',
      grants: [
        {
          policyKey: 'governance.consents.manage',
          resource: 'governance.consents',
          actions: ['view', 'export', 'publish'],
          decision: 'allow',
          constraints: [
            'Publishing new consent versions requires documented legal approval uploaded to the policy record.',
            'Exports containing user-level consent history are encrypted at rest and shared only with regulator case IDs.',
          ],
          auditRetentionDays: 1095,
        },
        {
          policyKey: 'governance.rbac.matrix',
          resource: 'governance.rbac',
          actions: ['view'],
          decision: 'allow',
          constraints: [
            'Access limited to review cycles or regulator requests tracked in Jira Compliance board.',
          ],
          auditRetentionDays: 730,
        },
      ],
    },
    {
      key: 'operations_lead',
      label: 'Operations Lead',
      description:
        'Oversees incident response, maintenance coordination, and communications to customer-facing teams.',
      defaultChannels: ['email', 'teams'],
      escalationTarget: 'platform_admin',
      grants: [
        {
          policyKey: 'platform.runtime.control',
          resource: 'runtime.telemetry',
          actions: ['view', 'acknowledge'],
          decision: 'allow',
          constraints: [
            'Acknowledgement notes must mention customer communication status before closure.',
          ],
          auditRetentionDays: 180,
        },
        {
          policyKey: 'governance.maintenance.registry',
          resource: 'runtime.maintenance',
          actions: ['view', 'schedule', 'cancel'],
          decision: 'allow',
          constraints: [
            'Maintenance creation requires support contact and rollback owner assignments.',
            'Cancellations trigger Slack notifications and are logged for quarterly review.',
          ],
          auditRetentionDays: 365,
        },
      ],
    },
  ],
  guardrails: [
    {
      key: 'mfa-enforcement',
      label: 'Multi-factor enforcement',
      description: 'All privileged actions require MFA backed by WebAuthn or TOTP before execution.',
      coverage: ['platform_admin', 'security_officer', 'compliance_manager'],
      severity: 'critical',
    },
    {
      key: 'change-window-governance',
      label: 'Change window governance',
      description:
        'Runtime and platform modifications are restricted to approved change windows stored in platform settings.',
      coverage: ['platform_admin', 'operations_lead'],
      severity: 'high',
    },
    {
      key: 'dual-approval',
      label: 'Dual approval for secret rotation',
      description: 'Secret rotations require a second approver and are automatically escalated to security operations.',
      coverage: ['platform_admin'],
      severity: 'high',
    },
  ],
  resources: [
    {
      key: 'runtime.telemetry',
      label: 'Runtime telemetry & readiness',
      description:
        'Aggregated readiness snapshots, dependency guard state, perimeter metrics, exporter freshness, and maintenance countdowns.',
      owner: 'Platform Operations',
      dataClassification: 'Operational – restricted',
      surfaces: ['admin-dashboard', 'mobile-ops'],
    },
    {
      key: 'security.waf',
      label: 'Web application firewall rules & analytics',
      description:
        'Rule catalogue, automated quarantine decisions, offender analytics, and downstream log references.',
      owner: 'Security Operations',
      dataClassification: 'Security – confidential',
      surfaces: ['admin-dashboard'],
    },
    {
      key: 'platform.settings',
      label: 'Platform control plane',
      description: 'Feature flags, dependency credentials, support contact metadata, and enforcement toggles.',
      owner: 'Platform Engineering',
      dataClassification: 'Security – confidential',
      surfaces: ['admin-dashboard'],
    },
    {
      key: 'governance.consents',
      label: 'Consent governance registry',
      description: 'Policy catalogue, withdrawal ledger, retention metadata, and localisation packs.',
      owner: 'Compliance',
      dataClassification: 'PII-adjacent – regulated',
      surfaces: ['admin-dashboard', 'mobile-ops'],
    },
    {
      key: 'governance.rbac',
      label: 'RBAC policy matrix & audit trail',
      description: 'Persona-level permission design, simulation service, and audit exports for regulator readiness.',
      owner: 'Security Governance',
      dataClassification: 'Security – confidential',
      surfaces: ['admin-dashboard', 'api'],
    },
    {
      key: 'runtime.maintenance',
      label: 'Maintenance registry',
      description: 'Planned and active maintenance windows, blast radius metadata, and communications plan links.',
      owner: 'Operations',
      dataClassification: 'Operational – internal',
      surfaces: ['admin-dashboard', 'mobile-ops'],
    },
  ],
};

function normalise(value) {
  if (value == null) return null;
  return `${value}`.trim().toLowerCase();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const PERSONA_LOOKUP = new Map(
  RBAC_MATRIX.personas.map((persona) => [normalise(persona.key), persona]),
);

function actionMatches(grantActions = [], action) {
  if (!action) {
    return false;
  }
  const normalisedAction = normalise(action);
  return grantActions.some((candidate) => {
    const value = normalise(candidate);
    if (!value) {
      return false;
    }
    if (['*', 'all', 'any', 'manage'].includes(value)) {
      return true;
    }
    if (value === normalisedAction) {
      return true;
    }
    if (value === 'view' && ['read', 'fetch'].includes(normalisedAction)) {
      return true;
    }
    if (value === 'update' && ['edit', 'patch'].includes(normalisedAction)) {
      return true;
    }
    return false;
  });
}

export function getPolicyMatrix() {
  return clone(RBAC_MATRIX);
}

export function listPersonas() {
  return RBAC_MATRIX.personas.map((persona) => ({
    key: persona.key,
    label: persona.label,
    description: persona.description,
    grants: persona.grants.length,
    escalationTarget: persona.escalationTarget,
    defaultChannels: persona.defaultChannels,
  }));
}

export function evaluateAccess({ personaKey, resourceKey, action }) {
  const persona = PERSONA_LOOKUP.get(normalise(personaKey));
  if (!persona) {
    return {
      allowed: false,
      decision: 'deny',
      reason: 'unknown-persona',
      constraints: [],
    };
  }

  const resource = normalise(resourceKey);
  const matchingGrant = persona.grants.find((grant) => {
    const grantResource = normalise(grant.resource);
    if (grantResource !== resource) {
      return false;
    }
    return actionMatches(grant.actions, action);
  });

  if (!matchingGrant) {
    return {
      allowed: false,
      decision: 'deny',
      reason: 'no-matching-grant',
      constraints: [],
    };
  }

  if (matchingGrant.decision === 'deny') {
    return {
      allowed: false,
      decision: 'deny',
      reason: 'explicit-deny',
      policyKey: matchingGrant.policyKey,
      constraints: matchingGrant.constraints ?? [],
    };
  }

  return {
    allowed: true,
    decision: 'allow',
    policyKey: matchingGrant.policyKey,
    constraints: matchingGrant.constraints ?? [],
    auditRetentionDays: matchingGrant.auditRetentionDays,
  };
}

function sanitiseMetadata(metadata = {}) {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }
  const cloneMetadata = { ...metadata };
  if (cloneMetadata.headers) {
    const restHeaders = { ...cloneMetadata.headers };
    delete restHeaders.authorization;
    delete restHeaders.cookie;
    cloneMetadata.headers = restHeaders;
  }
  return cloneMetadata;
}

export async function recordPolicyEvent(event) {
  const {
    policyKey,
    persona,
    resource,
    action,
    decision,
    reason = null,
    actor = {},
    request = {},
    responseStatus = null,
    metadata = {},
  } = event ?? {};

  if (!policyKey || !persona || !resource || !action || !decision) {
    logger.warn({ event }, 'rbacPolicyService.recordPolicyEvent missing required fields');
    return null;
  }

  try {
    const record = await RbacPolicyAuditEvent.create({
      policyKey,
      persona: normalise(persona),
      resource: normalise(resource),
      action: normalise(action),
      decision: normalise(decision) === 'allow' ? 'allow' : 'deny',
      reason,
      actorId: actor.id ? String(actor.id) : null,
      actorType: actor.type ? String(actor.type) : null,
      actorEmail: actor.email ? String(actor.email).toLowerCase() : null,
      requestId: request.id ?? request.correlationId ?? null,
      ipAddress: request.ip ?? null,
      userAgent: request.userAgent ?? null,
      responseStatus: responseStatus ?? request.statusCode ?? null,
      metadata: sanitiseMetadata({
        path: request.path,
        method: request.method,
        durationMs: request.durationMs,
        constraints: event.constraints,
        ...metadata,
      }),
    });
    return record;
  } catch (error) {
    logger.error(
      { error: error?.message, policyKey, persona, resource, action },
      'Failed to persist RBAC policy audit event',
    );
    return null;
  }
}

export async function listPolicyAuditEvents(filters = {}) {
  const {
    policyKey,
    persona,
    resource,
    action,
    decision,
    search,
    from,
    to,
    limit = 25,
    offset = 0,
  } = filters;

  const where = {};
  if (policyKey) where.policyKey = normalise(policyKey);
  if (persona) where.persona = normalise(persona);
  if (resource) where.resource = normalise(resource);
  if (action) where.action = normalise(action);
  if (decision) where.decision = normalise(decision) === 'allow' ? 'allow' : 'deny';

  const occurredAt = {};
  if (from) {
    const fromDate = new Date(from);
    if (!Number.isNaN(fromDate.getTime())) {
      occurredAt[Op.gte] = fromDate;
    }
  }
  if (to) {
    const toDate = new Date(to);
    if (!Number.isNaN(toDate.getTime())) {
      occurredAt[Op.lte] = toDate;
    }
  }
  if (Object.keys(occurredAt).length) {
    where.occurredAt = occurredAt;
  }

  const dialect = RbacPolicyAuditEvent.sequelize?.getDialect?.() ?? 'postgres';
  const likeOperator = dialect === 'postgres' ? Op.iLike : Op.like;

  if (search) {
    const like = `%${search.trim()}%`;
    where[Op.or] = [
      { reason: { [likeOperator]: like } },
      { actorEmail: { [likeOperator]: like } },
    ];
  }

  const paginationLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 25, 1), 200);
  const paginationOffset = Math.max(Number.parseInt(offset, 10) || 0, 0);

  const results = await RbacPolicyAuditEvent.findAndCountAll({
    where,
    order: [['occurredAt', 'DESC']],
    limit: paginationLimit,
    offset: paginationOffset,
  });

  return {
    total: results.count,
    limit: paginationLimit,
    offset: paginationOffset,
    events: results.rows.map((row) => row.toPublicObject()),
  };
}

export default {
  getPolicyMatrix,
  listPersonas,
  evaluateAccess,
  recordPolicyEvent,
  listPolicyAuditEvents,
};
