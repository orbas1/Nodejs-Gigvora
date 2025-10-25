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
  GigOrderEscalation,
  GigTimelineEvent,
  GigSubmission,
  GigSubmissionAsset,
  GigChatMessage,
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
  WORKSPACE_STATUSES,
  WORKSPACE_RISK_LEVELS,
  PROJECT_COLLABORATOR_STATUSES,
  GIG_ORDER_STATUSES,
  GIG_REQUIREMENT_STATUSES,
  PROJECT_BID_STATUSES,
  PROJECT_INVITATION_STATUSES,
  AUTO_MATCH_STATUS,
  REVIEW_SUBJECT_TYPES,
  ESCROW_TRANSACTION_TYPES,
  ESCROW_TRANSACTION_STATUSES,
  GIG_ESCROW_STATUSES,
  GIG_TIMELINE_EVENT_TYPES,
  GIG_TIMELINE_EVENT_STATUSES,
  GIG_SUBMISSION_STATUSES,
  GIG_TIMELINE_VISIBILITIES,
  GIG_CHAT_VISIBILITIES,
  syncProjectGigManagementModels,
} from '../models/projectGigManagementModels.js';
import { GIG_ORDER_ACTIVITY_TYPES } from '../models/constants/index.js';
import { toNullableEscalationMetadata } from './utils/escalationMetadata.js';
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

function coerceDate(value) {
  if (!value) {
    return null;
  }
  const candidate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(candidate.getTime())) {
    return null;
  }
  return candidate;
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
  const watermarkedCount = assets.filter((asset) => asset.watermarkEnabled).length;
  const watermarkCoverage = total === 0 ? 0 : (watermarkedCount / total) * 100;
  const storageBytes = assets.reduce((acc, asset) => acc + normalizeNumber(asset.sizeBytes), 0);
  return {
    total,
    restricted,
    watermarked: watermarkedCount,
    watermarkCoverage,
    storageBytes,
    totalSizeBytes: storageBytes,
  };
}

const PROJECT_TO_WORKSPACE_STATUS = Object.freeze({
  planning: 'briefing',
  in_progress: 'active',
  at_risk: 'blocked',
  on_hold: 'blocked',
  completed: 'completed',
});

function resolveWorkspaceStatusFromProject(status) {
  const normalized = `${status ?? ''}`.trim().toLowerCase();
  return PROJECT_TO_WORKSPACE_STATUS[normalized] ?? 'briefing';
}

function normaliseWorkspaceScore(value, { label, max }) {
  if (value == null) {
    return null;
  }
  const numeric = ensureNumber(value, { label, allowNegative: false });
  const clamped = Math.max(0, Math.min(max, numeric));
  return Number(clamped.toFixed(2));
}

function partitionProjects(projects = []) {
  const openStatuses = new Set(['briefing', 'active', 'blocked']);
  return projects.reduce(
    (acc, project) => {
      const statusCandidate = project.workspace?.status ?? project.status ?? 'planning';
      const status = project.workspace?.status
        ? project.workspace.status
        : resolveWorkspaceStatusFromProject(statusCandidate);
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
    return {
      total: 0,
      averageScore: null,
      engaged: 0,
      contacted: 0,
      suggested: 0,
      dismissed: 0,
      readyCount: 0,
      readyRatio: 0,
    };
  }

  const totals = matches.reduce(
    (acc, match) => {
      acc.total += 1;
      acc.score += Number(match.matchScore ?? 0);
      const status = (match.status ?? '').toLowerCase();
      switch (status) {
        case 'engaged':
          acc.engaged += 1;
          acc.ready += 1;
          break;
        case 'contacted':
          acc.contacted += 1;
          acc.ready += 1;
          break;
        case 'dismissed':
          acc.dismissed += 1;
          break;
        default:
          acc.suggested += 1;
          break;
      }
      return acc;
    },
    { total: 0, score: 0, engaged: 0, contacted: 0, suggested: 0, dismissed: 0, ready: 0 },
  );

  const averageScore = totals.total ? totals.score / totals.total : null;
  const readyRatio = totals.total ? (totals.ready / totals.total) * 100 : 0;

  return {
    total: totals.total,
    averageScore,
    engaged: totals.engaged,
    contacted: totals.contacted,
    suggested: totals.suggested,
    dismissed: totals.dismissed,
    readyCount: totals.ready,
    readyRatio,
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
      awaitingReview: 0,
      pendingClient: 0,
      averageTurnaroundHours: null,
      turnaroundSamples: 0,
      onTimeDeliveryRate: null,
    };
  }

  const active = orders.filter((order) => !['completed', 'cancelled'].includes(order.status)).length;
  const completed = orders.filter((order) => order.status === 'completed').length;
  const averageProgress =
    orders.reduce((total, order) => total + normalizeNumber(order.progressPercent), 0) / orders.length;
  const awaitingReview = orders.filter((order) => order.status === 'in_revision').length;

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

  const completionEventTypes = new Set(['handoff', 'qa_review', 'milestone', 'retro']);
  const turnaroundMetrics = orders.reduce(
    (acc, order) => {
      const start = coerceDate(order.kickoffAt) ?? coerceDate(order.createdAt);
      if (!start) {
        return acc;
      }

      const timelineEvents = Array.isArray(order.timelineEvents) ? order.timelineEvents : [];
      const completionEvent = timelineEvents
        .map((event) => ({
          type: event.eventType ?? event.type ?? 'note',
          status: event.status ?? null,
          completedAt: coerceDate(event.completedAt ?? event.occurredAt ?? event.scheduledAt),
        }))
        .find((event) => event.status === 'completed' && event.completedAt && completionEventTypes.has(event.type));

      const approvedSubmission = (Array.isArray(order.submissions) ? order.submissions : [])
        .map((submission) => ({
          status: submission.status ?? null,
          approvedAt: coerceDate(submission.approvedAt ?? submission.submittedAt ?? null),
        }))
        .find((submission) => submission.status === 'approved' && submission.approvedAt);

      const metadataCompletion = coerceDate(order.metadata?.completedAt);
      const completion = completionEvent?.completedAt ?? approvedSubmission?.approvedAt ?? metadataCompletion;

      if (!completion) {
        return acc;
      }

      const hours = (completion.getTime() - start.getTime()) / (1000 * 60 * 60);
      if (!Number.isFinite(hours) || hours < 0) {
        return acc;
      }

      acc.samples += 1;
      acc.totalHours += hours;

      const due = coerceDate(order.dueAt);
      if (due) {
        acc.onTimeChecks += 1;
        if (completion.getTime() <= due.getTime()) {
          acc.onTimeHits += 1;
        }
      }

      return acc;
    },
    { samples: 0, totalHours: 0, onTimeChecks: 0, onTimeHits: 0 },
  );

  const averageTurnaroundHours =
    turnaroundMetrics.samples > 0 ? Math.round(((turnaroundMetrics.totalHours / turnaroundMetrics.samples) + Number.EPSILON) * 10) / 10 : null;
  const onTimeDeliveryRate =
    turnaroundMetrics.onTimeChecks > 0
      ? Math.round(((turnaroundMetrics.onTimeHits / turnaroundMetrics.onTimeChecks) * 100 + Number.EPSILON) * 10) / 10
      : null;

  return {
    totalOrders: orders.length,
    active,
    completed,
    averageProgress,
    averages,
    awaitingReview,
    pendingClient: awaitingReview,
    averageTurnaroundHours,
    turnaroundSamples: turnaroundMetrics.samples,
    onTimeDeliveryRate,
  };
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
      order.timelineEvents?.forEach((event) => {
        if (['completed', 'cancelled'].includes(event.status)) {
          return;
        }
        reminders.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          type: 'timeline',
          title: event.title,
          dueAt: event.scheduledAt,
          status: event.status,
          overdue: event.scheduledAt ? new Date(event.scheduledAt).getTime() < now : false,
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
        id: `project-${project.id}`,
        type: 'project',
        title: project.title,
        bullet: `Advanced ${progress.toFixed(0)}% with ${project.collaborators.length} collaborators.`,
        metrics: {
          progressPercent: progress,
          csat: project.workspace?.metrics?.csat ?? null,
        },
        deliveredAt: project.workspace?.nextMilestoneDueAt ?? project.updatedAt ?? null,
        recommendedChannel: 'portfolio',
      });
    }
  });

  orders.forEach((order) => {
    if (order.status === 'completed') {
      achievements.push({
        id: `order-${order.id}`,
        type: 'gig',
        title: order.serviceName,
        bullet: `Delivered ${order.serviceName} with ${order.vendorName} and captured ${order.currency} ${order.amount}.`,
        metrics: {
          progressPercent: normalizeNumber(order.progressPercent),
          csat: order.scorecard?.overallScore ?? null,
        },
        deliveredAt: order.dueAt ?? order.completedAt ?? order.updatedAt ?? null,
        recommendedChannel: 'client_update',
      });
    }
  });

  storyBlocks.forEach((block) => {
    achievements.push({
      id: `story-${block.id}`,
      type: 'story_block',
      title: block.title,
      bullet: block.outcome,
      metrics: block.metrics ?? {},
      deliveredAt: block.lastUsedAt ?? block.createdAt ?? null,
      recommendedChannel: block.metadata?.recommendedChannel ?? 'linkedin',
    });
  });

  const quickExports = {
    resumeBullets: achievements.slice(0, 3).map((achievement) => `• ${achievement.bullet}`),
    linkedinPosts: achievements.slice(0, 2).map((achievement) => `Celebrated ${achievement.title}`),
    coverLetters: achievements.map((achievement) => `${achievement.title} — ${achievement.bullet}`),
  };

  const prompts = achievements.map((achievement, index) => ({
    id: `prompt-${achievement.id ?? index}`,
    title: achievement.title,
    prompt: `How would you expand on ${achievement.title} to highlight measurable impact and collaborators?`,
  }));

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
  const cycleTimeDays =
    archivedAt && startDate ? Math.max(Math.round((new Date(archivedAt) - startDate) / (1000 * 60 * 60 * 24)), 0) : null;
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

function sanitizeRequirement(requirementInstance) {
  const requirement = toPlain(requirementInstance);
  if (!requirement) {
    return null;
  }

  return {
    id: requirement.id,
    orderId: requirement.orderId ?? null,
    title: requirement.title ?? null,
    status: requirement.status ?? 'pending',
    dueAt: requirement.dueAt ? new Date(requirement.dueAt).toISOString() : null,
    notes: requirement.notes ?? null,
    createdAt: requirement.createdAt ?? null,
    updatedAt: requirement.updatedAt ?? null,
  };
}

function sanitizeRevision(revisionInstance) {
  const revision = toPlain(revisionInstance);
  if (!revision) {
    return null;
  }

  return {
    id: revision.id,
    orderId: revision.orderId ?? null,
    roundNumber: revision.roundNumber != null ? Number(revision.roundNumber) : null,
    status: revision.status ?? 'requested',
    requestedAt: revision.requestedAt ? new Date(revision.requestedAt).toISOString() : null,
    dueAt: revision.dueAt ? new Date(revision.dueAt).toISOString() : null,
    submittedAt: revision.submittedAt ? new Date(revision.submittedAt).toISOString() : null,
    approvedAt: revision.approvedAt ? new Date(revision.approvedAt).toISOString() : null,
    summary: revision.summary ?? null,
    createdAt: revision.createdAt ?? null,
    updatedAt: revision.updatedAt ?? null,
  };
}

function sanitizeScorecard(scorecardInstance) {
  const scorecard = toPlain(scorecardInstance);
  if (!scorecard) {
    return null;
  }

  return {
    id: scorecard.id,
    orderId: scorecard.orderId ?? null,
    qualityScore: scorecard.qualityScore == null ? null : Number(scorecard.qualityScore),
    communicationScore: scorecard.communicationScore == null ? null : Number(scorecard.communicationScore),
    reliabilityScore: scorecard.reliabilityScore == null ? null : Number(scorecard.reliabilityScore),
    overallScore: scorecard.overallScore == null ? null : Number(scorecard.overallScore),
    notes: scorecard.notes ?? null,
    createdAt: scorecard.createdAt ?? null,
    updatedAt: scorecard.updatedAt ?? null,
  };
}

function sanitizeEscrowCheckpoint(checkpointInstance) {
  const checkpoint = toPlain(checkpointInstance);
  if (!checkpoint) {
    return null;
  }

  return {
    id: checkpoint.id,
    orderId: checkpoint.orderId ?? null,
    label: checkpoint.label ?? null,
    amount: checkpoint.amount == null ? 0 : Number(checkpoint.amount),
    currency: checkpoint.currency ?? null,
    status: checkpoint.status ?? null,
    approvalRequirement: checkpoint.approvalRequirement ?? null,
    csatThreshold: checkpoint.csatThreshold == null ? null : Number(checkpoint.csatThreshold),
    releasedAt: checkpoint.releasedAt ? new Date(checkpoint.releasedAt).toISOString() : null,
    releasedById: checkpoint.releasedById ?? null,
    payoutReference: checkpoint.payoutReference ?? null,
    notes: checkpoint.notes ?? null,
    createdAt: checkpoint.createdAt ?? null,
    updatedAt: checkpoint.updatedAt ?? null,
  };
}

function sanitizeEscalation(escalationInstance) {
  const escalation = toPlain(escalationInstance);
  if (!escalation) {
    return null;
  }

  const metadata = toNullableEscalationMetadata(escalation.metadata);

  return {
    id: escalation.id,
    ownerId: escalation.ownerId ?? null,
    orderId: escalation.orderId ?? null,
    status: escalation.status ?? 'queued',
    severity: escalation.severity ?? 'warning',
    message: escalation.message ?? null,
    hoursOverdue:
      escalation.hoursOverdue == null ? null : Number.parseInt(escalation.hoursOverdue, 10) || null,
    detectedAt: escalation.detectedAt ? new Date(escalation.detectedAt).toISOString() : null,
    escalatedAt: escalation.escalatedAt ? new Date(escalation.escalatedAt).toISOString() : null,
    resolvedAt: escalation.resolvedAt ? new Date(escalation.resolvedAt).toISOString() : null,
    supportCaseId: escalation.supportCaseId ?? null,
    supportThreadId: escalation.supportThreadId ?? null,
    metadata,
    createdAt: escalation.createdAt ?? null,
    updatedAt: escalation.updatedAt ?? null,
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

function normalizeMessageAttachments(attachments) {
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
  const message = toPlain(messageInstance);
  if (!message) {
    return null;
  }

  return {
    id: message.id,
    orderId: message.orderId ?? null,
    authorId: message.authorId ?? null,
    authorName: message.authorName ?? null,
    roleLabel: message.roleLabel ?? null,
    body: message.body ?? null,
    attachments: prepareMessageAttachments(message.attachments),
    visibility: message.visibility ?? 'private',
    postedAt: message.postedAt ? new Date(message.postedAt).toISOString() : null,
    createdAt: message.createdAt ?? null,
    updatedAt: message.updatedAt ?? null,
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
    return normalizeMessageAttachments(input);
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

function sanitizeGigOrder(orderInstance, { includeAssociations = true } = {}) {
  const order = toPlain(orderInstance);
  if (!order) {
    return null;
  }

  const metadata = sanitizeGigMetadata(order.metadata ?? {});
  const base = {
    id: order.id,
    ownerId: order.ownerId,
    orderNumber: order.orderNumber,
    vendorName: order.vendorName,
    serviceName: order.serviceName,
    status: order.status,
    progressPercent: order.progressPercent != null ? Number(order.progressPercent) : 0,
    amount: order.amount != null ? Number(order.amount) : 0,
    currency: order.currency ?? metadata.currency ?? null,
    kickoffAt: order.kickoffAt ?? null,
    dueAt: order.dueAt ?? null,
    metadata,
    classes: metadata.classes ?? [],
    addons: metadata.addons ?? [],
    tags: metadata.tags ?? [],
    media: metadata.media ?? [],
    faqs: metadata.faqs ?? [],
    createdAt: order.createdAt ?? null,
    updatedAt: order.updatedAt ?? null,
  };

  if (!includeAssociations) {
    return base;
  }

  const requirementRecords = orderInstance?.get?.('requirements') ?? order.requirements ?? [];
  const requirements = requirementRecords.map((requirement) => sanitizeRequirement(requirement)).filter(Boolean);

  const revisionRecords = orderInstance?.get?.('revisions') ?? order.revisions ?? [];
  const revisions = revisionRecords.map((revision) => sanitizeRevision(revision)).filter(Boolean);

  const activityRecords = orderInstance?.get?.('activities') ?? order.activities ?? [];
  const activities = activityRecords.map((activity) => sanitizeActivity(activity)).filter(Boolean);

  const messageRecords = orderInstance?.get?.('messages') ?? order.messages ?? [];
  const messages = messageRecords.map((message) => sanitizeMessage(message)).filter(Boolean);

  const checkpointRecords = orderInstance?.get?.('escrowCheckpoints') ?? order.escrowCheckpoints ?? [];
  const escrowCheckpoints = checkpointRecords.map((checkpoint) => sanitizeEscrowCheckpoint(checkpoint)).filter(Boolean);

  const timelineRecords = orderInstance?.get?.('timelineEvents') ?? order.timelineEvents ?? order.timeline ?? [];
  const timelineEvents = timelineRecords.map((event) => sanitizeTimelineEvent(event, base)).filter(Boolean);

  const submissionRecords = orderInstance?.get?.('submissions') ?? order.submissions ?? [];
  const submissions = submissionRecords.map((submission) => sanitizeSubmission(submission, base)).filter(Boolean);

  const chatRecords = orderInstance?.get?.('chatMessages') ?? order.chatMessages ?? [];
  const chatMessages = chatRecords.map((chat) => sanitizeChatMessage(chat, base)).filter(Boolean);

  const escalationRecords = orderInstance?.get?.('escalations') ?? order.escalations ?? [];
  const escalations = escalationRecords.map((record) => sanitizeEscalation(record)).filter(Boolean);

  const scorecard = sanitizeScorecard(orderInstance?.get?.('scorecard') ?? order.scorecard);

  const outstandingRequirements = requirements.filter((item) => item?.status === 'pending').length;
  const activeRevisions = revisions.filter((item) => ['requested', 'in_progress', 'submitted'].includes(item?.status)).length;
  const nextRequirementDueAt =
    requirements
      .filter((requirement) => requirement?.status === 'pending' && requirement?.dueAt)
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())[0]?.dueAt ?? null;

  const escrowSnapshot = computeEscrowSnapshot(escrowCheckpoints);

  return {
    ...base,
    requirements,
    revisions,
    activities,
    messages,
    escrowCheckpoints,
    scorecard,
    timelineEvents,
    submissions,
    chatMessages,
    escalations,
    outstandingRequirements,
    activeRevisions,
    nextRequirementDueAt,
    escrowPendingAmount: Number(escrowSnapshot.pendingAmount.toFixed(2)),
    escrowReleasedAmount: Number(escrowSnapshot.releasedAmount.toFixed(2)),
    escrowHeldAmount: Number(escrowSnapshot.heldAmount.toFixed(2)),
    nextEscrowReleaseAt: escrowSnapshot.nextReleaseAt,
    isClosed: ['completed', 'cancelled'].includes(base.status),
    timeline: buildGigTimeline({
      ...base,
      requirements,
      revisions,
      activities,
      messages,
      escrowCheckpoints,
      timelineEvents,
    }),
  };
}

function normalizeAttachments(rawAttachments, { limit = 10 } = {}) {
  if (!Array.isArray(rawAttachments)) {
    return [];
  }
  return rawAttachments
    .map((item) => {
      if (!item) {
        return null;
      }
      const url = typeof item.url === 'string' ? item.url.trim() : null;
      if (!url) {
        return null;
      }
      const label = typeof item.label === 'string' ? item.label.trim() : null;
      const type = typeof item.type === 'string' ? item.type.trim() : null;
      return { url, label, type };
    })
    .filter(Boolean)
    .slice(0, limit);
}

function cleanString(value, { maxLength = 240 } = {}) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, maxLength);
}

function normalizeGigTags(rawTags, { limit = 12 } = {}) {
  if (!Array.isArray(rawTags)) {
    return [];
  }
  const tags = rawTags
    .map((tag) => cleanString(tag, { maxLength: 40 }))
    .filter(Boolean)
    .filter((tag, index, arr) => arr.indexOf(tag) === index)
    .slice(0, limit);
  return tags;
}

function normalizeGigClasses(rawClasses, { currency = 'USD' } = {}) {
  if (!Array.isArray(rawClasses)) {
    return [];
  }

  const classes = rawClasses
    .map((item, index) => {
      if (!item) {
        return null;
      }
      const name = cleanString(item.name, { maxLength: 80 }) ?? `Class ${index + 1}`;
      const summary = cleanString(item.summary, { maxLength: 260 });
      const priceAmount = ensureNumber(item.priceAmount ?? 0, {
        label: 'Gig class price',
        allowNegative: false,
      });
      if (priceAmount <= 0) {
        throw new ValidationError('Gig class price must be greater than zero.');
      }
      const deliveryDays = item.deliveryDays != null ? ensureNumber(item.deliveryDays, {
        label: 'Gig class delivery days',
        allowNegative: false,
        allowZero: false,
      }) : null;
      const inclusions = Array.isArray(item.inclusions)
        ? item.inclusions
            .map((inclusion) => cleanString(inclusion, { maxLength: 120 }))
            .filter(Boolean)
            .slice(0, 8)
        : [];

      return {
        key: cleanString(item.key, { maxLength: 60 }) ?? `class-${index + 1}`,
        name,
        summary,
        priceAmount,
        priceCurrency: item.priceCurrency ? cleanString(item.priceCurrency, { maxLength: 6 }) ?? currency : currency,
        deliveryDays,
        inclusions,
      };
    })
    .filter(Boolean)
    .slice(0, 6);

  if (classes.length < 3) {
    throw new ValidationError('Provide at least three gig classes before publishing.');
  }

  return classes;
}

function normalizeGigAddons(rawAddons, { currency = 'USD' } = {}) {
  if (!Array.isArray(rawAddons)) {
    return [];
  }

  return rawAddons
    .map((addon, index) => {
      if (!addon) {
        return null;
      }
      const name = cleanString(addon.name, { maxLength: 120 });
      if (!name) {
        return null;
      }
      const priceAmount = ensureNumber(addon.priceAmount ?? 0, {
        label: 'Addon price',
        allowNegative: false,
      });
      if (priceAmount <= 0) {
        throw new ValidationError('Addon price must be greater than zero.');
      }
      const deliveryDays = addon.deliveryDays != null ? ensureNumber(addon.deliveryDays, {
        label: 'Addon delivery days',
        allowNegative: false,
        allowZero: false,
      }) : null;
      return {
        key: cleanString(addon.key, { maxLength: 60 }) ?? `addon-${index + 1}`,
        name,
        description: cleanString(addon.description, { maxLength: 260 }),
        priceAmount,
        priceCurrency: addon.priceCurrency ? cleanString(addon.priceCurrency, { maxLength: 6 }) ?? currency : currency,
        deliveryDays,
        isPopular: Boolean(addon.isPopular),
      };
    })
    .filter(Boolean)
    .slice(0, 10);
}

const ALLOWED_MEDIA_TYPES = new Set(['image', 'video']);

function normalizeGigMedia(rawMedia) {
  if (!Array.isArray(rawMedia)) {
    return [];
  }

  return rawMedia
    .map((item, index) => {
      if (!item) {
        return null;
      }
      const type = cleanString(item.type, { maxLength: 20 }) ?? 'image';
      if (!ALLOWED_MEDIA_TYPES.has(type)) {
        throw new ValidationError('Media type must be image or video.');
      }
      const url = cleanString(item.url, { maxLength: 500 });
      if (!url || !/^https?:\/\//i.test(url)) {
        throw new ValidationError('Media items require a valid URL.');
      }
      return {
        key: cleanString(item.key, { maxLength: 60 }) ?? `media-${index + 1}`,
        type,
        url,
        thumbnailUrl: cleanString(item.thumbnailUrl, { maxLength: 500 }) ?? null,
        caption: cleanString(item.caption, { maxLength: 140 }),
      };
    })
    .filter(Boolean)
    .slice(0, 12);
}

function normalizeGigFaqs(rawFaqs) {
  if (!Array.isArray(rawFaqs)) {
    return [];
  }

  return rawFaqs
    .map((item, index) => {
      if (!item) {
        return null;
      }
      const question = cleanString(item.question, { maxLength: 200 });
      const answer = cleanString(item.answer, { maxLength: 600 });
      if (!question || !answer) {
        return null;
      }
      return {
        key: cleanString(item.key, { maxLength: 60 }) ?? `faq-${index + 1}`,
        question,
        answer,
      };
    })
    .filter(Boolean)
    .slice(0, 12);
}

function buildGigMetadata(payload, currency) {
  const classes = normalizeGigClasses(payload.classes ?? payload.gigClasses ?? [], { currency });
  const addons = normalizeGigAddons(payload.addons ?? payload.gigAddons ?? [], { currency });
  const tags = normalizeGigTags(payload.tags ?? payload.gigTags ?? []);
  const media = normalizeGigMedia(payload.media ?? payload.gigMedia ?? []);
  const faqs = normalizeGigFaqs(payload.faqs ?? payload.gigFaqs ?? []);

  return {
    ...(payload.metadata ?? {}),
    currency,
    classes,
    addons,
    tags,
    media,
    faqs,
  };
}

function sanitizeGigMetadata(metadata = {}) {
  const currency = metadata.currency ?? 'USD';
  let classes = [];
  try {
    classes = normalizeGigClasses(metadata.classes ?? [], { currency });
  } catch (error) {
    classes = Array.isArray(metadata.classes) ? metadata.classes : [];
  }

  let addons = [];
  try {
    addons = normalizeGigAddons(metadata.addons ?? [], { currency });
  } catch (error) {
    addons = Array.isArray(metadata.addons) ? metadata.addons : [];
  }

  let tags = [];
  try {
    tags = normalizeGigTags(metadata.tags ?? []);
  } catch (error) {
    tags = Array.isArray(metadata.tags) ? metadata.tags : [];
  }

  let media = [];
  try {
    media = normalizeGigMedia(metadata.media ?? []);
  } catch (error) {
    media = Array.isArray(metadata.media) ? metadata.media : [];
  }

  let faqs = [];
  try {
    faqs = normalizeGigFaqs(metadata.faqs ?? []);
  } catch (error) {
    faqs = Array.isArray(metadata.faqs) ? metadata.faqs : [];
  }

  return {
    ...metadata,
    classes,
    addons,
    tags,
    media,
    faqs,
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

function sanitizeTimelineEvent(eventInstance, order) {
  const event = eventInstance?.get ? eventInstance.get({ plain: true }) : { ...eventInstance };
  return {
    ...event,
    orderId: order.id,
    orderNumber: order.orderNumber,
    serviceName: order.serviceName,
  };
}

function sanitizeSubmission(submissionInstance, order) {
  const submission = submissionInstance?.get ? submissionInstance.get({ plain: true }) : { ...submissionInstance };
  submission.assets = (submission.assets ?? []).map((asset) => (asset?.get ? asset.get({ plain: true }) : asset));
  return {
    ...submission,
    orderId: order.id,
    orderNumber: order.orderNumber,
    serviceName: order.serviceName,
  };
}

function sanitizeChatMessage(messageInstance, order) {
  const message = messageInstance?.get ? messageInstance.get({ plain: true }) : { ...messageInstance };
  return {
    ...message,
    orderId: order.id,
    orderNumber: order.orderNumber,
    serviceName: order.serviceName,
  };
}

function sanitizeOrder(orderInstance) {
  const order = orderInstance.get({ plain: true });
  const requirements = Array.isArray(order.requirements) ? order.requirements : [];
  const outstandingRequirements = requirements.filter((requirement) => requirement.status !== 'approved');
  const nextRequirementDueAt = outstandingRequirements
    .map((requirement) => requirement.dueAt)
    .filter(Boolean)
    .map((due) => new Date(due).getTime())
    .sort((a, b) => a - b)[0];

  const revisions = Array.isArray(order.revisions) ? order.revisions : [];
  const timelineEvents = Array.isArray(order.timelineEvents) ? order.timelineEvents : [];
  const submissions = Array.isArray(order.submissions) ? order.submissions : [];
  const chatMessages = Array.isArray(order.chatMessages) ? order.chatMessages : [];

  return {
    ...order,
    gig: order.gig ?? { title: order.serviceName },
    outstandingRequirements: outstandingRequirements.length,
    nextRequirementDueAt: nextRequirementDueAt ? new Date(nextRequirementDueAt).toISOString() : null,
    activeRevisions: revisions.filter((revision) => revision.status !== 'approved').length,
    timelineEvents: timelineEvents.map((event) => sanitizeTimelineEvent(event, order)),
    submissions: submissions.map((submission) => sanitizeSubmission(submission, order)),
    chatMessages: chatMessages.map((message) => sanitizeChatMessage(message, order)),
    scorecard: order.scorecard?.get ? order.scorecard.get({ plain: true }) : order.scorecard ?? null,
  };
}

function buildGigOrderBuckets(orders) {
  const openStatuses = new Set(['requirements', 'in_delivery', 'in_revision']);
  const open = [];
  const closed = [];

  orders.forEach((order) => {
    if (openStatuses.has(order.status)) {
      open.push(order);
    } else {
      closed.push(order);
    }
  });

  return {
    open,
    closed,
    stats: {
      openCount: open.length,
      closedCount: closed.length,
      openValue: open.reduce((sum, order) => sum + normalizeNumber(order.amount), 0),
      closedValue: closed.reduce((sum, order) => sum + normalizeNumber(order.amount), 0),
    },
  };
}

function buildTimelineSummary(orders) {
  const now = Date.now();
  const events = orders.flatMap((order) =>
    order.timelineEvents.map((event) => {
      const scheduledAtTime = event.scheduledAt ? new Date(event.scheduledAt).getTime() : null;
      const overdue = scheduledAtTime != null && scheduledAtTime < now && !['completed', 'cancelled'].includes(event.status);
      return { ...event, orderId: order.id, overdue };
    }),
  );

  const upcoming = events
    .filter((event) => !['completed', 'cancelled'].includes(event.status))
    .sort((a, b) => new Date(a.scheduledAt ?? 0).getTime() - new Date(b.scheduledAt ?? 0).getTime());

  const recent = events
    .filter((event) => event.status === 'completed')
    .sort((a, b) => new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime());

  return {
    events,
    upcoming: upcoming.slice(0, 8),
    recent: recent.slice(0, 8),
    stats: {
      total: events.length,
      upcoming: upcoming.length,
      overdue: upcoming.filter((event) => event.scheduledAt && new Date(event.scheduledAt).getTime() < now).length,
      completed: recent.length,
    },
  };
}

function buildSubmissionSummary(orders) {
  const submissions = orders.flatMap((order) => order.submissions.map((submission) => ({ ...submission, orderId: order.id })));
  const pendingStatuses = new Set(['draft', 'submitted', 'needs_changes']);

  const pending = submissions
    .filter((submission) => pendingStatuses.has(submission.status))
    .sort((a, b) => new Date(a.submittedAt ?? a.createdAt ?? 0) - new Date(b.submittedAt ?? b.createdAt ?? 0));

  const recent = submissions
    .slice()
    .sort((a, b) => new Date(b.submittedAt ?? b.reviewedAt ?? 0) - new Date(a.submittedAt ?? a.reviewedAt ?? 0));

  return {
    submissions,
    pending: pending.slice(0, 8),
    recent: recent.slice(0, 8),
    stats: {
      total: submissions.length,
      pending: pending.length,
      approved: submissions.filter((submission) => submission.status === 'approved').length,
      rejected: submissions.filter((submission) => submission.status === 'rejected').length,
    },
  };
}

function buildChatSummary(orders) {
  const messages = orders.flatMap((order) => order.chatMessages.map((message) => ({ ...message, orderId: order.id })));
  const sortedMessages = messages
    .slice()
    .sort((a, b) => new Date(b.sentAt ?? 0).getTime() - new Date(a.sentAt ?? 0).getTime());

  const participants = new Map();
  sortedMessages.forEach((message) => {
    if (!message.authorName) return;
    if (!participants.has(message.authorName)) {
      participants.set(message.authorName, {
        name: message.authorName,
        role: message.authorRole ?? 'collaborator',
        messages: 0,
      });
    }
    participants.get(message.authorName).messages += 1;
  });

  return {
    recent: sortedMessages.slice(0, 25),
    totals: {
      messages: sortedMessages.length,
      ordersWithChat: orders.filter((order) => order.chatMessages.length > 0).length,
    },
    participants: Array.from(participants.values()).sort((a, b) => b.messages - a.messages),
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
  if (initialized) {
    return;
  }
  await projectGigManagementSequelize.authenticate();
  initialized = true;
}

export async function getProjectGigManagementOverview(ownerId) {
  await ensureInitialized();

  const [
    projectRecords,
    templateRecords,
    orderRecords,
    storyBlockRecords,
    brandAssetRecords,
    bidRecords,
    invitationRecords,
    matchRecords,
    reviewRecords,
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
        {
          model: GigOrderEscalation,
          as: 'escalations',
          separate: true,
          order: [
            ['detectedAt', 'DESC'],
            ['createdAt', 'DESC'],
          ],
        },
        {
          model: GigTimelineEvent,
          as: 'timelineEvents',
          separate: true,
          order: [
            ['scheduledAt', 'ASC'],
            ['createdAt', 'ASC'],
          ],
        },
        {
          model: GigSubmission,
          as: 'submissions',
          separate: true,
          include: [{ model: GigSubmissionAsset, as: 'assets' }],
          order: [
            ['submittedAt', 'DESC'],
            ['createdAt', 'DESC'],
          ],
        },
        {
          model: GigChatMessage,
          as: 'chatMessages',
          separate: true,
          order: [['sentAt', 'DESC']],
          limit: 100,
        },
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

  const sanitizedProjects = projectRecords.map((project) => sanitizeProject(project));
  const templates = templateRecords.map((template) => template.get({ plain: true }));
  const sanitizedOrders = orderRecords.map((order) => sanitizeGigOrder(order));
  const storyBlocks = storyBlockRecords.map((block) => block.get({ plain: true }));
  const brandAssets = brandAssetRecords.map((asset) => asset.get({ plain: true }));

  const assets = sanitizedProjects.flatMap((project) => project.assets ?? []);
  const assetSummary = summarizeAssets(assets);

  const board = {
    lanes: buildBoardLanes(sanitizedProjects),
    metrics: buildBoardMetrics(sanitizedProjects),
    integrations: PROJECT_STATUSES.map((status) => ({
      status,
      integrations: sanitizedProjects
        .filter((project) => (project.workspace?.status ?? project.status) === status)
        .flatMap((project) => (project.integrations ?? []).map((integration) => integration.provider)),
    })),
    retrospectives: sanitizedProjects
      .flatMap((project) =>
        (project.retrospectives ?? []).map((retro) => ({
          ...retro,
          projectId: project.id,
          projectTitle: project.title,
        })),
      )
      .slice(0, 6),
  };

  const orderBuckets = buildGigOrderBuckets(sanitizedOrders);
  const vendorStats = buildVendorStats(sanitizedOrders);
  const reminders = buildGigReminders(sanitizedOrders);
  const storytelling = {
    ...buildStorytelling(sanitizedProjects, sanitizedOrders, storyBlocks),
    storyBlocks,
  };
  const lifecycleStats = buildLifecycleStats(sanitizedProjects);
  const lifecyclePartition = partitionProjects(sanitizedProjects);
  const timelineSummary = buildTimelineSummary(sanitizedOrders);
  const submissionSummary = buildSubmissionSummary(sanitizedOrders);
  const chatSummary = buildChatSummary(sanitizedOrders);
  const lifecycleSnapshot = buildProjectLifecycleSnapshot(sanitizedProjects);

  const bidEntries = bidRecords.map((bid) => {
    const plain = bid.get({ plain: true });
    return { ...plain, amount: normalizeCurrency(plain.amount) };
  });

  const invitationEntries = invitationRecords.map((invite) => invite.get({ plain: true }));

  const autoMatchEntries = matchRecords.map((match) => {
    const plain = match.get({ plain: true });
    return { ...plain, matchScore: normalizeCurrency(plain.matchScore) ?? 0 };
  });

  const reviewEntries = reviewRecords.map((review) => {
    const plain = review.get({ plain: true });
    return {
      ...plain,
      ratingOverall: normalizeCurrency(plain.ratingOverall) ?? 0,
      ratingQuality: normalizeCurrency(plain.ratingQuality),
      ratingCommunication: normalizeCurrency(plain.ratingCommunication),
      ratingProfessionalism: normalizeCurrency(plain.ratingProfessionalism),
    };
  });

  const scorecards = sanitizedOrders
    .map((order) =>
      order.scorecard
        ? {
            ...order.scorecard,
            orderNumber: order.orderNumber,
            vendorName: order.vendorName,
            reviewedAt: order.scorecard.updatedAt ?? order.scorecard.createdAt ?? null,
            riskLevel: order.metadata?.riskLevel ?? order.scorecard.riskLevel ?? 'standard',
          }
        : null,
    )
    .filter(Boolean);

  const autoMatchSettingsPlain = autoMatchSettings.get({ plain: true });
  const autoMatchSummary = buildAutoMatchSummary(autoMatchEntries);
  const escrowAccountPlain = escrowAccount.get({ plain: true });
  const escrowTransactionEntries = escrowTransactions.map((transaction) => {
    const plain = transaction.get({ plain: true });
    return { ...plain, amount: normalizeCurrency(plain.amount) ?? 0 };
  });

  const summary = {
    totalProjects: sanitizedProjects.length,
    activeProjects: lifecycleStats.openCount,
    budgetInPlay: sanitizedProjects.reduce(
      (acc, project) => acc + normalizeNumber(project.budget?.allocated ?? project.budgetAllocated),
      0,
    ),
    gigsInDelivery: sanitizedOrders.filter((order) => !order.isClosed).length,
    templatesAvailable: templates.length,
    assetsSecured: brandAssets.length,
    storiesReady: storytelling.achievements.length,
    vendorSatisfaction: vendorStats.averages.overall ?? null,
    currency: sanitizedOrders.find((order) => order.currency)?.currency ?? 'USD',
    openGigValue: orderBuckets.stats.openValue,
    closedGigValue: orderBuckets.stats.closedValue,
  };

  return {
    summary,
    meta: { lastUpdated: new Date().toISOString(), fromCache: false },
    projects: sanitizedProjects,
    templates,
    projectCreation: { projects: sanitizedProjects, templates },
    projectLifecycle: {
      open: lifecyclePartition.open,
      closed: lifecyclePartition.closed,
      stats: lifecycleStats,
      snapshot: lifecycleSnapshot,
    },
    projectBids: { bids: bidEntries, stats: buildBidStats(bidEntries) },
    invitations: { entries: invitationEntries, stats: buildInvitationStats(invitationEntries) },
    autoMatch: {
      settings: autoMatchSettingsPlain,
      matches: autoMatchEntries,
      summary: autoMatchSummary,
      readyCount: autoMatchSummary.readyCount,
      readyRatio: autoMatchSummary.readyRatio,
    },
    reviews: { entries: reviewEntries, summary: buildReviewSummary(reviewEntries) },
    assets: { items: assets, summary: assetSummary, brandAssets },
    board,
    managementBoard: board,
    purchasedGigs: {
      orders: sanitizedOrders,
      reminders,
      stats: vendorStats,
      buckets: orderBuckets.stats,
      timeline: timelineSummary,
      submissions: submissionSummary,
      chat: chatSummary,
      scorecards,
    },
    storytelling,
    escrow: {
      account: {
        ...escrowAccountPlain,
        balance: normalizeCurrency(escrowAccountPlain.balance) ?? 0,
      },
      transactions: escrowTransactionEntries,
    },
    projectLifecycleSnapshot: lifecycleSnapshot,
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
    meta,
    projects: sanitizedProjects,
    templates,
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

  if (payload.workspace?.riskLevel && !WORKSPACE_RISK_LEVELS.includes(payload.workspace.riskLevel)) {
    throw new ValidationError('Invalid project risk level provided.');
  }

  if (payload.workspace?.status && !WORKSPACE_STATUSES.includes(payload.workspace.status)) {
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

    const workspaceStatus = payload.workspace?.status && WORKSPACE_STATUSES.includes(payload.workspace.status)
      ? payload.workspace.status
      : resolveWorkspaceStatusFromProject(payload.status ?? project.status);
    const progressPercent =
      normaliseWorkspaceScore(payload.workspace?.progressPercent ?? 5, {
        label: 'Workspace progress percent',
        max: 100,
      }) ?? 0;
    const healthScore = normaliseWorkspaceScore(payload.workspace?.healthScore, {
      label: 'Workspace health score',
      max: 100,
    });
    const velocityScore = normaliseWorkspaceScore(payload.workspace?.velocityScore, {
      label: 'Workspace velocity score',
      max: 100,
    });
    const clientSatisfaction = normaliseWorkspaceScore(payload.workspace?.clientSatisfaction, {
      label: 'Workspace client satisfaction',
      max: 5,
    });
    const automationCoverage = normaliseWorkspaceScore(payload.workspace?.automationCoverage, {
      label: 'Workspace automation coverage',
      max: 100,
    });

    const nextMilestoneDueAt = ensureDate(payload.workspace?.nextMilestoneDueAt ?? payload.dueDate, {
      label: 'Next milestone due date',
    });
    const lastActivityAt =
      ensureDate(payload.workspace?.lastActivityAt, { label: 'Workspace last activity at' }) ??
      project.updatedAt ??
      project.createdAt ??
      new Date();

    const metricsSnapshot =
      payload.workspace?.metricsSnapshot && typeof payload.workspace.metricsSnapshot === 'object'
        ? payload.workspace.metricsSnapshot
        : payload.workspace?.metrics && typeof payload.workspace.metrics === 'object'
          ? payload.workspace.metrics
          : {};

    await ProjectWorkspace.create(
      {
        projectId: project.id,
        status: workspaceStatus,
        progressPercent,
        riskLevel:
          payload.workspace?.riskLevel && WORKSPACE_RISK_LEVELS.includes(payload.workspace.riskLevel)
            ? payload.workspace.riskLevel
            : 'low',
        healthScore,
        velocityScore,
        clientSatisfaction,
        automationCoverage,
        billingStatus: payload.workspace?.billingStatus ?? null,
        nextMilestone: payload.workspace?.nextMilestone ?? null,
        nextMilestoneDueAt,
        lastActivityAt,
        updatedById: payload.workspace?.updatedById ?? null,
        notes: payload.workspace?.notes ?? null,
        metricsSnapshot,
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
    metricsSnapshot: payload.metricsSnapshot ?? project.workspace.metricsSnapshot,
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
      metricsSnapshot: payload.workspace?.metricsSnapshot ?? project.workspace.metricsSnapshot,
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
      metricsSnapshot: payload.workspace?.metricsSnapshot ?? project.workspace.metricsSnapshot,
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

  const currency = payload.currency ?? 'USD';
  const metadata = buildGigMetadata(payload, currency);

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
        currency,
        kickoffAt,
        dueAt,
        metadata,
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

    await order.reload({ transaction });
    return sanitizeGigOrder(order, { includeAssociations: false });
  });
}

export async function addGigTimelineEvent(ownerId, orderId, payload) {
  const event = await createGigTimelineEvent(ownerId, orderId, {
    eventType: payload.type ?? payload.eventType ?? 'note',
    title: payload.title,
    summary: payload.notes ?? payload.summary ?? null,
    occurredAt: payload.scheduledAt ?? payload.completedAt ?? payload.occurredAt ?? null,
    visibility: payload.visibility ?? 'internal',
    metadata: {
      ...(payload.metadata ?? {}),
      assignedTo: payload.assignedTo ?? undefined,
      status: payload.status ?? undefined,
    },
  });
  return event;
}

export async function updateGigTimelineEvent(ownerId, orderId, eventId, payload) {
  await ensureInitialized();
  const order = await GigOrder.findByPk(orderId);
  assertOwnership(order, ownerId, 'Gig order not found');

  const event = await GigTimelineEvent.findByPk(eventId);
  if (!event || event.orderId !== order.id) {
    throw new NotFoundError('Timeline event not found');
  }

  const updates = {};

  if (payload.title != null) {
    const title = payload.title?.toString().trim();
    if (!title) {
      throw new ValidationError('Timeline event title cannot be empty.');
    }
    updates.title = title;
  }

  const eventType = payload.eventType ?? payload.type;
  if (eventType != null) {
    const normalized = eventType.toString().trim().toLowerCase();
    if (!GIG_TIMELINE_EVENT_TYPES.includes(normalized)) {
      throw new ValidationError('Invalid timeline event type provided.');
    }
    updates.eventType = normalized;
  }

  const visibility = payload.visibility;
  if (visibility != null) {
    const normalized = visibility.toString().trim().toLowerCase();
    if (!GIG_TIMELINE_VISIBILITIES.includes(normalized)) {
      throw new ValidationError('Timeline visibility must be internal, client, or vendor.');
    }
    updates.visibility = normalized;
  }

  if (payload.summary != null || payload.notes != null) {
    const summary = payload.summary ?? payload.notes;
    updates.summary = summary == null ? null : summary.toString().trim() || null;
  }

  if (payload.occurredAt != null || payload.scheduledAt != null || payload.completedAt != null) {
    const occurredAt = ensureDate(payload.occurredAt ?? payload.scheduledAt ?? payload.completedAt, {
      label: 'Event time',
    });
    updates.occurredAt = occurredAt ?? new Date();
  }

  if (payload.metadata != null || payload.assignedTo != null || payload.status != null) {
    updates.metadata = {
      ...(event.metadata ?? {}),
      ...(payload.metadata ?? {}),
    };
    if (payload.assignedTo !== undefined) {
      updates.metadata.assignedTo = payload.assignedTo;
    }
    if (payload.status !== undefined) {
      updates.metadata.status = payload.status;
    }
  }

  if (Object.keys(updates).length === 0) {
    return sanitizeTimelineEvent(event, order);
  }

  await event.update(updates);
  const refreshed = await event.reload();
  return sanitizeTimelineEvent(refreshed, order);
}

export async function addGigSubmission(ownerId, orderId, payload) {
  return createGigSubmission(ownerId, orderId, payload, {});
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

  const currentMetadata = order.metadata && typeof order.metadata === 'object' ? { ...order.metadata } : {};
  const nextMetadata =
    payload.metadata === null
      ? null
      : payload.metadata
      ? { ...currentMetadata, ...payload.metadata }
      : currentMetadata;
  const currency = payload.currency ?? order.currency;
  let nextMetadata = order.metadata ?? {};
  if (
    payload.classes ||
    payload.gigClasses ||
    payload.addons ||
    payload.gigAddons ||
    payload.tags ||
    payload.gigTags ||
    payload.media ||
    payload.gigMedia ||
    payload.faqs ||
    payload.gigFaqs
  ) {
    nextMetadata = buildGigMetadata(
      {
        ...payload,
        metadata: { ...order.metadata, ...(payload.metadata ?? {}) },
        classes: payload.classes ?? payload.gigClasses ?? order.metadata?.classes ?? [],
        addons: payload.addons ?? payload.gigAddons ?? order.metadata?.addons ?? [],
        tags: payload.tags ?? payload.gigTags ?? order.metadata?.tags ?? [],
        media: payload.media ?? payload.gigMedia ?? order.metadata?.media ?? [],
        faqs: payload.faqs ?? payload.gigFaqs ?? order.metadata?.faqs ?? [],
      },
      currency,
    );
  } else if (payload.metadata) {
    nextMetadata = { ...order.metadata, ...payload.metadata };
  }

  await order.update({
    status: payload.status ?? order.status,
    progressPercent:
      payload.progressPercent != null ? Number(payload.progressPercent) : order.progressPercent,
    dueAt: dueAt ?? order.dueAt,
    metadata: nextMetadata,
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

  if (Array.isArray(payload.requirements)) {
    const existingRequirements = new Map(
      (order.requirements ?? []).map((requirement) => [Number(requirement.id), requirement]),
    );

    await Promise.all(
      payload.requirements.map(async (requirementPayload) => {
        if (!requirementPayload) return;
        const requirementId = requirementPayload.id != null ? Number(requirementPayload.id) : null;
        const normalizedStatus = requirementPayload.status ?? existingRequirements.get(requirementId)?.status ?? 'pending';

        if (!GIG_REQUIREMENT_STATUSES.includes(normalizedStatus)) {
          throw new ValidationError('Invalid requirement status provided.');
        }

        const updatePayload = {
          title: requirementPayload.title?.trim() || existingRequirements.get(requirementId)?.title,
          status: normalizedStatus,
          dueAt: ensureDate(requirementPayload.dueAt, { label: 'Requirement due date' }) ?? null,
          notes: requirementPayload.notes ?? existingRequirements.get(requirementId)?.notes ?? null,
        };

        if (requirementId && existingRequirements.has(requirementId)) {
          await existingRequirements.get(requirementId).update(updatePayload);
        } else if (updatePayload.title) {
          await GigOrderRequirement.create({
            orderId: order.id,
            ...updatePayload,
          });
        }
      }),
    );
  }

  if (Array.isArray(payload.removeRequirementIds) && payload.removeRequirementIds.length) {
    const removableIds = payload.removeRequirementIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && order.requirements.some((req) => req.id === id));
    if (removableIds.length) {
      await GigOrderRequirement.destroy({ where: { id: removableIds } });
    }
  }

  return order.reload({
    include: [
      { model: GigOrderRequirement, as: 'requirements' },
      { model: GigOrderRevision, as: 'revisions' },
      { model: GigVendorScorecard, as: 'scorecard' },
    ],
  });
  await order.reload();
  return sanitizeGigOrder(order);
}

export async function getGigOrderDetail(ownerId, orderId, { messageLimit = 50 } = {}) {
  await ensureInitialized();
  const order = await GigOrder.findByPk(orderId, {
    include: [
      { model: GigOrderRequirement, as: 'requirements', separate: true, order: [['createdAt', 'ASC']] },
      { model: GigOrderRevision, as: 'revisions', separate: true, order: [['roundNumber', 'ASC']] },
      { model: GigVendorScorecard, as: 'scorecard' },
      {
        model: GigTimelineEvent,
        as: 'timeline',
        separate: true,
        order: [
          ['occurredAt', 'DESC'],
          ['createdAt', 'DESC'],
        ],
        limit: 120,
      },
      {
        model: GigSubmission,
        as: 'submissions',
        separate: true,
        order: [
          ['submittedAt', 'DESC'],
          ['createdAt', 'DESC'],
        ],
        limit: 120,
      },
      {
        model: GigChatMessage,
        as: 'messages',
        separate: true,
        order: [
          ['sentAt', 'DESC'],
          ['createdAt', 'DESC'],
        ],
        limit: Number.isFinite(messageLimit) && messageLimit > 0 ? Math.min(messageLimit, 200) : 50,
      },
      {
        model: GigOrderEscalation,
        as: 'escalations',
        separate: true,
        order: [
          ['detectedAt', 'DESC'],
          ['createdAt', 'DESC'],
        ],
      },
    ],
  });
  assertOwnership(order, ownerId, 'Gig order not found');
  return sanitizeGigOrder(order);
}

export async function createGigTimelineEvent(ownerId, orderId, payload, { actorId } = {}) {
  await ensureInitialized();
  const order = await GigOrder.findByPk(orderId);
  assertOwnership(order, ownerId, 'Gig order not found');

  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  if (!title) {
    throw new ValidationError('Timeline events must include a title.');
  }
  const eventType = typeof payload.eventType === 'string' ? payload.eventType.trim().toLowerCase() : '';
  if (!GIG_TIMELINE_EVENT_TYPES.includes(eventType)) {
    throw new ValidationError('Choose a valid event type for the timeline entry.');
  }
  const visibility = typeof payload.visibility === 'string' ? payload.visibility.trim().toLowerCase() : 'internal';
  if (!GIG_TIMELINE_VISIBILITIES.includes(visibility)) {
    throw new ValidationError('Timeline visibility must be internal, client, or vendor.');
  }
  const occurredAt = ensureDate(payload.occurredAt ?? new Date(), { label: 'Event time' }) ?? new Date();

  const event = await GigTimelineEvent.create({
    orderId: order.id,
    eventType,
    title,
    summary: typeof payload.summary === 'string' ? payload.summary.trim() || null : null,
    createdById: actorId ?? ownerId,
    visibility,
    occurredAt,
    metadata: payload.metadata ?? {},
  });

  return sanitizeTimelineEvent(event, order);
}

export async function createGigSubmission(ownerId, orderId, payload, { actorId } = {}) {
  await ensureInitialized();
  const order = await GigOrder.findByPk(orderId);
  assertOwnership(order, ownerId, 'Gig order not found');

  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  if (!title) {
    throw new ValidationError('Provide a submission title so the team can reference it.');
  }
  const status = typeof payload.status === 'string' ? payload.status.trim().toLowerCase() : 'submitted';
  if (!GIG_SUBMISSION_STATUSES.includes(status)) {
    throw new ValidationError('Submission status is not recognised.');
  }

  return projectGigManagementSequelize.transaction(async (transaction) => {
    const submission = await GigSubmission.create(
      {
        orderId: order.id,
        title,
        description: typeof payload.description === 'string' ? payload.description.trim() || null : null,
        status,
        assetUrl: typeof payload.assetUrl === 'string' ? payload.assetUrl.trim() || null : null,
        assetType: typeof payload.assetType === 'string' ? payload.assetType.trim() || null : null,
        attachments: normalizeAttachments(payload.attachments),
        submittedAt: ensureDate(payload.submittedAt ?? new Date(), { label: 'Submission time' }) ?? new Date(),
        approvedAt:
          status === 'approved'
            ? ensureDate(payload.approvedAt ?? new Date(), { label: 'Approval time' }) ?? new Date()
            : ensureDate(payload.approvedAt, { label: 'Approval time' }),
        submittedById: actorId ?? ownerId,
        submittedBy: payload.submittedBy ?? null,
        submittedByEmail: payload.submittedByEmail ?? null,
        reviewedById: payload.reviewedById ?? null,
        reviewNotes: payload.reviewNotes ?? null,
        metadata: payload.metadata ?? {},
      },
      { transaction },
    );

    if (Array.isArray(payload.assets) && payload.assets.length > 0) {
      const assets = payload.assets
        .filter((asset) => asset?.url)
        .map((asset) => ({
          submissionId: submission.id,
          label: asset.label ?? asset.url,
          url: asset.url,
          previewUrl: asset.previewUrl ?? null,
          sizeBytes: asset.sizeBytes ?? null,
          metadata: asset.metadata ?? {},
        }));
      if (assets.length) {
        await GigSubmissionAsset.bulkCreate(assets, { transaction });
      }
    }

    const reloaded = await GigSubmission.findByPk(submission.id, {
      include: [{ model: GigSubmissionAsset, as: 'assets' }],
      transaction,
    });

    return sanitizeSubmission(reloaded ?? submission, order);
  });
}

async function updateGigSubmissionInternal(ownerId, orderId, submissionId, payload, { actorId } = {}) {
  await ensureInitialized();
  const submission = await GigSubmission.findByPk(submissionId, {
    include: [{ model: GigSubmissionAsset, as: 'assets' }],
  });
  if (!submission || submission.orderId !== orderId) {
    throw new NotFoundError('Gig submission not found.');
  }
  const order = await GigOrder.findByPk(orderId);
  assertOwnership(order, ownerId, 'Gig order not found');

  const updates = {};
  if (payload.title != null) {
    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    if (!title) {
      throw new ValidationError('Submission title cannot be empty.');
    }
    updates.title = title;
  }
  if (payload.description != null) {
    updates.description = typeof payload.description === 'string' ? payload.description.trim() || null : null;
  }
  if (payload.notes != null) {
    updates.notes = typeof payload.notes === 'string' ? payload.notes.trim() || null : null;
  }
  if (payload.reviewNotes != null) {
    updates.reviewNotes = typeof payload.reviewNotes === 'string' ? payload.reviewNotes.trim() || null : null;
  }
  if (payload.status != null) {
    const status = typeof payload.status === 'string' ? payload.status.trim().toLowerCase() : '';
    if (!GIG_SUBMISSION_STATUSES.includes(status)) {
      throw new ValidationError('Submission status is not recognised.');
    }
    updates.status = status;
    if (status === 'approved') {
      updates.approvedAt = ensureDate(payload.approvedAt ?? new Date(), { label: 'Approval time' }) ?? new Date();
      updates.reviewedById = payload.reviewedById ?? actorId ?? ownerId;
    } else if (payload.approvedAt != null) {
      updates.approvedAt = ensureDate(payload.approvedAt, { label: 'Approval time' });
    }
  }
  if (payload.submittedAt != null) {
    updates.submittedAt = ensureDate(payload.submittedAt, { label: 'Submission time' });
  }
  if (payload.submittedBy != null) {
    updates.submittedBy = payload.submittedBy;
  }
  if (payload.submittedByEmail != null) {
    updates.submittedByEmail = payload.submittedByEmail;
  }
  if (payload.reviewedById != null) {
    updates.reviewedById = payload.reviewedById;
  }
  if (payload.assetUrl != null) {
    updates.assetUrl = typeof payload.assetUrl === 'string' ? payload.assetUrl.trim() || null : null;
  }
  if (payload.assetType != null) {
    updates.assetType = typeof payload.assetType === 'string' ? payload.assetType.trim() || null : null;
  }
  if (payload.attachments != null) {
    updates.attachments = normalizeAttachments(payload.attachments);
  }
  if (payload.metadata != null) {
    updates.metadata = payload.metadata;
  }

  return projectGigManagementSequelize.transaction(async (transaction) => {
    if (Object.keys(updates).length > 0) {
      await submission.update(updates, { transaction });
    }

    if (Array.isArray(payload.assets)) {
      await GigSubmissionAsset.destroy({ where: { submissionId: submission.id }, transaction });
      const replacement = payload.assets
        .filter((asset) => asset?.url)
        .map((asset) => ({
          submissionId: submission.id,
          label: asset.label ?? asset.url,
          url: asset.url,
          previewUrl: asset.previewUrl ?? null,
          sizeBytes: asset.sizeBytes ?? null,
          metadata: asset.metadata ?? {},
        }));
      if (replacement.length) {
        await GigSubmissionAsset.bulkCreate(replacement, { transaction });
      }
    } else if (Array.isArray(payload.appendAssets) && payload.appendAssets.length > 0) {
      const additional = payload.appendAssets
        .filter((asset) => asset?.url)
        .map((asset) => ({
          submissionId: submission.id,
          label: asset.label ?? asset.url,
          url: asset.url,
          previewUrl: asset.previewUrl ?? null,
          sizeBytes: asset.sizeBytes ?? null,
          metadata: asset.metadata ?? {},
        }));
      if (additional.length) {
        await GigSubmissionAsset.bulkCreate(additional, { transaction });
      }
    }

    const reloaded = await GigSubmission.findByPk(submission.id, {
      include: [{ model: GigSubmissionAsset, as: 'assets' }],
      transaction,
    });

    return sanitizeSubmission(reloaded ?? submission, order);
  });
}

export async function updateGigSubmission(ownerId, orderId, submissionId, payload, context = {}) {
  return updateGigSubmissionInternal(ownerId, orderId, submissionId, payload, context);
}

export async function postGigChatMessage(ownerId, orderId, payload, { actorId, actorRole } = {}) {
  await ensureInitialized();
  const order = await GigOrder.findByPk(orderId);
  assertOwnership(order, ownerId, 'Gig order not found');

  const body = typeof payload.body === 'string' ? payload.body.trim() : '';
  if (!body) {
    throw new ValidationError('Chat messages require content.');
  }
  const visibility = typeof payload.visibility === 'string' ? payload.visibility.trim().toLowerCase() : 'internal';
  if (!GIG_CHAT_VISIBILITIES.includes(visibility)) {
    throw new ValidationError('Chat visibility must be internal, client, or vendor.');
  }

  const message = await GigChatMessage.create({
    orderId: order.id,
    senderId: actorId ?? ownerId,
    senderRole:
      typeof payload.senderRole === 'string'
        ? payload.senderRole.trim().toLowerCase()
        : typeof actorRole === 'string'
        ? actorRole.trim().toLowerCase()
        : 'owner',
    body,
    attachments: normalizeAttachments(payload.attachments, { limit: 6 }),
    visibility,
    sentAt: ensureDate(payload.sentAt ?? new Date(), { label: 'Message time' }) ?? new Date(),
    metadata: payload.metadata ?? {},
  });

  return sanitizeChatMessage(message, order);
}

export async function acknowledgeGigChatMessage(ownerId, orderId, messageId, { actorId } = {}) {
  await ensureInitialized();
  const message = await GigChatMessage.findByPk(messageId);
  if (!message || message.orderId !== orderId) {
    throw new NotFoundError('Chat message not found.');
  }
  const order = await GigOrder.findByPk(orderId);
  assertOwnership(order, ownerId, 'Gig order not found');

  await message.update({
    acknowledgedAt: ensureDate(new Date(), { label: 'Acknowledged at' }) ?? new Date(),
    acknowledgedById: actorId ?? ownerId,
  });

  return sanitizeChatMessage(message, order);
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
  addGigTimelineEvent,
  updateGigTimelineEvent,
  addGigSubmission,
  updateGigSubmission,
  postGigChatMessage,
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
  addGigOrderActivity,
  createGigOrderMessage,
  createGigOrderEscrowCheckpoint,
  updateGigOrderEscrowCheckpoint,
  getGigOrderDetail,
  createGigTimelineEvent,
  createGigSubmission,
  updateGigSubmission,
  acknowledgeGigChatMessage,
};
