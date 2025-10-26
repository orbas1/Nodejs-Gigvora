import { Op } from 'sequelize';
import { sequelize, SearchSubscriptionJob } from '../models/index.js';
import { ValidationError } from '../utils/errors.js';

const DEFAULT_MAX_QUEUE_SIZE = 1000;
let maxQueueSize = DEFAULT_MAX_QUEUE_SIZE;
const DIALECT = sequelize.getDialect();
const SKIP_LOCK_SUPPORTED = ['postgres', 'postgresql', 'mysql', 'mariadb', 'mssql'].includes(DIALECT);

function normaliseId(value, label) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return numeric;
}

function normalisePriority(value) {
  if (value == null) {
    return 5;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric)) {
    return 5;
  }
  return Math.min(Math.max(numeric, 1), 100);
}

function serialisePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {};
  }
  return { ...payload };
}

export function configureSearchSubscriptionQueue({ sizeCap } = {}) {
  if (sizeCap == null) {
    return { maxSize: maxQueueSize };
  }
  const numeric = Number.parseInt(sizeCap, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('sizeCap must be a positive integer.');
  }
  maxQueueSize = numeric;
  return { maxSize: maxQueueSize };
}

export async function enqueueSearchSubscriptionJob({
  subscriptionId,
  userId,
  reason = 'manual',
  priority = 5,
  payload = {},
  availableAt = null,
} = {}) {
  const normalisedSubscriptionId = normaliseId(subscriptionId, 'subscriptionId');
  const normalisedUserId = normaliseId(userId, 'userId');
  const now = new Date();
  const jobPriority = normalisePriority(priority);
  const scheduledAt = availableAt instanceof Date ? availableAt : availableAt ? new Date(availableAt) : now;

  return sequelize.transaction(async (transaction) => {
    const lockMode = transaction.LOCK?.UPDATE;
    const [pendingCount, existingJob] = await Promise.all([
      SearchSubscriptionJob.count({
        where: { status: { [Op.in]: ['pending', 'processing'] } },
        transaction,
      }),
      SearchSubscriptionJob.findOne({
        where: {
          subscriptionId: normalisedSubscriptionId,
          status: { [Op.in]: ['pending', 'processing'] },
        },
        order: [['queuedAt', 'ASC']],
        transaction,
        lock: lockMode,
      }),
    ]);

    if (!existingJob && pendingCount >= maxQueueSize) {
      throw new ValidationError('Search subscription queue is at capacity.');
    }

    if (existingJob) {
      await existingJob.update(
        {
          userId: normalisedUserId,
          reason,
          priority: jobPriority,
          payload: serialisePayload(payload),
          status: 'pending',
          availableAt: scheduledAt,
          processingStartedAt: null,
          processingFinishedAt: null,
          lastError: null,
        },
        { transaction },
      );
      return { job: existingJob.get({ plain: true }), queued: true, created: false };
    }

    const job = await SearchSubscriptionJob.create(
      {
        subscriptionId: normalisedSubscriptionId,
        userId: normalisedUserId,
        status: 'pending',
        reason,
        priority: jobPriority,
        payload: serialisePayload(payload),
        attempts: 0,
        queuedAt: now,
        availableAt: scheduledAt,
      },
      { transaction },
    );

    return { job: job.get({ plain: true }), queued: true, created: true };
  });
}

export async function drainSearchSubscriptionJobs({ limit = 10 } = {}) {
  const numericLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
  const now = new Date();

  return sequelize.transaction(async (transaction) => {
    const lockMode = transaction.LOCK?.UPDATE;
    const jobs = await SearchSubscriptionJob.findAll({
      where: {
        status: 'pending',
        availableAt: { [Op.lte]: now },
      },
      order: [
        ['priority', 'ASC'],
        ['queuedAt', 'ASC'],
        ['id', 'ASC'],
      ],
      limit: numericLimit,
      transaction,
      lock: lockMode,
      skipLocked: SKIP_LOCK_SUPPORTED,
    });

    if (!jobs.length) {
      return [];
    }

    await Promise.all(
      jobs.map((job) =>
        job.update(
          {
            status: 'processing',
            processingStartedAt: now,
            attempts: (job.attempts ?? 0) + 1,
          },
          { transaction },
        ),
      ),
    );

    return jobs.map((job) => job.get({ plain: true }));
  });
}

export async function getSearchSubscriptionQueueSnapshot() {
  const [pending, processing, failed, completed, oldestPending, newestPending] = await Promise.all([
    SearchSubscriptionJob.count({ where: { status: 'pending' } }),
    SearchSubscriptionJob.count({ where: { status: 'processing' } }),
    SearchSubscriptionJob.count({ where: { status: 'failed' } }),
    SearchSubscriptionJob.count({ where: { status: 'completed' } }),
    SearchSubscriptionJob.findOne({
      where: { status: 'pending' },
      order: [['queuedAt', 'ASC']],
      attributes: ['queuedAt'],
    }),
    SearchSubscriptionJob.findOne({
      where: { status: 'pending' },
      order: [['queuedAt', 'DESC']],
      attributes: ['queuedAt'],
    }),
  ]);

  return {
    pending,
    processing,
    failed,
    completed,
    maxSize: maxQueueSize,
    oldestEnqueuedAt: oldestPending?.queuedAt ? new Date(oldestPending.queuedAt).toISOString() : null,
    newestEnqueuedAt: newestPending?.queuedAt ? new Date(newestPending.queuedAt).toISOString() : null,
  };
}

export async function resetSearchSubscriptionQueue() {
  await SearchSubscriptionJob.destroy({ where: {}, truncate: true, cascade: true });
  maxQueueSize = DEFAULT_MAX_QUEUE_SIZE;
}

export default {
  enqueueSearchSubscriptionJob,
  drainSearchSubscriptionJobs,
  getSearchSubscriptionQueueSnapshot,
  configureSearchSubscriptionQueue,
  resetSearchSubscriptionQueue,
};
