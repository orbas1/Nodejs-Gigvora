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

      const securityPreferenceSeeds = [
        {
          email: 'lara.ops.demo@gigvora.com',
          sessionTimeoutMinutes: 45,
          biometricApprovalsEnabled: true,
          deviceApprovalsEnabled: true,
        },
        {
          email: 'jonah.freelancer.demo@gigvora.com',
          sessionTimeoutMinutes: 30,
          biometricApprovalsEnabled: false,
          deviceApprovalsEnabled: true,
        },
      ];

      for (const seed of securityPreferenceSeeds) {
        const userId = userIds.get(seed.email);
        if (!userId) continue;

        const [existingSecurity] = await queryInterface.sequelize.query(
          'SELECT id FROM user_security_preferences WHERE userId = :userId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId },
          },
        );

        if (!existingSecurity?.id) {
          await queryInterface.bulkInsert(
            'user_security_preferences',
            [
              {
                userId,
                sessionTimeoutMinutes: seed.sessionTimeoutMinutes,
                biometricApprovalsEnabled: seed.biometricApprovalsEnabled,
                deviceApprovalsEnabled: seed.deviceApprovalsEnabled,
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }
      }

      const dataExportSeeds = [
        {
          email: 'lara.ops.demo@gigvora.com',
          status: 'ready',
          format: 'zip',
          type: 'account_archive',
          requestedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3),
          completedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
          downloadUrl: 'https://downloads.demo.gigvora.com/exports/lara-ops.zip',
        },
        {
          email: 'jonah.freelancer.demo@gigvora.com',
          status: 'processing',
          format: 'json',
          type: 'communications',
          requestedAt: new Date(now.getTime() - 1000 * 60 * 45),
          completedAt: null,
          downloadUrl: null,
        },
      ];

      for (const seed of dataExportSeeds) {
        const userId = userIds.get(seed.email);
        if (!userId) continue;

        const [existingExport] = await queryInterface.sequelize.query(
          'SELECT id FROM data_export_requests WHERE userId = :userId AND type = :type LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId, type: seed.type },
          },
        );

        if (!existingExport?.id) {
          await queryInterface.bulkInsert(
            'data_export_requests',
            [
              {
                userId,
                status: seed.status,
                format: seed.format,
                type: seed.type,
                requestedAt: seed.requestedAt,
                completedAt: seed.completedAt,
                downloadUrl: seed.downloadUrl,
                expiresAt: seed.completedAt
                  ? new Date(seed.completedAt.getTime() + 1000 * 60 * 60 * 24 * 7)
                  : null,
                notes: seed.status === 'processing' ? 'Compiling workspace messages and invoices.' : null,
                metadata: { priority: 'standard', seeded: true },
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }
      }

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
