import { Op } from 'sequelize';
import {
  AutoAssignQueueEntry,
  EscrowTransaction,
  FreelancerAssignmentMetric,
  Gig,
  Job,
  Notification,
  Profile,
  ProfileEngagementJob,
  Project,
  ProjectAssignmentEvent,
  SupportCase,
  MessageThread,
} from '../models/index.js';
import profileService from './profileService.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { ValidationError } from '../utils/errors.js';

const CACHE_NAMESPACE = 'dashboard:freelancer';
const CACHE_TTL_SECONDS = 60;

const ACTIVE_PROJECT_STATUSES = new Set([
  'active',
  'in_progress',
  'delivery',
  'executing',
  'review',
  'planning',
]);

const COMPLETED_PROJECT_STATUSES = new Set(['completed', 'closed', 'archived']);

const OUTSTANDING_ESCROW_STATUSES = new Set(['initiated', 'funded', 'in_escrow', 'disputed']);

function normalizeFreelancerId(value) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('freelancerId must be a positive integer.');
  }
  return numeric;
}

function safeNumber(value, fallback = 0) {
  if (value == null) return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function sumNumbers(values) {
  return values.reduce((total, value) => total + safeNumber(value, 0), 0);
}

function average(values) {
  if (!values.length) return 0;
  return sumNumbers(values) / values.length;
}

function differenceInDays(from, to = new Date()) {
  if (!from) return null;
  const start = new Date(from);
  if (Number.isNaN(start.getTime())) {
    return null;
  }
  const end = new Date(to);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function buildTargetKey(type, id) {
  return `${type}:${id}`;
}

function toPlainTarget(instance) {
  if (!instance) return null;
  if (typeof instance.toPublicObject === 'function') {
    return instance.toPublicObject();
  }
  if (typeof instance.get === 'function') {
    return instance.get({ plain: true });
  }
  return { ...instance };
}

function sanitizeQueueEntry(entry, targetMap, index) {
  const base = entry.toPublicObject();
  const targetKey = buildTargetKey(base.targetType, base.targetId);
  const target = targetMap.get(targetKey) ?? null;
  const metadata = entry.metadata ?? {};
  const breakdown = metadata.breakdown ?? null;
  const expiresAt = base.expiresAt ?? metadata.expiresAt ?? null;
  let responseDueInHours = null;
  if (expiresAt) {
    const expires = new Date(expiresAt);
    if (!Number.isNaN(expires.getTime())) {
      responseDueInHours = Math.max(
        0,
        Math.round((expires.getTime() - Date.now()) / (1000 * 60 * 60)),
      );
    }
  }

  return {
    ...base,
    position: index + 1,
    target,
    projectName: metadata.projectName ?? target?.title ?? target?.name ?? null,
    breakdown: breakdown
      ? {
          fairness: breakdown.newFreelancerScore ?? breakdown.fairness ?? null,
          expertise: breakdown.expertiseMatch ?? breakdown.experienceScore ?? null,
          relationship: breakdown.relationshipScore ?? null,
        }
      : null,
    responseDueInHours,
  };
}

function sanitizeProject(project, queueEntries, transactions) {
  const plain = toPlainTarget(project);
  const relatedQueueEntries = queueEntries.filter(
    (entry) => entry.targetType === 'project' && entry.targetId === plain.id,
  );
  const relatedTransactions = transactions.filter(
    (txn) => txn.projectId === plain.id,
  );

  const assignments = {
    pending: relatedQueueEntries.filter((entry) => entry.status === 'pending').length,
    notified: relatedQueueEntries.filter((entry) => entry.status === 'notified').length,
    accepted: relatedQueueEntries.filter((entry) => entry.status === 'accepted').length,
    declined: relatedQueueEntries.filter((entry) => entry.status === 'declined').length,
  };

  const revenue = relatedTransactions
    .filter((txn) => txn.status === 'released')
    .reduce((total, txn) => total + safeNumber(txn.netAmount, txn.amount), 0);

  const outstanding = relatedTransactions
    .filter((txn) => OUTSTANDING_ESCROW_STATUSES.has(txn.status))
    .reduce((total, txn) => total + safeNumber(txn.netAmount, txn.amount), 0);

  return {
    id: plain.id,
    title: plain.title ?? `Project #${plain.id}`,
    status: plain.status ?? 'unspecified',
    budgetAmount: safeNumber(plain.budgetAmount, null),
    budgetCurrency: plain.budgetCurrency ?? 'USD',
    autoAssignEnabled: Boolean(plain.autoAssignEnabled),
    autoAssignStatus: plain.autoAssignStatus ?? null,
    assignments,
    revenue,
    outstanding,
    lastUpdatedAt: plain.updatedAt ?? null,
    description: plain.description ?? null,
  };
}

function sanitizeTransaction(transaction, targetMap) {
  const base = transaction.toPublicObject();
  const targetKey = base.projectId
    ? buildTargetKey('project', base.projectId)
    : base.gigId
    ? buildTargetKey('gig', base.gigId)
    : null;
  const target = targetKey ? targetMap.get(targetKey) ?? null : null;

  return {
    id: base.id,
    reference: base.reference,
    type: base.type,
    status: base.status,
    amount: safeNumber(base.amount, 0),
    netAmount: safeNumber(base.netAmount, base.amount),
    currency: base.currencyCode ?? 'USD',
    milestoneLabel: base.milestoneLabel ?? null,
    scheduledReleaseAt: base.scheduledReleaseAt ?? null,
    releasedAt: base.releasedAt ?? null,
    createdAt: base.createdAt ?? null,
    target,
  };
}

function sanitizeSupportCase(record) {
  if (!record) return null;
  const plain = record.get({ plain: true });
  const thread = plain.thread ?? null;
  return {
    id: plain.id,
    status: plain.status,
    priority: plain.priority,
    reason: plain.reason,
    escalatedAt: plain.escalatedAt,
    resolvedAt: plain.resolvedAt,
    assignedTo: plain.assignedTo,
    thread: thread
      ? {
          id: thread.id,
          subject: thread.subject,
          channelType: thread.channelType,
          lastMessageAt: thread.lastMessageAt,
        }
      : null,
  };
}

function sanitizeEngagementJob(job) {
  const plain = job.get({ plain: true });
  const metadata = plain.metadata ?? {};
  return {
    id: plain.id,
    status: plain.status,
    priority: plain.priority,
    scheduledAt: plain.scheduledAt,
    reason: plain.reason ?? metadata.reason ?? null,
    action: metadata.action ?? metadata.title ?? 'Review pipeline touchpoint',
    dueInDays: differenceInDays(plain.scheduledAt),
  };
}

function sanitizeProjectEvent(event, targetMap) {
  const base = event.toPublicObject();
  const project = event.get?.('project') ?? event.project;
  const target = project ? toPlainTarget(project) : null;
  const projectFromMap = target
    ? target
    : targetMap.get(buildTargetKey('project', base.projectId)) ?? null;

  return {
    ...base,
    project: projectFromMap,
  };
}

function compileSummary({ projects, queueEntries, transactions, assignmentMetric }) {
  const activeProjects = projects.filter((project) =>
    ACTIVE_PROJECT_STATUSES.has(project.status ?? ''),
  );
  const completedProjects = projects.filter((project) =>
    COMPLETED_PROJECT_STATUSES.has(project.status ?? ''),
  );

  const gigQueue = queueEntries.filter((entry) => entry.targetType === 'gig');
  const activeGigs = gigQueue.filter((entry) => entry.status === 'accepted');
  const pendingGigRequests = gigQueue.filter((entry) =>
    ['pending', 'notified'].includes(entry.status),
  );

  const queuePending = queueEntries.filter((entry) => entry.status === 'pending').length;
  const queueNotified = queueEntries.filter((entry) => entry.status === 'notified').length;
  const queueAccepted = queueEntries.filter((entry) => entry.status === 'accepted').length;

  const ledger = transactions.reduce(
    (accumulator, txn) => {
      const amount = safeNumber(txn.netAmount, txn.amount);
      if (txn.status === 'released') {
        accumulator.released += amount;
      }
      if (OUTSTANDING_ESCROW_STATUSES.has(txn.status)) {
        accumulator.outstanding += amount;
        if (txn.status === 'in_escrow') {
          accumulator.inEscrow += amount;
        }
      }
      return accumulator;
    },
    { released: 0, outstanding: 0, inEscrow: 0 },
  );

  const now = new Date();
  const monthToDate = transactions
    .filter((txn) => txn.status === 'released')
    .filter((txn) => differenceInDays(txn.releasedAt ?? txn.updatedAt ?? txn.createdAt, now) <= 31)
    .reduce((total, txn) => total + safeNumber(txn.netAmount, txn.amount), 0);

  const uniqueClientIds = new Set(
    transactions
      .filter((txn) => txn.status === 'released' || OUTSTANDING_ESCROW_STATUSES.has(txn.status))
      .map((txn) => txn.initiatedById ?? txn.counterpartyId)
      .filter((id) => Number.isInteger(id)),
  );

  const completionRate = assignmentMetric
    ? safeNumber(assignmentMetric.totalAssigned, 0) === 0
      ? null
      : Math.round(
          (safeNumber(assignmentMetric.totalCompleted, 0) /
            Math.max(1, safeNumber(assignmentMetric.totalAssigned, 0))) *
            1000,
        ) / 10
    : null;

  return {
    activeProjects: activeProjects.length,
    completedProjects: completedProjects.length,
    gigEngagements: activeGigs.length,
    gigRequests: pendingGigRequests.length,
    queuePending,
    queueNotified,
    queueAccepted,
    monthlyRevenue: monthToDate,
    currency: transactions[0]?.currencyCode ?? 'USD',
    outstandingPayouts: ledger.outstanding,
    inEscrow: ledger.inEscrow,
    released: ledger.released,
    activeClients: uniqueClientIds.size,
    rating: assignmentMetric?.rating == null ? null : safeNumber(assignmentMetric.rating, null),
    completionRate,
    lifetimeCompletedValue: assignmentMetric
      ? safeNumber(assignmentMetric.lifetimeCompletedValue, 0)
      : 0,
    avgAssignedValue: assignmentMetric
      ? safeNumber(assignmentMetric.avgAssignedValue, null)
      : null,
  };
}

function computeQueueFocus(queueEntries) {
  const actionable = queueEntries.find((entry) =>
    ['pending', 'notified'].includes(entry.status),
  );
  if (!actionable) {
    return null;
  }

  return {
    label: 'Respond to auto-assign invitation',
    description: actionable.projectName
      ? `Confirm interest for ${actionable.projectName}`
      : 'Review the opportunity and respond to the queue invite.',
    dueInHours: actionable.responseDueInHours,
  };
}

export async function getFreelancerDashboard(
  freelancerId,
  { bypassCache = false } = {},
) {
  const normalizedId = normalizeFreelancerId(freelancerId);
  const cacheKey = buildCacheKey(CACHE_NAMESPACE, { freelancerId: normalizedId });

  if (!bypassCache) {
    const cached = appCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const [profileOverview, assignmentMetric, profileRecord] = await Promise.all([
    profileService.getProfileOverview(normalizedId, { bypassCache }),
    FreelancerAssignmentMetric.findOne({ where: { freelancerId: normalizedId } }),
    Profile.findOne({ where: { userId: normalizedId }, attributes: ['id'] }),
  ]);

  const profileId = profileRecord?.id ?? null;

  const queueEntriesRaw = await AutoAssignQueueEntry.findAll({
    where: { freelancerId: normalizedId },
    order: [
      ['status', 'ASC'],
      ['priorityBucket', 'ASC'],
      ['score', 'DESC'],
      ['createdAt', 'ASC'],
    ],
    limit: 50,
  });

  const projectIds = new Set();
  const gigIds = new Set();
  const jobIds = new Set();

  queueEntriesRaw.forEach((entry) => {
    if (entry.targetType === 'project') {
      projectIds.add(entry.targetId);
    } else if (entry.targetType === 'gig') {
      gigIds.add(entry.targetId);
    } else if (entry.targetType === 'job') {
      jobIds.add(entry.targetId);
    }
  });

  const [projectEvents, transactionsRaw, supportCasesRaw, notificationsRaw, engagementJobsRaw] =
    await Promise.all([
      ProjectAssignmentEvent.findAll({
        where: { actorId: normalizedId },
        include: [{ model: Project, as: 'project' }],
        order: [['createdAt', 'DESC']],
        limit: 12,
      }),
      EscrowTransaction.findAll({
        where: {
          [Op.or]: [
            { counterpartyId: normalizedId },
            { initiatedById: normalizedId },
          ],
        },
        order: [['createdAt', 'DESC']],
        limit: 20,
      }),
      SupportCase.findAll({
        where: {
          [Op.or]: [
            { escalatedBy: normalizedId },
            { assignedTo: normalizedId },
            { assignedBy: normalizedId },
          ],
        },
        include: [{ model: MessageThread, as: 'thread' }],
        order: [['updatedAt', 'DESC']],
        limit: 8,
      }),
      Notification.findAll({
        where: { userId: normalizedId },
        order: [['createdAt', 'DESC']],
        limit: 8,
      }),
      profileId
        ? ProfileEngagementJob.findAll({
            where: { profileId },
            order: [
              ['status', 'ASC'],
              ['priority', 'ASC'],
              ['scheduledAt', 'ASC'],
            ],
            limit: 8,
          })
        : [],
    ]);

  projectEvents.forEach((event) => {
    projectIds.add(event.projectId);
  });

  transactionsRaw.forEach((txn) => {
    if (txn.projectId) {
      projectIds.add(txn.projectId);
    }
    if (txn.gigId) {
      gigIds.add(txn.gigId);
    }
  });

  const [projectsRaw, gigsRaw, jobsRaw] = await Promise.all([
    projectIds.size
      ? Project.findAll({ where: { id: { [Op.in]: Array.from(projectIds) } } })
      : [],
    gigIds.size
      ? Gig.findAll({ where: { id: { [Op.in]: Array.from(gigIds) } } })
      : [],
    jobIds.size ? Job.findAll({ where: { id: { [Op.in]: Array.from(jobIds) } } }) : [],
  ]);

  const targetMap = new Map();
  projectsRaw.forEach((project) => {
    targetMap.set(buildTargetKey('project', project.id), toPlainTarget(project));
  });
  gigsRaw.forEach((gig) => {
    targetMap.set(buildTargetKey('gig', gig.id), toPlainTarget(gig));
  });
  jobsRaw.forEach((job) => {
    targetMap.set(buildTargetKey('job', job.id), toPlainTarget(job));
  });

  const queueEntries = queueEntriesRaw.map((entry, index) =>
    sanitizeQueueEntry(entry, targetMap, index),
  );

  const transactions = transactionsRaw.map((txn) => txn.toPublicObject());

  const sanitizedTransactions = transactionsRaw.map((txn) =>
    sanitizeTransaction(txn, targetMap),
  );

  const projects = projectsRaw.map((project) =>
    sanitizeProject(project, queueEntries, transactions),
  );

  const timeline = projectEvents.map((event) => sanitizeProjectEvent(event, targetMap));

  const summary = compileSummary({
    projects,
    queueEntries,
    transactions,
    assignmentMetric: assignmentMetric?.toPublicObject?.() ?? assignmentMetric?.get?.({ plain: true }),
  });

  const supportCases = supportCasesRaw.map(sanitizeSupportCase).filter(Boolean);
  const engagementJobs = Array.isArray(engagementJobsRaw)
    ? engagementJobsRaw.map(sanitizeEngagementJob)
    : [];

  const notifications = notificationsRaw.map((notification) => {
    const base = notification.toPublicObject();
    return { ...base, isUnread: !base.readAt };
  });

  const queueMetrics = {
    counts: queueEntries.reduce(
      (accumulator, entry) => {
        accumulator[entry.status] = (accumulator[entry.status] ?? 0) + 1;
        return accumulator;
      },
      {},
    ),
    averageScore: queueEntries.length
      ? Math.round(average(queueEntries.map((entry) => safeNumber(entry.score, 0))) * 100) / 100
      : null,
    focus: computeQueueFocus(queueEntries),
  };

  const result = {
    profile: profileOverview,
    summary,
    metrics: assignmentMetric?.toPublicObject?.() ?? assignmentMetric?.get?.({ plain: true }) ?? null,
    queue: {
      entries: queueEntries,
      metrics: queueMetrics,
    },
    projects: {
      active: projects,
      timeline,
    },
    finances: {
      ledger: {
        released: summary.released,
        outstanding: summary.outstandingPayouts,
        inEscrow: summary.inEscrow,
        currency: summary.currency,
        lifetimeCompletedValue: summary.lifetimeCompletedValue,
        avgAssignedValue: summary.avgAssignedValue,
      },
      transactions: sanitizedTransactions,
    },
    support: {
      cases: supportCases,
      openCount: supportCases.filter((record) => record.status !== 'resolved' && record.status !== 'closed').length,
    },
    tasks: {
      engagements: engagementJobs,
      nextAction: queueMetrics.focus,
    },
    notifications: {
      recent: notifications,
    },
  };

  appCache.set(cacheKey, result, CACHE_TTL_SECONDS);
  return result;
}

export default {
  getFreelancerDashboard,
};

