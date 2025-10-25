import { randomUUID } from 'node:crypto';
import { Op } from 'sequelize';
import {
  Project,
  ProjectAutoMatchFreelancer,
  PROJECT_STATUSES,
  PROJECT_AUTOMATCH_DECISION_STATUSES,
  projectGigManagementSequelize,
} from '../models/projectGigManagementModels.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/errors.js';

const PROJECT_LIFECYCLE_STATES = new Set(['open', 'closed']);

function toNumber(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function toInteger(value) {
  if (value == null) {
    return null;
  }
  const numeric = typeof value === 'number' ? value : Number.parseInt(`${value}`, 10);
  return Number.isInteger(numeric) ? numeric : null;
}

function requireProjectTitle(value) {
  const trimmed = `${value ?? ''}`.trim();
  if (trimmed.length < 3) {
    throw new ValidationError('Project title must be at least 3 characters long.');
  }
  return trimmed.slice(0, 180);
}

function requireProjectDescription(value) {
  const trimmed = `${value ?? ''}`.trim();
  if (trimmed.length < 10) {
    throw new ValidationError('Project description must be at least 10 characters long.');
  }
  return trimmed;
}

function ensureProjectCategory(value) {
  if (value == null) {
    return 'General';
  }
  const trimmed = `${value}`.trim();
  if (!trimmed) {
    throw new ValidationError('Project category cannot be empty.');
  }
  return trimmed.slice(0, 120);
}

function ensureDurationWeeks(value, { defaultValue } = {}) {
  if (value == null) {
    if (typeof defaultValue !== 'undefined') {
      return defaultValue;
    }
    throw new ValidationError('durationWeeks must be a positive integer.');
  }
  const numeric = toInteger(value);
  if (!numeric || numeric <= 0) {
    throw new ValidationError('durationWeeks must be a positive integer.');
  }
  return numeric;
}

function ensureOptionalPositiveInteger(value, fieldName) {
  if (value == null) {
    return null;
  }
  const numeric = toInteger(value);
  if (!numeric || numeric <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return numeric;
}

function ensureBudgetAmount(value, fieldName, { defaultValue } = {}) {
  if (value == null) {
    if (typeof defaultValue !== 'undefined') {
      return defaultValue;
    }
    throw new ValidationError(`${fieldName} is required.`);
  }
  const numeric = toNumber(value);
  if (numeric == null || numeric < 0) {
    throw new ValidationError(`${fieldName} must be zero or positive.`);
  }
  return numeric;
}

function ensureOptionalBudgetAmount(value, fieldName) {
  if (value == null) {
    return null;
  }
  return ensureBudgetAmount(value, fieldName, { defaultValue: null });
}

function ensureLifecycleState(value, { defaultValue } = {}) {
  if (value == null) {
    if (typeof defaultValue !== 'undefined') {
      return defaultValue;
    }
    throw new ValidationError('lifecycleState is required.');
  }
  if (!PROJECT_LIFECYCLE_STATES.has(value)) {
    throw new ValidationError('lifecycleState must be either "open" or "closed".');
  }
  return value;
}

function ensureProjectStatus(value, { defaultValue } = {}) {
  if (value == null) {
    if (typeof defaultValue !== 'undefined') {
      return defaultValue;
    }
    throw new ValidationError('status is required.');
  }
  if (!PROJECT_STATUSES.includes(value)) {
    throw new ValidationError(`status must be one of: ${PROJECT_STATUSES.join(', ')}.`);
  }
  return value;
}

function ensureOptionalDate(value, fieldName) {
  if (value == null) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date.`);
  }
  return date;
}

function ensureBudgetCurrency(value, { defaultValue } = {}) {
  if (value == null) {
    if (typeof defaultValue !== 'undefined') {
      return defaultValue;
    }
    throw new ValidationError('budgetCurrency is required.');
  }
  const code = `${value}`.trim().toUpperCase();
  if (code.length < 3) {
    throw new ValidationError('budgetCurrency must be a valid currency code.');
  }
  return code.slice(0, 6);
}

function ensureScore(value, fieldName = 'score') {
  const numeric = toNumber(value);
  if (numeric == null || numeric < 0 || numeric > 100) {
    throw new ValidationError(`${fieldName} must be between 0 and 100.`);
  }
  return numeric;
}

function normaliseFreelancerInput(payload = {}) {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Freelancer payload must be an object.');
  }
  if (!Number.isInteger(payload.freelancerId)) {
    throw new ValidationError('Freelancer identifier is required.');
  }
  const freelancerName = `${payload.freelancerName ?? ''}`.trim();
  if (!freelancerName) {
    throw new ValidationError('Freelancer name is required.');
  }
  const freelancerRoleRaw = payload.freelancerRole == null ? null : `${payload.freelancerRole}`.trim().slice(0, 120);
  const score = payload.score == null ? null : ensureScore(payload.score);
  let notes = null;
  if (payload.notes != null) {
    const trimmed = `${payload.notes}`.trim();
    notes = trimmed.length ? trimmed : null;
  }
  let metadata = null;
  if (payload.metadata != null) {
    if (typeof payload.metadata !== 'object') {
      throw new ValidationError('Freelancer metadata must be an object.');
    }
    metadata = { ...payload.metadata };
  }
  return {
    freelancerId: payload.freelancerId,
    freelancerName: freelancerName.slice(0, 180),
    freelancerRole: freelancerRoleRaw && freelancerRoleRaw.length ? freelancerRoleRaw : null,
    score,
    autoMatchEnabled: payload.autoMatchEnabled != null ? Boolean(payload.autoMatchEnabled) : true,
    status:
      payload.status && PROJECT_AUTOMATCH_DECISION_STATUSES.includes(payload.status)
        ? payload.status
        : 'pending',
    notes,
    metadata,
  };
}

function sanitiseFreelancerUpdates(payload = {}) {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Freelancer payload must be an object.');
  }
  const updates = {};
  if (Object.prototype.hasOwnProperty.call(payload, 'freelancerName')) {
    if (payload.freelancerName === undefined) {
      // ignore undefined values
    } else {
      const trimmed = `${payload.freelancerName ?? ''}`.trim();
      if (!trimmed) {
        throw new ValidationError('Freelancer name cannot be empty.');
      }
      updates.freelancerName = trimmed.slice(0, 180);
    }
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'freelancerRole')) {
    if (payload.freelancerRole === undefined) {
      // ignore undefined
    } else if (payload.freelancerRole == null) {
      updates.freelancerRole = null;
    } else {
      const trimmed = `${payload.freelancerRole}`.trim().slice(0, 120);
      updates.freelancerRole = trimmed.length ? trimmed : null;
    }
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'autoMatchEnabled')) {
    if (payload.autoMatchEnabled !== undefined) {
      updates.autoMatchEnabled = Boolean(payload.autoMatchEnabled);
    }
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
    if (payload.status !== undefined) {
      if (!PROJECT_AUTOMATCH_DECISION_STATUSES.includes(payload.status)) {
        throw new ValidationError(`status must be one of: ${PROJECT_AUTOMATCH_DECISION_STATUSES.join(', ')}.`);
      }
      updates.status = payload.status;
    }
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'score')) {
    if (payload.score !== undefined) {
      if (payload.score === null) {
        updates.score = null;
      } else {
        updates.score = ensureScore(payload.score);
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'notes')) {
    if (payload.notes !== undefined) {
      if (payload.notes == null) {
        updates.notes = null;
      } else {
        const trimmed = `${payload.notes}`.trim();
        updates.notes = trimmed.length ? trimmed : null;
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'metadata')) {
    if (payload.metadata !== undefined) {
      if (payload.metadata == null) {
        updates.metadata = null;
      } else if (typeof payload.metadata === 'object') {
        updates.metadata = { ...payload.metadata };
      } else {
        throw new ValidationError('Freelancer metadata must be an object.');
      }
    }
  }
  return updates;
}

function normaliseSkills(input) {
  if (!input) {
    return [];
  }

  const values = Array.isArray(input) ? input : `${input}`.split(',');
  const cleaned = values
    .map((value) => `${value}`.trim())
    .filter((value) => value.length > 0)
    .slice(0, 50);

  return Array.from(new Set(cleaned));
}

function toPlainFreelancer(record) {
  if (!record) {
    return null;
  }

  const payload = record.get ? record.get({ plain: true }) : record;

  return {
    id: payload.id,
    projectId: payload.projectId,
    freelancerId: payload.freelancerId,
    freelancerName: payload.freelancerName,
    freelancerRole: payload.freelancerRole,
    score: toNumber(payload.score),
    autoMatchEnabled: Boolean(payload.autoMatchEnabled),
    status: payload.status,
    notes: payload.notes ?? null,
    metadata: payload.metadata ?? null,
    createdAt: payload.createdAt ?? null,
    updatedAt: payload.updatedAt ?? null,
  };
}

function toPlainProject(record) {
  if (!record) {
    return null;
  }

  const payload = record.get ? record.get({ plain: true }) : record;
  const autoMatchFreelancers = Array.isArray(payload.autoMatchFreelancers)
    ? payload.autoMatchFreelancers.map(toPlainFreelancer).filter(Boolean)
    : [];

  autoMatchFreelancers.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status.localeCompare(b.status);
    }
    if (a.autoMatchEnabled !== b.autoMatchEnabled) {
      return a.autoMatchEnabled ? -1 : 1;
    }
    return (b.score ?? 0) - (a.score ?? 0);
  });

  return {
    id: payload.id,
    ownerId: payload.ownerId,
    title: payload.title,
    description: payload.description,
    category: payload.category,
    skills: normaliseSkills(payload.skills),
    durationWeeks: toInteger(payload.durationWeeks) ?? null,
    status: payload.status,
    lifecycleState: payload.lifecycleState,
    startDate: payload.startDate ? new Date(payload.startDate).toISOString() : null,
    dueDate: payload.dueDate ? new Date(payload.dueDate).toISOString() : null,
    budget: {
      currency: payload.budgetCurrency,
      allocated: toNumber(payload.budgetAllocated) ?? 0,
      spent: toNumber(payload.budgetSpent) ?? 0,
    },
    autoMatch: {
      enabled: Boolean(payload.autoMatchEnabled),
      autoAcceptEnabled: Boolean(payload.autoMatchAcceptEnabled),
      autoRejectEnabled: Boolean(payload.autoMatchRejectEnabled),
      budgetMin: toNumber(payload.autoMatchBudgetMin),
      budgetMax: toNumber(payload.autoMatchBudgetMax),
      weeklyHoursMin: toNumber(payload.autoMatchWeeklyHoursMin),
      weeklyHoursMax: toNumber(payload.autoMatchWeeklyHoursMax),
      durationWeeksMin: toInteger(payload.autoMatchDurationWeeksMin),
      durationWeeksMax: toInteger(payload.autoMatchDurationWeeksMax),
      skills: normaliseSkills(payload.autoMatchSkills),
      notes: payload.autoMatchNotes ?? null,
      lastUpdatedBy: payload.autoMatchUpdatedBy ?? null,
    },
    autoMatchFreelancers,
    metadata: payload.metadata ?? null,
    createdAt: payload.createdAt ?? null,
    updatedAt: payload.updatedAt ?? null,
  };
}

function parseMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }
  return { ...metadata };
}

function buildStaffingAuditEntry(action, { actorId, metadata } = {}) {
  return {
    id: randomUUID(),
    action,
    actorId: actorId ?? null,
    occurredAt: new Date().toISOString(),
    metadata: metadata && typeof metadata === 'object' ? { ...metadata } : {},
  };
}

function mergeStaffingAudit(metadata, entry) {
  const parsed = parseMetadata(metadata);
  const trail = Array.isArray(parsed.staffingAudit) ? parsed.staffingAudit.slice(-49) : [];
  trail.push(entry);
  parsed.staffingAudit = trail.slice(-50);
  return parsed;
}

async function applyProjectUpdates(project, updates, auditEntry, { transaction } = {}) {
  const payload = { ...updates };
  if (auditEntry) {
    const metadata = mergeStaffingAudit(project.metadata, auditEntry);
    payload.metadata = metadata;
  }

  if (Object.keys(payload).length === 0) {
    return project;
  }

  await project.update(payload, { transaction });
  if (payload.metadata) {
    project.set('metadata', payload.metadata);
  }
  return project;
}

async function appendProjectAudit(project, auditEntry, { transaction } = {}) {
  if (!auditEntry) {
    return project;
  }
  return applyProjectUpdates(project, {}, auditEntry, { transaction });
}

function summariseAutoMatchPayload(payload = {}) {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }
  const summary = {};
  if (payload.enabled != null) summary.enabled = Boolean(payload.enabled);
  if (payload.autoAcceptEnabled != null) summary.autoAcceptEnabled = Boolean(payload.autoAcceptEnabled);
  if (payload.autoRejectEnabled != null) summary.autoRejectEnabled = Boolean(payload.autoRejectEnabled);
  if (payload.budgetMin != null) summary.budgetMin = toNumber(payload.budgetMin);
  if (payload.budgetMax != null) summary.budgetMax = toNumber(payload.budgetMax);
  if (payload.weeklyHoursMin != null) summary.weeklyHoursMin = toNumber(payload.weeklyHoursMin);
  if (payload.weeklyHoursMax != null) summary.weeklyHoursMax = toNumber(payload.weeklyHoursMax);
  if (payload.durationWeeksMin != null) summary.durationWeeksMin = toInteger(payload.durationWeeksMin);
  if (payload.durationWeeksMax != null) summary.durationWeeksMax = toInteger(payload.durationWeeksMax);
  if (payload.skills != null) summary.skillsCount = normaliseSkills(payload.skills).length;
  return summary;
}

function buildSearchClause(search, dialect) {
  if (!search) {
    return undefined;
  }
  const likeOperator = ['postgres', 'postgresql'].includes(dialect) ? Op.iLike : Op.like;
  const term = `%${search}%`;
  return {
    [Op.or]: [
      { title: { [likeOperator]: term } },
      { description: { [likeOperator]: term } },
    ],
  };
}

async function buildPortfolioSummary(ownerId) {
  const [
    totalProjects,
    openCount,
    closedCount,
    autoMatchEnabledCount,
    budgetAllocatedRaw,
    budgetSpentRaw,
    pendingDecisions,
    acceptedDecisions,
    rejectedDecisions,
    queueRecords,
    staleRecords,
    auditSources,
  ] = await Promise.all([
    Project.count({ where: { ownerId } }),
    Project.count({ where: { ownerId, lifecycleState: 'open' } }),
    Project.count({ where: { ownerId, lifecycleState: 'closed' } }),
    Project.count({ where: { ownerId, autoMatchEnabled: true } }),
    Project.sum('budgetAllocated', { where: { ownerId } }),
    Project.sum('budgetSpent', { where: { ownerId } }),
    ProjectAutoMatchFreelancer.count({
      where: { status: 'pending' },
      include: [{ model: Project, attributes: [], where: { ownerId } }],
      distinct: true,
    }),
    ProjectAutoMatchFreelancer.count({
      where: { status: 'accepted' },
      include: [{ model: Project, attributes: [], where: { ownerId } }],
      distinct: true,
    }),
    ProjectAutoMatchFreelancer.count({
      where: { status: 'rejected' },
      include: [{ model: Project, attributes: [], where: { ownerId } }],
      distinct: true,
    }),
    ProjectAutoMatchFreelancer.findAll({
      attributes: ['id', 'projectId', 'freelancerId', 'freelancerName', 'score', 'status', 'updatedAt'],
      include: [
        {
          model: Project,
          attributes: ['title'],
          where: { ownerId },
        },
      ],
      where: { status: 'pending', autoMatchEnabled: true },
      order: [['updatedAt', 'ASC']],
      limit: 10,
    }),
    (() => {
      const threshold = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14);
      return Project.findAll({
        where: {
          ownerId,
          lifecycleState: 'open',
          updatedAt: { [Op.lt]: threshold },
        },
        attributes: ['id', 'title', 'updatedAt'],
        order: [['updatedAt', 'ASC']],
        limit: 5,
      });
    })(),
    Project.findAll({
      where: { ownerId },
      attributes: ['id', 'title', 'metadata', 'updatedAt'],
      order: [['updatedAt', 'DESC']],
      limit: 10,
    }),
  ]);

  const toNumberSafe = (value) => {
    if (value == null) return 0;
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const budgetAllocated = toNumberSafe(budgetAllocatedRaw);
  const budgetSpent = toNumberSafe(budgetSpentRaw);
  const budgetUtilisationPercent = budgetAllocated > 0 ? (budgetSpent / budgetAllocated) * 100 : 0;

  const autoMatchQueue = queueRecords
    .map((record) => {
      const plain = record.get({ plain: true });
      return {
        id: plain.id,
        projectId: plain.projectId,
        projectTitle: plain.Project?.title ?? null,
        freelancerId: plain.freelancerId,
        freelancerName: plain.freelancerName,
        score: toNumberSafe(plain.score),
        status: plain.status,
        updatedAt: plain.updatedAt ?? null,
      };
    })
    .filter(Boolean);

  const staleProjects = staleRecords
    .map((record) => {
      const plain = record.get({ plain: true });
      return {
        projectId: plain.id,
        projectTitle: plain.title,
        lastUpdatedAt: plain.updatedAt ?? null,
      };
    })
    .filter(Boolean);

  const auditEvents = auditSources
    .map((record) => record.get({ plain: true }))
    .flatMap((plain) => {
      const trail = Array.isArray(plain.metadata?.staffingAudit) ? plain.metadata.staffingAudit : [];
      return trail.map((entry) => ({
        ...entry,
        projectId: plain.id,
        projectTitle: plain.title,
      }));
    })
    .filter((entry) => entry && entry.occurredAt)
    .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
    .slice(0, 15)
    .map((entry) => ({
      id: entry.id,
      action: entry.action,
      actorId: entry.actorId ?? null,
      occurredAt: entry.occurredAt,
      metadata: entry.metadata ?? {},
      projectId: entry.projectId,
      projectTitle: entry.projectTitle,
    }));

  return {
    summary: {
      totalProjects,
      openCount,
      closedCount,
      autoMatchEnabledCount,
    },
    portfolioHealth: {
      budgetAllocated,
      budgetSpent,
      budgetUtilisationPercent,
      staleProjects,
    },
    autoMatchInsights: {
      pendingDecisions,
      acceptedDecisions,
      rejectedDecisions,
    },
    autoMatchQueue,
    staffingAudit: auditEvents,
  };
}

function pickProjectUpdates(payload = {}, { actorId } = {}) {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Project payload must be an object.');
  }

  const updates = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'title')) {
    updates.title = requireProjectTitle(payload.title);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'description')) {
    updates.description = requireProjectDescription(payload.description);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
    updates.status = ensureProjectStatus(payload.status);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'category')) {
    updates.category = ensureProjectCategory(payload.category);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'durationWeeks')) {
    updates.durationWeeks = ensureDurationWeeks(payload.durationWeeks);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'skills')) {
    updates.skills = normaliseSkills(payload.skills);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'lifecycleState')) {
    updates.lifecycleState = ensureLifecycleState(payload.lifecycleState);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'startDate')) {
    updates.startDate = ensureOptionalDate(payload.startDate, 'startDate');
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'dueDate')) {
    updates.dueDate = ensureOptionalDate(payload.dueDate, 'dueDate');
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'budgetCurrency')) {
    updates.budgetCurrency = ensureBudgetCurrency(payload.budgetCurrency);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'budgetAllocated')) {
    updates.budgetAllocated = ensureBudgetAmount(payload.budgetAllocated, 'budgetAllocated');
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'budgetSpent')) {
    updates.budgetSpent = ensureBudgetAmount(payload.budgetSpent, 'budgetSpent');
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'metadata')) {
    if (payload.metadata == null) {
      updates.metadata = null;
    } else if (typeof payload.metadata === 'object') {
      updates.metadata = { ...payload.metadata };
    } else {
      throw new ValidationError('Project metadata must be an object.');
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'autoMatch')) {
    if (payload.autoMatch == null || typeof payload.autoMatch !== 'object') {
      throw new ValidationError('autoMatch must be an object when provided.');
    }
    const autoMatch = payload.autoMatch;
    if (Object.prototype.hasOwnProperty.call(autoMatch, 'enabled')) {
      updates.autoMatchEnabled = Boolean(autoMatch.enabled);
    }
    if (Object.prototype.hasOwnProperty.call(autoMatch, 'autoAcceptEnabled')) {
      updates.autoMatchAcceptEnabled = Boolean(autoMatch.autoAcceptEnabled);
    }
    if (Object.prototype.hasOwnProperty.call(autoMatch, 'autoRejectEnabled')) {
      updates.autoMatchRejectEnabled = Boolean(autoMatch.autoRejectEnabled);
    }
    if (Object.prototype.hasOwnProperty.call(autoMatch, 'budgetMin')) {
      updates.autoMatchBudgetMin = ensureOptionalBudgetAmount(autoMatch.budgetMin, 'autoMatchBudgetMin');
    }
    if (Object.prototype.hasOwnProperty.call(autoMatch, 'budgetMax')) {
      updates.autoMatchBudgetMax = ensureOptionalBudgetAmount(autoMatch.budgetMax, 'autoMatchBudgetMax');
    }
    if (Object.prototype.hasOwnProperty.call(autoMatch, 'weeklyHoursMin')) {
      updates.autoMatchWeeklyHoursMin = ensureOptionalBudgetAmount(
        autoMatch.weeklyHoursMin,
        'autoMatchWeeklyHoursMin',
      );
    }
    if (Object.prototype.hasOwnProperty.call(autoMatch, 'weeklyHoursMax')) {
      updates.autoMatchWeeklyHoursMax = ensureOptionalBudgetAmount(
        autoMatch.weeklyHoursMax,
        'autoMatchWeeklyHoursMax',
      );
    }
    if (Object.prototype.hasOwnProperty.call(autoMatch, 'durationWeeksMin')) {
      updates.autoMatchDurationWeeksMin = ensureOptionalPositiveInteger(
        autoMatch.durationWeeksMin,
        'autoMatchDurationWeeksMin',
      );
    }
    if (Object.prototype.hasOwnProperty.call(autoMatch, 'durationWeeksMax')) {
      updates.autoMatchDurationWeeksMax = ensureOptionalPositiveInteger(
        autoMatch.durationWeeksMax,
        'autoMatchDurationWeeksMax',
      );
    }
    if (Object.prototype.hasOwnProperty.call(autoMatch, 'skills')) {
      updates.autoMatchSkills = normaliseSkills(autoMatch.skills);
    }
    if (Object.prototype.hasOwnProperty.call(autoMatch, 'notes')) {
      const note = autoMatch.notes == null ? null : `${autoMatch.notes}`.trim();
      updates.autoMatchNotes = note && note.length ? note : null;
    }
    if (Object.keys(updates).some((key) => key.startsWith('autoMatch'))) {
      updates.autoMatchUpdatedBy = actorId ?? null;
    }
  }

  return updates;
}

async function ensureProject(projectId, ownerId, { transaction } = {}) {
  const project = await Project.findByPk(projectId, {
    include: [{ model: ProjectAutoMatchFreelancer, as: 'autoMatchFreelancers' }],
    transaction,
  });

  if (!project) {
    throw new NotFoundError('Project not found.');
  }

  if (project.ownerId !== ownerId) {
    throw new AuthorizationError('You do not have access to this project.');
  }

  return project;
}

export async function listAgencyProjects(ownerId, options = {}) {
  const normalisedOptions = options && (options.filters || options.pagination || options.includeMetrics !== undefined)
    ? options
    : { filters: {}, pagination: options ?? {}, includeMetrics: true };
  const { filters = {}, pagination = {}, includeMetrics = true } = normalisedOptions;
  const limit = Math.max(1, Math.min(Number.parseInt(pagination.limit ?? pagination.pageSize ?? 20, 10) || 20, 50));
  const offset = Math.max(0, Number.parseInt(pagination.offset ?? (pagination.page ? (pagination.page - 1) * limit : 0), 10) || 0);
  const page = pagination.page ?? Math.floor(offset / limit) + 1;
  const pageSize = limit;

  const where = { ownerId };
  if (filters.lifecycleState) {
    where.lifecycleState = filters.lifecycleState;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (typeof filters.autoMatchEnabled === 'boolean') {
    where.autoMatchEnabled = filters.autoMatchEnabled;
  }

  const searchClause = buildSearchClause(filters.search, projectGigManagementSequelize.getDialect());
  const finalWhere = searchClause ? { ...where, ...searchClause } : where;

  const [pageResult, metrics] = await Promise.all([
    Project.findAndCountAll({
      where: finalWhere,
      include: [{ model: ProjectAutoMatchFreelancer, as: 'autoMatchFreelancers' }],
      order: [
        ['updatedAt', 'DESC'],
        [{ model: ProjectAutoMatchFreelancer, as: 'autoMatchFreelancers' }, 'updatedAt', 'DESC'],
      ],
      limit,
      offset,
    }),
    includeMetrics ? buildPortfolioSummary(ownerId) : null,
  ]);

  const projects = pageResult.rows.map(toPlainProject).filter(Boolean);
  const openProjects = projects.filter((project) => project.lifecycleState !== 'closed');
  const closedProjects = projects.filter((project) => project.lifecycleState === 'closed');

  const totalItems = typeof pageResult.count === 'number' ? pageResult.count : Array.isArray(pageResult.count)
    ? pageResult.count.reduce((total, entry) => total + (entry.count ? Number(entry.count) : 0), 0)
    : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  return {
    summary: metrics?.summary ?? {
      totalProjects: totalItems,
      openCount: openProjects.length,
      closedCount: closedProjects.length,
      autoMatchEnabledCount: projects.filter((project) => project.autoMatch.enabled).length,
    },
    portfolioHealth: metrics?.portfolioHealth ?? null,
    autoMatchInsights: metrics?.autoMatchInsights ?? null,
    autoMatchQueue: metrics?.autoMatchQueue ?? [],
    staffingAudit: metrics?.staffingAudit ?? [],
    projects,
    openProjects,
    closedProjects,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
    },
    filters,
  };
}

export async function createAgencyProject(ownerId, payload, { actorId } = {}) {
  return projectGigManagementSequelize.transaction(async (transaction) => {
    if (!payload || typeof payload !== 'object') {
      throw new ValidationError('Project payload must be an object.');
    }

    const title = requireProjectTitle(payload.title);
    const description = requireProjectDescription(payload.description);
    const category = ensureProjectCategory(payload.category);
    const skills = normaliseSkills(payload.skills);
    const durationWeeks = ensureDurationWeeks(payload.durationWeeks, { defaultValue: 4 });
    const status = ensureProjectStatus(payload.status, { defaultValue: 'planning' });
    const lifecycleState = ensureLifecycleState(payload.lifecycleState, { defaultValue: 'open' });
    const startDate = ensureOptionalDate(payload.startDate, 'startDate');
    const dueDate = ensureOptionalDate(payload.dueDate, 'dueDate');
    const budgetCurrency = ensureBudgetCurrency(payload.budgetCurrency, { defaultValue: 'USD' });
    const budgetAllocated = ensureBudgetAmount(payload.budgetAllocated, 'budgetAllocated', { defaultValue: 0 });
    const budgetSpent = ensureBudgetAmount(payload.budgetSpent ?? 0, 'budgetSpent', { defaultValue: 0 });
    const baseMetadata = parseMetadata(payload.metadata);
    const auditEntry = actorId
      ? buildStaffingAuditEntry('project_created', {
          actorId,
          metadata: {
            title,
            category,
            lifecycleState,
          },
        })
      : null;
    const metadata = auditEntry ? mergeStaffingAudit(baseMetadata, auditEntry) : baseMetadata;

    const project = await Project.create(
      {
        ownerId,
        title,
        description,
        category,
        skills,
        durationWeeks,
        status,
        lifecycleState,
        startDate,
        dueDate,
        budgetCurrency,
        budgetAllocated,
        budgetSpent,
        metadata,
      },
      { transaction },
    );

    const autoMatchPayload = payload.autoMatch === undefined ? {} : { autoMatch: payload.autoMatch };
    const projectUpdates = pickProjectUpdates(autoMatchPayload, { actorId });
    if (Object.keys(projectUpdates).length) {
      await project.update(projectUpdates, { transaction });
    }

    if (Array.isArray(payload.autoMatch?.freelancers) && payload.autoMatch.freelancers.length) {
      const freelancerPayloads = payload.autoMatch.freelancers.map((entry) => {
        const normalised = normaliseFreelancerInput(entry);
        return {
          projectId: project.id,
          freelancerId: normalised.freelancerId,
          freelancerName: normalised.freelancerName,
          freelancerRole: normalised.freelancerRole,
          score: normalised.score,
          autoMatchEnabled: normalised.autoMatchEnabled,
          status: normalised.status,
          notes: normalised.notes,
          metadata: normalised.metadata,
        };
      });

      const insertedFreelancers = await ProjectAutoMatchFreelancer.bulkCreate(freelancerPayloads, {
        transaction,
        returning: true,
      });

      const resolvedFreelancers = Array.isArray(insertedFreelancers) && insertedFreelancers.length
        ? insertedFreelancers.map((record, index) => {
            if (record && typeof record.get === 'function') {
              return record.get({ plain: true });
            }
            return { ...freelancerPayloads[index] };
          })
        : freelancerPayloads.map((entry) => ({ ...entry }));

      project.set('autoMatchFreelancers', resolvedFreelancers);
    }

    await project.reload({ include: [{ model: ProjectAutoMatchFreelancer, as: 'autoMatchFreelancers' }], transaction });
    return toPlainProject(project);
  });
}

export async function updateAgencyProject(ownerId, projectId, payload, { actorId, auditAction = 'project_updated', auditMetadata } = {}) {
  return projectGigManagementSequelize.transaction(async (transaction) => {
    const project = await ensureProject(projectId, ownerId, { transaction });
    const updates = pickProjectUpdates(payload, { actorId });

    const changedFields = Object.keys(updates);
    const auditEntry = actorId && changedFields.length > 0
      ? buildStaffingAuditEntry(auditAction, {
          actorId,
          metadata: auditMetadata ?? { changedFields },
        })
      : null;

    await applyProjectUpdates(project, updates, auditEntry, { transaction });

    await project.reload({ include: [{ model: ProjectAutoMatchFreelancer, as: 'autoMatchFreelancers' }], transaction });
    return toPlainProject(project);
  });
}

export async function updateProjectAutoMatchSettings(ownerId, projectId, payload, { actorId } = {}) {
  return updateAgencyProject(ownerId, projectId, { autoMatch: payload }, {
    actorId,
    auditAction: 'auto_match_settings_updated',
    auditMetadata: summariseAutoMatchPayload(payload),
  });
}

export async function upsertProjectAutoMatchFreelancer(ownerId, projectId, payload, { actorId } = {}) {
  const normalisedInput = normaliseFreelancerInput(payload);

  return projectGigManagementSequelize.transaction(async (transaction) => {
    const project = await ensureProject(projectId, ownerId, { transaction });

    const defaults = {
      projectId,
      freelancerId: normalisedInput.freelancerId,
      freelancerName: normalisedInput.freelancerName,
      freelancerRole: normalisedInput.freelancerRole,
      score: normalisedInput.score,
      autoMatchEnabled: normalisedInput.autoMatchEnabled,
      status: normalisedInput.status,
      notes: normalisedInput.notes,
      metadata: normalisedInput.metadata,
    };

    const [record, created] = await ProjectAutoMatchFreelancer.findOrCreate({
      where: { projectId, freelancerId: normalisedInput.freelancerId },
      defaults,
      transaction,
    });

    const updates = sanitiseFreelancerUpdates(payload);

    if (Object.keys(updates).length) {
      await record.update(updates, { transaction });
    }

    await record.reload({ transaction });

    const auditEntry = actorId
      ? buildStaffingAuditEntry(created ? 'auto_match_freelancer_added' : 'auto_match_freelancer_upserted', {
          actorId,
          metadata: {
            freelancerId: record.freelancerId,
            status: record.status,
            autoMatchEnabled: record.autoMatchEnabled,
          },
        })
      : null;

    await appendProjectAudit(project, auditEntry, { transaction });

    return toPlainFreelancer(record);
  });
}

export async function updateProjectAutoMatchFreelancer(ownerId, projectId, entryId, payload, { actorId } = {}) {
  return projectGigManagementSequelize.transaction(async (transaction) => {
    const project = await ensureProject(projectId, ownerId, { transaction });

    const entry = await ProjectAutoMatchFreelancer.findOne({
      where: { id: entryId, projectId },
      transaction,
    });

    if (!entry) {
      throw new NotFoundError('Auto-match freelancer entry not found.');
    }

    const updates = sanitiseFreelancerUpdates(payload);

    if (Object.keys(updates).length) {
      await entry.update(updates, { transaction });
    }

    await entry.reload({ transaction });

    const auditEntry = actorId && Object.keys(updates).length
      ? buildStaffingAuditEntry('auto_match_freelancer_updated', {
          actorId,
          metadata: {
            freelancerId: entry.freelancerId,
            status: entry.status,
            autoMatchEnabled: entry.autoMatchEnabled,
          },
        })
      : null;

    await appendProjectAudit(project, auditEntry, { transaction });

    return toPlainFreelancer(entry);
  });
}

export default {
  listAgencyProjects,
  createAgencyProject,
  updateAgencyProject,
  updateProjectAutoMatchSettings,
  upsertProjectAutoMatchFreelancer,
  updateProjectAutoMatchFreelancer,
};
