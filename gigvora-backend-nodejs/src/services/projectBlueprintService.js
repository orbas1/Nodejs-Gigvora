import {
  sequelize,
  Project,
  ProjectBlueprint,
  ProjectBlueprintSprint,
  ProjectBlueprintDependency,
  ProjectBlueprintRisk,
  ProjectBillingCheckpoint,
  PROJECT_BLUEPRINT_HEALTH_STATUSES,
  PROJECT_SPRINT_STATUSES,
  PROJECT_DEPENDENCY_TYPES,
  PROJECT_DEPENDENCY_STATUSES,
  PROJECT_DEPENDENCY_RISK_LEVELS,
  PROJECT_RISK_STATUSES,
  PROJECT_BILLING_TYPES,
  PROJECT_BILLING_STATUSES,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function normalizeId(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : null;
}

function normalizeString(value, { fallback = null, maxLength, required = false } = {}) {
  if (value == null) {
    if (required) {
      throw new ValidationError('A required field is missing.');
    }
    return fallback;
  }
  if (typeof value !== 'string') {
    throw new ValidationError('Expected a string value.');
  }
  const trimmed = value.trim();
  if (!trimmed) {
    if (required) {
      throw new ValidationError('A required field cannot be empty.');
    }
    return fallback;
  }
  if (maxLength && trimmed.length > maxLength) {
    return trimmed.slice(0, maxLength);
  }
  return trimmed;
}

function normalizeEnum(value, allowed, { fallback = null, required = false } = {}) {
  if (value == null) {
    if (required && fallback == null) {
      throw new ValidationError('A required field is missing.');
    }
    return fallback;
  }
  if (typeof value !== 'string') {
    throw new ValidationError('Invalid enumerated value.');
  }
  const normalized = value.trim().toLowerCase();
  if (!allowed.includes(normalized)) {
    throw new ValidationError(`Value '${value}' is not supported. Allowed: ${allowed.join(', ')}`);
  }
  return normalized;
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError('Invalid date value supplied.');
  }
  return parsed;
}

function normalizeNumber(value, { min = -Infinity, max = Infinity, precision } = {}) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('Invalid numeric value supplied.');
  }
  if (numeric < min || numeric > max) {
    throw new ValidationError(`Numeric value must be between ${min} and ${max}.`);
  }
  if (precision != null) {
    return Number(numeric.toFixed(precision));
  }
  return numeric;
}

function normalizeCurrency(value) {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    throw new ValidationError('Currency codes must be provided as a string.');
  }
  const trimmed = value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(trimmed)) {
    throw new ValidationError('Currency codes must be 3-letter ISO strings.');
  }
  return trimmed;
}

function sanitizeDeliverables(value) {
  if (!value) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new ValidationError('Deliverables must be an array of strings.');
  }
  return value
    .map((entry) => normalizeString(entry, { fallback: null }))
    .filter((entry) => Boolean(entry));
}

function sanitizeTags(value) {
  if (!value) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new ValidationError('Tags must be an array of strings.');
  }
  return value
    .map((entry) => normalizeString(entry, { fallback: null, maxLength: 60 }))
    .filter((entry) => Boolean(entry));
}

function calculateSeverityScore(probability, impact) {
  if (probability == null || impact == null) {
    return null;
  }
  return Number(((probability * impact) / 100).toFixed(2));
}

function sanitizeSprint(input = {}, index = 0) {
  const id = normalizeId(input.id);
  const name = normalizeString(input.name, { required: true, maxLength: 120 });
  const sequence = normalizeNumber(input.sequence, { min: 1 }) ?? index + 1;
  const status = normalizeEnum(input.status ?? 'planned', PROJECT_SPRINT_STATUSES, { fallback: 'planned' });
  const owner = normalizeString(input.owner, { fallback: null, maxLength: 120 });
  const objective = normalizeString(input.objective, { fallback: null });
  const startDate = normalizeDate(input.startDate);
  const endDate = normalizeDate(input.endDate);
  const velocityCommitment = normalizeNumber(input.velocityCommitment, { min: 0, max: 1000 });
  const progress = normalizeNumber(input.progress, { min: 0, max: 100, precision: 2 }) ?? 0;
  const deliverables = sanitizeDeliverables(input.deliverables ?? input.milestones);
  const acceptanceCriteria = normalizeString(input.acceptanceCriteria, { fallback: null });

  return {
    id,
    sequence,
    name,
    objective,
    startDate,
    endDate,
    status,
    owner,
    velocityCommitment,
    progress,
    deliverables,
    acceptanceCriteria,
  };
}

function sanitizeDependency(input = {}) {
  const id = normalizeId(input.id);
  const name = normalizeString(input.name, { required: true, maxLength: 160 });
  const description = normalizeString(input.description, { fallback: null });
  const dependencyType = normalizeEnum(input.dependencyType ?? 'internal', PROJECT_DEPENDENCY_TYPES, {
    fallback: 'internal',
  });
  const status = normalizeEnum(input.status ?? 'pending', PROJECT_DEPENDENCY_STATUSES, { fallback: 'pending' });
  const riskLevel = normalizeEnum(input.riskLevel ?? 'medium', PROJECT_DEPENDENCY_RISK_LEVELS, {
    fallback: 'medium',
  });
  const owner = normalizeString(input.owner, { fallback: null, maxLength: 120 });
  const dueDate = normalizeDate(input.dueDate);
  const impact = normalizeString(input.impact, { fallback: null, maxLength: 255 });
  const notes = normalizeString(input.notes, { fallback: null });
  const impactedSprintId = normalizeId(input.impactedSprintId);
  const impactedSprintSequence = normalizeNumber(input.impactedSprintSequence, { min: 1 }) ?? null;

  return {
    id,
    name,
    description,
    dependencyType,
    status,
    riskLevel,
    owner,
    dueDate,
    impact,
    notes,
    impactedSprintId,
    impactedSprintSequence,
  };
}

function sanitizeRisk(input = {}) {
  const id = normalizeId(input.id);
  const title = normalizeString(input.title, { required: true, maxLength: 160 });
  const description = normalizeString(input.description, { fallback: null });
  const probability = normalizeNumber(input.probability ?? 30, { min: 0, max: 100, precision: 0 }) ?? 30;
  const impact = normalizeNumber(input.impact ?? 30, { min: 0, max: 100, precision: 0 }) ?? 30;
  const status = normalizeEnum(input.status ?? 'open', PROJECT_RISK_STATUSES, { fallback: 'open' });
  const owner = normalizeString(input.owner, { fallback: null, maxLength: 120 });
  const mitigationPlan = normalizeString(input.mitigationPlan, { fallback: null });
  const contingencyPlan = normalizeString(input.contingencyPlan, { fallback: null });
  const nextReviewAt = normalizeDate(input.nextReviewAt);
  const tags = sanitizeTags(input.tags);
  const severityScore = calculateSeverityScore(probability, impact) ?? 0;

  return {
    id,
    title,
    description,
    probability,
    impact,
    severityScore,
    status,
    owner,
    mitigationPlan,
    contingencyPlan,
    nextReviewAt,
    tags,
  };
}

function sanitizeBillingCheckpoint(input = {}) {
  const id = normalizeId(input.id);
  const name = normalizeString(input.name, { required: true, maxLength: 160 });
  const description = normalizeString(input.description, { fallback: null });
  const billingType = normalizeEnum(input.billingType ?? 'milestone', PROJECT_BILLING_TYPES, {
    fallback: 'milestone',
  });
  const amount = normalizeNumber(input.amount, { min: 0, precision: 2 });
  const currency = amount == null ? null : normalizeCurrency(input.currency ?? 'USD');
  const dueDate = normalizeDate(input.dueDate);
  const status = normalizeEnum(input.status ?? 'upcoming', PROJECT_BILLING_STATUSES, { fallback: 'upcoming' });
  const approvalRequired = Boolean(input.approvalRequired !== false);
  const invoiceUrl = normalizeString(input.invoiceUrl, { fallback: null, maxLength: 255 });
  const notes = normalizeString(input.notes, { fallback: null });
  const relatedSprintId = normalizeId(input.relatedSprintId);
  const relatedSprintSequence = normalizeNumber(input.relatedSprintSequence, { min: 1 }) ?? null;

  return {
    id,
    name,
    description,
    billingType,
    amount,
    currency,
    dueDate,
    status,
    approvalRequired,
    invoiceUrl,
    notes,
    relatedSprintId,
    relatedSprintSequence,
  };
}

function sanitizeBlueprintPayload(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Invalid blueprint payload.');
  }

  const summary = normalizeString(input.summary, { fallback: null });
  const methodology = normalizeString(input.methodology, { fallback: null, maxLength: 120 });
  const governanceModel = normalizeString(input.governanceModel, { fallback: null, maxLength: 120 });
  const sprintCadence = normalizeString(input.sprintCadence, { fallback: null, maxLength: 80 });
  const programManager = normalizeString(input.programManager, { fallback: null, maxLength: 120 });
  const healthStatus = normalizeEnum(input.healthStatus ?? 'on_track', PROJECT_BLUEPRINT_HEALTH_STATUSES, {
    fallback: 'on_track',
  });
  const startDate = normalizeDate(input.startDate);
  const endDate = normalizeDate(input.endDate);
  const lastReviewedAt = normalizeDate(input.lastReviewedAt);
  const metadata = input.metadata && typeof input.metadata === 'object' ? input.metadata : null;

  const sprints = Array.isArray(input.sprints)
    ? input.sprints.map((item, index) => sanitizeSprint(item, index)).sort((a, b) => a.sequence - b.sequence)
    : [];
  const dependencies = Array.isArray(input.dependencies)
    ? input.dependencies.map((item) => sanitizeDependency(item))
    : [];
  const risks = Array.isArray(input.risks) ? input.risks.map((item) => sanitizeRisk(item)) : [];
  const billingCheckpoints = Array.isArray(input.billingCheckpoints)
    ? input.billingCheckpoints.map((item) => sanitizeBillingCheckpoint(item))
    : [];

  return {
    blueprintFields: {
      summary,
      methodology,
      governanceModel,
      sprintCadence,
      programManager,
      healthStatus,
      startDate,
      endDate,
      lastReviewedAt,
      metadata,
    },
    sprints,
    dependencies,
    risks,
    billingCheckpoints,
  };
}

function buildBlueprintMetrics(blueprint) {
  if (!blueprint) {
    return {
      totalSprints: 0,
      completedSprints: 0,
      openRisks: 0,
      highSeverityRisks: 0,
      blockedDependencies: 0,
      upcomingBilling: null,
    };
  }

  const sprints = Array.isArray(blueprint.sprints) ? blueprint.sprints : [];
  const risks = Array.isArray(blueprint.risks) ? blueprint.risks : [];
  const dependencies = Array.isArray(blueprint.dependencies) ? blueprint.dependencies : [];
  const billing = Array.isArray(blueprint.billingCheckpoints) ? blueprint.billingCheckpoints : [];

  const totalSprints = sprints.length;
  const completedSprints = sprints.filter((sprint) => sprint.status === 'completed').length;
  const openRisks = risks.filter((risk) => risk.status === 'open' || risk.status === 'monitoring').length;
  const highSeverityRisks = risks.filter((risk) => (risk.severityScore ?? 0) >= 40 && risk.status !== 'closed').length;
  const blockedDependencies = dependencies.filter((dependency) => dependency.status === 'blocked').length;

  const upcomingBilling = billing
    .filter((checkpoint) => checkpoint.status === 'upcoming' || checkpoint.status === 'invoiced')
    .sort((a, b) => {
      const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return aTime - bTime;
    })[0] || null;

  return {
    totalSprints,
    completedSprints,
    openRisks,
    highSeverityRisks,
    blockedDependencies,
    upcomingBilling,
  };
}

function toPublicProject(projectInstance) {
  if (!projectInstance) {
    return null;
  }
  return projectInstance.toPublicObject?.() ?? projectInstance.get({ plain: true });
}

async function loadBlueprint(projectId, { transaction } = {}) {
  return ProjectBlueprint.findOne({
    where: { projectId },
    include: [
      { model: ProjectBlueprintSprint, as: 'sprints' },
      { model: ProjectBlueprintDependency, as: 'dependencies' },
      { model: ProjectBlueprintRisk, as: 'risks' },
      { model: ProjectBillingCheckpoint, as: 'billingCheckpoints' },
    ],
    order: [
      [{ model: ProjectBlueprintSprint, as: 'sprints' }, 'sequence', 'ASC'],
      [{ model: ProjectBlueprintDependency, as: 'dependencies' }, 'updatedAt', 'DESC'],
      [{ model: ProjectBlueprintRisk, as: 'risks' }, 'severityScore', 'DESC'],
      [{ model: ProjectBillingCheckpoint, as: 'billingCheckpoints' }, 'dueDate', 'ASC'],
    ],
    transaction,
  });
}

function buildBlueprintResponse(projectInstance, blueprintInstance) {
  const project = toPublicProject(projectInstance);
  const blueprint = blueprintInstance?.toPublicObject?.() ?? null;
  const metrics = buildBlueprintMetrics(blueprint);
  return { project, blueprint, metrics };
}

export async function listProjectBlueprints() {
  const records = await ProjectBlueprint.findAll({
    include: [
      { model: Project, as: 'project' },
      { model: ProjectBlueprintSprint, as: 'sprints' },
      { model: ProjectBlueprintDependency, as: 'dependencies' },
      { model: ProjectBlueprintRisk, as: 'risks' },
      { model: ProjectBillingCheckpoint, as: 'billingCheckpoints' },
    ],
    order: [
      ['updatedAt', 'DESC'],
      [{ model: ProjectBlueprintSprint, as: 'sprints' }, 'sequence', 'ASC'],
    ],
  });

  return records.map((record) => buildBlueprintResponse(record.project, record));
}

export async function getProjectBlueprint(projectId) {
  const normalizedId = normalizeId(projectId);
  if (!normalizedId) {
    throw new ValidationError('A valid project identifier is required.');
  }

  const project = await Project.findByPk(normalizedId);
  if (!project) {
    throw new NotFoundError('Project not found.');
  }

  const blueprint = await loadBlueprint(normalizedId);
  return buildBlueprintResponse(project, blueprint);
}

export async function upsertProjectBlueprint(projectId, payload, { actorId } = {}) {
  const normalizedId = normalizeId(projectId);
  if (!normalizedId) {
    throw new ValidationError('A valid project identifier is required.');
  }

  const project = await Project.findByPk(normalizedId);
  if (!project) {
    throw new NotFoundError('Project not found.');
  }

  const { blueprintFields, sprints, dependencies, risks, billingCheckpoints } = sanitizeBlueprintPayload(payload ?? {});

  const result = await sequelize.transaction(async (transaction) => {
    const [blueprint] = await ProjectBlueprint.findOrCreate({
      where: { projectId: normalizedId },
      defaults: {
        projectId: normalizedId,
        ...blueprintFields,
      },
      transaction,
    });

    await blueprint.update({ ...blueprintFields }, { transaction });

    const existingSprints = await ProjectBlueprintSprint.findAll({
      where: { blueprintId: blueprint.id },
      transaction,
    });

    const sprintMap = new Map(existingSprints.map((record) => [record.id, record]));
    const persistedSprintIds = [];
    const sprintInstances = [];

    for (const sprintInput of sprints) {
      const { id, ...fields } = sprintInput;
      let sprintRecord;
      if (id && sprintMap.has(id)) {
        sprintRecord = sprintMap.get(id);
        await sprintRecord.update(fields, { transaction });
      } else {
        sprintRecord = await ProjectBlueprintSprint.create(
          {
            blueprintId: blueprint.id,
            ...fields,
          },
          { transaction },
        );
      }
      persistedSprintIds.push(sprintRecord.id);
      sprintInstances.push(sprintRecord);
    }

    const sprintIdsToRemove = existingSprints
      .map((record) => record.id)
      .filter((idValue) => !persistedSprintIds.includes(idValue));
    if (sprintIdsToRemove.length) {
      await ProjectBlueprintSprint.destroy({ where: { id: sprintIdsToRemove }, transaction });
    }

    const sprintIdBySequence = new Map(sprintInstances.map((record) => [record.sequence, record.id]));

    const existingDependencies = await ProjectBlueprintDependency.findAll({
      where: { blueprintId: blueprint.id },
      transaction,
    });
    const dependencyMap = new Map(existingDependencies.map((record) => [record.id, record]));
    const persistedDependencyIds = [];

    for (const dependencyInput of dependencies) {
      const { id, impactedSprintSequence, ...fields } = dependencyInput;
      const resolvedSprintId = fields.impactedSprintId ?? (impactedSprintSequence ? sprintIdBySequence.get(impactedSprintSequence) : null);
      const dependencyPayload = {
        blueprintId: blueprint.id,
        ...fields,
        impactedSprintId: resolvedSprintId ?? null,
      };

      let dependencyRecord;
      if (id && dependencyMap.has(id)) {
        dependencyRecord = dependencyMap.get(id);
        await dependencyRecord.update(dependencyPayload, { transaction });
      } else {
        dependencyRecord = await ProjectBlueprintDependency.create(dependencyPayload, { transaction });
      }
      persistedDependencyIds.push(dependencyRecord.id);
    }

    const dependencyIdsToRemove = existingDependencies
      .map((record) => record.id)
      .filter((idValue) => !persistedDependencyIds.includes(idValue));
    if (dependencyIdsToRemove.length) {
      await ProjectBlueprintDependency.destroy({ where: { id: dependencyIdsToRemove }, transaction });
    }

    const existingRisks = await ProjectBlueprintRisk.findAll({ where: { blueprintId: blueprint.id }, transaction });
    const riskMap = new Map(existingRisks.map((record) => [record.id, record]));
    const persistedRiskIds = [];

    for (const riskInput of risks) {
      const { id, ...fields } = riskInput;
      let riskRecord;
      if (id && riskMap.has(id)) {
        riskRecord = riskMap.get(id);
        await riskRecord.update({ blueprintId: blueprint.id, ...fields }, { transaction });
      } else {
        riskRecord = await ProjectBlueprintRisk.create({ blueprintId: blueprint.id, ...fields }, { transaction });
      }
      persistedRiskIds.push(riskRecord.id);
    }

    const riskIdsToRemove = existingRisks
      .map((record) => record.id)
      .filter((idValue) => !persistedRiskIds.includes(idValue));
    if (riskIdsToRemove.length) {
      await ProjectBlueprintRisk.destroy({ where: { id: riskIdsToRemove }, transaction });
    }

    const existingBilling = await ProjectBillingCheckpoint.findAll({
      where: { blueprintId: blueprint.id },
      transaction,
    });
    const billingMap = new Map(existingBilling.map((record) => [record.id, record]));
    const persistedBillingIds = [];

    for (const billingInput of billingCheckpoints) {
      const { id, relatedSprintSequence, ...fields } = billingInput;
      const resolvedSprintId = fields.relatedSprintId ?? (relatedSprintSequence ? sprintIdBySequence.get(relatedSprintSequence) : null);
      const billingPayload = {
        blueprintId: blueprint.id,
        ...fields,
        relatedSprintId: resolvedSprintId ?? null,
      };

      let billingRecord;
      if (id && billingMap.has(id)) {
        billingRecord = billingMap.get(id);
        await billingRecord.update(billingPayload, { transaction });
      } else {
        billingRecord = await ProjectBillingCheckpoint.create(billingPayload, { transaction });
      }
      persistedBillingIds.push(billingRecord.id);
    }

    const billingIdsToRemove = existingBilling
      .map((record) => record.id)
      .filter((idValue) => !persistedBillingIds.includes(idValue));
    if (billingIdsToRemove.length) {
      await ProjectBillingCheckpoint.destroy({ where: { id: billingIdsToRemove }, transaction });
    }

    const refreshed = await loadBlueprint(normalizedId, { transaction });
    return buildBlueprintResponse(project, refreshed);
  });

  return result;
}

export default {
  listProjectBlueprints,
  getProjectBlueprint,
  upsertProjectBlueprint,
};
