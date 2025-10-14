import { randomUUID } from 'crypto';
import { Op, fn, col } from 'sequelize';
import {
  sequelize,
  User,
  Gig,
  ClientSuccessPlaybook,
  ClientSuccessStep,
  ClientSuccessEnrollment,
  ClientSuccessEvent,
  ClientSuccessReferral,
  ClientSuccessReviewNudge,
  ClientSuccessAffiliateLink,
  CLIENT_SUCCESS_PLAYBOOK_TRIGGERS,
  CLIENT_SUCCESS_STEP_TYPES,
  CLIENT_SUCCESS_STEP_CHANNELS,
  CLIENT_SUCCESS_REFERRAL_STATUSES,
  CLIENT_SUCCESS_AFFILIATE_STATUSES,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const STEP_TYPES_TRIGGERING_REVIEW = new Set(['review_nudge']);
const STEP_TYPES_TRIGGERING_REFERRAL = new Set(['referral_invite']);
const DEFAULT_ENROLLMENT_STATUS = 'active';
const SCHEDULABLE_EVENT_STATUSES = new Set(['queued', 'processing']);

function normalizeFreelancerId(input) {
  const id = Number(input);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('freelancerId must be a positive integer.');
  }
  return id;
}

function normalizePlaybookId(input) {
  const id = Number(input);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('playbookId must be a positive integer.');
  }
  return id;
}

function normalizeGigId(input) {
  if (input == null) {
    return null;
  }
  const id = Number(input);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('gigId must be a positive integer when provided.');
  }
  return id;
}

function normalizeClientId(input) {
  if (input == null) {
    return null;
  }
  const id = Number(input);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('clientId must be a positive integer when provided.');
  }
  return id;
}

function assertIncludes(value, collection, message) {
  if (value == null) {
    return;
  }
  if (!collection.includes(value)) {
    throw new ValidationError(message);
  }
}

function normalizeBoolean(value, fallback) {
  if (value === undefined) {
    return fallback;
  }
  return Boolean(value);
}

function normalizeTags(tags) {
  if (!tags) {
    return null;
  }
  if (!Array.isArray(tags)) {
    throw new ValidationError('tags must be an array of strings when provided.');
  }
  const cleaned = tags
    .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
    .filter((tag) => tag.length > 0)
    .slice(0, 12);
  return cleaned.length ? cleaned : null;
}

function normalizeMetadata(metadata) {
  if (metadata == null) {
    return null;
  }
  if (typeof metadata !== 'object') {
    throw new ValidationError('metadata must be an object when provided.');
  }
  return metadata;
}

function normalizeTriggerType(triggerType) {
  if (!triggerType) {
    return CLIENT_SUCCESS_PLAYBOOK_TRIGGERS[0];
  }
  if (!CLIENT_SUCCESS_PLAYBOOK_TRIGGERS.includes(triggerType)) {
    throw new ValidationError('Invalid triggerType provided.');
  }
  return triggerType;
}

function normalizeStep(step, index) {
  if (!step || typeof step !== 'object') {
    throw new ValidationError('Each playbook step must be an object.');
  }
  const name = typeof step.name === 'string' && step.name.trim().length ? step.name.trim() : null;
  if (!name) {
    throw new ValidationError(`Step ${index + 1} is missing a name.`);
  }
  const stepType = step.stepType ?? 'email';
  assertIncludes(stepType, CLIENT_SUCCESS_STEP_TYPES, `Invalid stepType for step "${name}".`);
  const channel = step.channel ?? 'email';
  assertIncludes(channel, CLIENT_SUCCESS_STEP_CHANNELS, `Invalid channel for step "${name}".`);
  const orderIndex = Number(step.orderIndex ?? index);
  const offsetHoursRaw = step.offsetHours ?? 0;
  const offsetHours = Number(offsetHoursRaw);
  if (!Number.isFinite(offsetHours)) {
    throw new ValidationError(`offsetHours for step "${name}" must be numeric.`);
  }
  const waitForCompletion = normalizeBoolean(step.waitForCompletion, false);
  const templateSubject = typeof step.templateSubject === 'string' ? step.templateSubject.trim() || null : null;
  const templateBody = typeof step.templateBody === 'string' ? step.templateBody : null;
  const metadata = normalizeMetadata(step.metadata ?? null);

  return {
    id: step.id ? Number(step.id) : undefined,
    name,
    stepType,
    channel,
    orderIndex: Number.isInteger(orderIndex) ? orderIndex : index,
    offsetHours: Math.round(offsetHours),
    waitForCompletion,
    templateSubject,
    templateBody,
    metadata,
    isActive: normalizeBoolean(step.isActive, true),
  };
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }
  const plain = user.get?.({ plain: true }) ?? user;
  return {
    id: plain.id,
    firstName: plain.firstName ?? null,
    lastName: plain.lastName ?? null,
    email: plain.email ?? null,
    name: [plain.firstName, plain.lastName].filter(Boolean).join(' ') || plain.email || null,
  };
}

function sanitizeGig(gig) {
  if (!gig) {
    return null;
  }
  if (typeof gig.toPublicObject === 'function') {
    return gig.toPublicObject();
  }
  return gig.get?.({ plain: true }) ?? gig;
}

function sanitizePlaybook(playbook, { enrollmentStats, stepMetrics } = {}) {
  const base = playbook.toPublicObject();
  const stats = enrollmentStats?.get(base.id) ?? { total: 0, active: 0, completed: 0, cancelled: 0, paused: 0 };
  const completionRate = stats.total ? Number((stats.completed / stats.total).toFixed(3)) : 0;
  const steps = Array.isArray(playbook.steps)
    ? playbook.steps
        .slice()
        .sort((a, b) => {
          if (a.orderIndex !== b.orderIndex) {
            return a.orderIndex - b.orderIndex;
          }
          return a.id - b.id;
        })
        .map((step) => {
          const stepPlain = step.toPublicObject();
          const metrics = stepMetrics?.get(stepPlain.id) ?? {
            total: 0,
            completed: 0,
            skipped: 0,
            failed: 0,
          };
          return {
            ...stepPlain,
            metrics,
          };
        })
    : [];
  return {
    ...base,
    metrics: {
      totalEnrollments: stats.total,
      activeEnrollments: stats.active,
      completedEnrollments: stats.completed,
      pausedEnrollments: stats.paused,
      cancelledEnrollments: stats.cancelled,
      completionRate,
    },
    stepCount: steps.length,
    steps,
  };
}

function sanitizeEnrollment(enrollment) {
  const plain = enrollment.toPublicObject();
  const gig = sanitizeGig(enrollment.get?.('gig') ?? enrollment.gig);
  const client = sanitizeUser(enrollment.get?.('client') ?? enrollment.client);
  const playbook = enrollment.get?.('playbook')?.toPublicObject?.() ?? enrollment.playbook?.toPublicObject?.() ?? null;
  return {
    ...plain,
    gig,
    client,
    playbook,
  };
}

function sanitizeEvent(event) {
  const plain = event.toPublicObject();
  const step = event.get?.('step')?.toPublicObject?.() ?? event.step?.toPublicObject?.() ?? null;
  const enrollment = event.get?.('enrollment') ?? event.enrollment;
  const gig = enrollment ? sanitizeGig(enrollment.get?.('gig') ?? enrollment.gig) : null;
  const client = enrollment ? sanitizeUser(enrollment.get?.('client') ?? enrollment.client) : null;
  const playbook = enrollment?.get?.('playbook')?.toPublicObject?.() ?? enrollment?.playbook?.toPublicObject?.() ?? null;
  return {
    ...plain,
    step,
    enrollmentId: plain.enrollmentId,
    gig,
    client,
    playbook,
  };
}

function sanitizeReferral(referral) {
  const plain = referral.toPublicObject();
  const gig = sanitizeGig(referral.get?.('gig') ?? referral.gig);
  const referrer = sanitizeUser(referral.get?.('referrer') ?? referral.referrer);
  return {
    ...plain,
    gig,
    referrer,
  };
}

function sanitizeReviewNudge(nudge) {
  const plain = nudge.toPublicObject();
  const gig = sanitizeGig(nudge.get?.('gig') ?? nudge.gig);
  const client = sanitizeUser(nudge.get?.('client') ?? nudge.client);
  return {
    ...plain,
    gig,
    client,
  };
}

function sanitizeAffiliateLink(link) {
  const plain = link.toPublicObject();
  const gig = sanitizeGig(link.get?.('gig') ?? link.gig);
  return {
    ...plain,
    gig,
    totalRevenue: plain.totalRevenueCents == null ? null : Number((plain.totalRevenueCents / 100).toFixed(2)),
  };
}

async function ensureFreelancerExists(freelancerId, { transaction } = {}) {
  const freelancer = await User.findByPk(freelancerId, { transaction });
  if (!freelancer) {
    throw new NotFoundError(`Freelancer #${freelancerId} was not found.`);
  }
  return freelancer;
}

async function loadPlaybookOrThrow(playbookId, freelancerId, { transaction, lock } = {}) {
  const playbook = await ClientSuccessPlaybook.findOne({
    where: { id: playbookId, freelancerId },
    transaction,
    lock,
    include: [{ model: ClientSuccessStep, as: 'steps' }],
  });
  if (!playbook) {
    throw new NotFoundError(`Playbook #${playbookId} was not found for freelancer #${freelancerId}.`);
  }
  return playbook;
}

function buildEnrollmentStats(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const plain = row.get({ plain: true });
    const playbookId = plain.playbookId;
    const status = plain.status;
    const count = Number(plain.count || plain.Count || 0);
    if (!map.has(playbookId)) {
      map.set(playbookId, { total: 0, active: 0, completed: 0, paused: 0, cancelled: 0 });
    }
    const stats = map.get(playbookId);
    stats.total += count;
    if (status === 'completed') {
      stats.completed += count;
    } else if (status === 'paused') {
      stats.paused += count;
    } else if (status === 'cancelled') {
      stats.cancelled += count;
    } else if (status === 'pending' || status === 'active') {
      stats.active += count;
    }
  });
  return map;
}

function buildStepMetrics(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const plain = row.get({ plain: true });
    const stepId = plain.stepId;
    const status = plain.status;
    const count = Number(plain.count || plain.Count || 0);
    if (!map.has(stepId)) {
      map.set(stepId, { total: 0, completed: 0, skipped: 0, failed: 0 });
    }
    const metrics = map.get(stepId);
    metrics.total += count;
    if (status === 'completed') {
      metrics.completed += count;
    } else if (status === 'skipped') {
      metrics.skipped += count;
    } else if (status === 'failed') {
      metrics.failed += count;
    }
  });
  return map;
}

function aggregateReferrals(referrals) {
  const totals = {
    total: referrals.length,
    converted: 0,
    rewarded: 0,
    pendingRewards: 0,
  };
  const byGig = new Map();
  referrals.forEach((referral) => {
    const plain = referral.toPublicObject();
    const status = plain.status;
    if (status === 'converted' || status === 'rewarded') {
      totals.converted += 1;
    }
    if (status === 'rewarded') {
      totals.rewarded += 1;
    }
    if (status === 'converted') {
      totals.pendingRewards += 1;
    }
    const gigInstance = referral.get?.('gig') ?? referral.gig;
    const gig = sanitizeGig(gigInstance);
    const key = gig?.id ?? 'ungrouped';
    if (!byGig.has(key)) {
      byGig.set(key, {
        gigId: gig?.id ?? null,
        gigTitle: gig?.title ?? 'Unassigned',
        referrals: 0,
        conversions: 0,
        rewardsPaid: 0,
        rewardValueCents: 0,
      });
    }
    const entry = byGig.get(key);
    entry.referrals += 1;
    if (status === 'converted' || status === 'rewarded') {
      entry.conversions += 1;
    }
    if (status === 'rewarded') {
      entry.rewardsPaid += 1;
      entry.rewardValueCents += plain.rewardValueCents ?? 0;
    }
  });
  const byGigArray = Array.from(byGig.values()).map((entry) => ({
    ...entry,
    conversionRate: entry.referrals ? Number((entry.conversions / entry.referrals).toFixed(3)) : 0,
    rewardsPaidValue: entry.rewardValueCents ? Number((entry.rewardValueCents / 100).toFixed(2)) : 0,
  }));
  const conversionRate = totals.total ? Number((totals.converted / totals.total).toFixed(3)) : 0;
  return {
    totals: {
      total: totals.total,
      converted: totals.converted,
      rewarded: totals.rewarded,
      pendingRewards: totals.pendingRewards,
      conversionRate,
    },
    byGig: byGigArray.sort((a, b) => b.referrals - a.referrals),
  };
}

function aggregateAffiliateRevenue(links) {
  const totals = new Map();
  links.forEach((link) => {
    const plain = link.toPublicObject();
    const currency = plain.revenueCurrency ?? 'USD';
    const cents = plain.totalRevenueCents ?? 0;
    totals.set(currency, (totals.get(currency) ?? 0) + cents);
  });
  const summary = Array.from(totals.entries()).map(([currency, cents]) => ({
    currency,
    amountCents: cents,
    amount: Number((cents / 100).toFixed(2)),
  }));
  return summary;
}

export async function getFreelancerAutomationOverview(freelancerId) {
  const id = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(id);

  const [playbooks, enrollmentStatsRows, stepMetricsRows, distinctClients, activeEnrollments, referrals, reviewNudges, affiliateLinks, upcomingEvents, completedEventsCount, respondedNudges] = await Promise.all([
    ClientSuccessPlaybook.findAll({
      where: { freelancerId: id },
      include: [{ model: ClientSuccessStep, as: 'steps', separate: true, order: [ ['orderIndex', 'ASC'], ['id', 'ASC'] ] }],
      order: [['createdAt', 'DESC']],
    }),
    ClientSuccessEnrollment.findAll({
      where: { freelancerId: id },
      attributes: ['playbookId', 'status', [fn('COUNT', col('id')), 'count']],
      group: ['playbookId', 'status'],
    }),
    ClientSuccessEvent.findAll({
      where: { freelancerId: id },
      attributes: ['stepId', 'status', [fn('COUNT', col('id')), 'count']],
      group: ['stepId', 'status'],
    }),
    ClientSuccessEnrollment.count({
      where: { freelancerId: id, clientId: { [Op.ne]: null } },
      distinct: true,
      col: 'clientId',
    }),
    ClientSuccessEnrollment.count({
      where: { freelancerId: id, status: { [Op.in]: ['pending', 'active'] } },
    }),
    ClientSuccessReferral.findAll({
      where: { freelancerId: id },
      include: [
        { model: Gig, as: 'gig' },
        { model: User, as: 'referrer' },
      ],
      order: [['updatedAt', 'DESC']],
    }),
    ClientSuccessReviewNudge.findAll({
      where: { freelancerId: id },
      include: [
        { model: Gig, as: 'gig' },
        { model: User, as: 'client' },
      ],
      order: [['updatedAt', 'DESC']],
      limit: 20,
    }),
    ClientSuccessAffiliateLink.findAll({
      where: { freelancerId: id },
      include: [{ model: Gig, as: 'gig' }],
      order: [['updatedAt', 'DESC']],
    }),
    ClientSuccessEvent.findAll({
      where: {
        freelancerId: id,
        status: { [Op.in]: Array.from(SCHEDULABLE_EVENT_STATUSES) },
      },
      include: [
        { model: ClientSuccessStep, as: 'step' },
        {
          model: ClientSuccessEnrollment,
          as: 'enrollment',
          include: [
            { model: ClientSuccessPlaybook, as: 'playbook' },
            { model: Gig, as: 'gig' },
            { model: User, as: 'client' },
          ],
        },
      ],
      order: [ ['scheduledAt', 'ASC'], ['id', 'ASC'] ],
      limit: 15,
    }),
    ClientSuccessEvent.count({ where: { freelancerId: id, status: 'completed' } }),
    ClientSuccessReviewNudge.count({ where: { freelancerId: id, status: 'responded' } }),
  ]);

  const enrollmentStats = buildEnrollmentStats(enrollmentStatsRows);
  const stepMetrics = buildStepMetrics(stepMetricsRows);

  const playbookPayload = playbooks.map((playbook) => sanitizePlaybook(playbook, { enrollmentStats, stepMetrics }));
  const totalSteps = playbookPayload.reduce((sum, playbook) => sum + (playbook.stepCount || 0), 0);

  const referralAggregates = aggregateReferrals(referrals);
  const affiliateRevenueSummary = aggregateAffiliateRevenue(affiliateLinks);

  const respondedCount = respondedNudges;
  const sentCount = reviewNudges.filter((nudge) => {
    const status = nudge.status ?? nudge.get?.('status');
    return status === 'sent' || status === 'responded';
  }).length;
  const reviewResponseRate = sentCount ? Number((respondedCount / sentCount).toFixed(3)) : 0;

  const sanitizedUpcoming = upcomingEvents.map((event) => sanitizeEvent(event));
  const sanitizedReferrals = referrals.map((referral) => sanitizeReferral(referral));
  const sanitizedReviewNudges = reviewNudges.map((nudge) => sanitizeReviewNudge(nudge));
  const sanitizedAffiliateLinks = affiliateLinks.map((link) => sanitizeAffiliateLink(link));

  const recentReferrals = sanitizedReferrals.slice(0, 10);

  return {
    summary: {
      activePlaybooks: playbookPayload.filter((playbook) => playbook.isActive).length,
      totalSteps,
      clientsEnrolled: distinctClients,
      activeEnrollments,
      referralConversionRate: referralAggregates.totals.conversionRate,
      reviewResponseRate,
      affiliateRevenue: affiliateRevenueSummary,
      automationEventsCompleted: completedEventsCount,
    },
    playbooks: playbookPayload,
    upcomingEvents: sanitizedUpcoming,
    referrals: {
      totals: referralAggregates.totals,
      byGig: referralAggregates.byGig,
      recent: recentReferrals,
    },
    reviewNudges: sanitizedReviewNudges,
    affiliateLinks: sanitizedAffiliateLinks,
  };
}

export async function createPlaybook(freelancerId, payload = {}) {
  const id = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(id);
  const name = typeof payload.name === 'string' && payload.name.trim().length ? payload.name.trim() : null;
  if (!name) {
    throw new ValidationError('name is required.');
  }
  const triggerType = normalizeTriggerType(payload.triggerType);
  const description = typeof payload.description === 'string' ? payload.description.trim() || null : null;
  const tags = normalizeTags(payload.tags ?? null);
  const metadata = normalizeMetadata(payload.metadata ?? null);
  const isActive = normalizeBoolean(payload.isActive, true);
  const stepsInput = Array.isArray(payload.steps) ? payload.steps : [];
  const normalizedSteps = stepsInput.map((step, index) => normalizeStep(step, index));

  const playbook = await sequelize.transaction(async (transaction) => {
    const created = await ClientSuccessPlaybook.create(
      {
        freelancerId: id,
        name,
        description,
        triggerType,
        isActive,
        tags,
        metadata,
      },
      { transaction },
    );

    if (normalizedSteps.length) {
      await ClientSuccessStep.bulkCreate(
        normalizedSteps.map((step, index) => ({
          playbookId: created.id,
          name: step.name,
          stepType: step.stepType,
          channel: step.channel,
          orderIndex: step.orderIndex ?? index,
          offsetHours: step.offsetHours,
          waitForCompletion: step.waitForCompletion,
          templateSubject: step.templateSubject,
          templateBody: step.templateBody,
          metadata: step.metadata,
          isActive: step.isActive,
        })),
        { transaction },
      );
    }

    return created.reload({
      transaction,
      include: [{ model: ClientSuccessStep, as: 'steps', separate: true, order: [ ['orderIndex', 'ASC'], ['id', 'ASC'] ] }],
    });
  });

  return sanitizePlaybook(playbook);
}

export async function updatePlaybook(playbookId, freelancerId, payload = {}) {
  const normalizedPlaybookId = normalizePlaybookId(playbookId);
  const id = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(id);

  const result = await sequelize.transaction(async (transaction) => {
    const playbook = await loadPlaybookOrThrow(normalizedPlaybookId, id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const updates = {};
    if (payload.name !== undefined) {
      const name = typeof payload.name === 'string' ? payload.name.trim() : '';
      if (!name) {
        throw new ValidationError('name cannot be empty.');
      }
      updates.name = name;
    }
    if (payload.description !== undefined) {
      updates.description = typeof payload.description === 'string' ? payload.description.trim() || null : null;
    }
    if (payload.triggerType !== undefined) {
      updates.triggerType = normalizeTriggerType(payload.triggerType);
    }
    if (payload.isActive !== undefined) {
      updates.isActive = normalizeBoolean(payload.isActive, playbook.isActive);
    }
    if (payload.tags !== undefined) {
      updates.tags = normalizeTags(payload.tags);
    }
    if (payload.metadata !== undefined) {
      updates.metadata = normalizeMetadata(payload.metadata);
    }

    if (Object.keys(updates).length) {
      await playbook.update(updates, { transaction });
    }

    if (payload.steps !== undefined) {
      const normalizedSteps = Array.isArray(payload.steps)
        ? payload.steps.map((step, index) => normalizeStep(step, index))
        : [];
      const existingSteps = new Map(playbook.steps.map((step) => [step.id, step]));
      const toKeep = new Set();

      for (const [index, step] of normalizedSteps.entries()) {
        if (step.id && existingSteps.has(step.id)) {
          const instance = existingSteps.get(step.id);
          await instance.update(
            {
              name: step.name,
              stepType: step.stepType,
              channel: step.channel,
              orderIndex: step.orderIndex ?? index,
              offsetHours: step.offsetHours,
              waitForCompletion: step.waitForCompletion,
              templateSubject: step.templateSubject,
              templateBody: step.templateBody,
              metadata: step.metadata,
              isActive: step.isActive,
            },
            { transaction },
          );
          toKeep.add(step.id);
        } else {
          const created = await ClientSuccessStep.create(
            {
              playbookId: playbook.id,
              name: step.name,
              stepType: step.stepType,
              channel: step.channel,
              orderIndex: step.orderIndex ?? index,
              offsetHours: step.offsetHours,
              waitForCompletion: step.waitForCompletion,
              templateSubject: step.templateSubject,
              templateBody: step.templateBody,
              metadata: step.metadata,
              isActive: step.isActive,
            },
            { transaction },
          );
          toKeep.add(created.id);
        }
      }

      const removable = playbook.steps.filter((step) => !toKeep.has(step.id));
      for (const step of removable) {
        await step.destroy({ transaction });
      }
    }

    await playbook.reload({
      transaction,
      include: [{ model: ClientSuccessStep, as: 'steps', separate: true, order: [ ['orderIndex', 'ASC'], ['id', 'ASC'] ] }],
    });

    return playbook;
  });

  return sanitizePlaybook(result);
}

function computeScheduledTimestamp(startAt, offsetHours = 0) {
  const base = startAt ? new Date(startAt) : new Date();
  if (Number.isNaN(base.getTime())) {
    throw new ValidationError('startAt must be a valid date-time value when provided.');
  }
  const scheduled = new Date(base);
  scheduled.setHours(scheduled.getHours() + offsetHours);
  return scheduled;
}

function buildAffiliateCode(label) {
  if (label && typeof label === 'string') {
    const sanitized = label
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 16);
    if (sanitized.length >= 4) {
      return sanitized;
    }
  }
  return randomUUID().slice(0, 12).toUpperCase();
}

function parseMoneyToCents(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('Reward value must be a numeric amount.');
  }
  return Math.round(numeric * 100);
}

export async function enrollClientInPlaybook(playbookId, freelancerId, payload = {}) {
  const normalizedPlaybookId = normalizePlaybookId(playbookId);
  const id = normalizeFreelancerId(freelancerId);
  const gigId = normalizeGigId(payload.gigId ?? null);
  const clientId = normalizeClientId(payload.clientId ?? null);
  const metadata = normalizeMetadata(payload.metadata ?? null);
  const startAt = payload.startAt ?? new Date().toISOString();

  await ensureFreelancerExists(id);

  const result = await sequelize.transaction(async (transaction) => {
    const playbook = await loadPlaybookOrThrow(normalizedPlaybookId, id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const enrollment = await ClientSuccessEnrollment.create(
      {
        playbookId: playbook.id,
        freelancerId: id,
        clientId,
        gigId,
        status: DEFAULT_ENROLLMENT_STATUS,
        startedAt: new Date(startAt),
        metadata,
      },
      { transaction },
    );

    const scheduledEvents = [];
    const reviewNudgesToCreate = [];

    for (const step of playbook.steps) {
      if (!step.isActive) {
        continue;
      }
      const scheduleAt = computeScheduledTimestamp(startAt, step.offsetHours);
      scheduledEvents.push({
        enrollmentId: enrollment.id,
        stepId: step.id,
        freelancerId: id,
        status: 'queued',
        channel: step.channel,
        scheduledAt: scheduleAt,
        payload: metadata,
      });

      if (STEP_TYPES_TRIGGERING_REVIEW.has(step.stepType) && gigId) {
        reviewNudgesToCreate.push({
          freelancerId: id,
          gigId,
          clientId,
          status: 'scheduled',
          channel: step.channel,
          scheduledAt: scheduleAt,
          metadata: {
            playbookId: playbook.id,
            stepId: step.id,
            enrollmentId: enrollment.id,
          },
        });
      }
    }

    if (scheduledEvents.length) {
      await ClientSuccessEvent.bulkCreate(scheduledEvents, { transaction });
    }

    if (reviewNudgesToCreate.length) {
      await ClientSuccessReviewNudge.bulkCreate(reviewNudgesToCreate, { transaction });
    }

    if (STEP_TYPES_TRIGGERING_REFERRAL.size && gigId) {
      const hasReferralStep = playbook.steps.some((step) => STEP_TYPES_TRIGGERING_REFERRAL.has(step.stepType));
      if (hasReferralStep) {
        await ClientSuccessReferral.findOrCreate({
          where: {
            freelancerId: id,
            gigId,
            referrerId: clientId,
            referralCode: payload.referralCode ?? buildAffiliateCode('REF'),
          },
          defaults: {
            status: 'invited',
            occurredAt: new Date(startAt),
            metadata: {
              playbookId: playbook.id,
              enrollmentId: enrollment.id,
            },
          },
          transaction,
        });
      }
    }

    await enrollment.reload({
      transaction,
      include: [
        { model: Gig, as: 'gig' },
        { model: User, as: 'client' },
        { model: ClientSuccessPlaybook, as: 'playbook' },
      ],
    });

    return enrollment;
  });

  return sanitizeEnrollment(result);
}

export async function recordReferral(freelancerId, payload = {}) {
  const id = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(id);
  const gigId = normalizeGigId(payload.gigId ?? null);
  const referrerId = normalizeClientId(payload.referrerId ?? null);
  const referredEmail = typeof payload.referredEmail === 'string' ? payload.referredEmail.trim() || null : null;
  const referralCode = typeof payload.referralCode === 'string' && payload.referralCode.trim().length
    ? payload.referralCode.trim().toUpperCase()
    : buildAffiliateCode('REF');
  const status = payload.status ?? 'invited';
  assertIncludes(status, CLIENT_SUCCESS_REFERRAL_STATUSES, 'Invalid referral status provided.');
  const rewardValueCents = payload.rewardValueCents ?? parseMoneyToCents(payload.rewardValue ?? null);
  const rewardCurrency = typeof payload.rewardCurrency === 'string' ? payload.rewardCurrency.trim().toUpperCase() || null : null;
  const metadata = normalizeMetadata(payload.metadata ?? null);
  const occurredAt = payload.occurredAt ? new Date(payload.occurredAt) : new Date();

  const referral = await ClientSuccessReferral.create(
    {
      freelancerId: id,
      gigId,
      referrerId,
      referredEmail,
      referralCode,
      status,
      rewardValueCents,
      rewardCurrency,
      metadata,
      occurredAt,
    },
    { returning: true },
  );

  await referral.reload({ include: [{ model: Gig, as: 'gig' }, { model: User, as: 'referrer' }] });
  return sanitizeReferral(referral);
}

export async function createAffiliateLink(freelancerId, payload = {}) {
  const id = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(id);
  const gigId = normalizeGigId(payload.gigId ?? null);
  const label = typeof payload.label === 'string' ? payload.label.trim() || null : null;
  const codeInput = typeof payload.code === 'string' && payload.code.trim().length ? payload.code.trim().toUpperCase() : null;
  const code = codeInput ?? buildAffiliateCode(label ?? 'AFF');
  const destinationUrl = typeof payload.destinationUrl === 'string' ? payload.destinationUrl.trim() || null : null;
  const commissionRate = payload.commissionRate == null ? null : Number(payload.commissionRate);
  if (commissionRate != null && !Number.isFinite(commissionRate)) {
    throw new ValidationError('commissionRate must be numeric when provided.');
  }
  const status = payload.status ?? 'active';
  assertIncludes(status, CLIENT_SUCCESS_AFFILIATE_STATUSES, 'Invalid affiliate link status provided.');
  const metadata = normalizeMetadata(payload.metadata ?? null);

  const existing = await ClientSuccessAffiliateLink.findOne({ where: { freelancerId: id, code } });
  if (existing) {
    throw new ValidationError('Affiliate code already exists for this freelancer.');
  }

  const link = await ClientSuccessAffiliateLink.create(
    {
      freelancerId: id,
      gigId,
      label,
      code,
      destinationUrl,
      commissionRate,
      status,
      metadata,
    },
    { returning: true },
  );

  await link.reload({ include: [{ model: Gig, as: 'gig' }] });
  return sanitizeAffiliateLink(link);
}

export default {
  getFreelancerAutomationOverview,
  createPlaybook,
  updatePlaybook,
  enrollClientInPlaybook,
  recordReferral,
  createAffiliateLink,
};
