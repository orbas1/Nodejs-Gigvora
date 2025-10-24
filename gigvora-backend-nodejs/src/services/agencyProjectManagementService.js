import { randomUUID } from 'node:crypto';
import { Op } from 'sequelize';
import {
  Project,
  ProjectAutoMatchFreelancer,
  PROJECT_STATUSES,
  PROJECT_AUTOMATCH_DECISION_STATUSES,
  projectGigManagementSequelize,
} from '../models/projectGigManagementModels.js';
import { AuthorizationError, NotFoundError } from '../utils/errors.js';

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
  const updates = {};

  if (payload.title != null) {
    updates.title = `${payload.title}`.trim();
  }
  if (payload.description != null) {
    updates.description = `${payload.description}`.trim();
  }
  if (payload.status != null && PROJECT_STATUSES.includes(payload.status)) {
    updates.status = payload.status;
  }
  if (payload.category != null) {
    const trimmed = `${payload.category}`.trim();
    if (trimmed.length) {
      updates.category = trimmed.slice(0, 120);
    }
  }
  if (payload.durationWeeks != null) {
    const duration = toInteger(payload.durationWeeks);
    if (duration && duration > 0) {
      updates.durationWeeks = duration;
    }
  }
  if (payload.skills != null) {
    updates.skills = normaliseSkills(payload.skills);
  }
  if (payload.lifecycleState != null && ['open', 'closed'].includes(payload.lifecycleState)) {
    updates.lifecycleState = payload.lifecycleState;
  }
  if (payload.startDate != null) {
    updates.startDate = payload.startDate ? new Date(payload.startDate) : null;
  }
  if (payload.dueDate != null) {
    updates.dueDate = payload.dueDate ? new Date(payload.dueDate) : null;
  }
  if (payload.budgetCurrency != null) {
    updates.budgetCurrency = `${payload.budgetCurrency}`.trim().toUpperCase().slice(0, 6);
  }
  if (payload.budgetAllocated != null) {
    const amount = toNumber(payload.budgetAllocated);
    updates.budgetAllocated = amount == null ? null : amount;
  }

  if (payload.autoMatch && typeof payload.autoMatch === 'object') {
    const { autoMatch } = payload;
    if (autoMatch.enabled != null) {
      updates.autoMatchEnabled = Boolean(autoMatch.enabled);
    }
    if (autoMatch.autoAcceptEnabled != null) {
      updates.autoMatchAcceptEnabled = Boolean(autoMatch.autoAcceptEnabled);
    }
    if (autoMatch.autoRejectEnabled != null) {
      updates.autoMatchRejectEnabled = Boolean(autoMatch.autoRejectEnabled);
    }
    if (autoMatch.budgetMin != null) {
      updates.autoMatchBudgetMin = toNumber(autoMatch.budgetMin);
    }
    if (autoMatch.budgetMax != null) {
      updates.autoMatchBudgetMax = toNumber(autoMatch.budgetMax);
    }
    if (autoMatch.weeklyHoursMin != null) {
      updates.autoMatchWeeklyHoursMin = toNumber(autoMatch.weeklyHoursMin);
    }
    if (autoMatch.weeklyHoursMax != null) {
      updates.autoMatchWeeklyHoursMax = toNumber(autoMatch.weeklyHoursMax);
    }
    if (autoMatch.durationWeeksMin != null) {
      updates.autoMatchDurationWeeksMin = toInteger(autoMatch.durationWeeksMin);
    }
    if (autoMatch.durationWeeksMax != null) {
      updates.autoMatchDurationWeeksMax = toInteger(autoMatch.durationWeeksMax);
    }
    if (autoMatch.skills != null) {
      updates.autoMatchSkills = normaliseSkills(autoMatch.skills);
    }
    if (autoMatch.notes != null) {
      const note = `${autoMatch.notes}`.trim();
      updates.autoMatchNotes = note.length ? note : null;
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
    const auditEntry = actorId
      ? buildStaffingAuditEntry('project_created', {
          actorId,
          metadata: {
            title: payload.title,
            category: payload.category,
            lifecycleState: payload.lifecycleState,
          },
        })
      : null;

    const project = await Project.create(
      {
        ownerId,
        title: payload.title,
        description: payload.description,
        category: payload.category ? `${payload.category}`.trim().slice(0, 120) : 'General',
        skills: normaliseSkills(payload.skills),
        durationWeeks: (() => {
          const duration = toInteger(payload.durationWeeks);
          return duration && duration > 0 ? duration : 4;
        })(),
        status: PROJECT_STATUSES.includes(payload.status) ? payload.status : 'planning',
        lifecycleState: payload.lifecycleState && ['open', 'closed'].includes(payload.lifecycleState)
          ? payload.lifecycleState
          : 'open',
        startDate: payload.startDate ? new Date(payload.startDate) : null,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
        budgetCurrency: payload.budgetCurrency ?? 'USD',
        budgetAllocated: toNumber(payload.budgetAllocated) ?? 0,
        metadata: auditEntry ? mergeStaffingAudit(payload.metadata, auditEntry) : payload.metadata ?? null,
      },
      { transaction },
    );

    const projectUpdates = pickProjectUpdates({ autoMatch: payload.autoMatch }, { actorId });
    if (Object.keys(projectUpdates).length) {
      await project.update(projectUpdates, { transaction });
    }

    if (Array.isArray(payload.autoMatch?.freelancers)) {
      const freelancerPayloads = payload.autoMatch.freelancers
        .map((entry) => ({
          projectId: project.id,
          freelancerId: entry.freelancerId,
          freelancerName: entry.freelancerName,
          freelancerRole: entry.freelancerRole ?? null,
          score: toNumber(entry.score),
          autoMatchEnabled: entry.autoMatchEnabled != null ? Boolean(entry.autoMatchEnabled) : true,
          status: PROJECT_AUTOMATCH_DECISION_STATUSES.includes(entry.status) ? entry.status : 'pending',
          notes: entry.notes ?? null,
          metadata: entry.metadata ?? null,
        }))
        .filter((entry) => Number.isInteger(entry.freelancerId) && entry.freelancerName);

      if (freelancerPayloads.length) {
        await ProjectAutoMatchFreelancer.bulkCreate(freelancerPayloads, { transaction });
      }
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
  if (!Number.isInteger(payload.freelancerId)) {
    throw new NotFoundError('Freelancer identifier is required.');
  }

  return projectGigManagementSequelize.transaction(async (transaction) => {
    const project = await ensureProject(projectId, ownerId, { transaction });

    const defaults = {
      projectId,
      freelancerId: payload.freelancerId,
      freelancerName: payload.freelancerName,
      freelancerRole: payload.freelancerRole ?? null,
      score: toNumber(payload.score),
      autoMatchEnabled: payload.autoMatchEnabled != null ? Boolean(payload.autoMatchEnabled) : true,
      status: PROJECT_AUTOMATCH_DECISION_STATUSES.includes(payload.status) ? payload.status : 'pending',
      notes: payload.notes ?? null,
      metadata: payload.metadata ?? null,
    };

    const [record, created] = await ProjectAutoMatchFreelancer.findOrCreate({
      where: { projectId, freelancerId: payload.freelancerId },
      defaults,
      transaction,
    });

    const updates = {};
    if (payload.freelancerName != null) {
      updates.freelancerName = `${payload.freelancerName}`.trim();
    }
    if (payload.freelancerRole != null) {
      updates.freelancerRole = payload.freelancerRole ? `${payload.freelancerRole}`.trim() : null;
    }
    if (payload.autoMatchEnabled != null) {
      updates.autoMatchEnabled = Boolean(payload.autoMatchEnabled);
    }
    if (payload.status != null && PROJECT_AUTOMATCH_DECISION_STATUSES.includes(payload.status)) {
      updates.status = payload.status;
    }
    if (payload.score != null) {
      updates.score = toNumber(payload.score);
    }
    if (payload.notes != null) {
      const trimmed = `${payload.notes}`.trim();
      updates.notes = trimmed.length ? trimmed : null;
    }
    if (payload.metadata != null && typeof payload.metadata === 'object') {
      updates.metadata = payload.metadata;
    }

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

    const updates = {};
    if (payload.autoMatchEnabled != null) {
      updates.autoMatchEnabled = Boolean(payload.autoMatchEnabled);
    }
    if (payload.status != null && PROJECT_AUTOMATCH_DECISION_STATUSES.includes(payload.status)) {
      updates.status = payload.status;
    }
    if (payload.score != null) {
      updates.score = toNumber(payload.score);
    }
    if (payload.notes != null) {
      const trimmed = `${payload.notes}`.trim();
      updates.notes = trimmed.length ? trimmed : null;
    }

    if (Object.keys(updates).length) {
      await entry.update(updates, { transaction });
    }

    await entry.reload({ transaction });

    const auditEntry = actorId
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
