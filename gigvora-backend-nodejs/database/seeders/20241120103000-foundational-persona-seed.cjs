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

        const [existingOverview] = await queryInterface.sequelize.query(
          'SELECT id FROM freelancer_dashboard_overviews WHERE freelancerId = :freelancerId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { freelancerId },
          },
        );

        const workstreams = [
          {
            id: 'ws-orbital-design-system',
            label: 'Orbital Robotics design system',
            status: 'In QA',
            dueDateLabel: 'handoff Friday',
            tone: 'blue',
            link: 'https://workspace.gigvora.com/projects/orbital-robodx',
          },
          {
            id: 'ws-roi-diagnostics',
            label: 'ROI diagnostics dashboard',
            status: 'Client review',
            dueDateLabel: 'due in 3 days',
            tone: 'emerald',
            link: 'https://workspace.gigvora.com/projects/orbital-analytics',
          },
        ];

        const upcomingSchedule = [
          {
            id: 'sched-weekly-ops-sync',
            label: 'Weekly ops sync',
            type: 'Meeting',
            tone: 'slate',
            startsAt: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
            link: 'https://meet.gigvora.com/ops-sync',
          },
          {
            id: 'sched-lab-demo',
            label: 'Robotics lab demo',
            type: 'Client update',
            tone: 'blue',
            startsAt: new Date(Date.now() + 1000 * 60 * 60 * 30).toISOString(),
            link: 'https://meet.gigvora.com/lab-demo',
          },
        ];

        const highlights = [
          {
            id: 'highlight-design-system',
            title: 'Launched robotics control design system',
            summary: 'Unified interactions across five product lines and accelerated onboarding by 34%.',
            type: 'update',
            mediaUrl: 'https://cdn.gigvora.com/demo/freelancers/jonah/design-system.jpg',
            ctaLabel: 'View case study',
            ctaUrl: 'https://demo.gigvora.com/case-studies/orbital-robotics',
            publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
          },
          {
            id: 'highlight-automation-audit',
            title: 'Automation audit unlocked 12% margin',
            summary: 'Paired service operations telemetry with design audits to remove redundant vendor spend.',
            type: 'article',
            mediaUrl: 'https://cdn.gigvora.com/demo/freelancers/jonah/automation-audit.png',
            ctaLabel: 'Read audit summary',
            ctaUrl: 'https://demo.gigvora.com/insights/automation-audit',
            publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
          },
        ];

        const overviewPayload = {
          headline: 'Principal Product Designer & Systems Architect',
          summary: 'Designs inclusive product experiences and operationalizes design systems for venture-backed teams.',
          avatarUrl: 'https://cdn.gigvora.com/demo/freelancers/jonah/avatar.png',
          followerCount: 2680,
          followerGoal: 3000,
          trustScore: 87.4,
          trustScoreChange: 4.2,
          rating: 4.9,
          ratingCount: 46,
          workstreams,
          relationshipHealth: {
            retentionScore: 92,
            retentionStatus: 'Thriving',
            advocacyInProgress: 5,
            retentionNotes: 'Core robotics client renewed for FY25.',
            advocacyNotes: 'Two client champions preparing referrals.',
          },
          upcomingSchedule,
          highlights,
          weatherLocation: 'San Diego, USA',
          weatherLatitude: 32.7157,
          weatherLongitude: -117.1611,
          weatherUnits: 'imperial',
          metadata: { timezone: 'America/Los_Angeles', currency: 'USD' },
          updatedAt: now,
        };

        if (!existingOverview?.id) {
          await queryInterface.bulkInsert(
            'freelancer_dashboard_overviews',
            [
              {
                freelancerId,
                createdAt: now,
                ...overviewPayload,
              },
            ],
            { transaction },
          );
        } else {
          await queryInterface.bulkUpdate(
            'freelancer_dashboard_overviews',
            overviewPayload,
            { freelancerId },
            { transaction },
          );
        }

        await queryInterface.bulkDelete(
          'freelancer_operations_memberships',
          { freelancerId },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'freelancer_operations_workflows',
          { freelancerId },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'freelancer_operations_notices',
          { freelancerId },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'freelancer_operations_snapshots',
          { freelancerId },
          { transaction },
        );

        await queryInterface.bulkInsert(
          'freelancer_operations_memberships',
          [
            {
              freelancerId,
              slug: 'ops-core',
              name: 'Operations core',
              status: 'active',
              role: 'Operations lead',
              description: 'Full access to finance, compliance, and delivery orchestration.',
              requestedAt: now,
              activatedAt: now,
              lastReviewedAt: now,
              metadata: { onboardingCompleted: true },
              createdAt: now,
              updatedAt: now,
            },
            {
              freelancerId,
              slug: 'ops-compliance',
              name: 'Compliance guild',
              status: 'invited',
              role: 'Contributor',
              description: 'Collaborate on due diligence packs and document controls.',
              requestedAt: now,
              metadata: { steward: 'Lara Nguyen' },
              createdAt: now,
              updatedAt: now,
            },
            {
              freelancerId,
              slug: 'ops-growth-network',
              name: 'Growth network',
              status: 'available',
              role: null,
              description: 'Access co-selling pods, referrals, and partner briefs.',
              requestedAt: null,
              metadata: { seatsRemaining: 12 },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );

        await queryInterface.bulkInsert(
          'freelancer_operations_workflows',
          [
            {
              freelancerId,
              slug: 'gig-onboarding',
              title: 'Gig onboarding orchestration',
              status: 'tracking',
              completion: 72,
              dueAt: new Date(Date.now() + 1000 * 60 * 60 * 48),
              blockers: ['Awaiting signed SOW from procurement'],
              metadata: { owner: 'Operations core' },
              createdAt: now,
              updatedAt: now,
            },
            {
              freelancerId,
              slug: 'reg-audit-pack',
              title: 'Regulatory audit readiness pack',
              status: 'at-risk',
              completion: 38,
              dueAt: new Date(Date.now() + 1000 * 60 * 60 * 72),
              blockers: ['Need updated ID documents'],
              metadata: { severity: 'high' },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );

        await queryInterface.bulkInsert(
          'freelancer_operations_notices',
          [
            {
              freelancerId,
              slug: 'notice-kyc',
              tone: 'warning',
              title: 'Verify client KYC',
              message: 'Upload a verified address document to keep payouts uninterrupted.',
              acknowledged: false,
              acknowledgedAt: null,
              expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
              metadata: { category: 'compliance' },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );

        await queryInterface.bulkInsert(
          'freelancer_operations_snapshots',
          [
            {
              freelancerId,
              activeWorkflows: 3,
              escalations: 1,
              automationCoverage: 64,
              complianceScore: 92,
              outstandingTasks: 2,
              recentApprovals: 5,
              nextReviewAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
              lastSyncedAt: now,
              currency: 'USD',
              metadata: { syncSource: 'seed' },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
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
        await queryInterface.bulkDelete('freelancer_operations_snapshots', { freelancerId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('freelancer_operations_notices', { freelancerId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('freelancer_operations_workflows', { freelancerId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('freelancer_operations_memberships', { freelancerId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('freelancer_dashboard_overviews', { freelancerId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('freelancer_profiles', { userId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('agency_profiles', { userId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('company_profiles', { userId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('profiles', { userId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('users', { id: { [Op.in]: userIds } }, { transaction });
      }
    });
  },
};
