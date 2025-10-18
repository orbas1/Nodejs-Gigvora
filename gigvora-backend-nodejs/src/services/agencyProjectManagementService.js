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

export async function listAgencyProjects(ownerId) {
  const projects = await Project.findAll({
    where: { ownerId },
    include: [{ model: ProjectAutoMatchFreelancer, as: 'autoMatchFreelancers' }],
    order: [
      ['updatedAt', 'DESC'],
      [{ model: ProjectAutoMatchFreelancer, as: 'autoMatchFreelancers' }, 'updatedAt', 'DESC'],
    ],
  });

  const plainProjects = projects.map(toPlainProject).filter(Boolean);
  const openProjects = plainProjects.filter((project) => project.lifecycleState !== 'closed');
  const closedProjects = plainProjects.filter((project) => project.lifecycleState === 'closed');
  const autoMatchEnabledCount = plainProjects.filter((project) => project.autoMatch.enabled).length;
  const autoMatchQueue = plainProjects
    .filter((project) => project.autoMatch.enabled)
    .map((project) => ({
      projectId: project.id,
      projectTitle: project.title,
      pending: project.autoMatchFreelancers.filter((entry) => entry.status === 'pending'),
    }))
    .filter((entry) => entry.pending.length > 0);

  return {
    summary: {
      totalProjects: plainProjects.length,
      openCount: openProjects.length,
      closedCount: closedProjects.length,
      autoMatchEnabledCount,
    },
    openProjects,
    closedProjects,
    autoMatchQueue,
  };
}

export async function createAgencyProject(ownerId, payload, { actorId } = {}) {
  return projectGigManagementSequelize.transaction(async (transaction) => {
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
        metadata: payload.metadata ?? null,
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

export async function updateAgencyProject(ownerId, projectId, payload, { actorId } = {}) {
  return projectGigManagementSequelize.transaction(async (transaction) => {
    const project = await ensureProject(projectId, ownerId, { transaction });
    const updates = pickProjectUpdates(payload, { actorId });

    if (Object.keys(updates).length > 0) {
      await project.update(updates, { transaction });
    }

    await project.reload({ include: [{ model: ProjectAutoMatchFreelancer, as: 'autoMatchFreelancers' }], transaction });
    return toPlainProject(project);
  });
}

export async function updateProjectAutoMatchSettings(ownerId, projectId, payload, { actorId } = {}) {
  return updateAgencyProject(ownerId, projectId, { autoMatch: payload }, { actorId });
}

export async function upsertProjectAutoMatchFreelancer(ownerId, projectId, payload) {
  if (!Number.isInteger(payload.freelancerId)) {
    throw new NotFoundError('Freelancer identifier is required.');
  }

  return projectGigManagementSequelize.transaction(async (transaction) => {
    await ensureProject(projectId, ownerId, { transaction });

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

    const [record] = await ProjectAutoMatchFreelancer.findOrCreate({
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
    return toPlainFreelancer(record);
  });
}

export async function updateProjectAutoMatchFreelancer(ownerId, projectId, entryId, payload) {
  return projectGigManagementSequelize.transaction(async (transaction) => {
    await ensureProject(projectId, ownerId, { transaction });

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
