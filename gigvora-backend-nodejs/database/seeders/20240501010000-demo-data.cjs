'use strict';

const { QueryTypes, Op } = require('sequelize');
const statusTaxonomy = require('../../../shared-contracts/domain/common/statuses.json');

const SEED_METADATA_TAG = 'status-taxonomy-demo';
const SEED_PROFILE_BIO = 'Seed profile for status taxonomy alignment.';

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

      const identityStatuses = new Set(statusTaxonomy.identityVerification?.statuses ?? []);
      const corporateStatuses = new Set(statusTaxonomy.corporateVerification?.statuses ?? []);
      const qualificationStatuses = new Set(statusTaxonomy.qualificationCredential?.statuses ?? []);
      const walletAccountStatuses = new Set(statusTaxonomy.walletAccount?.statuses ?? []);
      const walletLedgerTypes = new Set(statusTaxonomy.walletLedgerEntry?.statuses ?? []);

      const profileIdCache = new Map();
      async function ensureProfile(email, fallback = {}) {
        if (profileIdCache.has(email)) {
          return profileIdCache.get(email);
        }
        const userId = userIds.get(email);
        if (!userId) {
          profileIdCache.set(email, null);
          return null;
        }
        const [existingProfile] = await queryInterface.sequelize.query(
          'SELECT id FROM profiles WHERE userId = :userId ORDER BY id DESC LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId },
          },
        );
        if (existingProfile?.id) {
          profileIdCache.set(email, existingProfile.id);
          return existingProfile.id;
        }
        const profilePayload = {
          userId,
          headline: fallback.headline ?? 'Status taxonomy demo profile',
          bio: fallback.bio ?? SEED_PROFILE_BIO,
          skills:
            fallback.skills ?? 'Compliance, Identity Verification, Wallet Operations, Agency Governance',
          experience:
            fallback.experience ?? 'Seeded profile coverage for shared status taxonomy validation.',
          availabilityStatus: fallback.availabilityStatus ?? 'available',
          openToRemote: fallback.openToRemote ?? true,
          availabilityNotes: fallback.availabilityNotes ?? 'Seeded data for taxonomy coverage.',
          profileVisibility: fallback.profileVisibility ?? 'members',
          networkVisibility: fallback.networkVisibility ?? 'connections',
          followersVisibility: fallback.followersVisibility ?? 'connections',
          createdAt: fallback.createdAt ?? now,
          updatedAt: fallback.updatedAt ?? now,
        };
        await queryInterface.bulkInsert('profiles', [profilePayload], { transaction });
        const [insertedProfile] = await queryInterface.sequelize.query(
          'SELECT id FROM profiles WHERE userId = :userId ORDER BY id DESC LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId },
          },
        );
        const profileId = insertedProfile?.id ?? null;
        profileIdCache.set(email, profileId);
        return profileId;
      }

      const companyProfileCache = new Map();
      async function findCompanyProfileId(email) {
        if (companyProfileCache.has(email)) {
          return companyProfileCache.get(email);
        }
        const userId = userIds.get(email);
        if (!userId) {
          companyProfileCache.set(email, null);
          return null;
        }
        const [companyProfile] = await queryInterface.sequelize.query(
          'SELECT id FROM company_profiles WHERE userId = :userId ORDER BY id DESC LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId },
          },
        );
        const companyProfileId = companyProfile?.id ?? null;
        companyProfileCache.set(email, companyProfileId);
        return companyProfileId;
      }

      const agencyProfileCache = new Map();
      async function findAgencyProfileId(email) {
        if (agencyProfileCache.has(email)) {
          return agencyProfileCache.get(email);
        }
        const userId = userIds.get(email);
        if (!userId) {
          agencyProfileCache.set(email, null);
          return null;
        }
        const [agencyProfile] = await queryInterface.sequelize.query(
          'SELECT id FROM agency_profiles WHERE userId = :userId ORDER BY id DESC LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId },
          },
        );
        const agencyProfileId = agencyProfile?.id ?? null;
        agencyProfileCache.set(email, agencyProfileId);
        return agencyProfileId;
      }

      const identityVerificationIdByEmail = new Map();
      const identityVerificationSeeds = [
        {
          email: 'leo@gigvora.com',
          status: 'verified',
          verificationProvider: 'stripe_identity',
          typeOfId: 'passport',
          idNumberLast4: '8842',
          issuingCountry: 'GBR',
          submittedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          reviewedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
          reviewNotes: 'Documents validated automatically via provider API.',
          documentFrontKey: 'seed/demo-status-taxonomy/leo-front.png',
          documentBackKey: 'seed/demo-status-taxonomy/leo-back.png',
          selfieKey: 'seed/demo-status-taxonomy/leo-selfie.png',
          addressLine1: '221B Baker Street',
          city: 'London',
          postalCode: 'NW1 6XE',
          country: 'GBR',
        },
        {
          email: 'mia@gigvora.com',
          status: 'in_review',
          verificationProvider: 'persona',
          typeOfId: 'national_id',
          idNumberLast4: '1045',
          issuingCountry: 'FRA',
          submittedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          reviewNotes: 'Awaiting enhanced business documentation validation.',
          documentFrontKey: 'seed/demo-status-taxonomy/mia-front.png',
          documentBackKey: 'seed/demo-status-taxonomy/mia-back.png',
          selfieKey: 'seed/demo-status-taxonomy/mia-selfie.png',
          addressLine1: '45 Rue du Faubourg Saint-Honoré',
          city: 'Paris',
          postalCode: '75008',
          country: 'FRA',
        },
        {
          email: 'noah@gigvora.com',
          status: 'submitted',
          verificationProvider: 'manual_review',
          typeOfId: 'driver_license',
          idNumberLast4: '5521',
          issuingCountry: 'USA',
          submittedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          documentFrontKey: 'seed/demo-status-taxonomy/noah-front.png',
          documentBackKey: 'seed/demo-status-taxonomy/noah-back.png',
          selfieKey: 'seed/demo-status-taxonomy/noah-selfie.png',
          addressLine1: '500 Market Street',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94105',
          country: 'USA',
        },
        {
          email: 'mentor@gigvora.com',
          status: 'rejected',
          verificationProvider: 'manual_review',
          typeOfId: 'passport',
          idNumberLast4: '7812',
          issuingCountry: 'PRT',
          submittedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
          reviewedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          declinedReason: 'Selfie capture did not match submitted passport.',
          reviewNotes: 'Requested resubmission with better lighting conditions.',
          documentFrontKey: 'seed/demo-status-taxonomy/mentor-front.png',
          documentBackKey: 'seed/demo-status-taxonomy/mentor-back.png',
          selfieKey: 'seed/demo-status-taxonomy/mentor-selfie.png',
          addressLine1: '101 Coaching Lane',
          city: 'Lisbon',
          postalCode: '1050-004',
          country: 'PRT',
        },
      ];

      for (const seed of identityVerificationSeeds) {
        if (!identityStatuses.has(seed.status)) {
          continue;
        }
        const userId = userIds.get(seed.email);
        if (!userId) continue;
        const profileId = await ensureProfile(seed.email);
        if (!profileId) continue;
        const [existingVerification] = await queryInterface.sequelize.query(
          'SELECT id FROM identity_verifications WHERE userId = :userId AND status = :status LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId, status: seed.status },
          },
        );
        if (existingVerification?.id) {
          identityVerificationIdByEmail.set(seed.email, existingVerification.id);
          continue;
        }
        const userSeed = baseUsers.find((user) => user.email === seed.email) ?? {};
        const fullName = [userSeed.firstName, userSeed.lastName].filter(Boolean).join(' ').trim() || seed.email;
        const payload = {
          userId,
          profileId,
          status: seed.status,
          verificationProvider: seed.verificationProvider ?? 'manual_review',
          typeOfId: seed.typeOfId ?? 'government_id',
          idNumberLast4: seed.idNumberLast4 ?? '0000',
          issuingCountry: seed.issuingCountry ?? 'USA',
          issuedAt: seed.issuedAt ?? new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
          expiresAt: seed.expiresAt ?? new Date(now.getTime() + 18 * 30 * 24 * 60 * 60 * 1000),
          documentFrontKey: seed.documentFrontKey,
          documentBackKey: seed.documentBackKey ?? null,
          selfieKey: seed.selfieKey ?? null,
          fullName,
          dateOfBirth: seed.dateOfBirth ?? new Date('1990-05-12T00:00:00Z'),
          addressLine1: seed.addressLine1 ?? '123 Market Street',
          addressLine2: seed.addressLine2 ?? null,
          city: seed.city ?? 'Remote City',
          state: seed.state ?? null,
          postalCode: seed.postalCode ?? '00000',
          country: seed.country ?? 'USA',
          reviewNotes: seed.reviewNotes ?? null,
          declinedReason: seed.declinedReason ?? null,
          reviewerId: seed.status === 'verified' || seed.status === 'rejected' ? userIds.get('ava@gigvora.com') ?? null : null,
          submittedAt: seed.submittedAt ?? now,
          reviewedAt: seed.reviewedAt ?? null,
          metadata: { ...(seed.metadata ?? {}), seedTag: SEED_METADATA_TAG },
          createdAt: now,
          updatedAt: now,
        };
        await queryInterface.bulkInsert('identity_verifications', [payload], { transaction });
        const [insertedVerification] = await queryInterface.sequelize.query(
          'SELECT id FROM identity_verifications WHERE userId = :userId ORDER BY id DESC LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId },
          },
        );
        if (insertedVerification?.id) {
          identityVerificationIdByEmail.set(seed.email, insertedVerification.id);
        }
      }

      const identityEventSeeds = [
        {
          email: 'leo@gigvora.com',
          eventType: 'status_change',
          fromStatus: 'in_review',
          toStatus: 'verified',
          note: 'Seed taxonomy transition: verification approved.',
        },
        {
          email: 'mia@gigvora.com',
          eventType: 'document_request',
          fromStatus: 'submitted',
          toStatus: 'in_review',
          note: 'Seed taxonomy transition: additional incorporation proof requested.',
        },
      ];

      for (const eventSeed of identityEventSeeds) {
        const identityVerificationId = identityVerificationIdByEmail.get(eventSeed.email);
        if (!identityVerificationId) continue;
        const [existingEvent] = await queryInterface.sequelize.query(
          'SELECT id FROM identity_verification_events WHERE identityVerificationId = :identityVerificationId AND eventType = :eventType AND note = :note LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: {
              identityVerificationId,
              eventType: eventSeed.eventType,
              note: eventSeed.note,
            },
          },
        );
        if (existingEvent?.id) {
          continue;
        }
        await queryInterface.bulkInsert(
          'identity_verification_events',
          [
            {
              identityVerificationId,
              eventType: eventSeed.eventType,
              actorId: userIds.get('ava@gigvora.com') ?? null,
              actorRole: 'compliance_manager',
              fromStatus: eventSeed.fromStatus ?? null,
              toStatus: eventSeed.toStatus ?? null,
              note: eventSeed.note,
              metadata: { seedTag: SEED_METADATA_TAG },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const corporateVerificationSeeds = [
        {
          email: 'mia@gigvora.com',
          ownerType: 'company',
          status: 'verified',
          companyName: 'Lumen Analytics Holdings',
          registrationNumber: 'GB-4582913',
          registrationCountry: 'GBR',
          registeredAddressLine1: '45 Kingsway',
          registeredCity: 'London',
          registeredPostalCode: 'WC2B 6SR',
          registeredCountry: 'GBR',
          registrationDocumentKey: 'seed/demo-status-taxonomy-corp-verified.pdf',
          authorizationDocumentKey: 'seed/demo-status-taxonomy-corp-verified-auth.pdf',
          ownershipEvidenceKey: 'seed/demo-status-taxonomy-corp-verified-ownership.pdf',
          submittedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          reviewedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
          reviewNotes: 'Completed compliance onboarding for EU expansion.',
        },
        {
          email: 'mia@gigvora.com',
          ownerType: 'company',
          status: 'requires_update',
          companyName: 'Lumen Analytics EU',
          registrationNumber: 'DE-8291045',
          registrationCountry: 'DEU',
          registeredAddressLine1: 'Unter den Linden 24',
          registeredCity: 'Berlin',
          registeredPostalCode: '10117',
          registeredCountry: 'DEU',
          registrationDocumentKey: 'seed/demo-status-taxonomy-corp-update.pdf',
          authorizationDocumentKey: 'seed/demo-status-taxonomy-corp-update-auth.pdf',
          ownershipEvidenceKey: 'seed/demo-status-taxonomy-corp-update-ownership.pdf',
          submittedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          reviewNotes: 'Missing notary stamp on shareholder resolution.',
        },
        {
          email: 'noah@gigvora.com',
          ownerType: 'agency',
          status: 'suspended',
          companyName: 'Alliance Studio Collective',
          registrationNumber: 'US-5528391',
          registrationCountry: 'USA',
          registeredAddressLine1: '500 Market Street',
          registeredCity: 'San Francisco',
          registeredState: 'CA',
          registeredPostalCode: '94105',
          registeredCountry: 'USA',
          registrationDocumentKey: 'seed/demo-status-taxonomy-corp-suspended.pdf',
          authorizationDocumentKey: 'seed/demo-status-taxonomy-corp-suspended-auth.pdf',
          ownershipEvidenceKey: 'seed/demo-status-taxonomy-corp-suspended-ownership.pdf',
          submittedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
          reviewedAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
          declineReason: 'Outstanding sanctions screening requires remediation.',
        },
      ];

      for (const seed of corporateVerificationSeeds) {
        if (!corporateStatuses.has(seed.status)) {
          continue;
        }
        const userId = userIds.get(seed.email);
        if (!userId) continue;
        const companyProfileId = seed.ownerType === 'company' ? await findCompanyProfileId(seed.email) : null;
        const agencyProfileId = seed.ownerType === 'agency' ? await findAgencyProfileId(seed.email) : null;
        if (seed.ownerType === 'company' && !companyProfileId) {
          continue;
        }
        if (seed.ownerType === 'agency' && !agencyProfileId) {
          continue;
        }
        const [existingCorporate] = await queryInterface.sequelize.query(
          'SELECT id FROM corporate_verifications WHERE userId = :userId AND companyName = :companyName LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId, companyName: seed.companyName },
          },
        );
        if (existingCorporate?.id) {
          continue;
        }
        const payload = {
          ownerType: seed.ownerType,
          companyProfileId: companyProfileId ?? null,
          agencyProfileId: agencyProfileId ?? null,
          userId,
          status: seed.status,
          companyName: seed.companyName,
          registrationNumber: seed.registrationNumber ?? null,
          registrationCountry: seed.registrationCountry ?? null,
          registeredAddressLine1: seed.registeredAddressLine1 ?? null,
          registeredAddressLine2: seed.registeredAddressLine2 ?? null,
          registeredCity: seed.registeredCity ?? null,
          registeredState: seed.registeredState ?? null,
          registeredPostalCode: seed.registeredPostalCode ?? null,
          registeredCountry: seed.registeredCountry ?? null,
          registrationDocumentKey: seed.registrationDocumentKey,
          authorizationDocumentKey: seed.authorizationDocumentKey ?? null,
          ownershipEvidenceKey: seed.ownershipEvidenceKey ?? null,
          domesticComplianceAttestation: true,
          domesticComplianceNotes: seed.domesticComplianceNotes ?? null,
          authorizedRepresentativeName: seed.authorizedRepresentativeName ?? 'Jordan Patel',
          authorizedRepresentativeEmail: seed.authorizedRepresentativeEmail ?? 'compliance@gigvora.com',
          authorizedRepresentativeTitle: seed.authorizedRepresentativeTitle ?? 'Head of Compliance',
          authorizationExpiresAt: seed.authorizationExpiresAt ?? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
          submittedAt: seed.submittedAt ?? now,
          reviewedAt: seed.reviewedAt ?? null,
          reviewerId: userIds.get('ava@gigvora.com') ?? null,
          reviewNotes: seed.reviewNotes ?? null,
          declineReason: seed.declineReason ?? null,
          metadata: { seedTag: SEED_METADATA_TAG, ...(seed.metadata ?? {}) },
          createdAt: now,
          updatedAt: now,
        };
        await queryInterface.bulkInsert('corporate_verifications', [payload], { transaction });
      }

      const qualificationSeeds = [
        {
          email: 'leo@gigvora.com',
          status: 'verified',
          title: 'Certified Kubernetes Administrator',
          issuer: 'The Linux Foundation',
          sourceType: 'certificate',
          issuedAt: new Date('2023-02-10T00:00:00Z'),
          expiresAt: new Date('2025-02-10T00:00:00Z'),
          verificationNotes: 'Validated via issuer API.',
          documentKey: 'seed/demo-status-taxonomy-qualification-cka.pdf',
        },
        {
          email: 'leo@gigvora.com',
          status: 'pending_review',
          title: 'Offensive Security Certified Professional',
          issuer: 'Offensive Security',
          sourceType: 'certificate',
          issuedAt: new Date('2024-07-15T00:00:00Z'),
          verificationNotes: 'Awaiting verification from issuing body.',
          documentKey: 'seed/demo-status-taxonomy-qualification-oscp.pdf',
        },
        {
          email: 'mia@gigvora.com',
          status: 'rejected',
          title: 'ISO 27001 Lead Auditor',
          issuer: 'Global Compliance Institute',
          sourceType: 'certificate',
          issuedAt: new Date('2022-05-01T00:00:00Z'),
          expiresAt: new Date('2025-05-01T00:00:00Z'),
          verificationNotes: 'Submitted certificate had expired at time of review.',
          documentKey: 'seed/demo-status-taxonomy-qualification-iso27001.pdf',
        },
      ];

      for (const seed of qualificationSeeds) {
        if (!qualificationStatuses.has(seed.status)) {
          continue;
        }
        const userId = userIds.get(seed.email);
        if (!userId) continue;
        const profileId = await ensureProfile(seed.email);
        if (!profileId) continue;
        const [existingCredential] = await queryInterface.sequelize.query(
          'SELECT id FROM qualification_credentials WHERE userId = :userId AND title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId, title: seed.title },
          },
        );
        if (existingCredential?.id) {
          continue;
        }
        const payload = {
          userId,
          profileId,
          sourceType: seed.sourceType ?? 'certificate',
          title: seed.title,
          issuer: seed.issuer ?? null,
          issuedAt: seed.issuedAt ?? null,
          expiresAt: seed.expiresAt ?? null,
          status: seed.status,
          verificationNotes: seed.verificationNotes ?? null,
          documentKey: seed.documentKey,
          evidenceMetadata: { seedTag: SEED_METADATA_TAG },
          lastReviewedAt: seed.status === 'verified' ? now : null,
          reviewerId: seed.status === 'verified' ? userIds.get('ava@gigvora.com') ?? null : null,
          createdAt: now,
          updatedAt: now,
        };
        await queryInterface.bulkInsert('qualification_credentials', [payload], { transaction });
      }

      const walletAccountIdsByEmail = new Map();
      const walletAccountSeeds = [
        {
          email: 'leo@gigvora.com',
          status: 'active',
          accountType: 'freelancer',
          custodyProvider: 'stripe',
          displayName: 'Leo Freelancer Wallet',
          providerAccountId: 'seed-demo-status-taxonomy-leo',
          currencyCode: 'GBP',
          currentBalance: 4200.5,
          availableBalance: 3100.75,
          pendingHoldBalance: 350.0,
          metadata: { riskTier: 'low' },
        },
        {
          email: 'mia@gigvora.com',
          status: 'suspended',
          accountType: 'company',
          custodyProvider: 'escrow_com',
          displayName: 'Lumen Analytics Treasury',
          providerAccountId: 'seed-demo-status-taxonomy-mia',
          currencyCode: 'EUR',
          currentBalance: 12500.25,
          availableBalance: 4800.0,
          pendingHoldBalance: 5200.0,
          metadata: { riskTier: 'medium', reviewReason: 'Enhanced due diligence' },
        },
        {
          email: 'ava@gigvora.com',
          status: 'pending',
          accountType: 'user',
          custodyProvider: 'stripe',
          displayName: 'Ava Founder Wallet',
          providerAccountId: 'seed-demo-status-taxonomy-ava',
          currencyCode: 'USD',
          currentBalance: 0,
          availableBalance: 0,
          pendingHoldBalance: 0,
          metadata: { onboardingStep: 'documents', riskTier: 'low' },
        },
        {
          email: 'noah@gigvora.com',
          status: 'closed',
          accountType: 'agency',
          custodyProvider: 'stripe',
          displayName: 'Alliance Studio Escrow',
          providerAccountId: 'seed-demo-status-taxonomy-noah',
          currencyCode: 'USD',
          currentBalance: 0,
          availableBalance: 0,
          pendingHoldBalance: 0,
          metadata: { closedReason: 'Customer request' },
        },
      ];

      for (const seed of walletAccountSeeds) {
        if (!walletAccountStatuses.has(seed.status)) {
          continue;
        }
        const userId = userIds.get(seed.email);
        if (!userId) continue;
        const profileId = await ensureProfile(seed.email);
        if (!profileId) continue;
        const [existingAccount] = await queryInterface.sequelize.query(
          'SELECT id FROM wallet_accounts WHERE providerAccountId = :providerAccountId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { providerAccountId: seed.providerAccountId },
          },
        );
        if (existingAccount?.id) {
          walletAccountIdsByEmail.set(seed.email, existingAccount.id);
          continue;
        }
        const payload = {
          userId,
          profileId,
          workspaceId: null,
          displayName: seed.displayName ?? null,
          accountType: seed.accountType ?? 'user',
          custodyProvider: seed.custodyProvider ?? 'stripe',
          providerAccountId: seed.providerAccountId,
          status: seed.status,
          currencyCode: seed.currencyCode ?? 'USD',
          currentBalance: seed.currentBalance ?? 0,
          availableBalance: seed.availableBalance ?? 0,
          pendingHoldBalance: seed.pendingHoldBalance ?? 0,
          lastReconciledAt: seed.lastReconciledAt ?? now,
          metadata: { ...(seed.metadata ?? {}), seedTag: SEED_METADATA_TAG },
          createdAt: now,
          updatedAt: now,
        };
        await queryInterface.bulkInsert('wallet_accounts', [payload], { transaction });
        const [insertedAccount] = await queryInterface.sequelize.query(
          'SELECT id FROM wallet_accounts WHERE providerAccountId = :providerAccountId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { providerAccountId: seed.providerAccountId },
          },
        );
        if (insertedAccount?.id) {
          walletAccountIdsByEmail.set(seed.email, insertedAccount.id);
        }
      }

      const walletLedgerSeeds = [
        {
          accountEmail: 'leo@gigvora.com',
          entryType: 'credit',
          amount: 2500,
          currencyCode: 'GBP',
          reference: 'DEMO-TAXONOMY-CREDIT-001',
          description: 'Milestone payment released',
          balanceAfter: 4200.5,
          metadata: { relatedInvoice: 'INV-8832' },
          occurredAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          accountEmail: 'leo@gigvora.com',
          entryType: 'hold',
          amount: 600,
          currencyCode: 'GBP',
          reference: 'DEMO-TAXONOMY-HOLD-001',
          description: 'Dispute hold initiated',
          balanceAfter: 3600.5,
          metadata: { disputeId: 'DSP-2015' },
          occurredAt: new Date(now.getTime() - 36 * 60 * 60 * 1000),
        },
        {
          accountEmail: 'mia@gigvora.com',
          entryType: 'debit',
          amount: 1800,
          currencyCode: 'EUR',
          reference: 'DEMO-TAXONOMY-DEBIT-001',
          description: 'Campaign budget settlement',
          balanceAfter: 4700.25,
          metadata: { campaignId: 'AD-552' },
          occurredAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          accountEmail: 'mia@gigvora.com',
          entryType: 'release',
          amount: 600,
          currencyCode: 'EUR',
          reference: 'DEMO-TAXONOMY-RELEASE-001',
          description: 'Hold released after compliance review',
          balanceAfter: 5300.25,
          metadata: { releasedHold: 'DEMO-TAXONOMY-HOLD-001' },
          occurredAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          accountEmail: 'ava@gigvora.com',
          entryType: 'adjustment',
          amount: 0,
          currencyCode: 'USD',
          reference: 'DEMO-TAXONOMY-ADJUSTMENT-001',
          description: 'Initial account provisioning entry',
          balanceAfter: 0,
          metadata: { adjustmentType: 'provisioning' },
          occurredAt: now,
        },
      ];

      for (const ledger of walletLedgerSeeds) {
        if (!walletLedgerTypes.has(ledger.entryType)) {
          continue;
        }
        const walletAccountId = walletAccountIdsByEmail.get(ledger.accountEmail);
        if (!walletAccountId) continue;
        const [existingLedger] = await queryInterface.sequelize.query(
          'SELECT id FROM wallet_ledger_entries WHERE walletAccountId = :walletAccountId AND reference = :reference LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { walletAccountId, reference: ledger.reference },
          },
        );
        if (existingLedger?.id) {
          continue;
        }
        const payload = {
          walletAccountId,
          entryType: ledger.entryType,
          amount: ledger.amount,
          currencyCode: ledger.currencyCode ?? 'USD',
          reference: ledger.reference,
          externalReference: ledger.externalReference ?? null,
          description: ledger.description ?? null,
          initiatedById: ledger.initiatedById ?? userIds.get('ava@gigvora.com') ?? null,
          occurredAt: ledger.occurredAt ?? now,
          balanceAfter: ledger.balanceAfter ?? ledger.amount,
          metadata: { ...(ledger.metadata ?? {}), seedTag: SEED_METADATA_TAG },
          createdAt: now,
          updatedAt: now,
        };
        await queryInterface.bulkInsert('wallet_ledger_entries', [payload], { transaction });
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

      await queryInterface.bulkDelete(
        'identity_verification_events',
        { note: { [Op.like]: 'Seed taxonomy transition:%' } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'identity_verifications',
        { documentFrontKey: { [Op.like]: 'seed/demo-status-taxonomy/%' } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'corporate_verifications',
        { registrationDocumentKey: { [Op.like]: 'seed/demo-status-taxonomy-corp-%' } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'qualification_credentials',
        { documentKey: { [Op.like]: 'seed/demo-status-taxonomy-qualification-%' } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'wallet_ledger_entries',
        { reference: { [Op.like]: 'DEMO-TAXONOMY-%' } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'wallet_accounts',
        { providerAccountId: { [Op.like]: 'seed-demo-status-taxonomy-%' } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'profiles',
        { bio: SEED_PROFILE_BIO },
        { transaction },
      );

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
