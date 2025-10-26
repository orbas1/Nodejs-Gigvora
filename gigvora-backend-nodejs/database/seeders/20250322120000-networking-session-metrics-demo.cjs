'use strict';

const { QueryTypes } = require('sequelize');

const WORKSPACE_SLUG = 'networking-velocity-lab';
const SESSION_SLUG = 'executive-networking-velocity';
const OWNER_EMAIL = 'mia@gigvora.com';
const HASHED_PASSWORD = '$2b$10$URrfHgz0s1xu1vByrRl/h.STE7Z0O.STDnpCiMTGy66idi2EDmzJm';

const PARTICIPANTS = [
  { email: 'mentor.avery@gigvora.example', firstName: 'Avery', lastName: 'Chen', userType: 'freelancer' },
  { email: 'founder.niko@gigvora.example', firstName: 'Niko', lastName: 'Patel', userType: 'company' },
  { email: 'ops.rhea@gigvora.example', firstName: 'Rhea', lastName: 'Singh', userType: 'freelancer' },
  { email: 'advisor.lina@gigvora.example', firstName: 'Lina', lastName: 'Morales', userType: 'freelancer' },
];

async function ensureUser(queryInterface, transaction, { email, firstName, lastName, userType }) {
  const [existing] = await queryInterface.sequelize.query(
    'SELECT id FROM users WHERE email = :email LIMIT 1',
    { type: QueryTypes.SELECT, transaction, replacements: { email } },
  );
  if (existing?.id) {
    return existing.id;
  }
  const now = new Date();
  await queryInterface.bulkInsert(
    'users',
    [
      {
        firstName,
        lastName,
        email,
        password: HASHED_PASSWORD,
        address: 'Seeded networking persona',
        age: 32,
        userType: userType ?? 'freelancer',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    ],
    { transaction },
  );
  const [inserted] = await queryInterface.sequelize.query(
    'SELECT id FROM users WHERE email = :email LIMIT 1',
    { type: QueryTypes.SELECT, transaction, replacements: { email } },
  );
  return inserted?.id ?? null;
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();

      const [ownerRow] = await queryInterface.sequelize.query(
        'SELECT id FROM users WHERE email = :email LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { email: OWNER_EMAIL } },
      );
      if (!ownerRow?.id) {
        throw new Error('Networking metrics demo seed requires mia@gigvora.com to exist.');
      }
      const ownerId = ownerRow.id;

      const [workspaceRow] = await queryInterface.sequelize.query(
        'SELECT id FROM provider_workspaces WHERE slug = :slug LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { slug: WORKSPACE_SLUG } },
      );

      let workspaceId = workspaceRow?.id ?? null;
      if (!workspaceId) {
        await queryInterface.bulkInsert(
          'provider_workspaces',
          [
            {
              ownerId,
              name: 'Networking Velocity Lab',
              slug: WORKSPACE_SLUG,
              type: 'company',
              timezone: 'America/New_York',
              defaultCurrency: 'USD',
              intakeEmail: 'velocity-lab@gigvora.example',
              isActive: true,
              settings: { focus: 'networking-demo' },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
        const [insertedWorkspace] = await queryInterface.sequelize.query(
          'SELECT id FROM provider_workspaces WHERE slug = :slug LIMIT 1',
          { type: QueryTypes.SELECT, transaction, replacements: { slug: WORKSPACE_SLUG } },
        );
        workspaceId = insertedWorkspace?.id ?? null;
      }

      if (!workspaceId) {
        throw new Error('Unable to resolve networking velocity workspace.');
      }

      const participantIds = {};
      for (const participant of PARTICIPANTS) {
        const id = await ensureUser(queryInterface, transaction, participant);
        if (!id) {
          throw new Error(`Failed to seed participant ${participant.email}`);
        }
        participantIds[participant.email] = id;
      }

      const [existingSession] = await queryInterface.sequelize.query(
        'SELECT id FROM networking_sessions WHERE slug = :slug LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { slug: SESSION_SLUG } },
      );
      if (existingSession?.id) {
        return;
      }

      await queryInterface.bulkInsert(
        'networking_sessions',
        [
          {
            companyId: workspaceId,
            createdById: ownerId,
            updatedById: ownerId,
            title: 'Executive Speed Networking Lab',
            slug: SESSION_SLUG,
            description:
              'Invite-only rotations pairing venture-backed founders with talent partners to accelerate warm introductions.',
            status: 'completed',
            visibility: 'workspace',
            format: 'speed_networking',
            accessType: 'paid',
            priceCents: 3500,
            currency: 'USD',
            startTime: new Date('2024-02-14T17:00:00Z'),
            endTime: new Date('2024-02-14T18:00:00Z'),
            sessionLengthMinutes: 60,
            rotationDurationSeconds: 300,
            joinLimit: 48,
            waitlistLimit: 20,
            registrationOpensAt: new Date('2024-01-30T16:00:00Z'),
            registrationClosesAt: new Date('2024-02-13T23:59:00Z'),
            requiresApproval: true,
            lobbyInstructions:
              'Join 10 minutes early for sponsor intros. Keep cameras on and share one actionable ask in the first rotation.',
            followUpActions: { surveyEnabled: true, recommendedCadenceDays: 2 },
            hostControls: { analyticsSidebar: true, allowHostBroadcast: true },
            attendeeTools: { businessCards: true, followUpReminders: true },
            penaltyRules: { noShowThreshold: 2, cooldownDays: 14, penaltyWeight: 2 },
            monetization: { actualSpendCents: 12000, targetSpendCents: 9000, sponsors: ['Summit Partners'] },
            videoConfig: { provider: 'gigvora-video', mode: 'peer_to_peer', slotDurationSeconds: 300 },
            videoTelemetry: { bitrateAvg: 820, packetLoss: 0.4 },
            showcaseConfig: {
              heroImage: 'https://cdn.gigvora.example.com/assets/networking-lab.jpg',
              sessionHighlights: ['VP + founder rotations', 'Live sponsor introductions', 'AI follow-up prompts'],
              hostTips: ['Keep sponsor CTA tight between rotations.', 'Mention premium concierge follow-ups in closing.'],
            },
            metadata: { seed: 'networking-session-metrics-demo' },
            publishedAt: new Date('2024-01-28T16:00:00Z'),
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      const [sessionRow] = await queryInterface.sequelize.query(
        'SELECT id FROM networking_sessions WHERE slug = :slug LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { slug: SESSION_SLUG } },
      );
      const sessionId = sessionRow?.id;
      if (!sessionId) {
        throw new Error('Failed to insert networking session for metrics demo.');
      }

      const rotations = [
        {
          rotationNumber: 1,
          durationSeconds: 300,
          startTime: new Date('2024-02-14T17:05:00Z'),
          endTime: new Date('2024-02-14T17:10:00Z'),
          seatingPlan: { tables: 8 },
          hostNotes: 'Warm-up round: founders with fractional talent partners.',
          pairingSeed: 'seed-velocity-1',
          status: 'completed',
        },
        {
          rotationNumber: 2,
          durationSeconds: 300,
          startTime: new Date('2024-02-14T17:12:00Z'),
          endTime: new Date('2024-02-14T17:17:00Z'),
          seatingPlan: { tables: 8 },
          hostNotes: 'Switch mentors with demand-gen leads.',
          pairingSeed: 'seed-velocity-2',
          status: 'completed',
        },
        {
          rotationNumber: 3,
          durationSeconds: 300,
          startTime: new Date('2024-02-14T17:19:00Z'),
          endTime: new Date('2024-02-14T17:24:00Z'),
          seatingPlan: { tables: 8 },
          hostNotes: 'Investor + founder closing round.',
          pairingSeed: 'seed-velocity-3',
          status: 'completed',
        },
      ].map((rotation) => ({ ...rotation, sessionId, createdAt: now, updatedAt: now }));

      await queryInterface.bulkInsert('networking_session_rotations', rotations, { transaction });

      const signups = [
        {
          participantEmail: 'mentor.avery@gigvora.example',
          participantName: 'Avery Chen',
          participantId: participantIds['mentor.avery@gigvora.example'],
          status: 'completed',
          source: 'host',
          seatNumber: 12,
          joinUrl: 'https://events.gigvora.example/sessions/velocity/avery',
          videoSessionId: 'velocity-lab-avery',
          checkedInAt: new Date('2024-02-14T16:55:00Z'),
          completedAt: new Date('2024-02-14T18:00:00Z'),
          noShowCount: 0,
          penaltyCount: 0,
          profileSharedCount: 3,
          connectionsSaved: 5,
          messagesSent: 7,
          followUpsScheduled: 3,
          satisfactionScore: 4.9,
          feedbackNotes: 'Booked two follow-ups with healthtech founders.',
          businessCardSnapshot: { company: 'Summit Labs', role: 'Head of Talent Partnerships' },
          profileSnapshot: { headline: 'Mentor & Talent Strategist', timezone: 'America/Los_Angeles' },
          metadata: { lastFollowUpAt: '2024-02-15T16:00:00Z' },
          purchaseCents: 3500,
          purchaseCurrency: 'USD',
          paymentStatus: 'paid',
          bookedAt: new Date('2024-01-31T09:15:00Z'),
        },
        {
          participantEmail: 'founder.niko@gigvora.example',
          participantName: 'Niko Patel',
          participantId: participantIds['founder.niko@gigvora.example'],
          status: 'completed',
          source: 'self',
          seatNumber: 18,
          joinUrl: 'https://events.gigvora.example/sessions/velocity/niko',
          videoSessionId: 'velocity-lab-niko',
          checkedInAt: new Date('2024-02-14T16:53:00Z'),
          completedAt: new Date('2024-02-14T17:58:00Z'),
          noShowCount: 0,
          penaltyCount: 0,
          profileSharedCount: 2,
          connectionsSaved: 3,
          messagesSent: 5,
          followUpsScheduled: 2,
          satisfactionScore: 4.6,
          feedbackNotes: 'Great fit with Avery. Need sponsor deck template.',
          businessCardSnapshot: { company: 'Northshore Robotics', role: 'Co-founder & CEO' },
          profileSnapshot: { headline: 'Robotics founder scaling GTM', timezone: 'America/Chicago' },
          metadata: { lastFollowUpAt: '2024-02-15T14:00:00Z' },
          purchaseCents: 3500,
          purchaseCurrency: 'USD',
          paymentStatus: 'paid',
          bookedAt: new Date('2024-02-01T11:22:00Z'),
        },
        {
          participantEmail: 'ops.rhea@gigvora.example',
          participantName: 'Rhea Singh',
          participantId: participantIds['ops.rhea@gigvora.example'],
          status: 'checked_in',
          source: 'referral',
          seatNumber: 5,
          joinUrl: 'https://events.gigvora.example/sessions/velocity/rhea',
          videoSessionId: 'velocity-lab-rhea',
          checkedInAt: new Date('2024-02-14T16:58:00Z'),
          completedAt: new Date('2024-02-14T17:52:00Z'),
          noShowCount: 0,
          penaltyCount: 0,
          profileSharedCount: 1,
          connectionsSaved: 2,
          messagesSent: 3,
          followUpsScheduled: 1,
          satisfactionScore: 4.2,
          feedbackNotes: 'Needs follow-up with sponsor success manager.',
          businessCardSnapshot: { company: 'Fractional Ops Studio', role: 'Partner' },
          profileSnapshot: { headline: 'Fractional COO for B2B SaaS', timezone: 'America/New_York' },
          metadata: { lastFollowUpAt: '2024-02-15T12:30:00Z' },
          purchaseCents: 0,
          purchaseCurrency: 'USD',
          paymentStatus: 'unpaid',
          bookedAt: new Date('2024-02-05T10:45:00Z'),
        },
        {
          participantEmail: 'advisor.lina@gigvora.example',
          participantName: 'Lina Morales',
          participantId: participantIds['advisor.lina@gigvora.example'],
          status: 'waitlisted',
          source: 'self',
          seatNumber: null,
          joinUrl: null,
          videoSessionId: null,
          checkedInAt: null,
          completedAt: null,
          noShowCount: 0,
          penaltyCount: 0,
          profileSharedCount: 0,
          connectionsSaved: 0,
          messagesSent: 0,
          followUpsScheduled: 0,
          satisfactionScore: null,
          feedbackNotes: null,
          businessCardSnapshot: { company: 'Growth Advisors Co.', role: 'Partner' },
          profileSnapshot: { headline: 'Advisor for venture studios', timezone: 'Europe/London' },
          metadata: { waitlistPriority: 2 },
          purchaseCents: 3500,
          purchaseCurrency: 'USD',
          paymentStatus: 'pending',
          bookedAt: new Date('2024-02-10T08:15:00Z'),
        },
      ].map((signup) => ({
        ...signup,
        sessionId,
        createdAt: now,
        updatedAt: now,
      }));

      await queryInterface.bulkInsert('networking_session_signups', signups, { transaction });

      const signupRows = await queryInterface.sequelize.query(
        'SELECT id, participantEmail FROM networking_session_signups WHERE sessionId = :sessionId',
        { type: QueryTypes.SELECT, transaction, replacements: { sessionId } },
      );

      const signupIdByEmail = new Map(signupRows.map((row) => [row.participantEmail, row.id]));

      const connections = [
        {
          sessionId,
          sourceSignupId: signupIdByEmail.get('mentor.avery@gigvora.example'),
          targetSignupId: signupIdByEmail.get('founder.niko@gigvora.example'),
          sourceParticipantId: participantIds['mentor.avery@gigvora.example'],
          targetParticipantId: participantIds['founder.niko@gigvora.example'],
          counterpartName: 'Niko Patel',
          counterpartEmail: 'founder.niko@gigvora.example',
          connectionType: 'connect',
          status: 'connected',
          notes: 'Shared product ops playbook and sponsor intro.',
          firstInteractedAt: new Date('2024-02-14T17:05:00Z'),
          followUpAt: new Date('2024-02-16T16:00:00Z'),
          metadata: { source: 'velocity-lab', priority: 'high' },
          createdById: ownerId,
        },
        {
          sessionId,
          sourceSignupId: signupIdByEmail.get('founder.niko@gigvora.example'),
          targetSignupId: signupIdByEmail.get('ops.rhea@gigvora.example'),
          sourceParticipantId: participantIds['founder.niko@gigvora.example'],
          targetParticipantId: participantIds['ops.rhea@gigvora.example'],
          counterpartName: 'Rhea Singh',
          counterpartEmail: 'ops.rhea@gigvora.example',
          connectionType: 'follow',
          status: 'follow_up',
          notes: 'Schedule sponsor success workshop.',
          firstInteractedAt: new Date('2024-02-14T17:18:00Z'),
          followUpAt: new Date('2024-02-17T15:00:00Z'),
          metadata: { cadence: '48h', surfacedBy: 'ai-prompt' },
          createdById: ownerId,
        },
      ].map((connection) => ({ ...connection, createdAt: now, updatedAt: now }));

      await queryInterface.bulkInsert('networking_connections', connections, { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [sessionRow] = await queryInterface.sequelize.query(
        'SELECT id FROM networking_sessions WHERE slug = :slug LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { slug: SESSION_SLUG } },
      );
      if (!sessionRow?.id) {
        return;
      }
      const sessionId = sessionRow.id;

      await queryInterface.bulkDelete('networking_connections', { sessionId }, { transaction });
      await queryInterface.bulkDelete('networking_session_signups', { sessionId }, { transaction });
      await queryInterface.bulkDelete('networking_session_rotations', { sessionId }, { transaction });
      await queryInterface.bulkDelete('networking_sessions', { id: sessionId }, { transaction });
    });
  },
};
