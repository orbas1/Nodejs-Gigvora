import { Op } from 'sequelize';
import {
  sequelize,
  Profile,
  ProfileAppreciation,
  ProfileFollower,
  ProfileEngagementJob,
  PROFILE_APPRECIATION_TYPES,
  PROFILE_FOLLOWER_STATUSES,
} from '../models/index.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import {
  buildSnapshotFromProfile,
  recordEngagementRefresh,
  recordTargetingSnapshotChange,
} from './profileAnalyticsService.js';

const POSITIVE_APPRECIATION_TYPES = new Set(['like', 'celebrate', 'support', 'endorse', 'applause']);
const ACTIVE_FOLLOWER_STATUS = 'active';
const MAX_JOB_ATTEMPTS = 5;
const LOCK_TIMEOUT_SECONDS = 120;
const DEFAULT_RESCHEDULE_SECONDS = 30;
const WORKER_INTERVAL_MS = 30_000;
const STALE_AFTER_MS = 30 * 60 * 1000;

let workerHandle = null;

function normalizeProfileId(profileId) {
  const normalized = Number(profileId);
  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw new ValidationError('A valid profileId is required.');
  }
  return normalized;
}

function ensureAppreciationType(appreciationType) {
  if (!appreciationType || !PROFILE_APPRECIATION_TYPES.includes(appreciationType)) {
    throw new ValidationError(`Unsupported appreciation type "${appreciationType}".`);
  }
}

function ensureFollowerStatus(status) {
  if (!status || !PROFILE_FOLLOWER_STATUSES.includes(status)) {
    throw new ValidationError(`Unsupported follower status "${status}".`);
  }
}

export async function recordProfileAppreciation({
  profileId,
  actorId,
  appreciationType = 'like',
  source = null,
  metadata = null,
} = {}) {
  const normalizedProfileId = normalizeProfileId(profileId);
  const normalizedActorId = Number(actorId);
  if (!Number.isInteger(normalizedActorId) || normalizedActorId <= 0) {
    throw new ValidationError('A valid actorId is required.');
  }
  ensureAppreciationType(appreciationType);

  await sequelize.transaction(async (transaction) => {
    const profile = await Profile.findByPk(normalizedProfileId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!profile) {
      throw new NotFoundError('Profile not found.');
    }

    await ProfileAppreciation.upsert(
      {
        profileId: normalizedProfileId,
        actorId: normalizedActorId,
        appreciationType,
        source,
        metadata: metadata && typeof metadata === 'object' ? metadata : null,
      },
      { transaction },
    );

    await queueProfileEngagementRecalculation(normalizedProfileId, {
      transaction,
      reason: 'profile_appreciation_recorded',
      priority: 5,
    });
  });
}

export async function upsertProfileFollower({
  profileId,
  followerId,
  status = ACTIVE_FOLLOWER_STATUS,
  notificationsEnabled = true,
  metadata = null,
} = {}) {
  const normalizedProfileId = normalizeProfileId(profileId);
  const normalizedFollowerId = Number(followerId);
  if (!Number.isInteger(normalizedFollowerId) || normalizedFollowerId <= 0) {
    throw new ValidationError('A valid followerId is required.');
  }
  ensureFollowerStatus(status);

  await sequelize.transaction(async (transaction) => {
    const profile = await Profile.findByPk(normalizedProfileId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!profile) {
      throw new NotFoundError('Profile not found.');
    }

    const [record] = await ProfileFollower.findOrCreate({
      where: { profileId: normalizedProfileId, followerId: normalizedFollowerId },
      defaults: {
        status,
        notificationsEnabled: Boolean(notificationsEnabled),
        metadata: metadata && typeof metadata === 'object' ? metadata : null,
      },
      transaction,
    });

    if (!record.isNewRecord) {
      record.status = status;
      record.notificationsEnabled = Boolean(notificationsEnabled);
      record.metadata = metadata && typeof metadata === 'object' ? metadata : record.metadata;
      await record.save({ transaction });
    }

    await queueProfileEngagementRecalculation(normalizedProfileId, {
      transaction,
      reason: 'profile_follower_upserted',
      priority: status === ACTIVE_FOLLOWER_STATUS ? 5 : 3,
    });
  });
}

export async function aggregateProfileEngagement(profileId, { transaction } = {}) {
  const normalizedProfileId = normalizeProfileId(profileId);

  const [likesCount, followersCount] = await Promise.all([
    ProfileAppreciation.count({
      where: {
        profileId: normalizedProfileId,
        appreciationType: { [Op.in]: Array.from(POSITIVE_APPRECIATION_TYPES) },
      },
      transaction,
    }),
    ProfileFollower.count({
      where: { profileId: normalizedProfileId, status: ACTIVE_FOLLOWER_STATUS },
      transaction,
    }),
  ]);

  return { likesCount, followersCount };
}

async function persistEngagementMetrics(
  profileId,
  { likesCount, followersCount },
  { transaction, profileRecord = null } = {},
) {
  const normalizedProfileId = normalizeProfileId(profileId);
  const profile =
    profileRecord ??
    (await Profile.findByPk(normalizedProfileId, {
      transaction,
      lock: transaction?.LOCK?.UPDATE,
    }));

  if (!profile) {
    throw new NotFoundError('Profile not found while persisting metrics.');
  }

  const previousSnapshot = buildSnapshotFromProfile(profile);
  const now = new Date();

  await profile.update(
    {
      likesCount,
      followersCount,
      engagementRefreshedAt: now,
    },
    { transaction },
  );

  const nextSnapshot = buildSnapshotFromProfile(profile, {
    likesCount,
    followersCount,
    engagementRefreshedAt: now,
  });

  return {
    metrics: { likesCount, followersCount, engagementRefreshedAt: now },
    previousSnapshot,
    nextSnapshot,
    userId: profile.userId,
  };
}

export async function recalculateProfileEngagementNow(
  profileId,
  { transaction, reason = 'manual_recalculation', instrument = true } = {},
) {
  const normalizedProfileId = normalizeProfileId(profileId);

  const result = await sequelize.transaction({ transaction }, async (trx) => {
    const profile = await Profile.findByPk(normalizedProfileId, {
      attributes: [
        'id',
        'userId',
        'likesCount',
        'followersCount',
        'engagementRefreshedAt',
        'trustScore',
        'profileCompletion',
        'launchpadEligibility',
        'volunteerBadges',
        'statusFlags',
        'pipelineInsights',
      ],
      transaction: trx,
      lock: trx.LOCK.UPDATE,
    });

    if (!profile) {
      throw new NotFoundError('Profile not found.');
    }

    const aggregates = await aggregateProfileEngagement(normalizedProfileId, { transaction: trx });
    return persistEngagementMetrics(normalizedProfileId, aggregates, {
      transaction: trx,
      profileRecord: profile,
    });
  });

  if (instrument) {
    await recordEngagementRefresh({
      profileId: normalizedProfileId,
      userId: result.userId,
      previousSnapshot: result.previousSnapshot,
      nextSnapshot: result.nextSnapshot,
      reason,
      triggeredBy: 'profile_engagement_service',
    });

    await recordTargetingSnapshotChange({
      profileId: normalizedProfileId,
      userId: result.userId,
      previousSnapshot: result.previousSnapshot,
      nextSnapshot: result.nextSnapshot,
      triggeredBy: `profile_engagement:${reason}`,
    });
  }

  return {
    likesCount: result.metrics.likesCount,
    followersCount: result.metrics.followersCount,
    engagementRefreshedAt: result.metrics.engagementRefreshedAt,
    previousLikesCount: result.previousSnapshot.metrics?.likesCount ?? 0,
    previousFollowersCount: result.previousSnapshot.metrics?.followersCount ?? 0,
  };
}

function computeRescheduleDelay(attempts) {
  const base = Math.min(5 * 60, DEFAULT_RESCHEDULE_SECONDS * 2 ** Math.max(attempts - 1, 0));
  return base * 1000;
}

export async function queueProfileEngagementRecalculation(
  profileId,
  { transaction = null, reason = null, priority = 0, scheduledAt = null } = {},
) {
  const normalizedProfileId = normalizeProfileId(profileId);
  const scheduleTime = scheduledAt ? new Date(scheduledAt) : new Date();
  if (Number.isNaN(scheduleTime.getTime())) {
    throw new ValidationError('scheduledAt must be a valid date when provided.');
  }

  const execute = async (trx) => {
    const [job, created] = await ProfileEngagementJob.findOrCreate({
      where: { profileId: normalizedProfileId, status: 'pending' },
      defaults: {
        profileId: normalizedProfileId,
        scheduledAt: scheduleTime,
        priority,
        reason,
      },
      transaction: trx,
    });

    if (!created) {
      const nextSchedule = scheduleTime < job.scheduledAt ? scheduleTime : job.scheduledAt;
      job.scheduledAt = nextSchedule;
      if (priority > job.priority) {
        job.priority = priority;
      }
      if (reason) {
        job.reason = reason;
      }
      await job.save({ transaction: trx });
    }
  };

  if (transaction) {
    await execute(transaction);
  } else {
    await sequelize.transaction(async (trx) => {
      await execute(trx);
    });
  }
}

async function claimJobBatch({ limit = 10, workerId }) {
  const now = new Date();
  const expiredLock = new Date(now.getTime() - LOCK_TIMEOUT_SECONDS * 1000);

  return sequelize.transaction(async (trx) => {
    const candidates = await ProfileEngagementJob.findAll({
      where: {
        status: 'pending',
        scheduledAt: { [Op.lte]: now },
        [Op.or]: [{ lockedAt: null }, { lockedAt: { [Op.lt]: expiredLock } }],
      },
      order: [
        ['priority', 'DESC'],
        ['scheduledAt', 'ASC'],
        ['id', 'ASC'],
      ],
      limit,
      transaction: trx,
    });

    const claimed = [];
    for (const job of candidates) {
      const lockCondition = job.lockedAt
        ? { lockedAt: job.lockedAt }
        : { lockedAt: { [Op.is]: null } };
      const [updated] = await ProfileEngagementJob.update(
        {
          lockedAt: now,
          lockedBy: workerId,
          attempts: job.attempts + 1,
        },
        {
          where: {
            id: job.id,
            status: 'pending',
            attempts: job.attempts,
            ...lockCondition,
          },
          transaction: trx,
        },
      );

      if (updated === 1) {
        claimed.push(job);
      }
    }

    return claimed.map((job) => job.get({ plain: true }));
  });
}

async function markJobCompleted(jobId, { lastError = null } = {}) {
  await ProfileEngagementJob.update(
    {
      status: 'completed',
      lockedAt: null,
      lockedBy: null,
      lastError,
      completedAt: new Date(),
    },
    { where: { id: jobId } },
  );
}

async function markJobFailed(jobId, { attempts, error }) {
  const updates = {
    lockedAt: null,
    lockedBy: null,
    lastError: error?.stack?.slice(0, 2000) ?? error?.message ?? String(error),
  };
  if (attempts >= MAX_JOB_ATTEMPTS) {
    updates.status = 'failed';
  } else {
    updates.status = 'pending';
    updates.scheduledAt = new Date(Date.now() + computeRescheduleDelay(attempts));
  }
  await ProfileEngagementJob.update(updates, { where: { id: jobId } });
}

export async function processProfileEngagementQueue({ limit = 10, logger = console } = {}) {
  const workerId = `profile-engagement-worker-${process.pid}`;
  const claimedJobs = await claimJobBatch({ limit, workerId });
  if (!claimedJobs.length) {
    return 0;
  }

  for (const job of claimedJobs) {
    try {
      await recalculateProfileEngagementNow(job.profileId, {
        reason: job.reason ?? 'queue_process',
      });
      await markJobCompleted(job.id);
    } catch (error) {
      logger?.error?.('Failed to process profile engagement job', { jobId: job.id, error });
      await markJobFailed(job.id, { attempts: job.attempts + 1, error });
    }
  }

  return claimedJobs.length;
}

export function shouldRefreshEngagementMetrics(profile) {
  if (!profile) {
    return false;
  }
  if (!profile.engagementRefreshedAt) {
    return true;
  }
  const refreshedAt = new Date(profile.engagementRefreshedAt);
  if (Number.isNaN(refreshedAt.getTime())) {
    return true;
  }
  return Date.now() - refreshedAt.getTime() > STALE_AFTER_MS;
}

export function startProfileEngagementWorker({ intervalMs = WORKER_INTERVAL_MS, logger = console } = {}) {
  if (workerHandle || process.env.NODE_ENV === 'test') {
    return;
  }

  workerHandle = setInterval(() => {
    processProfileEngagementQueue({ logger }).catch((error) => {
      logger?.error?.('Profile engagement worker tick failed', error);
    });
  }, intervalMs);
  workerHandle.unref?.();
}

export function stopProfileEngagementWorker() {
  if (workerHandle) {
    clearInterval(workerHandle);
    workerHandle = null;
  }
}

export default {
  aggregateProfileEngagement,
  recordProfileAppreciation,
  upsertProfileFollower,
  recalculateProfileEngagementNow,
  queueProfileEngagementRecalculation,
  processProfileEngagementQueue,
  shouldRefreshEngagementMetrics,
  startProfileEngagementWorker,
  stopProfileEngagementWorker,
};
