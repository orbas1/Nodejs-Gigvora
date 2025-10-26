'use strict';

const { QueryTypes, Op } = require('sequelize');

const THREAD_SUBJECT = 'Workspace onboarding warmup';
const THREAD_METADATA = {
  projectId: 404,
  workspace: 'Atlas Workspace',
  communicationChannel: 'atlas-onboarding',
};
const PARTICIPANT_SEEDS = [
  { email: 'mia@gigvora.com', role: 'owner', notificationsEnabled: true },
  { email: 'leo@gigvora.com', role: 'participant', notificationsEnabled: true },
  { email: 'ava@gigvora.com', role: 'support', notificationsEnabled: true },
];
const MESSAGE_SEEDS = [
  {
    key: 'welcome',
    senderEmail: 'mia@gigvora.com',
    body:
      'Welcome aboard, Leo! I have shared the architecture runbook and the client meeting notes. Let us confirm the integration timeline tomorrow.',
    createdMinutesAgo: 45,
    metadata: { category: 'kickoff', attachments: [] },
  },
  {
    key: 'reply',
    senderEmail: 'leo@gigvora.com',
    body:
      'Thanks, Mia. I will review the runbook this afternoon and push the first checklist updates tonight. Expect a status digest in the workspace by 10:00 UTC tomorrow.',
    createdMinutesAgo: 32,
    metadata: { category: 'update' },
  },
  {
    key: 'support',
    senderEmail: 'ava@gigvora.com',
    body:
      'Support is monitoring the workspace automations. Ping this thread if you see any deployment drift and I will escalate to the duty engineer.',
    createdMinutesAgo: 18,
    metadata: { category: 'support' },
  },
];

const SAVED_REPLY_SEEDS = [
  {
    key: 'leo_kickoff_recap',
    email: 'leo@gigvora.com',
    title: 'Kickoff recap & next steps',
    body:
      'Thanks for joining the kickoff earlier today. Here is the quick recap and next steps:\n\n• Finalise integration checklist tonight\n• Share telemetry snapshots in the morning\n• Confirm the approval cadence with ops before Friday.\n\nPing me if you need anything clarified — otherwise expect the status digest by 10:00 UTC.',
    shortcut: 'kickoff',
    shortcuts: ['kickoff', 'recap', 'summary'],
    metadata: { tone: 'mentor', category: 'recap' },
    isDefault: true,
    orderIndex: 0,
  },
  {
    key: 'leo_resource_pack',
    email: 'leo@gigvora.com',
    title: 'Resource pack delivery',
    body:
      'Sharing the resource pack we discussed — the architecture diagrams, onboarding deck, and the automation checklists are linked below. Everything is permissioned for Atlas Workspace collaborators.',
    shortcut: 'resources',
    shortcuts: ['resources', 'links'],
    metadata: { tone: 'supportive', category: 'follow_up' },
    isDefault: false,
    orderIndex: 1,
  },
  {
    key: 'mia_ops_digest',
    email: 'mia@gigvora.com',
    title: 'Operations digest acknowledgement',
    body:
      'Appreciate the update — the operations pod captured your note and queued the follow-up tasks. Expect a wrap-up digest before the close of business with ownership across analytics, ops, and support.',
    shortcut: 'digest',
    shortcuts: ['digest', 'ops'],
    metadata: { tone: 'operations', category: 'ops' },
    isDefault: true,
    orderIndex: 0,
  },
];

const ROUTING_RULE_SEEDS = [
  {
    email: 'leo@gigvora.com',
    name: 'Escalate VIP client keywords',
    description: 'Routes priority signals containing VIP keywords to the client-success queue.',
    matchType: 'keyword',
    criteria: { keywords: ['vip', 'priority', 'escalate'] },
    action: { escalateTo: 'client-success', applyLabel: 'Priority', notify: ['client-success-leads@gigvora.com'] },
    enabled: true,
    stopProcessing: true,
    priority: 5,
  },
  {
    email: 'mia@gigvora.com',
    name: 'After-hours on-call automation',
    description: 'Automatically nudges the on-call lead when messages land outside staffed hours.',
    matchType: 'custom',
    criteria: {
      schedule: { timezone: 'UTC', windows: [{ start: '18:00', end: '08:00' }] },
      channels: ['project', 'support'],
    },
    action: {
      escalateTo: 'ops-on-call',
      autoResponderTemplate: 'after-hours',
      notify: ['ops-duty@gigvora.com'],
    },
    enabled: true,
    stopProcessing: false,
    priority: 10,
  },
];

const DEFAULT_WORKING_HOURS_TEMPLATE = {
  monday: { active: true, start: '09:00', end: '17:00' },
  tuesday: { active: true, start: '09:00', end: '17:00' },
  wednesday: { active: true, start: '09:00', end: '17:00' },
  thursday: { active: true, start: '09:00', end: '17:00' },
  friday: { active: true, start: '09:00', end: '16:00' },
  saturday: { active: false, start: '10:00', end: '14:00' },
  sunday: { active: false, start: '10:00', end: '14:00' },
};

function minutesAgoToDate(baseDate, minutesAgo) {
  return new Date(baseDate.getTime() - minutesAgo * 60 * 1000);
}

function parseJsonColumn(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }
  if (Buffer.isBuffer(value)) {
    try {
      return JSON.parse(value.toString());
    } catch (error) {
      return null;
    }
  }
  return value;
}

function uniqueNumberArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }
  const result = [];
  const seen = new Set();
  values.forEach((entry) => {
    const parsed = Number.parseInt(entry, 10);
    if (!Number.isFinite(parsed) || parsed <= 0 || seen.has(parsed)) {
      return;
    }
    seen.add(parsed);
    result.push(parsed);
  });
  return result;
}

function normaliseKeywords(values = []) {
  if (!Array.isArray(values)) {
    return [];
  }
  const seen = new Set();
  const result = [];
  values.forEach((value) => {
    if (typeof value !== 'string') {
      return;
    }
    const normalised = value.trim().toLowerCase();
    if (!normalised || seen.has(normalised)) {
      return;
    }
    seen.add(normalised);
    result.push(normalised);
  });
  return result;
}

function buildWorkingHoursSeed({ timezone = 'UTC', availability = {} } = {}) {
  const normalisedAvailability = {};
  Object.entries(DEFAULT_WORKING_HOURS_TEMPLATE).forEach(([day, template]) => {
    const override = availability[day] ?? availability[day.slice(0, 3)] ?? {};
    const active =
      override.active != null
        ? Boolean(override.active)
        : override.enabled != null
        ? Boolean(override.enabled)
        : Boolean(template.active);
    const startCandidate = typeof override.start === 'string' ? override.start.trim() : '';
    const endCandidate = typeof override.end === 'string' ? override.end.trim() : '';
    const start = /^\d{2}:\d{2}$/.test(startCandidate) ? startCandidate : template.start;
    const end = /^\d{2}:\d{2}$/.test(endCandidate) ? endCandidate : template.end;
    normalisedAvailability[day] = { active, start, end };
  });
  return { timezone, availability: normalisedAvailability };
}

function prepareShortcutSeed(shortcut, shortcuts = []) {
  const entries = [];
  if (typeof shortcut === 'string') {
    entries.push(shortcut);
  }
  if (Array.isArray(shortcuts)) {
    entries.push(...shortcuts);
  }
  const seen = new Set();
  const result = [];
  entries.forEach((value) => {
    if (typeof value !== 'string') {
      return;
    }
    const normalised = value.trim().toLowerCase();
    if (!normalised || seen.has(normalised)) {
      return;
    }
    seen.add(normalised);
    result.push(normalised);
  });
  return {
    shortcut: result[0] ?? null,
    shortcuts: result.length ? result : null,
  };
}

async function seedSavedReplies(queryInterface, transaction, userMap, baseDate) {
  const repliesByKey = new Map();
  const timestamp = new Date(baseDate);
  for (const seed of SAVED_REPLY_SEEDS) {
    const userId = userMap.get(seed.email);
    if (!userId) {
      continue;
    }
    const preparedShortcuts = prepareShortcutSeed(seed.shortcut, seed.shortcuts);
    const orderIndex = Number.isFinite(Number(seed.orderIndex))
      ? Number.parseInt(seed.orderIndex, 10)
      : 0;
    const insertPayload = {
      userId,
      title: seed.title,
      body: seed.body,
      category: seed.category ?? null,
      shortcut: preparedShortcuts.shortcut,
      shortcuts: preparedShortcuts.shortcuts,
      isDefault: Boolean(seed.isDefault),
      metadata: seed.metadata ?? null,
      orderIndex,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const existing = await queryInterface.sequelize.query(
      'SELECT id FROM saved_replies WHERE userId = :userId AND title = :title LIMIT 1',
      { type: QueryTypes.SELECT, transaction, replacements: { userId, title: seed.title } },
    );
    let replyId;
    if (existing.length) {
      await queryInterface.bulkUpdate(
        'saved_replies',
        {
          body: seed.body,
          category: seed.category ?? null,
          shortcut: preparedShortcuts.shortcut,
          shortcuts: preparedShortcuts.shortcuts,
          isDefault: Boolean(seed.isDefault),
          metadata: seed.metadata ?? null,
          orderIndex,
          updatedAt: timestamp,
        },
        { id: existing[0].id },
        { transaction },
      );
      replyId = existing[0].id;
    } else {
      await queryInterface.bulkInsert('saved_replies', [insertPayload], { transaction });
      const inserted = await queryInterface.sequelize.query(
        'SELECT id FROM saved_replies WHERE userId = :userId AND title = :title ORDER BY id DESC LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { userId, title: seed.title } },
      );
      if (!inserted.length) {
        throw new Error('Failed to seed saved reply.');
      }
      replyId = inserted[0].id;
    }
    repliesByKey.set(seed.key, { id: replyId, userId, isDefault: Boolean(seed.isDefault) });
  }
  return repliesByKey;
}

function normaliseObject(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }
  if (Array.isArray(value)) {
    return value.length ? value : null;
  }
  return Object.keys(value).length ? value : null;
}

async function seedRoutingRules(queryInterface, transaction, userMap, baseDate) {
  const timestamp = new Date(baseDate);
  for (const seed of ROUTING_RULE_SEEDS) {
    const userId = userMap.get(seed.email);
    if (!userId) {
      continue;
    }
    const existing = await queryInterface.sequelize.query(
      'SELECT id FROM inbox_routing_rules WHERE userId = :userId AND name = :name LIMIT 1',
      { type: QueryTypes.SELECT, transaction, replacements: { userId, name: seed.name } },
    );
    const payload = {
      description: seed.description ?? null,
      matchType: (seed.matchType ?? 'keyword').toLowerCase(),
      criteria: normaliseObject(seed.criteria),
      action: normaliseObject(seed.action),
      enabled: seed.enabled !== false,
      stopProcessing: Boolean(seed.stopProcessing),
      priority: Number.isFinite(Number(seed.priority))
        ? Number.parseInt(seed.priority, 10)
        : 0,
      updatedAt: timestamp,
    };
    if (existing.length) {
      await queryInterface.bulkUpdate('inbox_routing_rules', payload, { id: existing[0].id }, { transaction });
    } else {
      await queryInterface.bulkInsert(
        'inbox_routing_rules',
        [{ userId, name: seed.name, ...payload, createdAt: timestamp }],
        { transaction },
      );
    }
  }
}

async function ensureInboxPreferences(queryInterface, transaction, options = {}) {
  const {
    userId,
    pinnedThreadIds = [],
    defaultSavedReplyKey,
    savedRepliesByKey = new Map(),
    timezone,
    workingHours,
    autoArchiveAfterDays,
    autoResponderEnabled,
    autoResponderMessage,
    escalationKeywords = [],
    baseDate = new Date(),
  } = options;

  if (!userId) {
    return;
  }

  const timestamp = new Date(baseDate);
  const defaultReply =
    defaultSavedReplyKey && savedRepliesByKey instanceof Map
      ? savedRepliesByKey.get(defaultSavedReplyKey)
      : null;
  const defaultSavedReplyId = defaultReply?.id ?? null;

  const preferenceRows = await queryInterface.sequelize.query(
    'SELECT id, timezone, workingHours, notificationsEmail, notificationsPush, autoArchiveAfterDays, autoResponderEnabled, autoResponderMessage, escalationKeywords, defaultSavedReplyId, pinnedThreadIds FROM inbox_preferences WHERE userId = :userId LIMIT 1',
    { type: QueryTypes.SELECT, transaction, replacements: { userId } },
  );
  const currentPreference = preferenceRows.length ? preferenceRows[0] : null;

  const existingPins = uniqueNumberArray(parseJsonColumn(currentPreference?.pinnedThreadIds) ?? []);
  const mergedPins = uniqueNumberArray([...existingPins, ...pinnedThreadIds]);
  const existingEscalations = parseJsonColumn(currentPreference?.escalationKeywords);
  const mergedEscalations = normaliseKeywords([
    ...(Array.isArray(existingEscalations) ? existingEscalations : []),
    ...escalationKeywords,
  ]);

  const resolvedTimezone = timezone ?? currentPreference?.timezone ?? workingHours?.timezone ?? 'UTC';
  const resolvedWorkingHours =
    workingHours ??
    parseJsonColumn(currentPreference?.workingHours) ??
    buildWorkingHoursSeed({ timezone: resolvedTimezone });

  const archiveCandidate =
    autoArchiveAfterDays != null
      ? Number.parseInt(autoArchiveAfterDays, 10)
      : currentPreference?.autoArchiveAfterDays ?? null;
  const archiveValue =
    Number.isFinite(archiveCandidate) && archiveCandidate >= 0 ? archiveCandidate : null;

  const updatePayload = {
    timezone: resolvedTimezone,
    workingHours: resolvedWorkingHours,
    notificationsEmail:
      currentPreference?.notificationsEmail != null
        ? Boolean(currentPreference.notificationsEmail)
        : true,
    notificationsPush:
      currentPreference?.notificationsPush != null
        ? Boolean(currentPreference.notificationsPush)
        : true,
    autoArchiveAfterDays: archiveValue,
    autoResponderEnabled:
      autoResponderEnabled != null
        ? Boolean(autoResponderEnabled)
        : Boolean(currentPreference?.autoResponderEnabled ?? false),
    autoResponderMessage:
      autoResponderMessage != null
        ? autoResponderMessage
        : currentPreference?.autoResponderMessage ?? null,
    escalationKeywords: mergedEscalations,
    defaultSavedReplyId: defaultSavedReplyId ?? currentPreference?.defaultSavedReplyId ?? null,
    pinnedThreadIds: mergedPins,
    updatedAt: timestamp,
  };

  if (currentPreference) {
    await queryInterface.bulkUpdate('inbox_preferences', updatePayload, { userId }, { transaction });
  } else {
    await queryInterface.bulkInsert(
      'inbox_preferences',
      [{ userId, ...updatePayload, createdAt: timestamp }],
      { transaction },
    );
  }

  if (updatePayload.defaultSavedReplyId) {
    await queryInterface.bulkUpdate(
      'saved_replies',
      { isDefault: false, updatedAt: timestamp },
      { userId, id: { [Op.ne]: updatePayload.defaultSavedReplyId } },
      { transaction },
    );
    await queryInterface.bulkUpdate(
      'saved_replies',
      { isDefault: true, updatedAt: timestamp },
      { id: updatePayload.defaultSavedReplyId },
      { transaction },
    );
  }
}

async function resolveUserMap(queryInterface, transaction, emails) {
  const users = await queryInterface.sequelize.query(
    'SELECT id, email FROM users WHERE email IN (:emails)',
    { type: QueryTypes.SELECT, transaction, replacements: { emails } },
  );
  return new Map(users.map((row) => [row.email, row.id]));
}

async function ensureThread(queryInterface, transaction, createdBy, createdAt) {
  const existing = await queryInterface.sequelize.query(
    'SELECT id FROM message_threads WHERE subject = :subject AND createdBy = :createdBy LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { subject: THREAD_SUBJECT, createdBy },
    },
  );

  if (existing.length) {
    return existing[0].id;
  }

  await queryInterface.bulkInsert(
    'message_threads',
    [
      {
        subject: THREAD_SUBJECT,
        channelType: 'project',
        state: 'active',
        createdBy,
        metadata: THREAD_METADATA,
        lastMessageAt: createdAt,
        lastMessagePreview: null,
        retentionPolicy: 'inherit',
        retentionDays: null,
        retentionExpiresAt: new Date(createdAt.getTime() + 548 * 24 * 60 * 60 * 1000),
        retentionLocked: false,
        createdAt,
        updatedAt: createdAt,
      },
    ],
    { transaction },
  );

  const inserted = await queryInterface.sequelize.query(
    'SELECT id FROM message_threads WHERE subject = :subject AND createdBy = :createdBy ORDER BY id DESC LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { subject: THREAD_SUBJECT, createdBy },
    },
  );

  if (!inserted.length) {
    throw new Error('Failed to seed messaging thread.');
  }

  return inserted[0].id;
}

async function ensureParticipants(queryInterface, transaction, threadId, participantSeeds, userMap, timestamp) {
  const participants = new Map();

  for (const seed of participantSeeds) {
    const userId = userMap.get(seed.email);
    if (!userId) {
      throw new Error(`Missing seed user for email ${seed.email}`);
    }

    const existing = await queryInterface.sequelize.query(
      'SELECT id, lastReadAt FROM message_participants WHERE threadId = :threadId AND userId = :userId LIMIT 1',
      {
        type: QueryTypes.SELECT,
        transaction,
        replacements: { threadId, userId },
      },
    );

    if (existing.length) {
      participants.set(seed.email, { id: existing[0].id, userId, lastReadAt: existing[0].lastReadAt ?? null });
      continue;
    }

    await queryInterface.bulkInsert(
      'message_participants',
      [
        {
          threadId,
          userId,
          role: seed.role,
          notificationsEnabled: seed.notificationsEnabled,
          mutedUntil: null,
          lastReadAt: null,
          metadata: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      { transaction },
    );

    const inserted = await queryInterface.sequelize.query(
      'SELECT id, lastReadAt FROM message_participants WHERE threadId = :threadId AND userId = :userId LIMIT 1',
      {
        type: QueryTypes.SELECT,
        transaction,
        replacements: { threadId, userId },
      },
    );

    if (!inserted.length) {
      throw new Error('Failed to seed message participant.');
    }

    participants.set(seed.email, { id: inserted[0].id, userId, lastReadAt: inserted[0].lastReadAt ?? null });
  }

  return participants;
}

async function ensureMessages(queryInterface, transaction, threadId, participantMap, baseDate) {
  const messagesByKey = new Map();

  for (const seed of MESSAGE_SEEDS) {
    const sender = participantMap.get(seed.senderEmail);
    if (!sender) {
      throw new Error(`Missing participant for ${seed.senderEmail}`);
    }

    const createdAt = minutesAgoToDate(baseDate, seed.createdMinutesAgo);
    const existing = await queryInterface.sequelize.query(
      'SELECT id, createdAt FROM messages WHERE threadId = :threadId AND senderId = :senderId AND body = :body LIMIT 1',
      {
        type: QueryTypes.SELECT,
        transaction,
        replacements: {
          threadId,
          senderId: sender.userId,
          body: seed.body,
        },
      },
    );

    if (!existing.length) {
      await queryInterface.bulkInsert(
        'messages',
        [
          {
            threadId,
            senderId: sender.userId,
            messageType: 'text',
            body: seed.body,
            metadata: seed.metadata,
            isEdited: false,
            editedAt: null,
            deletedAt: null,
            deliveredAt: createdAt,
            readAt: null,
            createdAt,
            updatedAt: createdAt,
          },
        ],
        { transaction },
      );
    }

    const messageRow = await queryInterface.sequelize.query(
      'SELECT id, createdAt FROM messages WHERE threadId = :threadId AND senderId = :senderId AND body = :body ORDER BY id DESC LIMIT 1',
      {
        type: QueryTypes.SELECT,
        transaction,
        replacements: {
          threadId,
          senderId: sender.userId,
          body: seed.body,
        },
      },
    );

    if (!messageRow.length) {
      throw new Error('Unable to resolve seeded message.');
    }

    messagesByKey.set(seed.key, { id: messageRow[0].id, createdAt: messageRow[0].createdAt });
  }

  return messagesByKey;
}

function buildReceiptPlan(messagesByKey, participantMap) {
  const plan = [];

  const minute = (value) => value * 60 * 1000;
  const welcomeCreated = new Date(messagesByKey.get('welcome').createdAt);
  const replyCreated = new Date(messagesByKey.get('reply').createdAt);
  const supportCreated = new Date(messagesByKey.get('support').createdAt);

  plan.push(
    {
      messageKey: 'welcome',
      email: 'mia@gigvora.com',
      deliveredAt: welcomeCreated,
      readAt: new Date(welcomeCreated.getTime() + minute(1)),
    },
    {
      messageKey: 'welcome',
      email: 'leo@gigvora.com',
      deliveredAt: new Date(welcomeCreated.getTime() + minute(2)),
      readAt: new Date(welcomeCreated.getTime() + minute(6)),
    },
    {
      messageKey: 'welcome',
      email: 'ava@gigvora.com',
      deliveredAt: new Date(welcomeCreated.getTime() + minute(3)),
      readAt: new Date(welcomeCreated.getTime() + minute(4)),
    },
    {
      messageKey: 'reply',
      email: 'leo@gigvora.com',
      deliveredAt: replyCreated,
      readAt: replyCreated,
    },
    {
      messageKey: 'reply',
      email: 'mia@gigvora.com',
      deliveredAt: new Date(replyCreated.getTime() + minute(1)),
      readAt: new Date(replyCreated.getTime() + minute(5)),
    },
    {
      messageKey: 'reply',
      email: 'ava@gigvora.com',
      deliveredAt: new Date(replyCreated.getTime() + minute(2)),
      readAt: null,
    },
    {
      messageKey: 'support',
      email: 'ava@gigvora.com',
      deliveredAt: supportCreated,
      readAt: new Date(supportCreated.getTime() + minute(1)),
    },
    {
      messageKey: 'support',
      email: 'mia@gigvora.com',
      deliveredAt: new Date(supportCreated.getTime() + minute(2)),
      readAt: new Date(supportCreated.getTime() + minute(6)),
    },
    {
      messageKey: 'support',
      email: 'leo@gigvora.com',
      deliveredAt: new Date(supportCreated.getTime() + minute(3)),
      readAt: null,
    },
  );

  return plan.filter((entry) => messagesByKey.has(entry.messageKey) && participantMap.has(entry.email));
}

async function seedReadReceipts(queryInterface, transaction, plan, messagesByKey, participantMap) {
  if (!plan.length) {
    return;
  }

  const messageIds = Array.from(new Set(plan.map((entry) => messagesByKey.get(entry.messageKey).id)));
  const existing = await queryInterface.sequelize.query(
    'SELECT messageId, participantId FROM message_read_receipts WHERE messageId IN (:messageIds)',
    { type: QueryTypes.SELECT, transaction, replacements: { messageIds } },
  );
  const existingKeys = new Set(existing.map((row) => `${row.messageId}:${row.participantId}`));

  const rowsToInsert = [];

  for (const entry of plan) {
    const message = messagesByKey.get(entry.messageKey);
    const participant = participantMap.get(entry.email);
    const key = `${message.id}:${participant.id}`;
    if (existingKeys.has(key)) {
      continue;
    }

    rowsToInsert.push({
      messageId: message.id,
      participantId: participant.id,
      userId: participant.userId,
      deliveredAt: entry.deliveredAt,
      readAt: entry.readAt,
      metadata: null,
      createdAt: entry.deliveredAt,
      updatedAt: entry.readAt ?? entry.deliveredAt,
    });
  }

  if (rowsToInsert.length) {
    await queryInterface.bulkInsert('message_read_receipts', rowsToInsert, { transaction });
  }

  const lastReadByParticipant = new Map();
  for (const entry of plan) {
    if (!entry.readAt) {
      continue;
    }
    const participant = participantMap.get(entry.email);
    if (!participant) {
      continue;
    }
    const current = lastReadByParticipant.get(participant.id);
    if (!current || entry.readAt > current) {
      lastReadByParticipant.set(participant.id, entry.readAt);
    }
  }

  for (const [participantId, lastReadAt] of lastReadByParticipant.entries()) {
    await queryInterface.bulkUpdate(
      'message_participants',
      { lastReadAt, updatedAt: lastReadAt },
      { id: participantId },
      { transaction },
    );
  }
}

async function updateThreadPreview(queryInterface, transaction, threadId, messagesByKey, baseDate) {
  const latestMessage = Array.from(messagesByKey.values()).reduce((latest, candidate) => {
    if (!latest) return candidate;
    return new Date(candidate.createdAt) > new Date(latest.createdAt) ? candidate : latest;
  }, null);

  if (!latestMessage) {
    return;
  }

  const bodyRow = await queryInterface.sequelize.query(
    'SELECT body FROM messages WHERE id = :messageId',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { messageId: latestMessage.id },
    },
  );
  const preview = bodyRow.length ? bodyRow[0].body : '';

  await queryInterface.bulkUpdate(
    'message_threads',
    {
      lastMessageAt: latestMessage.createdAt,
      lastMessagePreview: preview ? preview.slice(0, 500) : null,
      updatedAt: baseDate,
    },
    { id: threadId },
    { transaction },
  );
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const baseDate = new Date();
      const userMap = await resolveUserMap(
        queryInterface,
        transaction,
        PARTICIPANT_SEEDS.map((seed) => seed.email),
      );

      for (const email of PARTICIPANT_SEEDS.map((seed) => seed.email)) {
        if (!userMap.has(email)) {
          throw new Error(`Required demo user ${email} is missing. Run the foundational persona seed first.`);
        }
      }

      const creatorId = userMap.get('mia@gigvora.com');
      const threadId = await ensureThread(queryInterface, transaction, creatorId, minutesAgoToDate(baseDate, 50));
      const participantMap = await ensureParticipants(
        queryInterface,
        transaction,
        threadId,
        PARTICIPANT_SEEDS,
        userMap,
        minutesAgoToDate(baseDate, 50),
      );
      const messagesByKey = await ensureMessages(queryInterface, transaction, threadId, participantMap, baseDate);
      const receiptPlan = buildReceiptPlan(messagesByKey, participantMap);
      await seedReadReceipts(queryInterface, transaction, receiptPlan, messagesByKey, participantMap);
      await updateThreadPreview(queryInterface, transaction, threadId, messagesByKey, baseDate);

      const savedRepliesByKey = await seedSavedReplies(queryInterface, transaction, userMap, baseDate);
      await seedRoutingRules(queryInterface, transaction, userMap, baseDate);

      const threadPins = [threadId];

      await ensureInboxPreferences(queryInterface, transaction, {
        userId: userMap.get('leo@gigvora.com'),
        pinnedThreadIds: threadPins,
        defaultSavedReplyKey: 'leo_kickoff_recap',
        savedRepliesByKey,
        timezone: 'Europe/London',
        workingHours: buildWorkingHoursSeed({
          timezone: 'Europe/London',
          availability: {
            monday: { start: '09:00', end: '17:30' },
            tuesday: { start: '09:00', end: '17:30' },
            wednesday: { start: '09:00', end: '17:30' },
            thursday: { start: '09:00', end: '17:30' },
            friday: { start: '09:00', end: '15:00' },
          },
        }),
        autoArchiveAfterDays: 21,
        escalationKeywords: ['blocker', 'handover', 'urgent'],
        baseDate,
      });

      await ensureInboxPreferences(queryInterface, transaction, {
        userId: userMap.get('mia@gigvora.com'),
        pinnedThreadIds: threadPins,
        defaultSavedReplyKey: 'mia_ops_digest',
        savedRepliesByKey,
        timezone: 'America/New_York',
        workingHours: buildWorkingHoursSeed({
          timezone: 'America/New_York',
          availability: {
            monday: { start: '08:00', end: '18:00' },
            tuesday: { start: '08:00', end: '18:00' },
            wednesday: { start: '08:00', end: '18:00' },
            thursday: { start: '08:00', end: '18:00' },
            friday: { start: '08:00', end: '16:00' },
          },
        }),
        autoResponderEnabled: true,
        autoResponderMessage:
          'Thanks for reaching out. The operations desk monitors this inbox 08:00–18:00 UTC and escalates urgent items automatically.',
        escalationKeywords: ['outage', 'security', 'sev1', 'compliance'],
        baseDate,
      });

      await ensureInboxPreferences(queryInterface, transaction, {
        userId: userMap.get('ava@gigvora.com'),
        pinnedThreadIds: threadPins,
        savedRepliesByKey,
        timezone: 'UTC',
        escalationKeywords: ['support', 'incident'],
        baseDate,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const threadRows = await queryInterface.sequelize.query(
        'SELECT id FROM message_threads WHERE subject = :subject',
        { type: QueryTypes.SELECT, transaction, replacements: { subject: THREAD_SUBJECT } },
      );
      const threadIds = threadRows.map((row) => row.id);

      if (threadIds.length) {
        const messageRows = await queryInterface.sequelize.query(
          'SELECT id FROM messages WHERE threadId IN (:threadIds)',
          { type: QueryTypes.SELECT, transaction, replacements: { threadIds } },
        );
        const messageIds = messageRows.map((row) => row.id);

        if (messageIds.length) {
          await queryInterface.bulkDelete(
            'message_read_receipts',
            { messageId: { [Op.in]: messageIds } },
            { transaction },
          );
          await queryInterface.bulkDelete(
            'messages',
            { id: { [Op.in]: messageIds } },
            { transaction },
          );
        }

        await queryInterface.bulkDelete(
          'message_participants',
          { threadId: { [Op.in]: threadIds } },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'message_threads',
          { id: { [Op.in]: threadIds } },
          { transaction },
        );
      }

      const seedEmails = Array.from(
        new Set([
          ...PARTICIPANT_SEEDS.map((seed) => seed.email),
          ...SAVED_REPLY_SEEDS.map((seed) => seed.email),
          ...ROUTING_RULE_SEEDS.map((seed) => seed.email),
        ]),
      );
      const seedUserMap = await resolveUserMap(queryInterface, transaction, seedEmails);
      const seedUserIds = Array.from(seedUserMap.values()).filter(Boolean);

      if (seedUserIds.length) {
        const savedReplyTitles = Array.from(new Set(SAVED_REPLY_SEEDS.map((seed) => seed.title)));
        const repliesByUser = new Map();

        if (savedReplyTitles.length) {
          const savedReplyRows = await queryInterface.sequelize.query(
            'SELECT id, userId FROM saved_replies WHERE userId IN (:userIds) AND title IN (:titles)',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: { userIds: seedUserIds, titles: savedReplyTitles },
            },
          );
          savedReplyRows.forEach((row) => {
            const list = repliesByUser.get(row.userId) ?? [];
            list.push(row.id);
            repliesByUser.set(row.userId, list);
          });

          await queryInterface.bulkDelete(
            'saved_replies',
            { userId: { [Op.in]: seedUserIds }, title: { [Op.in]: savedReplyTitles } },
            { transaction },
          );
        }

        const routingRuleNames = Array.from(new Set(ROUTING_RULE_SEEDS.map((seed) => seed.name)));
        if (routingRuleNames.length) {
          await queryInterface.bulkDelete(
            'inbox_routing_rules',
            { userId: { [Op.in]: seedUserIds }, name: { [Op.in]: routingRuleNames } },
            { transaction },
          );
        }

        const preferenceUpdateTimestamp = new Date();
        for (const [email, userId] of seedUserMap.entries()) {
          if (!userId) {
            continue;
          }
          const preferenceRows = await queryInterface.sequelize.query(
            'SELECT id, pinnedThreadIds, defaultSavedReplyId FROM inbox_preferences WHERE userId = :userId LIMIT 1',
            { type: QueryTypes.SELECT, transaction, replacements: { userId } },
          );
          if (!preferenceRows.length) {
            continue;
          }
          const preference = preferenceRows[0];
          const currentPins = uniqueNumberArray(parseJsonColumn(preference.pinnedThreadIds) ?? []);
          const filteredPins = threadIds.length
            ? currentPins.filter((id) => !threadIds.includes(id))
            : currentPins;
          const replyIds = repliesByUser.get(userId) ?? [];
          const updatePayload = {};
          if (filteredPins.length !== currentPins.length) {
            updatePayload.pinnedThreadIds = filteredPins;
          }
          if (replyIds.length && replyIds.includes(preference.defaultSavedReplyId)) {
            updatePayload.defaultSavedReplyId = null;
          }
          if (Object.keys(updatePayload).length) {
            updatePayload.updatedAt = preferenceUpdateTimestamp;
            await queryInterface.bulkUpdate('inbox_preferences', updatePayload, { userId }, { transaction });
          }
        }
      }
    });
  },
};
