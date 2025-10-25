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
    firstName: 'Jules',
    lastName: 'Strategist',
    email: 'jules@gigvora.com',
    password: '$2b$10$n6MPrXwN6kPymBi/GsMBCecal.lOEWTWmr25RR80Gn3mtiq3IztUG',
    address: '512 Collaboration Court, Remote City',
    age: 31,
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
    email: 'jules@gigvora.com',
    headline: 'Fractional Product Strategist',
    bio: 'Guides product-market fit experiments and operationalises feedback loops for remote delivery pods.',
    skills: 'Product Strategy, Experiment Design, Facilitation, SQL, Mixpanel',
    experience: '6 years leading discovery sprints and experimentation programs for B2B SaaS.',
    education: 'MSc Human Computer Interaction, Remote Design Institute',
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
  {
    email: 'jules@gigvora.com',
    title: 'Product Experimentation Lead',
    hourlyRate: 135.0,
    availability: '15 hrs/week · Remote within UTC±1',
  },
];

const feedPosts = [
  {
    email: 'ava@gigvora.com',
    title: 'Release candidate 1.50 rolling out',
    summary: 'Runtime security enhancements and analytics exports now live for enterprise workspaces.',
    content:
      '[demo] Platform release candidate 1.50 ships runtime security enhancements, hardened runtime policies, and workspace analytics exports. Early adopters get the rollout notes in their inbox today.',
    visibility: 'public',
    type: 'update',
    link: 'https://updates.gigvora.test/releases/1-50',
    imageUrl: 'https://assets.gigvora.test/releases/1-50/cover.jpg',
    mediaAttachments: [
      {
        id: 'release-1-50',
        url: 'https://assets.gigvora.test/releases/1-50/dashboard.png',
        type: 'image',
        alt: 'Analytics dashboard preview for release 1.50',
      },
    ],
    authorHeadline: 'Co-founder & CEO · Gigvora',
  },
  {
    email: 'leo@gigvora.com',
    title: 'Automation onboarding template available',
    summary: 'Async playbooks ready for teams onboarding to workflow automation templates.',
    content:
      '[demo] Shipping an onboarding automation template — DM if you need async walkthroughs or want help mapping your workspace automations to the new playbooks.',
    visibility: 'public',
    type: 'project',
    link: 'https://workspace.gigvora.test/automation-template',
    mediaAttachments: [
      {
        id: 'automation-preview',
        url: 'https://assets.gigvora.test/templates/automation-preview.png',
        type: 'image',
        alt: 'Automation template cards and workflow preview',
      },
    ],
    authorHeadline: 'Fractional Staff Engineer · Gigvora Network',
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

const autoAssignSettingsSeed = {
  limit: 6,
  expiresInMinutes: 240,
  fairness: { ensureNewcomer: true, maxAssignments: 3 },
  weights: {
    recency: 0.24,
    rating: 0.18,
    completionRecency: 0.16,
    completionQuality: 0.2,
    earningsBalance: 0.12,
    inclusion: 0.1,
  },
};

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
        const userSeed = baseUsers.find((seed) => seed.email === post.email) ?? {};
        const profileSeed = profileSeeds.find((seed) => seed.email === post.email);
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM feed_posts WHERE userId = :userId AND content = :content LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId, content: post.content },
          },
        );
        if (existing?.id) continue;
        const authorName =
          post.authorName ||
          [userSeed.firstName, userSeed.lastName].filter(Boolean).join(' ').trim() ||
          userSeed.email ||
          'Gigvora member';
        const authorHeadline =
          post.authorHeadline || profileSeed?.headline || profileSeed?.bio || 'Marketplace community update';
        const authorAvatarSeed = post.authorAvatarSeed || userSeed.firstName || authorName;
        await queryInterface.bulkInsert(
          'feed_posts',
          [
            {
              userId,
              content: post.content,
              summary: post.summary ?? null,
              title: post.title ?? null,
              visibility: post.visibility ?? 'public',
              type: post.type ?? 'update',
              link: post.link ?? null,
              imageUrl: post.imageUrl ?? null,
              source: post.source ?? null,
              mediaAttachments: post.mediaAttachments ?? null,
              authorName,
              authorHeadline,
              authorAvatarSeed,
              publishedAt: now,
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

      const leoId = userIds.get('leo@gigvora.com');
      const julesId = userIds.get('jules@gigvora.com');
      const operationsActorId = userIds.get('mia@gigvora.com') ?? null;
      const projectTitle = projectSeeds[0]?.title;

      if (projectTitle && leoId) {
        const [projectRow] = await queryInterface.sequelize.query(
          'SELECT id FROM projects WHERE title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { title: projectTitle },
          },
        );

        if (projectRow?.id) {
          const projectId = projectRow.id;
          const queueGeneratedAt = new Date(now.getTime() - 45 * 60 * 1000);
          const nextExpiryAt = new Date(now.getTime() + 3 * 60 * 60 * 1000);
          const acceptedCreatedAt = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const acceptedNotifiedAt = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
          const acceptedResolvedAt = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
          const acceptedRespondedAt = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
          const acceptedExpiresAt = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
          const projectValueSeed = 7200;

          const queueEntrySeeds = [
            {
              key: 'leo-live',
              record: {
                targetType: 'project',
                targetId: projectId,
                freelancerId: leoId,
                score: 0.9125,
                priorityBucket: 1,
                status: 'notified',
                expiresAt: nextExpiryAt,
                notifiedAt: new Date(now.getTime() - 15 * 60 * 1000),
                resolvedAt: null,
                projectValue: projectValueSeed,
                metadata: {
                  breakdown: {
                    lastAssignmentDays: 0.5,
                    recencyScore: 0.96,
                    rating: 4.86,
                    ratingScore: 0.972,
                    lastCompletedDays: 9,
                    completionRecencyScore: 0.91,
                    completionRate: 0.92,
                    earningsBalanceScore: 0.82,
                    totalAssigned: 12,
                    totalCompleted: 10,
                    newFreelancerScore: 0.42,
                  },
                  projectName: projectTitle,
                  generatedAt: queueGeneratedAt.toISOString(),
                  generatedBy: operationsActorId,
                  version: '2024.08.autoassign',
                  weights: autoAssignSettingsSeed.weights,
                  fairness: {
                    ensuredNewcomer: false,
                    newcomerFreelancerId: null,
                    maxAssignmentsForPriority: autoAssignSettingsSeed.fairness.maxAssignments,
                  },
                },
                responseMetadata: null,
                createdAt: queueGeneratedAt,
                updatedAt: now,
              },
            },
            julesId
              ? {
                  key: 'jules-pending',
                  record: {
                    targetType: 'project',
                    targetId: projectId,
                    freelancerId: julesId,
                    score: 0.8754,
                    priorityBucket: 1,
                    status: 'pending',
                    expiresAt: nextExpiryAt,
                    notifiedAt: null,
                    resolvedAt: null,
                    projectValue: projectValueSeed,
                    metadata: {
                      breakdown: {
                        lastAssignmentDays: 3.2,
                        recencyScore: 0.79,
                        rating: 4.62,
                        ratingScore: 0.924,
                        lastCompletedDays: 18,
                        completionRecencyScore: 0.8,
                        completionRate: 0.88,
                        earningsBalanceScore: 0.77,
                        totalAssigned: 2,
                        totalCompleted: 2,
                        newFreelancerScore: 0.86,
                      },
                      projectName: projectTitle,
                      generatedAt: queueGeneratedAt.toISOString(),
                      generatedBy: operationsActorId,
                      version: '2024.08.autoassign',
                      weights: autoAssignSettingsSeed.weights,
                      fairness: {
                        ensuredNewcomer: true,
                        newcomerFreelancerId: julesId,
                        maxAssignmentsForPriority: autoAssignSettingsSeed.fairness.maxAssignments,
                      },
                    },
                    responseMetadata: null,
                    createdAt: queueGeneratedAt,
                    updatedAt: now,
                  },
                }
              : null,
            {
              key: 'leo-accepted',
              record: {
                targetType: 'project',
                targetId: projectId,
                freelancerId: leoId,
                score: 0.8841,
                priorityBucket: 2,
                status: 'accepted',
                expiresAt: acceptedExpiresAt,
                notifiedAt: acceptedNotifiedAt,
                resolvedAt: acceptedResolvedAt,
                projectValue: 6400,
                metadata: {
                  breakdown: {
                    lastAssignmentDays: 12.5,
                    recencyScore: 0.58,
                    rating: 4.78,
                    ratingScore: 0.956,
                    lastCompletedDays: 32,
                    completionRecencyScore: 0.64,
                    completionRate: 0.91,
                    earningsBalanceScore: 0.74,
                    totalAssigned: 9,
                    totalCompleted: 8,
                    newFreelancerScore: 0.48,
                  },
                  projectName: projectTitle,
                  generatedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
                  generatedBy: operationsActorId,
                  version: '2024.06.autoassign',
                  weights: autoAssignSettingsSeed.weights,
                  fairness: {
                    ensuredNewcomer: false,
                    newcomerFreelancerId: null,
                    maxAssignmentsForPriority: autoAssignSettingsSeed.fairness.maxAssignments,
                  },
                },
                responseMetadata: {
                  responseTimeSeconds: 4200,
                  rating: 4.9,
                  completionValue: 6200,
                  reasonCode: 'capacity_confirmed',
                },
                createdAt: acceptedCreatedAt,
                updatedAt: acceptedResolvedAt,
              },
              response: {
                status: 'accepted',
                respondedBy: leoId,
                respondedAt: acceptedRespondedAt,
                reasonCode: 'capacity_confirmed',
                reasonLabel: 'Capacity confirmed',
                responseNotes: 'Able to start immediately with analytics pod.',
                metadata: {
                  responseTimeSeconds: 4200,
                  rating: 4.9,
                  completionValue: 6200,
                },
              },
            },
          ].filter(Boolean);

          const activeEntryCount = queueEntrySeeds.filter((seed) =>
            ['pending', 'notified'].includes(seed.record.status),
          ).length;

          await queryInterface.bulkUpdate(
            'projects',
            {
              budgetAmount: 24000,
              budgetCurrency: 'USD',
              autoAssignEnabled: true,
              autoAssignStatus: activeEntryCount ? 'queue_active' : 'awaiting_candidates',
              autoAssignSettings: autoAssignSettingsSeed,
              autoAssignLastRunAt: queueGeneratedAt,
              autoAssignLastQueueSize: activeEntryCount,
              updatedAt: now,
            },
            { id: projectId },
            { transaction },
          );

          const assignmentMetricSeeds = [
            {
              freelancerId: leoId,
              rating: 4.86,
              completionRate: 0.92,
              avgAssignedValue: 6150,
              lifetimeAssignedValue: 49200,
              lifetimeCompletedValue: 43800,
              lastAssignedAt: queueGeneratedAt,
              lastCompletedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
              totalAssigned: 12,
              totalCompleted: 10,
            },
            julesId
              ? {
                  freelancerId: julesId,
                  rating: 4.62,
                  completionRate: 0.88,
                  avgAssignedValue: 5400,
                  lifetimeAssignedValue: 16200,
                  lifetimeCompletedValue: 14200,
                  lastAssignedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
                  lastCompletedAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
                  totalAssigned: 2,
                  totalCompleted: 2,
                }
              : null,
          ].filter(Boolean);

          for (const metric of assignmentMetricSeeds) {
            const [existingMetric] = await queryInterface.sequelize.query(
              'SELECT id FROM freelancer_assignment_metrics WHERE freelancerId = :freelancerId LIMIT 1',
              {
                type: QueryTypes.SELECT,
                transaction,
                replacements: { freelancerId: metric.freelancerId },
              },
            );

            if (existingMetric?.id) {
              await queryInterface.bulkUpdate(
                'freelancer_assignment_metrics',
                {
                  rating: metric.rating,
                  completionRate: metric.completionRate,
                  avgAssignedValue: metric.avgAssignedValue,
                  lifetimeAssignedValue: metric.lifetimeAssignedValue,
                  lifetimeCompletedValue: metric.lifetimeCompletedValue,
                  lastAssignedAt: metric.lastAssignedAt,
                  lastCompletedAt: metric.lastCompletedAt,
                  totalAssigned: metric.totalAssigned,
                  totalCompleted: metric.totalCompleted,
                  updatedAt: now,
                },
                { freelancerId: metric.freelancerId },
                { transaction },
              );
            } else {
              await queryInterface.bulkInsert(
                'freelancer_assignment_metrics',
                [
                  {
                    freelancerId: metric.freelancerId,
                    rating: metric.rating,
                    completionRate: metric.completionRate,
                    avgAssignedValue: metric.avgAssignedValue,
                    lifetimeAssignedValue: metric.lifetimeAssignedValue,
                    lifetimeCompletedValue: metric.lifetimeCompletedValue,
                    lastAssignedAt: metric.lastAssignedAt,
                    lastCompletedAt: metric.lastCompletedAt,
                    totalAssigned: metric.totalAssigned,
                    totalCompleted: metric.totalCompleted,
                    createdAt: now,
                    updatedAt: now,
                  },
                ],
                { transaction },
              );
            }
          }

          const preferenceSeeds = [
            {
              freelancerId: leoId,
              availabilityStatus: 'available',
              availabilityMode: 'always_on',
              timezone: 'America/New_York',
              dailyMatchLimit: 4,
              autoAcceptThreshold: 82,
              quietHoursStart: '22:00',
              quietHoursEnd: '06:00',
              snoozedUntil: null,
              receiveEmailNotifications: true,
              receiveInAppNotifications: true,
              escalationContact: 'ops@gigvora.com',
              notes: 'Prefers analytics pods and asynchronous updates.',
              metadata: { channels: ['email', 'slack'], cadence: 'weekly' },
            },
            julesId
              ? {
                  freelancerId: julesId,
                  availabilityStatus: 'snoozed',
                  availabilityMode: 'manual',
                  timezone: 'Europe/Lisbon',
                  dailyMatchLimit: 2,
                  autoAcceptThreshold: 75,
                  quietHoursStart: '18:00',
                  quietHoursEnd: '08:00',
                  snoozedUntil: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
                  receiveEmailNotifications: true,
                  receiveInAppNotifications: false,
                  escalationContact: 'ops@gigvora.com',
                  notes: 'Snoozed while wrapping a product audit.',
                  metadata: { coverage: ['email'], reminder: 'Notify when queue regenerates' },
                }
              : null,
          ].filter(Boolean);

          for (const preference of preferenceSeeds) {
            const [existingPreference] = await queryInterface.sequelize.query(
              'SELECT id FROM freelancer_auto_match_preferences WHERE freelancerId = :freelancerId LIMIT 1',
              {
                type: QueryTypes.SELECT,
                transaction,
                replacements: { freelancerId: preference.freelancerId },
              },
            );

            const preferencePayload = {
              availabilityStatus: preference.availabilityStatus,
              availabilityMode: preference.availabilityMode,
              timezone: preference.timezone,
              dailyMatchLimit: preference.dailyMatchLimit,
              autoAcceptThreshold: preference.autoAcceptThreshold,
              quietHoursStart: preference.quietHoursStart,
              quietHoursEnd: preference.quietHoursEnd,
              snoozedUntil: preference.snoozedUntil,
              receiveEmailNotifications: preference.receiveEmailNotifications,
              receiveInAppNotifications: preference.receiveInAppNotifications,
              escalationContact: preference.escalationContact,
              notes: preference.notes,
              metadata: preference.metadata,
              updatedAt: now,
            };

            if (existingPreference?.id) {
              await queryInterface.bulkUpdate(
                'freelancer_auto_match_preferences',
                preferencePayload,
                { freelancerId: preference.freelancerId },
                { transaction },
              );
            } else {
              await queryInterface.bulkInsert(
                'freelancer_auto_match_preferences',
                [
                  {
                    freelancerId: preference.freelancerId,
                    ...preferencePayload,
                    createdAt: now,
                  },
                ],
                { transaction },
              );
            }
          }

          for (const seed of queueEntrySeeds) {
            const { record, response } = seed;
            const [existingQueueEntry] = await queryInterface.sequelize.query(
              `SELECT id FROM auto_assign_queue_entries
               WHERE targetType = :targetType AND targetId = :targetId AND freelancerId = :freelancerId AND status = :status
               LIMIT 1`,
              {
                type: QueryTypes.SELECT,
                transaction,
                replacements: {
                  targetType: record.targetType,
                  targetId: record.targetId,
                  freelancerId: record.freelancerId,
                  status: record.status,
                },
              },
            );

            let queueEntryId = existingQueueEntry?.id;

            if (queueEntryId) {
              await queryInterface.bulkUpdate(
                'auto_assign_queue_entries',
                {
                  score: record.score,
                  priorityBucket: record.priorityBucket,
                  status: record.status,
                  expiresAt: record.expiresAt,
                  notifiedAt: record.notifiedAt,
                  resolvedAt: record.resolvedAt,
                  projectValue: record.projectValue,
                  metadata: record.metadata,
                  responseMetadata: record.responseMetadata,
                  updatedAt: record.updatedAt ?? now,
                },
                { id: queueEntryId },
                { transaction },
              );
            } else {
              await queryInterface.bulkInsert(
                'auto_assign_queue_entries',
                [
                  {
                    ...record,
                    createdAt: record.createdAt ?? now,
                    updatedAt: record.updatedAt ?? now,
                  },
                ],
                { transaction },
              );
              const [insertedQueueEntry] = await queryInterface.sequelize.query(
                `SELECT id FROM auto_assign_queue_entries
                 WHERE targetType = :targetType AND targetId = :targetId AND freelancerId = :freelancerId AND status = :status
                 ORDER BY id DESC
                 LIMIT 1`,
                {
                  type: QueryTypes.SELECT,
                  transaction,
                  replacements: {
                    targetType: record.targetType,
                    targetId: record.targetId,
                    freelancerId: record.freelancerId,
                    status: record.status,
                  },
                },
              );
              queueEntryId = insertedQueueEntry?.id;
            }

            if (queueEntryId && response) {
              const [existingResponse] = await queryInterface.sequelize.query(
                'SELECT id FROM auto_assign_responses WHERE queueEntryId = :queueEntryId LIMIT 1',
                {
                  type: QueryTypes.SELECT,
                  transaction,
                  replacements: { queueEntryId },
                },
              );

              const responsePayload = {
                queueEntryId,
                freelancerId: record.freelancerId,
                status: response.status,
                respondedBy: response.respondedBy ?? null,
                respondedAt: response.respondedAt,
                reasonCode: response.reasonCode ?? null,
                reasonLabel: response.reasonLabel ?? null,
                responseNotes: response.responseNotes ?? null,
                metadata: response.metadata ?? null,
                updatedAt: response.respondedAt,
              };

              if (existingResponse?.id) {
                await queryInterface.bulkUpdate(
                  'auto_assign_responses',
                  responsePayload,
                  { id: existingResponse.id },
                  { transaction },
                );
              } else {
                await queryInterface.bulkInsert(
                  'auto_assign_responses',
                  [
                    {
                      ...responsePayload,
                      createdAt: response.respondedAt,
                    },
                  ],
                  { transaction },
                );
              }
            }
          }

          const [existingEvent] = await queryInterface.sequelize.query(
            'SELECT id FROM project_assignment_events WHERE projectId = :projectId AND eventType = :eventType LIMIT 1',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: { projectId, eventType: 'auto_assign_queue_generated' },
            },
          );

          const eventPayload = {
            settings: autoAssignSettingsSeed,
            activeQueueSize: activeEntryCount,
            ensuredNewcomerId: julesId ?? null,
            generatedAt: queueGeneratedAt.toISOString(),
          };

          if (existingEvent?.id) {
            await queryInterface.bulkUpdate(
              'project_assignment_events',
              { payload: eventPayload, actorId: operationsActorId, updatedAt: queueGeneratedAt },
              { id: existingEvent.id },
              { transaction },
            );
          } else {
            await queryInterface.bulkInsert(
              'project_assignment_events',
              [
                {
                  projectId,
                  actorId: operationsActorId,
                  eventType: 'auto_assign_queue_generated',
                  payload: eventPayload,
                  createdAt: queueGeneratedAt,
                  updatedAt: queueGeneratedAt,
                },
              ],
              { transaction },
            );
          }
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
        await queryInterface.bulkDelete(
          'freelancer_auto_match_preferences',
          { freelancerId: { [Op.in]: userIds } },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'freelancer_assignment_metrics',
          { freelancerId: { [Op.in]: userIds } },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'auto_assign_responses',
          { freelancerId: { [Op.in]: userIds } },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'auto_assign_queue_entries',
          { freelancerId: { [Op.in]: userIds } },
          { transaction },
        );
        await queryInterface.bulkDelete('freelancer_profiles', { userId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('agency_profiles', { userId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('company_profiles', { userId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('profiles', { userId: { [Op.in]: userIds } }, { transaction });
      }

      const projects = await queryInterface.sequelize.query(
        'SELECT id FROM projects WHERE title IN (:titles)',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { titles: projectSeeds.map((project) => project.title) },
        },
      );
      const projectIds = projects.map((project) => project.id);

      if (projectIds.length) {
        const queueEntries = await queryInterface.sequelize.query(
          'SELECT id FROM auto_assign_queue_entries WHERE targetType = :targetType AND targetId IN (:projectIds)',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { targetType: 'project', projectIds },
          },
        );
        const queueEntryIds = queueEntries.map((entry) => entry.id);
        if (queueEntryIds.length) {
          await queryInterface.bulkDelete(
            'auto_assign_responses',
            { queueEntryId: { [Op.in]: queueEntryIds } },
            { transaction },
          );
        }
        await queryInterface.bulkDelete(
          'auto_assign_queue_entries',
          { targetType: 'project', targetId: { [Op.in]: projectIds } },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'project_assignment_events',
          { projectId: { [Op.in]: projectIds }, eventType: 'auto_assign_queue_generated' },
          { transaction },
        );
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
