import { Op } from 'sequelize';
import {
  sequelize,
  User,
  Project,
  FreelancerAssignmentMetric,
  AutoAssignQueueEntry,
  APPLICATION_TARGET_TYPES,
  AUTO_ASSIGN_STATUSES,
} from '../models/index.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';

const MS_IN_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_LIMIT = 25;
const DEFAULT_EXPIRES_MINUTES = 180;
const DEFAULT_BASE_RATING = 4.3;
const DEFAULT_COMPLETION_RATE = 0.82;
const DEFAULT_WEIGHTS = {
  recency: 0.25,
  rating: 0.2,
  completionRecency: 0.15,
  completionQuality: 0.2,
  earningsBalance: 0.1,
  inclusion: 0.1,
};

const WEIGHT_KEY_ALIASES = {
  lastAssignment: 'recency',
  recency: 'recency',
  rating: 'rating',
  lastCompletion: 'completionRecency',
  completionRecency: 'completionRecency',
  completionRate: 'completionQuality',
  quality: 'completionQuality',
  earningsBalance: 'earningsBalance',
  balance: 'earningsBalance',
  inclusion: 'inclusion',
  opportunity: 'inclusion',
};

function normalizeWeights(overrides = {}) {
  const weights = { ...DEFAULT_WEIGHTS };
  if (overrides && typeof overrides === 'object') {
    Object.entries(overrides).forEach(([rawKey, value]) => {
      const mappedKey = WEIGHT_KEY_ALIASES[rawKey] ?? rawKey;
      const numeric = Number(value);
      if (Object.prototype.hasOwnProperty.call(weights, mappedKey) && Number.isFinite(numeric) && numeric >= 0) {
        weights[mappedKey] = numeric;
      }
    });
  }

  const total = Object.values(weights).reduce((sum, weight) => sum + Number(weight || 0), 0);
  if (!total || Number.isNaN(total)) {
    return { ...DEFAULT_WEIGHTS };
  }

  return Object.fromEntries(
    Object.entries(weights).map(([key, weight]) => [key, Number(weight || 0) / total]),
  );
}

function clamp(value, min = 0, max = 1) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function safeNumber(value, fallback = 0) {
  if (value == null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function daysBetween(dateA, dateB) {
  if (!dateA || !dateB) return null;
  return Math.abs(new Date(dateA).getTime() - new Date(dateB).getTime()) / MS_IN_DAY;
}

function computeCompletionRate(totalCompleted, totalAssigned) {
  const assigned = safeNumber(totalAssigned, 0);
  if (assigned <= 0) {
    return DEFAULT_COMPLETION_RATE;
  }
  return clamp(safeNumber(totalCompleted, 0) / assigned, 0, 1);
}

function sanitizeUser(userInstance) {
  if (!userInstance) return null;
  const plain = userInstance.get({ plain: true });
  return {
    id: plain.id,
    firstName: plain.firstName,
    lastName: plain.lastName,
    email: plain.email,
    createdAt: plain.createdAt,
  };
}

function normalizeProjectValue(input) {
  if (input == null) return null;
  const value = Number(input);
  if (!Number.isFinite(value) || value < 0) {
    throw new ValidationError('projectValue must be a positive number when provided.');
  }
  return value;
}

export function scoreFreelancerForProject({
  metrics,
  projectValue,
  freelancerCreatedAt,
  now = new Date(),
  weightOverrides = {},
}) {
  const safeMetrics = metrics ?? {};
  const lastAssignedDays = daysBetween(safeMetrics.lastAssignedAt, now);
  const lastCompletedDays = daysBetween(safeMetrics.lastCompletedAt, now);
  const totalAssigned = safeNumber(safeMetrics.totalAssigned, 0);
  const totalCompleted = safeNumber(safeMetrics.totalCompleted, 0);
  const rating = safeNumber(safeMetrics.rating, DEFAULT_BASE_RATING);
  const avgAssignedValue = safeNumber(safeMetrics.avgAssignedValue, projectValue ?? 0);
  const completionRate =
    safeMetrics.completionRate != null
      ? clamp(Number(safeMetrics.completionRate), 0, 1)
      : computeCompletionRate(totalCompleted, totalAssigned);

  const recencyScore = lastAssignedDays == null ? 1 : clamp(lastAssignedDays / 30, 0, 1);
  const ratingScore = clamp(rating / 5, 0, 1);
  const completionRecencyScore =
    lastCompletedDays == null ? 0.65 : clamp(1 - lastCompletedDays / 90, 0, 1);
  const completionQualityScore = clamp(completionRate, 0, 1);

  const effectiveProjectValue = projectValue ?? avgAssignedValue;
  const baselineValue = avgAssignedValue || effectiveProjectValue || 0;
  let earningsBalanceScore = 0.7;
  if (effectiveProjectValue && baselineValue) {
    const ratio = clamp(effectiveProjectValue / baselineValue, 0.1, 10);
    earningsBalanceScore = clamp(Math.exp(-Math.abs(Math.log(ratio))), 0, 1);
  }

  const accountAgeDays = daysBetween(freelancerCreatedAt, now) ?? 0;
  const earlyCareerBoost = clamp((120 - accountAgeDays) / 120, 0, 1);
  const opportunitySpreadScore = clamp(1 - Math.min(totalAssigned, 12) / 12, 0, 1);
  const newFreelancerScore = totalAssigned === 0 ? 1 : (earlyCareerBoost * 0.6 + opportunitySpreadScore * 0.4);

  const weights = normalizeWeights(weightOverrides);

  const score =
    weights.recency * recencyScore +
    weights.rating * ratingScore +
    weights.completionRecency * completionRecencyScore +
    weights.completionQuality * completionQualityScore +
    weights.earningsBalance * earningsBalanceScore +
    weights.inclusion * newFreelancerScore;

  const normalizedScore = clamp(score, 0, 1);
  const priorityBucket = normalizedScore >= 0.75 ? 1 : normalizedScore >= 0.55 ? 2 : 3;

  return {
    score: Number(normalizedScore.toFixed(4)),
    priorityBucket,
    breakdown: {
      lastAssignmentDays: lastAssignedDays == null ? null : Number(lastAssignedDays.toFixed(2)),
      recencyScore: Number(recencyScore.toFixed(3)),
      rating: Number(rating.toFixed(2)),
      ratingScore: Number(ratingScore.toFixed(3)),
      lastCompletedDays,
      completionRecencyScore: Number(completionRecencyScore.toFixed(3)),
      completionRate: Number(completionQualityScore.toFixed(3)),
      earningsBalanceScore: Number(earningsBalanceScore.toFixed(3)),
      totalAssigned,
      totalCompleted,
      newFreelancerScore: Number(newFreelancerScore.toFixed(3)),
    },
  };
}

async function ensureMetricsForFreelancers(freelancers, { transaction }) {
  const missing = freelancers.filter((freelancer) => !freelancer.assignmentMetric);
  if (!missing.length) {
    return;
  }

  await FreelancerAssignmentMetric.bulkCreate(
    missing.map((freelancer) => ({
      freelancerId: freelancer.id,
      rating: DEFAULT_BASE_RATING,
      completionRate: DEFAULT_COMPLETION_RATE,
      avgAssignedValue: null,
    })),
    { transaction, ignoreDuplicates: true },
  );

  const created = await FreelancerAssignmentMetric.findAll({
    where: { freelancerId: missing.map((freelancer) => freelancer.id) },
    transaction,
  });
  const metricsByFreelancer = new Map(created.map((metric) => [metric.freelancerId, metric]));
  missing.forEach((freelancer) => {
    const metric = metricsByFreelancer.get(freelancer.id);
    if (metric) {
      freelancer.assignmentMetric = metric;
    }
  });
}

export async function buildAssignmentQueue({
  targetType = 'project',
  targetId,
  projectValue = null,
  limit = DEFAULT_LIMIT,
  expiresInMinutes = DEFAULT_EXPIRES_MINUTES,
  actorId = null,
  weightOverrides = {},
  fairnessConfig = {},
  transaction: externalTransaction = null,
} = {}) {
  if (!targetId) {
    throw new ValidationError('targetId is required to build an assignment queue.');
  }
  if (!APPLICATION_TARGET_TYPES.includes(targetType)) {
    throw new ValidationError(`Unsupported targetType "${targetType}".`);
  }

  const normalizedLimit = Math.max(1, Math.min(Number(limit) || DEFAULT_LIMIT, 100));
  const normalizedExpiry = Math.max(30, Math.min(Number(expiresInMinutes) || DEFAULT_EXPIRES_MINUTES, 1440));
  const normalizedProjectValue = projectValue == null ? null : normalizeProjectValue(projectValue);
  const weights = normalizeWeights(weightOverrides);
  const fairnessSettings = {
    ensureNewcomer: fairnessConfig.ensureNewcomer !== false,
    maxAssignmentsForPriority: Number.isFinite(Number(fairnessConfig.maxAssignments))
      ? Math.max(0, Number(fairnessConfig.maxAssignments))
      : 3,
  };

  const execute = async (transaction) => {
    let targetName = `Target ${targetId}`;
    if (targetType === 'project') {
      const project = await Project.findByPk(targetId, { transaction });
      if (!project) {
        throw new NotFoundError('Project not found.');
      }
      targetName = project.title ?? targetName;
    }

    const freelancers = await User.findAll({
      where: { userType: 'freelancer' },
      include: [{ model: FreelancerAssignmentMetric, as: 'assignmentMetric' }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!freelancers.length) {
      return [];
    }

    await ensureMetricsForFreelancers(freelancers, { transaction });

    const now = new Date();
    const scored = freelancers.map((freelancer) => {
      const metrics = freelancer.assignmentMetric;
      const { score, breakdown, priorityBucket } = scoreFreelancerForProject({
        metrics,
        projectValue: normalizedProjectValue,
        freelancerCreatedAt: freelancer.createdAt,
        now,
        weightOverrides: weights,
      });
      return {
        freelancer,
        metrics,
        score,
        breakdown,
        priorityBucket,
      };
    });

    const sorted = [...scored].sort(
      (a, b) => b.score - a.score || a.priorityBucket - b.priorityBucket || a.freelancer.id - b.freelancer.id,
    );

    const usedFreelancerIds = new Set();
    const selected = [];
    let fairnessDescriptor = { ensured: false, freelancerId: null };

    if (fairnessSettings.ensureNewcomer) {
      const fairnessPool = sorted.filter(
        (item) => safeNumber(item.metrics?.totalAssigned, 0) <= fairnessSettings.maxAssignmentsForPriority,
      );
      if (fairnessPool.length) {
        const prioritized = fairnessPool[0];
        selected.push(prioritized);
        usedFreelancerIds.add(prioritized.freelancer.id);
        fairnessDescriptor = { ensured: true, freelancerId: prioritized.freelancer.id };
      }
    }

    for (const item of sorted) {
      if (selected.length >= normalizedLimit) {
        break;
      }
      if (usedFreelancerIds.has(item.freelancer.id)) {
        continue;
      }
      selected.push(item);
      usedFreelancerIds.add(item.freelancer.id);
    }

    const finalSelection = selected.slice(0, normalizedLimit);
    if (!finalSelection.length) {
      return [];
    }

    await AutoAssignQueueEntry.update(
      { status: 'expired', resolvedAt: now },
      {
        where: {
          targetType,
          targetId,
          status: { [Op.in]: ['pending', 'notified'] },
        },
        transaction,
      },
    );

    const expiresAt = new Date(now.getTime() + normalizedExpiry * 60 * 1000);
    const createdEntries = await AutoAssignQueueEntry.bulkCreate(
      finalSelection.map((item, index) => ({
        targetType,
        targetId,
        freelancerId: item.freelancer.id,
        score: item.score,
        priorityBucket: item.priorityBucket,
        status: index === 0 ? 'notified' : 'pending',
        notifiedAt: index === 0 ? now : null,
        expiresAt,
        projectValue: normalizedProjectValue,
        metadata: {
          breakdown: item.breakdown,
          projectName: targetName,
          generatedAt: now.toISOString(),
          generatedBy: actorId,
          version: '2024.08.autoassign',
          weights,
          fairness: {
            ensuredNewcomer: fairnessDescriptor.ensured,
            newcomerFreelancerId: fairnessDescriptor.freelancerId,
            maxAssignmentsForPriority: fairnessSettings.maxAssignmentsForPriority,
          },
        },
      })),
      { transaction, returning: true },
    );

    await Promise.all(
      finalSelection.map(async ({ metrics }) => {
        const previousTotalAssigned = safeNumber(metrics.totalAssigned, 0);
        const newTotalAssigned = previousTotalAssigned + 1;
        const currentAvg = safeNumber(metrics.avgAssignedValue, 0);
        const queueValue = normalizedProjectValue ?? currentAvg;
        const nextAvg =
          queueValue === null
            ? currentAvg
            : previousTotalAssigned === 0
            ? queueValue
            : (currentAvg * previousTotalAssigned + queueValue) / newTotalAssigned;

        await metrics.update(
          {
            totalAssigned: newTotalAssigned,
            lastAssignedAt: now,
            avgAssignedValue: queueValue === null ? currentAvg : nextAvg,
            lifetimeAssignedValue: safeNumber(metrics.lifetimeAssignedValue, 0) + (queueValue ?? 0),
            rating: metrics.rating ?? DEFAULT_BASE_RATING,
          },
          { transaction },
        );
      }),
    );

    return createdEntries.map((entry, index) => ({
      ...entry.toPublicObject(),
      position: index + 1,
      freelancer: sanitizeUser(finalSelection[index].freelancer),
      breakdown: finalSelection[index].breakdown,
      projectName: entry.metadata?.projectName ?? targetName,
      weights,
    }));
  };

  if (externalTransaction) {
    return execute(externalTransaction);
  }
  return sequelize.transaction(execute);
}

export async function listFreelancerQueue({ freelancerId, page = 1, pageSize = 10, statuses } = {}) {
  if (!freelancerId) {
    throw new ValidationError('freelancerId is required.');
  }

  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.max(1, Math.min(Number(pageSize) || 10, 50));
  let statusFilter = Array.isArray(statuses) ? statuses : ['pending', 'notified'];
  statusFilter = statusFilter.filter((status) => AUTO_ASSIGN_STATUSES.includes(status));
  if (!statusFilter.length) {
    statusFilter = ['pending', 'notified'];
  }

  const offset = (safePage - 1) * safePageSize;
  const { rows, count } = await AutoAssignQueueEntry.findAndCountAll({
    where: { freelancerId, status: { [Op.in]: statusFilter } },
    include: [{ model: User, as: 'freelancer' }],
    order: [
      ['status', 'ASC'],
      ['priorityBucket', 'ASC'],
      ['score', 'DESC'],
      ['createdAt', 'ASC'],
    ],
    limit: safePageSize,
    offset,
  });

  return {
    entries: rows.map((entry, index) => ({
      ...entry.toPublicObject(),
      position: offset + index + 1,
      freelancer: sanitizeUser(entry.freelancer),
      breakdown: entry.metadata?.breakdown ?? null,
      projectName: entry.metadata?.projectName ?? null,
    })),
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      totalEntries: count,
      totalPages: Math.ceil(count / safePageSize) || 1,
    },
  };
}

export async function resolveQueueEntry(entryId, status, { freelancerId, actorId, rating, completionValue } = {}) {
  if (!entryId) {
    throw new ValidationError('entryId is required.');
  }
  if (!['accepted', 'declined', 'reassigned'].includes(status)) {
    throw new ValidationError('status must be accepted, declined, or reassigned.');
  }

  return sequelize.transaction(async (transaction) => {
    const entry = await AutoAssignQueueEntry.findByPk(entryId, {
      include: [{ model: User, as: 'freelancer' }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!entry) {
      throw new NotFoundError('Queue entry not found.');
    }

    if (freelancerId && entry.freelancerId !== freelancerId) {
      throw new ConflictError('This queue entry does not belong to the requested freelancer.');
    }

    if (!['pending', 'notified'].includes(entry.status)) {
      throw new ConflictError('Queue entry already resolved.');
    }

    const now = new Date();
    const updatedMetadata = {
      ...(entry.metadata ?? {}),
      resolvedBy: actorId ?? freelancerId ?? null,
      resolvedAt: now.toISOString(),
    };

    await entry.update({ status, resolvedAt: now, metadata: updatedMetadata }, { transaction });

    const metric = await FreelancerAssignmentMetric.findOne({
      where: { freelancerId: entry.freelancerId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (metric) {
      if (status === 'accepted') {
        const newTotalCompleted = safeNumber(metric.totalCompleted, 0) + 1;
        const newCompletionRate = computeCompletionRate(newTotalCompleted, metric.totalAssigned);
        const updatedRating =
          rating == null
            ? metric.rating ?? DEFAULT_BASE_RATING
            : clamp(
                (safeNumber(metric.rating, DEFAULT_BASE_RATING) * safeNumber(metric.totalCompleted, 0) + rating) /
                  (safeNumber(metric.totalCompleted, 0) + 1),
                0,
                5,
              );

        await metric.update(
          {
            totalCompleted: newTotalCompleted,
            completionRate: newCompletionRate,
            lastCompletedAt: now,
            lifetimeCompletedValue:
              safeNumber(metric.lifetimeCompletedValue, 0) + safeNumber(completionValue ?? entry.projectValue ?? 0, 0),
            rating: rating == null ? metric.rating ?? DEFAULT_BASE_RATING : updatedRating,
          },
          { transaction },
        );
      } else if (status === 'declined') {
        await metric.update(
          {
            completionRate: computeCompletionRate(metric.totalCompleted, metric.totalAssigned),
          },
          { transaction },
        );
      }
    }

    const nextEntry = await AutoAssignQueueEntry.findOne({
      where: {
        targetType: entry.targetType,
        targetId: entry.targetId,
        status: 'pending',
      },
      order: [
        ['priorityBucket', 'ASC'],
        ['score', 'DESC'],
        ['createdAt', 'ASC'],
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (nextEntry) {
      await nextEntry.update({ status: 'notified', notifiedAt: now }, { transaction });
    }

    return {
      ...entry.toPublicObject(),
      freelancer: sanitizeUser(entry.freelancer),
    };
  });
}

export async function getProjectQueue(targetType = 'project', targetId) {
  if (!targetId) {
    throw new ValidationError('targetId is required.');
  }
  if (!APPLICATION_TARGET_TYPES.includes(targetType)) {
    throw new ValidationError(`Unsupported targetType "${targetType}".`);
  }

  const entries = await AutoAssignQueueEntry.findAll({
    where: { targetType, targetId },
    include: [{ model: User, as: 'freelancer' }],
    order: [
      ['status', 'ASC'],
      ['priorityBucket', 'ASC'],
      ['score', 'DESC'],
      ['createdAt', 'ASC'],
    ],
  });

  return entries.map((entry, index) => ({
    ...entry.toPublicObject(),
    position: index + 1,
    freelancer: sanitizeUser(entry.freelancer),
    breakdown: entry.metadata?.breakdown ?? null,
    projectName: entry.metadata?.projectName ?? null,
  }));
}

export default {
  buildAssignmentQueue,
  listFreelancerQueue,
  resolveQueueEntry,
  getProjectQueue,
  scoreFreelancerForProject,
};
