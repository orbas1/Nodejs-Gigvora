'use strict';

const { QueryTypes, Op } = require('sequelize');

const userSeeds = [
  {
    email: 'lara.ops.demo@gigvora.com',
    firstName: 'Lara',
    lastName: 'Nguyen',
    userType: 'admin',
    address: 'Operations HQ, Remote',
    age: 38,
  },
  {
    email: 'jonah.freelancer.demo@gigvora.com',
    firstName: 'Jonah',
    lastName: 'Barrett',
    userType: 'freelancer',
    address: 'San Diego, USA',
    age: 32,
  },
  {
    email: 'marisol.agency.demo@gigvora.com',
    firstName: 'Marisol',
    lastName: 'Khan',
    userType: 'agency',
    address: 'Austin, USA',
    age: 37,
  },
  {
    email: 'haruto.company.demo@gigvora.com',
    firstName: 'Haruto',
    lastName: 'Sato',
    userType: 'company',
    address: 'Tokyo, Japan',
    age: 45,
  },
];

const feedPostContent = '[demo] Ops weekly: runtime health is green and hiring backlog cleared.';

const hashedPassword = '$2b$10$URrfHgz0s1xu1vByrRl/h.STE7Z0O.STDnpCiMTGy66idi2EDmzJm';

const PREVIEW_FALLBACK = 'New activity';

const messageThreadSeeds = [
  {
    identifier: 'orbital-ops-kickoff',
    subject: 'Orbital robotics automation kickoff',
    channelType: 'project',
    metadata: { projectSlug: 'orbital-robotics-automation' },
    createdByEmail: 'lara.ops.demo@gigvora.com',
    participantEmails: [
      'lara.ops.demo@gigvora.com',
      'haruto.company.demo@gigvora.com',
      'marisol.agency.demo@gigvora.com',
    ],
    messages: [
      {
        senderEmail: 'lara.ops.demo@gigvora.com',
        body: 'Team, automation readiness is green. Updated rollout charter is live in the workspace.',
        messageType: 'text',
        metadata: { summary: 'Operations updated the rollout charter' },
        createdOffsetMinutes: -45,
      },
      {
        senderEmail: 'haruto.company.demo@gigvora.com',
        body: 'Thanks Lara—Orbital procurement signed off. Expect kickoff on Monday 9am JST.',
        messageType: 'text',
        createdOffsetMinutes: -30,
      },
      {
        senderEmail: 'marisol.agency.demo@gigvora.com',
        body: 'Atlas pods are assembled with robotics specialists. Discovery survey drops later today.',
        messageType: 'text',
        createdOffsetMinutes: -5,
      },
    ],
  },
  {
    identifier: 'talent-shortlist-review',
    subject: 'Design talent shortlist review',
    channelType: 'direct',
    metadata: { topic: 'freelancer-shortlist' },
    createdByEmail: 'marisol.agency.demo@gigvora.com',
    participantEmails: [
      'marisol.agency.demo@gigvora.com',
      'jonah.freelancer.demo@gigvora.com',
    ],
    messages: [
      {
        senderEmail: 'marisol.agency.demo@gigvora.com',
        body: 'Jonah, can you confirm availability for the Orbital robotics engagement next week?',
        messageType: 'text',
        createdOffsetMinutes: -90,
      },
      {
        senderEmail: 'jonah.freelancer.demo@gigvora.com',
        body: 'Absolutely. Current sprint wraps Thursday—I can start Monday and hold Fridays for async reviews.',
        messageType: 'text',
        createdOffsetMinutes: -60,
      },
      {
        senderEmail: 'marisol.agency.demo@gigvora.com',
        body: 'Perfect. Uploading the kickoff deck shortly and looping Lara for analytics dependencies.',
        messageType: 'text',
        createdOffsetMinutes: -20,
      },
    ],
  },
];

function normalisePreview(value) {
  if (!value) {
    return null;
  }
  const text = value.toString().replace(/\s+/g, ' ').trim();
  if (!text) {
    return null;
  }
  if (text.length <= 180) {
    return text;
  }
  return `${text.slice(0, 179).trim()}…`;
}

function buildSeedPreview(messageSeed) {
  const attachments = Array.isArray(messageSeed.attachments) ? messageSeed.attachments : [];
  return (
    normalisePreview(messageSeed.body) ||
    normalisePreview(messageSeed.metadata?.summary) ||
    normalisePreview(messageSeed.metadata?.title) ||
    normalisePreview(messageSeed.metadata?.description) ||
    (attachments.length
      ? normalisePreview(
          attachments.length === 1
            ? `Shared ${attachments[0].fileName ?? attachments[0].name ?? 'attachment'}`
            : `Shared ${attachments.length} attachments`,
        )
      : null) ||
    PREVIEW_FALLBACK
  );
}

async function findExistingUsers(queryInterface, transaction, emails) {
  const rows = await queryInterface.sequelize.query(
    'SELECT id, email FROM users WHERE email IN (:emails)',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { emails },
    },
  );
  return new Map(rows.map((row) => [row.email, row.id]));
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const emails = userSeeds.map((seed) => seed.email);
      const existingUsers = await findExistingUsers(queryInterface, transaction, emails);

      const toInsert = userSeeds
        .filter((seed) => !existingUsers.has(seed.email))
        .map((seed) => ({
          ...seed,
          password: hashedPassword,
          createdAt: now,
          updatedAt: now,
        }));

      if (toInsert.length) {
        await queryInterface.bulkInsert('users', toInsert, { transaction });
      }

      const userIds = await findExistingUsers(queryInterface, transaction, emails);

      const profileRecords = [
        {
          email: 'jonah.freelancer.demo@gigvora.com',
          headline: 'Design systems architect for multi-brand teams',
          bio: 'Leads discovery and prototypes inclusive design systems for SaaS rollouts.',
          skills: 'Design Systems, Figma, Accessibility',
          experience: '10 years scaling design teams at remote-first companies.',
          education: 'BFA, Human-Centred Design',
        },
      ];

      for (const profile of profileRecords) {
        const userId = userIds.get(profile.email);
        if (!userId) continue;
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM profiles WHERE userId = :userId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert(
          'profiles',
          [
            {
              userId,
              headline: profile.headline,
              bio: profile.bio,
              skills: profile.skills,
              experience: profile.experience,
              education: profile.education,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const [freelancerId] = [userIds.get('jonah.freelancer.demo@gigvora.com')];
      if (freelancerId) {
        const [existingFreelancer] = await queryInterface.sequelize.query(
          'SELECT id FROM freelancer_profiles WHERE userId = :userId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId: freelancerId },
          },
        );
        if (!existingFreelancer?.id) {
          await queryInterface.bulkInsert(
            'freelancer_profiles',
            [
              {
                userId: freelancerId,
                title: 'Principal Product Designer',
                hourlyRate: 145.5,
                availability: '25 hrs/week — fractional discovery & design leadership',
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }
      }

      const companyUserId = userIds.get('haruto.company.demo@gigvora.com');
      if (companyUserId) {
        const [existingCompany] = await queryInterface.sequelize.query(
          'SELECT id FROM company_profiles WHERE userId = :userId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId: companyUserId },
          },
        );
        if (!existingCompany?.id) {
          await queryInterface.bulkInsert(
            'company_profiles',
            [
              {
                userId: companyUserId,
                companyName: 'Orbital Robotics (Demo)',
                description: 'Global robotics automation firm with 24/7 managed services.',
                website: 'https://orbital-robotics.demo',
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }
      }

      const agencyUserId = userIds.get('marisol.agency.demo@gigvora.com');
      if (agencyUserId) {
        const [existingAgency] = await queryInterface.sequelize.query(
          'SELECT id FROM agency_profiles WHERE userId = :userId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId: agencyUserId },
          },
        );
        if (!existingAgency?.id) {
          await queryInterface.bulkInsert(
            'agency_profiles',
            [
              {
                userId: agencyUserId,
                agencyName: 'Atlas Collective (Demo)',
                focusArea: 'Product, growth, and analytics pods for venture-backed startups.',
                website: 'https://atlas-collective.demo',
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }
      }

      const adminUserId = userIds.get('lara.ops.demo@gigvora.com');
      if (adminUserId) {
        const [existingPost] = await queryInterface.sequelize.query(
          'SELECT id FROM feed_posts WHERE userId = :userId AND content = :content LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId: adminUserId, content: feedPostContent },
          },
        );
        if (!existingPost?.id) {
          await queryInterface.bulkInsert(
            'feed_posts',
            [
              {
                userId: adminUserId,
                content: feedPostContent,
                visibility: 'public',
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }
      }

      for (const threadSeed of messageThreadSeeds) {
        const createdBy = userIds.get(threadSeed.createdByEmail);
        const participantIds = threadSeed.participantEmails
          .map((email) => userIds.get(email))
          .filter(Boolean);

        if (!createdBy || participantIds.length < 2) {
          continue;
        }

        const [existingThread] = await queryInterface.sequelize.query(
          'SELECT id FROM message_threads WHERE subject = :subject AND createdBy = :createdBy LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { subject: threadSeed.subject, createdBy },
          },
        );

        let threadId = existingThread?.id ?? null;

        if (!threadId) {
          const insertOptions = { transaction, returning: ['id'] };
          const result = await queryInterface.bulkInsert(
            'message_threads',
            [
              {
                subject: threadSeed.subject,
                channelType: threadSeed.channelType,
                state: 'active',
                createdBy,
                metadata: threadSeed.metadata ?? null,
                lastMessageAt: null,
                lastMessagePreview: null,
                createdAt: now,
                updatedAt: now,
              },
            ],
            insertOptions,
          );

          if (Array.isArray(result) && result[0]?.id) {
            threadId = result[0].id;
          } else {
            const [freshThread] = await queryInterface.sequelize.query(
              'SELECT id FROM message_threads WHERE subject = :subject AND createdBy = :createdBy ORDER BY id DESC LIMIT 1',
              {
                type: QueryTypes.SELECT,
                transaction,
                replacements: { subject: threadSeed.subject, createdBy },
              },
            );
            threadId = freshThread?.id ?? null;
          }
        }

        if (!threadId) {
          continue;
        }

        for (const userId of participantIds) {
          const [existingParticipant] = await queryInterface.sequelize.query(
            'SELECT id FROM message_participants WHERE threadId = :threadId AND userId = :userId LIMIT 1',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: { threadId, userId },
            },
          );

          if (!existingParticipant?.id) {
            await queryInterface.bulkInsert(
              'message_participants',
              [
                {
                  threadId,
                  userId,
                  role: userId === createdBy ? 'owner' : 'participant',
                  notificationsEnabled: true,
                  mutedUntil: null,
                  lastReadAt: userId === createdBy ? now : null,
                  createdAt: now,
                  updatedAt: now,
                },
              ],
              { transaction },
            );
          }
        }

        const [messageCountRow] = await queryInterface.sequelize.query(
          'SELECT COUNT(*) AS count FROM messages WHERE threadId = :threadId',
          { type: QueryTypes.SELECT, transaction, replacements: { threadId } },
        );
        const messageCount = Number.parseInt(messageCountRow?.count ?? '0', 10);
        if (messageCount > 0) {
          continue;
        }

        let latestMessageAt = null;
        let latestPreview = PREVIEW_FALLBACK;

        for (const messageSeed of threadSeed.messages) {
          const senderId = userIds.get(messageSeed.senderEmail);
          if (!senderId) {
            continue;
          }

          const offsetMinutes = Number.isFinite(messageSeed.createdOffsetMinutes)
            ? messageSeed.createdOffsetMinutes
            : -5;
          const createdAt = new Date(now.getTime() + offsetMinutes * 60 * 1000);

          await queryInterface.bulkInsert(
            'messages',
            [
              {
                threadId,
                senderId,
                messageType: messageSeed.messageType ?? 'text',
                body: messageSeed.body ?? null,
                metadata: messageSeed.metadata ?? null,
                deliveredAt: createdAt,
                createdAt,
                updatedAt: createdAt,
              },
            ],
            { transaction },
          );

          latestMessageAt = createdAt;
          latestPreview = buildSeedPreview(messageSeed) ?? PREVIEW_FALLBACK;
        }

        if (latestMessageAt) {
          await queryInterface.sequelize.query(
            'UPDATE message_threads SET lastMessageAt = :lastMessageAt, lastMessagePreview = :lastMessagePreview, updatedAt = :updatedAt WHERE id = :threadId',
            {
              type: QueryTypes.UPDATE,
              transaction,
              replacements: {
                threadId,
                lastMessageAt: latestMessageAt,
                lastMessagePreview: (latestPreview || PREVIEW_FALLBACK).slice(0, 500),
                updatedAt: now,
              },
            },
          );

          await queryInterface.sequelize.query(
            'UPDATE message_participants SET lastReadAt = :lastReadAt WHERE threadId = :threadId AND userId = :userId',
            {
              type: QueryTypes.UPDATE,
              transaction,
              replacements: { threadId, userId: createdBy, lastReadAt: latestMessageAt },
            },
          );
        }
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const emails = userSeeds.map((seed) => seed.email);
      const users = await queryInterface.sequelize.query(
        'SELECT id, email FROM users WHERE email IN (:emails)',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { emails },
        },
      );
      const userIds = users.map((user) => user.id);

      const threadSubjects = messageThreadSeeds.map((seed) => seed.subject);
      if (threadSubjects.length) {
        const threads = await queryInterface.sequelize.query(
          'SELECT id FROM message_threads WHERE subject IN (:subjects)',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { subjects: threadSubjects },
          },
        );
        const threadIds = threads.map((thread) => thread.id);
        if (threadIds.length) {
          await queryInterface.bulkDelete('messages', { threadId: { [Op.in]: threadIds } }, { transaction });
          await queryInterface.bulkDelete('message_participants', { threadId: { [Op.in]: threadIds } }, { transaction });
          await queryInterface.bulkDelete('message_threads', { id: { [Op.in]: threadIds } }, { transaction });
        }
      }

      if (userIds.length) {
        await queryInterface.bulkDelete('feed_posts', { userId: { [Op.in]: userIds }, content: feedPostContent }, { transaction });
        await queryInterface.bulkDelete('freelancer_profiles', { userId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('agency_profiles', { userId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('company_profiles', { userId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('profiles', { userId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('users', { id: { [Op.in]: userIds } }, { transaction });
      }
    });
  },
};
