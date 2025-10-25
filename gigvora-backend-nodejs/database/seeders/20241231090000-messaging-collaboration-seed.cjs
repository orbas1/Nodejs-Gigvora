'use strict';

const { QueryTypes } = require('sequelize');

const THREAD_SUBJECT = 'Seed: Product Enablement Sync';
const SEED_METADATA = { seed: 'messaging-collaboration-demo', workspaceId: 4101 };
const PARTICIPANT_EMAILS = [
  { email: 'ava@gigvora.com', role: 'owner' },
  { email: 'mia@gigvora.com', role: 'participant' },
  { email: 'leo@gigvora.com', role: 'participant' },
];

async function findUserId(queryInterface, transaction, email) {
  const [row] = await queryInterface.sequelize.query(
    'SELECT id FROM users WHERE email = :email LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { email },
    },
  );
  return row?.id ?? null;
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const kickoffTime = new Date(now.getTime() - 1000 * 60 * 90);
      const recordingTime = new Date(now.getTime() - 1000 * 60 * 20);
      const summaryTime = new Date(now.getTime() - 1000 * 60 * 5);
      const summaryBody =
        'Uploaded the sprint dashboard recording and assigned follow-ups to support and engineering leads.';
      const [existingThread] = await queryInterface.sequelize.query(
        'SELECT id FROM message_threads WHERE subject = :subject LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { subject: THREAD_SUBJECT },
        },
      );

      if (existingThread?.id) {
        return;
      }

      const participantIds = [];
      for (const participant of PARTICIPANT_EMAILS) {
        const userId = await findUserId(queryInterface, transaction, participant.email);
        if (!userId) {
          throw new Error(`Messaging collaboration seed requires ${participant.email} to exist.`);
        }
        participantIds.push({ userId, role: participant.role });
      }

      const ownerId = participantIds.find((entry) => entry.role === 'owner')?.userId;
      if (!ownerId) {
        throw new Error('Messaging collaboration seed requires an owner participant.');
      }

      await queryInterface.bulkInsert(
        'message_threads',
        [
          {
            subject: THREAD_SUBJECT,
            channelType: 'group',
            state: 'active',
            createdBy: ownerId,
            metadata: SEED_METADATA,
            lastMessageAt: summaryTime,
            lastMessagePreview: summaryBody,
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      const [threadRow] = await queryInterface.sequelize.query(
        'SELECT id FROM message_threads WHERE subject = :subject LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { subject: THREAD_SUBJECT },
        },
      );

      const threadId = threadRow?.id;
      if (!threadId) {
        throw new Error('Failed to create messaging collaboration thread.');
      }

      const participantRows = participantIds.map((participant, index) => ({
        threadId,
        userId: participant.userId,
        role: participant.role,
        notificationsEnabled: true,
        mutedUntil: null,
        lastReadAt: index === 0 ? now : null,
        metadata: { seed: 'messaging-collaboration-demo' },
        createdAt: now,
        updatedAt: now,
      }));

      await queryInterface.bulkInsert('message_participants', participantRows, { transaction });

      const deckMessageMetadata = {
        attachments: 1,
        checklist: ['Product analytics', 'Consent telemetry', 'Support escalations'],
      };

      const [deckMessage] = await queryInterface.sequelize.query(
        `INSERT INTO messages
          ("threadId", "senderId", "messageType", "body", "metadata", "deliveredAt", "readAt", "createdAt", "updatedAt")
        VALUES
          (:threadId, :senderId, 'text', :body, :metadata::jsonb, :deliveredAt, :readAt, :createdAt, :updatedAt)
        RETURNING id`,
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: {
            threadId,
            senderId: ownerId,
            body: 'Sprint checklist attached with owner assignments across engineering, ops, and support.',
            metadata: JSON.stringify(deckMessageMetadata),
            deliveredAt: kickoffTime,
            readAt: kickoffTime,
            createdAt: kickoffTime,
            updatedAt: kickoffTime,
          },
        },
      );

      const deckMessageId = deckMessage?.id;

      if (!deckMessageId) {
        throw new Error('Failed to create kickoff message for messaging collaboration seed.');
      }

      await queryInterface.bulkInsert(
        'message_attachments',
        [
          {
            messageId: deckMessageId,
            fileName: 'gigvora-sprint-checklist.pdf',
            mimeType: 'application/pdf',
            fileSize: 1843200,
            storageKey: 'messaging/sprint-room/gigvora-sprint-checklist.pdf',
            checksum: null,
            metadata: { seed: 'messaging-collaboration-demo' },
            createdAt: kickoffTime,
            updatedAt: kickoffTime,
          },
        ],
        { transaction },
      );

      const callMetadata = {
        eventType: 'call',
        call: {
          id: 'seed-call-video-1',
          type: 'video',
          channelName: `thread:${threadId}:seed-call-video-1`,
          initiatedBy: ownerId,
          initiatedAt: kickoffTime.toISOString(),
          expiresAt: new Date(now.getTime() + 1000 * 60 * 60).toISOString(),
          participants: participantIds.map((participant, index) => ({
            userId: participant.userId,
            joinedAt: new Date(kickoffTime.getTime() + index * 60000).toISOString(),
          })),
        },
      };

      await queryInterface.sequelize.query(
        `INSERT INTO messages
          ("threadId", "senderId", "messageType", "body", "metadata", "deliveredAt", "readAt", "createdAt", "updatedAt")
        VALUES
          (:threadId, :senderId, 'event', :body, :metadata::jsonb, :deliveredAt, :readAt, :createdAt, :updatedAt)`,
        {
          type: QueryTypes.INSERT,
          transaction,
          replacements: {
            threadId,
            senderId: ownerId,
            body: 'Video call started to review the sprint dashboard.',
            metadata: JSON.stringify(callMetadata),
            deliveredAt: recordingTime,
            readAt: recordingTime,
            createdAt: recordingTime,
            updatedAt: recordingTime,
          },
        },
      );

      await queryInterface.sequelize.query(
        `INSERT INTO messages
          ("threadId", "senderId", "messageType", "body", "metadata", "deliveredAt", "readAt", "createdAt", "updatedAt")
        VALUES
          (:threadId, :senderId, 'text', :body, :metadata::jsonb, :deliveredAt, :readAt, :createdAt, :updatedAt)`,
        {
          type: QueryTypes.INSERT,
          transaction,
          replacements: {
            threadId,
            senderId: participantIds[1].userId,
            body: summaryBody,
            metadata: JSON.stringify({ followUps: ['Support SLA audit', 'Incident digest', 'Revenue telemetry rollup'] }),
            deliveredAt: summaryTime,
            readAt: null,
            createdAt: summaryTime,
            updatedAt: summaryTime,
          },
        },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [threadRow] = await queryInterface.sequelize.query(
        'SELECT id FROM message_threads WHERE subject = :subject LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { subject: THREAD_SUBJECT },
        },
      );

      if (!threadRow?.id) {
        return;
      }

      const threadId = threadRow.id;

      await queryInterface.sequelize.query(
        'DELETE FROM message_attachments WHERE "messageId" IN (SELECT id FROM messages WHERE "threadId" = :threadId)',
        {
          transaction,
          replacements: { threadId },
        },
      );

      await queryInterface.bulkDelete('messages', { threadId }, { transaction });
      await queryInterface.bulkDelete('message_participants', { threadId }, { transaction });
      await queryInterface.bulkDelete('message_threads', { id: threadId }, { transaction });
    });
  },
};
