import {
  projectGigManagementSequelize,
  Project,
  ProjectWorkspace,
  ProjectMilestone,
  ProjectCollaborator,
  ProjectIntegration,
  ProjectRetrospective,
  ProjectAsset,
  ProjectTemplate,
  GigOrder,
  GigOrderRequirement,
  GigOrderRevision,
  GigVendorScorecard,
  StoryBlock,
  BrandAsset,
  PROJECT_STATUSES,
  PROJECT_RISK_LEVELS,
  PROJECT_COLLABORATOR_STATUSES,
  GIG_ORDER_STATUSES,
  syncProjectGigManagementModels,
} from '../models/projectGigManagementModels.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function normalizeNumber(value, fallback = 0) {
  if (value == null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function ensureNumber(value, { label, allowNegative = false, allowZero = true } = {}) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ValidationError(`${label ?? 'Value'} must be a valid number.`);
  }
  if (!allowNegative && parsed < 0) {
    throw new ValidationError(`${label ?? 'Value'} cannot be negative.`);
  }
  if (!allowZero && parsed === 0) {
    throw new ValidationError(`${label ?? 'Value'} must be greater than zero.`);
  }
  return parsed;
}

function ensureDate(value, { label } = {}) {
  if (value == null) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${label ?? 'Date'} is not valid.`);
  }
  return date;
}

function computeBudgetSnapshot(project) {
  const allocated = normalizeNumber(project.budgetAllocated);
  const spent = normalizeNumber(project.budgetSpent);
  const remaining = Math.max(allocated - spent, 0);
  const burnRate = allocated === 0 ? 0 : (spent / allocated) * 100;
  return {
    currency: project.budgetCurrency,
    allocated,
    spent,
    remaining,
    burnRatePercent: burnRate,
  };
}

function summarizeAssets(assets = []) {
  const total = assets.length;
  const restricted = assets.filter((asset) => asset.permissionLevel !== 'public').length;
  const watermarkCoverage = total === 0 ? 0 : (assets.filter((asset) => asset.watermarkEnabled).length / total) * 100;
  const storageBytes = assets.reduce((acc, asset) => acc + normalizeNumber(asset.sizeBytes), 0);
  return {
    total,
    restricted,
    watermarkCoverage,
    storageBytes,
  };
}

function buildBoardLanes(projects) {
  const lanes = PROJECT_STATUSES.map((status) => ({
    status,
    label: status.replace(/_/g, ' '),
    projects: [],
  }));
  const laneMap = new Map(lanes.map((lane) => [lane.status, lane]));

  projects.forEach((project) => {
    const laneKey = project.workspace?.status ?? project.status ?? 'planning';
    const lane = laneMap.get(laneKey) ?? laneMap.get('planning');
    lane.projects.push({
      id: project.id,
      title: project.title,
      progress: normalizeNumber(project.workspace?.progressPercent),
      riskLevel: project.workspace?.riskLevel ?? 'low',
      dueAt: project.workspace?.nextMilestoneDueAt ?? project.dueDate ?? null,
    });
  });

  return lanes;
}

function buildBoardMetrics(projects) {
  if (projects.length === 0) {
    return {
      averageProgress: 0,
      activeProjects: 0,
      atRisk: 0,
      completed: 0,
    };
  }
  const averageProgress =
    projects.reduce((total, project) => total + normalizeNumber(project.workspace?.progressPercent), 0) /
    projects.length;
  const atRisk = projects.filter((project) => project.workspace?.riskLevel === 'high').length;
  const completed = projects.filter((project) => project.workspace?.status === 'completed').length;
  const activeProjects = projects.length - completed;
  return { averageProgress, atRisk, completed, activeProjects };
}

function buildVendorStats(orders) {
  if (orders.length === 0) {
    return {
      totalOrders: 0,
      active: 0,
      completed: 0,
      averageProgress: 0,
      averages: { overall: null, quality: null, communication: null, reliability: null },
    };
  }
  const active = orders.filter((order) => !['completed', 'cancelled'].includes(order.status)).length;
  const completed = orders.filter((order) => order.status === 'completed').length;
  const averageProgress =
    orders.reduce((total, order) => total + normalizeNumber(order.progressPercent), 0) / orders.length;

  const aggregate = orders.reduce(
    (acc, order) => {
      const scorecard = order.scorecard ?? {};
      ['overall', 'quality', 'communication', 'reliability'].forEach((key) => {
        const value = normalizeNumber(scorecard[`${key}Score`], null);
        if (value != null) {
          acc[key].sum += value;
          acc[key].count += 1;
        }
      });
      return acc;
    },
    {
      overall: { sum: 0, count: 0 },
      quality: { sum: 0, count: 0 },
      communication: { sum: 0, count: 0 },
      reliability: { sum: 0, count: 0 },
    },
  );

  const averages = Object.fromEntries(
    Object.entries(aggregate).map(([key, { sum, count }]) => [key, count === 0 ? null : sum / count]),
  );

  return { totalOrders: orders.length, active, completed, averageProgress, averages };
}

function buildGigReminders(orders) {
  const now = Date.now();
  return orders
    .flatMap((order) => {
      const reminders = [];
      if (order.dueAt) {
        reminders.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          type: 'delivery_due',
          dueAt: order.dueAt,
          overdue: new Date(order.dueAt).getTime() < now,
        });
      }
      order.requirements?.forEach((requirement) => {
        reminders.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          type: 'requirement',
          title: requirement.title,
          dueAt: requirement.dueAt,
          status: requirement.status,
        });
      });
      return reminders;
    })
    .sort((a, b) => new Date(a.dueAt || 0).getTime() - new Date(b.dueAt || 0).getTime());
}

function buildStorytelling(projects, orders, storyBlocks) {
  const achievements = [];

  projects.forEach((project) => {
    const progress = normalizeNumber(project.workspace?.progressPercent);
    if (progress >= 70) {
      achievements.push({
        type: 'project',
        title: project.title,
        bullet: `Advanced ${progress.toFixed(0)}% with ${project.collaborators.length} collaborators.`,
      });
    }
  });

  orders.forEach((order) => {
    if (order.status === 'completed') {
      achievements.push({
        type: 'gig',
        title: order.serviceName,
        bullet: `Delivered ${order.serviceName} with ${order.vendorName} and captured ${order.currency} ${order.amount}.`,
      });
    }
  });

  storyBlocks.forEach((block) => {
    achievements.push({
      type: 'story_block',
      title: block.title,
      bullet: block.outcome,
    });
  });

  const quickExports = {
    resume: achievements.slice(0, 3).map((achievement) => `• ${achievement.bullet}`),
    linkedin: achievements.slice(0, 2).map((achievement) => `Celebrated ${achievement.title}`),
    coverLetter: achievements.map((achievement) => `${achievement.title} — ${achievement.bullet}`),
  };

  const prompts = achievements.map((achievement) =>
    `How would you expand on ${achievement.title} to highlight measurable impact and collaborators?`,
  );

  return { achievements, quickExports, prompts };
}

function parseTagList(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : null))
      .filter((item) => item && item.length > 0)
      .slice(0, 20);
  }

  if (typeof value === 'string') {
    return value
      .split(/[,#/]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, 20);
  }

  return [];
}

function buildLifecycleSnapshot(project) {
  const workspaceStatus = project.workspace?.status ?? project.status ?? 'planning';
  const nextDueAt = project.workspace?.nextMilestoneDueAt ?? project.dueDate ?? null;
  const dueDate = nextDueAt ? new Date(nextDueAt) : null;
  const overdue = dueDate ? dueDate.getTime() < Date.now() : false;
  const riskLevel = project.workspace?.riskLevel ?? 'low';
  const progressPercent = normalizeNumber(project.workspace?.progressPercent ?? 0);

  const milestoneCount = Array.isArray(project.milestones) ? project.milestones.length : 0;
  const completedMilestones = Array.isArray(project.milestones)
    ? project.milestones.filter((milestone) => milestone.status === 'completed').length
    : 0;
  const upcomingMilestone = Array.isArray(project.milestones)
    ? project.milestones.find((milestone) => milestone.status !== 'completed') ?? null
    : null;

  const metadata = project.metadata ?? {};
  const clientName = metadata.clientName ?? metadata.client ?? null;
  const workspaceUrl = metadata.workspaceUrl ?? metadata.portalUrl ?? metadata.clientPortalUrl ?? null;
  const coverImageUrl = metadata.coverImageUrl ?? metadata.heroImageUrl ?? metadata.thumbnailUrl ?? null;
  const highlightImageUrl = metadata.highlightImageUrl ?? metadata.presentationImageUrl ?? null;
  const tags = parseTagList(metadata.tags);

  const archivedAt = project.archivedAt ? new Date(project.archivedAt).toISOString() : null;
  const startDate = project.startDate ? new Date(project.startDate) : null;
  const cycleTimeDays = archivedAt && startDate ? Math.max(Math.round((new Date(archivedAt) - startDate) / (1000 * 60 * 60 * 24)), 0) : null;
  const reopenedAt = metadata.lifecycle?.restoredAt ?? metadata.restoredAt ?? null;
  const lastStatusChange = metadata.lifecycle?.lastStatusChange ?? null;

  const healthScore = (() => {
    const baseline = Number.isFinite(progressPercent) ? progressPercent : 0;
    const riskPenalty = riskLevel === 'high' ? -35 : riskLevel === 'medium' ? -15 : 5;
    const overduePenalty = overdue ? -20 : 0;
    const completionBoost = workspaceStatus === 'completed' ? 20 : 0;
    const score = baseline + riskPenalty + overduePenalty + completionBoost + completedMilestones * 2;
    return Math.max(0, Math.min(100, Math.round(score)));
  })();

  return {
    workspaceStatus,
    nextDueAt,
    overdue,
    riskLevel,
    progressPercent,
    milestoneCount,
    completedMilestones,
    upcomingMilestone: upcomingMilestone
      ? {
          id: upcomingMilestone.id,
          title: upcomingMilestone.title,
          dueDate: upcomingMilestone.dueDate,
          status: upcomingMilestone.status,
        }
      : null,
    clientName,
    workspaceUrl,
    coverImageUrl,
    highlightImageUrl,
    tags,
    archivedAt,
    cycleTimeDays,
    reopenedAt,
    lastStatusChange,
    lastUpdatedAt: project.updatedAt ?? project.createdAt ?? null,
    healthScore,
  };
}

function sanitizeProject(projectInstance) {
  const project = projectInstance.get({ plain: true });
  const enriched = {
    ...project,
    budget: computeBudgetSnapshot(project),
  };

  return {
    ...enriched,
    lifecycle: buildLifecycleSnapshot(enriched),
  };
}

async function ensureTemplatesSeeded(transaction) {
  const count = await ProjectTemplate.count({ transaction });
  if (count > 0) {
    return;
  }
  await ProjectTemplate.bulkCreate(
    [
      {
        name: 'Hackathon launch kit',
        category: 'hackathon',
        description: 'Two-week hackathon workflow with mentor cadences and demo-day storytelling assets.',
        summary: 'Packaged for emerging talent communities launching quick-fire hackathons.',
        durationWeeks: 2,
        recommendedBudgetMin: 2500,
        recommendedBudgetMax: 12000,
        toolkit: ['Kickoff briefing deck', 'Mentor rotation schedule', 'Judging scorecard'],
        prompts: ['Which sponsor is accountable for marketing?', 'What is the demo-day success metric?'],
      },
      {
        name: 'Bootcamp delivery workspace',
        category: 'bootcamp',
        description: 'Structured bootcamp delivery with weekly rituals, feedback loops, and alumni storytelling prompts.',
        summary: 'Designed for reskilling cohorts and apprenticeship accelerators.',
        durationWeeks: 4,
        recommendedBudgetMin: 15000,
        recommendedBudgetMax: 48000,
        toolkit: ['Weekly retro template', 'Sponsor update deck', 'Learner survey automation'],
        prompts: ['How do we celebrate learner milestones?', 'Who owns employer showcases each week?'],
      },
      {
        name: 'Consulting engagement blueprint',
        category: 'consulting',
        description: 'Discovery-to-delivery blueprint with billing checkpoints, compliance reminders, and retrospective generator.',
        summary: 'Ideal for independent consultants running multi-stakeholder engagements.',
        durationWeeks: 6,
        recommendedBudgetMin: 12000,
        recommendedBudgetMax: 90000,
        toolkit: ['Statement of work canvas', 'Executive readout deck', 'Risk register'],
        prompts: ['Which stakeholders approve each milestone?', 'What is the client satisfaction survey cadence?'],
      },
    ],
    { transaction },
  );
}

let initialized = false;

async function ensureInitialized() {
  if (initialized) return;
  await syncProjectGigManagementModels();
  initialized = true;
}

export async function getProjectGigManagementOverview(ownerId) {
  await ensureInitialized();

  const projects = await Project.findAll({
    where: { ownerId },
    include: [
      { model: ProjectWorkspace, as: 'workspace' },
      { model: ProjectMilestone, as: 'milestones', separate: true, order: [['ordinal', 'ASC']] },
      { model: ProjectCollaborator, as: 'collaborators' },
      { model: ProjectIntegration, as: 'integrations' },
      { model: ProjectRetrospective, as: 'retrospectives', separate: true, order: [['generatedAt', 'DESC']] },
      { model: ProjectAsset, as: 'assets' },
    ],
    order: [['updatedAt', 'DESC']],
  });

  const templates = await ProjectTemplate.findAll({ order: [['createdAt', 'DESC']] });
  const orders = await GigOrder.findAll({
    where: { ownerId },
    include: [
      { model: GigOrderRequirement, as: 'requirements' },
      { model: GigOrderRevision, as: 'revisions', order: [['roundNumber', 'ASC']] },
      { model: GigVendorScorecard, as: 'scorecard' },
    ],
    order: [['createdAt', 'DESC']],
  });

  const storyBlocks = await StoryBlock.findAll({ where: { ownerId }, order: [['createdAt', 'DESC']] });
  const brandAssets = await BrandAsset.findAll({ where: { ownerId }, order: [['createdAt', 'DESC']] });

  const sanitizedProjects = projects.map((project) => sanitizeProject(project));
  const openProjects = sanitizedProjects.filter((project) => {
    const status = project.lifecycle?.workspaceStatus ?? project.status ?? 'planning';
    return !project.archivedAt && status !== 'completed';
  });
  const closedProjects = sanitizedProjects.filter((project) => {
    const status = project.lifecycle?.workspaceStatus ?? project.status ?? 'planning';
    return project.archivedAt != null || status === 'completed';
  });

  const summary = {
    totalProjects: sanitizedProjects.length,
    activeProjects: openProjects.length,
    closedProjects: closedProjects.length,
    atRiskProjects: openProjects.filter((project) => project.lifecycle?.riskLevel === 'high').length,
    budgetInPlay: openProjects.reduce(
      (acc, project) => acc + normalizeNumber(project.budget?.allocated ?? project.budgetAllocated),
      0,
    ),
    gigsInDelivery: orders.filter((order) => !['completed', 'cancelled'].includes(order.status)).length,
    templatesAvailable: templates.length,
    assetsSecured: brandAssets.length,
  };
  const assets = sanitizedProjects.flatMap((project) => project.assets);
  const assetSummary = summarizeAssets(assets);
  const board = {
    lanes: buildBoardLanes(sanitizedProjects),
    metrics: buildBoardMetrics(sanitizedProjects),
    integrations: PROJECT_STATUSES.map((status) => ({
      status,
      integrations: sanitizedProjects
        .filter((project) => (project.workspace?.status ?? project.status) === status)
        .flatMap((project) => project.integrations.map((integration) => integration.provider)),
    })),
    retrospectives: sanitizedProjects
      .flatMap((project) => project.retrospectives.map((retro) => ({ ...retro, projectId: project.id, projectTitle: project.title })))
      .slice(0, 6),
  };

  const vendorStats = buildVendorStats(orders);
  const reminders = buildGigReminders(orders);
  const storytelling = buildStorytelling(sanitizedProjects, orders, storyBlocks);

  return {
    summary,
    projectCreation: { projects: sanitizedProjects, templates },
    assets: { items: assets, summary: assetSummary, brandAssets },
    managementBoard: board,
    purchasedGigs: {
      orders,
      reminders,
      stats: vendorStats,
    },
    storytelling,
    projectLifecycle: buildProjectLifecycleSnapshot(sanitizedProjects),
  };
}

function buildProjectLifecycleSnapshot(projects) {
  const openProjects = projects.filter((project) => {
    const status = project.lifecycle?.workspaceStatus ?? project.status ?? 'planning';
    return !project.archivedAt && status !== 'completed';
  });

  const closedProjects = projects.filter((project) => {
    const status = project.lifecycle?.workspaceStatus ?? project.status ?? 'planning';
    return project.archivedAt != null || status === 'completed';
  });

  const budgetInPlay = openProjects.reduce(
    (acc, project) => acc + normalizeNumber(project.budget?.allocated ?? project.budgetAllocated),
    0,
  );

  const overdueCount = openProjects.filter((project) => project.lifecycle?.overdue).length;
  const atRiskCount = openProjects.filter((project) => project.lifecycle?.riskLevel === 'high').length;
  const averageProgress = openProjects.length
    ?
        openProjects.reduce(
          (acc, project) => acc + normalizeNumber(project.lifecycle?.progressPercent ?? project.workspace?.progressPercent),
          0,
        ) / openProjects.length
    : 0;

  const cycleTimes = closedProjects
    .map((project) => normalizeNumber(project.lifecycle?.cycleTimeDays, null))
    .filter((value) => value != null && value > 0);
  const averageCycleTimeDays = cycleTimes.length
    ? cycleTimes.reduce((acc, value) => acc + value, 0) / cycleTimes.length
    : null;

  const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;
  const NINETY_DAYS = THIRTY_DAYS * 3;
  const now = Date.now();

  const archivedLast30Days = closedProjects.filter((project) => {
    if (!project.archivedAt) {
      return false;
    }
    const archivedDate = new Date(project.archivedAt);
    return !Number.isNaN(archivedDate.getTime()) && now - archivedDate.getTime() <= THIRTY_DAYS;
  }).length;

  const reopenedLast90Days = closedProjects.filter((project) => {
    const reopenedAt = project.lifecycle?.reopenedAt;
    if (!reopenedAt) {
      return false;
    }
    const reopenedDate = new Date(reopenedAt);
    return !Number.isNaN(reopenedDate.getTime()) && now - reopenedDate.getTime() <= NINETY_DAYS;
  }).length;

  const healthDistribution = openProjects.reduce(
    (acc, project) => {
      const score = normalizeNumber(project.lifecycle?.healthScore, 0);
      if (score >= 70) {
        acc.healthy += 1;
      } else if (score >= 40) {
        acc.watch += 1;
      } else {
        acc.intervention += 1;
      }
      return acc;
    },
    { healthy: 0, watch: 0, intervention: 0 },
  );

  const clientCounts = new Map();
  const tagCounts = new Map();
  openProjects.forEach((project) => {
    const clientName = project.lifecycle?.clientName?.toString().trim();
    if (clientName) {
      clientCounts.set(clientName, (clientCounts.get(clientName) ?? 0) + 1);
    }
    (project.lifecycle?.tags ?? []).forEach((tag) => {
      const normalized = tag.toString().trim();
      if (normalized) {
        tagCounts.set(normalized, (tagCounts.get(normalized) ?? 0) + 1);
      }
    });
  });

  const topClients = Array.from(clientCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  return {
    open: openProjects,
    closed: closedProjects,
    stats: {
      openCount: openProjects.length,
      closedCount: closedProjects.length,
      overdueCount,
      atRiskCount,
      averageProgress,
      averageCycleTimeDays,
      budgetInPlay,
      archivedLast30Days,
      reopenedLast90Days,
      healthDistribution,
      topClients,
      topTags,
    },
    filters: {
      statuses: PROJECT_STATUSES,
      riskLevels: PROJECT_RISK_LEVELS,
    },
    meta: {
      generatedAt: new Date().toISOString(),
    },
  };
}

function assertOwnership(record, ownerId, message) {
  if (!record || record.ownerId !== ownerId) {
    throw new NotFoundError(message);
  }
}

export async function createProject(ownerId, payload) {
  await ensureInitialized();
  if (!payload.title || !payload.description) {
    throw new ValidationError('Title and description are required.');
  }

  if (payload.status && !PROJECT_STATUSES.includes(payload.status)) {
    throw new ValidationError('Invalid project status provided.');
  }

  if (payload.workspace?.riskLevel && !PROJECT_RISK_LEVELS.includes(payload.workspace.riskLevel)) {
    throw new ValidationError('Invalid project risk level provided.');
  }

  if (payload.workspace?.status && !PROJECT_STATUSES.includes(payload.workspace.status)) {
    throw new ValidationError('Invalid workspace status provided.');
  }

  const budgetAllocated = ensureNumber(payload.budgetAllocated ?? 0, {
    label: 'Budget allocated',
  });
  const budgetSpent = ensureNumber(payload.budgetSpent ?? 0, { label: 'Budget spent' });
  if (budgetSpent > budgetAllocated) {
    throw new ValidationError('Budget spent cannot exceed the allocated amount.');
  }

  const startDate = ensureDate(payload.startDate, { label: 'Start date' });
  const dueDate = ensureDate(payload.dueDate, { label: 'Due date' });
  if (startDate && dueDate && dueDate.getTime() < startDate.getTime()) {
    throw new ValidationError('Due date cannot be earlier than the project start date.');
  }

  return projectGigManagementSequelize.transaction(async (transaction) => {
    const project = await Project.create(
      {
        ownerId,
        title: payload.title,
        description: payload.description,
        status: payload.status ?? 'planning',
        startDate: startDate ?? null,
        dueDate: dueDate ?? null,
        budgetCurrency: payload.budgetCurrency ?? 'USD',
        budgetAllocated,
        budgetSpent,
        metadata: payload.metadata ?? {},
      },
      { transaction },
    );

    await ProjectWorkspace.create(
      {
        projectId: project.id,
        status: payload.workspace?.status ?? project.status,
        progressPercent: payload.workspace?.progressPercent ?? 5,
        riskLevel: payload.workspace?.riskLevel && PROJECT_RISK_LEVELS.includes(payload.workspace.riskLevel)
          ? payload.workspace.riskLevel
          : 'low',
        nextMilestone: payload.workspace?.nextMilestone ?? null,
        nextMilestoneDueAt: ensureDate(payload.workspace?.nextMilestoneDueAt ?? payload.dueDate, {
          label: 'Next milestone due date',
        }),
        notes: payload.workspace?.notes ?? null,
        metrics: payload.workspace?.metrics ?? {},
      },
      { transaction },
    );

    if (Array.isArray(payload.milestones)) {
      const milestones = payload.milestones.map((milestone, index) => ({
        projectId: project.id,
        title: milestone.title,
        description: milestone.description ?? null,
        ordinal: milestone.ordinal ?? index,
        dueDate: ensureDate(milestone.dueDate, { label: 'Milestone due date' }),
        status: milestone.status ?? 'planned',
        budget: milestone.budget ?? 0,
      }));
      await ProjectMilestone.bulkCreate(milestones, { transaction });
    }

    if (Array.isArray(payload.collaborators)) {
      const collaborators = payload.collaborators.map((collaborator) => ({
        projectId: project.id,
        fullName: collaborator.fullName,
        email: collaborator.email ?? null,
        role: collaborator.role ?? 'Collaborator',
        status: collaborator.status ?? 'invited',
        hourlyRate: collaborator.hourlyRate ?? null,
        permissions: collaborator.permissions ?? {},
      }));
      await ProjectCollaborator.bulkCreate(collaborators, { transaction });
    }

    if (Array.isArray(payload.integrations)) {
      const integrations = payload.integrations.map((integration) => ({
        projectId: project.id,
        provider: integration.provider,
        status: integration.status ?? 'connected',
        connectedAt: integration.connectedAt ?? new Date(),
        metadata: integration.metadata ?? {},
      }));
      await ProjectIntegration.bulkCreate(integrations, { transaction });
    }

    await ensureTemplatesSeeded(transaction);

    return project;
  });
}

export async function addProjectAsset(ownerId, projectId, payload) {
  await ensureInitialized();
  const project = await Project.findByPk(projectId);
  assertOwnership(project, ownerId, 'Project not found');
  if (!payload.label || !payload.storageUrl) {
    throw new ValidationError('Asset label and storageUrl are required.');
  }

  return ProjectAsset.create({
    projectId,
    label: payload.label,
    category: payload.category ?? 'artifact',
    storageUrl: payload.storageUrl,
    thumbnailUrl: payload.thumbnailUrl ?? null,
    sizeBytes: payload.sizeBytes ?? 0,
    permissionLevel: payload.permissionLevel ?? 'internal',
    watermarkEnabled: payload.watermarkEnabled ?? true,
    metadata: payload.metadata ?? {},
  });
}

export async function updateProjectAsset(ownerId, projectId, assetId, payload) {
  await ensureInitialized();
  const project = await Project.findByPk(projectId);
  assertOwnership(project, ownerId, 'Project not found');
  const asset = await ProjectAsset.findByPk(assetId);
  if (!asset || asset.projectId !== projectId) {
    throw new NotFoundError('Asset not found');
  }

  const updates = {};
  if (payload.label != null) {
    const label = payload.label.toString().trim();
    if (!label) {
      throw new ValidationError('Asset label cannot be empty.');
    }
    updates.label = label;
  }
  if (payload.category != null) {
    const category = payload.category.toString().trim();
    if (!category) {
      throw new ValidationError('Asset category cannot be empty.');
    }
    updates.category = category;
  }
  if (payload.storageUrl != null) {
    const storageUrl = payload.storageUrl.toString().trim();
    if (!storageUrl) {
      throw new ValidationError('Asset storage URL cannot be empty.');
    }
    updates.storageUrl = storageUrl;
  }
  if (payload.thumbnailUrl !== undefined) {
    const thumbnailUrl = payload.thumbnailUrl?.toString().trim();
    updates.thumbnailUrl = thumbnailUrl || null;
  }
  if (payload.sizeBytes != null) {
    const sizeBytes = Number(payload.sizeBytes);
    if (!Number.isFinite(sizeBytes) || sizeBytes < 0) {
      throw new ValidationError('Asset size must be a valid number.');
    }
    updates.sizeBytes = sizeBytes;
  }
  if (payload.permissionLevel != null) {
    const permissionLevel = payload.permissionLevel.toString().trim();
    if (!permissionLevel) {
      throw new ValidationError('Asset permission level cannot be empty.');
    }
    updates.permissionLevel = permissionLevel;
  }
  if (payload.watermarkEnabled != null) {
    updates.watermarkEnabled = Boolean(payload.watermarkEnabled);
  }
  if (payload.metadata !== undefined) {
    updates.metadata = payload.metadata ?? {};
  }

  await asset.update(updates);
  return asset;
}

export async function deleteProjectAsset(ownerId, projectId, assetId) {
  await ensureInitialized();
  const project = await Project.findByPk(projectId);
  assertOwnership(project, ownerId, 'Project not found');
  const asset = await ProjectAsset.findByPk(assetId);
  if (!asset || asset.projectId !== projectId) {
    throw new NotFoundError('Asset not found');
  }
  await asset.destroy();
  return { id: assetId };
}

export async function updateProjectWorkspace(ownerId, projectId, payload) {
  await ensureInitialized();
  const project = await Project.findByPk(projectId, { include: [{ model: ProjectWorkspace, as: 'workspace' }] });
  assertOwnership(project, ownerId, 'Project not found');
  if (!project.workspace) {
    throw new NotFoundError('Workspace not initialized for project.');
  }

  if (payload.status && !PROJECT_STATUSES.includes(payload.status)) {
    throw new ValidationError('Invalid workspace status provided.');
  }
  if (payload.riskLevel && !PROJECT_RISK_LEVELS.includes(payload.riskLevel)) {
    throw new ValidationError('Invalid workspace risk level provided.');
  }
  if (payload.progressPercent != null) {
    const parsed = ensureNumber(payload.progressPercent, { label: 'Progress percent', allowNegative: false });
    if (parsed > 100) {
      throw new ValidationError('Progress percent cannot exceed 100%.');
    }
  }
  const nextDueAt = ensureDate(payload.nextMilestoneDueAt, { label: 'Next milestone due date' });

  await project.workspace.update({
    status: payload.status ?? project.workspace.status,
    progressPercent:
      payload.progressPercent != null ? Number(payload.progressPercent) : project.workspace.progressPercent,
    riskLevel: payload.riskLevel ?? project.workspace.riskLevel,
    nextMilestone: payload.nextMilestone ?? project.workspace.nextMilestone,
    nextMilestoneDueAt: nextDueAt ?? project.workspace.nextMilestoneDueAt,
    notes: payload.notes ?? project.workspace.notes,
    metrics: payload.metrics ?? project.workspace.metrics,
  });

  return project.workspace.reload();
}

export async function updateProject(ownerId, projectId, payload = {}) {
  await ensureInitialized();

  const project = await Project.findByPk(projectId, {
    include: [{ model: ProjectWorkspace, as: 'workspace' }],
  });
  assertOwnership(project, ownerId, 'Project not found');

  const updates = {};

  if (payload.title !== undefined) {
    const title = payload.title?.toString().trim();
    if (!title) {
      throw new ValidationError('Project title cannot be empty.');
    }
    updates.title = title;
  }

  if (payload.description !== undefined) {
    const description = payload.description?.toString().trim();
    if (!description) {
      throw new ValidationError('Project description cannot be empty.');
    }
    updates.description = description;
  }

  if (payload.status !== undefined) {
    if (payload.status && !PROJECT_STATUSES.includes(payload.status)) {
      throw new ValidationError('Invalid project status provided.');
    }
    updates.status = payload.status ?? project.status;
  }

  const startDate =
    payload.startDate !== undefined ? ensureDate(payload.startDate, { label: 'Start date' }) : project.startDate;
  const dueDate = payload.dueDate !== undefined ? ensureDate(payload.dueDate, { label: 'Due date' }) : project.dueDate;

  if (startDate !== null && dueDate !== null && startDate && dueDate && dueDate.getTime() < startDate.getTime()) {
    throw new ValidationError('Due date cannot be earlier than the project start date.');
  }

  if (payload.startDate !== undefined) {
    updates.startDate = startDate;
  }
  if (payload.dueDate !== undefined) {
    updates.dueDate = dueDate;
  }

  const budgetAllocated =
    payload.budgetAllocated !== undefined
      ? ensureNumber(payload.budgetAllocated, { label: 'Budget allocated' })
      : project.budgetAllocated;
  const budgetSpent =
    payload.budgetSpent !== undefined
      ? ensureNumber(payload.budgetSpent, { label: 'Budget spent' })
      : project.budgetSpent;

  if (budgetSpent > budgetAllocated) {
    throw new ValidationError('Budget spent cannot exceed the allocated amount.');
  }

  if (payload.budgetCurrency !== undefined) {
    updates.budgetCurrency = payload.budgetCurrency ?? project.budgetCurrency;
  }
  if (payload.budgetAllocated !== undefined) {
    updates.budgetAllocated = budgetAllocated;
  }
  if (payload.budgetSpent !== undefined) {
    updates.budgetSpent = budgetSpent;
  }

  if (payload.metadata !== undefined) {
    updates.metadata = payload.metadata ?? project.metadata ?? {};
  }

  if (Object.keys(updates).length > 0) {
    await project.update(updates);
  }

  if (payload.workspace) {
    await updateProjectWorkspace(ownerId, projectId, payload.workspace);
  }

  const refreshed = await Project.findByPk(projectId, {
    include: [
      { model: ProjectWorkspace, as: 'workspace' },
      { model: ProjectMilestone, as: 'milestones', separate: true, order: [['ordinal', 'ASC']] },
      { model: ProjectCollaborator, as: 'collaborators' },
      { model: ProjectIntegration, as: 'integrations' },
      { model: ProjectRetrospective, as: 'retrospectives', separate: true, order: [['generatedAt', 'DESC']] },
      { model: ProjectAsset, as: 'assets' },
    ],
  });

  return sanitizeProject(refreshed);
}

export async function archiveProject(ownerId, projectId, payload = {}) {
  await ensureInitialized();

  const project = await Project.findByPk(projectId, {
    include: [{ model: ProjectWorkspace, as: 'workspace' }],
  });
  assertOwnership(project, ownerId, 'Project not found');

  const archivedAt = payload.archivedAt ? ensureDate(payload.archivedAt, { label: 'Archived at' }) : new Date();
  const status = payload.status && PROJECT_STATUSES.includes(payload.status) ? payload.status : 'completed';

  await project.update({
    archivedAt,
    status,
  });

  if (project.workspace) {
    await updateProjectWorkspace(ownerId, projectId, {
      status: payload.workspace?.status ?? 'completed',
      progressPercent: payload.workspace?.progressPercent ?? 100,
      riskLevel: payload.workspace?.riskLevel ?? 'low',
      nextMilestone: payload.workspace?.nextMilestone ?? project.workspace.nextMilestone,
      nextMilestoneDueAt: payload.workspace?.nextMilestoneDueAt ?? project.workspace.nextMilestoneDueAt,
      notes: payload.workspace?.notes ?? project.workspace.notes,
      metrics: payload.workspace?.metrics ?? project.workspace.metrics,
    });
  }

  const refreshed = await Project.findByPk(projectId, {
    include: [
      { model: ProjectWorkspace, as: 'workspace' },
      { model: ProjectMilestone, as: 'milestones', separate: true, order: [['ordinal', 'ASC']] },
      { model: ProjectCollaborator, as: 'collaborators' },
      { model: ProjectIntegration, as: 'integrations' },
      { model: ProjectRetrospective, as: 'retrospectives', separate: true, order: [['generatedAt', 'DESC']] },
      { model: ProjectAsset, as: 'assets' },
    ],
  });

  return sanitizeProject(refreshed);
}

export async function restoreProject(ownerId, projectId, payload = {}) {
  await ensureInitialized();

  const project = await Project.findByPk(projectId, {
    include: [{ model: ProjectWorkspace, as: 'workspace' }],
  });
  assertOwnership(project, ownerId, 'Project not found');

  const status = payload.status && PROJECT_STATUSES.includes(payload.status) ? payload.status : 'in_progress';

  await project.update({
    archivedAt: null,
    status,
  });

  if (project.workspace) {
    await updateProjectWorkspace(ownerId, projectId, {
      status: payload.workspace?.status ?? status,
      progressPercent:
        payload.workspace?.progressPercent != null
          ? payload.workspace.progressPercent
          : project.workspace.progressPercent ?? 25,
      riskLevel: payload.workspace?.riskLevel ?? project.workspace.riskLevel ?? 'medium',
      nextMilestone: payload.workspace?.nextMilestone ?? project.workspace.nextMilestone,
      nextMilestoneDueAt: payload.workspace?.nextMilestoneDueAt ?? project.workspace.nextMilestoneDueAt,
      notes: payload.workspace?.notes ?? project.workspace.notes,
      metrics: payload.workspace?.metrics ?? project.workspace.metrics,
    });
  }

  const refreshed = await Project.findByPk(projectId, {
    include: [
      { model: ProjectWorkspace, as: 'workspace' },
      { model: ProjectMilestone, as: 'milestones', separate: true, order: [['ordinal', 'ASC']] },
      { model: ProjectCollaborator, as: 'collaborators' },
      { model: ProjectIntegration, as: 'integrations' },
      { model: ProjectRetrospective, as: 'retrospectives', separate: true, order: [['generatedAt', 'DESC']] },
      { model: ProjectAsset, as: 'assets' },
    ],
  });

  return sanitizeProject(refreshed);
}

export async function createProjectMilestone(ownerId, projectId, payload) {
  await ensureInitialized();
  const project = await Project.findByPk(projectId);
  assertOwnership(project, ownerId, 'Project not found');
  if (!payload.title || !payload.title.toString().trim()) {
    throw new ValidationError('Milestone title is required.');
  }

  const dueDate = ensureDate(payload.dueDate, { label: 'Milestone due date' });
  const budget = ensureNumber(payload.budget ?? 0, { label: 'Milestone budget' });
  const maxOrdinal = await ProjectMilestone.max('ordinal', { where: { projectId } });
  const ordinal = payload.ordinal != null ? Number(payload.ordinal) : Number.isFinite(maxOrdinal) ? maxOrdinal + 1 : 0;

  return ProjectMilestone.create({
    projectId,
    title: payload.title.toString().trim(),
    description: payload.description ?? null,
    ordinal: Number.isFinite(ordinal) && ordinal >= 0 ? ordinal : 0,
    dueDate,
    status: payload.status ?? 'planned',
    budget,
    metrics: payload.metrics ?? {},
  });
}

export async function updateProjectMilestone(ownerId, projectId, milestoneId, payload) {
  await ensureInitialized();
  const project = await Project.findByPk(projectId);
  assertOwnership(project, ownerId, 'Project not found');
  const milestone = await ProjectMilestone.findByPk(milestoneId);
  if (!milestone || milestone.projectId !== projectId) {
    throw new NotFoundError('Milestone not found');
  }

  const updates = {};
  if (payload.title != null) {
    const title = payload.title.toString().trim();
    if (!title) {
      throw new ValidationError('Milestone title cannot be empty.');
    }
    updates.title = title;
  }
  if (payload.description !== undefined) {
    updates.description = payload.description ?? null;
  }
  if (payload.ordinal != null) {
    const ordinal = Number(payload.ordinal);
    if (!Number.isFinite(ordinal) || ordinal < 0) {
      throw new ValidationError('Milestone order must be zero or a positive number.');
    }
    updates.ordinal = ordinal;
  }
  if (payload.dueDate !== undefined) {
    updates.dueDate = ensureDate(payload.dueDate, { label: 'Milestone due date' });
  }
  if (payload.completedAt !== undefined) {
    updates.completedAt = payload.completedAt ? ensureDate(payload.completedAt, { label: 'Completion date' }) : null;
  }
  if (payload.status != null) {
    const allowedStatuses = ['planned', 'in_progress', 'waiting_on_client', 'completed'];
    if (!allowedStatuses.includes(payload.status)) {
      throw new ValidationError('Invalid milestone status provided.');
    }
    updates.status = payload.status;
  }
  if (payload.budget != null) {
    updates.budget = ensureNumber(payload.budget, { label: 'Milestone budget' });
  }
  if (payload.metrics !== undefined) {
    updates.metrics = payload.metrics ?? {};
  }

  await milestone.update(updates);
  return milestone;
}

export async function deleteProjectMilestone(ownerId, projectId, milestoneId) {
  await ensureInitialized();
  const project = await Project.findByPk(projectId);
  assertOwnership(project, ownerId, 'Project not found');
  const milestone = await ProjectMilestone.findByPk(milestoneId);
  if (!milestone || milestone.projectId !== projectId) {
    throw new NotFoundError('Milestone not found');
  }
  await milestone.destroy();
  return { id: milestoneId };
}

export async function createProjectCollaborator(ownerId, projectId, payload) {
  await ensureInitialized();
  const project = await Project.findByPk(projectId);
  assertOwnership(project, ownerId, 'Project not found');
  if (!payload.fullName || !payload.fullName.toString().trim()) {
    throw new ValidationError('Collaborator name is required.');
  }

  const status = payload.status ?? 'invited';
  if (!PROJECT_COLLABORATOR_STATUSES.includes(status)) {
    throw new ValidationError('Invalid collaborator status provided.');
  }

  let hourlyRate = null;
  if (payload.hourlyRate != null && payload.hourlyRate !== '') {
    hourlyRate = ensureNumber(payload.hourlyRate, { label: 'Hourly rate', allowZero: false });
  }

  return ProjectCollaborator.create({
    projectId,
    fullName: payload.fullName.toString().trim(),
    email: payload.email?.toString().trim() || null,
    role: payload.role?.toString().trim() || 'Collaborator',
    status,
    hourlyRate,
    permissions: payload.permissions ?? {},
  });
}

export async function updateProjectCollaborator(ownerId, projectId, collaboratorId, payload) {
  await ensureInitialized();
  const project = await Project.findByPk(projectId);
  assertOwnership(project, ownerId, 'Project not found');
  const collaborator = await ProjectCollaborator.findByPk(collaboratorId);
  if (!collaborator || collaborator.projectId !== projectId) {
    throw new NotFoundError('Collaborator not found');
  }

  const updates = {};
  if (payload.fullName != null) {
    const name = payload.fullName.toString().trim();
    if (!name) {
      throw new ValidationError('Collaborator name cannot be empty.');
    }
    updates.fullName = name;
  }
  if (payload.email !== undefined) {
    updates.email = payload.email?.toString().trim() || null;
  }
  if (payload.role != null) {
    const role = payload.role.toString().trim();
    if (!role) {
      throw new ValidationError('Collaborator role cannot be empty.');
    }
    updates.role = role;
  }
  if (payload.status != null) {
    if (!PROJECT_COLLABORATOR_STATUSES.includes(payload.status)) {
      throw new ValidationError('Invalid collaborator status provided.');
    }
    updates.status = payload.status;
  }
  if (payload.hourlyRate !== undefined) {
    if (payload.hourlyRate === null || payload.hourlyRate === '') {
      updates.hourlyRate = null;
    } else {
      updates.hourlyRate = ensureNumber(payload.hourlyRate, { label: 'Hourly rate', allowZero: false });
    }
  }
  if (payload.permissions !== undefined) {
    updates.permissions = payload.permissions ?? {};
  }

  await collaborator.update(updates);
  return collaborator;
}

export async function deleteProjectCollaborator(ownerId, projectId, collaboratorId) {
  await ensureInitialized();
  const project = await Project.findByPk(projectId);
  assertOwnership(project, ownerId, 'Project not found');
  const collaborator = await ProjectCollaborator.findByPk(collaboratorId);
  if (!collaborator || collaborator.projectId !== projectId) {
    throw new NotFoundError('Collaborator not found');
  }
  await collaborator.destroy();
  return { id: collaboratorId };
}

export async function createGigOrder(ownerId, payload) {
  await ensureInitialized();
  if (!payload.vendorName || !payload.serviceName) {
    throw new ValidationError('vendorName and serviceName are required');
  }

  if (payload.status && !GIG_ORDER_STATUSES.includes(payload.status)) {
    throw new ValidationError('Invalid gig order status provided.');
  }

  const amount = ensureNumber(payload.amount ?? 0, { label: 'Order amount' });
  const kickoffAt = ensureDate(payload.kickoffAt ?? new Date(), { label: 'Kickoff date' }) ?? new Date();
  const dueAt = ensureDate(payload.dueAt, { label: 'Delivery due date' });
  if (dueAt && dueAt.getTime() < kickoffAt.getTime()) {
    throw new ValidationError('Delivery due date cannot be earlier than the kickoff date.');
  }

  return projectGigManagementSequelize.transaction(async (transaction) => {
    const order = await GigOrder.create(
      {
        ownerId,
        orderNumber: payload.orderNumber ?? `ORD-${Date.now()}`,
        vendorName: payload.vendorName,
        serviceName: payload.serviceName,
        status: payload.status ?? 'requirements',
        progressPercent: payload.progressPercent ?? 0,
        amount,
        currency: payload.currency ?? 'USD',
        kickoffAt,
        dueAt,
        metadata: payload.metadata ?? {},
      },
      { transaction },
    );

    if (Array.isArray(payload.requirements) && payload.requirements.length > 0) {
      await GigOrderRequirement.bulkCreate(
        payload.requirements.map((requirement) => ({
          orderId: order.id,
          title: requirement.title,
          status: requirement.status ?? 'pending',
          dueAt: ensureDate(requirement.dueAt, { label: 'Requirement due date' }),
          notes: requirement.notes ?? null,
        })),
        { transaction },
      );
    }

    if (payload.scorecard) {
      await GigVendorScorecard.create(
        {
          orderId: order.id,
          qualityScore: payload.scorecard.qualityScore ?? null,
          communicationScore: payload.scorecard.communicationScore ?? null,
          reliabilityScore: payload.scorecard.reliabilityScore ?? null,
          overallScore: payload.scorecard.overallScore ?? null,
          notes: payload.scorecard.notes ?? null,
        },
        { transaction },
      );
    }

    return order;
  });
}

export async function updateGigOrder(ownerId, orderId, payload) {
  await ensureInitialized();
  const order = await GigOrder.findByPk(orderId, {
    include: [
      { model: GigOrderRequirement, as: 'requirements' },
      { model: GigOrderRevision, as: 'revisions' },
      { model: GigVendorScorecard, as: 'scorecard' },
    ],
  });
  assertOwnership(order, ownerId, 'Gig order not found');

  if (payload.status && !GIG_ORDER_STATUSES.includes(payload.status)) {
    throw new ValidationError('Invalid gig order status provided.');
  }
  if (payload.progressPercent != null) {
    const progress = ensureNumber(payload.progressPercent, { label: 'Progress percent', allowNegative: false });
    if (progress > 100) {
      throw new ValidationError('Progress percent cannot exceed 100%.');
    }
  }
  const dueAt = ensureDate(payload.dueAt, { label: 'Delivery due date' });

  await order.update({
    status: payload.status ?? order.status,
    progressPercent:
      payload.progressPercent != null ? Number(payload.progressPercent) : order.progressPercent,
    dueAt: dueAt ?? order.dueAt,
    metadata: payload.metadata ?? order.metadata,
  });

  if (Array.isArray(payload.newRevisions)) {
    await GigOrderRevision.bulkCreate(
      payload.newRevisions.map((revision) => ({
        orderId: order.id,
        roundNumber: revision.roundNumber ?? (order.revisions?.length ?? 0) + 1,
        status: revision.status ?? 'requested',
        requestedAt: revision.requestedAt ?? new Date(),
        dueAt: revision.dueAt ?? null,
        submittedAt: revision.submittedAt ?? null,
        approvedAt: revision.approvedAt ?? null,
        summary: revision.summary ?? null,
      })),
    );
  }

  if (payload.scorecard) {
    if (order.scorecard) {
      await order.scorecard.update({
        qualityScore: payload.scorecard.qualityScore ?? order.scorecard.qualityScore,
        communicationScore: payload.scorecard.communicationScore ?? order.scorecard.communicationScore,
        reliabilityScore: payload.scorecard.reliabilityScore ?? order.scorecard.reliabilityScore,
        overallScore: payload.scorecard.overallScore ?? order.scorecard.overallScore,
        notes: payload.scorecard.notes ?? order.scorecard.notes,
      });
    } else {
      await GigVendorScorecard.create({
        orderId: order.id,
        qualityScore: payload.scorecard.qualityScore ?? null,
        communicationScore: payload.scorecard.communicationScore ?? null,
        reliabilityScore: payload.scorecard.reliabilityScore ?? null,
        overallScore: payload.scorecard.overallScore ?? null,
        notes: payload.scorecard.notes ?? null,
      });
    }
  }

  return order.reload();
}

export default {
  getProjectGigManagementOverview,
  createProject,
  updateProject,
  addProjectAsset,
  updateProjectAsset,
  deleteProjectAsset,
  updateProjectWorkspace,
  archiveProject,
  restoreProject,
  createProjectMilestone,
  updateProjectMilestone,
  deleteProjectMilestone,
  createProjectCollaborator,
  updateProjectCollaborator,
  deleteProjectCollaborator,
  createGigOrder,
  updateGigOrder,
};
