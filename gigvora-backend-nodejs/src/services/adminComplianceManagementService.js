import { Op } from 'sequelize';
import {
  ComplianceFramework,
  ComplianceAudit,
  ComplianceObligation,
  ComplianceEvidence,
  COMPLIANCE_FRAMEWORK_STATUSES,
  COMPLIANCE_FRAMEWORK_TYPES,
  COMPLIANCE_AUDIT_STATUSES,
  COMPLIANCE_OBLIGATION_STATUSES,
  COMPLIANCE_RISK_RATINGS,
  sequelize,
} from '../models/complianceGovernanceModels.js';
import { normaliseSlug } from '../utils/modelNormalizers.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';
import logger from '../utils/logger.js';

const log = logger.child({ component: 'adminComplianceManagementService' });

const STATUS_SET = new Set(COMPLIANCE_FRAMEWORK_STATUSES);
const TYPE_SET = new Set(COMPLIANCE_FRAMEWORK_TYPES);
const AUDIT_STATUS_SET = new Set(COMPLIANCE_AUDIT_STATUSES);
const OBLIGATION_STATUS_SET = new Set(COMPLIANCE_OBLIGATION_STATUSES);
const RISK_SET = new Set(COMPLIANCE_RISK_RATINGS);

function sanitiseString(value, { fallback = '' } = {}) {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
}

function sanitiseArray(value) {
  if (!value) {
    return [];
  }
  const seen = new Set();
  const normalised = [];
  const list = Array.isArray(value) ? value : `${value}`.split(/,|\n/);
  list
    .map((entry) => (entry == null ? '' : `${entry}`.trim()))
    .filter((entry) => entry.length > 0)
    .forEach((entry) => {
      const key = entry.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        normalised.push(entry);
      }
    });
  return normalised;
}

function sanitiseNumber(value, { min, max, fallback = 0 } = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  let clamped = numeric;
  if (typeof min === 'number') {
    clamped = Math.max(min, clamped);
  }
  if (typeof max === 'number') {
    clamped = Math.min(max, clamped);
  }
  return clamped;
}

function deriveFrameworkMetadata(existing, actor) {
  const metadata = { ...(existing ?? {}) };
  if (actor?.actorId) {
    metadata.lastUpdatedById = actor.actorId;
  }
  if (actor?.reference || actor?.displayName) {
    metadata.lastUpdatedBy = actor.reference || actor.displayName;
  }
  metadata.lastUpdatedAt = new Date().toISOString();
  return metadata;
}

function computeMetrics(frameworks, audits, obligations) {
  const activeFrameworks = frameworks.filter((framework) => framework.status === 'active');
  const automationCoverage = activeFrameworks.length
    ? activeFrameworks.reduce((total, framework) => total + (framework.automationCoverage ?? 0), 0) /
      activeFrameworks.length
    : 0;
  const controlsAutomated = frameworks.reduce(
    (total, framework) => total + (Array.isArray(framework.controls) ? framework.controls.length : 0),
    0,
  );
  const now = new Date();
  const oneWeekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const obligationsDueThisWeek = obligations.filter((obligation) => {
    if (!obligation.dueDate) {
      return false;
    }
    if (['complete', 'cancelled'].includes(obligation.status)) {
      return false;
    }
    const due = new Date(obligation.dueDate);
    return due >= now && due <= oneWeekAhead;
  }).length;
  const auditsInFlight = audits.filter((audit) => ['scheduled', 'in_progress'].includes(audit.status)).length;

  return {
    frameworksActive: activeFrameworks.length,
    automationCoverage: Number(automationCoverage.toFixed(1)),
    controlsAutomated,
    obligationsDueThisWeek,
    auditsInFlight,
  };
}

function formatFramework(record) {
  return record.toPublicObject();
}

function formatAudit(record) {
  return record.toPublicObject();
}

function formatObligation(record) {
  return record.toPublicObject();
}

async function loadFramework(frameworkId) {
  const framework = await ComplianceFramework.findByPk(frameworkId);
  if (!framework) {
    throw new NotFoundError('Compliance framework not found.');
  }
  return framework;
}

async function loadAudit(auditId) {
  const audit = await ComplianceAudit.findByPk(auditId);
  if (!audit) {
    throw new NotFoundError('Compliance audit not found.');
  }
  return audit;
}

async function loadObligation(obligationId) {
  const obligation = await ComplianceObligation.findByPk(obligationId);
  if (!obligation) {
    throw new NotFoundError('Compliance obligation not found.');
  }
  return obligation;
}

export async function getComplianceOverview() {
  const [frameworkRecords, auditRecords, obligationRecords] = await Promise.all([
    ComplianceFramework.findAll({ order: [['name', 'ASC']] }),
    ComplianceAudit.findAll({ order: [['startDate', 'ASC']] }),
    ComplianceObligation.findAll({
      order: [
        ['dueDate', 'ASC'],
        ['riskRating', 'DESC'],
      ],
    }),
  ]);

  const frameworks = frameworkRecords.map(formatFramework);
  const audits = auditRecords.map(formatAudit);
  const obligations = obligationRecords.map(formatObligation);
  const metrics = computeMetrics(frameworks, audits, obligations);

  return {
    frameworks,
    audits,
    obligations,
    metrics,
  };
}

export async function createComplianceFramework(payload, actor) {
  const name = sanitiseString(payload?.name);
  const owner = sanitiseString(payload?.owner);
  if (!name) {
    throw new ValidationError('Framework name is required.');
  }
  if (!owner) {
    throw new ValidationError('Framework owner is required.');
  }
  const status = sanitiseString(payload?.status, { fallback: 'planning' }).toLowerCase();
  if (!STATUS_SET.has(status)) {
    throw new ValidationError('Unsupported framework status.');
  }
  const type = sanitiseString(payload?.type, { fallback: 'attestation' }).toLowerCase();
  if (!TYPE_SET.has(type)) {
    throw new ValidationError('Unsupported framework type.');
  }
  const slug = sanitiseString(payload?.slug) || normaliseSlug(name, { fallback: name });
  const controls = sanitiseArray(payload?.controls);
  const automationCoverage = sanitiseNumber(payload?.automationCoverage, { min: 0, max: 100, fallback: 0 });
  const renewalCadenceMonths = sanitiseNumber(payload?.renewalCadenceMonths, { min: 1, fallback: 12 });
  const metadata = deriveFrameworkMetadata(payload?.metadata, actor);

  try {
    const framework = await sequelize.transaction(async (transaction) => {
      return ComplianceFramework.create(
        {
          slug,
          name,
          owner,
          region: sanitiseString(payload?.region, { fallback: 'Global' }),
          status,
          type,
          automationCoverage,
          renewalCadenceMonths,
          controls,
          metadata,
        },
        { transaction },
      );
    });
    log.info({ slug, frameworkId: framework.id }, 'Created compliance framework');
    return framework.toPublicObject();
  } catch (error) {
    if (error?.name === 'SequelizeUniqueConstraintError') {
      throw new ConflictError('A framework with this slug already exists.');
    }
    throw error;
  }
}

export async function updateComplianceFramework(frameworkId, payload, actor) {
  const framework = await loadFramework(frameworkId);
  const updates = {};
  if (payload?.name !== undefined) {
    const name = sanitiseString(payload.name);
    if (!name) {
      throw new ValidationError('Framework name is required.');
    }
    updates.name = name;
  }
  if (payload?.owner !== undefined) {
    const owner = sanitiseString(payload.owner);
    if (!owner) {
      throw new ValidationError('Framework owner is required.');
    }
    updates.owner = owner;
  }
  if (payload?.region !== undefined) {
    updates.region = sanitiseString(payload.region, { fallback: 'Global' });
  }
  if (payload?.status !== undefined) {
    const status = sanitiseString(payload.status).toLowerCase();
    if (!STATUS_SET.has(status)) {
      throw new ValidationError('Unsupported framework status.');
    }
    updates.status = status;
  }
  if (payload?.type !== undefined) {
    const type = sanitiseString(payload.type).toLowerCase();
    if (!TYPE_SET.has(type)) {
      throw new ValidationError('Unsupported framework type.');
    }
    updates.type = type;
  }
  if (payload?.controls !== undefined) {
    updates.controls = sanitiseArray(payload.controls);
  }
  if (payload?.automationCoverage !== undefined) {
    updates.automationCoverage = sanitiseNumber(payload.automationCoverage, { min: 0, max: 100, fallback: 0 });
  }
  if (payload?.renewalCadenceMonths !== undefined) {
    updates.renewalCadenceMonths = sanitiseNumber(payload.renewalCadenceMonths, { min: 1, fallback: 12 });
  }
  if (payload?.slug !== undefined) {
    const slug = sanitiseString(payload.slug);
    if (!slug) {
      throw new ValidationError('Slug cannot be blank.');
    }
    updates.slug = slug;
  }
  const nextMetadata = deriveFrameworkMetadata(framework.metadata, actor);
  if (payload?.metadata && typeof payload.metadata === 'object') {
    Object.assign(nextMetadata, payload.metadata);
  }
  updates.metadata = nextMetadata;

  try {
    await framework.update(updates);
  } catch (error) {
    if (error?.name === 'SequelizeUniqueConstraintError') {
      throw new ConflictError('A framework with this slug already exists.');
    }
    throw error;
  }

  log.info({ frameworkId, updates: Object.keys(updates) }, 'Updated compliance framework');
  return framework.toPublicObject();
}

export async function deleteComplianceFramework(frameworkId) {
  const deleted = await ComplianceFramework.destroy({ where: { id: frameworkId } });
  if (!deleted) {
    throw new NotFoundError('Compliance framework not found.');
  }
  log.info({ frameworkId }, 'Deleted compliance framework');
  return true;
}

export async function createComplianceAudit(payload, actor) {
  const frameworkId = Number(payload?.frameworkId);
  if (!frameworkId) {
    throw new ValidationError('frameworkId is required to schedule an audit.');
  }
  await loadFramework(frameworkId);
  const name = sanitiseString(payload?.name);
  if (!name) {
    throw new ValidationError('Audit name is required.');
  }
  const status = sanitiseString(payload?.status, { fallback: 'scheduled' }).toLowerCase();
  if (!AUDIT_STATUS_SET.has(status)) {
    throw new ValidationError('Unsupported audit status.');
  }
  const deliverables = sanitiseArray(payload?.deliverables);
  const metadata = deriveFrameworkMetadata(payload?.metadata, actor);

  const audit = await ComplianceAudit.create({
    frameworkId,
    name,
    auditFirm: sanitiseString(payload?.auditFirm),
    status,
    startDate: payload?.startDate ? new Date(payload.startDate) : null,
    endDate: payload?.endDate ? new Date(payload.endDate) : null,
    scope: sanitiseString(payload?.scope),
    deliverables,
    metadata,
  });
  log.info({ auditId: audit.id, frameworkId }, 'Created compliance audit');
  return audit.toPublicObject();
}

export async function updateComplianceAudit(auditId, payload, actor) {
  const audit = await loadAudit(auditId);
  const updates = {};
  if (payload?.name !== undefined) {
    const name = sanitiseString(payload.name);
    if (!name) {
      throw new ValidationError('Audit name is required.');
    }
    updates.name = name;
  }
  if (payload?.auditFirm !== undefined) {
    updates.auditFirm = sanitiseString(payload.auditFirm);
  }
  if (payload?.status !== undefined) {
    const status = sanitiseString(payload.status).toLowerCase();
    if (!AUDIT_STATUS_SET.has(status)) {
      throw new ValidationError('Unsupported audit status.');
    }
    updates.status = status;
  }
  if (payload?.startDate !== undefined) {
    updates.startDate = payload.startDate ? new Date(payload.startDate) : null;
  }
  if (payload?.endDate !== undefined) {
    updates.endDate = payload.endDate ? new Date(payload.endDate) : null;
  }
  if (payload?.scope !== undefined) {
    updates.scope = sanitiseString(payload.scope);
  }
  if (payload?.deliverables !== undefined) {
    updates.deliverables = sanitiseArray(payload.deliverables);
  }
  const nextMetadata = deriveFrameworkMetadata(audit.metadata, actor);
  if (payload?.metadata && typeof payload.metadata === 'object') {
    Object.assign(nextMetadata, payload.metadata);
  }
  updates.metadata = nextMetadata;

  await audit.update(updates);
  log.info({ auditId, updates: Object.keys(updates) }, 'Updated compliance audit');
  return audit.toPublicObject();
}

export async function deleteComplianceAudit(auditId) {
  const deleted = await ComplianceAudit.destroy({ where: { id: auditId } });
  if (!deleted) {
    throw new NotFoundError('Compliance audit not found.');
  }
  log.info({ auditId }, 'Deleted compliance audit');
  return true;
}

export async function createComplianceObligation(payload, actor) {
  const title = sanitiseString(payload?.title);
  const owner = sanitiseString(payload?.owner);
  if (!title) {
    throw new ValidationError('Obligation title is required.');
  }
  if (!owner) {
    throw new ValidationError('Obligation owner is required.');
  }
  const status = sanitiseString(payload?.status, { fallback: 'backlog' }).toLowerCase();
  if (!OBLIGATION_STATUS_SET.has(status)) {
    throw new ValidationError('Unsupported obligation status.');
  }
  const risk = sanitiseString(payload?.riskRating, { fallback: 'medium' }).toLowerCase();
  if (!RISK_SET.has(risk)) {
    throw new ValidationError('Unsupported obligation risk rating.');
  }
  const frameworkIds = sanitiseArray(payload?.frameworkIds).map((value) => Number(value)).filter((value) => value > 0);
  if (frameworkIds.length) {
    const frameworks = await ComplianceFramework.findAll({
      where: { id: { [Op.in]: frameworkIds } },
      attributes: ['id'],
    });
    if (frameworks.length !== frameworkIds.length) {
      throw new ValidationError('One or more frameworks were not found.');
    }
  }
  const metadata = deriveFrameworkMetadata(payload?.metadata, actor);

  const obligation = await ComplianceObligation.create({
    title,
    owner,
    status,
    riskRating: risk,
    dueDate: payload?.dueDate ? new Date(payload.dueDate) : null,
    frameworkIds,
    notes: sanitiseString(payload?.notes),
    evidenceRequired: Boolean(payload?.evidenceRequired),
    metadata,
  });
  log.info({ obligationId: obligation.id }, 'Created compliance obligation');
  return obligation.toPublicObject();
}

export async function updateComplianceObligation(obligationId, payload, actor) {
  const obligation = await loadObligation(obligationId);
  const updates = {};
  if (payload?.title !== undefined) {
    const title = sanitiseString(payload.title);
    if (!title) {
      throw new ValidationError('Obligation title is required.');
    }
    updates.title = title;
  }
  if (payload?.owner !== undefined) {
    const owner = sanitiseString(payload.owner);
    if (!owner) {
      throw new ValidationError('Obligation owner is required.');
    }
    updates.owner = owner;
  }
  if (payload?.status !== undefined) {
    const status = sanitiseString(payload.status).toLowerCase();
    if (!OBLIGATION_STATUS_SET.has(status)) {
      throw new ValidationError('Unsupported obligation status.');
    }
    updates.status = status;
  }
  if (payload?.riskRating !== undefined) {
    const risk = sanitiseString(payload.riskRating).toLowerCase();
    if (!RISK_SET.has(risk)) {
      throw new ValidationError('Unsupported obligation risk rating.');
    }
    updates.riskRating = risk;
  }
  if (payload?.dueDate !== undefined) {
    updates.dueDate = payload.dueDate ? new Date(payload.dueDate) : null;
  }
  if (payload?.notes !== undefined) {
    updates.notes = sanitiseString(payload.notes);
  }
  if (payload?.evidenceRequired !== undefined) {
    updates.evidenceRequired = Boolean(payload.evidenceRequired);
  }
  if (payload?.frameworkIds !== undefined) {
    const frameworkIds = sanitiseArray(payload.frameworkIds)
      .map((value) => Number(value))
      .filter((value) => value > 0);
    if (frameworkIds.length) {
      const frameworks = await ComplianceFramework.findAll({
        where: { id: { [Op.in]: frameworkIds } },
        attributes: ['id'],
      });
      if (frameworks.length !== frameworkIds.length) {
        throw new ValidationError('One or more frameworks were not found.');
      }
    }
    updates.frameworkIds = frameworkIds;
  }
  const nextMetadata = deriveFrameworkMetadata(obligation.metadata, actor);
  if (payload?.metadata && typeof payload.metadata === 'object') {
    Object.assign(nextMetadata, payload.metadata);
  }
  updates.metadata = nextMetadata;

  await obligation.update(updates);
  log.info({ obligationId, updates: Object.keys(updates) }, 'Updated compliance obligation');
  return obligation.toPublicObject();
}

export async function deleteComplianceObligation(obligationId) {
  const deleted = await ComplianceObligation.destroy({ where: { id: obligationId } });
  if (!deleted) {
    throw new NotFoundError('Compliance obligation not found.');
  }
  log.info({ obligationId }, 'Deleted compliance obligation');
  return true;
}

export async function logComplianceEvidence(obligationId, payload, actor) {
  const obligation = await loadObligation(obligationId);
  const description = sanitiseString(payload?.description);
  if (!description) {
    throw new ValidationError('Evidence description is required.');
  }
  const evidence = await ComplianceEvidence.create({
    obligationId: obligation.id,
    submittedById: actor?.actorId ?? payload?.submittedById ?? null,
    submittedByName: actor?.reference || actor?.displayName || sanitiseString(payload?.submittedByName),
    source: sanitiseString(payload?.source, { fallback: 'manual_upload' }),
    description,
    fileUrl: sanitiseString(payload?.fileUrl),
    metadata: payload?.metadata && typeof payload.metadata === 'object' ? payload.metadata : {},
    submittedAt: payload?.submittedAt ? new Date(payload.submittedAt) : new Date(),
  });
  log.info({ evidenceId: evidence.id, obligationId }, 'Logged compliance evidence');
  return evidence.toPublicObject();
}

export default {
  getComplianceOverview,
  createComplianceFramework,
  updateComplianceFramework,
  deleteComplianceFramework,
  createComplianceAudit,
  updateComplianceAudit,
  deleteComplianceAudit,
  createComplianceObligation,
  updateComplianceObligation,
  deleteComplianceObligation,
  logComplianceEvidence,
};
