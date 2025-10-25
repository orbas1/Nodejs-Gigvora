import { Op } from 'sequelize';
import {
  Project,
  ProjectWorkspace,
  ProjectMilestone,
  ProjectCollaborator,
  ProjectIntegration,
  ProjectAsset,
  ProjectRetrospective,
  PROJECT_STATUSES,
  PROJECT_RISK_LEVELS,
  PROJECT_COLLABORATOR_STATUSES,
  PROJECT_INTEGRATION_STATUSES,
  syncProjectGigManagementModels,
} from '../models/projectGigManagementModels.js';
import { User } from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import {
  createProject as createProjectForOwner,
  updateProjectWorkspace as updateProjectWorkspaceForOwner,
} from './projectGigManagementWorkflowService.js';

const likeOperator = Op.iLike ?? Op.like;

let initialized = false;

async function ensureInitialized() {
  if (initialized) {
    return;
  }
  await syncProjectGigManagementModels();
  initialized = true;
}

function toNumber(value, fallback = 0) {
  if (value == null) {
    return fallback;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toDate(value) {
  if (value == null || value === '') {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError('Invalid date provided.');
  }
  return date;
}

function ensureStatus(value) {
  if (value == null || value === '') {
    return undefined;
  }
  const normalized = `${value}`.trim().toLowerCase();
  if (!PROJECT_STATUSES.includes(normalized)) {
    throw new ValidationError(`Unsupported project status: ${value}`);
  }
  return normalized;
}

function ensureRiskLevel(value) {
  if (value == null || value === '') {
    return undefined;
  }
  const normalized = `${value}`.trim().toLowerCase();
  if (!PROJECT_RISK_LEVELS.includes(normalized)) {
    throw new ValidationError(`Unsupported project risk level: ${value}`);
  }
  return normalized;
}

function ensureCollaboratorStatus(value) {
  if (value == null || value === '') {
    return undefined;
  }
  const normalized = `${value}`.trim().toLowerCase();
  if (!PROJECT_COLLABORATOR_STATUSES.includes(normalized)) {
    throw new ValidationError(`Unsupported collaborator status: ${value}`);
  }
  return normalized;
}

function ensureIntegrationStatus(value) {
  if (value == null || value === '') {
    return undefined;
  }
  const normalized = `${value}`.trim().toLowerCase();
  if (!PROJECT_INTEGRATION_STATUSES.includes(normalized)) {
    throw new ValidationError(`Unsupported integration status: ${value}`);
  }
  return normalized;
}

function buildOwnerDirectory(users = []) {
  return users.map((user) => {
    const plain = user.get({ plain: true });
    const nameParts = [plain.firstName, plain.lastName].filter(Boolean);
    return {
      id: plain.id,
      name: nameParts.length ? nameParts.join(' ') : plain.name ?? plain.email ?? `User ${plain.id}`,
      email: plain.email ?? null,
      avatarUrl: plain.avatarUrl ?? null,
    };
  });
}

function mapOwnerDirectory(directory = []) {
  const map = new Map();
  directory.forEach((entry) => {
    map.set(entry.id, entry);
  });
  return map;
}

function sanitizeWorkspace(workspace) {
  if (!workspace) {
    return null;
  }
  return {
    id: workspace.id,
    status: workspace.status,
    progressPercent: toNumber(workspace.progressPercent, 0),
    riskLevel: workspace.riskLevel,
    healthScore: workspace.healthScore == null ? null : toNumber(workspace.healthScore, null),
    velocityScore: workspace.velocityScore == null ? null : toNumber(workspace.velocityScore, null),
    clientSatisfaction:
      workspace.clientSatisfaction == null ? null : toNumber(workspace.clientSatisfaction, null),
    automationCoverage:
      workspace.automationCoverage == null ? null : toNumber(workspace.automationCoverage, null),
    billingStatus: workspace.billingStatus ?? null,
    nextMilestone: workspace.nextMilestone ?? null,
    nextMilestoneDueAt: workspace.nextMilestoneDueAt ?? null,
    lastActivityAt: workspace.lastActivityAt ?? null,
    updatedById: workspace.updatedById ?? null,
    notes: workspace.notes ?? null,
    metrics: workspace.metricsSnapshot ?? {},
    updatedAt: workspace.updatedAt,
    createdAt: workspace.createdAt,
  };
}

function sanitizeMilestone(milestone) {
  return {
    id: milestone.id,
    title: milestone.title,
    description: milestone.description ?? null,
    ordinal: milestone.ordinal,
    dueDate: milestone.dueDate ?? null,
    completedAt: milestone.completedAt ?? null,
    status: milestone.status,
    budget: toNumber(milestone.budget, 0),
    metrics: milestone.metrics ?? {},
    createdAt: milestone.createdAt,
    updatedAt: milestone.updatedAt,
  };
}

function sanitizeCollaborator(collaborator) {
  return {
    id: collaborator.id,
    fullName: collaborator.fullName,
    email: collaborator.email ?? null,
    role: collaborator.role,
    status: collaborator.status,
    hourlyRate: collaborator.hourlyRate != null ? toNumber(collaborator.hourlyRate, null) : null,
    permissions: collaborator.permissions ?? {},
    createdAt: collaborator.createdAt,
    updatedAt: collaborator.updatedAt,
  };
}

function sanitizeIntegration(integration) {
  return {
    id: integration.id,
    provider: integration.provider,
    status: integration.status,
    connectedAt: integration.connectedAt ?? null,
    metadata: integration.metadata ?? {},
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt,
  };
}

function sanitizeAsset(asset) {
  return {
    id: asset.id,
    label: asset.label,
    category: asset.category,
    storageUrl: asset.storageUrl,
    thumbnailUrl: asset.thumbnailUrl ?? null,
    sizeBytes: asset.sizeBytes ?? 0,
    permissionLevel: asset.permissionLevel,
    watermarkEnabled: Boolean(asset.watermarkEnabled),
    metadata: asset.metadata ?? {},
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  };
}

function sanitizeRetrospective(retro) {
  return {
    id: retro.id,
    milestoneTitle: retro.milestoneTitle,
    summary: retro.summary,
    sentiment: retro.sentiment ?? null,
    generatedAt: retro.generatedAt,
    highlights: retro.highlights ?? {},
  };
}

function sanitizeProject(projectInstance, ownerDirectory) {
  const project = projectInstance.get({ plain: true });
  const owner = ownerDirectory?.get(project.ownerId) ?? null;

  return {
    id: project.id,
    ownerId: project.ownerId,
    owner,
    title: project.title,
    description: project.description,
    status: project.status,
    startDate: project.startDate ?? null,
    dueDate: project.dueDate ?? null,
    archivedAt: project.archivedAt ?? null,
    budgetCurrency: project.budgetCurrency,
    budgetAllocated: toNumber(project.budgetAllocated, 0),
    budgetSpent: toNumber(project.budgetSpent, 0),
    metadata: project.metadata ?? {},
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    workspace: sanitizeWorkspace(project.workspace ?? null),
    milestones: Array.isArray(project.milestones)
      ? project.milestones.map((milestone) => sanitizeMilestone(milestone))
      : [],
    collaborators: Array.isArray(project.collaborators)
      ? project.collaborators.map((collaborator) => sanitizeCollaborator(collaborator))
      : [],
    integrations: Array.isArray(project.integrations)
      ? project.integrations.map((integration) => sanitizeIntegration(integration))
      : [],
    assets: Array.isArray(project.assets) ? project.assets.map((asset) => sanitizeAsset(asset)) : [],
    retrospectives: Array.isArray(project.retrospectives)
      ? project.retrospectives.map((retro) => sanitizeRetrospective(retro))
      : [],
  };
}

function summarizeProjects(projects = []) {
  if (!projects.length) {
    return {
      totalProjects: 0,
      activeProjects: 0,
      atRiskProjects: 0,
      completedProjects: 0,
      budgetAllocated: 0,
      budgetSpent: 0,
      averageProgress: 0,
      statusBreakdown: {},
      riskBreakdown: {},
    };
  }

  const statusBreakdown = {};
  const riskBreakdown = {};
  let activeProjects = 0;
  let completedProjects = 0;
  let atRiskProjects = 0;
  let progressTotal = 0;
  let budgetAllocated = 0;
  let budgetSpent = 0;

  projects.forEach((project) => {
    const workspaceStatus = project.workspace?.status ?? project.status;
    statusBreakdown[workspaceStatus] = (statusBreakdown[workspaceStatus] ?? 0) + 1;
    if (workspaceStatus === 'completed') {
      completedProjects += 1;
    } else {
      activeProjects += 1;
    }

    const riskLevel = project.workspace?.riskLevel ?? 'low';
    riskBreakdown[riskLevel] = (riskBreakdown[riskLevel] ?? 0) + 1;
    if (riskLevel === 'high') {
      atRiskProjects += 1;
    }

    progressTotal += toNumber(project.workspace?.progressPercent, 0);
    budgetAllocated += toNumber(project.budgetAllocated, 0);
    budgetSpent += toNumber(project.budgetSpent, 0);
  });

  const averageProgress = progressTotal / projects.length;

  return {
    totalProjects: projects.length,
    activeProjects,
    atRiskProjects,
    completedProjects,
    budgetAllocated,
    budgetSpent,
    averageProgress,
    statusBreakdown,
    riskBreakdown,
  };
}

function humanizeStatus(value) {
  if (!value) {
    return '';
  }
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildBoard(projects, ownerDirectory) {
  const map = mapOwnerDirectory(ownerDirectory);
  const order = ['planning', 'in_progress', 'at_risk', 'on_hold', 'completed'];
  return order.map((status) => {
    const bucket = projects.filter((project) => (project.workspace?.status ?? project.status) === status);
    return {
      key: status,
      label: humanizeStatus(status),
      count: bucket.length,
      projects: bucket
        .slice()
        .sort((a, b) => {
          const aDue = a.workspace?.nextMilestoneDueAt ?? a.dueDate ?? null;
          const bDue = b.workspace?.nextMilestoneDueAt ?? b.dueDate ?? null;
          if (!aDue && !bDue) return 0;
          if (!aDue) return 1;
          if (!bDue) return -1;
          return new Date(aDue).getTime() - new Date(bDue).getTime();
        })
        .slice(0, 12)
        .map((project) => ({
          id: project.id,
          title: project.title,
          ownerId: project.ownerId,
          owner: map.get(project.ownerId) ?? null,
          status: project.status,
          workspaceStatus: project.workspace?.status ?? project.status,
          riskLevel: project.workspace?.riskLevel ?? 'low',
          progressPercent: toNumber(project.workspace?.progressPercent, 0),
          nextMilestone: project.workspace?.nextMilestone ?? null,
          nextMilestoneDueAt: project.workspace?.nextMilestoneDueAt ?? project.dueDate ?? null,
          updatedAt: project.updatedAt,
        })),
    };
  });
}

async function fetchOwnerDirectory(ownerIds) {
  if (!ownerIds.length) {
    return [];
  }
  const users = await User.findAll({ where: { id: { [Op.in]: ownerIds } } });
  return buildOwnerDirectory(users);
}

async function loadProjectsWithWorkspace(where, workspaceFilter) {
  await ensureInitialized();
  const include = [
    {
      model: ProjectWorkspace,
      as: 'workspace',
      required: workspaceFilter && Object.keys(workspaceFilter).length > 0,
      where: workspaceFilter && Object.keys(workspaceFilter).length > 0 ? workspaceFilter : undefined,
    },
  ];

  return Project.findAll({
    where,
    include,
    order: [
      ['updatedAt', 'DESC'],
      ['id', 'ASC'],
    ],
  });
}

export async function getProjectPortfolioSnapshot(options = {}) {
  await ensureInitialized();

  const statuses = Array.isArray(options.statuses)
    ? options.statuses.map((status) => status.toLowerCase()).filter((status) => PROJECT_STATUSES.includes(status))
    : [];
  const riskLevels = Array.isArray(options.riskLevels)
    ? options.riskLevels.map((risk) => risk.toLowerCase()).filter((risk) => PROJECT_RISK_LEVELS.includes(risk))
    : [];

  const where = {};
  if (options.search) {
    const term = `%${options.search.trim()}%`;
    where[Op.or] = [
      { title: { [likeOperator]: term } },
      { description: { [likeOperator]: term } },
    ];
  }
  if (statuses.length) {
    where.status = { [Op.in]: statuses };
  }
  if (options.ownerId) {
    where.ownerId = options.ownerId;
  }

  const workspaceFilter = {};
  if (riskLevels.length) {
    workspaceFilter.riskLevel = { [Op.in]: riskLevels };
  }

  const sortBy = options.sortBy ?? 'updatedAt';
  const direction = (options.sortDirection ?? 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const limit = Number.isInteger(options.limit) && options.limit > 0 && options.limit <= 100 ? options.limit : 25;
  const offset = Number.isInteger(options.offset) && options.offset >= 0 ? options.offset : 0;

  const include = [
    {
      model: ProjectWorkspace,
      as: 'workspace',
      required: workspaceFilter && Object.keys(workspaceFilter).length > 0,
      where: workspaceFilter && Object.keys(workspaceFilter).length > 0 ? workspaceFilter : undefined,
    },
  ];

  const sortableColumns = new Map([
    ['status', ['status', direction]],
    ['dueDate', ['dueDate', direction]],
    ['progress', [{ model: ProjectWorkspace, as: 'workspace' }, 'progressPercent', direction]],
    ['risk', [{ model: ProjectWorkspace, as: 'workspace' }, 'riskLevel', direction]],
    ['owner', ['ownerId', direction]],
    ['updatedAt', ['updatedAt', direction]],
  ]);

  const order = [];
  if (sortableColumns.has(sortBy)) {
    order.push(sortableColumns.get(sortBy));
  }
  order.push(['updatedAt', 'DESC']);

  const { count, rows } = await Project.findAndCountAll({
    where,
    include,
    limit,
    offset,
    order,
  });

  const projectIds = rows.map((project) => project.id);
  const ownerIds = Array.from(new Set(rows.map((project) => project.ownerId))).filter(Boolean);
  const ownerDirectory = await fetchOwnerDirectory(ownerIds);
  const ownerMap = mapOwnerDirectory(ownerDirectory);

  const sanitizedRows = rows.map((project) => {
    const plain = project.get({ plain: true });
    const workspace = plain.workspace ?? null;
    return {
      id: plain.id,
      ownerId: plain.ownerId,
      owner: ownerMap.get(plain.ownerId) ?? null,
      title: plain.title,
      status: plain.status,
      startDate: plain.startDate ?? null,
      dueDate: plain.dueDate ?? null,
      budgetCurrency: plain.budgetCurrency,
      budgetAllocated: toNumber(plain.budgetAllocated, 0),
      budgetSpent: toNumber(plain.budgetSpent, 0),
      workspace: workspace
        ? {
            status: workspace.status,
            progressPercent: toNumber(workspace.progressPercent, 0),
            riskLevel: workspace.riskLevel,
            nextMilestone: workspace.nextMilestone ?? null,
            nextMilestoneDueAt: workspace.nextMilestoneDueAt ?? null,
          }
        : null,
      updatedAt: plain.updatedAt,
      createdAt: plain.createdAt,
    };
  });

  const projectsForSummary = await loadProjectsWithWorkspace(where, workspaceFilter);
  const ownerIdsForSummary = Array.from(
    new Set(projectsForSummary.map((project) => project.ownerId)),
  );
  const summaryDirectory = await fetchOwnerDirectory(ownerIdsForSummary);
  const summaryOwnerMap = mapOwnerDirectory(summaryDirectory);
  const sanitizedForSummary = projectsForSummary.map((project) => sanitizeProject(project, summaryOwnerMap));
  const detailedSummary = summarizeProjects(sanitizedForSummary);

  return {
    refreshedAt: new Date().toISOString(),
    pagination: {
      total: count,
      limit,
      offset,
    },
    summary: {
      totalProjects: detailedSummary.totalProjects,
      activeProjects: detailedSummary.activeProjects,
      atRiskProjects: detailedSummary.atRiskProjects,
      completedProjects: detailedSummary.completedProjects,
      budgetAllocated: detailedSummary.budgetAllocated,
      budgetSpent: detailedSummary.budgetSpent,
      averageProgress: detailedSummary.averageProgress,
    },
    breakdowns: {
      status: detailedSummary.statusBreakdown,
      risk: detailedSummary.riskBreakdown,
    },
    board: buildBoard(projectsForSummary.map((project) => project.get({ plain: true })), summaryDirectory),
    projects: sanitizedRows,
    owners: ownerDirectory,
    projectIds,
  };
}

export async function getProjectPortfolioSummary() {
  const snapshot = await getProjectPortfolioSnapshot({ limit: 5, offset: 0 });
  return {
    refreshedAt: snapshot.refreshedAt,
    summary: snapshot.summary,
    breakdowns: snapshot.breakdowns,
  };
}

async function loadProjectDetail(projectId) {
  await ensureInitialized();
  const project = await Project.findByPk(projectId, {
    include: [
      { model: ProjectWorkspace, as: 'workspace' },
      { model: ProjectMilestone, as: 'milestones', separate: true, order: [['ordinal', 'ASC']] },
      { model: ProjectCollaborator, as: 'collaborators' },
      { model: ProjectIntegration, as: 'integrations' },
      { model: ProjectAsset, as: 'assets' },
      {
        model: ProjectRetrospective,
        as: 'retrospectives',
        separate: true,
        order: [['generatedAt', 'DESC']],
      },
    ],
  });
  if (!project) {
    throw new NotFoundError('Project not found.');
  }
  const ownerDirectory = await fetchOwnerDirectory([project.ownerId]);
  const ownerMap = mapOwnerDirectory(ownerDirectory);
  return sanitizeProject(project, ownerMap);
}

export async function getProjectDetail(projectId) {
  const project = await loadProjectDetail(projectId);
  return { project };
}

export async function createProject(payload) {
  if (!payload.ownerId) {
    throw new ValidationError('ownerId is required.');
  }
  const owner = await User.findByPk(payload.ownerId);
  if (!owner) {
    throw new NotFoundError('Owner account not found.');
  }
  const { ownerId, assets, ...rest } = payload;
  const project = await createProjectForOwner(ownerId, { ...rest, assets });
  const detail = await loadProjectDetail(project.id);
  return { project: detail };
}

export async function updateProject(projectId, payload) {
  await ensureInitialized();
  const project = await Project.findByPk(projectId, {
    include: [{ model: ProjectWorkspace, as: 'workspace' }],
  });
  if (!project) {
    throw new NotFoundError('Project not found.');
  }

  const updates = {};
  if (payload.title != null) {
    updates.title = payload.title;
  }
  if (payload.description != null) {
    updates.description = payload.description;
  }
  if (payload.status != null) {
    updates.status = ensureStatus(payload.status);
  }
  if (payload.budgetCurrency != null) {
    updates.budgetCurrency = payload.budgetCurrency;
  }
  if (payload.metadata != null) {
    updates.metadata = payload.metadata;
  }

  const currentAllocated = toNumber(project.budgetAllocated, 0);
  if (payload.budgetAllocated != null) {
    const allocated = toNumber(payload.budgetAllocated, 0);
    if (allocated < 0) {
      throw new ValidationError('Budget allocated cannot be negative.');
    }
    updates.budgetAllocated = allocated;
  }
  if (payload.budgetSpent != null) {
    const spent = toNumber(payload.budgetSpent, 0);
    if (spent < 0) {
      throw new ValidationError('Budget spent cannot be negative.');
    }
    const allocated = updates.budgetAllocated != null ? updates.budgetAllocated : currentAllocated;
    if (spent > allocated) {
      throw new ValidationError('Budget spent cannot exceed the allocated amount.');
    }
    updates.budgetSpent = spent;
  }

  const startDate = payload.startDate != null ? toDate(payload.startDate) : null;
  if (payload.startDate !== undefined) {
    updates.startDate = startDate;
  }
  const dueDate = payload.dueDate != null ? toDate(payload.dueDate) : null;
  if (payload.dueDate !== undefined) {
    if (startDate && dueDate && dueDate.getTime() < startDate.getTime()) {
      throw new ValidationError('Due date cannot be earlier than the start date.');
    }
    updates.dueDate = dueDate;
  } else if (updates.startDate && project.dueDate) {
    const newDue = project.dueDate ? new Date(project.dueDate) : null;
    if (newDue && newDue.getTime() < updates.startDate.getTime()) {
      throw new ValidationError('Due date cannot be earlier than the start date.');
    }
  }

  if (payload.archivedAt !== undefined) {
    updates.archivedAt = payload.archivedAt ? toDate(payload.archivedAt) : null;
  }

  if (payload.ownerId && payload.ownerId !== project.ownerId) {
    const owner = await User.findByPk(payload.ownerId);
    if (!owner) {
      throw new NotFoundError('New owner account not found.');
    }
    updates.ownerId = payload.ownerId;
  }

  if (Object.keys(updates).length) {
    await project.update(updates);
  }

  const detail = await loadProjectDetail(projectId);
  return { project: detail };
}

export async function updateProjectWorkspace(projectId, payload) {
  await ensureInitialized();
  const project = await Project.findByPk(projectId);
  if (!project) {
    throw new NotFoundError('Project not found.');
  }

  await updateProjectWorkspaceForOwner(project.ownerId, projectId, {
    status: payload.status != null ? ensureStatus(payload.status) : undefined,
    riskLevel: payload.riskLevel != null ? ensureRiskLevel(payload.riskLevel) : undefined,
    progressPercent: payload.progressPercent != null ? toNumber(payload.progressPercent, 0) : undefined,
    nextMilestone: payload.nextMilestone ?? undefined,
    nextMilestoneDueAt: payload.nextMilestoneDueAt != null ? toDate(payload.nextMilestoneDueAt) : undefined,
    notes: payload.notes ?? undefined,
    metrics: payload.metrics ?? undefined,
  });

  const detail = await loadProjectDetail(projectId);
  return { project: detail };
}

export async function createProjectMilestone(projectId, payload) {
  await ensureInitialized();
  const project = await Project.findByPk(projectId);
  if (!project) {
    throw new NotFoundError('Project not found.');
  }

  const ordinal = payload.ordinal != null ? Number(payload.ordinal) : await ProjectMilestone.count({ where: { projectId } });
  const milestone = await ProjectMilestone.create({
    projectId,
    title: payload.title,
    description: payload.description ?? null,
    ordinal,
    dueDate: payload.dueDate != null ? toDate(payload.dueDate) : null,
    completedAt: payload.completedAt != null ? toDate(payload.completedAt) : null,
    status: payload.status ? payload.status : 'planned',
    budget: payload.budget != null ? toNumber(payload.budget, 0) : 0,
    metrics: payload.metrics ?? {},
  });

  const detail = await loadProjectDetail(projectId);
  return { milestone: sanitizeMilestone(milestone), project: detail };
}

export async function updateProjectMilestone(projectId, milestoneId, payload) {
  await ensureInitialized();
  const milestone = await ProjectMilestone.findOne({ where: { id: milestoneId, projectId } });
  if (!milestone) {
    throw new NotFoundError('Milestone not found.');
  }

  const updates = {};
  if (payload.title != null) updates.title = payload.title;
  if (payload.description != null) updates.description = payload.description;
  if (payload.status != null) updates.status = payload.status;
  if (payload.ordinal != null) updates.ordinal = Number(payload.ordinal);
  if (payload.dueDate !== undefined) updates.dueDate = payload.dueDate ? toDate(payload.dueDate) : null;
  if (payload.completedAt !== undefined) updates.completedAt = payload.completedAt ? toDate(payload.completedAt) : null;
  if (payload.budget != null) updates.budget = toNumber(payload.budget, 0);
  if (payload.metrics != null) updates.metrics = payload.metrics;

  if (Object.keys(updates).length) {
    await milestone.update(updates);
  }

  const detail = await loadProjectDetail(projectId);
  return { milestone: sanitizeMilestone(await milestone.reload()), project: detail };
}

export async function deleteProjectMilestone(projectId, milestoneId) {
  await ensureInitialized();
  const deleted = await ProjectMilestone.destroy({ where: { id: milestoneId, projectId } });
  if (!deleted) {
    throw new NotFoundError('Milestone not found.');
  }
  const detail = await loadProjectDetail(projectId);
  return { project: detail };
}

export async function createProjectCollaborator(projectId, payload) {
  await ensureInitialized();
  const project = await Project.findByPk(projectId);
  if (!project) {
    throw new NotFoundError('Project not found.');
  }

  const collaborator = await ProjectCollaborator.create({
    projectId,
    fullName: payload.fullName,
    email: payload.email ?? null,
    role: payload.role ?? 'Collaborator',
    status: ensureCollaboratorStatus(payload.status) ?? 'invited',
    hourlyRate: payload.hourlyRate != null ? toNumber(payload.hourlyRate, 0) : null,
    permissions: payload.permissions ?? {},
  });

  const detail = await loadProjectDetail(projectId);
  return { collaborator: sanitizeCollaborator(collaborator), project: detail };
}

export async function updateProjectCollaborator(projectId, collaboratorId, payload) {
  await ensureInitialized();
  const collaborator = await ProjectCollaborator.findOne({ where: { id: collaboratorId, projectId } });
  if (!collaborator) {
    throw new NotFoundError('Collaborator not found.');
  }

  const updates = {};
  if (payload.fullName != null) updates.fullName = payload.fullName;
  if (payload.email !== undefined) updates.email = payload.email ?? null;
  if (payload.role != null) updates.role = payload.role;
  if (payload.status != null) updates.status = ensureCollaboratorStatus(payload.status) ?? collaborator.status;
  if (payload.hourlyRate !== undefined)
    updates.hourlyRate = payload.hourlyRate != null ? toNumber(payload.hourlyRate, 0) : null;
  if (payload.permissions != null) updates.permissions = payload.permissions;

  if (Object.keys(updates).length) {
    await collaborator.update(updates);
  }

  const detail = await loadProjectDetail(projectId);
  return { collaborator: sanitizeCollaborator(await collaborator.reload()), project: detail };
}

export async function deleteProjectCollaborator(projectId, collaboratorId) {
  await ensureInitialized();
  const deleted = await ProjectCollaborator.destroy({ where: { id: collaboratorId, projectId } });
  if (!deleted) {
    throw new NotFoundError('Collaborator not found.');
  }
  const detail = await loadProjectDetail(projectId);
  return { project: detail };
}

export async function createProjectIntegration(projectId, payload) {
  await ensureInitialized();
  const project = await Project.findByPk(projectId);
  if (!project) {
    throw new NotFoundError('Project not found.');
  }

  const integration = await ProjectIntegration.create({
    projectId,
    provider: payload.provider,
    status: ensureIntegrationStatus(payload.status) ?? 'connected',
    connectedAt: payload.connectedAt ? toDate(payload.connectedAt) : new Date(),
    metadata: payload.metadata ?? {},
  });

  const detail = await loadProjectDetail(projectId);
  return { integration: sanitizeIntegration(integration), project: detail };
}

export async function updateProjectIntegration(projectId, integrationId, payload) {
  await ensureInitialized();
  const integration = await ProjectIntegration.findOne({ where: { id: integrationId, projectId } });
  if (!integration) {
    throw new NotFoundError('Integration not found.');
  }

  const updates = {};
  if (payload.provider != null) updates.provider = payload.provider;
  if (payload.status != null) updates.status = ensureIntegrationStatus(payload.status) ?? integration.status;
  if (payload.connectedAt !== undefined) updates.connectedAt = payload.connectedAt ? toDate(payload.connectedAt) : null;
  if (payload.metadata != null) updates.metadata = payload.metadata;

  if (Object.keys(updates).length) {
    await integration.update(updates);
  }

  const detail = await loadProjectDetail(projectId);
  return { integration: sanitizeIntegration(await integration.reload()), project: detail };
}

export async function deleteProjectIntegration(projectId, integrationId) {
  await ensureInitialized();
  const deleted = await ProjectIntegration.destroy({ where: { id: integrationId, projectId } });
  if (!deleted) {
    throw new NotFoundError('Integration not found.');
  }
  const detail = await loadProjectDetail(projectId);
  return { project: detail };
}

export async function createProjectAsset(projectId, payload) {
  await ensureInitialized();
  const project = await Project.findByPk(projectId);
  if (!project) {
    throw new NotFoundError('Project not found.');
  }

  const asset = await ProjectAsset.create({
    projectId,
    label: payload.label,
    category: payload.category ?? 'artifact',
    storageUrl: payload.storageUrl,
    thumbnailUrl: payload.thumbnailUrl ?? null,
    sizeBytes: payload.sizeBytes != null ? Number(payload.sizeBytes) : 0,
    permissionLevel: payload.permissionLevel ?? 'internal',
    watermarkEnabled: payload.watermarkEnabled != null ? Boolean(payload.watermarkEnabled) : true,
    metadata: payload.metadata ?? {},
  });

  const detail = await loadProjectDetail(projectId);
  return { asset: sanitizeAsset(asset), project: detail };
}

export async function deleteProjectAsset(projectId, assetId) {
  await ensureInitialized();
  const deleted = await ProjectAsset.destroy({ where: { id: assetId, projectId } });
  if (!deleted) {
    throw new NotFoundError('Asset not found.');
  }
  const detail = await loadProjectDetail(projectId);
  return { project: detail };
}

export async function createProjectRetrospective(projectId, payload) {
  await ensureInitialized();
  const project = await Project.findByPk(projectId);
  if (!project) {
    throw new NotFoundError('Project not found.');
  }

  const retrospective = await ProjectRetrospective.create({
    projectId,
    milestoneTitle: payload.milestoneTitle ?? 'Milestone',
    summary: payload.summary,
    sentiment: payload.sentiment ?? null,
    generatedAt: payload.generatedAt ? toDate(payload.generatedAt) : new Date(),
    highlights: payload.highlights ?? {},
  });

  const detail = await loadProjectDetail(projectId);
  return { retrospective: sanitizeRetrospective(retrospective), project: detail };
}

export default {
  getProjectPortfolioSnapshot,
  getProjectPortfolioSummary,
  getProjectDetail,
  createProject,
  updateProject,
  updateProjectWorkspace,
  createProjectMilestone,
  updateProjectMilestone,
  deleteProjectMilestone,
  createProjectCollaborator,
  updateProjectCollaborator,
  deleteProjectCollaborator,
  createProjectIntegration,
  updateProjectIntegration,
  deleteProjectIntegration,
  createProjectAsset,
  deleteProjectAsset,
  createProjectRetrospective,
};
