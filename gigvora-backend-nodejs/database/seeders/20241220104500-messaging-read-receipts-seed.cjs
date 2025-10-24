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

function minutesAgoToDate(baseDate, minutesAgo) {
  return new Date(baseDate.getTime() - minutesAgo * 60 * 1000);
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
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const threadRows = await queryInterface.sequelize.query(
        'SELECT id FROM message_threads WHERE subject = :subject',
        { type: QueryTypes.SELECT, transaction, replacements: { subject: THREAD_SUBJECT } },
      );
      if (!threadRows.length) {
        return;
      }
      const threadIds = threadRows.map((row) => row.id);
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
    });
  },
};
