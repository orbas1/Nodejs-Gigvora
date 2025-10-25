import { randomUUID } from 'crypto';
import { Op } from 'sequelize';
import {
  MessageThread,
  Message,
  MessageAttachment,
  MessageReadReceipt,
  MessageRetentionAudit,
  sequelize,
} from '../models/messagingModels.js';
import {
  listThreadParticipantUserIds,
  invalidateThreadCaches,
} from './messagingService.js';
import { trackEvent, upsertDailyRollup } from './analyticsService.js';
import messagingEvents, { MESSAGING_EVENTS } from '../events/messagingEvents.js';
import {
  isPolicyOverride,
  resolveRetentionDefaults,
  RETENTION_AUDIT_TTL_DAYS,
  RETENTION_AUDIT_PURGE_GRACE_DAYS,
} from '../constants/messagingRetention.js';
import baseLogger from '../utils/logger.js';

const MILLIS_PER_DAY = 24 * 60 * 60 * 1_000;
const DEFAULT_BATCH_SIZE = 200;
const DEFAULT_MAX_THREADS = 100;
const RETENTION_DELETED_METRIC = 'messaging.retention.deleted';
const RETENTION_OVERRIDE_METRIC = 'messaging.retention.overrides';
const RETENTION_PARTICIPANTS_METRIC = 'messaging.retention.participants';

export async function purgeExpiredMessages({
  logger = baseLogger,
  batchSize = DEFAULT_BATCH_SIZE,
  maxThreads = DEFAULT_MAX_THREADS,
  runId = randomUUID(),
} = {}) {
  const log = logger?.child?.({ component: 'messaging-retention' }) ?? logger;
  const threads = await MessageThread.findAll({
    where: {
      retentionDays: { [Op.gt]: 0 },
    },
    attributes: ['id', 'retentionDays', 'channelType', 'retentionPolicy'],
    limit: maxThreads,
    order: [['updatedAt', 'ASC']],
  });

  let totalDeleted = 0;
  let threadsProcessed = 0;
  const details = [];

  for (const thread of threads) {
    const retentionDays = Number(thread.retentionDays ?? 0);
    if (!Number.isFinite(retentionDays) || retentionDays <= 0) {
      continue;
    }
    const now = Date.now();
    const cutoff = new Date(now - retentionDays * MILLIS_PER_DAY);
    const deletedIds = [];

    // Delete in batches to avoid large transactions.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const messages = await Message.findAll({
        where: { threadId: thread.id, createdAt: { [Op.lt]: cutoff } },
        attributes: ['id'],
        limit: batchSize,
        order: [['createdAt', 'ASC']],
      });

      if (!messages.length) {
        break;
      }

      const messageIds = messages.map((message) => message.id);

      await sequelize.transaction(async (trx) => {
        await MessageAttachment.destroy({ where: { messageId: { [Op.in]: messageIds } }, transaction: trx });
        await MessageReadReceipt.destroy({ where: { messageId: { [Op.in]: messageIds } }, transaction: trx });
        await Message.destroy({ where: { id: { [Op.in]: messageIds } }, force: true, transaction: trx });

        const latestMessage = await Message.findOne({
          where: { threadId: thread.id },
          order: [['createdAt', 'DESC']],
          transaction: trx,
        });

        await MessageThread.update(
          {
            lastMessageAt: latestMessage?.createdAt ?? null,
            lastMessagePreview:
              typeof latestMessage?.body === 'string'
                ? latestMessage.body.slice(0, 500)
                : latestMessage?.body ?? null,
          },
          { where: { id: thread.id }, transaction: trx },
        );
      });

      deletedIds.push(...messageIds);
      totalDeleted += messageIds.length;

      if (messageIds.length < batchSize) {
        break;
      }
    }

    const defaults = resolveRetentionDefaults(thread.channelType);
    const override = isPolicyOverride(thread.channelType, thread.retentionPolicy, thread.retentionDays);

    if (deletedIds.length > 0 || override) {
      const participantIds = await listThreadParticipantUserIds(thread.id);
      if (deletedIds.length > 0) {
        threadsProcessed += 1;
        invalidateThreadCaches(thread.id, participantIds);
        messagingEvents.emit(MESSAGING_EVENTS.MESSAGES_PURGED, {
          threadId: thread.id,
          deletedIds,
          cutoff: cutoff.toISOString(),
        });
      }

      const retainedUntil = new Date(now + RETENTION_AUDIT_TTL_DAYS * MILLIS_PER_DAY);
      const audit = await MessageRetentionAudit.create({
        runId,
        threadId: thread.id,
        retentionPolicy: thread.retentionPolicy,
        retentionDays,
        deletedCount: deletedIds.length,
        participantCount: participantIds.length,
        cutoffAt: cutoff,
        channelType: thread.channelType,
        isOverride: override,
        metadata: {
          defaults,
        },
        retainedUntil,
      });
      messagingEvents.emit(MESSAGING_EVENTS.RETENTION_AUDIT_RECORDED, {
        runId,
        auditId: audit.id,
        threadId: thread.id,
        deletedCount: deletedIds.length,
        participantCount: participantIds.length,
        retentionPolicy: thread.retentionPolicy,
        retentionDays,
        isOverride: override,
        cutoff: cutoff.toISOString(),
      });
      details.push({
        threadId: thread.id,
        deletedCount: deletedIds.length,
        participantCount: participantIds.length,
        isOverride: override,
        cutoff: cutoff.toISOString(),
        auditId: audit.id,
        channelType: thread.channelType,
      });
      log?.info?.(
        {
          threadId: thread.id,
          deletedCount: deletedIds.length,
          participantCount: participantIds.length,
          cutoff: cutoff.toISOString(),
          runId,
          isOverride: override,
        },
        'Messaging retention cycle recorded',
      );
    }
  }

  return { totalDeleted, threadsProcessed, details, runId };
}

let workerTimer = null;
const workerStatus = {
  lastRunAt: null,
  lastResult: null,
  running: false,
  lastRunId: null,
};

export async function startMessagingRetentionWorker({
  logger = baseLogger,
  intervalMs = 6 * 60 * 60_000,
  batchSize = DEFAULT_BATCH_SIZE,
  maxThreads = DEFAULT_MAX_THREADS,
} = {}) {
  if (workerTimer) {
    return { started: false, reason: 'already_started' };
  }

  const log = logger?.child?.({ component: 'messaging-retention-worker' }) ?? logger;

  const runCycle = async () => {
    if (workerStatus.running) {
      log?.warn?.('Skipping messaging retention run because a previous run is still in progress.');
      return;
    }
    workerStatus.running = true;
    workerStatus.lastRunAt = new Date().toISOString();
    try {
      const result = await purgeExpiredMessages({ logger: log, batchSize, maxThreads });
      const analytics = await recordRetentionAnalytics(result, { logger: log });
      const archived = await archiveExpiredRetentionAudits({ logger: log });
      const purged = await purgeArchivedRetentionAudits({ logger: log });
      workerStatus.lastResult = { ok: true, ...result, analytics, archived, purged };
      workerStatus.lastRunId = result.runId;
    } catch (error) {
      workerStatus.lastResult = { ok: false, error: error.message };
      log?.error?.({ err: error }, 'Messaging retention worker failed');
    } finally {
      workerStatus.running = false;
    }
  };

  workerTimer = setInterval(runCycle, intervalMs);
  workerTimer.unref?.();
  await runCycle();
  return { started: true };
}

export async function stopMessagingRetentionWorker() {
  if (!workerTimer) {
    return { stopped: false, reason: 'not_started' };
  }
  clearInterval(workerTimer);
  workerTimer = null;
  return { stopped: true };
}

export function getMessagingRetentionStatus() {
  return { ...workerStatus };
}

export async function recordRetentionAnalytics(summary = {}, { logger = baseLogger } = {}) {
  const details = Array.isArray(summary.details) ? summary.details : [];
  if (!details.length) {
    return { ok: true, eventsTracked: 0, rollupsUpserted: 0 };
  }

  try {
    const perChannel = new Map();
    details.forEach(({ channelType = 'unknown', deletedCount = 0, participantCount = 0, isOverride = false }) => {
      const key = channelType || 'unknown';
      if (!perChannel.has(key)) {
        perChannel.set(key, { deleted: 0, participants: 0, overrides: 0 });
      }
      const entry = perChannel.get(key);
      entry.deleted += Number.isFinite(Number(deletedCount)) ? Number(deletedCount) : 0;
      entry.participants += Number.isFinite(Number(participantCount)) ? Number(participantCount) : 0;
      if (isOverride) {
        entry.overrides += 1;
      }
    });

    const runDate = new Date();
    const rollupDate = new Date(Date.UTC(runDate.getUTCFullYear(), runDate.getUTCMonth(), runDate.getUTCDate()));
    const tasks = [];
    let rollups = 0;
    perChannel.forEach((stats, channelType) => {
      const dimensions = { channelType };
      const dimensionHash = `channel:${channelType}`;
      tasks.push(
        upsertDailyRollup({
          metricKey: RETENTION_DELETED_METRIC,
          date: rollupDate,
          dimensionHash,
          value: stats.deleted,
          dimensions,
        }),
      );
      tasks.push(
        upsertDailyRollup({
          metricKey: RETENTION_OVERRIDE_METRIC,
          date: rollupDate,
          dimensionHash,
          value: stats.overrides,
          dimensions,
        }),
      );
      tasks.push(
        upsertDailyRollup({
          metricKey: RETENTION_PARTICIPANTS_METRIC,
          date: rollupDate,
          dimensionHash,
          value: stats.participants,
          dimensions,
        }),
      );
      rollups += 3;
    });

    tasks.push(
      trackEvent({
        eventName: 'messaging_retention_cycle_completed',
        actorType: 'system',
        userId: null,
        source: 'messaging_retention_worker',
        context: {
          runId: summary.runId,
          totals: {
            totalDeleted: summary.totalDeleted ?? 0,
            threadsProcessed: summary.threadsProcessed ?? 0,
          },
          channels: Object.fromEntries(perChannel.entries()),
        },
      }),
    );

    await Promise.all(tasks);
    return { ok: true, eventsTracked: 1, rollupsUpserted: rollups };
  } catch (error) {
    logger?.error?.({ err: error, runId: summary.runId }, 'Failed to record messaging retention analytics');
    return { ok: false, error: error.message };
  }
}

export async function archiveExpiredRetentionAudits(
  { logger = baseLogger, limit = 500 } = {},
) {
  try {
    const now = new Date();
    const candidates = await MessageRetentionAudit.findAll({
      where: {
        retainedUntil: { [Op.lte]: now },
        archivedAt: null,
      },
      attributes: ['id'],
      limit,
    });

    if (!candidates.length) {
      return { ok: true, archived: 0 };
    }

    const ids = candidates.map((record) => record.id);
    await MessageRetentionAudit.update(
      { archivedAt: now },
      { where: { id: { [Op.in]: ids } } },
    );
    logger?.info?.({ archived: ids.length }, 'Archived expired messaging retention audits');
    return { ok: true, archived: ids.length };
  } catch (error) {
    logger?.error?.({ err: error }, 'Failed to archive messaging retention audits');
    return { ok: false, error: error.message };
  }
}

export async function purgeArchivedRetentionAudits(
  { logger = baseLogger, limit = 500 } = {},
) {
  try {
    const cutoff = new Date(Date.now() - RETENTION_AUDIT_PURGE_GRACE_DAYS * MILLIS_PER_DAY);
    const candidates = await MessageRetentionAudit.findAll({
      where: {
        archivedAt: { [Op.lt]: cutoff },
      },
      attributes: ['id'],
      limit,
    });

    if (!candidates.length) {
      return { ok: true, purged: 0 };
    }

    const ids = candidates.map((record) => record.id);
    const purged = await MessageRetentionAudit.destroy({ where: { id: { [Op.in]: ids } } });
    logger?.info?.({ purged }, 'Purged archived messaging retention audits');
    return { ok: true, purged };
  } catch (error) {
    logger?.error?.({ err: error }, 'Failed to purge archived messaging retention audits');
    return { ok: false, error: error.message };
  }
}

