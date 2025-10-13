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
  GIG_ORDER_STATUSES,
  syncProjectGigManagementModels,
} from '../models/projectGigManagementModels.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function normalizeNumber(value, fallback = 0) {
  if (value == null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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

function sanitizeProject(projectInstance) {
  const project = projectInstance.get({ plain: true });
  return {
    ...project,
    budget: computeBudgetSnapshot(project),
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

  const summary = {
    totalProjects: projects.length,
    activeProjects: projects.filter((project) => project.status !== 'completed').length,
    budgetInPlay: projects.reduce((acc, project) => acc + normalizeNumber(project.budgetAllocated), 0),
    gigsInDelivery: orders.filter((order) => !['completed', 'cancelled'].includes(order.status)).length,
    templatesAvailable: templates.length,
    assetsSecured: brandAssets.length,
  };

  const sanitizedProjects = projects.map((project) => sanitizeProject(project));
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

  return projectGigManagementSequelize.transaction(async (transaction) => {
    const project = await Project.create(
      {
        ownerId,
        title: payload.title,
        description: payload.description,
        status: payload.status ?? 'planning',
        startDate: payload.startDate ?? null,
        dueDate: payload.dueDate ?? null,
        budgetCurrency: payload.budgetCurrency ?? 'USD',
        budgetAllocated: payload.budgetAllocated ?? 0,
        budgetSpent: payload.budgetSpent ?? 0,
        metadata: payload.metadata ?? {},
      },
      { transaction },
    );

    await ProjectWorkspace.create(
      {
        projectId: project.id,
        status: payload.workspace?.status ?? project.status,
        progressPercent: payload.workspace?.progressPercent ?? 5,
        riskLevel: payload.workspace?.riskLevel ?? 'low',
        nextMilestone: payload.workspace?.nextMilestone ?? null,
        nextMilestoneDueAt: payload.workspace?.nextMilestoneDueAt ?? payload.dueDate ?? null,
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
        dueDate: milestone.dueDate ?? null,
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

export async function updateProjectWorkspace(ownerId, projectId, payload) {
  await ensureInitialized();
  const project = await Project.findByPk(projectId, { include: [{ model: ProjectWorkspace, as: 'workspace' }] });
  assertOwnership(project, ownerId, 'Project not found');
  if (!project.workspace) {
    throw new NotFoundError('Workspace not initialized for project.');
  }

  await project.workspace.update({
    status: payload.status ?? project.workspace.status,
    progressPercent:
      payload.progressPercent != null ? Number(payload.progressPercent) : project.workspace.progressPercent,
    riskLevel: payload.riskLevel ?? project.workspace.riskLevel,
    nextMilestone: payload.nextMilestone ?? project.workspace.nextMilestone,
    nextMilestoneDueAt: payload.nextMilestoneDueAt ?? project.workspace.nextMilestoneDueAt,
    notes: payload.notes ?? project.workspace.notes,
    metrics: payload.metrics ?? project.workspace.metrics,
  });

  return project.workspace.reload();
}

export async function createGigOrder(ownerId, payload) {
  await ensureInitialized();
  if (!payload.vendorName || !payload.serviceName) {
    throw new ValidationError('vendorName and serviceName are required');
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
        amount: payload.amount ?? 0,
        currency: payload.currency ?? 'USD',
        kickoffAt: payload.kickoffAt ?? new Date(),
        dueAt: payload.dueAt ?? null,
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
          dueAt: requirement.dueAt ?? null,
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

  await order.update({
    status: payload.status ?? order.status,
    progressPercent:
      payload.progressPercent != null ? Number(payload.progressPercent) : order.progressPercent,
    dueAt: payload.dueAt ?? order.dueAt,
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
  addProjectAsset,
  updateProjectWorkspace,
  createGigOrder,
  updateGigOrder,
};
