import { Op } from 'sequelize';
import {
  MessageThread,
  Message,
  MessageAttachment,
  MessageReadReceipt,
  sequelize,
} from '../models/messagingModels.js';
import {
  listThreadParticipantUserIds,
  invalidateThreadCaches,
} from './messagingService.js';
import messagingEvents, { MESSAGING_EVENTS } from '../events/messagingEvents.js';
import baseLogger from '../utils/logger.js';

const MILLIS_PER_DAY = 24 * 60 * 60 * 1_000;
const DEFAULT_BATCH_SIZE = 200;
const DEFAULT_MAX_THREADS = 100;

export async function purgeExpiredMessages({
  logger = baseLogger,
  batchSize = DEFAULT_BATCH_SIZE,
  maxThreads = DEFAULT_MAX_THREADS,
} = {}) {
  const log = logger?.child?.({ component: 'messaging-retention' }) ?? logger;
  const threads = await MessageThread.findAll({
    where: {
      retentionDays: { [Op.gt]: 0 },
    },
    attributes: ['id', 'retentionDays'],
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
    const cutoff = new Date(Date.now() - retentionDays * MILLIS_PER_DAY);
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

    if (deletedIds.length > 0) {
      threadsProcessed += 1;
      const participantIds = await listThreadParticipantUserIds(thread.id);
      invalidateThreadCaches(thread.id, participantIds);
      messagingEvents.emit(MESSAGING_EVENTS.MESSAGES_PURGED, {
        threadId: thread.id,
        deletedIds,
        cutoff: cutoff.toISOString(),
      });
      details.push({ threadId: thread.id, deletedCount: deletedIds.length, cutoff: cutoff.toISOString() });
      log?.info?.(
        { threadId: thread.id, deletedCount: deletedIds.length, cutoff: cutoff.toISOString() },
        'Purged expired messages for thread',
      );
    }
  }

  return { totalDeleted, threadsProcessed, details };
}

let workerTimer = null;
const workerStatus = {
  lastRunAt: null,
  lastResult: null,
  running: false,
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
      workerStatus.lastResult = { ok: true, ...result };
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

