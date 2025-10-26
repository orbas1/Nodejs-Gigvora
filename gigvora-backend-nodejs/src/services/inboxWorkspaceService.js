import { Op } from 'sequelize';
import {
  sequelize,
  MessageThread,
  MessageParticipant,
  Message,
  SupportCase,
  User,
  SavedReply,
  InboxPreference,
  InboxRoutingRule,
} from '../models/messagingModels.js';
import { ValidationError, NotFoundError, AuthorizationError } from '../utils/errors.js';
import { appCache, buildCacheKey } from '../utils/cache.js';

const WORKSPACE_CACHE_TTL = 45;
const THREAD_LIMIT = 6;
const SUPPORT_CASE_LIMIT = 8;
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const PINNED_THREAD_LIMIT = 24;
const SHORTCUT_LIMIT = 12;

const DEFAULT_WORKING_HOURS = Object.freeze({
  timezone: 'UTC',
  availability: {
    monday: { active: true, start: '09:00', end: '17:00' },
    tuesday: { active: true, start: '09:00', end: '17:00' },
    wednesday: { active: true, start: '09:00', end: '17:00' },
    thursday: { active: true, start: '09:00', end: '17:00' },
    friday: { active: true, start: '09:00', end: '16:00' },
    saturday: { active: false, start: '10:00', end: '14:00' },
    sunday: { active: false, start: '10:00', end: '14:00' },
  },
});

const DEFAULT_PREFERENCES = Object.freeze({
  timezone: DEFAULT_WORKING_HOURS.timezone,
  workingHours: DEFAULT_WORKING_HOURS,
  notificationsEmail: true,
  notificationsPush: true,
  autoArchiveAfterDays: null,
  autoResponderEnabled: false,
  autoResponderMessage: null,
  escalationKeywords: [],
  defaultSavedReplyId: null,
  pinnedThreadIds: [],
});

function invalidateWorkspaceCache(userId) {
  appCache.flushByPrefix(`messaging:inbox-workspace:${userId}`);
  appCache.flushByPrefix(`messaging:inbox:${userId}`);
}

function buildWorkspaceCacheKey(userId, extras = {}) {
  return buildCacheKey(`messaging:inbox-workspace:${userId}`, extras);
}

function coercePositiveId(value, label = 'identifier') {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError(`A valid ${label} is required for inbox operations.`);
  }
  return parsed;
}

function sanitizeParticipant(participant) {
  if (!participant) return null;
  const plain = participant.get({ plain: true });
  const nameParts = [plain.user?.firstName, plain.user?.lastName].filter(Boolean);
  return {
    id: plain.userId ?? plain.id,
    participantId: plain.id,
    name: nameParts.length ? nameParts.join(' ') : plain.user?.email ?? null,
    email: plain.user?.email ?? null,
    role: plain.role ?? 'participant',
    mutedUntil: plain.mutedUntil ?? null,
    notificationsEnabled: Boolean(plain.notificationsEnabled ?? true),
  };
}

function sanitizeSupportCaseRecord(record) {
  if (!record) return null;
  const plain = record.get({ plain: true });
  return {
    id: plain.id,
    threadId: plain.threadId,
    status: plain.status,
    priority: plain.priority,
    reason: plain.reason ?? null,
    metadata: plain.metadata ?? null,
    assignedTo: plain.assignedTo ?? null,
    assignedBy: plain.assignedBy ?? null,
    assignedAt: plain.assignedAt ?? null,
    escalatedBy: plain.escalatedBy ?? null,
    escalatedAt: plain.escalatedAt ?? null,
    firstResponseAt: plain.firstResponseAt ?? null,
    resolvedAt: plain.resolvedAt ?? null,
    resolutionSummary: plain.resolutionSummary ?? null,
    updatedAt: plain.updatedAt,
    thread: plain.thread
      ? {
          id: plain.thread.id,
          subject: plain.thread.subject,
          channelType: plain.thread.channelType,
          lastMessageAt: plain.thread.lastMessageAt,
          lastMessagePreview: plain.thread.lastMessagePreview,
        }
      : null,
  };
}

function validateTime(value, fallback) {
  const candidate = typeof value === 'string' ? value.trim() : '';
  if (/^\d{2}:\d{2}$/.test(candidate)) {
    return candidate;
  }
  if (fallback && /^\d{2}:\d{2}$/.test(fallback)) {
    return fallback;
  }
  return '09:00';
}

function normalizeWorkingHours(input) {
  if (!input || typeof input !== 'object') {
    return JSON.parse(JSON.stringify(DEFAULT_WORKING_HOURS));
  }
  const timezone = typeof input.timezone === 'string' && input.timezone.trim().length ? input.timezone.trim() : DEFAULT_WORKING_HOURS.timezone;
  const availability = {};
  DAY_KEYS.forEach((day) => {
    const rawDay = input?.availability?.[day] ?? input?.[day] ?? input?.[day.slice(0, 3)];
    const fallback = DEFAULT_WORKING_HOURS.availability[day];
    const active = Boolean(rawDay?.active ?? rawDay?.enabled ?? fallback.active ?? false);
    const start = validateTime(rawDay?.start, fallback.start);
    const end = validateTime(rawDay?.end, fallback.end);
    availability[day] = { active, start, end };
  });
  return { timezone, availability };
}

function normalizePinnedThreadIds(input, { limit = PINNED_THREAD_LIMIT } = {}) {
  if (!Array.isArray(input)) {
    return [];
  }
  const unique = [];
  const seen = new Set();
  input.forEach((value) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0 || seen.has(parsed)) {
      return;
    }
    seen.add(parsed);
    unique.push(parsed);
  });
  if (limit && unique.length > limit) {
    return unique.slice(0, limit);
  }
  return unique;
}

function normalizeShortcuts(values) {
  if (!Array.isArray(values)) {
    return [];
  }
  const result = [];
  const seen = new Set();
  values.forEach((value) => {
    if (typeof value !== 'string') {
      return;
    }
    const trimmed = value.trim().toLowerCase();
    if (!trimmed || seen.has(trimmed)) {
      return;
    }
    seen.add(trimmed);
    result.push(trimmed);
  });
  return result.slice(0, SHORTCUT_LIMIT);
}

function sanitizePreferences(record) {
  if (!record) {
    return {
      ...DEFAULT_PREFERENCES,
      workingHours: JSON.parse(JSON.stringify(DEFAULT_WORKING_HOURS)),
    };
  }
  const plain = record.toPublicObject ? record.toPublicObject() : record;
  const workingHours = normalizeWorkingHours(plain.workingHours);
  const pinnedThreadIds = normalizePinnedThreadIds(plain.pinnedThreadIds ?? []);
  return {
    id: plain.id ?? null,
    userId: plain.userId,
    timezone: plain.timezone ?? workingHours.timezone,
    workingHours,
    notificationsEmail: Boolean(plain.notificationsEmail ?? true),
    notificationsPush: Boolean(plain.notificationsPush ?? true),
    autoArchiveAfterDays: plain.autoArchiveAfterDays != null ? Number(plain.autoArchiveAfterDays) : null,
    autoResponderEnabled: Boolean(plain.autoResponderEnabled ?? false),
    autoResponderMessage: plain.autoResponderMessage ?? null,
    escalationKeywords: Array.isArray(plain.escalationKeywords) ? plain.escalationKeywords : [],
    defaultSavedReplyId: plain.defaultSavedReplyId ?? null,
    pinnedThreadIds,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
}

async function ensurePreference(userId, transaction) {
  const [record] = await InboxPreference.findOrCreate({
    where: { userId },
    defaults: {
      userId,
      timezone: DEFAULT_PREFERENCES.timezone,
      workingHours: JSON.parse(JSON.stringify(DEFAULT_WORKING_HOURS)),
      notificationsEmail: DEFAULT_PREFERENCES.notificationsEmail,
      notificationsPush: DEFAULT_PREFERENCES.notificationsPush,
      autoArchiveAfterDays: DEFAULT_PREFERENCES.autoArchiveAfterDays,
      autoResponderEnabled: DEFAULT_PREFERENCES.autoResponderEnabled,
      autoResponderMessage: DEFAULT_PREFERENCES.autoResponderMessage,
      escalationKeywords: DEFAULT_PREFERENCES.escalationKeywords,
      defaultSavedReplyId: DEFAULT_PREFERENCES.defaultSavedReplyId,
    },
    transaction,
  });
  return record;
}

async function setDefaultSavedReply(userId, replyId, { transaction } = {}) {
  await SavedReply.update(
    { isDefault: false },
    { where: { userId, id: { [Op.ne]: replyId } }, transaction },
  );
  await SavedReply.update({ isDefault: true }, { where: { userId, id: replyId }, transaction });
  await InboxPreference.update(
    { defaultSavedReplyId: replyId },
    { where: { userId }, transaction },
  );
}

function sanitizeSavedReply(record) {
  return record?.toPublicObject ? record.toPublicObject() : null;
}

function sanitizeRoutingRule(record) {
  return record?.toPublicObject ? record.toPublicObject() : null;
}

function buildParticipantDirectory(threads) {
  const map = new Map();
  threads.forEach((thread) => {
    (thread.participants ?? []).forEach((participant) => {
      const sanitized = sanitizeParticipant(participant);
      if (!sanitized || !sanitized.id) {
        return;
      }
      if (!map.has(sanitized.id)) {
        map.set(sanitized.id, sanitized);
      }
    });
  });
  return Array.from(map.values());
}

function computeSummary(userId, preferences, activeThreads, supportCases) {
  const unreadThreads = activeThreads.filter((thread) => thread.unread).length;
  const awaitingReply = activeThreads.filter((thread) => thread.awaitingReply).length;
  const responseSamples = activeThreads
    .map((thread) => {
      if (!thread.lastMessageAt || !thread.viewerLastReadAt) {
        return null;
      }
      const diff = new Date(thread.lastMessageAt).getTime() - new Date(thread.viewerLastReadAt).getTime();
      if (!Number.isFinite(diff) || diff <= 0) {
        return null;
      }
      return diff / (1000 * 60);
    })
    .filter((value) => Number.isFinite(value));
  const avgResponseMinutes = responseSamples.length
    ? Math.round(responseSamples.reduce((acc, value) => acc + value, 0) / responseSamples.length)
    : null;

  const openSupportCases = supportCases.filter((supportCase) =>
    supportCase.status && !['resolved', 'closed'].includes(supportCase.status),
  ).length;

  const lastUpdated = activeThreads.reduce((latest, thread) => {
    if (!thread.lastMessageAt) {
      return latest;
    }
    const timestamp = new Date(thread.lastMessageAt).getTime();
    if (!Number.isFinite(timestamp)) {
      return latest;
    }
    if (!latest) {
      return new Date(timestamp).toISOString();
    }
    return timestamp > new Date(latest).getTime() ? new Date(timestamp).toISOString() : latest;
  }, null);

  return {
    userId,
    unreadThreads,
    awaitingReply,
    avgResponseMinutes,
    openSupportCases,
    autoResponderEnabled: preferences.autoResponderEnabled,
    lastUpdated,
  };
}

function sanitizeThreadRecord(record, userId) {
  const plain = record.get({ plain: true });
  const viewer = Array.isArray(plain.viewerParticipants) ? plain.viewerParticipants.find((entry) => entry.userId === userId) : null;
  const viewerLastReadAt = viewer?.lastReadAt ?? null;
  const lastMessageAt = plain.lastMessageAt ?? plain.updatedAt ?? null;
  const lastMessage = Array.isArray(record.messages) && record.messages.length ? record.messages[0] : null;
  const awaitingReply = Boolean(lastMessage?.senderId && lastMessage.senderId !== userId);
  const unread = lastMessageAt ? (!viewerLastReadAt || new Date(lastMessageAt).getTime() > new Date(viewerLastReadAt).getTime()) : false;

  return {
    id: plain.id,
    subject: plain.subject,
    channelType: plain.channelType,
    state: plain.state,
    lastMessageAt,
    lastMessagePreview: plain.lastMessagePreview,
    metadata: plain.metadata ?? null,
    unread,
    awaitingReply,
    viewerLastReadAt,
    participants: Array.isArray(record.participants) ? record.participants.map(sanitizeParticipant).filter(Boolean) : [],
    supportCase: record.supportCase ? sanitizeSupportCaseRecord(record.supportCase) : null,
    lastMessage: lastMessage ? lastMessage.toPublicObject() : null,
  };
}

export async function getInboxWorkspace(userId, { forceRefresh = false } = {}) {
  const numericUserId = coercePositiveId(userId, 'userId');
  const cacheKey = buildWorkspaceCacheKey(numericUserId, { version: 2 });
  if (!forceRefresh) {
    const cached = await appCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const preferenceRecord = await ensurePreference(numericUserId);

  const [savedReplyRecords, routingRuleRecords, threadRecords, supportCaseRecords] = await Promise.all([
    SavedReply.findAll({
      where: { userId: numericUserId },
      order: [
        ['orderIndex', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    }),
    InboxRoutingRule.findAll({
      where: { userId: numericUserId },
      order: [
        ['priority', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    }),
    MessageThread.findAll({
      include: [
        {
          model: MessageParticipant,
          as: 'participants',
          include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        },
        {
          model: MessageParticipant,
          as: 'viewerParticipants',
          where: { userId: numericUserId },
          required: false,
        },
        {
          model: Message,
          as: 'messages',
          separate: true,
          limit: 1,
          order: [['createdAt', 'DESC']],
        },
        { model: SupportCase, as: 'supportCase', required: false },
      ],
      order: [['lastMessageAt', 'DESC']],
      limit: THREAD_LIMIT,
    }),
    SupportCase.findAll({
      include: [
        {
          model: MessageThread,
          as: 'thread',
          include: [
            {
              model: MessageParticipant,
              as: 'viewerParticipants',
              where: { userId: numericUserId },
            },
          ],
        },
      ],
      order: [['updatedAt', 'DESC']],
      limit: SUPPORT_CASE_LIMIT,
    }),
  ]);

  const preferences = sanitizePreferences(preferenceRecord);
  const pinnedSet = new Set(preferences.pinnedThreadIds);
  const savedReplies = savedReplyRecords.map(sanitizeSavedReply).filter(Boolean);
  const routingRules = routingRuleRecords.map(sanitizeRoutingRule).filter(Boolean);
  const activeThreads = threadRecords
    .map((record) => sanitizeThreadRecord(record, numericUserId))
    .map((thread) => ({ ...thread, pinned: pinnedSet.has(thread.id) }));
  const orderedThreads = [...activeThreads].sort((a, b) => {
    if (a.pinned && !b.pinned) {
      return -1;
    }
    if (!a.pinned && b.pinned) {
      return 1;
    }
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });
  const supportCases = supportCaseRecords.map(sanitizeSupportCaseRecord).filter(Boolean);
  const participantDirectory = buildParticipantDirectory(threadRecords);
  const summary = computeSummary(numericUserId, preferences, activeThreads, supportCases);

  const workspace = {
    userId: numericUserId,
    summary,
    preferences,
    savedReplies,
    routingRules,
    activeThreads: orderedThreads,
    supportCases,
    participantDirectory,
    lastSyncedAt: new Date().toISOString(),
  };

  await appCache.set(cacheKey, workspace, WORKSPACE_CACHE_TTL);
  return workspace;
}

async function ensureThreadMembership(userId, threadId, transaction) {
  const participant = await MessageParticipant.findOne({
    where: { userId, threadId },
    transaction,
  });
  if (!participant) {
    throw new AuthorizationError('You can only manage threads you participate in.');
  }
  return participant;
}

async function persistPinnedThreadIds(userId, mutator) {
  const numericUserId = coercePositiveId(userId, 'userId');
  return sequelize.transaction(async (transaction) => {
    const preference = await ensurePreference(numericUserId, transaction);
    const current = normalizePinnedThreadIds(preference.pinnedThreadIds ?? []);
    const next = normalizePinnedThreadIds(await mutator(current, { transaction }));
    preference.pinnedThreadIds = next;
    await preference.save({ transaction });
    invalidateWorkspaceCache(numericUserId);
    return sanitizePreferences(preference);
  });
}

export async function pinInboxThread(userId, threadId) {
  const numericThreadId = coercePositiveId(threadId, 'threadId');
  return persistPinnedThreadIds(userId, async (current, { transaction }) => {
    const numericUserId = coercePositiveId(userId, 'userId');
    await ensureThreadMembership(numericUserId, numericThreadId, transaction);
    const next = [numericThreadId, ...current.filter((id) => id !== numericThreadId)];
    return next.slice(0, PINNED_THREAD_LIMIT);
  });
}

export async function unpinInboxThread(userId, threadId) {
  const numericThreadId = coercePositiveId(threadId, 'threadId');
  return persistPinnedThreadIds(userId, async (current) => current.filter((id) => id !== numericThreadId));
}

export async function reorderPinnedThreads(userId, threadIds = []) {
  const requestedOrder = normalizePinnedThreadIds(threadIds);
  const numericUserId = coercePositiveId(userId, 'userId');
  return persistPinnedThreadIds(numericUserId, async (current, { transaction }) => {
    if (!requestedOrder.length) {
      return [];
    }
    const participants = await MessageParticipant.findAll({
      where: { userId: numericUserId, threadId: { [Op.in]: requestedOrder } },
      attributes: ['threadId'],
      transaction,
    });
    const accessible = new Set(participants.map((participant) => participant.threadId));
    const ordered = requestedOrder.filter((id) => accessible.has(id));
    const remainder = current.filter((id) => accessible.has(id) && !ordered.includes(id));
    return [...ordered, ...remainder].slice(0, PINNED_THREAD_LIMIT);
  });
}

export async function updateInboxPreferences(userId, patch = {}) {
  const numericUserId = coercePositiveId(userId, 'userId');
  return sequelize.transaction(async (transaction) => {
    const record = await ensurePreference(numericUserId, transaction);
    const workingHours = patch.workingHours ? normalizeWorkingHours(patch.workingHours) : normalizeWorkingHours(record.workingHours);
    const updates = {
      timezone: typeof patch.timezone === 'string' && patch.timezone.trim().length ? patch.timezone.trim() : workingHours.timezone,
      workingHours,
    };

    if (typeof patch.notificationsEmail === 'boolean') {
      updates.notificationsEmail = patch.notificationsEmail;
    }
    if (typeof patch.notificationsPush === 'boolean') {
      updates.notificationsPush = patch.notificationsPush;
    }
    if (patch.autoArchiveAfterDays === null || patch.autoArchiveAfterDays === undefined) {
      updates.autoArchiveAfterDays = null;
    } else if (Number.isFinite(Number(patch.autoArchiveAfterDays))) {
      const numeric = Number.parseInt(patch.autoArchiveAfterDays, 10);
      if (numeric < 0) {
        throw new ValidationError('autoArchiveAfterDays must be zero or a positive number.');
      }
      updates.autoArchiveAfterDays = numeric;
    }
    if (typeof patch.autoResponderEnabled === 'boolean') {
      updates.autoResponderEnabled = patch.autoResponderEnabled;
    }
    if (typeof patch.autoResponderMessage === 'string' || patch.autoResponderMessage === null) {
      updates.autoResponderMessage = patch.autoResponderMessage;
    }
    if (Array.isArray(patch.escalationKeywords)) {
      updates.escalationKeywords = patch.escalationKeywords.filter((keyword) => typeof keyword === 'string' && keyword.trim().length);
    }

    if (patch.defaultSavedReplyId != null) {
      const replyId = Number(patch.defaultSavedReplyId);
      if (!Number.isFinite(replyId) || replyId <= 0) {
        throw new ValidationError('defaultSavedReplyId must be a positive integer.');
      }
      const reply = await SavedReply.findOne({ where: { id: replyId, userId: numericUserId }, transaction });
      if (!reply) {
        throw new NotFoundError('Saved reply not found for this user.');
      }
      await setDefaultSavedReply(numericUserId, replyId, { transaction });
      updates.defaultSavedReplyId = replyId;
    }

    record.set(updates);
    await record.save({ transaction });
    invalidateWorkspaceCache(numericUserId);
    return sanitizePreferences(record);
  });
}

export async function createSavedReply(userId, payload = {}) {
  const numericUserId = coercePositiveId(userId, 'userId');
  return sequelize.transaction(async (transaction) => {
    const title = typeof payload.title === 'string' && payload.title.trim().length ? payload.title.trim() : null;
    const body = typeof payload.body === 'string' && payload.body.trim().length ? payload.body.trim() : null;
    if (!title) {
      throw new ValidationError('A title is required for a saved reply.');
    }
    if (!body) {
      throw new ValidationError('A message body is required for a saved reply.');
    }

    const orderIndex = Number.isFinite(Number(payload.orderIndex))
      ? Number.parseInt(payload.orderIndex, 10)
      : await SavedReply.count({ where: { userId: numericUserId }, transaction });

    const normalizedShortcuts = normalizeShortcuts(payload.shortcuts ?? []);
    const primaryShortcut = payload.shortcut ? String(payload.shortcut).trim().toLowerCase() : normalizedShortcuts[0] ?? null;
    if (primaryShortcut && !normalizedShortcuts.includes(primaryShortcut)) {
      normalizedShortcuts.unshift(primaryShortcut);
    }

    const reply = await SavedReply.create(
      {
        userId: numericUserId,
        title,
        body,
        category: payload.category ?? null,
        shortcut: primaryShortcut,
        shortcuts: normalizedShortcuts.length ? normalizedShortcuts : null,
        isDefault: Boolean(payload.isDefault),
        metadata: payload.metadata ?? null,
        orderIndex,
      },
      { transaction },
    );

    if (reply.shortcut) {
      reply.shortcut = reply.shortcut.toLowerCase();
      await reply.save({ transaction });
    }

    const preference = await ensurePreference(numericUserId, transaction);
    const defaultCount = await SavedReply.count({ where: { userId: numericUserId, isDefault: true }, transaction });

    if (payload.isDefault) {
      await setDefaultSavedReply(numericUserId, reply.id, { transaction });
      reply.isDefault = true;
    } else if (defaultCount === 0 || !preference.defaultSavedReplyId) {
      await setDefaultSavedReply(numericUserId, reply.id, { transaction });
      reply.isDefault = true;
    }

    invalidateWorkspaceCache(numericUserId);
    return sanitizeSavedReply(reply);
  });
}

export async function updateSavedReply(userId, replyId, patch = {}) {
  const numericUserId = coercePositiveId(userId, 'userId');
  const numericReplyId = coercePositiveId(replyId, 'replyId');
  return sequelize.transaction(async (transaction) => {
    const reply = await SavedReply.findOne({ where: { id: numericReplyId, userId: numericUserId }, transaction });
    if (!reply) {
      throw new NotFoundError('Saved reply not found.');
    }

    if (typeof patch.title === 'string' && patch.title.trim().length) {
      reply.title = patch.title.trim();
    }
    if (typeof patch.body === 'string' && patch.body.trim().length) {
      reply.body = patch.body.trim();
    }
    if (patch.category !== undefined) {
      reply.category = patch.category ?? null;
    }
    if (patch.shortcuts !== undefined) {
      const normalizedShortcuts = normalizeShortcuts(patch.shortcuts ?? []);
      reply.shortcuts = normalizedShortcuts.length ? normalizedShortcuts : null;
      if (reply.shortcut && normalizedShortcuts.length && !normalizedShortcuts.includes(reply.shortcut)) {
        reply.shortcut = normalizedShortcuts[0];
      }
      if (!normalizedShortcuts.length && patch.shortcut === undefined) {
        reply.shortcut = null;
      }
    }
    if (patch.shortcut !== undefined) {
      reply.shortcut = patch.shortcut ? patch.shortcut.toLowerCase() : null;
      if (reply.shortcut && Array.isArray(reply.shortcuts)) {
        reply.shortcuts = normalizeShortcuts([reply.shortcut, ...reply.shortcuts]);
      }
    }
    if (patch.metadata !== undefined) {
      reply.metadata = patch.metadata ?? null;
    }
    if (patch.orderIndex !== undefined && Number.isFinite(Number(patch.orderIndex))) {
      reply.orderIndex = Number.parseInt(patch.orderIndex, 10);
    }

    await reply.save({ transaction });

    if (typeof patch.isDefault === 'boolean') {
      if (patch.isDefault) {
        await setDefaultSavedReply(numericUserId, reply.id, { transaction });
        reply.isDefault = true;
      } else if (reply.isDefault) {
        await InboxPreference.update(
          { defaultSavedReplyId: null },
          { where: { userId: numericUserId }, transaction },
        );
        reply.isDefault = false;
      }
    }

    invalidateWorkspaceCache(numericUserId);
    return sanitizeSavedReply(reply);
  });
}

export async function deleteSavedReply(userId, replyId) {
  const numericUserId = coercePositiveId(userId, 'userId');
  const numericReplyId = coercePositiveId(replyId, 'replyId');
  return sequelize.transaction(async (transaction) => {
    const reply = await SavedReply.findOne({ where: { id: numericReplyId, userId: numericUserId }, transaction });
    if (!reply) {
      throw new NotFoundError('Saved reply not found.');
    }
    await reply.destroy({ transaction });

    const preference = await ensurePreference(numericUserId, transaction);
    if (preference.defaultSavedReplyId === numericReplyId) {
      const nextDefault = await SavedReply.findOne({
        where: { userId: numericUserId },
        order: [
          ['isDefault', 'DESC'],
          ['orderIndex', 'ASC'],
          ['createdAt', 'ASC'],
        ],
        transaction,
      });
      if (nextDefault) {
        await setDefaultSavedReply(numericUserId, nextDefault.id, { transaction });
      } else {
        await InboxPreference.update(
          { defaultSavedReplyId: null },
          { where: { userId: numericUserId }, transaction },
        );
      }
    }

    invalidateWorkspaceCache(numericUserId);
    return true;
  });
}

function normalizeRoutingRulePayload(payload) {
  const result = {
    name: typeof payload.name === 'string' ? payload.name.trim() : '',
    description: payload.description ?? null,
    matchType: typeof payload.matchType === 'string' ? payload.matchType.trim().toLowerCase() : 'keyword',
    criteria: payload.criteria ?? null,
    action: payload.action ?? null,
    enabled: payload.enabled !== undefined ? Boolean(payload.enabled) : true,
    stopProcessing: payload.stopProcessing !== undefined ? Boolean(payload.stopProcessing) : false,
    priority: Number.isFinite(Number(payload.priority)) ? Number.parseInt(payload.priority, 10) : 0,
  };

  if (!result.name) {
    throw new ValidationError('A name is required for a routing rule.');
  }
  if (!['keyword', 'channel', 'priority', 'support', 'custom'].includes(result.matchType)) {
    throw new ValidationError('matchType must be one of keyword, channel, priority, support, or custom.');
  }
  if (result.priority < 0) {
    result.priority = 0;
  }
  return result;
}

export async function createRoutingRule(userId, payload = {}) {
  const numericUserId = coercePositiveId(userId, 'userId');
  const normalized = normalizeRoutingRulePayload(payload);
  const rule = await InboxRoutingRule.create({
    userId: numericUserId,
    ...normalized,
  });
  invalidateWorkspaceCache(numericUserId);
  return sanitizeRoutingRule(rule);
}

export async function updateRoutingRule(userId, ruleId, patch = {}) {
  const numericUserId = coercePositiveId(userId, 'userId');
  const numericRuleId = coercePositiveId(ruleId, 'ruleId');
  const rule = await InboxRoutingRule.findOne({ where: { id: numericRuleId, userId: numericUserId } });
  if (!rule) {
    throw new NotFoundError('Routing rule not found.');
  }
  const normalized = normalizeRoutingRulePayload({ ...rule.toPublicObject(), ...patch });
  Object.assign(rule, normalized);
  await rule.save();
  invalidateWorkspaceCache(numericUserId);
  return sanitizeRoutingRule(rule);
}

export async function deleteRoutingRule(userId, ruleId) {
  const numericUserId = coercePositiveId(userId, 'userId');
  const numericRuleId = coercePositiveId(ruleId, 'ruleId');
  const deleted = await InboxRoutingRule.destroy({ where: { id: numericRuleId, userId: numericUserId } });
  if (!deleted) {
    throw new NotFoundError('Routing rule not found.');
  }
  invalidateWorkspaceCache(numericUserId);
  return true;
}

export const __testing = {
  DEFAULT_WORKING_HOURS,
  DEFAULT_PREFERENCES,
  buildWorkspaceCacheKey,
  coercePositiveId,
  sanitizeParticipant,
  sanitizeSupportCaseRecord,
  normalizeWorkingHours,
  sanitizePreferences,
  normalizePinnedThreadIds,
  normalizeShortcuts,
};

export default {
  getInboxWorkspace,
  updateInboxPreferences,
  createSavedReply,
  updateSavedReply,
  deleteSavedReply,
  createRoutingRule,
  updateRoutingRule,
  deleteRoutingRule,
  pinInboxThread,
  unpinInboxThread,
  reorderPinnedThreads,
};
