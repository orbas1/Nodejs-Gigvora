import crypto from 'node:crypto';
import { Op } from 'sequelize';
import {
  sequelize,
  MessageThread,
  MessageParticipant,
  Message,
  MessageAttachment,
  SupportCase,
  User,
} from '../models/messagingModels.js';
import { getRuntimeConfig } from '../config/runtimeConfig.js';
import logger from '../utils/logger.js';
import { appCache } from '../utils/cache.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';

const log = logger.child({ component: 'chatwootService' });

const SHOULD_QUEUE_SUPPORT_NOTIFICATIONS =
  String(process.env.SUPPRESS_SUPPORT_NOTIFICATIONS ?? '').toLowerCase() !== 'true' &&
  process.env.NODE_ENV !== 'test';

let notificationServicePromise = null;

async function loadNotificationService() {
  if (!notificationServicePromise) {
    notificationServicePromise = import('./notificationService.js').catch((error) => {
      log.warn({ err: error }, 'Unable to load notificationService for Chatwoot integration');
      return null;
    });
  }
  const module = await notificationServicePromise;
  if (!module) {
    return null;
  }
  return module.default ?? module;
}

async function queueSupportNotification(payload = {}, options = {}) {
  if (!SHOULD_QUEUE_SUPPORT_NOTIFICATIONS) {
    return;
  }

  try {
    const service = await loadNotificationService();
    if (!service) {
      return;
    }
    const target =
      typeof service.queueSupportNotification === 'function'
        ? service.queueSupportNotification.bind(service)
        : typeof service.queueNotification === 'function'
          ? service.queueNotification.bind(service)
          : null;
    if (!target) {
      return;
    }
    await target(
      {
        category: 'support',
        priority: 'critical',
        ...payload,
      },
      options,
    );
  } catch (error) {
    log.warn({ err: error }, 'Failed to queue Chatwoot support notification');
  }
}

function getChatwootConfig() {
  return getRuntimeConfig()?.support?.chatwoot ?? {
    enabled: false,
    baseUrl: undefined,
    websiteToken: undefined,
    hmacToken: undefined,
    webhookToken: undefined,
    inboxId: undefined,
    portalToken: undefined,
    defaultLocale: 'en',
    sla: { firstResponseMinutes: 30, resolutionMinutes: 720 },
  };
}

function sanitizeBaseUrl(baseUrl) {
  if (!baseUrl) {
    return undefined;
  }
  return String(baseUrl).replace(/\/$/, '');
}

function normalizeMemberships(rawMemberships, fallback) {
  if (Array.isArray(rawMemberships)) {
    return rawMemberships
      .map((value) => (typeof value === 'string' ? value.trim() : String(value)))
      .filter((value) => value.length > 0);
  }
  if (typeof rawMemberships === 'string' && rawMemberships.trim()) {
    try {
      const parsed = JSON.parse(rawMemberships);
      if (Array.isArray(parsed)) {
        return parsed
          .map((value) => (typeof value === 'string' ? value.trim() : String(value)))
          .filter((value) => value.length > 0);
      }
    } catch (error) {
      // ignore json parse errors and fall through
    }
    return rawMemberships
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }
  if (fallback && Array.isArray(fallback)) {
    return fallback.filter((value) => typeof value === 'string' && value.trim().length > 0);
  }
  return [];
}

function buildIdentifier(userId) {
  return `gigvora-user-${userId}`;
}

function resolveIdentifierHash(identifier, hmacToken) {
  if (!identifier || !hmacToken) {
    return null;
  }
  return crypto.createHmac('sha256', hmacToken).update(identifier).digest('hex');
}

function parseNumeric(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const numeric = Number.parseInt(trimmed, 10);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }
  return null;
}

export function isChatwootEnabled() {
  const config = getChatwootConfig();
  return Boolean(config.enabled && config.baseUrl && config.websiteToken);
}

export async function getWidgetSettingsForUser(userId, { ipAddress, sessionId } = {}) {
  const config = getChatwootConfig();
  if (!config.enabled || !config.baseUrl || !config.websiteToken) {
    return {
      enabled: false,
    };
  }
  const normalizedId = parseNumeric(userId);
  if (!normalizedId) {
    throw new ValidationError('A valid userId is required to bootstrap the Chatwoot widget.');
  }

  const user = await User.findByPk(normalizedId, {
    attributes: [
      'id',
      'firstName',
      'lastName',
      'email',
      'userType',
      'memberships',
      'primaryDashboard',
      'avatarUrl',
      'status',
      'location',
      'lastSeenAt',
    ],
  });

  if (!user) {
    throw new ValidationError('User not found.');
  }

  const nameParts = [user.firstName, user.lastName].filter(Boolean);
  const displayName = nameParts.length ? nameParts.join(' ') : user.email ?? `Member #${user.id}`;
  const memberships = normalizeMemberships(user.memberships, [user.userType]);
  const primaryDashboard = user.primaryDashboard || memberships[0] || 'user';
  const identifier = buildIdentifier(user.id);
  const identifierHash = resolveIdentifierHash(identifier, config.hmacToken);

  const customAttributes = {
    gigvora_user_id: user.id,
    memberships,
    primary_dashboard: primaryDashboard,
    user_type: user.userType,
    account_status: user.status,
    location: user.location ?? null,
    last_seen_at: user.lastSeenAt ? new Date(user.lastSeenAt).toISOString() : null,
    session_id: sessionId ?? null,
    ip_address: ipAddress ?? null,
  };

  return {
    enabled: true,
    baseUrl: sanitizeBaseUrl(config.baseUrl) ?? 'https://support.edulure.com',
    websiteToken: config.websiteToken,
    locale: config.defaultLocale ?? 'en',
    inboxId: config.inboxId ?? null,
    portalToken: config.portalToken ?? null,
    contact: {
      identifier,
      name: displayName,
      email: user.email,
      avatarUrl: user.avatarUrl ?? null,
    },
    secureMode: {
      identifier,
      identifierHash,
    },
    customAttributes,
    sla: config.sla ?? { firstResponseMinutes: 30, resolutionMinutes: 720 },
  };
}

function normalizeSignature(signatureHeader) {
  if (!signatureHeader) {
    return null;
  }
  const value = String(signatureHeader).trim();
  if (!value) {
    return null;
  }
  if (value.includes('=')) {
    const [, hash] = value.split('=');
    return hash ? hash.trim() : null;
  }
  return value;
}

function safeTimingCompare(a, b) {
  const bufferA = Buffer.from(a ?? '', 'hex');
  const bufferB = Buffer.from(b ?? '', 'hex');
  if (bufferA.length === 0 || bufferA.length !== bufferB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufferA, bufferB);
}

function ensureDate(input) {
  if (!input) {
    return new Date();
  }
  if (input instanceof Date) {
    return input;
  }
  if (typeof input === 'number') {
    if (input > 9_999_999_999) {
      return new Date(input);
    }
    return new Date(input * 1_000);
  }
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}

function sanitizeBody(content) {
  if (content == null) {
    return '';
  }
  if (typeof content === 'string') {
    return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  if (typeof content === 'object') {
    return JSON.stringify(content);
  }
  return String(content);
}

function buildMessageMetadata(message, additional = {}) {
  return {
    chatwootMessageId: message?.id ?? message?.message_id ?? null,
    chatwootMessageType: message?.message_type ?? null,
    chatwootPayload: {
      id: message?.id ?? null,
      messageType: message?.message_type ?? null,
      content: message?.content ?? null,
      senderId: message?.sender_id ?? null,
      senderType: message?.sender_type ?? null,
      accountId: message?.account_id ?? null,
      inboxId: message?.inbox_id ?? null,
      createdAt: message?.created_at ?? null,
    },
    attachments: Array.isArray(message?.attachments)
      ? message.attachments.map((attachment) => ({
          id: attachment?.id ?? null,
          fileType: attachment?.file_type ?? attachment?.fileType ?? null,
          fileName: attachment?.file_name ?? attachment?.fileName ?? null,
          fileSize: attachment?.file_size ?? attachment?.fileSize ?? null,
          dataUrl: attachment?.data_url ?? attachment?.dataUrl ?? null,
        }))
      : [],
    ...additional,
  };
}

function mapConversationStatus(status) {
  switch ((status ?? '').toLowerCase()) {
    case 'resolved':
      return 'resolved';
    case 'closed':
      return 'closed';
    case 'pending':
      return 'waiting_on_customer';
    case 'open':
    case 'snoozed':
    case 'waiting':
    default:
      return 'in_progress';
  }
}

function mapConversationPriority(priority) {
  switch ((priority ?? '').toLowerCase()) {
    case 'urgent':
      return 'urgent';
    case 'high':
      return 'high';
    case 'low':
      return 'low';
    default:
      return 'medium';
  }
}

function resolveGigvoraUserId(conversation) {
  const candidates = [
    conversation?.additional_attributes?.gigvora_user_id,
    conversation?.additionalAttributes?.gigvora_user_id,
    conversation?.meta?.gigvora_user_id,
    conversation?.contact?.custom_attributes?.gigvora_user_id,
    conversation?.contact?.identifier,
  ];

  for (const candidate of candidates) {
    if (candidate == null) {
      continue;
    }
    if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate > 0) {
      return candidate;
    }
    if (typeof candidate === 'string') {
      const numeric = parseNumeric(candidate.replace(/[^0-9]/g, ''));
      if (numeric && numeric > 0) {
        return numeric;
      }
    }
  }

  return null;
}

async function findThreadByConversationId(conversationId, { transaction } = {}) {
  if (!conversationId) {
    return null;
  }
  return MessageThread.findOne({
    where: sequelize.where(sequelize.json('metadata.chatwootConversationId'), conversationId),
    transaction,
    lock: transaction?.LOCK?.UPDATE,
  });
}

async function ensureParticipantRecord(threadId, userId, role = 'participant', transaction) {
  if (!threadId || !userId) {
    return null;
  }
  const [participant, created] = await MessageParticipant.findOrCreate({
    where: { threadId, userId },
    defaults: { threadId, userId, role },
    transaction,
    lock: transaction?.LOCK?.UPDATE,
  });
  if (!created && role === 'owner' && participant.role !== 'owner') {
    participant.role = 'owner';
    await participant.save({ transaction });
  }
  return participant;
}

async function collectParticipantIds(threadId, transaction) {
  if (!threadId) {
    return [];
  }
  const records = await MessageParticipant.findAll({
    where: { threadId },
    attributes: ['userId'],
    transaction,
  });
  return records.map((record) => record.userId).filter(Boolean);
}

async function resolveAgentUserId(conversation, message, { transaction } = {}) {
  const candidates = [
    message?.sender?.additional_attributes?.gigvora_user_id,
    message?.sender?.custom_attributes?.gigvora_user_id,
    conversation?.assignee?.additional_attributes?.gigvora_user_id,
    conversation?.assignee?.custom_attributes?.gigvora_user_id,
    conversation?.assignee?.identifier,
  ];

  for (const candidate of candidates) {
    const numeric = parseNumeric(typeof candidate === 'string' ? candidate.replace(/[^0-9]/g, '') : candidate);
    if (numeric && numeric > 0) {
      const agent = await User.findByPk(numeric, {
        attributes: ['id'],
        transaction,
      });
      if (agent) {
        return agent.id;
      }
    }
  }

  const emailCandidates = [message?.sender?.email, conversation?.assignee?.email];
  for (const email of emailCandidates) {
    if (!email || typeof email !== 'string') {
      continue;
    }
    const user = await User.findOne({ where: { email }, attributes: ['id'], transaction });
    if (user) {
      return user.id;
    }
  }

  return null;
}

function mergeMetadata(base = {}, patch = {}) {
  return JSON.parse(JSON.stringify({ ...base, ...patch }));
}

async function ensureThreadAndSupportCase(conversation, userId, { transaction }) {
  let thread = await findThreadByConversationId(conversation.id, { transaction });
  const metadataPatch = {
    chatwootConversationId: conversation.id,
    chatwootInboxId: conversation.inbox_id ?? null,
    chatwootAccountId: conversation.account_id ?? null,
    chatwootStatus: conversation.status ?? null,
    chatwootPriority: conversation.priority ?? null,
    routingKey: conversation.additional_attributes?.routing_key ?? null,
  };

  if (!thread) {
    if (!userId) {
      throw new ValidationError('Unable to create support thread without a valid user identifier.');
    }
    const subject =
      conversation?.meta?.sender?.name ??
      conversation?.additional_attributes?.subject ??
      `Support conversation #${conversation.id}`;
    thread = await MessageThread.create(
      {
        subject: subject?.slice(0, 250) ?? `Support conversation #${conversation.id}`,
        channelType: 'support',
        state: 'active',
        createdBy: userId,
        metadata: metadataPatch,
        lastMessageAt: conversation?.last_activity_at ? ensureDate(conversation.last_activity_at) : new Date(),
        lastMessagePreview: sanitizeBody(conversation?.last_message_content ?? ''),
      },
      { transaction },
    );
  } else {
    thread.metadata = mergeMetadata(thread.metadata ?? {}, metadataPatch);
    await thread.save({ transaction });
  }

  await ensureParticipantRecord(thread.id, userId, 'owner', transaction);

  let supportCase = await SupportCase.findOne({
    where: { threadId: thread.id },
    transaction,
    lock: transaction?.LOCK?.UPDATE,
  });

  const status = mapConversationStatus(conversation.status);
  const priority = mapConversationPriority(conversation.priority);
  const reason = conversation?.additional_attributes?.issue_type ?? 'Chatwoot conversation';

  const metadata = mergeMetadata(supportCase?.metadata ?? {}, {
    chatwootConversationId: conversation.id,
    chatwootInboxId: conversation.inbox_id ?? null,
    chatwootAccountId: conversation.account_id ?? null,
    chatwootStatus: conversation.status ?? null,
    routingKey: conversation.additional_attributes?.routing_key ?? null,
  });

  if (!supportCase) {
    supportCase = await SupportCase.create(
      {
        threadId: thread.id,
        status,
        priority,
        reason: reason?.slice(0, 255) ?? 'Chatwoot conversation',
        metadata,
        escalatedBy: userId,
        escalatedAt: new Date(),
      },
      { transaction },
    );
  } else {
    supportCase.status = status;
    supportCase.priority = priority;
    supportCase.reason = reason?.slice(0, 255) ?? supportCase.reason ?? 'Chatwoot conversation';
    supportCase.metadata = metadata;
    await supportCase.save({ transaction });
  }

  return { thread, supportCase };
}

function applySlaEscalations(supportCase, metadata, timestamp, { breachedReason }) {
  const config = getChatwootConfig();
  const slaConfig = config.sla ?? { firstResponseMinutes: 30, resolutionMinutes: 720 };
  const now = timestamp ?? new Date();
  const firstResponseThreshold = Math.max(Number(slaConfig.firstResponseMinutes ?? 30), 1) * 60 * 1000;
  const resolutionThreshold = Math.max(Number(slaConfig.resolutionMinutes ?? 720), 1) * 60 * 1000;
  const slaMeta = { ...(metadata.sla ?? {}) };
  let escalated = false;

  if (!supportCase.firstResponseAt && metadata.lastCustomerMessageAt) {
    const lastCustomerMessageAt = new Date(metadata.lastCustomerMessageAt);
    if (Number.isFinite(lastCustomerMessageAt.getTime())) {
      const delta = now.getTime() - lastCustomerMessageAt.getTime();
      if (delta > firstResponseThreshold && !slaMeta.firstResponseBreachedAt) {
        slaMeta.firstResponseBreachedAt = now.toISOString();
        slaMeta.firstResponseDeltaMinutes = Math.round(delta / 60000);
        metadata.priorityBeforeSla = metadata.priorityBeforeSla ?? supportCase.priority;
        supportCase.priority = 'urgent';
        escalated = true;
      }
    }
  }

  if (!supportCase.resolvedAt) {
    const anchor = supportCase.firstResponseAt ?? supportCase.createdAt ?? now;
    const anchorDate = new Date(anchor);
    if (Number.isFinite(anchorDate.getTime())) {
      const delta = now.getTime() - anchorDate.getTime();
      if (delta > resolutionThreshold && !slaMeta.resolutionBreachedAt) {
        slaMeta.resolutionBreachedAt = now.toISOString();
        slaMeta.resolutionDeltaMinutes = Math.round(delta / 60000);
        metadata.priorityBeforeSla = metadata.priorityBeforeSla ?? supportCase.priority;
        supportCase.priority = 'urgent';
        escalated = true;
      }
    }
  }

  if (escalated && !slaMeta.escalatedAt) {
    slaMeta.escalatedAt = now.toISOString();
    queueSupportNotification({
      title: 'Support SLA escalation triggered',
      body: breachedReason ?? 'Support case breached SLA targets after Chatwoot event.',
      metadata: {
        supportCaseId: supportCase.id,
        threadId: supportCase.threadId,
        chatwootConversationId: metadata.chatwootConversationId ?? null,
        sla: slaMeta,
      },
    });
  }

  metadata.sla = slaMeta;
  supportCase.metadata = metadata;
}

async function upsertMessage(thread, supportCase, message, conversation, contactUserId, { transaction }) {
  const messageId = message?.id ?? message?.message_id;
  if (!messageId || !thread) {
    return { participantIds: [], created: false };
  }

  const existing = await Message.findOne({
    where: {
      threadId: thread.id,
      [Op.and]: [sequelize.where(sequelize.json('metadata.chatwootMessageId'), messageId)],
    },
    transaction,
    lock: transaction?.LOCK?.UPDATE,
  });

  if (existing) {
    return { participantIds: await collectParticipantIds(thread.id, transaction), created: false };
  }

  const timestamp = ensureDate(message?.created_at ?? Date.now());
  const messageType = (message?.message_type ?? 'text').toLowerCase();
  const senderRole = messageType === 'incoming' ? 'participant' : 'support';

  let senderId = null;
  if (messageType === 'incoming') {
    senderId = contactUserId ?? null;
  } else {
    senderId = await resolveAgentUserId(conversation, message, { transaction });
  }

  if (senderId) {
    await ensureParticipantRecord(thread.id, senderId, senderRole === 'support' ? 'support' : 'participant', transaction);
  }

  const metadata = buildMessageMetadata(message);
  const body = sanitizeBody(message?.content);

  const record = await Message.create(
    {
      threadId: thread.id,
      senderId,
      messageType: 'text',
      body,
      metadata,
      deliveredAt: timestamp,
    },
    { transaction },
  );

  if (Array.isArray(message?.attachments)) {
    for (const attachment of message.attachments) {
      if (!attachment) {
        continue;
      }
      await MessageAttachment.create(
        {
          messageId: record.id,
          fileName: attachment.file_name ?? attachment.fileName ?? 'attachment',
          mimeType: attachment.file_type ?? attachment.content_type ?? 'application/octet-stream',
          fileSize: parseNumeric(attachment.file_size ?? attachment.fileSize) ?? 0,
          storageKey: `chatwoot:${attachment.id ?? messageId}`,
          metadata: {
            chatwootAttachmentId: attachment.id ?? null,
            dataUrl: attachment.data_url ?? attachment.dataUrl ?? null,
            fallbackUrl: attachment.thumb_url ?? attachment.download_url ?? null,
          },
        },
        { transaction },
      );
    }
  }

  thread.lastMessageAt = timestamp;
  thread.lastMessagePreview = body?.slice(0, 300) ?? thread.lastMessagePreview;
  thread.metadata = mergeMetadata(thread.metadata ?? {}, {
    chatwootLastMessageId: messageId,
    chatwootStatus: conversation.status ?? thread.metadata?.chatwootStatus ?? null,
  });
  await thread.save({ transaction });

  if (supportCase) {
    const caseMetadata = mergeMetadata(supportCase.metadata ?? {}, {
      chatwootConversationId: conversation.id,
      chatwootStatus: conversation.status ?? null,
      lastCustomerMessageAt:
        messageType === 'incoming' ? timestamp.toISOString() : supportCase.metadata?.lastCustomerMessageAt ?? null,
      lastAgentMessageAt:
        messageType !== 'incoming' ? timestamp.toISOString() : supportCase.metadata?.lastAgentMessageAt ?? null,
    });

    if (messageType !== 'incoming') {
      if (!supportCase.firstResponseAt) {
        supportCase.firstResponseAt = timestamp;
      }
      const agentUserId = senderId ?? (await resolveAgentUserId(conversation, message, { transaction }));
      if (agentUserId) {
        supportCase.assignedTo = agentUserId;
        supportCase.assignedBy = agentUserId;
        supportCase.assignedAt = supportCase.assignedAt ?? timestamp;
      }
    }

    const conversationStatus = mapConversationStatus(conversation.status);
    if (conversationStatus === 'resolved') {
      supportCase.status = 'resolved';
      supportCase.resolvedAt = supportCase.resolvedAt ?? timestamp;
      supportCase.resolvedBy = senderId ?? supportCase.resolvedBy ?? null;
      caseMetadata.resolutionSource = 'chatwoot';
    } else if (messageType === 'incoming') {
      supportCase.status = 'in_progress';
      supportCase.resolvedAt = null;
      supportCase.resolvedBy = null;
    } else {
      supportCase.status = conversationStatus;
    }

    applySlaEscalations(supportCase, caseMetadata, timestamp, {
      breachedReason:
        messageType === 'incoming'
          ? 'Customer waited longer than the configured SLA for a response.'
          : 'Support resolution SLA exceeded while handling a Chatwoot conversation.',
    });

    await supportCase.save({ transaction });
  }

  const participantIds = await collectParticipantIds(thread.id, transaction);
  return { participantIds, created: true };
}

function normalizeConversationPayload(payload) {
  if (!payload) {
    return null;
  }
  if (payload.conversation) {
    return normalizeConversationPayload(payload.conversation);
  }
  return {
    ...payload,
    additional_attributes: payload.additional_attributes ?? payload.additionalAttributes ?? {},
    meta: payload.meta ?? {},
    contact: payload.contact ?? payload.customer ?? {},
  };
}

function normalizeMessagePayload(payload) {
  if (!payload) {
    return null;
  }
  if (payload.message) {
    return normalizeMessagePayload(payload.message);
  }
  return {
    ...payload,
    attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
  };
}

function flushCaches(threadId, participantIds = []) {
  appCache.flushByPrefix('messaging:threads:list');
  if (threadId) {
    appCache.delete(`messaging:thread:${threadId}`);
    appCache.flushByPrefix(`messaging:messages:${threadId}`);
  }
  participantIds.filter(Boolean).forEach((userId) => {
    appCache.flushByPrefix(`messaging:inbox:${userId}`);
  });
}

export async function processWebhookEvent({ signature, eventName, payload, rawBody }) {
  const config = getChatwootConfig();
  if (!config.enabled) {
    return { ignored: true };
  }

  if (config.webhookToken) {
    const normalizedSignature = normalizeSignature(signature);
    const expected = crypto
      .createHmac('sha256', config.webhookToken)
      .update(rawBody ?? JSON.stringify(payload ?? {}))
      .digest('hex');
    if (!normalizedSignature || !safeTimingCompare(expected, normalizedSignature)) {
      throw new AuthorizationError('Invalid Chatwoot webhook signature.');
    }
  }

  const body = payload?.payload ?? payload ?? {};
  const normalizedEvent = (eventName || body.event || body.event_name || '').toString().toLowerCase();

  switch (normalizedEvent) {
    case 'conversation_created':
    case 'conversation_updated': {
      const conversation = normalizeConversationPayload(body.conversation ?? body);
      const userId = resolveGigvoraUserId(conversation);
      if (!conversation || !userId) {
        log.warn({ event: normalizedEvent, conversationId: conversation?.id }, 'Skipped Chatwoot conversation sync');
        return { ignored: true };
      }
      const { threadId, participantIds } = await sequelize.transaction(async (transaction) => {
        const { thread } = await ensureThreadAndSupportCase(conversation, userId, { transaction });
        const participants = await collectParticipantIds(thread.id, transaction);
        return { threadId: thread.id, participantIds: participants };
      });
      flushCaches(threadId, participantIds);
      break;
    }
    case 'message_created': {
      const conversation = normalizeConversationPayload(body.conversation ?? body.message?.conversation ?? body);
      const message = normalizeMessagePayload(body.message ?? body);
      const userId = resolveGigvoraUserId(conversation);
      if (!conversation || !message || !userId) {
        log.warn({ event: normalizedEvent, conversationId: conversation?.id }, 'Skipped Chatwoot message sync');
        return { ignored: true };
      }
      const { threadId, participantIds } = await sequelize.transaction(async (transaction) => {
        const { thread, supportCase } = await ensureThreadAndSupportCase(conversation, userId, { transaction });
        const result = await upsertMessage(thread, supportCase, message, conversation, userId, { transaction });
        return {
          threadId: thread.id,
          participantIds: result.participantIds,
        };
      });
      flushCaches(threadId, participantIds);
      break;
    }
    default: {
      log.debug({ event: normalizedEvent }, 'Received Chatwoot webhook event with no handler');
      break;
    }
  }

  return { ok: true };
}

export default {
  isEnabled: isChatwootEnabled,
  getWidgetSettingsForUser,
  processWebhookEvent,
};
