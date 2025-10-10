import { Op } from 'sequelize';
import {
  sequelize,
  MessageThread,
  MessageParticipant,
  Message,
  MessageAttachment,
  User,
  MESSAGE_CHANNEL_TYPES,
  MESSAGE_THREAD_STATES,
  MESSAGE_TYPES,
} from '../models/index.js';
import { ValidationError, NotFoundError, AuthorizationError } from '../utils/errors.js';
import { appCache, buildCacheKey } from '../utils/cache.js';

const THREAD_CACHE_TTL = 60;
const MESSAGE_CACHE_TTL = 15;

function normalizeMetadata(metadata, context) {
  if (metadata == null) return null;
  if (typeof metadata !== 'object') {
    throw new ValidationError(`${context} metadata must be an object.`);
  }
  return metadata;
}

function assertChannelType(channelType) {
  if (!MESSAGE_CHANNEL_TYPES.includes(channelType)) {
    throw new ValidationError(`Unsupported channel type "${channelType}".`);
  }
}

function assertThreadState(state) {
  if (!MESSAGE_THREAD_STATES.includes(state)) {
    throw new ValidationError(`Unsupported thread state "${state}".`);
  }
}

function assertMessageType(messageType) {
  if (!MESSAGE_TYPES.includes(messageType)) {
    throw new ValidationError(`Unsupported message type "${messageType}".`);
  }
}

function sanitizeParticipant(participant) {
  if (!participant) return null;
  const plain = participant.get({ plain: true });
  return {
    id: plain.id,
    threadId: plain.threadId,
    userId: plain.userId,
    role: plain.role,
    notificationsEnabled: plain.notificationsEnabled,
    mutedUntil: plain.mutedUntil,
    lastReadAt: plain.lastReadAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    user: participant.user
      ? {
          id: participant.user.id,
          firstName: participant.user.firstName,
          lastName: participant.user.lastName,
          email: participant.user.email,
        }
      : null,
  };
}

function sanitizeThread(thread) {
  if (!thread) return null;
  const plain = thread.get({ plain: true });
  return {
    id: plain.id,
    subject: plain.subject,
    channelType: plain.channelType,
    state: plain.state,
    createdBy: plain.createdBy,
    lastMessageAt: plain.lastMessageAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    metadata: plain.metadata && typeof plain.metadata === 'object'
      ? Object.fromEntries(Object.entries(plain.metadata).filter(([key]) => !/^(_|internal|private)/i.test(key)))
      : null,
    participants: Array.isArray(thread.participants) ? thread.participants.map((p) => sanitizeParticipant(p)) : undefined,
  };
}

function sanitizeAttachment(attachment) {
  if (!attachment) return null;
  const plain = attachment.get({ plain: true });
  return {
    id: plain.id,
    fileName: plain.fileName,
    mimeType: plain.mimeType,
    fileSize: Number(plain.fileSize ?? 0),
    storageKey: plain.storageKey,
  };
}

function sanitizeMessage(message) {
  if (!message) return null;
  const base = message.toPublicObject();
  return {
    ...base,
    attachments: Array.isArray(message.attachments)
      ? message.attachments.map((attachment) => sanitizeAttachment(attachment))
      : [],
    sender: message.sender
      ? {
          id: message.sender.id,
          firstName: message.sender.firstName,
          lastName: message.sender.lastName,
          email: message.sender.email,
        }
      : null,
  };
}

function flushThreadCache(threadId) {
  appCache.flushByPrefix('messaging:threads:list');
  if (threadId) {
    appCache.delete(`messaging:thread:${threadId}`);
    appCache.flushByPrefix(`messaging:messages:${threadId}`);
  }
}

async function ensureParticipant(threadId, userId, trx) {
  const participant = await MessageParticipant.findOne({
    where: { threadId, userId },
    transaction: trx,
    lock: trx ? trx.LOCK.UPDATE : undefined,
    include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
  });
  if (!participant) {
    throw new AuthorizationError('User is not a participant in this thread.');
  }
  return participant;
}

export async function createThread({ subject, channelType = 'direct', createdBy, participantIds = [], metadata = {} }) {
  if (!createdBy) {
    throw new ValidationError('createdBy is required to open a thread.');
  }
  assertChannelType(channelType);
  const normalizedMetadata = normalizeMetadata(metadata, 'Thread');

  const uniqueParticipantIds = Array.from(new Set([createdBy, ...participantIds])).filter(Boolean);
  if (uniqueParticipantIds.length === 0) {
    throw new ValidationError('At least one participant must be provided.');
  }

  const thread = await sequelize.transaction(async (trx) => {
    const createdThread = await MessageThread.create(
      {
        subject: subject?.trim() || null,
        channelType,
        state: 'active',
        createdBy,
        metadata: normalizedMetadata,
      },
      { transaction: trx },
    );

    const users = await User.findAll({
      where: { id: uniqueParticipantIds },
      attributes: ['id', 'firstName', 'lastName', 'email'],
      transaction: trx,
    });

    await Promise.all(
      users.map((user) =>
        MessageParticipant.create(
          {
            threadId: createdThread.id,
            userId: user.id,
            role: user.id === createdBy ? 'owner' : 'participant',
          },
          { transaction: trx },
        ),
      ),
    );
    return createdThread;
  });

  flushThreadCache(thread.id);

  const hydrated = await MessageThread.findByPk(thread.id, {
    include: [
      {
        model: MessageParticipant,
        as: 'participants',
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      },
    ],
  });

  return sanitizeThread(hydrated ?? thread);
}

export async function appendMessage(threadId, senderId, { messageType = 'text', body, attachments = [], metadata = {} }) {
  assertMessageType(messageType);
  const normalizedMetadata = normalizeMetadata(metadata, 'Message');

  const message = await sequelize.transaction(async (trx) => {
    const thread = await MessageThread.findByPk(threadId, { transaction: trx, lock: trx.LOCK.UPDATE });
    if (!thread) {
      throw new NotFoundError('Thread not found.');
    }
    if (thread.state === 'locked') {
      throw new AuthorizationError('Thread is locked and cannot accept new messages.');
    }

    await ensureParticipant(threadId, senderId, trx);

    const createdMessage = await Message.create(
      {
        threadId,
        senderId,
        messageType,
        body: messageType === 'text' ? body?.trim() ?? '' : null,
        metadata: normalizedMetadata,
        deliveredAt: new Date(),
      },
      { transaction: trx },
    );

    if (Array.isArray(attachments) && attachments.length > 0) {
      await Promise.all(
        attachments.slice(0, 5).map((attachment, index) => {
          if (!attachment || typeof attachment !== 'object') {
            throw new ValidationError(`Attachment at index ${index} is invalid.`);
          }
          const { fileName, mimeType, storageKey, fileSize } = attachment;
          if (!fileName || !storageKey) {
            throw new ValidationError(`Attachment at index ${index} requires fileName and storageKey.`);
          }
          return MessageAttachment.create(
            {
              messageId: createdMessage.id,
              fileName,
              mimeType: mimeType ?? 'application/octet-stream',
              storageKey,
              fileSize: Number.isFinite(Number(fileSize)) ? Number(fileSize) : 0,
            },
            { transaction: trx },
          );
        }),
      );
    }

    thread.lastMessageAt = new Date();
    await thread.save({ transaction: trx });

    return createdMessage;
  });

  flushThreadCache(threadId);

  const hydrated = await Message.findByPk(message.id, {
    include: [
      { model: MessageAttachment, as: 'attachments' },
      { model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
  });

  return sanitizeMessage(hydrated ?? message);
}

export async function listMessages(threadId, pagination = {}, { includeSystem = false } = {}) {
  const { page = 1, pageSize = 50 } = pagination;
  const safePage = Math.max(Number(page) || 1, 1);
  const safeSize = Math.min(Math.max(Number(pageSize) || 50, 1), 200);
  const offset = (safePage - 1) * safeSize;

  const cacheKey = buildCacheKey(`messaging:messages:${threadId}`, {
    page: safePage,
    pageSize: safeSize,
    includeSystem,
  });

  return appCache.remember(cacheKey, MESSAGE_CACHE_TTL, async () => {
    const where = { threadId };
    if (!includeSystem) {
      where.messageType = { [Op.ne]: 'system' };
    }

    const { rows, count } = await Message.findAndCountAll({
      where,
      order: [['createdAt', 'ASC']],
      limit: safeSize,
      offset,
      include: [
        { model: MessageAttachment, as: 'attachments' },
        { model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    return {
      data: rows.map((message) => sanitizeMessage(message)),
      pagination: {
        page: safePage,
        pageSize: safeSize,
        total: count,
        totalPages: Math.ceil(count / safeSize) || 1,
      },
    };
  });
}

export async function getThread(threadId, { withParticipants = false } = {}) {
  const cacheKey = `messaging:thread:${threadId}:${withParticipants ? 'withParticipants' : 'base'}`;
  return appCache.remember(cacheKey, THREAD_CACHE_TTL, async () => {
    const thread = await MessageThread.findByPk(threadId, {
      include: withParticipants
        ? [
            {
              model: MessageParticipant,
              as: 'participants',
              include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
            },
          ]
        : [],
    });

    if (!thread) {
      throw new NotFoundError('Thread not found.');
    }

    return sanitizeThread(thread);
  });
}

export async function markThreadRead(threadId, userId) {
  await sequelize.transaction(async (trx) => {
    const participant = await ensureParticipant(threadId, userId, trx);
    participant.lastReadAt = new Date();
    await participant.save({ transaction: trx });
  });

  flushThreadCache(threadId);
  return { success: true };
}

export async function updateThreadState(threadId, state) {
  assertThreadState(state);

  await sequelize.transaction(async (trx) => {
    const thread = await MessageThread.findByPk(threadId, { transaction: trx, lock: trx.LOCK.UPDATE });
    if (!thread) {
      throw new NotFoundError('Thread not found.');
    }

    thread.state = state;
    await thread.save({ transaction: trx });
  });

  flushThreadCache(threadId);
  return getThread(threadId, { withParticipants: true });
}

export async function muteThread(threadId, userId, until) {
  await sequelize.transaction(async (trx) => {
    const participant = await ensureParticipant(threadId, userId, trx);
    participant.mutedUntil = until ?? new Date(Date.now() + 60 * 60 * 1000);
    participant.notificationsEnabled = false;
    await participant.save({ transaction: trx });
  });

  flushThreadCache(threadId);
  return { success: true };
}

export default {
  createThread,
  appendMessage,
  listMessages,
  getThread,
  markThreadRead,
  updateThreadState,
  muteThread,
};
