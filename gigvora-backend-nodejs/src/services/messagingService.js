import { randomUUID } from 'crypto';
import { Op } from 'sequelize';
import {
  sequelize,
  MessageThread,
  MessageParticipant,
  Message,
  MessageAttachment,
  MessageLabel,
  MessageThreadLabel,
  SupportCase,
  User,
  MESSAGE_CHANNEL_TYPES,
  MESSAGE_THREAD_STATES,
  MESSAGE_TYPES,
  SUPPORT_CASE_STATUSES,
  SUPPORT_CASE_PRIORITIES,
} from '../models/messagingModels.js';
import { ApplicationError, ValidationError, NotFoundError, AuthorizationError } from '../utils/errors.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
let notificationServicePromise = null;
let userRoleModelPromise = null;

async function loadNotificationService() {
  if (!notificationServicePromise) {
    notificationServicePromise = import('./notificationService.js').catch(() => null);
  }
  const module = await notificationServicePromise;
  if (!module) {
    return null;
  }
  return module.default ?? module;
}

async function loadUserRoleModel() {
  if (!userRoleModelPromise) {
    userRoleModelPromise = import('../models/index.js')
      .then((module) => {
        if (!module?.UserRole) {
          throw new ApplicationError('UserRole model is unavailable.');
        }
        return module.UserRole;
      })
      .catch((error) => {
        userRoleModelPromise = null;
        throw error;
      });
  }

  return userRoleModelPromise;
}
import { createCallTokens, getDefaultAgoraExpiry } from './agoraService.js';

const THREAD_CACHE_TTL = 60;
const MESSAGE_CACHE_TTL = 15;
const INBOX_CACHE_TTL = 30;
const LABEL_CACHE_TTL = 60;
const SUPPORT_ESCALATION_NOTIFY_USER_IDS = (process.env.SUPPORT_ESCALATION_NOTIFY_USER_IDS ?? '')
  .split(',')
  .map((value) => Number.parseInt(value.trim(), 10))
  .filter((value) => Number.isInteger(value));
const SHOULD_QUEUE_SUPPORT_NOTIFICATIONS =
  String(process.env.SUPPRESS_SUPPORT_NOTIFICATIONS ?? '').toLowerCase() !== 'true' &&
  process.env.NODE_ENV !== 'test';

function toNormalizedList(value, fallback = []) {
  if (Array.isArray(value)) {
    return value.map((entry) => entry?.toString().trim().toLowerCase()).filter(Boolean);
  }
  if (!value) {
    return [...fallback];
  }
  return value
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

const SUPPORT_AGENT_ROLE_NAMES = new Set(
  toNormalizedList(process.env.SUPPORT_AGENT_ROLES, ['support_agent', 'support_lead']),
);
const SUPPORT_AGENT_USER_TYPES = new Set(
  toNormalizedList(process.env.SUPPORT_AGENT_USER_TYPES, ['admin']),
);

async function ensureSupportAgentPermissions(agent, transaction) {
  if (!agent?.id) {
    throw new ValidationError('Assigned agent does not exist.');
  }

  const normalizedType = agent.userType ? agent.userType.toString().trim().toLowerCase() : null;
  if (normalizedType && SUPPORT_AGENT_USER_TYPES.has(normalizedType)) {
    return true;
  }

  const UserRole = await loadUserRoleModel();
  const roleAssignments = await UserRole.findAll({
    where: { userId: agent.id },
    transaction,
    attributes: ['role'],
  });

  const hasAuthorizedRole = roleAssignments.some((assignment) => {
    const normalizedRole = assignment?.role ? assignment.role.toString().trim().toLowerCase() : null;
    return normalizedRole ? SUPPORT_AGENT_ROLE_NAMES.has(normalizedRole) : false;
  });

  if (!hasAuthorizedRole) {
    throw new AuthorizationError('Assigned agent is not authorized for support operations.');
  }

  return true;
}

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

function assertSupportStatus(status) {
  if (!SUPPORT_CASE_STATUSES.includes(status)) {
    throw new ValidationError(`Unsupported support status "${status}".`);
  }
}

function assertSupportPriority(priority) {
  if (!SUPPORT_CASE_PRIORITIES.includes(priority)) {
    throw new ValidationError(`Unsupported support priority "${priority}".`);
  }
}

function slugifyLabelName(name) {
  return name
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function normalizeLabelColor(color) {
  if (!color) {
    return '#0f172a';
  }
  const trimmed = color.toString().trim();
  if (!trimmed) {
    return '#0f172a';
  }
  const prefixed = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  const sanitized = prefixed.replace(/[^#a-fA-F0-9]/g, '').slice(0, 9);
  if (!/^#[0-9a-fA-F]{3,8}$/.test(sanitized)) {
    return '#0f172a';
  }
  return sanitized.toLowerCase();
}

function sanitizeLabel(label) {
  if (!label) return null;
  const plain = label.get ? label.get({ plain: true }) : label;
  return {
    id: plain.id,
    name: plain.name,
    slug: plain.slug,
    color: plain.color,
    description: plain.description,
    createdBy: plain.createdBy,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function buildLabelCacheKey(workspaceId, search) {
  const normalizedWorkspaceId = Number(workspaceId) || 0;
  const tokenBase = search ? slugifyLabelName(search) : 'all';
  const token = tokenBase || 'search';
  return `messaging:labels:${normalizedWorkspaceId}:${token}`;
}

export function sanitizeParticipant(participant) {
  if (!participant) return null;
  const plain = participant.get ? participant.get({ plain: true }) : participant;
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

export function sanitizeThread(thread) {
  if (!thread) return null;
  const plain = thread.get ? thread.get({ plain: true }) : thread;
  const participantsSource = thread.participants ?? plain.participants;
  const labelsSource = thread.labels ?? plain.labels;
  const supportCaseSource = thread.supportCase ?? plain.supportCase;
  return {
    id: plain.id,
    subject: plain.subject,
    channelType: plain.channelType,
    state: plain.state,
    createdBy: plain.createdBy,
    lastMessageAt: plain.lastMessageAt,
    lastMessagePreview: plain.lastMessagePreview,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    metadata: plain.metadata && typeof plain.metadata === 'object'
      ? Object.fromEntries(Object.entries(plain.metadata).filter(([key]) => !/^(_|internal|private)/i.test(key)))
      : null,
    participants: Array.isArray(participantsSource)
      ? participantsSource.map((p) => sanitizeParticipant(p))
      : undefined,
    labels: Array.isArray(labelsSource)
      ? labelsSource.map((label) => sanitizeLabel(label))
      : undefined,
    supportCase: supportCaseSource ? sanitizeSupportCase(supportCaseSource) : undefined,
  };
}

function sanitizeAttachment(attachment) {
  if (!attachment) return null;
  const plain = attachment.get ? attachment.get({ plain: true }) : attachment;
  const rawFileSize = plain.fileSize ?? 0;
  let normalizedFileSize;
  if (typeof rawFileSize === 'bigint') {
    normalizedFileSize = Number(rawFileSize);
  } else if (typeof rawFileSize === 'number') {
    normalizedFileSize = rawFileSize;
  } else {
    const parsed = Number.parseInt(rawFileSize, 10);
    normalizedFileSize = Number.isNaN(parsed) ? 0 : parsed;
  }

  return {
    id: plain.id,
    fileName: plain.fileName,
    mimeType: plain.mimeType,
    fileSize: normalizedFileSize,
    storageKey: plain.storageKey,
    checksum: plain.checksum ?? null,
  };
}

export function sanitizeMessage(message) {
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

function scheduleAutoReplies(threadId, message, senderId) {
  if (!message || !message.id) return;
  if (message.messageType !== 'text') return;
  const body = typeof message.body === 'string' ? message.body.trim() : '';
  if (!body) return;
  if (message.metadata && typeof message.metadata === 'object' && message.metadata.autoReply) return;

  import('./aiAutoReplyService.js')
    .then((module) =>
      module.enqueueAutoReplies?.({ threadId, messageId: message.id, senderId }),
    )
    .catch(() => {});
}

export function sanitizeSupportCase(supportCase) {
  if (!supportCase) return null;
  const plain = supportCase.get ? supportCase.get({ plain: true }) : supportCase;
  const sanitizedMetadata = plain.metadata && typeof plain.metadata === 'object'
    ? Object.fromEntries(Object.entries(plain.metadata).filter(([key]) => !/^(_|internal|private)/i.test(key)))
    : null;

  return {
    id: plain.id,
    threadId: plain.threadId,
    status: plain.status,
    priority: plain.priority,
    reason: plain.reason,
    metadata: sanitizedMetadata,
    escalatedBy: plain.escalatedBy,
    escalatedAt: plain.escalatedAt,
    assignedTo: plain.assignedTo,
    assignedBy: plain.assignedBy,
    assignedAt: plain.assignedAt,
    firstResponseAt: plain.firstResponseAt,
    resolvedAt: plain.resolvedAt,
    resolvedBy: plain.resolvedBy,
    resolutionSummary: plain.resolutionSummary,
    escalatedByUser: supportCase.escalatedByUser
      ? {
          id: supportCase.escalatedByUser.id,
          firstName: supportCase.escalatedByUser.firstName,
          lastName: supportCase.escalatedByUser.lastName,
          email: supportCase.escalatedByUser.email,
        }
      : null,
    assignedAgent: supportCase.assignedAgent
      ? {
          id: supportCase.assignedAgent.id,
          firstName: supportCase.assignedAgent.firstName,
          lastName: supportCase.assignedAgent.lastName,
          email: supportCase.assignedAgent.email,
        }
      : null,
    resolvedByUser: supportCase.resolvedByUser
      ? {
          id: supportCase.resolvedByUser.id,
          firstName: supportCase.resolvedByUser.firstName,
          lastName: supportCase.resolvedByUser.lastName,
          email: supportCase.resolvedByUser.email,
        }
      : null,
  };
}

const CALL_TYPE_NORMALIZED = new Map([
  ['video', 'video'],
  ['voice', 'voice'],
  ['audio', 'voice'],
  ['phone', 'voice'],
  ['telephony', 'voice'],
  ['call', 'voice'],
]);

function normalizeCallType(callType) {
  const fallback = 'video';
  if (!callType) {
    return fallback;
  }
  const normalized = String(callType).trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }
  const mapped = CALL_TYPE_NORMALIZED.get(normalized) || CALL_TYPE_NORMALIZED.get(normalized.replace(/[-_\s]/g, ''));
  if (mapped) {
    return mapped;
  }
  if (normalized === 'video-call' || normalized === 'videocall') {
    return 'video';
  }
  throw new ValidationError(`Unsupported call type "${callType}". Use "video" or "voice".`);
}

function buildCallChannelName(threadId, callId) {
  return `gigvora:thread:${threadId}:call:${callId}`;
}

function isCallExpired(callMetadata) {
  if (!callMetadata?.expiresAt) {
    return false;
  }
  const expiresAt = new Date(callMetadata.expiresAt);
  if (Number.isNaN(expiresAt.getTime())) {
    return false;
  }
  return expiresAt.getTime() < Date.now();
}

async function findCallMessageRecord(threadId, callId) {
  if (!callId) {
    return null;
  }

  const records = await Message.findAll({
    where: { threadId, messageType: 'event' },
    order: [['createdAt', 'DESC']],
    limit: 50,
  });

  for (const record of records) {
    const metadata = record.metadata;
    if (metadata && typeof metadata === 'object') {
      const callMetadata = metadata.call;
      if (callMetadata && String(callMetadata.id) === String(callId)) {
        return record;
      }
    }
  }

  return null;
}

async function loadMessageById(messageId) {
  if (!messageId) {
    return null;
  }
  const record = await Message.findByPk(messageId, {
    include: [
      { model: MessageAttachment, as: 'attachments' },
      { model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
  });
  return record ? sanitizeMessage(record) : null;
}

async function recordCallParticipantJoin(messageId, threadId, userId) {
  if (!messageId || !userId) {
    return;
  }

  let updated = false;
  await sequelize.transaction(async (trx) => {
    const message = await Message.findByPk(messageId, { transaction: trx, lock: trx.LOCK.UPDATE });
    if (!message) {
      return;
    }

    const metadata = message.metadata && typeof message.metadata === 'object' ? { ...message.metadata } : {};
    const callMetadata = metadata.call && typeof metadata.call === 'object' ? { ...metadata.call } : {};
    const participants = Array.isArray(callMetadata.participants) ? [...callMetadata.participants] : [];
    const hasParticipant = participants.some((participant) => Number(participant?.userId) === Number(userId));

    if (!hasParticipant) {
      const entry = { userId, joinedAt: new Date().toISOString() };
      participants.push(entry);
      callMetadata.participants = participants.slice(-25);
      callMetadata.lastJoinedAt = entry.joinedAt;
      updated = true;
    }

    if (!callMetadata.channelName) {
      const effectiveId = callMetadata.id ?? message.id;
      callMetadata.channelName = buildCallChannelName(threadId, effectiveId);
      updated = true;
    }

    if (updated) {
      metadata.call = callMetadata;
      await message.update({ metadata }, { transaction: trx });
    }
  });

  if (updated) {
    flushThreadCache(threadId);
  }
}

async function createSystemMessage(threadId, body, metadata = {}, trx) {
  const normalized = normalizeMetadata(
    {
      ...(metadata && typeof metadata === 'object' ? metadata : {}),
      category: 'support',
    },
    'Message',
  );

  await Message.create(
    {
      threadId,
      senderId: null,
      messageType: 'system',
      body: body?.trim() || 'Support update',
      metadata: normalized,
      deliveredAt: new Date(),
    },
    { transaction: trx },
  );

  if (trx) {
    await MessageThread.update({ lastMessageAt: new Date() }, { where: { id: threadId }, transaction: trx });
  } else {
    const thread = await MessageThread.findByPk(threadId);
    if (thread) {
      thread.lastMessageAt = new Date();
      await thread.save();
    }
  }
}

async function queueSupportNotification(payload, options) {
  if (!SHOULD_QUEUE_SUPPORT_NOTIFICATIONS) {
    return;
  }

  try {
    const notificationService = await loadNotificationService();
    if (!notificationService) {
      return;
    }

    const target =
      typeof notificationService.queueSupportNotification === 'function'
        ? notificationService.queueSupportNotification.bind(notificationService)
        : typeof notificationService.queueNotification === 'function'
        ? notificationService.queueNotification.bind(notificationService)
        : null;

    if (target) {
      await target(
        {
          category: 'support',
          priority: 'high',
          ...payload,
        },
        options,
      );
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('Failed to queue support notification', error);
    }
  }
}

function flushThreadCache(threadId, participantIds = []) {
  appCache.flushByPrefix('messaging:threads:list');
  if (threadId) {
    appCache.delete(`messaging:thread:${threadId}`);
    appCache.flushByPrefix(`messaging:messages:${threadId}`);
  }
  if (Array.isArray(participantIds)) {
    participantIds.filter(Boolean).forEach((userId) => {
      appCache.flushByPrefix(`messaging:inbox:${userId}`);
    });
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

async function getParticipantUserIds(threadId, trx) {
  const participants = await MessageParticipant.findAll({
    where: { threadId },
    transaction: trx,
    attributes: ['userId'],
  });
  return participants.map((participant) => participant.userId);
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

  const hydrated = await MessageThread.findByPk(thread.id, {
    include: [
      {
        model: MessageParticipant,
        as: 'participants',
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      },
      { model: SupportCase, as: 'supportCase', include: [{ model: User, as: 'assignedAgent' }, { model: User, as: 'escalatedByUser' }, { model: User, as: 'resolvedByUser' }] },
    ],
  });

  flushThreadCache(thread.id, uniqueParticipantIds);

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

  const hydrated = await Message.findByPk(message.id, {
    include: [
      { model: MessageAttachment, as: 'attachments' },
      { model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
  });

  const participants = await MessageParticipant.findAll({ where: { threadId }, attributes: ['userId'] });
  flushThreadCache(
    threadId,
    participants.map((participant) => participant.userId),
  );

  const sanitized = sanitizeMessage(hydrated ?? message);
  scheduleAutoReplies(threadId, sanitized, senderId);
  return sanitized;
}

export async function startOrJoinCall(
  threadId,
  userId,
  { callType = 'video', callId, role = 'publisher' } = {},
) {
  if (!Number.isFinite(threadId) || threadId <= 0) {
    throw new ValidationError('threadId must be a positive integer.');
  }
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new ValidationError('userId must be a positive integer.');
  }

  await ensureParticipant(threadId, userId);

  const normalizedCallType = normalizeCallType(callType);
  const identity = String(userId);
  const ttlSeconds = getDefaultAgoraExpiry();

  let resolvedCallId = callId ? String(callId) : null;
  let callMessageRecord = null;
  let sanitizedCallMessage = null;
  let isNew = false;

  if (resolvedCallId) {
    callMessageRecord = await findCallMessageRecord(threadId, resolvedCallId);
    if (!callMessageRecord) {
      throw new NotFoundError('Call session not found for this thread.');
    }
    sanitizedCallMessage = sanitizeMessage(callMessageRecord);
  } else {
    resolvedCallId = randomUUID();
    const channelName = buildCallChannelName(threadId, resolvedCallId);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000).toISOString();
    const metadata = {
      eventType: 'call',
      call: {
        id: resolvedCallId,
        type: normalizedCallType,
        channelName,
        initiatedBy: userId,
        initiatedAt: now.toISOString(),
        expiresAt,
        participants: [{ userId, joinedAt: now.toISOString() }],
      },
    };
    const body = normalizedCallType === 'video' ? 'Video call started' : 'Voice call started';
    sanitizedCallMessage = await appendMessage(threadId, userId, {
      messageType: 'event',
      body,
      metadata,
    });
    callMessageRecord = await Message.findByPk(sanitizedCallMessage.id);
    isNew = true;
  }

  const callMetadata =
    callMessageRecord?.metadata?.call ?? sanitizedCallMessage?.metadata?.call ?? { type: normalizedCallType };

  if (isCallExpired(callMetadata)) {
    throw new ValidationError('Call session has expired. Start a new call.');
  }

  const channelName = callMetadata.channelName ?? buildCallChannelName(threadId, resolvedCallId);
  const tokens = createCallTokens({ channelName, identity, role, expireSeconds: ttlSeconds });

  await recordCallParticipantJoin(callMessageRecord?.id ?? sanitizedCallMessage?.id ?? null, threadId, userId);
  const hydratedMessage = await loadMessageById(callMessageRecord?.id ?? sanitizedCallMessage?.id ?? null);

  return {
    threadId,
    callId: resolvedCallId,
    callType: callMetadata.type ?? normalizedCallType,
    channelName,
    agoraAppId: tokens.appId,
    rtcToken: tokens.rtcToken,
    rtmToken: tokens.rtmToken,
    expiresAt: tokens.expiresAt,
    expiresIn: tokens.expiresIn,
    identity: tokens.identity,
    isNew,
    message: hydratedMessage ?? sanitizedCallMessage ?? null,
  };
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

export async function getThread(
  threadId,
  { withParticipants = false, includeSupportCase = false, includeLabels = false } = {},
) {
  const cacheKey = `messaging:thread:${threadId}:${withParticipants ? 'withParticipants' : 'base'}:${includeSupportCase ? 'withSupport' : 'noSupport'}:${includeLabels ? 'withLabels' : 'noLabels'}`;
  return appCache.remember(cacheKey, THREAD_CACHE_TTL, async () => {
    const thread = await MessageThread.findByPk(threadId, {
      include: [
        ...(withParticipants
          ? [
              {
                model: MessageParticipant,
                as: 'participants',
                include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
              },
            ]
          : []),
        ...(includeSupportCase
          ? [
              {
                model: SupportCase,
                as: 'supportCase',
                include: [
                  { model: User, as: 'assignedAgent', attributes: ['id', 'firstName', 'lastName', 'email'] },
                  { model: User, as: 'escalatedByUser', attributes: ['id', 'firstName', 'lastName', 'email'] },
                  { model: User, as: 'resolvedByUser', attributes: ['id', 'firstName', 'lastName', 'email'] },
                ],
              },
            ]
          : []),
        ...(includeLabels
          ? [
              {
                model: MessageLabel,
                as: 'labels',
                through: { attributes: [] },
              },
            ]
          : []),
      ],
    });

    if (!thread) {
      throw new NotFoundError('Thread not found.');
    }

    return sanitizeThread(thread);
  });
}

export async function listThreadsForUser(
  userId,
  {
    channelTypes,
    states,
    search,
    unreadOnly = false,
    includeParticipants = true,
    includeSupport = true,
    includeLabels = false,
  } = {},
  pagination = {},
) {
  if (!userId) {
    throw new ValidationError('userId is required to list inbox threads.');
  }

  const { page = 1, pageSize = 25 } = pagination;
  const safePage = Math.max(Number(page) || 1, 1);
  const safeSize = Math.min(Math.max(Number(pageSize) || 25, 1), 100);
  const offset = (safePage - 1) * safeSize;

  const normalizedChannelTypes = Array.isArray(channelTypes) ? channelTypes.filter(Boolean) : [];
  normalizedChannelTypes.forEach((type) => assertChannelType(type));

  const normalizedStates = Array.isArray(states) ? states.filter(Boolean) : [];
  normalizedStates.forEach((state) => assertThreadState(state));

  const sanitizedSearch = search?.trim();
  const likeOperator = Op.iLike ?? Op.like;

  const cacheKey = buildCacheKey(`messaging:inbox:${userId}`, {
    filters: {
      channelTypes: normalizedChannelTypes,
      states: normalizedStates,
      search: sanitizedSearch || null,
      unreadOnly,
      includeParticipants,
      includeSupport,
      includeLabels,
    },
    page: safePage,
    pageSize: safeSize,
  });

  return appCache.remember(cacheKey, INBOX_CACHE_TTL, async () => {
    const include = [
      {
        model: MessageParticipant,
        as: 'viewerParticipants',
        required: true,
        where: { userId },
        attributes: ['id', 'userId', 'threadId', 'lastReadAt', 'mutedUntil', 'notificationsEnabled'],
      },
    ];

    if (includeParticipants) {
      include.push({
        model: MessageParticipant,
        as: 'participants',
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      });
    }

    if (includeSupport) {
      include.push({
        model: SupportCase,
        as: 'supportCase',
        include: [
          { model: User, as: 'assignedAgent', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: User, as: 'escalatedByUser', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: User, as: 'resolvedByUser', attributes: ['id', 'firstName', 'lastName', 'email'] },
        ],
      });
    }

    if (includeLabels) {
      include.push({ model: MessageLabel, as: 'labels', through: { attributes: [] } });
    }

    const where = {};
    if (normalizedChannelTypes.length > 0) {
      where.channelType = { [Op.in]: normalizedChannelTypes };
    }
    if (normalizedStates.length > 0) {
      where.state = { [Op.in]: normalizedStates };
    }
    if (sanitizedSearch) {
      where[Op.or] = [
        { subject: { [likeOperator]: `%${sanitizedSearch}%` } },
      ];
      if (includeParticipants) {
        where[Op.or].push(
          { '$participants.user.firstName$': { [likeOperator]: `%${sanitizedSearch}%` } },
          { '$participants.user.lastName$': { [likeOperator]: `%${sanitizedSearch}%` } },
          { '$participants.user.email$': { [likeOperator]: `%${sanitizedSearch}%` } },
        );
      }
    }
    if (unreadOnly) {
      where[Op.and] = [
        ...(where[Op.and] ?? []),
        {
          [Op.and]: [
            { lastMessageAt: { [Op.not]: null } },
            {
              [Op.or]: [
                { '$viewerParticipants.lastReadAt$': null },
                sequelize.where(
                  sequelize.col('MessageThread.lastMessageAt'),
                  '>',
                  sequelize.col('viewerParticipants.lastReadAt'),
                ),
              ],
            },
          ],
        },
      ];
    }

    let rows;
    let count;
    try {
      ({ rows, count } = await MessageThread.findAndCountAll({
        where,
        include,
        order: [
          ['lastMessageAt', 'DESC'],
          ['createdAt', 'DESC'],
        ],
        limit: safeSize,
        offset,
        distinct: true,
        subQuery: false,
      }));
    } catch (error) {
      throw new ApplicationError('Unable to load inbox threads.', 500, {
        userId,
        cause: error,
      });
    }

    const data = await Promise.all(
      rows.map(async (thread) => {
        const sanitized = sanitizeThread(thread);
        const viewerParticipant = Array.isArray(thread.viewerParticipants)
          ? thread.viewerParticipants.find((participant) => participant.userId === userId)
          : null;

        let unreadCount = 0;
        if (viewerParticipant && thread.lastMessageAt) {
          const since = viewerParticipant.lastReadAt ?? new Date(0);
          if (!viewerParticipant.lastReadAt || thread.lastMessageAt > since) {
            unreadCount = await Message.count({
              where: {
                threadId: thread.id,
                createdAt: { [Op.gt]: since },
              },
            });
          }
        }

        return {
          ...sanitized,
          viewerState: viewerParticipant
            ? {
                participantId: viewerParticipant.id,
                lastReadAt: viewerParticipant.lastReadAt,
                mutedUntil: viewerParticipant.mutedUntil,
                notificationsEnabled: viewerParticipant.notificationsEnabled,
              }
            : null,
          unreadCount,
        };
      }),
    );

    return {
      data,
      pagination: {
        page: safePage,
        pageSize: safeSize,
        total: count,
        totalPages: Math.ceil(count / safeSize) || 1,
      },
    };
  });
}

export async function markThreadRead(threadId, userId) {
  await sequelize.transaction(async (trx) => {
    const participant = await ensureParticipant(threadId, userId, trx);
    const thread = await MessageThread.findByPk(threadId, { transaction: trx, lock: trx.LOCK.UPDATE });
    const markTimestamp = thread?.lastMessageAt ? new Date(thread.lastMessageAt) : new Date();
    participant.lastReadAt = markTimestamp;
    await participant.save({ transaction: trx });
  });

  flushThreadCache(threadId, [userId]);
  return { success: true };
}

export async function updateThreadState(threadId, state) {
  assertThreadState(state);

  let participantIds = [];
  await sequelize.transaction(async (trx) => {
    const thread = await MessageThread.findByPk(threadId, { transaction: trx, lock: trx.LOCK.UPDATE });
    if (!thread) {
      throw new NotFoundError('Thread not found.');
    }

    thread.state = state;
    await thread.save({ transaction: trx });
    participantIds = await getParticipantUserIds(threadId, trx);
  });

  flushThreadCache(threadId, participantIds);
  return getThread(threadId, { withParticipants: true, includeSupportCase: true });
}

export async function muteThread(threadId, userId, until) {
  await sequelize.transaction(async (trx) => {
    const participant = await ensureParticipant(threadId, userId, trx);
    participant.mutedUntil = until ?? new Date(Date.now() + 60 * 60 * 1000);
    participant.notificationsEnabled = false;
    await participant.save({ transaction: trx });
  });

  flushThreadCache(threadId, [userId]);
  return { success: true };
}

export async function updateThreadSettings(threadId, actorId, { subject, channelType, metadataPatch } = {}) {
  if (!threadId) {
    throw new ValidationError('threadId is required to update thread settings.');
  }
  if (!actorId) {
    throw new ValidationError('userId is required to update thread settings.');
  }

  const sanitizedMetadata = metadataPatch ? normalizeMetadata(metadataPatch, 'Thread settings') : null;
  if (channelType) {
    assertChannelType(channelType);
  }

  let participantIds = [];
  await sequelize.transaction(async (trx) => {
    await ensureParticipant(threadId, actorId, trx);

    const thread = await MessageThread.findByPk(threadId, { transaction: trx, lock: trx.LOCK.UPDATE });
    if (!thread) {
      throw new NotFoundError('Thread not found.');
    }

    if (subject !== undefined) {
      const trimmed = typeof subject === 'string' ? subject.trim() : '';
      thread.subject = trimmed ? trimmed.slice(0, 255) : null;
    }

    if (channelType) {
      thread.channelType = channelType;
    }

    if (sanitizedMetadata && Object.keys(sanitizedMetadata).length) {
      const existingMetadata =
        thread.metadata && typeof thread.metadata === 'object' ? { ...thread.metadata } : {};
      thread.metadata = { ...existingMetadata, ...sanitizedMetadata };
    }

    await thread.save({ transaction: trx });
    participantIds = await getParticipantUserIds(threadId, trx);
  });

  flushThreadCache(threadId, participantIds);
  return getThread(threadId, { withParticipants: true, includeSupportCase: true });
}

export async function addParticipantsToThread(threadId, actorId, participantIds = []) {
  if (!threadId) {
    throw new ValidationError('threadId is required to add participants.');
  }
  if (!actorId) {
    throw new ValidationError('userId is required to add participants.');
  }

  const normalizedIds = Array.from(
    new Set(
      (Array.isArray(participantIds) ? participantIds : [participantIds])
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  ).filter((value) => value !== actorId);

  if (!normalizedIds.length) {
    return getThread(threadId, { withParticipants: true, includeSupportCase: true });
  }

  let updatedParticipantIds = [];
  await sequelize.transaction(async (trx) => {
    await ensureParticipant(threadId, actorId, trx);

    const existingParticipants = await MessageParticipant.findAll({
      where: { threadId },
      attributes: ['userId'],
      transaction: trx,
      lock: trx.LOCK.UPDATE,
    });

    const existingIds = new Set(existingParticipants.map((participant) => participant.userId));
    const candidates = normalizedIds.filter((id) => !existingIds.has(id));

    if (!candidates.length) {
      updatedParticipantIds = await getParticipantUserIds(threadId, trx);
      return;
    }

    const users = await User.findAll({
      where: { id: { [Op.in]: candidates } },
      attributes: ['id'],
      transaction: trx,
    });

    if (!users.length) {
      throw new ValidationError('No valid users were provided to add to the conversation.');
    }

    await Promise.all(
      users.map((user) =>
        MessageParticipant.create(
          {
            threadId,
            userId: user.id,
            role: 'participant',
          },
          { transaction: trx },
        ),
      ),
    );

    updatedParticipantIds = await getParticipantUserIds(threadId, trx);
  });

  flushThreadCache(threadId, updatedParticipantIds);
  return getThread(threadId, { withParticipants: true, includeSupportCase: true });
}

export async function removeParticipantFromThread(threadId, participantUserId, actorId) {
  if (!threadId) {
    throw new ValidationError('threadId is required to remove a participant.');
  }
  if (!actorId) {
    throw new ValidationError('userId is required to remove a participant.');
  }
  if (!participantUserId || !Number.isInteger(Number(participantUserId))) {
    throw new ValidationError('participantId must be a valid integer.');
  }

  const targetUserId = Number(participantUserId);
  let updatedParticipantIds = [];

  await sequelize.transaction(async (trx) => {
    await ensureParticipant(threadId, actorId, trx);

    const target = await MessageParticipant.findOne({
      where: { threadId, userId: targetUserId },
      transaction: trx,
      lock: trx.LOCK.UPDATE,
    });

    if (!target) {
      throw new NotFoundError('Participant not found in this conversation.');
    }

    if (target.role === 'owner') {
      throw new AuthorizationError('Conversation owners cannot be removed.');
    }

    const participantCount = await MessageParticipant.count({ where: { threadId }, transaction: trx });
    if (participantCount <= 1) {
      throw new ValidationError('At least one participant must remain in the conversation.');
    }

    await target.destroy({ transaction: trx });
    updatedParticipantIds = await getParticipantUserIds(threadId, trx);
  });

  flushThreadCache(threadId, updatedParticipantIds);
  return getThread(threadId, { withParticipants: true, includeSupportCase: true });
}

export async function escalateThreadToSupport(
  threadId,
  userId,
  { reason, priority = 'medium', metadata = {} } = {},
) {
  if (!threadId) {
    throw new ValidationError('threadId is required to escalate a support case.');
  }
  if (!userId) {
    throw new ValidationError('userId is required to escalate a support case.');
  }
  if (!reason || !reason.trim()) {
    throw new ValidationError('Escalation reason is required.');
  }
  assertSupportPriority(priority);
  const normalizedMetadata = normalizeMetadata(metadata, 'Support case');

  const { supportCaseId, participantIds } = await sequelize.transaction(async (trx) => {
    await ensureParticipant(threadId, userId, trx);

    const now = new Date();
    let supportCase = await SupportCase.findOne({
      where: { threadId },
      transaction: trx,
      lock: trx.LOCK.UPDATE,
    });

    if (!supportCase) {
      supportCase = await SupportCase.create(
        {
          threadId,
          status: 'triage',
          priority,
          reason: reason.trim(),
          metadata: normalizedMetadata,
          escalatedBy: userId,
          escalatedAt: now,
        },
        { transaction: trx },
      );
    } else {
      supportCase.priority = priority;
      supportCase.status = 'triage';
      supportCase.reason = reason.trim();
      supportCase.metadata = {
        ...(supportCase.metadata ?? {}),
        ...normalizedMetadata,
      };
      supportCase.escalatedBy = userId;
      supportCase.escalatedAt = now;
      supportCase.resolvedAt = null;
      supportCase.resolvedBy = null;
      supportCase.resolutionSummary = null;
      await supportCase.save({ transaction: trx });
    }

    await createSystemMessage(
      threadId,
      `Support escalation requested: ${reason.trim()}`,
      { event: 'escalated', priority },
      trx,
    );

    return {
      supportCaseId: supportCase.id,
      participantIds: await getParticipantUserIds(threadId, trx),
    };
  });

  flushThreadCache(threadId, participantIds);

  const hydrated = await SupportCase.findByPk(supportCaseId, {
    include: [
      { model: User, as: 'assignedAgent', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'escalatedByUser', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'resolvedByUser', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
  });

  const sanitized = sanitizeSupportCase(hydrated);

  const recipients = new Set(
    participantIds
      .filter((participantId) => participantId !== userId)
      .concat(SUPPORT_ESCALATION_NOTIFY_USER_IDS),
  );

  await Promise.all(
    Array.from(recipients).map((recipientId) =>
      queueSupportNotification(
        {
          userId: recipientId,
          category: 'message',
          priority: priority === 'urgent' ? 'high' : 'normal',
          type: 'support_case_escalated',
          title: 'Support case escalated',
          body: `Thread #${threadId} has been escalated with priority ${priority}.`,
          payload: {
            threadId,
            supportCaseId: sanitized.id,
            priority,
          },
        },
        { bypassQuietHours: priority === 'urgent' },
      ),
    ),
  );

  return sanitized;
}

export async function assignSupportAgent(threadId, agentId, { assignedBy, notifyAgent = true } = {}) {
  if (!threadId) {
    throw new ValidationError('threadId is required to assign a support agent.');
  }
  if (!agentId) {
    throw new ValidationError('agentId is required to assign a support agent.');
  }

  const { supportCaseId, participantIds, priority } = await sequelize.transaction(async (trx) => {
    const supportCase = await SupportCase.findOne({
      where: { threadId },
      transaction: trx,
      lock: trx.LOCK.UPDATE,
    });
    if (!supportCase) {
      throw new NotFoundError('Support case not found for this thread.');
    }

    const agent = await User.findByPk(agentId, {
      transaction: trx,
      attributes: ['id', 'firstName', 'lastName', 'email', 'userType'],
    });
    if (!agent) {
      throw new ValidationError('Assigned agent does not exist.');
    }

    await ensureSupportAgentPermissions(agent, trx);

    supportCase.assignedTo = agentId;
    supportCase.assignedBy = assignedBy ?? agentId;
    supportCase.assignedAt = new Date();
    if (!supportCase.firstResponseAt) {
      supportCase.firstResponseAt = new Date();
    }
    if (supportCase.status === 'triage') {
      supportCase.status = 'in_progress';
    }
    await supportCase.save({ transaction: trx });

    await createSystemMessage(
      threadId,
      `Support case assigned to ${agent.firstName} ${agent.lastName}`,
      { event: 'assigned', assignedTo: agentId },
      trx,
    );

    return {
      supportCaseId: supportCase.id,
      participantIds: await getParticipantUserIds(threadId, trx),
      priority: supportCase.priority,
    };
  });

  flushThreadCache(threadId, participantIds);

  const hydrated = await SupportCase.findByPk(supportCaseId, {
    include: [
      { model: User, as: 'assignedAgent', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'escalatedByUser', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'resolvedByUser', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
  });

  const sanitized = sanitizeSupportCase(hydrated);

  if (notifyAgent) {
    await queueSupportNotification(
      {
        userId: agentId,
        category: 'message',
        priority: priority === 'urgent' ? 'high' : 'normal',
        type: 'support_case_assigned',
        title: 'New support case assignment',
        body: `You have been assigned to support thread #${threadId}.`,
        payload: {
          threadId,
          supportCaseId: sanitized.id,
        },
      },
      { bypassQuietHours: priority === 'urgent' },
    );
  }

  return sanitized;
}

export async function updateSupportCaseStatus(
  threadId,
  status,
  { actorId, resolutionSummary, metadataPatch = {} } = {},
) {
  if (!threadId) {
    throw new ValidationError('threadId is required to update a support case.');
  }
  assertSupportStatus(status);
  const patch = metadataPatch && typeof metadataPatch === 'object' ? metadataPatch : {};

  const { supportCaseId, participantIds, priority } = await sequelize.transaction(async (trx) => {
    const supportCase = await SupportCase.findOne({
      where: { threadId },
      transaction: trx,
      lock: trx.LOCK.UPDATE,
    });
    if (!supportCase) {
      throw new NotFoundError('Support case not found for this thread.');
    }

    supportCase.status = status;
    if (Object.keys(patch).length > 0) {
      supportCase.metadata = {
        ...(supportCase.metadata ?? {}),
        ...patch,
      };
    }

    if (status === 'in_progress' && !supportCase.firstResponseAt) {
      supportCase.firstResponseAt = new Date();
    }

    if (['resolved', 'closed'].includes(status)) {
      supportCase.resolvedAt = new Date();
      supportCase.resolvedBy = actorId ?? supportCase.resolvedBy ?? null;
      if (resolutionSummary?.trim()) {
        supportCase.resolutionSummary = resolutionSummary.trim();
      }
    } else if (status === 'waiting_on_customer') {
      supportCase.resolvedAt = null;
      supportCase.resolvedBy = null;
      supportCase.resolutionSummary = null;
    }

    await supportCase.save({ transaction: trx });

    const summary =
      status === 'resolved'
        ? resolutionSummary?.trim() || 'Support case resolved.'
        : `Support case status updated to ${status.replace(/_/g, ' ')}`;

    await createSystemMessage(threadId, summary, { event: 'status_change', status }, trx);

    return {
      supportCaseId: supportCase.id,
      participantIds: await getParticipantUserIds(threadId, trx),
      priority: supportCase.priority,
    };
  });

  flushThreadCache(threadId, participantIds);

  const hydrated = await SupportCase.findByPk(supportCaseId, {
    include: [
      { model: User, as: 'assignedAgent', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'escalatedByUser', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'resolvedByUser', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
  });

  const sanitized = sanitizeSupportCase(hydrated);

  if (['resolved', 'closed'].includes(status)) {
    await Promise.all(
      participantIds
        .filter((participantId) => participantId !== actorId)
        .map((participantId) =>
          queueSupportNotification(
            {
              userId: participantId,
              category: 'message',
              priority: priority === 'urgent' ? 'high' : 'normal',
              type: 'support_case_resolved',
              title: 'Support case resolved',
              body: sanitized.resolutionSummary || 'Support case resolved.',
              payload: {
                threadId,
                supportCaseId: sanitized.id,
                status,
              },
            },
            { bypassQuietHours: priority === 'urgent' },
          ),
        ),
    );
  }

  return sanitized;
}

export async function listWorkspaceLabels(workspaceId, { search } = {}) {
  if (!workspaceId) {
    throw new ValidationError('workspaceId is required to list messaging labels.');
  }
  const sanitizedSearch = search?.trim() ?? '';
  const cacheKey = buildLabelCacheKey(workspaceId, sanitizedSearch);

  return appCache.remember(cacheKey, LABEL_CACHE_TTL, async () => {
    const where = { workspaceId };
    if (sanitizedSearch) {
      const likeOperator = Op.iLike ?? Op.like;
      const searchSlug = slugifyLabelName(sanitizedSearch);
      where[Op.or] = [
        { name: { [likeOperator]: `%${sanitizedSearch}%` } },
        ...(searchSlug
          ? [{ slug: { [likeOperator]: `%${searchSlug}%` } }]
          : []),
      ];
    }

    const labels = await MessageLabel.findAll({
      where,
      order: [
        ['name', 'ASC'],
        ['id', 'ASC'],
      ],
    });
    return labels.map((label) => sanitizeLabel(label));
  });
}

export async function createWorkspaceLabel({
  workspaceId,
  name,
  color,
  description,
  createdBy,
  metadata,
} = {}) {
  if (!workspaceId) {
    throw new ValidationError('workspaceId is required to create a messaging label.');
  }
  if (!name || !name.trim()) {
    throw new ValidationError('name is required to create a messaging label.');
  }

  const normalizedName = name.trim();
  const baseSlug = slugifyLabelName(normalizedName) || `label-${Date.now()}`;
  let slug = baseSlug;
  let suffix = 1;
  while (await MessageLabel.findOne({ where: { workspaceId, slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const payload = {
    workspaceId,
    name: normalizedName,
    slug,
    color: normalizeLabelColor(color),
    description: description?.trim() ? description.trim() : null,
    createdBy: createdBy ?? null,
    metadata: metadata ? normalizeMetadata(metadata, 'Label') : null,
  };

  const label = await MessageLabel.create(payload);
  appCache.flushByPrefix(`messaging:labels:${Number(workspaceId)}`);
  return sanitizeLabel(label);
}

export async function updateWorkspaceLabel(labelId, updates = {}) {
  if (!labelId) {
    throw new ValidationError('labelId is required to update a messaging label.');
  }

  const label = await MessageLabel.findByPk(labelId);
  if (!label) {
    throw new NotFoundError('Messaging label not found.');
  }

  if (updates.workspaceId && Number(updates.workspaceId) !== Number(label.workspaceId)) {
    throw new AuthorizationError('Cannot reassign a label to a different workspace.');
  }

  const patch = {};
  if (typeof updates.name === 'string' && updates.name.trim()) {
    const normalizedName = updates.name.trim();
    const baseSlug = slugifyLabelName(normalizedName) || `label-${label.id}`;
    let slug = baseSlug;
    let suffix = 1;
    while (
      await MessageLabel.findOne({
        where: {
          workspaceId: label.workspaceId,
          slug,
          id: { [Op.ne]: label.id },
        },
      })
    ) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
    patch.name = normalizedName;
    patch.slug = slug;
  }

  if (updates.color !== undefined) {
    patch.color = normalizeLabelColor(updates.color);
  }

  if (updates.description !== undefined) {
    patch.description = updates.description?.trim() ? updates.description.trim() : null;
  }

  if (updates.metadata !== undefined) {
    patch.metadata = updates.metadata ? normalizeMetadata(updates.metadata, 'Label') : null;
  }

  if (Object.keys(patch).length > 0) {
    await label.update(patch);
    appCache.flushByPrefix(`messaging:labels:${Number(label.workspaceId)}`);
    appCache.flushByPrefix('messaging:thread:');
  }

  return sanitizeLabel(label);
}

export async function deleteWorkspaceLabel(labelId, { workspaceId } = {}) {
  if (!labelId) {
    throw new ValidationError('labelId is required to delete a messaging label.');
  }

  const label = await MessageLabel.findByPk(labelId);
  if (!label) {
    return false;
  }

  if (workspaceId && Number(workspaceId) !== Number(label.workspaceId)) {
    throw new AuthorizationError('Cannot delete a label from a different workspace.');
  }

  await MessageThreadLabel.destroy({ where: { labelId } });
  await label.destroy();
  appCache.flushByPrefix(`messaging:labels:${Number(label.workspaceId)}`);
  appCache.flushByPrefix('messaging:thread:');
  appCache.flushByPrefix('messaging:inbox:');
  return true;
}

export async function setThreadLabels(threadId, labelIds = [], { workspaceId, actorId } = {}) {
  if (!threadId) {
    throw new ValidationError('threadId is required to update thread labels.');
  }
  if (!workspaceId) {
    throw new ValidationError('workspaceId is required to update thread labels.');
  }

  const normalizedIds = Array.from(
    new Set(
      (Array.isArray(labelIds) ? labelIds : [])
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  );

  const labels = await MessageLabel.findAll({
    where: {
      workspaceId,
      ...(normalizedIds.length ? { id: { [Op.in]: normalizedIds } } : {}),
    },
  });

  if (normalizedIds.length !== labels.length) {
    throw new NotFoundError('One or more labels were not found for this workspace.');
  }

  await sequelize.transaction(async (trx) => {
    await MessageThreadLabel.destroy({ where: { threadId }, transaction: trx });

    if (labels.length) {
      await MessageThreadLabel.bulkCreate(
        labels.map((label) => ({
          threadId,
          labelId: label.id,
          appliedBy: actorId ?? null,
          appliedAt: new Date(),
        })),
        { transaction: trx },
      );
    }
  });

  appCache.flushByPrefix(`messaging:thread:${threadId}`);
  appCache.flushByPrefix('messaging:inbox:');
  appCache.flushByPrefix(`messaging:labels:${Number(workspaceId)}`);

  return getThread(threadId, {
    withParticipants: true,
    includeSupportCase: true,
    includeLabels: true,
  });
}

export default {
  createThread,
  appendMessage,
  listMessages,
  getThread,
  listThreadsForUser,
  markThreadRead,
  updateThreadState,
  muteThread,
  updateThreadSettings,
  addParticipantsToThread,
  removeParticipantFromThread,
  escalateThreadToSupport,
  assignSupportAgent,
  updateSupportCaseStatus,
  listWorkspaceLabels,
  createWorkspaceLabel,
  updateWorkspaceLabel,
  deleteWorkspaceLabel,
  setThreadLabels,
};
