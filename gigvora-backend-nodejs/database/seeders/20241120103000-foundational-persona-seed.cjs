'use strict';

const { QueryTypes, Op } = require('sequelize');
const { randomUUID } = require('crypto');

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

const feedPostTitle = 'Ops weekly snapshot';
const feedPostSummary = 'Runtime health is green and our hiring backlog is cleared.';
const feedPostContent = '[demo] Ops weekly: runtime health is green and hiring backlog cleared.';
const feedPostLink = 'https://ops.gigvora.test/weekly-briefing';

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

        const jobSeeds = [
          {
            key: 'foundational-persona-jonah-job-flowpilot',
            title: 'Principal Product Designer - Automation OS',
            description:
              '[seed-foundational-persona] Flowpilot Robotics automation OS modernization lead opportunity.',
            location: 'Remote - North America',
            employmentType: 'contract',
          },
          {
            key: 'foundational-persona-jonah-job-atlas',
            title: 'Product Design Lead - Strategic Initiatives',
            description:
              '[seed-foundational-persona] Atlas Cloud Services strategic initiatives design leadership role.',
            location: 'New York, USA (Hybrid)',
            employmentType: 'full_time',
          },
          {
            key: 'foundational-persona-jonah-job-europa',
            title: 'Design Systems Consultant - EMEA Expansion',
            description:
              '[seed-foundational-persona] Europa Mobility design systems consultant retained search.',
            location: 'Berlin, Germany',
            employmentType: 'contract',
          },
        ];

        const jobIdByKey = new Map();
        for (const jobSeed of jobSeeds) {
          const [existingJob] = await queryInterface.sequelize.query(
            "SELECT id FROM jobs WHERE title = :title AND COALESCE(location, '') = COALESCE(:locationNormalized, '') LIMIT 1",
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: {
                title: jobSeed.title,
                locationNormalized: jobSeed.location ?? '',
              },
            },
          );

          let jobId = existingJob?.id ?? null;
          if (!jobId) {
            await queryInterface.bulkInsert(
              'jobs',
              [
                {
                  title: jobSeed.title,
                  description: jobSeed.description,
                  location: jobSeed.location ?? null,
                  employmentType: jobSeed.employmentType,
                  createdAt: now,
                  updatedAt: now,
                },
              ],
              { transaction },
            );

            const [createdJob] = await queryInterface.sequelize.query(
              "SELECT id FROM jobs WHERE title = :title AND COALESCE(location, '') = COALESCE(:locationNormalized, '') ORDER BY id DESC LIMIT 1",
              {
                type: QueryTypes.SELECT,
                transaction,
                replacements: {
                  title: jobSeed.title,
                  locationNormalized: jobSeed.location ?? '',
                },
              },
            );
            jobId = createdJob?.id ?? null;
          }

          if (jobId) {
            jobIdByKey.set(jobSeed.key, jobId);
          }
        }

        const applicationSeeds = [
          {
            seedKey: 'foundational-persona-jonah-application-flowpilot',
            jobKey: 'foundational-persona-jonah-job-flowpilot',
            status: 'interview',
            sourceChannel: 'web',
            submittedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 12),
            rateExpectation: 150,
            currencyCode: 'USD',
            jobTitle: 'Principal Product Designer',
            companyName: 'Flowpilot Robotics',
            location: 'Remote - North America',
            jobUrl: 'https://flowpilot.example/jobs/principal-product-designer',
            salary: { min: 150000, max: 185000, currency: 'USD' },
            notes:
              'Panel interview next. Prepare automation OS case study recap and collaboration references.',
            tags: ['Robotics', 'Systems Design', 'Automation'],
            source: 'referral',
          },
          {
            seedKey: 'foundational-persona-jonah-application-atlas',
            jobKey: 'foundational-persona-jonah-job-atlas',
            status: 'shortlisted',
            sourceChannel: 'web',
            submittedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7),
            rateExpectation: 0,
            currencyCode: 'USD',
            jobTitle: 'Product Design Lead',
            companyName: 'Atlas Cloud Services',
            location: 'New York, USA (Hybrid)',
            jobUrl: 'https://atlascloud.example/careers/design-lead',
            salary: { min: 0, max: 0, currency: 'USD' },
            notes:
              'Submitted portfolio and async product strategy prompt; awaiting calibration with hiring VP.',
            tags: ['SaaS', 'AI Collaboration', 'Leadership'],
            source: 'web',
          },
        ];

        const applicationIdBySeedKey = new Map();
        for (const seed of applicationSeeds) {
          const jobId = jobIdByKey.get(seed.jobKey);
          if (!jobId) continue;

          const [existingApplication] = await queryInterface.sequelize.query(
            'SELECT id FROM applications WHERE applicantId = :applicantId AND metadata->>:seedKey = :seed LIMIT 1',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: {
                applicantId: freelancerId,
                seedKey: 'seedKey',
                seed: seed.seedKey,
              },
            },
          );

          let applicationId = existingApplication?.id ?? null;
          if (!applicationId) {
            await queryInterface.bulkInsert(
              'applications',
              [
                {
                  applicantId: freelancerId,
                  targetType: 'job',
                  targetId: jobId,
                  status: seed.status,
                  sourceChannel: seed.sourceChannel,
                  coverLetter: null,
                  attachments: null,
                  rateExpectation: seed.rateExpectation || null,
                  currencyCode: seed.currencyCode,
                  availabilityDate: null,
                  isArchived: false,
                  submittedAt: seed.submittedAt,
                  decisionAt: null,
                  metadata: {
                    seedKey: seed.seedKey,
                    jobTitle: seed.jobTitle,
                    companyName: seed.companyName,
                    location: seed.location,
                    jobUrl: seed.jobUrl,
                    salary: seed.salary,
                    notes: seed.notes,
                    source: seed.source,
                    tags: seed.tags,
                    jobRecordCreatedByUser: false,
                    jobRecordId: jobId,
                  },
                  createdAt: now,
                  updatedAt: now,
                },
              ],
              { transaction },
            );

            const [createdApplication] = await queryInterface.sequelize.query(
              'SELECT id FROM applications WHERE applicantId = :applicantId AND metadata->>:seedKey = :seed ORDER BY id DESC LIMIT 1',
              {
                type: QueryTypes.SELECT,
                transaction,
                replacements: {
                  applicantId: freelancerId,
                  seedKey: 'seedKey',
                  seed: seed.seedKey,
                },
              },
            );
            applicationId = createdApplication?.id ?? null;
          }

          if (applicationId) {
            applicationIdBySeedKey.set(seed.seedKey, applicationId);
          }
        }

        const favouriteSeeds = [
          {
            seedKey: 'foundational-persona-jonah-favourite-europa',
            jobKey: 'foundational-persona-jonah-job-europa',
            title: 'Design Systems Consultant - EMEA Expansion',
            companyName: 'Europa Mobility',
            location: 'Berlin, Germany',
            priority: 'warm',
            tags: ['Mobility', 'Design Systems'],
            salaryMin: 110000,
            salaryMax: 0,
            currencyCode: 'EUR',
            sourceUrl: 'https://europa.example/design-systems-consultant',
            notes: 'EMEA launch support, bilingual English/German preferred.',
            savedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
          },
          {
            seedKey: 'foundational-persona-jonah-favourite-luminary',
            jobKey: null,
            title: 'Head of Product Design - Automation Guild',
            companyName: 'Luminary Automation Collective',
            location: 'Remote - Global',
            priority: 'hot',
            tags: ['Automation', 'Leadership', 'Collective'],
            salaryMin: 0,
            salaryMax: 0,
            currencyCode: 'USD',
            sourceUrl: 'https://automationcollective.example/opportunities/head-of-design',
            notes: 'Collective leadership opportunity with revenue share potential.',
            savedAt: new Date(now.getTime() - 1000 * 60 * 60 * 10),
          },
        ];

        for (const favourite of favouriteSeeds) {
          const jobId = favourite.jobKey ? jobIdByKey.get(favourite.jobKey) ?? null : null;

          const [existingFavourite] = await queryInterface.sequelize.query(
            'SELECT id FROM job_application_favourites WHERE userId = :userId AND metadata->>:seedKey = :seed LIMIT 1',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: {
                userId: freelancerId,
                seedKey: 'seedKey',
                seed: favourite.seedKey,
              },
            },
          );

          if (!existingFavourite?.id) {
            await queryInterface.bulkInsert(
              'job_application_favourites',
              [
                {
                  userId: freelancerId,
                  jobId,
                  title: favourite.title,
                  companyName: favourite.companyName,
                  location: favourite.location,
                  priority: favourite.priority,
                  tags: favourite.tags,
                  salaryMin: favourite.salaryMin || null,
                  salaryMax: favourite.salaryMax || null,
                  currencyCode: favourite.currencyCode,
                  sourceUrl: favourite.sourceUrl,
                  notes: favourite.notes,
                  savedAt: favourite.savedAt,
                  metadata: {
                    seedKey: favourite.seedKey,
                    source: 'foundational-persona-demo',
                  },
                  createdAt: now,
                  updatedAt: now,
                },
              ],
              { transaction },
            );
          }
        }

        const interviewSeeds = [
          {
            seedKey: 'foundational-persona-jonah-interview-flowpilot-panel',
            applicationSeedKey: 'foundational-persona-jonah-application-flowpilot',
            scheduledAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2),
            timezone: 'America/Los_Angeles',
            durationMinutes: 75,
            type: 'video',
            status: 'scheduled',
            location: 'Virtual',
            meetingLink: 'https://meet.flowpilot.example/final-panel',
            interviewerName: 'Allison Reyes',
            interviewerEmail: 'areyes@flowpilot.example',
            feedbackScore: null,
            notes: 'Final panel with CTO, operations, and design leadership.',
            metadata: {
              seedKey: 'foundational-persona-jonah-interview-flowpilot-panel',
              prepChecklist: ['Review automation OS metrics', 'Update systems thinking storyboard'],
            },
          },
          {
            seedKey: 'foundational-persona-jonah-interview-flowpilot-portfolio',
            applicationSeedKey: 'foundational-persona-jonah-application-flowpilot',
            scheduledAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3),
            timezone: 'America/Los_Angeles',
            durationMinutes: 60,
            type: 'video',
            status: 'completed',
            location: 'Virtual',
            meetingLink: 'https://meet.flowpilot.example/portfolio',
            interviewerName: 'Priya Menon',
            interviewerEmail: 'pmenon@flowpilot.example',
            feedbackScore: 4.6,
            notes: 'Portfolio deep dive covering automation dashboards and design systems.',
            metadata: {
              seedKey: 'foundational-persona-jonah-interview-flowpilot-portfolio',
              summary: 'Strong systems thinking, follow up with technical architect.',
            },
          },
          {
            seedKey: 'foundational-persona-jonah-interview-atlas-sync',
            applicationSeedKey: 'foundational-persona-jonah-application-atlas',
            scheduledAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 4),
            timezone: 'America/New_York',
            durationMinutes: 45,
            type: 'video',
            status: 'scheduled',
            location: 'Virtual',
            meetingLink: 'https://meet.atlascloud.example/leadership-sync',
            interviewerName: 'Miguel Alvarez',
            interviewerEmail: 'malvarez@atlascloud.example',
            feedbackScore: null,
            notes: 'Leadership sync to discuss AI collaboration roadmap.',
            metadata: {
              seedKey: 'foundational-persona-jonah-interview-atlas-sync',
              prepChecklist: ['Gather AI collaboration case studies', 'Highlight remote leadership wins'],
            },
          },
        ];

        for (const interview of interviewSeeds) {
          const applicationId = applicationIdBySeedKey.get(interview.applicationSeedKey);
          if (!applicationId) continue;

          const [existingInterview] = await queryInterface.sequelize.query(
            'SELECT id FROM job_application_interviews WHERE userId = :userId AND metadata->>:seedKey = :seed LIMIT 1',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: {
                userId: freelancerId,
                seedKey: 'seedKey',
                seed: interview.seedKey,
              },
            },
          );

          if (!existingInterview?.id) {
            await queryInterface.bulkInsert(
              'job_application_interviews',
              [
                {
                  userId: freelancerId,
                  applicationId,
                  scheduledAt: interview.scheduledAt,
                  timezone: interview.timezone,
                  durationMinutes: interview.durationMinutes,
                  type: interview.type,
                  status: interview.status,
                  location: interview.location,
                  meetingLink: interview.meetingLink,
                  interviewerName: interview.interviewerName,
                  interviewerEmail: interview.interviewerEmail,
                  feedbackScore: interview.feedbackScore,
                  notes: interview.notes,
                  metadata: interview.metadata,
                  createdAt: now,
                  updatedAt: now,
                },
              ],
              { transaction },
            );
          }
        }

        const responseSeeds = [
          {
            seedKey: 'foundational-persona-jonah-response-flowpilot-followup',
            applicationSeedKey: 'foundational-persona-jonah-application-flowpilot',
            direction: 'incoming',
            channel: 'email',
            status: 'acknowledged',
            subject: 'Flowpilot interview follow-up',
            body:
              'Thanks for the automation OS walkthrough—looking forward to the panel. Sharing prep docs shortly.',
            sentAt: new Date(now.getTime() - 1000 * 60 * 60 * 12),
            followUpRequiredAt: new Date(now.getTime() + 1000 * 60 * 60 * 24),
            metadata: {
              seedKey: 'foundational-persona-jonah-response-flowpilot-followup',
              notes: 'Draft panel prep recap and send updated automation dashboards.',
            },
          },
          {
            seedKey: 'foundational-persona-jonah-response-atlas-portfolio',
            applicationSeedKey: 'foundational-persona-jonah-application-atlas',
            direction: 'outgoing',
            channel: 'portal',
            status: 'sent',
            subject: 'Portfolio case study submission',
            body:
              'Uploaded async strategy brief and linked the multi-brand design system artifacts for review.',
            sentAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 4),
            followUpRequiredAt: null,
            metadata: {
              seedKey: 'foundational-persona-jonah-response-atlas-portfolio',
              notes: 'Set reminder to check portal messages after leadership sync.',
            },
          },
        ];

        for (const response of responseSeeds) {
          const applicationId = applicationIdBySeedKey.get(response.applicationSeedKey);
          if (!applicationId) continue;

          const [existingResponse] = await queryInterface.sequelize.query(
            'SELECT id FROM job_application_responses WHERE userId = :userId AND metadata->>:seedKey = :seed LIMIT 1',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: {
                userId: freelancerId,
                seedKey: 'seedKey',
                seed: response.seedKey,
              },
            },
          );

          if (!existingResponse?.id) {
            await queryInterface.bulkInsert(
              'job_application_responses',
              [
                {
                  userId: freelancerId,
                  applicationId,
                  direction: response.direction,
                  channel: response.channel,
                  status: response.status,
                  subject: response.subject,
                  body: response.body,
                  sentAt: response.sentAt,
                  followUpRequiredAt: response.followUpRequiredAt,
                  metadata: response.metadata,
                  createdAt: now,
                  updatedAt: now,
                },
              ],
              { transaction },
            );
          }
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
        const adminSeed = userSeeds.find((seed) => seed.email === 'lara.ops.demo@gigvora.com') ?? {};
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
                title: feedPostTitle,
                summary: feedPostSummary,
                content: feedPostContent,
                visibility: 'public',
                type: 'update',
                link: feedPostLink,
                mediaAttachments: [
                  {
                    id: 'ops-weekly-briefing',
                    url: 'https://assets.gigvora.test/ops/weekly-briefing.png',
                    type: 'image',
                    alt: 'Operations weekly metrics snapshot',
                  },
                ],
                authorName:
                  [adminSeed.firstName, adminSeed.lastName].filter(Boolean).join(' ').trim() || adminSeed.email ||
                  'Gigvora Ops',
                authorHeadline: 'Director of Operations · Gigvora',
                authorAvatarSeed: adminSeed.firstName || 'operations-team',
                publishedAt: now,
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }
      }

      if (adminUserId) {
        const [profileRow] = await queryInterface.sequelize.query(
          'SELECT id FROM profiles WHERE userId = :userId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId: adminUserId },
          },
        );

        if (profileRow?.id) {
          const workspaceSlug = 'atlas-collective-ops';
          const [workspaceRow] = await queryInterface.sequelize.query(
            'SELECT id FROM provider_workspaces WHERE slug = :slug LIMIT 1',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: { slug: workspaceSlug },
            },
          );

          let workspaceId = workspaceRow?.id ?? null;
          if (!workspaceId) {
            await queryInterface.bulkInsert(
              'provider_workspaces',
              [
                {
                  ownerId: adminUserId,
                  name: 'Atlas Collective Ops',
                  slug: workspaceSlug,
                  type: 'agency',
                  timezone: 'UTC',
                  defaultCurrency: 'USD',
                  intakeEmail: 'treasury@atlas-collective.demo',
                  isActive: true,
                  settings: JSON.stringify({ focus: 'agency-operations' }),
                  createdAt: now,
                  updatedAt: now,
                },
              ],
              { transaction },
            );

            const [createdWorkspace] = await queryInterface.sequelize.query(
              'SELECT id FROM provider_workspaces WHERE slug = :slug LIMIT 1',
              {
                type: QueryTypes.SELECT,
                transaction,
                replacements: { slug: workspaceSlug },
              },
            );
            workspaceId = createdWorkspace?.id ?? workspaceId;
          }

          const treasuryBalance = 48250.75;
          const availableBalance = 46300.5;
          const pendingBalance = Number((treasuryBalance - availableBalance).toFixed(2));
          const reconciliationAt = new Date(now.getTime() - 1000 * 60 * 60 * 6);

          const [existingWallet] = await queryInterface.sequelize.query(
            'SELECT id FROM wallet_accounts WHERE userId = :userId AND accountType = :accountType LIMIT 1',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: { userId: adminUserId, accountType: 'user' },
            },
          );

          let walletAccountId = existingWallet?.id ?? null;

          if (!walletAccountId) {
            await queryInterface.bulkInsert(
              'wallet_accounts',
              [
                {
                  userId: adminUserId,
                  profileId: profileRow.id,
                  workspaceId,
                  accountType: 'user',
                  displayName: 'Operations treasury',
                  custodyProvider: 'stripe',
                  status: 'active',
                  currencyCode: 'USD',
                  currentBalance: treasuryBalance,
                  availableBalance,
                  pendingHoldBalance: pendingBalance,
                  lastReconciledAt: reconciliationAt,
                  metadata: JSON.stringify({ source: 'foundational-persona-seed' }),
                  createdAt: now,
                  updatedAt: now,
                },
              ],
              { transaction },
            );

            const [createdAccount] = await queryInterface.sequelize.query(
              'SELECT id FROM wallet_accounts WHERE userId = :userId AND accountType = :accountType ORDER BY id DESC LIMIT 1',
              {
                type: QueryTypes.SELECT,
                transaction,
                replacements: { userId: adminUserId, accountType: 'user' },
              },
            );
            walletAccountId = createdAccount?.id ?? walletAccountId;
          } else {
            await queryInterface.bulkUpdate(
              'wallet_accounts',
              {
                displayName: 'Operations treasury',
                status: 'active',
                currencyCode: 'USD',
                currentBalance: treasuryBalance,
                availableBalance,
                pendingHoldBalance: pendingBalance,
                lastReconciledAt: reconciliationAt,
                workspaceId,
                updatedAt: now,
              },
              { id: walletAccountId },
              { transaction },
            );
          }

          let fundingSourceId = null;
          if (walletAccountId) {
            const [existingFunding] = await queryInterface.sequelize.query(
              'SELECT id, isPrimary FROM wallet_funding_sources WHERE workspaceId = :workspaceId AND label = :label LIMIT 1',
              {
                type: QueryTypes.SELECT,
                transaction,
                replacements: { workspaceId, label: 'Ops Treasury Checking' },
              },
            );

            if (!existingFunding?.id) {
              await queryInterface.bulkInsert(
                'wallet_funding_sources',
                [
                  {
                    workspaceId,
                    label: 'Ops Treasury Checking',
                    type: 'bank_account',
                    label: 'Ops Treasury Checking',
                    provider: 'stripe',
                    accountNumberLast4: '1234',
                    currencyCode: 'USD',
                    status: 'active',
                    isPrimary: true,
                    metadata: JSON.stringify({
                      source: 'foundational-persona-seed',
                      connectedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30).toISOString(),
                    }),
                    createdById: adminUserId,
                    updatedById: adminUserId,
                    createdAt: now,
                    updatedAt: now,
                  },
                ],
                { transaction },
              );

              const [createdFunding] = await queryInterface.sequelize.query(
                'SELECT id FROM wallet_funding_sources WHERE workspaceId = :workspaceId AND label = :label ORDER BY id DESC LIMIT 1',
                {
                  type: QueryTypes.SELECT,
                  transaction,
                  replacements: { workspaceId, label: 'Ops Treasury Checking' },
                },
              );
              fundingSourceId = createdFunding?.id ?? null;
            } else {
              fundingSourceId = existingFunding.id;
              if (!existingFunding.isPrimary) {
                await queryInterface.bulkUpdate(
                  'wallet_funding_sources',
                  { isPrimary: true, status: 'active', updatedAt: now, updatedById: adminUserId },
                  { id: existingFunding.id },
                  { transaction },
                );
              }
            }

            if (workspaceId) {
              const [existingSettings] = await queryInterface.sequelize.query(
                'SELECT id FROM wallet_operational_settings WHERE workspaceId = :workspaceId LIMIT 1',
                {
                  type: QueryTypes.SELECT,
                  transaction,
                  replacements: { workspaceId },
                },
              );

              if (!existingSettings?.id) {
                await queryInterface.bulkInsert(
                  'wallet_operational_settings',
                  [
                    {
                      workspaceId,
                      lowBalanceAlertThreshold: 25000,
                      autoSweepEnabled: true,
                      autoSweepThreshold: 15000,
                      reconciliationCadence: 'weekly',
                      dualControlEnabled: true,
                      complianceContactEmail: 'treasury@atlas-collective.demo',
                      payoutWindow: 'business_days',
                      riskTier: 'standard',
                      complianceNotes: 'Seeded automation guardrails',
                      metadata: JSON.stringify({ source: 'foundational-persona-seed' }),
                      createdById: adminUserId,
                      updatedById: adminUserId,
                      createdAt: now,
                      updatedAt: now,
                    },
                  ],
                  { transaction },
                );
              } else {
                await queryInterface.bulkUpdate(
                  'wallet_operational_settings',
                  {
                    autoSweepEnabled: true,
                    dualControlEnabled: true,
                    updatedAt: now,
                    updatedById: adminUserId,
                  },
                  { id: existingSettings.id },
                  { transaction },
                );
              }
            }

            const [{ count: seededLedgerCount = 0 }] = await queryInterface.sequelize.query(
              "SELECT COUNT(*)::int AS count FROM wallet_ledger_entries WHERE walletAccountId = :walletAccountId AND reference LIKE 'seed-ledger-%'",
              {
                type: QueryTypes.SELECT,
                transaction,
                replacements: { walletAccountId },
              },
            );

            if (Number(seededLedgerCount) === 0) {
              const ledgerTimeline = [
                {
                  entryType: 'credit',
                  amount: 50000,
                  balanceAfter: 50000,
                  occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 45),
                  description: 'Seed capital deposit',
                },
                {
                  entryType: 'debit',
                  amount: 3200,
                  balanceAfter: 46800,
                  occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10),
                  description: 'Mentor programme payouts',
                },
                {
                  entryType: 'debit',
                  amount: 1500,
                  balanceAfter: 45300,
                  occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 4),
                  description: 'Operations tooling spend',
                },
                {
                  entryType: 'credit',
                  amount: 2950.75,
                  balanceAfter: treasuryBalance,
                  occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
                  description: 'Escrow release for gig delivery',
                },
              ];

              const ledgerRows = ledgerTimeline.map((entry) => ({
                walletAccountId,
                entryType: entry.entryType,
                amount: entry.amount,
                currencyCode: 'USD',
                reference: `seed-ledger-${randomUUID()}`,
                description: entry.description,
                initiatedById: adminUserId,
                occurredAt: entry.occurredAt,
                balanceAfter: entry.balanceAfter,
                metadata: JSON.stringify({ source: 'foundational-persona-seed' }),
                createdAt: now,
                updatedAt: now,
              }));

              await queryInterface.bulkInsert('wallet_ledger_entries', ledgerRows, { transaction });
            }

            if (fundingSourceId) {
              const [existingTransfer] = await queryInterface.sequelize.query(
                "SELECT id FROM wallet_transfer_requests WHERE walletAccountId = :walletAccountId AND reference LIKE 'seed-transfer-%' LIMIT 1",
                {
                  type: QueryTypes.SELECT,
                  transaction,
                  replacements: { walletAccountId },
                },
              );

              if (!existingTransfer?.id) {
                await queryInterface.bulkInsert(
                  'wallet_transfer_requests',
                  [
                    {
                      walletAccountId,
                      fundingSourceId,
                      transferType: 'payout',
                      status: 'scheduled',
                      amount: 1800.5,
                      currencyCode: 'USD',
                      reference: `seed-transfer-${randomUUID()}`,
                      requestedById: adminUserId,
                      approvedById: adminUserId,
                      scheduledAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3),
                      notes: 'Scheduled mentor and vendor payouts',
                      metadata: JSON.stringify({
                        source: 'foundational-persona-seed',
                        scheduledFor: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3).toISOString(),
                        destination: 'Ops Treasury Checking',
                        channel: 'bank_transfer',
                      }),
                      createdAt: now,
                      updatedAt: now,
                    },
                  ],
                  { transaction },
                );
              }

              if (workspaceId) {
                const [existingPayout] = await queryInterface.sequelize.query(
                  'SELECT id FROM wallet_payout_requests WHERE walletAccountId = :walletAccountId AND notes = :notes LIMIT 1',
                  {
                    type: QueryTypes.SELECT,
                    transaction,
                    replacements: {
                      walletAccountId,
                      notes: 'Weekly automation payout',
                    },
                  },
                );

                if (!existingPayout?.id) {
                  await queryInterface.bulkInsert(
                    'wallet_payout_requests',
                    [
                      {
                        workspaceId,
                        walletAccountId,
                        fundingSourceId,
                        amount: 4200.75,
                        currencyCode: 'USD',
                        status: 'approved',
                        requestedById: adminUserId,
                        reviewedById: adminUserId,
                        processedById: null,
                        requestedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
                        approvedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
                        processedAt: null,
                        notes: 'Weekly automation payout',
                        metadata: JSON.stringify({
                          source: 'foundational-persona-seed',
                          scheduledFor: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2).toISOString(),
                          destination: 'Ops Treasury Checking',
                          channel: 'bank_transfer',
                        }),
                        createdAt: now,
                        updatedAt: now,
                      },
                      {
                        workspaceId,
                        walletAccountId,
                        fundingSourceId,
                        amount: 1850.5,
                        currencyCode: 'USD',
                        status: 'pending_review',
                        requestedById: adminUserId,
                        reviewedById: null,
                        processedById: null,
                        requestedAt: new Date(now.getTime() - 1000 * 60 * 60 * 12),
                        approvedAt: null,
                        processedAt: null,
                        notes: 'Mentor bonus disbursement',
                        metadata: JSON.stringify({
                          source: 'foundational-persona-seed',
                          scheduledFor: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 4).toISOString(),
                          destination: 'Ops Treasury Checking',
                          channel: 'bank_transfer',
                        }),
                        createdAt: now,
                        updatedAt: now,
                      },
                    ],
                    { transaction },
                  );
                }
              }
            }
          }

          let escrowAccountId = null;
          if (walletAccountId) {
            const [existingEscrow] = await queryInterface.sequelize.query(
              'SELECT id FROM escrow_accounts WHERE userId = :userId AND externalId = :externalId LIMIT 1',
              {
                type: QueryTypes.SELECT,
                transaction,
                replacements: { userId: adminUserId, externalId: 'seed-ops-escrow-account' },
              },
            );

            const escrowBalance = 21500.5;
            const escrowPending = 6800.25;

            if (!existingEscrow?.id) {
              await queryInterface.bulkInsert(
                'escrow_accounts',
                [
                  {
                    userId: adminUserId,
                    provider: 'stripe',
                    externalId: 'seed-ops-escrow-account',
                    status: 'active',
                    currencyCode: 'USD',
                    currentBalance: escrowBalance,
                    pendingReleaseTotal: escrowPending,
                    metadata: JSON.stringify({ source: 'foundational-persona-seed' }),
                    lastReconciledAt: now,
                    walletAccountId,
                    createdAt: now,
                    updatedAt: now,
                  },
                ],
                { transaction },
              );

              const [createdEscrow] = await queryInterface.sequelize.query(
                'SELECT id FROM escrow_accounts WHERE externalId = :externalId LIMIT 1',
                {
                  type: QueryTypes.SELECT,
                  transaction,
                  replacements: { externalId: 'seed-ops-escrow-account' },
                },
              );
              escrowAccountId = createdEscrow?.id ?? null;
            } else {
              escrowAccountId = existingEscrow.id;
              await queryInterface.bulkUpdate(
                'escrow_accounts',
                {
                  status: 'active',
                  currentBalance: escrowBalance,
                  pendingReleaseTotal: escrowPending,
                  walletAccountId,
                  updatedAt: now,
                },
                { id: escrowAccountId },
                { transaction },
              );
            }

            if (escrowAccountId) {
              const [{ count: seededEscrowCount = 0 }] = await queryInterface.sequelize.query(
                "SELECT COUNT(*)::int AS count FROM escrow_transactions WHERE accountId = :accountId AND reference LIKE 'seed-escrow-%'",
                {
                  type: QueryTypes.SELECT,
                  transaction,
                  replacements: { accountId: escrowAccountId },
                },
              );

              if (Number(seededEscrowCount) === 0) {
                const escrowTransactionsRows = [
                  {
                    accountId: escrowAccountId,
                    reference: `seed-escrow-${randomUUID()}`,
                    type: 'project',
                    status: 'in_escrow',
                    amount: 4500,
                    currencyCode: 'USD',
                    feeAmount: 105,
                    netAmount: 4395,
                    initiatedById: adminUserId,
                    counterpartyId: null,
                    projectId: null,
                    milestoneLabel: 'Automation sprint kickoff',
                    scheduledReleaseAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 5),
                    metadata: JSON.stringify({ source: 'foundational-persona-seed' }),
                    auditTrail: JSON.stringify({ events: ['seeded'] }),
                    createdAt: now,
                    updatedAt: now,
                  },
                  {
                    accountId: escrowAccountId,
                    reference: `seed-escrow-${randomUUID()}`,
                    type: 'gig',
                    status: 'released',
                    amount: 3200.25,
                    currencyCode: 'USD',
                    feeAmount: 82.5,
                    netAmount: 3117.75,
                    initiatedById: adminUserId,
                    counterpartyId: null,
                    projectId: null,
                    milestoneLabel: 'Mentor cohort completion',
                    releasedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
                    metadata: JSON.stringify({ source: 'foundational-persona-seed' }),
                    auditTrail: JSON.stringify({ events: ['seeded'] }),
                    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10),
                    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
                  },
                ];

                await queryInterface.bulkInsert('escrow_transactions', escrowTransactionsRows, { transaction });
              }
            }
          }
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
        const adminUser = users.find((user) => user.email === 'lara.ops.demo@gigvora.com');
        if (adminUser) {
          const adminUserId = adminUser.id;

          const walletAccounts = await queryInterface.sequelize.query(
            'SELECT id FROM wallet_accounts WHERE userId = :userId AND displayName = :displayName',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: { userId: adminUserId, displayName: 'Operations treasury' },
            },
          );

          for (const account of walletAccounts) {
            await queryInterface.bulkDelete(
              'wallet_transfer_requests',
              { walletAccountId: account.id, reference: { [Op.like]: 'seed-transfer-%' } },
              { transaction },
            );
            await queryInterface.bulkDelete(
              'wallet_ledger_entries',
              { walletAccountId: account.id, reference: { [Op.like]: 'seed-ledger-%' } },
              { transaction },
            );
          }

          await queryInterface.bulkDelete(
            'wallet_funding_sources',
            { userId: adminUserId, label: 'Ops Treasury Checking' },
            { transaction },
          );
          await queryInterface.bulkDelete(
            'wallet_accounts',
            { userId: adminUserId, displayName: 'Operations treasury' },
            { transaction },
          );

          const escrowAccounts = await queryInterface.sequelize.query(
            'SELECT id FROM escrow_accounts WHERE userId = :userId AND externalId = :externalId',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: { userId: adminUserId, externalId: 'seed-ops-escrow-account' },
            },
          );

          for (const escrow of escrowAccounts) {
            await queryInterface.bulkDelete(
              'escrow_transactions',
              { accountId: escrow.id, reference: { [Op.like]: 'seed-escrow-%' } },
              { transaction },
            );
          }

          await queryInterface.bulkDelete(
            'escrow_accounts',
            { userId: adminUserId, externalId: 'seed-ops-escrow-account' },
            { transaction },
          );
        }

        const freelancerUser = users.find((user) => user.email === 'jonah.freelancer.demo@gigvora.com');
        if (freelancerUser) {
          const freelancerId = freelancerUser.id;
          const applicationSeedKeys = [
            'foundational-persona-jonah-application-flowpilot',
            'foundational-persona-jonah-application-atlas',
          ];
          const favouriteSeedKeys = [
            'foundational-persona-jonah-favourite-europa',
            'foundational-persona-jonah-favourite-luminary',
          ];
          const interviewSeedKeys = [
            'foundational-persona-jonah-interview-flowpilot-panel',
            'foundational-persona-jonah-interview-flowpilot-portfolio',
            'foundational-persona-jonah-interview-atlas-sync',
          ];
          const responseSeedKeys = [
            'foundational-persona-jonah-response-flowpilot-followup',
            'foundational-persona-jonah-response-atlas-portfolio',
          ];

          for (const seed of responseSeedKeys) {
            await queryInterface.sequelize.query(
              "DELETE FROM job_application_responses WHERE userId = :userId AND metadata->>'seedKey' = :seed",
              {
                transaction,
                replacements: { userId: freelancerId, seed },
              },
            );
          }

          for (const seed of interviewSeedKeys) {
            await queryInterface.sequelize.query(
              "DELETE FROM job_application_interviews WHERE userId = :userId AND metadata->>'seedKey' = :seed",
              {
                transaction,
                replacements: { userId: freelancerId, seed },
              },
            );
          }

          for (const seed of favouriteSeedKeys) {
            await queryInterface.sequelize.query(
              "DELETE FROM job_application_favourites WHERE userId = :userId AND metadata->>'seedKey' = :seed",
              {
                transaction,
                replacements: { userId: freelancerId, seed },
              },
            );
          }

          for (const seed of applicationSeedKeys) {
            await queryInterface.sequelize.query(
              "DELETE FROM applications WHERE applicantId = :userId AND metadata->>'seedKey' = :seed",
              {
                transaction,
                replacements: { userId: freelancerId, seed },
              },
            );
          }
        }

        await queryInterface.bulkDelete(
          'jobs',
          { description: { [Op.like]: '[seed-foundational-persona]%' } },
          { transaction },
        );

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
