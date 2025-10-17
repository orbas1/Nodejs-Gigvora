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
  GigOrderEscrowCheckpoint,
  GigOrderActivity,
  GigOrderMessage,
  StoryBlock,
  BrandAsset,
  PROJECT_STATUSES,
  PROJECT_RISK_LEVELS,
  GIG_ORDER_STATUSES,
  GIG_ESCROW_STATUSES,
  syncProjectGigManagementModels,
} from '../models/projectGigManagementModels.js';
import { GIG_ORDER_ACTIVITY_TYPES } from '../models/constants/index.js';
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

function toPlain(instance) {
  if (!instance) {
    return null;
  }
  if (typeof instance.get === 'function') {
    return instance.get({ plain: true });
  }
  if (typeof instance.toJSON === 'function') {
    return instance.toJSON();
  }
  if (typeof instance === 'object') {
    return { ...instance };
  }
  return instance;
}

function sanitizeRequirement(requirementInstance) {
  const requirement = toPlain(requirementInstance) ?? {};
  return {
    ...requirement,
    dueAt: requirement.dueAt ? new Date(requirement.dueAt).toISOString() : null,
  };
}

function sanitizeRevision(revisionInstance) {
  const revision = toPlain(revisionInstance) ?? {};
  return {
    ...revision,
    requestedAt: revision.requestedAt ? new Date(revision.requestedAt).toISOString() : null,
    dueAt: revision.dueAt ? new Date(revision.dueAt).toISOString() : null,
    submittedAt: revision.submittedAt ? new Date(revision.submittedAt).toISOString() : null,
    approvedAt: revision.approvedAt ? new Date(revision.approvedAt).toISOString() : null,
  };
}

function sanitizeScorecard(scorecardInstance) {
  const scorecard = toPlain(scorecardInstance);
  if (!scorecard) {
    return null;
  }
  return {
    ...scorecard,
    qualityScore: scorecard.qualityScore == null ? null : Number(scorecard.qualityScore),
    communicationScore: scorecard.communicationScore == null ? null : Number(scorecard.communicationScore),
    reliabilityScore: scorecard.reliabilityScore == null ? null : Number(scorecard.reliabilityScore),
    overallScore: scorecard.overallScore == null ? null : Number(scorecard.overallScore),
  };
}

function sanitizeEscrowCheckpoint(checkpointInstance) {
  const checkpoint = toPlain(checkpointInstance) ?? {};
  return {
    ...checkpoint,
    amount: checkpoint.amount == null ? 0 : Number(checkpoint.amount),
    csatThreshold: checkpoint.csatThreshold == null ? null : Number(checkpoint.csatThreshold),
    releasedAt: checkpoint.releasedAt ? new Date(checkpoint.releasedAt).toISOString() : null,
  };
}

function sanitizeActivity(activityInstance) {
  const activity = toPlain(activityInstance) ?? {};
  return {
    ...activity,
    occurredAt: activity.occurredAt ? new Date(activity.occurredAt).toISOString() : null,
    metadata: activity.metadata ?? {},
  };
}

function normalizeAttachments(attachments) {
  if (!attachments) {
    return [];
  }
  if (Array.isArray(attachments)) {
    return attachments;
  }
  if (typeof attachments === 'string') {
    return attachments
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item, index) => ({ id: index + 1, label: item, url: item }));
  }
  return [];
}

function sanitizeMessage(messageInstance) {
  const message = toPlain(messageInstance) ?? {};
  return {
    ...message,
    attachments: normalizeAttachments(message.attachments),
    postedAt: message.postedAt ? new Date(message.postedAt).toISOString() : null,
  };
}

function prepareMessageAttachments(input) {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input
      .map((item, index) => {
        if (!item) return null;
        if (typeof item === 'string') {
          return { id: index + 1, label: item, url: item };
        }
        const label = item.label ?? item.name ?? item.url ?? `Attachment ${index + 1}`;
        return {
          id: item.id ?? index + 1,
          label,
          url: item.url ?? item.href ?? null,
          type: item.type ?? null,
        };
      })
      .filter((item) => item && item.url);
  }
  if (typeof input === 'string') {
    return normalizeAttachments(input);
  }
  return [];
}

function computeEscrowSnapshot(checkpoints) {
  const totals = {
    pendingAmount: 0,
    releasedAmount: 0,
    heldAmount: 0,
    nextReleaseAt: null,
  };

  checkpoints.forEach((checkpoint) => {
    const amount = Number.isFinite(checkpoint.amount) ? Number(checkpoint.amount) : 0;
    switch (checkpoint.status) {
      case 'released':
        totals.releasedAmount += amount;
        break;
      case 'held':
      case 'pending_release':
      case 'funded':
        totals.pendingAmount += amount;
        if (checkpoint.releasedAt) {
          const timestamp = new Date(checkpoint.releasedAt).getTime();
          if (!totals.nextReleaseAt || timestamp < new Date(totals.nextReleaseAt).getTime()) {
            totals.nextReleaseAt = new Date(timestamp).toISOString();
          }
        }
        break;
      case 'disputed':
        totals.heldAmount += amount;
        break;
      default:
        break;
    }
  });

  return totals;
}

function buildGigTimeline(order) {
  const events = [];
  const addEvent = (event) => {
    if (!event) {
      return;
    }
    if (!event.occurredAt) {
      event.occurredAt = order.createdAt ?? new Date().toISOString();
    }
    events.push(event);
  };

  (order.activities ?? []).forEach((activity) => {
    addEvent({
      id: `activity-${activity.id}`,
      kind: 'activity',
      activityType: activity.activityType,
      title: activity.title,
      description: activity.description,
      occurredAt: activity.occurredAt,
      metadata: activity.metadata ?? {},
    });
  });

  (order.requirements ?? []).forEach((requirement) => {
    addEvent({
      id: `requirement-${requirement.id}`,
      kind: 'requirement',
      status: requirement.status,
      title: requirement.title,
      occurredAt: requirement.dueAt ?? order.kickoffAt ?? order.createdAt,
    });
  });

  (order.revisions ?? []).forEach((revision) => {
    addEvent({
      id: `revision-${revision.id}`,
      kind: 'revision',
      status: revision.status,
      title: `Revision round ${revision.roundNumber}`,
      description: revision.summary,
      occurredAt: revision.requestedAt ?? revision.submittedAt ?? order.createdAt,
    });
  });

  (order.escrowCheckpoints ?? []).forEach((checkpoint) => {
    addEvent({
      id: `escrow-${checkpoint.id}`,
      kind: 'escrow',
      status: checkpoint.status,
      title: checkpoint.label,
      amount: checkpoint.amount,
      currency: checkpoint.currency,
      occurredAt: checkpoint.releasedAt ?? order.kickoffAt ?? order.createdAt,
    });
  });

  (order.messages ?? []).forEach((message) => {
    addEvent({
      id: `message-${message.id}`,
      kind: 'message',
      authorName: message.authorName,
      roleLabel: message.roleLabel,
      title: 'Message posted',
      description: message.body,
      occurredAt: message.postedAt,
    });
  });

  if (order.createdAt) {
    addEvent({
      id: `order-${order.id}`,
      kind: 'order',
      title: 'Order created',
      occurredAt: new Date(order.createdAt).toISOString(),
      status: order.status,
    });
  }

  return events.sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
}

function sanitizeGigOrder(orderInstance) {
  const order = toPlain(orderInstance) ?? {};
  const requirements = (orderInstance.get?.('requirements') ?? order.requirements ?? []).map((requirement) =>
    sanitizeRequirement(requirement),
  );
  const revisions = (orderInstance.get?.('revisions') ?? order.revisions ?? []).map((revision) =>
    sanitizeRevision(revision),
  );
  const activities = (orderInstance.get?.('activities') ?? order.activities ?? []).map((activity) =>
    sanitizeActivity(activity),
  );
  const messages = (orderInstance.get?.('messages') ?? order.messages ?? []).map((message) =>
    sanitizeMessage(message),
  );
  const checkpoints = (orderInstance.get?.('escrowCheckpoints') ?? order.escrowCheckpoints ?? []).map((checkpoint) =>
    sanitizeEscrowCheckpoint(checkpoint),
  );
  const scorecard = sanitizeScorecard(orderInstance.get?.('scorecard') ?? order.scorecard);

  const outstandingRequirements = requirements.filter((item) => item.status === 'pending').length;
  const activeRevisions = revisions.filter((item) => ['requested', 'in_progress', 'submitted'].includes(item.status)).length;
  const nextRequirementDueAt = requirements
    .filter((requirement) => requirement.status === 'pending' && requirement.dueAt)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())[0]?.dueAt;
  const escrowSnapshot = computeEscrowSnapshot(checkpoints);

  return {
    ...order,
    requirements,
    revisions,
    activities,
    messages,
    escrowCheckpoints: checkpoints,
    scorecard,
    outstandingRequirements,
    activeRevisions,
    nextRequirementDueAt: nextRequirementDueAt ?? null,
    escrowPendingAmount: Number(escrowSnapshot.pendingAmount.toFixed(2)),
    escrowReleasedAmount: Number(escrowSnapshot.releasedAmount.toFixed(2)),
    escrowHeldAmount: Number(escrowSnapshot.heldAmount.toFixed(2)),
    nextEscrowReleaseAt: escrowSnapshot.nextReleaseAt,
    isClosed: ['completed', 'cancelled'].includes(order.status),
    timeline: buildGigTimeline({
      ...order,
      requirements,
      revisions,
      activities,
      messages,
      escrowCheckpoints: checkpoints,
    }),
  };
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
  const orderRecords = await GigOrder.findAll({
    where: { ownerId },
    include: [
      { model: GigOrderRequirement, as: 'requirements', separate: true, order: [['dueAt', 'ASC']] },
      { model: GigOrderRevision, as: 'revisions', separate: true, order: [['roundNumber', 'ASC']] },
      { model: GigVendorScorecard, as: 'scorecard' },
      {
        model: GigOrderEscrowCheckpoint,
        as: 'escrowCheckpoints',
        separate: true,
        order: [['createdAt', 'ASC']],
      },
      {
        model: GigOrderActivity,
        as: 'activities',
        separate: true,
        order: [['occurredAt', 'DESC']],
      },
      {
        model: GigOrderMessage,
        as: 'messages',
        separate: true,
        limit: 25,
        order: [['postedAt', 'DESC']],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  const storyBlocks = await StoryBlock.findAll({ where: { ownerId }, order: [['createdAt', 'DESC']] });
  const brandAssets = await BrandAsset.findAll({ where: { ownerId }, order: [['createdAt', 'DESC']] });

  const orders = orderRecords.map((order) => sanitizeGigOrder(order));

  const summary = {
    totalProjects: projects.length,
    activeProjects: projects.filter((project) => project.status !== 'completed').length,
    budgetInPlay: projects.reduce((acc, project) => acc + normalizeNumber(project.budgetAllocated), 0),
    gigsInDelivery: orders.filter((order) => !order.isClosed).length,
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

export async function addGigOrderActivity(ownerId, orderId, payload, context = {}) {
  await ensureInitialized();
  const order = await GigOrder.findByPk(orderId);
  assertOwnership(order, ownerId, 'Gig order not found');

  const title = payload.title?.toString().trim();
  if (!title) {
    throw new ValidationError('Activity title is required.');
  }

  const activityType = payload.activityType?.toString().trim().toLowerCase() ?? 'note';
  if (!GIG_ORDER_ACTIVITY_TYPES.includes(activityType)) {
    throw new ValidationError('Invalid activity type provided.');
  }

  const occurredAt = ensureDate(payload.occurredAt ?? new Date(), { label: 'Occurred at' }) ?? new Date();

  return GigOrderActivity.create({
    orderId: order.id,
    freelancerId: order.freelancerId ?? null,
    actorId: context.actorId ?? ownerId,
    activityType,
    title,
    description: payload.description ?? null,
    occurredAt,
    metadata: {
      ...(payload.metadata ?? {}),
      actorRole: context.actorRole ?? null,
    },
  });
}

export async function createGigOrderMessage(ownerId, orderId, payload, context = {}) {
  await ensureInitialized();
  const order = await GigOrder.findByPk(orderId);
  assertOwnership(order, ownerId, 'Gig order not found');

  const body = payload.body?.toString().trim();
  if (!body) {
    throw new ValidationError('Message body is required.');
  }

  const postedAt = ensureDate(payload.postedAt ?? new Date(), { label: 'Posted at' }) ?? new Date();
  const attachments = prepareMessageAttachments(payload.attachments ?? payload.attachmentUrl);
  const authorName = payload.authorName?.toString().trim() || context.actorName || 'Workspace operator';
  const visibility = payload.visibility === 'shared' ? 'shared' : 'private';

  const message = await GigOrderMessage.create({
    orderId: order.id,
    authorId: context.actorId ?? ownerId,
    authorName,
    roleLabel: payload.roleLabel ?? context.actorRole ?? null,
    body,
    attachments,
    visibility,
    postedAt,
  });

  await GigOrderActivity.create({
    orderId: order.id,
    freelancerId: order.freelancerId ?? null,
    actorId: context.actorId ?? ownerId,
    activityType: 'communication',
    title: 'Message posted',
    description: body.slice(0, 160),
    occurredAt: postedAt,
    metadata: { source: 'gig_chat', messageId: message.id },
  });

  return message;
}

export async function createGigOrderEscrowCheckpoint(ownerId, orderId, payload, context = {}) {
  await ensureInitialized();
  const order = await GigOrder.findByPk(orderId);
  assertOwnership(order, ownerId, 'Gig order not found');

  const label = payload.label?.toString().trim();
  if (!label) {
    throw new ValidationError('Escrow checkpoint label is required.');
  }

  const amount = ensureNumber(payload.amount, { label: 'Escrow amount', allowNegative: false, allowZero: false });
  const currency = payload.currency?.toString().trim().toUpperCase() || order.currency || 'USD';
  const status = payload.status?.toString().trim().toLowerCase() || 'funded';
  if (!GIG_ESCROW_STATUSES.includes(status)) {
    throw new ValidationError('Invalid escrow status provided.');
  }

  let releasedAt = null;
  if (payload.releasedAt) {
    releasedAt = ensureDate(payload.releasedAt, { label: 'Released at' });
  }

  return GigOrderEscrowCheckpoint.create({
    orderId: order.id,
    label,
    amount,
    currency,
    status,
    approvalRequirement: payload.approvalRequirement ?? null,
    csatThreshold:
      payload.csatThreshold != null
        ? ensureNumber(payload.csatThreshold, { label: 'CSAT threshold', allowNegative: false })
        : null,
    releasedAt,
    releasedById: releasedAt ? context.actorId ?? ownerId : null,
    payoutReference: payload.payoutReference ?? null,
    notes: payload.notes ?? null,
  });
}

export async function updateGigOrderEscrowCheckpoint(ownerId, checkpointId, payload, context = {}) {
  await ensureInitialized();
  const checkpoint = await GigOrderEscrowCheckpoint.findByPk(checkpointId, {
    include: [{ model: GigOrder, as: 'order' }],
  });
  if (!checkpoint || !checkpoint.order) {
    throw new NotFoundError('Escrow checkpoint not found.');
  }
  assertOwnership(checkpoint.order, ownerId, 'Escrow checkpoint not found.');

  const updates = {};
  if (payload.label != null) {
    const label = payload.label.toString().trim();
    if (!label) {
      throw new ValidationError('Escrow label cannot be empty.');
    }
    updates.label = label;
  }

  if (payload.amount != null) {
    updates.amount = ensureNumber(payload.amount, { label: 'Escrow amount', allowNegative: false, allowZero: false });
  }

  if (payload.currency != null) {
    updates.currency = payload.currency.toString().trim().toUpperCase();
  }

  if (payload.status != null) {
    const status = payload.status.toString().trim().toLowerCase();
    if (!GIG_ESCROW_STATUSES.includes(status)) {
      throw new ValidationError('Invalid escrow status provided.');
    }
    updates.status = status;
    if (status === 'released' || payload.releasedAt) {
      updates.releasedAt = ensureDate(payload.releasedAt ?? new Date(), { label: 'Released at' });
      updates.releasedById = context.actorId ?? ownerId;
    }
    if (status !== 'released' && payload.releasedAt === null) {
      updates.releasedAt = null;
      updates.releasedById = null;
    }
  }

  if (payload.approvalRequirement != null) {
    updates.approvalRequirement = payload.approvalRequirement || null;
  }

  if (payload.notes != null) {
    updates.notes = payload.notes || null;
  }

  if (payload.payoutReference != null) {
    updates.payoutReference = payload.payoutReference || null;
  }

  if (payload.csatThreshold != null) {
    updates.csatThreshold = ensureNumber(payload.csatThreshold, {
      label: 'CSAT threshold',
      allowNegative: false,
    });
  }

  await checkpoint.update(updates);
  return checkpoint.reload();
}

export default {
  getProjectGigManagementOverview,
  createProject,
  addProjectAsset,
  updateProjectWorkspace,
  createGigOrder,
  updateGigOrder,
  addGigOrderActivity,
  createGigOrderMessage,
  createGigOrderEscrowCheckpoint,
  updateGigOrderEscrowCheckpoint,
};
