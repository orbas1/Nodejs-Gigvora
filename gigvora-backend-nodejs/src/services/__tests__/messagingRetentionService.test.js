import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

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

const sequelizeTransactionMock = jest.fn(async (callback) => callback({}));

jest.unstable_mockModule('../models/messagingModels.js', () => ({
  MessageThread: { findAll: messageThreadFindAllMock, update: messageThreadUpdateMock },
  Message: {
    findAll: messageFindAllMock,
    findOne: messageFindOneMock,
    destroy: messageDestroyMock,
  },
  MessageAttachment: { destroy: attachmentDestroyMock },
  MessageReadReceipt: { destroy: receiptDestroyMock },
  sequelize: { transaction: sequelizeTransactionMock },
}));

jest.unstable_mockModule('../services/messagingService.js', () => ({
  listThreadParticipantUserIds: listParticipantIdsMock,
  invalidateThreadCaches: invalidateCachesMock,
}));

jest.unstable_mockModule('../events/messagingEvents.js', () => ({
  default: { emit: emitMock },
  MESSAGING_EVENTS: {
    MESSAGES_PURGED: 'messagesPurged',
  },
}));

let purgeExpiredMessages;

beforeEach(async () => {
  ({ purgeExpiredMessages } = await import('../messagingRetentionService.js'));
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
      { id: 10, retentionDays: 30 },
    ]);
    messageFindAllMock.mockResolvedValueOnce([
      { id: 1 },
      { id: 2 },
    ]);
    messageFindAllMock.mockResolvedValueOnce([]);
    messageFindOneMock.mockResolvedValue({ createdAt: new Date(now - 1000), body: 'Latest message' });
    listParticipantIdsMock.mockResolvedValue([7, 9]);

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
    expect(result.totalDeleted).toBe(2);
    expect(result.threadsProcessed).toBe(1);
    dateSpy.mockRestore();
  });

  it('skips threads without expired messages', async () => {
    messageThreadFindAllMock.mockResolvedValue([{ id: 11, retentionDays: 60 }]);
    messageFindAllMock.mockResolvedValue([]);

    const result = await purgeExpiredMessages({ batchSize: 10, logger: { info: jest.fn() } });

    expect(result.totalDeleted).toBe(0);
    expect(result.threadsProcessed).toBe(0);
    expect(messageDestroyMock).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });
});

