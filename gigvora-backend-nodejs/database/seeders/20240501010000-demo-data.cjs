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

  const [allUsers] = await queryInterface.sequelize.query(
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
