'use strict';

const { QueryTypes, Op } = require('sequelize');

const workspaceSlug = 'creation-studio-demo';
const seedTag = 'creation-studio-mentorship-demo';
const hashedPassword = '$2b$10$URrfHgz0s1xu1vByrRl/h.STE7Z0O.STDnpCiMTGy66idi2EDmzJm';

async function requireUserId(queryInterface, transaction, { email, firstName, lastName, userType }) {
  const [row] = await queryInterface.sequelize.query(
    'SELECT id FROM users WHERE email = :email LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { email },
    },
  );

  if (row?.id) {
    return Number(row.id);
  }

  if (!firstName || !lastName || !userType) {
    throw new Error(`Mentorship demo seed requires ${email} to exist.`);
  }

  const now = new Date();
  await queryInterface.bulkInsert(
    'users',
    [
      {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        address: 'Seeded via mentorship demo',
        age: 35,
        userType,
        createdAt: now,
        updatedAt: now,
      },
    ],
    { transaction },
  );

  const [inserted] = await queryInterface.sequelize.query(
    'SELECT id FROM users WHERE email = :email LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { email },
    },
  );

  if (!inserted?.id) {
    throw new Error(`Unable to create user for ${email}.`);
  }

  return Number(inserted.id);
}

async function ensureWorkspace(queryInterface, transaction, ownerId) {
  const [workspaceRow] = await queryInterface.sequelize.query(
    'SELECT id FROM provider_workspaces WHERE slug = :slug LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { slug: workspaceSlug },
    },
  );

  if (workspaceRow?.id) {
    return Number(workspaceRow.id);
  }

  const now = new Date();
  await queryInterface.bulkInsert(
    'provider_workspaces',
    [
      {
        ownerId,
        name: 'Creation Studio Demo',
        slug: workspaceSlug,
        type: 'company',
        timezone: 'America/New_York',
        defaultCurrency: 'USD',
        intakeEmail: 'creation-studio-demo@gigvora.example',
        isActive: true,
        settings: { seed: 'creation-studio-demo', mentorshipSeed: seedTag },
        createdAt: now,
        updatedAt: now,
      },
    ],
    { transaction },
  );

  const [insertedWorkspace] = await queryInterface.sequelize.query(
    'SELECT id FROM provider_workspaces WHERE slug = :slug LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { slug: workspaceSlug },
    },
  );

  if (!insertedWorkspace?.id) {
    throw new Error('Unable to resolve creation studio workspace for mentorship demo seed.');
  }

  return Number(insertedWorkspace.id);
}

async function findRecordId(queryInterface, transaction, table, whereSql, replacements) {
  const [row] = await queryInterface.sequelize.query(
    `SELECT id FROM ${table} WHERE ${whereSql} LIMIT 1`,
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements,
    },
  );
  return row?.id ? Number(row.id) : null;
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
      const upcomingDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const followUpDate = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);

      const mentorId = await requireUserId(queryInterface, transaction, {
        email: 'mentor@gigvora.com',
        firstName: 'Avery',
        lastName: 'Mentor',
        userType: 'user',
      });
      const operatorId = await requireUserId(queryInterface, transaction, {
        email: 'mia@gigvora.com',
        firstName: 'Mia',
        lastName: 'Operations',
        userType: 'company',
      });
      const reviewerId = await requireUserId(queryInterface, transaction, {
        email: 'ava@gigvora.com',
        firstName: 'Ava',
        lastName: 'Founder',
        userType: 'admin',
      });

      const workspaceId = await ensureWorkspace(queryInterface, transaction, operatorId);

      const orderPackageName = '[demo] Creation Studio Leadership Coaching';
      const existingOrderId = await findRecordId(
        queryInterface,
        transaction,
        'mentorship_orders',
        'mentorId = :mentorId AND userId = :userId AND packageName = :packageName',
        {
          mentorId,
          userId: reviewerId,
          packageName: orderPackageName,
        },
      );

      let mentorshipOrderId = existingOrderId;
      if (!mentorshipOrderId) {
        await queryInterface.bulkInsert(
          'mentorship_orders',
          [
            {
              userId: reviewerId,
              mentorId,
              packageName: orderPackageName,
              packageDescription: 'Leadership and operations coaching tailored for creation studio launch teams.',
              sessionsPurchased: 6,
              sessionsRedeemed: 4,
              totalAmount: 7200,
              currency: 'USD',
              status: 'active',
              purchasedAt: fortyFiveDaysAgo,
              expiresAt: followUpDate,
              metadata: { seed: seedTag },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
        mentorshipOrderId = await findRecordId(
          queryInterface,
          transaction,
          'mentorship_orders',
          'mentorId = :mentorId AND userId = :userId AND packageName = :packageName',
          {
            mentorId,
            userId: reviewerId,
            packageName: orderPackageName,
          },
        );
      }

      const purchaseReferenceCodes = ['MENTOR-CS-001', 'MENTOR-CS-002'];
      const existingPurchases = await queryInterface.sequelize.query(
        'SELECT referenceCode, id FROM agency_mentoring_purchases WHERE workspaceId = :workspaceId AND referenceCode IN (:codes)',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { workspaceId, codes: purchaseReferenceCodes },
        },
      );
      const existingPurchaseMap = new Map(existingPurchases.map((row) => [row.referenceCode, Number(row.id)]));

      const purchasePayloads = [
        existingPurchaseMap.has('MENTOR-CS-001')
          ? null
          : {
              workspaceId,
              mentorId,
              mentorName: 'Avery Mentor',
              mentorEmail: 'mentor@gigvora.com',
              packageName: '[demo] Sprint Support Retainer',
              description: 'Monthly retainer covering leadership office hours and async feedback.',
              sessionsIncluded: 6,
              sessionsUsed: 4,
              amount: 7200,
              currency: 'USD',
              purchasedAt: thirtyDaysAgo,
              validFrom: thirtyDaysAgo,
              validUntil: followUpDate,
              status: 'active',
              invoiceUrl: 'https://billing.gigvora.example.com/invoices/CS-MENTOR-001',
              referenceCode: 'MENTOR-CS-001',
              notes: 'Seeded creation studio mentorship retainer.',
              metadata: { seed: seedTag },
              createdBy: operatorId,
              createdAt: now,
              updatedAt: now,
            },
        existingPurchaseMap.has('MENTOR-CS-002')
          ? null
          : {
              workspaceId,
              mentorId,
              mentorName: 'Avery Mentor',
              mentorEmail: 'mentor@gigvora.com',
              packageName: '[demo] Hiring Enablement Deep Dive',
              description: 'One-off engagement aligning hiring pods with mentorship resources.',
              sessionsIncluded: 3,
              sessionsUsed: 3,
              amount: 3600,
              currency: 'USD',
              purchasedAt: fortyFiveDaysAgo,
              validFrom: fortyFiveDaysAgo,
              validUntil: thirtyDaysAgo,
              status: 'expired',
              invoiceUrl: 'https://billing.gigvora.example.com/invoices/CS-MENTOR-002',
              referenceCode: 'MENTOR-CS-002',
              notes: 'Legacy mentorship pack for creation studio.',
              metadata: { seed: seedTag },
              createdBy: operatorId,
              createdAt: now,
              updatedAt: now,
            },
      ].filter(Boolean);

      if (purchasePayloads.length) {
        await queryInterface.bulkInsert('agency_mentoring_purchases', purchasePayloads, { transaction });
      }

      const purchaseIds = new Map(existingPurchaseMap);
      if (!purchaseIds.has('MENTOR-CS-001') || !purchaseIds.has('MENTOR-CS-002')) {
        const inserted = await queryInterface.sequelize.query(
          'SELECT referenceCode, id FROM agency_mentoring_purchases WHERE workspaceId = :workspaceId AND referenceCode IN (:codes)',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { workspaceId, codes: purchaseReferenceCodes },
          },
        );
        inserted.forEach((row) => {
          purchaseIds.set(row.referenceCode, Number(row.id));
        });
      }

      const sessionDefinitions = [
        {
          agenda: '[demo] Launch readiness alignment',
          scheduledAt: thirtyDaysAgo,
          status: 'completed',
          durationMinutes: 60,
          followUpActions: 'Share updated hiring playbook and automation checklist.',
          clientName: 'Haruto Sato',
          clientEmail: 'haruto.company.demo@gigvora.com',
          clientCompany: 'Lumen Analytics',
          focusArea: 'Creation studio go-live readiness',
          recordingUrl: 'https://meet.gigvora.example.com/recordings/launch-readiness',
          purchaseCode: 'MENTOR-CS-001',
        },
        {
          agenda: '[demo] Interview panel calibration',
          scheduledAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
          status: 'completed',
          durationMinutes: 45,
          followUpActions: 'Document new interviewer onboarding flow.',
          clientName: 'Lara Nguyen',
          clientEmail: 'lara.ops.demo@gigvora.com',
          clientCompany: 'Creation Studio Ops',
          focusArea: 'Interview enablement',
          recordingUrl: 'https://meet.gigvora.example.com/recordings/interview-calibration',
          purchaseCode: 'MENTOR-CS-001',
        },
        {
          agenda: '[demo] Mentorship office hours',
          scheduledAt: upcomingDate,
          status: 'scheduled',
          durationMinutes: 45,
          followUpActions: null,
          clientName: 'Jonah Barrett',
          clientEmail: 'jonah.freelancer.demo@gigvora.com',
          clientCompany: 'Creation Studio Guild',
          focusArea: 'Portfolio storytelling',
          meetingUrl: 'https://meet.gigvora.example.com/rooms/mentorship-office-hours',
          purchaseCode: 'MENTOR-CS-001',
        },
        {
          agenda: '[demo] Offer negotiation coaching',
          scheduledAt: thirtyDaysAgo,
          status: 'cancelled',
          durationMinutes: 30,
          followUpActions: 'Reschedule once candidate availability confirmed.',
          clientName: 'Riley Recruiter',
          clientEmail: 'recruiter@gigvora.com',
          clientCompany: 'Lumen Analytics',
          focusArea: 'Offer enablement',
          purchaseCode: 'MENTOR-CS-002',
        },
      ];

      for (const session of sessionDefinitions) {
        const existingSessionId = await findRecordId(
          queryInterface,
          transaction,
          'agency_mentoring_sessions',
          'workspaceId = :workspaceId AND agenda = :agenda',
          { workspaceId, agenda: session.agenda },
        );
        if (existingSessionId) {
          continue;
        }

        await queryInterface.bulkInsert(
          'agency_mentoring_sessions',
          [
            {
              workspaceId,
              purchaseId: purchaseIds.get(session.purchaseCode) ?? null,
              mentorId,
              mentorName: 'Avery Mentor',
              mentorEmail: 'mentor@gigvora.com',
              clientName: session.clientName,
              clientEmail: session.clientEmail,
              clientCompany: session.clientCompany,
              focusArea: session.focusArea,
              agenda: session.agenda,
              scheduledAt: session.scheduledAt,
              durationMinutes: session.durationMinutes,
              status: session.status,
              meetingUrl: session.meetingUrl ?? null,
              recordingUrl: session.recordingUrl ?? null,
              followUpActions: session.followUpActions,
              sessionNotes: null,
              sessionTags: ['creation_studio', 'mentorship'],
              costAmount: session.purchaseCode === 'MENTOR-CS-002' ? 600 : 1200,
              currency: 'USD',
              createdBy: operatorId,
              metadata: { seed: seedTag },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const preferenceExists = await queryInterface.sequelize.query(
        'SELECT id FROM agency_mentor_preferences WHERE workspaceId = :workspaceId AND mentorEmail = :mentorEmail LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { workspaceId, mentorEmail: 'mentor@gigvora.com' },
        },
      );

      if (!preferenceExists.length) {
        await queryInterface.bulkInsert(
          'agency_mentor_preferences',
          [
            {
              workspaceId,
              mentorId,
              mentorName: 'Avery Mentor',
              mentorEmail: 'mentor@gigvora.com',
              preferenceLevel: 'primary',
              favourite: true,
              introductionNotes: '[demo] Dedicated coach for creation studio operators.',
              tags: ['leadership', 'operations', 'hiring'],
              lastEngagedAt: thirtyDaysAgo,
              createdBy: operatorId,
              metadata: { seed: seedTag },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const sessionIds = await queryInterface.sequelize.query(
        'SELECT id, agenda FROM agency_mentoring_sessions WHERE workspaceId = :workspaceId AND agenda IN (:agendas)',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: {
            workspaceId,
            agendas: sessionDefinitions.map((session) => session.agenda),
          },
        },
      );
      const sessionIdByAgenda = new Map(sessionIds.map((row) => [row.agenda, Number(row.id)]));

      const reviewPayloads = [
        {
          headline: 'Creation studio sprint unlocked clarity',
          feedback:
            'Avery translated hiring bottlenecks into a clear mentorship roadmap and actionable next steps for the studio team.',
          rating: 5,
          wouldRecommend: true,
          praiseHighlights: ['Actionable insights', 'Inclusive facilitation'],
          improvementAreas: [],
          publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          sessionAgenda: '[demo] Interview panel calibration',
        },
        {
          headline: 'Mentor pairing improved candidate experience',
          feedback: 'Office hours prep surfaced messaging gaps before demo day interviews and improved satisfaction scores.',
          rating: 4,
          wouldRecommend: true,
          praiseHighlights: ['Practical frameworks'],
          improvementAreas: ['More async templates'],
          publishedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
          sessionAgenda: '[demo] Launch readiness alignment',
        },
      ];

      for (const review of reviewPayloads) {
        const existingReviewId = await findRecordId(
          queryInterface,
          transaction,
          'mentor_reviews',
          'mentorId = :mentorId AND headline = :headline',
          { mentorId, headline: review.headline },
        );
        if (existingReviewId) {
          continue;
        }

        await queryInterface.bulkInsert(
          'mentor_reviews',
          [
            {
              userId: reviewerId,
              mentorId,
              sessionId: sessionIdByAgenda.get(review.sessionAgenda) ?? null,
              orderId: mentorshipOrderId,
              rating: review.rating,
              wouldRecommend: review.wouldRecommend,
              headline: review.headline,
              feedback: review.feedback,
              praiseHighlights: review.praiseHighlights,
              improvementAreas: review.improvementAreas,
              publishedAt: review.publishedAt,
              isPublic: true,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [workspaceRow] = await queryInterface.sequelize.query(
        'SELECT id FROM provider_workspaces WHERE slug = :slug LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { slug: workspaceSlug },
        },
      );
      const workspaceId = workspaceRow?.id ? Number(workspaceRow.id) : null;

      await queryInterface.bulkDelete(
        'mentor_reviews',
        {
          headline: {
            [Op.in]: [
              'Creation studio sprint unlocked clarity',
              'Mentor pairing improved candidate experience',
            ],
          },
        },
        { transaction },
      );

      if (workspaceId) {
        await queryInterface.bulkDelete(
          'agency_mentoring_sessions',
          {
            workspaceId,
            agenda: {
              [Op.in]: [
                '[demo] Launch readiness alignment',
                '[demo] Interview panel calibration',
                '[demo] Mentorship office hours',
                '[demo] Offer negotiation coaching',
              ],
            },
          },
          { transaction },
        );

        await queryInterface.bulkDelete(
          'agency_mentoring_purchases',
          {
            workspaceId,
            referenceCode: {
              [Op.in]: ['MENTOR-CS-001', 'MENTOR-CS-002'],
            },
          },
          { transaction },
        );

        await queryInterface.bulkDelete(
          'agency_mentor_preferences',
          {
            workspaceId,
            mentorEmail: 'mentor@gigvora.com',
            introductionNotes: '[demo] Dedicated coach for creation studio operators.',
          },
          { transaction },
        );
      }

      await queryInterface.bulkDelete(
        'mentorship_orders',
        {
          packageName: '[demo] Creation Studio Leadership Coaching',
        },
        { transaction },
      );
    });
  },
};
