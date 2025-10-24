'use strict';

const { QueryTypes, Op } = require('sequelize');

const baseUsers = [
  {
    firstName: 'Ava',
    lastName: 'Founder',
    email: 'ava@gigvora.com',
    password: '$2b$10$URrfHgz0s1xu1vByrRl/h.STE7Z0O.STDnpCiMTGy66idi2EDmzJm',
    address: '123 Innovation Way, Remote City',
    age: 32,
    userType: 'admin',
  },
  {
    firstName: 'Leo',
    lastName: 'Freelancer',
    email: 'leo@gigvora.com',
    password: '$2b$10$n6MPrXwN6kPymBi/GsMBCecal.lOEWTWmr25RR80Gn3mtiq3IztUG',
    address: '456 Remote Ave, Digital Nomad',
    age: 27,
    userType: 'freelancer',
  },
  {
    firstName: 'Mia',
    lastName: 'Operations',
    email: 'mia@gigvora.com',
    password: '$2b$10$16DRKd2uYS0frdHpDq.5gOQWKmrW.OqYk8ytxzPm/w76dRvrxH6zi',
    address: '789 Strategy Blvd, Growth City',
    age: 35,
    userType: 'company',
  },
  {
    firstName: 'Noah',
    lastName: 'Agency',
    email: 'noah@gigvora.com',
    password: '$2b$10$2Fz95ZCARlX/2Pw1zQfztOC8XC7VW9wrXxlih/FYO1QPwI7EVP3p.',
    address: '25 Collaboration Square, Agency City',
    age: 38,
    userType: 'agency',
  },
  {
    firstName: 'Avery',
    lastName: 'Mentor',
    email: 'mentor@gigvora.com',
    password: '$2b$10$URrfHgz0s1xu1vByrRl/h.STE7Z0O.STDnpCiMTGy66idi2EDmzJm',
    address: '101 Coaching Lane, Lisbon',
    age: 41,
    userType: 'user',
  },
  {
    firstName: 'Riley',
    lastName: 'Recruiter',
    email: 'recruiter@gigvora.com',
    password: '$2b$10$URrfHgz0s1xu1vByrRl/h.STE7Z0O.STDnpCiMTGy66idi2EDmzJm',
    address: '88 Hiring Avenue, Austin',
    age: 36,
    userType: 'user',
  },
];

const profileSeeds = [
  {
    email: 'leo@gigvora.com',
    headline: 'Principal Full Stack Developer',
    bio: 'Specialises in high-growth marketplace platforms with a focus on reliability, observability, and coaching.',
    skills: 'Node.js, React, PostgreSQL, AWS, Terraform',
    experience: '7 years delivering venture-backed SaaS platforms with globally distributed teams.',
    education: 'BSc Computer Science, Remote Tech University',
  },
  {
    email: 'mia@gigvora.com',
    headline: 'Director of Operations',
    bio: 'Transforms customer feedback into product roadmaps and ensures compliance guardrails across client workspaces.',
    skills: 'Customer Success, Analytics, Process Automation',
    experience: '10 years scaling operations teams across SaaS scale-ups.',
    education: 'MBA, Strategic Operations',
  },
];

const companyProfileSeeds = [
  {
    email: 'mia@gigvora.com',
    companyName: 'Lumen Analytics',
    description: 'Growth advisory collective partnering with SaaS companies on lifecycle experiments.',
    website: 'https://lumen-analytics.example.com',
  },
];

const agencyProfileSeeds = [
  {
    email: 'noah@gigvora.com',
    agencyName: 'Alliance Studio',
    focusArea: 'Product, growth, and analytics pods for marketplace companies.',
    website: 'https://alliancestudio.example.com',
  },
];

const freelancerProfileSeeds = [
  {
    email: 'leo@gigvora.com',
    title: 'Fractional Staff Engineer',
    hourlyRate: 145.5,
    availability: '20 hrs/week · Remote within UTC±3',
  },
];

const feedPosts = [
  {
    email: 'ava@gigvora.com',
    content:
      '[demo] Platform release candidate 1.50 ships runtime security enhancements and workspace analytics exports.',
    visibility: 'public',
  },
  {
    email: 'leo@gigvora.com',
    content: '[demo] Shipping an onboarding automation template — DM if you need async walkthroughs.',
    visibility: 'public',
  },
];

const jobSeeds = [
  {
    title: '[demo] Founding Product Operations Lead',
    description:
      'Partner with founders to orchestrate product rituals, analytics instrumentation, and compliance checklists.',
    location: 'Remote · North America',
    employmentType: 'Full-time',
  },
  {
    title: '[demo] Freelance Growth Analyst',
    description: 'Build dashboards, experiments, and monthly insights for marketplace operators.',
    location: 'Remote · Europe',
    employmentType: 'Contract',
  },
];

const gigSeeds = [
  {
    title: '[demo] Launch landing page optimisation sprint',
    description:
      'Two-week engagement pairing UX research with CRO experiments. Includes experiment backlog and reporting template.',
    budget: 'USD 4,800',
    duration: '2 weeks',
  },
  {
    title: '[demo] Marketplace trust and safety audit',
    description: 'Assess community guidelines, moderation queues, and automation coverage with actionable roadmap.',
    budget: 'USD 6,200',
    duration: '3 weeks',
  },
];

const projectSeeds = [
  {
    title: '[demo] Workspace instrumentation rollout',
    description: 'Enable product squads with standardised dashboards and alerting across all environments.',
    status: 'in_progress',
  },
];

const launchpadSeeds = [
  {
    title: '[demo] Career accelerator — product cohort',
    description: 'Four-week intensive pairing mentors with talent on storytelling, demos, and networking.',
    track: 'product',
  },
];

const volunteeringSeeds = [
  {
    title: '[demo] Climate tech strategy sprint mentor',
    organization: 'Remote Impact Alliance',
    description: 'Guide fellows through discovery workshops and narrative development for climate tech ventures.',
  },
];

const groupSeeds = [
  {
    name: '[demo] Marketplace founders circle',
    description: 'Weekly async briefings for founders sharing acquisition, retention, and compliance playbooks.',
  },
];

const connectionSeeds = [
  {
    requesterEmail: 'leo@gigvora.com',
    addresseeEmail: 'noah@gigvora.com',
    status: 'accepted',
  },
];

const messagingThreadSeeds = [
  {
    subject: '[demo] Workspace instrumentation rollout',
    channelType: 'project',
    state: 'active',
    createdByEmail: 'mia@gigvora.com',
    metadata: {
      projectSlug: 'workspace-instrumentation-rollout',
      focus: 'telemetry',
    },
    participants: [
      {
        email: 'mia@gigvora.com',
        role: 'owner',
        lastReadOffsetMinutes: 15,
        metadata: { responsibility: 'operations_lead' },
      },
      {
        email: 'leo@gigvora.com',
        role: 'participant',
        lastReadOffsetMinutes: 45,
        metadata: { responsibility: 'engineering' },
      },
      {
        email: 'ava@gigvora.com',
        role: 'support',
        lastReadOffsetMinutes: 5,
        metadata: { responsibility: 'support_escalations' },
      },
    ],
    messages: [
      {
        senderEmail: 'mia@gigvora.com',
        minutesAgo: 540,
        body:
          'Daily recap: instrumentation dashboards deployed to QA. Review the attached event contract before tomorrow’s sync.',
        metadata: { topic: 'instrumentation', cadence: 'daily_recap' },
        readOffsetMinutes: 480,
      },
      {
        senderEmail: 'leo@gigvora.com',
        minutesAgo: 420,
        body:
          'QA verified. Mixpanel mapping doc uploaded to Drive and shared with ops. Updating the production change ticket now.',
        metadata: { topic: 'instrumentation', artifact: 'mixpanel-mapping' },
        readOffsetMinutes: 360,
      },
      {
        senderEmail: 'ava@gigvora.com',
        minutesAgo: 180,
        body:
          'Support instrumentation signals confirmed. Billing alerts trigger the correct escalation path in staging.',
        metadata: { topic: 'instrumentation', alert: 'billing' },
        readOffsetMinutes: 150,
      },
      {
        senderEmail: 'mia@gigvora.com',
        minutesAgo: 60,
        body:
          'Great work—locking the production launch window for Thursday 14:00 UTC. Confirm readiness by 18:00 today.',
        metadata: { topic: 'instrumentation', action: 'confirm_launch' },
        readOffsetMinutes: 30,
      },
    ],
  },
  {
    subject: '[demo] Client onboarding Q&A — Northwind',
    channelType: 'support',
    state: 'active',
    createdByEmail: 'ava@gigvora.com',
    metadata: {
      client: 'Northwind',
      caseReference: 'SUP-204',
    },
    participants: [
      {
        email: 'ava@gigvora.com',
        role: 'support',
        lastReadOffsetMinutes: 10,
        metadata: { responsibility: 'customer_success' },
      },
      {
        email: 'mia@gigvora.com',
        role: 'owner',
        lastReadOffsetMinutes: 120,
        metadata: { responsibility: 'client_onboarding' },
      },
      {
        email: 'recruiter@gigvora.com',
        role: 'participant',
        lastReadOffsetMinutes: 25,
        metadata: { responsibility: 'talent_ops' },
      },
    ],
    messages: [
      {
        senderEmail: 'recruiter@gigvora.com',
        minutesAgo: 360,
        body:
          'Northwind confirmed the onboarding schedule. Waiting on security approvals for sandbox access before granting invites.',
        metadata: { topic: 'onboarding', pending: 'security_approvals' },
        readOffsetMinutes: 300,
      },
      {
        senderEmail: 'ava@gigvora.com',
        minutesAgo: 210,
        body:
          'Security checklists uploaded. They requested a walkthrough of billing automation—looping Mia to confirm coverage.',
        metadata: { topic: 'onboarding', task: 'billing_walkthrough' },
        readOffsetMinutes: 200,
      },
      {
        senderEmail: 'mia@gigvora.com',
        minutesAgo: 135,
        body:
          'Billing automation docs updated with latest screenshots. Scheduling a 20-minute async review for their operations lead.',
        metadata: { topic: 'onboarding', action: 'async_review' },
        readOffsetMinutes: 90,
      },
      {
        senderEmail: 'ava@gigvora.com',
        minutesAgo: 30,
        body:
          'Pushed the onboarding checklist to their workspace. Monitoring adoption metrics in case the automation triggers issues.',
        metadata: { topic: 'onboarding', followUp: 'monitor_metrics' },
        readOffsetMinutes: 20,
      },
    ],
  },
];

async function ensureUsers(queryInterface, transaction) {
  const now = new Date();
  const emails = baseUsers.map((user) => user.email);
  const existingUsers = await queryInterface.sequelize.query(
    'SELECT id, email FROM users WHERE email IN (:emails)',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { emails },
    },
  );
  const existingByEmail = new Map(existingUsers.map((row) => [row.email, row.id]));
  const toInsert = baseUsers
    .filter((user) => !existingByEmail.has(user.email))
    .map((user) => ({
      ...user,
      createdAt: now,
      updatedAt: now,
    }));

  if (toInsert.length) {
    await queryInterface.bulkInsert('users', toInsert, { transaction });
  }

  const allUsers = await queryInterface.sequelize.query(
    'SELECT id, email FROM users WHERE email IN (:emails)',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { emails },
    },
  );

  return new Map(allUsers.map((row) => [row.email, row.id]));
}

async function insertProfiles(queryInterface, transaction, table, records, userIds, now) {
  if (!records.length) return;
  const rows = records
    .map((record) => {
      const userId = userIds.get(record.email);
      if (!userId) {
        return null;
      }
      const { email, ...rest } = record;
      return { ...rest, userId, createdAt: now, updatedAt: now };
    })
    .filter(Boolean);

  if (!rows.length) return;

  const userIdList = rows.map((row) => row.userId);
  const existing = await queryInterface.sequelize.query(
    `SELECT userId FROM ${table} WHERE userId IN (:userIds)`,
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { userIds: userIdList },
    },
  );
  const existingSet = new Set(existing.map((row) => row.userId));
  const toInsert = rows.filter((row) => !existingSet.has(row.userId));
  if (toInsert.length) {
    await queryInterface.bulkInsert(table, toInsert, { transaction });
  }
}

async function insertIfMissing(queryInterface, transaction, table, uniqueWhereSql, buildRow) {
  const existing = await queryInterface.sequelize.query(uniqueWhereSql.query, {
    type: QueryTypes.SELECT,
    transaction,
    replacements: uniqueWhereSql.replacements,
  });

  if (existing.length) {
    return existing[0];
  }

  const row = buildRow();
  await queryInterface.bulkInsert(table, [row], { transaction });
  const [inserted] = await queryInterface.sequelize.query(uniqueWhereSql.query, {
    type: QueryTypes.SELECT,
    transaction,
    replacements: uniqueWhereSql.replacements,
  });
  return inserted?.[0] ?? null;
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const userIds = await ensureUsers(queryInterface, transaction);

      await insertProfiles(queryInterface, transaction, 'profiles', profileSeeds, userIds, now);
      await insertProfiles(queryInterface, transaction, 'company_profiles', companyProfileSeeds, userIds, now);
      await insertProfiles(queryInterface, transaction, 'agency_profiles', agencyProfileSeeds, userIds, now);
      await insertProfiles(queryInterface, transaction, 'freelancer_profiles', freelancerProfileSeeds, userIds, now);

      for (const post of feedPosts) {
        const userId = userIds.get(post.email);
        if (!userId) continue;
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM feed_posts WHERE userId = :userId AND content = :content LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId, content: post.content },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert(
          'feed_posts',
          [
            {
              userId,
              content: post.content,
              visibility: post.visibility,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      for (const job of jobSeeds) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM jobs WHERE title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { title: job.title },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert('jobs', [{ ...job, createdAt: now, updatedAt: now }], { transaction });
      }

      for (const gig of gigSeeds) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM gigs WHERE title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { title: gig.title },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert('gigs', [{ ...gig, createdAt: now, updatedAt: now }], { transaction });
      }

      for (const project of projectSeeds) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM projects WHERE title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { title: project.title },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert('projects', [{ ...project, createdAt: now, updatedAt: now }], { transaction });
      }

      for (const launchpad of launchpadSeeds) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM experience_launchpads WHERE title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { title: launchpad.title },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert(
          'experience_launchpads',
          [{ ...launchpad, createdAt: now, updatedAt: now }],
          { transaction },
        );
      }

      for (const volunteering of volunteeringSeeds) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM volunteering_roles WHERE title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { title: volunteering.title },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert(
          'volunteering_roles',
          [{ ...volunteering, createdAt: now, updatedAt: now }],
          { transaction },
        );
      }

      const groupIdByName = new Map();
      for (const group of groupSeeds) {
        const [groupRow] = await queryInterface.sequelize.query(
          'SELECT id FROM groups WHERE name = :name LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { name: group.name },
          },
        );
        if (groupRow?.id) {
          groupIdByName.set(group.name, groupRow.id);
          continue;
        }
        await queryInterface.bulkInsert('groups', [{ ...group, createdAt: now, updatedAt: now }], { transaction });
        const [insertedGroup] = await queryInterface.sequelize.query(
          'SELECT id FROM groups WHERE name = :name LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { name: group.name },
          },
        );
        if (insertedGroup?.id) {
          groupIdByName.set(group.name, insertedGroup.id);
        }
      }

      if (groupIdByName.size) {
        for (const group of groupSeeds) {
          const groupId = groupIdByName.get(group.name);
          if (!groupId) continue;
          for (const email of ['ava@gigvora.com', 'leo@gigvora.com']) {
            const userId = userIds.get(email);
            if (!userId) continue;
            const [membership] = await queryInterface.sequelize.query(
              'SELECT id FROM group_memberships WHERE groupId = :groupId AND userId = :userId LIMIT 1',
              {
                type: QueryTypes.SELECT,
                transaction,
                replacements: { groupId, userId },
              },
            );
            if (membership?.id) continue;
            await queryInterface.bulkInsert(
              'group_memberships',
              [
                {
                  groupId,
                  userId,
                  role: email === 'ava@gigvora.com' ? 'owner' : 'member',
                  createdAt: now,
                  updatedAt: now,
                },
              ],
              { transaction },
            );
          }
        }
      }

      for (const connection of connectionSeeds) {
        const requesterId = userIds.get(connection.requesterEmail);
        const addresseeId = userIds.get(connection.addresseeEmail);
        if (!requesterId || !addresseeId) continue;
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM connections WHERE requesterId = :requesterId AND addresseeId = :addresseeId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { requesterId, addresseeId },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert(
          'connections',
          [
            {
              requesterId,
              addresseeId,
              status: connection.status,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      for (const thread of messagingThreadSeeds) {
        const createdBy = userIds.get(thread.createdByEmail);
        if (!createdBy) continue;

        const timeline = thread.messages
          .map((message, index) => {
            const senderId = userIds.get(message.senderEmail);
            if (!senderId) {
              return null;
            }
            const minutesAgo = typeof message.minutesAgo === 'number' ? message.minutesAgo : index * 15 + 10;
            const createdAt = new Date(now.getTime() - minutesAgo * 60 * 1000);
            const deliveredAt = new Date(createdAt.getTime() + 2 * 60 * 1000);
            const readAt =
              typeof message.readOffsetMinutes === 'number'
                ? new Date(now.getTime() - message.readOffsetMinutes * 60 * 1000)
                : null;
            return {
              senderId,
              body: message.body,
              messageType: message.messageType ?? 'text',
              metadata: message.metadata ?? null,
              isEdited: Boolean(message.isEdited ?? false),
              editedAt: message.editedAt ?? null,
              createdAt,
              updatedAt: message.updatedMinutesAgo
                ? new Date(now.getTime() - message.updatedMinutesAgo * 60 * 1000)
                : createdAt,
              deliveredAt,
              readAt,
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.createdAt - b.createdAt);

        if (!timeline.length) {
          continue;
        }

        const firstTimestamp = timeline[0].createdAt;
        const lastEntry = timeline[timeline.length - 1];
        const lastTimestamp = lastEntry.createdAt;
        const lastPreview =
          typeof lastEntry.body === 'string' && lastEntry.body.length
            ? lastEntry.body.slice(0, 300)
            : null;

        let threadId;
        const [existingThread] = await queryInterface.sequelize.query(
          'SELECT id FROM message_threads WHERE subject = :subject AND createdBy = :createdBy LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { subject: thread.subject, createdBy },
          },
        );

        if (existingThread?.id) {
          threadId = existingThread.id;
          await queryInterface.bulkUpdate(
            'message_threads',
            {
              state: thread.state ?? 'active',
              metadata: thread.metadata ?? null,
              lastMessageAt: lastTimestamp,
              lastMessagePreview: lastPreview,
              updatedAt: lastTimestamp,
            },
            { id: threadId },
            { transaction },
          );
        } else {
          await queryInterface.bulkInsert(
            'message_threads',
            [
              {
                subject: thread.subject,
                channelType: thread.channelType ?? 'direct',
                state: thread.state ?? 'active',
                createdBy,
                metadata: thread.metadata ?? null,
                lastMessageAt: lastTimestamp,
                lastMessagePreview: lastPreview,
                createdAt: firstTimestamp,
                updatedAt: lastTimestamp,
              },
            ],
            { transaction },
          );
          const [insertedThread] = await queryInterface.sequelize.query(
            'SELECT id FROM message_threads WHERE subject = :subject AND createdBy = :createdBy ORDER BY id DESC LIMIT 1',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: { subject: thread.subject, createdBy },
            },
          );
          threadId = insertedThread?.id;
        }

        if (!threadId) {
          continue;
        }

        for (const participant of thread.participants) {
          const userId = userIds.get(participant.email);
          if (!userId) continue;
          const lastReadAt =
            typeof participant.lastReadOffsetMinutes === 'number'
              ? new Date(now.getTime() - participant.lastReadOffsetMinutes * 60 * 1000)
              : null;

          const [existingParticipant] = await queryInterface.sequelize.query(
            'SELECT id FROM message_participants WHERE threadId = :threadId AND userId = :userId LIMIT 1',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: { threadId, userId },
            },
          );

          const participantPayload = {
            role: participant.role ?? 'participant',
            notificationsEnabled: participant.notificationsEnabled ?? true,
            mutedUntil: participant.mutedUntil ?? null,
            lastReadAt,
            metadata: participant.metadata ?? null,
            updatedAt: lastTimestamp,
          };

          if (existingParticipant?.id) {
            await queryInterface.bulkUpdate(
              'message_participants',
              participantPayload,
              { threadId, userId },
              { transaction },
            );
          } else {
            await queryInterface.bulkInsert(
              'message_participants',
              [
                {
                  threadId,
                  userId,
                  ...participantPayload,
                  createdAt: firstTimestamp,
                },
              ],
              { transaction },
            );
          }
        }

        for (const entry of timeline) {
          const [existingMessage] = await queryInterface.sequelize.query(
            'SELECT id FROM messages WHERE threadId = :threadId AND senderId = :senderId AND body = :body LIMIT 1',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: { threadId, senderId: entry.senderId, body: entry.body },
            },
          );

          const messagePayload = {
            messageType: entry.messageType,
            metadata: entry.metadata,
            isEdited: entry.isEdited,
            editedAt: entry.editedAt,
            deliveredAt: entry.deliveredAt,
            readAt: entry.readAt,
            updatedAt: entry.updatedAt,
          };

          if (existingMessage?.id) {
            await queryInterface.bulkUpdate(
              'messages',
              messagePayload,
              { id: existingMessage.id },
              { transaction },
            );
            continue;
          }

          await queryInterface.bulkInsert(
            'messages',
            [
              {
                threadId,
                senderId: entry.senderId,
                body: entry.body,
                createdAt: entry.createdAt,
                ...messagePayload,
              },
            ],
            { transaction },
          );
        }
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const userEmails = baseUsers.map((user) => user.email);
      const users = await queryInterface.sequelize.query(
        'SELECT id, email FROM users WHERE email IN (:emails)',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { emails: userEmails },
        },
      );
      const userIds = users.map((user) => user.id);
      const userIdByEmail = new Map(users.map((user) => [user.email, user.id]));

      const threadIdsToRemove = [];
      for (const thread of messagingThreadSeeds) {
        const createdBy = userIdByEmail.get(thread.createdByEmail);
        if (!createdBy) continue;
        const [existingThread] = await queryInterface.sequelize.query(
          'SELECT id FROM message_threads WHERE subject = :subject AND createdBy = :createdBy LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { subject: thread.subject, createdBy },
          },
        );
        if (existingThread?.id) {
          threadIdsToRemove.push(existingThread.id);
        }
      }

      if (threadIdsToRemove.length) {
        await queryInterface.bulkDelete(
          'message_threads',
          { id: { [Op.in]: threadIdsToRemove } },
          { transaction },
        );
      }

      if (userIds.length) {
        await queryInterface.bulkDelete(
          'connections',
          {
            requesterId: { [Op.in]: userIds },
            addresseeId: { [Op.in]: userIds },
          },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'group_memberships',
          { userId: { [Op.in]: userIds } },
          { transaction },
        );
        await queryInterface.bulkDelete('freelancer_profiles', { userId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('agency_profiles', { userId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('company_profiles', { userId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('profiles', { userId: { [Op.in]: userIds } }, { transaction });
      }

      await queryInterface.bulkDelete(
        'feed_posts',
        { content: feedPosts.map((post) => post.content) },
        { transaction },
      );
      await queryInterface.bulkDelete('jobs', { title: jobSeeds.map((job) => job.title) }, { transaction });
      await queryInterface.bulkDelete('gigs', { title: gigSeeds.map((gig) => gig.title) }, { transaction });
      await queryInterface.bulkDelete('projects', { title: projectSeeds.map((project) => project.title) }, { transaction });
      await queryInterface.bulkDelete(
        'experience_launchpads',
        { title: launchpadSeeds.map((launchpad) => launchpad.title) },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'volunteering_roles',
        { title: volunteeringSeeds.map((volunteering) => volunteering.title) },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'groups',
        { name: groupSeeds.map((group) => group.name) },
        { transaction },
      );
      await queryInterface.bulkDelete('users', { email: userEmails }, { transaction });
    });
  },
};
