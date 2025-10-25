'use strict';

const { QueryTypes, Op } = require('sequelize');

const serviceLineSlugs = ['brand-experience-demo', 'revenue-operations-demo'];
const courseTitles = ['Demo: Designing conversion-ready brand systems', 'Demo: Lifecycle automation architecture'];
const enrollmentLabels = ['Demo brand systems'];
const mentoringTopics = [
  'Demo: Campaign QA and Creative Ops',
  'Demo: Analytics retro and backlog triage',
];
const diagnosticKeys = ['demo-brand-diagnostic'];
const certificationNames = ['Demo: HubSpot Solutions Partner'];
const recommendationTitles = ['Demo: Offer creative ops telemetry add-on'];

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
      const dayInMs = 24 * 60 * 60 * 1000;
      const learnerId = await findUserId(queryInterface, transaction, 'leo@gigvora.com');
      const mentorId = await findUserId(queryInterface, transaction, 'mentor@gigvora.com');

      if (!learnerId || !mentorId) {
        throw new Error('Learning hub seed requires leo@gigvora.com and mentor@gigvora.com to exist.');
      }

      const serviceLines = [
        {
          slug: serviceLineSlugs[0],
          name: 'Demo: Brand experience design',
          description: 'Design systems, campaign creative, and multi-channel brand activations.',
        },
        {
          slug: serviceLineSlugs[1],
          name: 'Demo: Revenue operations automation',
          description: 'Workflow engineering for CRM and lifecycle analytics.',
        },
      ];

      const serviceLineIds = new Map();
      for (const line of serviceLines) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM service_lines WHERE slug = :slug LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { slug: line.slug },
          },
        );
        if (existing?.id) {
          serviceLineIds.set(line.slug, existing.id);
          continue;
        }
        await queryInterface.bulkInsert(
          'service_lines',
          [
            {
              ...line,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
        const [inserted] = await queryInterface.sequelize.query(
          'SELECT id FROM service_lines WHERE slug = :slug LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { slug: line.slug },
          },
        );
        if (inserted?.id) {
          serviceLineIds.set(line.slug, inserted.id);
        }
      }

      const courseDefinitions = [
        {
          title: courseTitles[0],
          serviceLineSlug: serviceLineSlugs[0],
          summary: 'Blueprint modular brand systems and creative ops workflows tailored for agile squads.',
          difficulty: 'advanced',
          format: 'cohort + async labs',
          durationHours: 12,
          tags: ['storytelling', 'design-ops'],
        },
        {
          title: courseTitles[1],
          serviceLineSlug: serviceLineSlugs[1],
          summary: 'Architect RevOps journeys across HubSpot, Salesforce, and customer data platforms.',
          difficulty: 'intermediate',
          format: 'mentor-led',
          durationHours: 10,
          tags: ['crm', 'automation'],
        },
      ];

      const courseIds = new Map();
      for (const course of courseDefinitions) {
        const serviceLineId = serviceLineIds.get(course.serviceLineSlug);
        if (!serviceLineId) continue;
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM learning_courses WHERE title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { title: course.title },
          },
        );
        if (existing?.id) {
          courseIds.set(course.title, existing.id);
          continue;
        }
        await queryInterface.bulkInsert(
          'learning_courses',
          [
            {
              ...course,
              serviceLineId,
              metadata: { seed: 'learning-hub-demo' },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
        const [inserted] = await queryInterface.sequelize.query(
          'SELECT id FROM learning_courses WHERE title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { title: course.title },
          },
        );
        if (inserted?.id) {
          courseIds.set(course.title, inserted.id);
        }
      }

      const moduleDefinitions = [
        {
          courseTitle: courseTitles[0],
          title: 'Demo: Voice of customer synthesis',
          moduleType: 'workshop',
          durationMinutes: 75,
          sequence: 1,
          resources: [{ type: 'worksheet', name: 'Interview Debrief Matrix' }],
        },
        {
          courseTitle: courseTitles[1],
          title: 'Demo: Revenue architecture mapping',
          moduleType: 'canvas',
          durationMinutes: 95,
          sequence: 1,
          resources: [{ type: 'template', name: 'Lifecycle Blueprint' }],
        },
        {
          courseTitle: courseTitles[1],
          title: 'Demo: Scoring model calibration',
          moduleType: 'lab',
          durationMinutes: 80,
          sequence: 2,
          resources: [{ type: 'sheet', name: 'Lead Scoring Simulator' }],
        },
      ];

      for (const module of moduleDefinitions) {
        const courseId = courseIds.get(module.courseTitle);
        if (!courseId) continue;
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM learning_course_modules WHERE courseId = :courseId AND title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { courseId, title: module.title },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert(
          'learning_course_modules',
          [
            {
              ...module,
              courseId,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const enrollmentCourseId = courseIds.get(courseTitles[0]);
      if (enrollmentCourseId) {
        const [existingEnrollment] = await queryInterface.sequelize.query(
          'SELECT id FROM learning_course_enrollments WHERE userId = :userId AND courseId = :courseId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId: learnerId, courseId: enrollmentCourseId },
          },
        );
        if (!existingEnrollment?.id) {
          await queryInterface.bulkInsert(
            'learning_course_enrollments',
            [
              {
                userId: learnerId,
                courseId: enrollmentCourseId,
                status: 'in_progress',
                progress: 45,
                lastAccessedAt: now,
                startedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
                notes: enrollmentLabels[0],
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }
      }

      const mentoringLineId = serviceLineIds.get(serviceLineSlugs[0]) ?? null;

      const [existingOrder] = await queryInterface.sequelize.query(
        'SELECT id FROM mentorship_orders WHERE userId = :userId AND mentorId = :mentorId LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { userId: learnerId, mentorId },
        },
      );

      let mentorshipOrderId = existingOrder?.id ?? null;
      if (!mentorshipOrderId) {
        const purchasedAt = new Date(now.getTime() - 15 * dayInMs);
        const expiresAt = new Date(purchasedAt.getTime() + 75 * dayInMs);
        await queryInterface.bulkInsert(
          'mentorship_orders',
          [
            {
              userId: learnerId,
              mentorId,
              packageName: 'Creative Ops Retainer (Demo)',
              packageDescription:
                'Four-session creative operations and analytics mentorship retainer seeded for demo workspaces.',
              sessionsPurchased: 4,
              sessionsRedeemed: 2,
              totalAmount: 1800,
              currency: 'USD',
              status: 'active',
              purchasedAt,
              expiresAt,
              metadata: { seed: 'learning-hub-demo' },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
        const [orderRow] = await queryInterface.sequelize.query(
          'SELECT id FROM mentorship_orders WHERE userId = :userId AND mentorId = :mentorId ORDER BY id DESC LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId: learnerId, mentorId },
          },
        );
        mentorshipOrderId = orderRow?.id ?? null;
      }

      const [existingFavourite] = await queryInterface.sequelize.query(
        'SELECT id FROM mentor_favourites WHERE userId = :userId AND mentorId = :mentorId LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { userId: learnerId, mentorId },
        },
      );
      if (!existingFavourite?.id) {
        await queryInterface.bulkInsert(
          'mentor_favourites',
          [
            {
              userId: learnerId,
              mentorId,
              notes: 'Seed: creative ops retainer favourite',
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const recommendationReason =
        '2 completed sessions • 1 upcoming booking • Active package • Saved in favourites';
      const [existingWorkspaceRecommendation] = await queryInterface.sequelize.query(
        'SELECT id FROM mentor_recommendations WHERE userId = :userId AND mentorId = :mentorId LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { userId: learnerId, mentorId },
        },
      );
      if (!existingWorkspaceRecommendation?.id) {
        await queryInterface.bulkInsert(
          'mentor_recommendations',
          [
            {
              userId: learnerId,
              mentorId,
              score: 9.6,
              source: 'workspace_insights_seed',
              reason: recommendationReason,
              generatedAt: new Date(now.getTime() - 2 * dayInMs),
              metadata: { seed: 'learning-hub-demo' },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const [existingSession] = await queryInterface.sequelize.query(
        'SELECT id FROM peer_mentoring_sessions WHERE mentorId = :mentorId AND menteeId = :menteeId AND topic = :topic LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { mentorId, menteeId: learnerId, topic: mentoringTopics[0] },
        },
      );
      if (existingSession?.id) {
        await queryInterface.bulkUpdate(
          'peer_mentoring_sessions',
          {
            serviceLineId: mentoringLineId,
            orderId: mentorshipOrderId,
            pricePaid: 450,
            currency: 'USD',
            scheduledAt: new Date(now.getTime() + 7 * dayInMs),
            status: 'scheduled',
            meetingUrl: 'https://meet.gigvora.example.com/brand-ops-demo',
          },
          { id: existingSession.id },
          { transaction },
        );
      } else {
        await queryInterface.bulkInsert(
          'peer_mentoring_sessions',
          [
            {
              serviceLineId: mentoringLineId,
              mentorId,
              menteeId: learnerId,
              topic: mentoringTopics[0],
              agenda: 'Review sprint rituals, asset QA workflows, and automation triggers.',
              scheduledAt: new Date(now.getTime() + 7 * dayInMs),
              durationMinutes: 60,
              status: 'scheduled',
              meetingUrl: 'https://meet.gigvora.example.com/brand-ops-demo',
              orderId: mentorshipOrderId,
              pricePaid: 450,
              currency: 'USD',
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const [completedSession] = await queryInterface.sequelize.query(
        'SELECT id FROM peer_mentoring_sessions WHERE mentorId = :mentorId AND menteeId = :menteeId AND topic = :topic LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { mentorId, menteeId: learnerId, topic: mentoringTopics[1] },
        },
      );

      let completedSessionId = completedSession?.id ?? null;
      const completedAt = new Date(now.getTime() - 12 * dayInMs);
      if (completedSessionId) {
        await queryInterface.bulkUpdate(
          'peer_mentoring_sessions',
          {
            serviceLineId: mentoringLineId,
            orderId: mentorshipOrderId,
            topic: mentoringTopics[1],
            agenda: 'Retro mentorship analytics and creative ops backlog triage.',
            scheduledAt: new Date(completedAt.getTime() - 60 * 60 * 1000),
            durationMinutes: 60,
            status: 'completed',
            completedAt,
            pricePaid: 450,
            currency: 'USD',
            feedbackRequested: true,
          },
          { id: completedSessionId },
          { transaction },
        );
      } else {
        await queryInterface.bulkInsert(
          'peer_mentoring_sessions',
          [
            {
              serviceLineId: mentoringLineId,
              mentorId,
              menteeId: learnerId,
              topic: mentoringTopics[1],
              agenda: 'Retro mentorship analytics and creative ops backlog triage.',
              scheduledAt: new Date(completedAt.getTime() - 60 * 60 * 1000),
              durationMinutes: 60,
              status: 'completed',
              completedAt,
              orderId: mentorshipOrderId,
              pricePaid: 450,
              currency: 'USD',
              feedbackRequested: true,
              meetingUrl: 'https://meet.gigvora.example.com/brand-ops-demo',
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
        const [insertedSession] = await queryInterface.sequelize.query(
          'SELECT id FROM peer_mentoring_sessions WHERE mentorId = :mentorId AND menteeId = :menteeId AND topic = :topic LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { mentorId, menteeId: learnerId, topic: mentoringTopics[1] },
          },
        );
        completedSessionId = insertedSession?.id ?? null;
      }

      if (completedSessionId) {
        const [existingReview] = await queryInterface.sequelize.query(
          'SELECT id FROM mentor_reviews WHERE userId = :userId AND mentorId = :mentorId AND sessionId = :sessionId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId: learnerId, mentorId, sessionId: completedSessionId },
          },
        );
        if (!existingReview?.id) {
          await queryInterface.bulkInsert(
            'mentor_reviews',
            [
              {
                userId: learnerId,
                mentorId,
                sessionId: completedSessionId,
                orderId: mentorshipOrderId,
                rating: 5,
                wouldRecommend: true,
                headline: 'Seeded mentoring review',
                feedback:
                  'Actionable creative ops dashboard homework and responsive async notes kept the cohort on track.',
                praiseHighlights: ['Async notes follow-ups', 'Clear budget guidance'],
                improvementAreas: ['Add more RevOps templates'],
                publishedAt: new Date(now.getTime() - 10 * dayInMs),
                isPublic: true,
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }
      }

      const [existingDiagnostic] = await queryInterface.sequelize.query(
        'SELECT id FROM skill_gap_diagnostics WHERE userId = :userId AND summary LIKE :summary LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { userId: learnerId, summary: `%${diagnosticKeys[0]}%` },
        },
      );
      if (!existingDiagnostic?.id) {
        await queryInterface.bulkInsert(
          'skill_gap_diagnostics',
          [
            {
              userId: learnerId,
              serviceLineId: serviceLineIds.get(serviceLineSlugs[0]) ?? null,
              summary: `Demo diagnostic (${diagnosticKeys[0]})` ,
              strengths: ['Narrative mapping', 'Executive facilitation'],
              gaps: ['Creative ops telemetry'],
              recommendedActions: ['Complete lifecycle analytics practicum'],
              completedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const [existingCertification] = await queryInterface.sequelize.query(
        'SELECT id FROM freelancer_certifications WHERE userId = :userId AND name = :name LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { userId: learnerId, name: certificationNames[0] },
        },
      );
      if (!existingCertification?.id) {
        await queryInterface.bulkInsert(
          'freelancer_certifications',
          [
            {
              userId: learnerId,
              serviceLineId: serviceLineIds.get(serviceLineSlugs[1]) ?? null,
              name: certificationNames[0],
              issuingOrganization: 'HubSpot Academy (demo)',
              credentialId: 'HSP-DEMO-001',
              credentialUrl: 'https://credentials.example.com/hsp-demo-001',
              issueDate: new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()),
              expirationDate: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()),
              status: 'active',
              reminderSentAt: null,
              attachments: [{ name: 'Partner Badge', url: 'https://cdn.gigvora.example.com/badges/demo-hsp.png' }],
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const [existingRecommendation] = await queryInterface.sequelize.query(
        'SELECT id FROM ai_service_recommendations WHERE userId = :userId AND title = :title LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { userId: learnerId, title: recommendationTitles[0] },
        },
      );
      if (!existingRecommendation?.id) {
        await queryInterface.bulkInsert(
          'ai_service_recommendations',
          [
            {
              userId: learnerId,
              serviceLineId: serviceLineIds.get(serviceLineSlugs[0]) ?? null,
              title: recommendationTitles[0],
              description: 'Bundle campaign analytics dashboards with your brand system engagements to capture recurring revenue.',
              confidenceScore: 82.5,
              sourceSignals: { marketplaceDemand: 'high', competitorListings: 14 },
              generatedAt: now,
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
      const learnerId = await findUserId(queryInterface, transaction, 'leo@gigvora.com');
      const mentorId = await findUserId(queryInterface, transaction, 'mentor@gigvora.com');
      if (!learnerId) return;

      await queryInterface.bulkDelete(
        'ai_service_recommendations',
        { userId: learnerId, title: { [Op.in]: recommendationTitles } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'freelancer_certifications',
        { userId: learnerId, name: { [Op.in]: certificationNames } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'skill_gap_diagnostics',
        { userId: learnerId, summary: { [Op.like]: '%demo%' } },
        { transaction },
      );
      if (mentorId) {
        await queryInterface.bulkDelete(
          'mentor_reviews',
          {
            userId: learnerId,
            mentorId,
            headline: 'Seeded mentoring review',
          },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'mentor_recommendations',
          {
            userId: learnerId,
            mentorId,
            source: 'workspace_insights_seed',
          },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'mentor_favourites',
          {
            userId: learnerId,
            mentorId,
            notes: 'Seed: creative ops retainer favourite',
          },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'peer_mentoring_sessions',
          { mentorId, menteeId: learnerId },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'mentorship_orders',
          {
            userId: learnerId,
            mentorId,
            packageName: 'Creative Ops Retainer (Demo)',
          },
          { transaction },
        );
      }
      await queryInterface.bulkDelete(
        'learning_course_enrollments',
        { userId: learnerId, notes: { [Op.in]: enrollmentLabels } },
        { transaction },
      );

      const courseIds = [];
      for (const title of courseTitles) {
        const [row] = await queryInterface.sequelize.query(
          'SELECT id FROM learning_courses WHERE title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { title },
          },
        );
        if (row?.id) courseIds.push(row.id);
      }

      if (courseIds.length) {
        await queryInterface.bulkDelete(
          'learning_course_modules',
          { courseId: { [Op.in]: courseIds } },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'learning_courses',
          { id: { [Op.in]: courseIds } },
          { transaction },
        );
      }

      await queryInterface.bulkDelete(
        'service_lines',
        { slug: serviceLineSlugs },
        { transaction },
      );
    });
  },
};
