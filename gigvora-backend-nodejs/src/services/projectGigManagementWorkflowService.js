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
  ProjectBid,
  ProjectInvitation,
  AutoMatchSetting,
  AutoMatchCandidate,
  ProjectReview,
  EscrowAccount,
  EscrowTransaction,
  PROJECT_STATUSES,
  PROJECT_RISK_LEVELS,
  GIG_ORDER_STATUSES,
  PROJECT_BID_STATUSES,
  PROJECT_INVITATION_STATUSES,
  AUTO_MATCH_STATUS,
  REVIEW_SUBJECT_TYPES,
  ESCROW_TRANSACTION_TYPES,
  ESCROW_TRANSACTION_STATUSES,
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

function partitionProjects(projects = []) {
  const openStatuses = new Set(['planning', 'in_progress', 'at_risk', 'on_hold']);
  return projects.reduce(
    (acc, project) => {
      const status = project.workspace?.status ?? project.status ?? 'planning';
      if (openStatuses.has(status)) {
        acc.open.push(project);
      } else {
        acc.closed.push(project);
      }
      return acc;
    },
    { open: [], closed: [] },
  );
}

function buildLifecycleStats(projects = []) {
  const { open, closed } = partitionProjects(projects);
  const averageOpenProgress = open.length
    ? open.reduce((total, project) => total + normalizeNumber(project.workspace?.progressPercent), 0) / open.length
    : 0;
  return {
    openCount: open.length,
    closedCount: closed.length,
    openAverageProgress: averageOpenProgress,
    total: projects.length,
  };
}

function buildBidStats(bids = []) {
  const totals = bids.reduce(
    (acc, bid) => {
      const status = bid.status ?? 'draft';
      acc.total += 1;
      acc.byStatus[status] = (acc.byStatus[status] ?? 0) + 1;
      if (bid.amount != null) {
        acc.totalValue += Number(bid.amount);
      }
      if (bid.status === 'awarded') {
        acc.awarded += 1;
      }
      if (bid.status === 'shortlisted') {
        acc.shortlisted += 1;
      }
      return acc;
    },
    { total: 0, totalValue: 0, awarded: 0, shortlisted: 0, byStatus: {} },
  );
  return totals;
}

function buildInvitationStats(invitations = []) {
  return invitations.reduce(
    (acc, invite) => {
      acc.total += 1;
      acc.byStatus[invite.status ?? 'pending'] = (acc.byStatus[invite.status ?? 'pending'] ?? 0) + 1;
      if (invite.status === 'accepted') {
        acc.accepted += 1;
      }
      if (invite.status === 'declined') {
        acc.declined += 1;
      }
      return acc;
    },
    { total: 0, accepted: 0, declined: 0, byStatus: {} },
  );
}

function buildAutoMatchSummary(matches = []) {
  if (!matches.length) {
    return { total: 0, averageScore: null, engaged: 0, contacted: 0 };
  }
  const totals = matches.reduce(
    (acc, match) => {
      acc.total += 1;
      acc.score += Number(match.matchScore ?? 0);
      if (match.status === 'engaged') {
        acc.engaged += 1;
      }
      if (match.status === 'contacted') {
        acc.contacted += 1;
      }
      return acc;
    },
    { total: 0, score: 0, engaged: 0, contacted: 0 },
  );
  return {
    total: totals.total,
    averageScore: totals.total ? totals.score / totals.total : null,
    engaged: totals.engaged,
    contacted: totals.contacted,
  };
}

function buildReviewSummary(reviews = []) {
  if (!reviews.length) {
    return { total: 0, averageOverall: null, recommended: 0 };
  }
  const aggregate = reviews.reduce(
    (acc, review) => {
      acc.total += 1;
      acc.overall += Number(review.ratingOverall ?? 0);
      if (review.wouldRecommend) {
        acc.recommended += 1;
      }
      return acc;
    },
    { total: 0, overall: 0, recommended: 0 },
  );
  return {
    total: aggregate.total,
    averageOverall: aggregate.total ? aggregate.overall / aggregate.total : null,
    recommended: aggregate.recommended,
  };
}

function normalizeCurrency(value) {
  if (value == null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

  const [
    projects,
    templates,
    orders,
    storyBlocks,
    brandAssets,
    bids,
    invitations,
    matches,
    reviews,
  ] = await Promise.all([
    Project.findAll({
      where: { ownerId },
      include: [
        { model: ProjectWorkspace, as: 'workspace' },
        { model: ProjectMilestone, as: 'milestones', separate: true, order: [['ordinal', 'ASC']] },
        { model: ProjectCollaborator, as: 'collaborators' },
        { model: ProjectIntegration, as: 'integrations' },
        { model: ProjectRetrospective, as: 'retrospectives', separate: true, order: [['generatedAt', 'DESC']] },
        { model: ProjectAsset, as: 'assets' },
        { model: ProjectBid, as: 'bids' },
        { model: ProjectInvitation, as: 'invitations' },
        { model: ProjectReview, as: 'reviews' },
        { model: AutoMatchCandidate, as: 'autoMatches' },
      ],
      order: [['updatedAt', 'DESC']],
    }),
    ProjectTemplate.findAll({ order: [['createdAt', 'DESC']] }),
    GigOrder.findAll({
      where: { ownerId },
      include: [
        { model: GigOrderRequirement, as: 'requirements' },
        { model: GigOrderRevision, as: 'revisions', order: [['roundNumber', 'ASC']] },
        { model: GigVendorScorecard, as: 'scorecard' },
        { model: ProjectReview, as: 'orderReviews' },
      ],
      order: [['createdAt', 'DESC']],
    }),
    StoryBlock.findAll({ where: { ownerId }, order: [['createdAt', 'DESC']] }),
    BrandAsset.findAll({ where: { ownerId }, order: [['createdAt', 'DESC']] }),
    ProjectBid.findAll({ where: { ownerId }, order: [['createdAt', 'DESC']] }),
    ProjectInvitation.findAll({ where: { ownerId }, order: [['inviteSentAt', 'DESC']] }),
    AutoMatchCandidate.findAll({ where: { ownerId }, order: [['matchedAt', 'DESC']] }),
    ProjectReview.findAll({ where: { ownerId }, order: [['submittedAt', 'DESC']] }),
  ]);

  const [autoMatchSettings] = await AutoMatchSetting.findOrCreate({
    where: { ownerId },
    defaults: { ownerId, enabled: false, matchingWindowDays: 14 },
  });

  const [escrowAccount] = await EscrowAccount.findOrCreate({
    where: { ownerId },
    defaults: { ownerId, currency: 'USD', balance: 0, autoReleaseDays: 14 },
  });

  const escrowTransactions = await EscrowTransaction.findAll({
    where: { accountId: escrowAccount.id },
    order: [['occurredAt', 'DESC']],
    limit: 25,
  });

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

  const lifecycleStats = buildLifecycleStats(sanitizedProjects);
  const lifecyclePartition = partitionProjects(sanitizedProjects);

  const orderSnapshots = orders.map((order) => {
    const plain = order.get({ plain: true });
    return {
      ...plain,
      amount: normalizeCurrency(plain.amount),
      progressPercent: normalizeNumber(plain.progressPercent),
    };
  });

  const bidRecords = bids.map((bid) => {
    const plain = bid.get({ plain: true });
    return { ...plain, amount: normalizeCurrency(plain.amount) };
  });

  const invitationRecords = invitations.map((invite) => invite.get({ plain: true }));
  const autoMatchRecords = matches.map((match) => {
    const plain = match.get({ plain: true });
    return { ...plain, matchScore: normalizeCurrency(plain.matchScore) ?? 0 };
  });
  const reviewRecords = reviews.map((review) => {
    const plain = review.get({ plain: true });
    return {
      ...plain,
      ratingOverall: normalizeCurrency(plain.ratingOverall) ?? 0,
      ratingQuality: normalizeCurrency(plain.ratingQuality),
      ratingCommunication: normalizeCurrency(plain.ratingCommunication),
      ratingProfessionalism: normalizeCurrency(plain.ratingProfessionalism),
    };
  });

  const autoMatchSettingsPlain = autoMatchSettings.get({ plain: true });
  const escrowAccountPlain = escrowAccount.get({ plain: true });
  const escrowTransactionRecords = escrowTransactions.map((transaction) => {
    const plain = transaction.get({ plain: true });
    return { ...plain, amount: normalizeCurrency(plain.amount) ?? 0 };
  });

  const vendorStats = buildVendorStats(orderSnapshots);
  const reminders = buildGigReminders(orderSnapshots);
  const storytelling = buildStorytelling(sanitizedProjects, orderSnapshots, storyBlocks);

  const summary = {
    totalProjects: sanitizedProjects.length,
    activeProjects: lifecycleStats.openCount,
    budgetInPlay: sanitizedProjects.reduce((acc, project) => acc + normalizeNumber(project.budgetAllocated), 0),
    gigsInDelivery: orderSnapshots.filter((order) => !['completed', 'cancelled'].includes(order.status)).length,
    templatesAvailable: templates.length,
    assetsSecured: brandAssets.length,
    storiesReady: storytelling.achievements.length,
  };

  return {
    summary,
    projectCreation: { projects: sanitizedProjects, templates },
    projectLifecycle: {
      open: lifecyclePartition.open,
      closed: lifecyclePartition.closed,
      stats: lifecycleStats,
    },
    projectBids: { bids: bidRecords, stats: buildBidStats(bidRecords) },
    invitations: { entries: invitationRecords, stats: buildInvitationStats(invitationRecords) },
    autoMatch: {
      settings: autoMatchSettingsPlain,
      matches: autoMatchRecords,
      summary: buildAutoMatchSummary(autoMatchRecords),
    },
    reviews: { entries: reviewRecords, summary: buildReviewSummary(reviewRecords) },
    assets: { items: assets, summary: assetSummary, brandAssets },
    managementBoard: board,
    purchasedGigs: {
      orders: orderSnapshots,
      reminders,
      stats: vendorStats,
    },
    storytelling,
    escrow: {
      account: {
        ...escrowAccountPlain,
        balance: normalizeCurrency(escrowAccountPlain.balance) ?? 0,
      },
      transactions: escrowTransactionRecords,
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

export async function createProjectBid(ownerId, payload) {
  await ensureInitialized();
  if (!payload?.title || !payload.vendorName) {
    throw new ValidationError('Bid title and vendor name are required.');
  }
  if (payload.status && !PROJECT_BID_STATUSES.includes(payload.status)) {
    throw new ValidationError('Invalid bid status provided.');
  }

  const amount =
    payload.amount != null
      ? ensureNumber(payload.amount, { label: 'Bid amount', allowNegative: false, allowZero: false })
      : null;
  const submittedAt = ensureDate(payload.submittedAt, { label: 'Submission date' }) ?? new Date();
  const validUntil = ensureDate(payload.validUntil, { label: 'Validity date' });

  return ProjectBid.create({
    ownerId,
    projectId: payload.projectId ?? null,
    title: payload.title,
    vendorName: payload.vendorName,
    vendorEmail: payload.vendorEmail ?? null,
    amount,
    currency: payload.currency ?? 'USD',
    status: payload.status ?? 'submitted',
    submittedAt,
    validUntil,
    notes: payload.notes ?? null,
    metadata: payload.metadata ?? {},
  });
}

export async function updateProjectBid(ownerId, bidId, payload) {
  await ensureInitialized();
  const bid = await ProjectBid.findByPk(bidId);
  assertOwnership(bid, ownerId, 'Bid not found');

  if (payload.status && !PROJECT_BID_STATUSES.includes(payload.status)) {
    throw new ValidationError('Invalid bid status provided.');
  }
  const amount =
    payload.amount != null
      ? ensureNumber(payload.amount, { label: 'Bid amount', allowNegative: false, allowZero: false })
      : bid.amount;
  const submittedAt = payload.submittedAt ? ensureDate(payload.submittedAt, { label: 'Submission date' }) : bid.submittedAt;
  const validUntil = payload.validUntil ? ensureDate(payload.validUntil, { label: 'Validity date' }) : bid.validUntil;

  await bid.update({
    title: payload.title ?? bid.title,
    vendorName: payload.vendorName ?? bid.vendorName,
    vendorEmail: payload.vendorEmail ?? bid.vendorEmail,
    amount,
    currency: payload.currency ?? bid.currency,
    status: payload.status ?? bid.status,
    submittedAt,
    validUntil,
    notes: payload.notes ?? bid.notes,
    metadata: payload.metadata ?? bid.metadata,
  });

  return bid.reload();
}

export async function sendProjectInvitation(ownerId, payload) {
  await ensureInitialized();
  if (!payload?.freelancerName) {
    throw new ValidationError('Freelancer name is required.');
  }
  if (payload.status && !PROJECT_INVITATION_STATUSES.includes(payload.status)) {
    throw new ValidationError('Invalid invitation status provided.');
  }

  const inviteSentAt = ensureDate(payload.inviteSentAt, { label: 'Invitation sent date' }) ?? new Date();
  const respondedAt = ensureDate(payload.respondedAt, { label: 'Response date' });

  return ProjectInvitation.create({
    ownerId,
    projectId: payload.projectId ?? null,
    freelancerName: payload.freelancerName,
    freelancerEmail: payload.freelancerEmail ?? null,
    role: payload.role ?? null,
    message: payload.message ?? null,
    status: payload.status ?? 'pending',
    inviteSentAt,
    respondedAt,
    metadata: payload.metadata ?? {},
  });
}

export async function updateProjectInvitation(ownerId, invitationId, payload) {
  await ensureInitialized();
  const invitation = await ProjectInvitation.findByPk(invitationId);
  assertOwnership(invitation, ownerId, 'Invitation not found');

  if (payload.status && !PROJECT_INVITATION_STATUSES.includes(payload.status)) {
    throw new ValidationError('Invalid invitation status provided.');
  }

  const respondedAt = payload.respondedAt ? ensureDate(payload.respondedAt, { label: 'Response date' }) : invitation.respondedAt;

  await invitation.update({
    freelancerName: payload.freelancerName ?? invitation.freelancerName,
    freelancerEmail: payload.freelancerEmail ?? invitation.freelancerEmail,
    role: payload.role ?? invitation.role,
    message: payload.message ?? invitation.message,
    status: payload.status ?? invitation.status,
    respondedAt,
    metadata: payload.metadata ?? invitation.metadata,
  });

  return invitation.reload();
}

export async function updateAutoMatchSettings(ownerId, payload) {
  await ensureInitialized();
  const [settings] = await AutoMatchSetting.findOrCreate({
    where: { ownerId },
    defaults: { ownerId, enabled: false, matchingWindowDays: 14 },
  });

  const matchingWindowDays = payload.matchingWindowDays != null
    ? ensureNumber(payload.matchingWindowDays, { label: 'Matching window', allowNegative: false, allowZero: false })
    : settings.matchingWindowDays;

  const budgetMin = payload.budgetMin != null ? ensureNumber(payload.budgetMin, { label: 'Minimum budget', allowNegative: false }) : settings.budgetMin;
  const budgetMax = payload.budgetMax != null ? ensureNumber(payload.budgetMax, { label: 'Maximum budget', allowNegative: false }) : settings.budgetMax;

  await settings.update({
    enabled: payload.enabled != null ? Boolean(payload.enabled) : settings.enabled,
    matchingWindowDays,
    budgetMin,
    budgetMax,
    targetRoles: payload.targetRoles ?? settings.targetRoles,
    focusSkills: payload.focusSkills ?? settings.focusSkills,
    geoPreferences: payload.geoPreferences ?? settings.geoPreferences,
    seniority: payload.seniority ?? settings.seniority,
    metadata: payload.metadata ?? settings.metadata,
  });

  return settings.reload();
}

export async function recordAutoMatchCandidate(ownerId, payload) {
  await ensureInitialized();
  if (!payload?.freelancerName) {
    throw new ValidationError('Candidate name is required.');
  }
  if (payload.status && !AUTO_MATCH_STATUS.includes(payload.status)) {
    throw new ValidationError('Invalid match status provided.');
  }

  const matchScore = payload.matchScore != null ? ensureNumber(payload.matchScore, { label: 'Match score', allowNegative: false }) : 0;
  const matchedAt = ensureDate(payload.matchedAt, { label: 'Match date' }) ?? new Date();

  return AutoMatchCandidate.create({
    ownerId,
    projectId: payload.projectId ?? null,
    freelancerName: payload.freelancerName,
    freelancerEmail: payload.freelancerEmail ?? null,
    matchScore,
    status: payload.status ?? 'suggested',
    matchedAt,
    channel: payload.channel ?? null,
    notes: payload.notes ?? null,
    metadata: payload.metadata ?? {},
  });
}

export async function updateAutoMatchCandidate(ownerId, candidateId, payload) {
  await ensureInitialized();
  const candidate = await AutoMatchCandidate.findByPk(candidateId);
  assertOwnership(candidate, ownerId, 'Match candidate not found');

  if (payload.status && !AUTO_MATCH_STATUS.includes(payload.status)) {
    throw new ValidationError('Invalid match status provided.');
  }

  const matchScore = payload.matchScore != null ? ensureNumber(payload.matchScore, { label: 'Match score', allowNegative: false }) : candidate.matchScore;
  const matchedAt = payload.matchedAt ? ensureDate(payload.matchedAt, { label: 'Match date' }) : candidate.matchedAt;

  await candidate.update({
    freelancerName: payload.freelancerName ?? candidate.freelancerName,
    freelancerEmail: payload.freelancerEmail ?? candidate.freelancerEmail,
    matchScore,
    status: payload.status ?? candidate.status,
    matchedAt,
    channel: payload.channel ?? candidate.channel,
    notes: payload.notes ?? candidate.notes,
    metadata: payload.metadata ?? candidate.metadata,
  });

  return candidate.reload();
}

function ensureRating(value, label) {
  const rating = ensureNumber(value, { label, allowNegative: false });
  if (rating < 0 || rating > 5) {
    throw new ValidationError(`${label} must be between 0 and 5.`);
  }
  return rating;
}

export async function createProjectReview(ownerId, payload) {
  await ensureInitialized();
  if (!payload?.subjectName) {
    throw new ValidationError('Subject name is required.');
  }
  if (payload.subjectType && !REVIEW_SUBJECT_TYPES.includes(payload.subjectType)) {
    throw new ValidationError('Invalid review subject type provided.');
  }

  const ratingOverall = ensureRating(payload.ratingOverall ?? 0, 'Overall rating');
  const ratingQuality = payload.ratingQuality != null ? ensureRating(payload.ratingQuality, 'Quality rating') : null;
  const ratingCommunication = payload.ratingCommunication != null ? ensureRating(payload.ratingCommunication, 'Communication rating') : null;
  const ratingProfessionalism =
    payload.ratingProfessionalism != null ? ensureRating(payload.ratingProfessionalism, 'Professionalism rating') : null;
  const submittedAt = ensureDate(payload.submittedAt, { label: 'Submitted at' }) ?? new Date();

  return ProjectReview.create({
    ownerId,
    orderId: payload.orderId ?? null,
    projectId: payload.projectId ?? null,
    subjectType: payload.subjectType ?? 'vendor',
    subjectName: payload.subjectName,
    ratingOverall,
    ratingQuality,
    ratingCommunication,
    ratingProfessionalism,
    wouldRecommend: payload.wouldRecommend != null ? Boolean(payload.wouldRecommend) : null,
    comments: payload.comments ?? null,
    submittedAt,
    metadata: payload.metadata ?? {},
  });
}

export async function createEscrowTransaction(ownerId, payload) {
  await ensureInitialized();
  if (!payload?.type || !ESCROW_TRANSACTION_TYPES.includes(payload.type)) {
    throw new ValidationError('Escrow transaction type is invalid.');
  }
  if (payload.status && !ESCROW_TRANSACTION_STATUSES.includes(payload.status)) {
    throw new ValidationError('Escrow transaction status is invalid.');
  }

  const amount = ensureNumber(payload.amount, { label: 'Transaction amount', allowNegative: false, allowZero: false });
  const occurredAt = ensureDate(payload.occurredAt, { label: 'Transaction timestamp' }) ?? new Date();
  const status = payload.status ?? 'completed';

  return projectGigManagementSequelize.transaction(async (transaction) => {
    const [account] = await EscrowAccount.findOrCreate({
      where: { ownerId },
      defaults: { ownerId, currency: payload.currency ?? 'USD', balance: 0, autoReleaseDays: 14 },
      transaction,
    });

    const entry = await EscrowTransaction.create(
      {
        accountId: account.id,
        reference: payload.reference ?? `ESC-${Date.now()}`,
        type: payload.type,
        status,
        amount,
        currency: payload.currency ?? account.currency ?? 'USD',
        occurredAt,
        description: payload.description ?? null,
        metadata: payload.metadata ?? {},
      },
      { transaction },
    );

    if (status === 'completed') {
      const direction = payload.direction ?? (['deposit', 'refund'].includes(payload.type) ? 'credit' : 'debit');
      const delta = direction === 'debit' ? -amount : amount;
      await account.increment('balance', { by: delta, transaction });
    }

    return entry;
  });
}

export async function updateEscrowSettings(ownerId, payload) {
  await ensureInitialized();
  const [account] = await EscrowAccount.findOrCreate({
    where: { ownerId },
    defaults: { ownerId, currency: payload.currency ?? 'USD', balance: 0, autoReleaseDays: 14 },
  });

  const autoReleaseDays =
    payload.autoReleaseDays != null
      ? ensureNumber(payload.autoReleaseDays, { label: 'Auto-release days', allowNegative: false, allowZero: false })
      : account.autoReleaseDays;

  await account.update({
    currency: payload.currency ?? account.currency,
    autoReleaseDays,
    metadata: payload.metadata ?? account.metadata,
  });

  return account.reload();
}

export default {
  getProjectGigManagementOverview,
  createProject,
  addProjectAsset,
  updateProjectWorkspace,
  createGigOrder,
  updateGigOrder,
  createProjectBid,
  updateProjectBid,
  sendProjectInvitation,
  updateProjectInvitation,
  updateAutoMatchSettings,
  recordAutoMatchCandidate,
  updateAutoMatchCandidate,
  createProjectReview,
  createEscrowTransaction,
  updateEscrowSettings,
};
