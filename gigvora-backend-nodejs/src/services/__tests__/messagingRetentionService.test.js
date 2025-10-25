import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = join(TEST_DIR, '..', '..');

const messageThreadUpdateMock = jest.fn();
const messageThreadFindAllMock = jest.fn();
const messageFindAllMock = jest.fn();
const messageFindOneMock = jest.fn();
const messageDestroyMock = jest.fn();
const attachmentDestroyMock = jest.fn();
const receiptDestroyMock = jest.fn();
const listParticipantIdsMock = jest.fn();
const invalidateCachesMock = jest.fn();
const emitMock = jest.fn();
const auditCreateMock = jest.fn();
const auditFindAllMock = jest.fn();
const auditUpdateMock = jest.fn();
const auditDestroyMock = jest.fn();
const trackEventMock = jest.fn();
const upsertDailyRollupMock = jest.fn();

const sequelizeTransactionMock = jest.fn(async (callback) => callback({}));

jest.unstable_mockModule(join(SRC_ROOT, 'models/messagingModels.js'), () => ({
  MessageThread: { findAll: messageThreadFindAllMock, update: messageThreadUpdateMock },
  Message: {
    findAll: messageFindAllMock,
    findOne: messageFindOneMock,
    destroy: messageDestroyMock,
  },
  MessageAttachment: { destroy: attachmentDestroyMock },
  MessageReadReceipt: { destroy: receiptDestroyMock },
  MessageRetentionAudit: {
    create: auditCreateMock,
    findAll: auditFindAllMock,
    update: auditUpdateMock,
    destroy: auditDestroyMock,
  },
  sequelize: { transaction: sequelizeTransactionMock },
}));

jest.unstable_mockModule(join(SRC_ROOT, 'services/messagingService.js'), () => ({
  listThreadParticipantUserIds: listParticipantIdsMock,
  invalidateThreadCaches: invalidateCachesMock,
}));

jest.unstable_mockModule(join(SRC_ROOT, 'events/messagingEvents.js'), () => ({
  default: { emit: emitMock },
  MESSAGING_EVENTS: {
    MESSAGES_PURGED: 'messagesPurged',
    RETENTION_AUDIT_RECORDED: 'retentionAuditRecorded',
  },
}));

jest.unstable_mockModule(join(SRC_ROOT, 'services/analyticsService.js'), () => ({
  trackEvent: trackEventMock,
  upsertDailyRollup: upsertDailyRollupMock,
}));

let purgeExpiredMessages;
let recordRetentionAnalytics;
let archiveExpiredRetentionAudits;
let purgeArchivedRetentionAudits;

beforeEach(async () => {
  ({
    purgeExpiredMessages,
    recordRetentionAnalytics,
    archiveExpiredRetentionAudits,
    purgeArchivedRetentionAudits,
  } = await import('../messagingRetentionService.js'));
  jest.useFakeTimers();
});

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  jest.useRealTimers();
});

describe('messagingRetentionService.purgeExpiredMessages', () => {
  it('purges messages older than retention cutoff and emits events', async () => {
    const now = Date.now();
    const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(now);
    messageThreadFindAllMock.mockResolvedValue([
      { id: 10, retentionDays: 30, channelType: 'direct', retentionPolicy: 'standard_18_month' },
    ]);
    messageFindAllMock.mockResolvedValueOnce([
      { id: 1 },
      { id: 2 },
    ]);
    messageFindAllMock.mockResolvedValueOnce([]);
    messageFindOneMock.mockResolvedValue({ createdAt: new Date(now - 1000), body: 'Latest message' });
    listParticipantIdsMock.mockResolvedValue([7, 9]);
    auditCreateMock.mockResolvedValue({ id: 44 });

    const result = await purgeExpiredMessages({ batchSize: 10, maxThreads: 5, logger: { info: jest.fn() } });

    expect(sequelizeTransactionMock).toHaveBeenCalled();
    expect(attachmentDestroyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ messageId: expect.any(Object) }), transaction: expect.any(Object) }),
    );
    expect(receiptDestroyMock).toHaveBeenCalled();
    expect(messageDestroyMock).toHaveBeenCalledWith(
      expect.objectContaining({ force: true, where: expect.objectContaining({ id: expect.any(Object) }), transaction: expect.any(Object) }),
    );
    expect(messageThreadUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ lastMessageAt: expect.any(Date) }),
      expect.objectContaining({ where: { id: 10 } }),
    );
    expect(listParticipantIdsMock).toHaveBeenCalledWith(10);
    expect(invalidateCachesMock).toHaveBeenCalledWith(10, [7, 9]);
    expect(emitMock).toHaveBeenCalledWith('messagesPurged', expect.objectContaining({ threadId: 10, deletedIds: [1, 2] }));
    expect(emitMock).toHaveBeenCalledWith('retentionAuditRecorded', expect.objectContaining({ auditId: 44, threadId: 10 }));
    expect(auditCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        threadId: 10,
        retentionPolicy: 'standard_18_month',
        retainedUntil: expect.any(Date),
      }),
    );
    expect(result.totalDeleted).toBe(2);
    expect(result.threadsProcessed).toBe(1);
    dateSpy.mockRestore();
  });

  it('skips threads without expired messages', async () => {
    messageThreadFindAllMock.mockResolvedValue([
      { id: 11, retentionDays: 548, channelType: 'direct', retentionPolicy: 'standard_18_month' },
    ]);
    messageFindAllMock.mockResolvedValue([]);

    const result = await purgeExpiredMessages({ batchSize: 10, logger: { info: jest.fn() } });

    expect(result.totalDeleted).toBe(0);
    expect(result.threadsProcessed).toBe(0);
    expect(messageDestroyMock).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });
});

describe('messagingRetentionService.recordRetentionAnalytics', () => {
  it('records analytics events and rollups per channel', async () => {
    upsertDailyRollupMock.mockResolvedValue({});
    trackEventMock.mockResolvedValue({});
    const summary = {
      runId: 'run-1',
      totalDeleted: 5,
      threadsProcessed: 2,
      details: [
        { channelType: 'direct', deletedCount: 3, participantCount: 4, isOverride: false },
        { channelType: 'direct', deletedCount: 2, participantCount: 3, isOverride: true },
        { channelType: 'support', deletedCount: 0, participantCount: 1, isOverride: true },
      ],
    };

    const result = await recordRetentionAnalytics(summary, { logger: { error: jest.fn() } });

    expect(upsertDailyRollupMock).toHaveBeenCalledWith(
      expect.objectContaining({
        metricKey: 'messaging.retention.deleted',
        dimensions: { channelType: 'direct' },
        value: 5,
      }),
    );
    expect(upsertDailyRollupMock).toHaveBeenCalledWith(
      expect.objectContaining({
        metricKey: 'messaging.retention.overrides',
        dimensions: { channelType: 'direct' },
        value: 1,
      }),
    );
    expect(upsertDailyRollupMock).toHaveBeenCalledWith(
      expect.objectContaining({
        metricKey: 'messaging.retention.participants',
        dimensions: { channelType: 'direct' },
        value: 7,
      }),
    );
    expect(trackEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'messaging_retention_cycle_completed',
        context: expect.objectContaining({
          runId: 'run-1',
          totals: expect.objectContaining({ totalDeleted: 5, threadsProcessed: 2 }),
          channels: expect.objectContaining({
            direct: expect.objectContaining({ deleted: 5, overrides: 1, participants: 7 }),
            support: expect.objectContaining({ overrides: 1 }),
          }),
        }),
      }),
    );
    expect(result).toEqual(expect.objectContaining({ ok: true, eventsTracked: 1, rollupsUpserted: 6 }));
  });

  it('skips analytics when no details were produced', async () => {
    const result = await recordRetentionAnalytics({ runId: 'empty', details: [] });

    expect(result).toEqual({ ok: true, eventsTracked: 0, rollupsUpserted: 0 });
    expect(trackEventMock).not.toHaveBeenCalled();
    expect(upsertDailyRollupMock).not.toHaveBeenCalled();
  });
});

describe('messagingRetentionService.archiveExpiredRetentionAudits', () => {
  it('archives expired audits and logs count', async () => {
    const logger = { info: jest.fn(), error: jest.fn() };
    auditFindAllMock.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);
    auditUpdateMock.mockResolvedValue([2]);

    const result = await archiveExpiredRetentionAudits({ logger, limit: 50 });

    expect(auditUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ archivedAt: expect.any(Date) }),
      expect.objectContaining({ where: expect.objectContaining({ id: expect.any(Object) }) }),
    );
    expect(result).toEqual({ ok: true, archived: 2 });
  });

  it('returns zero when nothing is ready to archive', async () => {
    auditFindAllMock.mockResolvedValueOnce([]);

    const result = await archiveExpiredRetentionAudits({ logger: { info: jest.fn(), error: jest.fn() } });

    expect(result).toEqual({ ok: true, archived: 0 });
    expect(auditUpdateMock).not.toHaveBeenCalled();
  });
});

describe('messagingRetentionService.purgeArchivedRetentionAudits', () => {
  it('purges archived audits after grace period', async () => {
    const logger = { info: jest.fn(), error: jest.fn() };
    auditFindAllMock.mockResolvedValueOnce([{ id: 10 }, { id: 11 }]);
    auditDestroyMock.mockResolvedValue(2);

    const result = await purgeArchivedRetentionAudits({ logger, limit: 25 });

    expect(auditDestroyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: expect.any(Object) }) }),
    );
    expect(result).toEqual({ ok: true, purged: 2 });
  });

  it('returns zero when no archived audits are ready', async () => {
    auditFindAllMock.mockResolvedValueOnce([]);

    const result = await purgeArchivedRetentionAudits({ logger: { info: jest.fn(), error: jest.fn() } });

    expect(result).toEqual({ ok: true, purged: 0 });
    expect(auditDestroyMock).not.toHaveBeenCalled();
  });
});

