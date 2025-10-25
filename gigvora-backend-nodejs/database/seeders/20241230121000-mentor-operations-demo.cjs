'use strict';

const { QueryTypes } = require('sequelize');

const mentorEmail = 'mentor@gigvora.com';
const availabilityNotes =
  'Tuesdays and Thursdays reserved for deep dives. Friday mornings available for async reviews.';

async function resolveMentorId(queryInterface, transaction) {
  const [row] = await queryInterface.sequelize.query(
    'SELECT id FROM users WHERE email = :email LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { email: mentorEmail },
    },
  );

  if (!row?.id) {
    throw new Error(`Mentor operations demo seed requires ${mentorEmail} to exist.`);
  }

  return Number(row.id);
}

async function ensureMentorProfile(queryInterface, transaction, mentorId) {
  const [profile] = await queryInterface.sequelize.query(
    'SELECT id FROM mentor_profiles WHERE userId = :mentorId OR slug = :slug LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { mentorId, slug: 'jordan-patel' },
    },
  );

  if (profile?.id) {
    await queryInterface.bulkUpdate(
      'mentor_profiles',
      {
        userId: mentorId,
        availabilityNotes,
        responseTimeHours: 6,
        testimonialHighlight:
          'Mentorship programme unlocked our product launch narrative in under six weeks.',
        testimonialHighlightAuthor: 'Linh Tran, COO at Pathlight',
        updatedAt: new Date(),
      },
      { id: Number(profile.id) },
      { transaction },
    );
    return;
  }

  const now = new Date();
  await queryInterface.bulkInsert(
    'mentor_profiles',
    [
      {
        userId: mentorId,
        slug: 'mentor-operations-demo',
        name: 'Avery Mentor',
        headline: 'Product leadership mentor & explorer founding partner',
        bio: 'Guides founders and operators through storytelling, activation, and GTM experiments.',
        region: 'London, United Kingdom',
        discipline: 'Product Leadership',
        expertise: ['Roadmapping', 'Storytelling', 'Leadership coaching'],
        sessionFeeAmount: 280,
        sessionFeeCurrency: 'GBP',
        priceTier: 'tier_growth',
        availabilityStatus: 'open',
        availabilityNotes,
        responseTimeHours: 6,
        reviewCount: 48,
        rating: 4.93,
        verificationBadge: 'Verified mentor',
        testimonialHighlight:
          'Mentorship programme unlocked our product launch narrative in under six weeks.',
        testimonialHighlightAuthor: 'Linh Tran, COO at Pathlight',
        packages: [
          {
            name: 'Leadership Pod (6 weeks)',
            description: 'Weekly 60-minute calls with async reviews and stakeholder prep.',
            currency: 'GBP',
            price: 1800,
          },
          {
            name: 'Executive Storytelling Sprint',
            description: 'Three-session package focused on board narrative and capital raises.',
            currency: 'GBP',
            price: 950,
          },
        ],
        promoted: true,
        rankingScore: 96.5,
        lastActiveAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ],
    { transaction },
  );
}

function withTimestamps(entries) {
  const now = new Date();
  return entries.map((entry) => ({ ...entry, createdAt: now, updatedAt: now }));
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const mentorId = await resolveMentorId(queryInterface, transaction);
      await ensureMentorProfile(queryInterface, transaction, mentorId);

      const tables = [
        'mentor_availability_slots',
        'mentor_packages',
        'mentor_bookings',
        'mentor_clients',
        'mentor_events',
        'mentor_support_tickets',
        'mentor_messages',
        'mentor_verification_documents',
        'mentor_verifications',
        'mentor_wallet_transactions',
        'mentor_invoices',
        'mentor_payouts',
      ];

      for (const table of tables) {
        await queryInterface.bulkDelete(table, { mentorId }, { transaction });
      }

      const now = new Date();
      const twoDays = 2 * 24 * 60 * 60 * 1000;
      const fiveDays = 5 * 24 * 60 * 60 * 1000;
      const lastWeek = 7 * 24 * 60 * 60 * 1000;

      await queryInterface.bulkInsert(
        'mentor_availability_slots',
        withTimestamps([
          {
            mentorId,
            dayOfWeek: 'Tuesday',
            startTime: new Date(now.getTime() + twoDays).toISOString(),
            endTime: new Date(now.getTime() + twoDays + 60 * 60 * 1000).toISOString(),
            format: '1:1 session',
            capacity: 1,
          },
          {
            mentorId,
            dayOfWeek: 'Thursday',
            startTime: new Date(now.getTime() + fiveDays).toISOString(),
            endTime: new Date(now.getTime() + fiveDays + 60 * 60 * 1000).toISOString(),
            format: 'Workshop',
            capacity: 6,
          },
        ]),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'mentor_packages',
        withTimestamps([
          {
            mentorId,
            name: 'Leadership accelerator',
            description: 'Hybrid mentorship sprint focused on influence and narrative design.',
            sessions: 6,
            price: 1800,
            currency: 'GBP',
            format: 'Hybrid',
            outcome: 'Executive-ready promotion narrative and stakeholder engagement map.',
          },
          {
            mentorId,
            name: 'Product growth audit',
            description: 'Three-session programme reviewing activation flows and GTM positioning.',
            sessions: 3,
            price: 720,
            currency: 'GBP',
            format: 'Virtual',
            outcome: 'Prioritised growth experiments with messaging templates.',
          },
        ]),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'mentor_bookings',
        withTimestamps([
          {
            mentorId,
            menteeName: 'Alex Rivera',
            menteeRole: 'Director of Product',
            packageName: 'Leadership accelerator',
            focus: 'Influence & stakeholder mapping',
            scheduledAt: new Date(now.getTime() + twoDays).toISOString(),
            status: 'Scheduled',
            price: 1800,
            currency: 'GBP',
            paymentStatus: 'Paid',
            channel: 'Explorer',
            segment: 'active',
            conferenceLink: 'https://meet.gigvora.com/jordan/leadership',
            notes: 'Bring promotion narrative draft and stakeholder map to review.',
          },
          {
            mentorId,
            menteeName: 'Linh Tran',
            menteeRole: 'Head of Product Marketing',
            packageName: 'Product growth audit',
            focus: 'Activation storytelling',
            scheduledAt: new Date(now.getTime() + fiveDays).toISOString(),
            status: 'Awaiting pre-work',
            price: 720,
            currency: 'GBP',
            paymentStatus: 'Pending',
            channel: 'Referral',
            segment: 'pending',
            conferenceLink: 'https://meet.gigvora.com/jordan/growth',
            notes: 'Share Loom demo of latest onboarding flow before session.',
          },
        ]),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'mentor_clients',
        withTimestamps([
          {
            mentorId,
            name: 'Alex Rivera',
            company: 'Northwind Labs',
            role: 'Director of Product',
            status: 'Active',
            tier: 'Flagship',
            value: 1800,
            currency: 'GBP',
            channel: 'Explorer',
            tags: ['Leadership', 'Executive influence'],
            notes: 'Preparing for QBR presentation with executive team.',
            onboardedAt: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString(),
            lastSessionAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            nextSessionAt: new Date(now.getTime() + twoDays).toISOString(),
          },
          {
            mentorId,
            name: 'Linh Tran',
            company: 'Fluxwave',
            role: 'Head of Product Marketing',
            status: 'Onboarding',
            tier: 'Growth',
            value: 720,
            currency: 'GBP',
            channel: 'Referral',
            tags: ['Activation'],
            notes: 'Awaiting positioning canvas upload before kickoff.',
            onboardedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            nextSessionAt: new Date(now.getTime() + fiveDays).toISOString(),
          },
        ]),
        { transaction },
      );

      const clients = await queryInterface.sequelize.query(
        'SELECT id, name FROM mentor_clients WHERE mentorId = :mentorId ORDER BY id ASC',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { mentorId },
        },
      );
      const clientMap = new Map(clients.map((row) => [row.name, Number(row.id)]));

      await queryInterface.bulkInsert(
        'mentor_events',
        withTimestamps([
          {
            mentorId,
            clientId: clientMap.get('Alex Rivera') ?? null,
            title: 'Leadership accelerator session',
            type: 'Session',
            status: 'Scheduled',
            startsAt: new Date(now.getTime() + twoDays).toISOString(),
            endsAt: new Date(now.getTime() + twoDays + 60 * 60 * 1000).toISOString(),
            location: 'Zoom',
            notes: 'Focus on executive stakeholder mapping.',
          },
          {
            mentorId,
            clientId: clientMap.get('Linh Tran') ?? null,
            title: 'Async review window',
            type: 'Office hours',
            status: 'Awaiting prep',
            startsAt: new Date(now.getTime() + fiveDays + 12 * 60 * 60 * 1000).toISOString(),
            endsAt: new Date(now.getTime() + fiveDays + 13 * 60 * 60 * 1000).toISOString(),
            location: 'Loom',
            notes: 'Review experiment backlog videos.',
          },
        ]),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'mentor_support_tickets',
        withTimestamps([
          {
            mentorId,
            subject: 'Need to resend Explorer onboarding sequence',
            category: 'Automation',
            priority: 'Normal',
            status: 'Awaiting mentor',
            reference: 'SUP-4381',
            notes: 'Support requested updated mentee onboarding flow.',
            submittedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
            respondedAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
          },
          {
            mentorId,
            subject: 'Invoice syncing to Xero',
            category: 'Finance',
            priority: 'High',
            status: 'Open',
            reference: 'SUP-4374',
            notes: 'Explorer payout awaiting reconciliation.',
            submittedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
          },
        ]),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'mentor_messages',
        withTimestamps([
          {
            mentorId,
            senderName: 'Priya Desai',
            channel: 'Explorer',
            status: 'Unread',
            subject: 'Follow-up homework for session 2',
            preview: 'Attached updated influence map and leadership narrative draft.',
            tags: ['Leadership accelerator'],
            receivedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
          },
          {
            mentorId,
            senderName: 'Chris Osei',
            channel: 'Email',
            status: 'Read',
            subject: 'Async loom review notes',
            preview: 'Added context on product analytics rollout for upcoming session.',
            tags: ['Product growth audit'],
            receivedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
          },
        ]),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'mentor_verifications',
        withTimestamps([
          {
            mentorId,
            status: 'In review',
            lastSubmittedAt: new Date(now.getTime() - lastWeek).toISOString(),
            notes: 'Compliance team validating proof of address.',
          },
        ]),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'mentor_verification_documents',
        withTimestamps([
          {
            mentorId,
            type: 'Passport',
            status: 'Approved',
            reference: 'UK-PS-4820',
            storageKey: 'identity/mentor/passport.pdf',
            fileName: 'passport.pdf',
            contentType: 'application/pdf',
            fileSize: 24576,
            submittedAt: new Date(now.getTime() - 3 * lastWeek).toISOString(),
            storedAt: new Date(now.getTime() - 3 * lastWeek).toISOString(),
          },
          {
            mentorId,
            type: 'Business certificate',
            status: 'Action required',
            reference: 'BC-10291',
            notes: 'Please upload certified translation.',
            storageKey: 'identity/mentor/business-cert.pdf',
            fileName: 'business-cert.pdf',
            contentType: 'application/pdf',
            fileSize: 32768,
            submittedAt: new Date(now.getTime() - lastWeek).toISOString(),
          },
        ]),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'mentor_wallet_transactions',
        withTimestamps([
          {
            mentorId,
            type: 'Mentorship earning',
            status: 'Completed',
            amount: 1800,
            currency: 'GBP',
            reference: 'TXN-2024-118',
            description: 'Leadership accelerator session payment',
            occurredAt: new Date(now.getTime() - twoDays).toISOString(),
          },
          {
            mentorId,
            type: 'Payout',
            status: 'Processing',
            amount: -1200,
            currency: 'GBP',
            reference: 'TXN-2024-119',
            description: 'Partial payout via Explorer wallet',
            occurredAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
          },
        ]),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'mentor_invoices',
        withTimestamps([
          {
            mentorId,
            reference: 'INV-2024-11',
            menteeName: 'Fluxwave Ltd',
            amount: 720,
            currency: 'GBP',
            status: 'Sent',
            issuedOn: new Date(now.getTime() - twoDays).toISOString(),
            dueOn: new Date(now.getTime() + fiveDays).toISOString(),
            notes: 'Includes async review add-on.',
          },
          {
            mentorId,
            reference: 'INV-2024-12',
            menteeName: 'Northwind Labs',
            amount: 1800,
            currency: 'GBP',
            status: 'Paid',
            issuedOn: new Date(now.getTime() - fiveDays).toISOString(),
            dueOn: new Date(now.getTime() - twoDays).toISOString(),
          },
        ]),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'mentor_payouts',
        withTimestamps([
          {
            mentorId,
            reference: 'PAYOUT-2024-44',
            amount: 1200,
            currency: 'GBP',
            status: 'Processing',
            scheduledFor: new Date(now.getTime() + twoDays).toISOString(),
            notes: 'Explorer payout for November sessions.',
          },
          {
            mentorId,
            reference: 'PAYOUT-2024-43',
            amount: 950,
            currency: 'GBP',
            status: 'Paid',
            scheduledFor: new Date(now.getTime() - fiveDays).toISOString(),
            processedAt: new Date(now.getTime() - twoDays).toISOString(),
          },
        ]),
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const mentorId = await resolveMentorId(queryInterface, transaction);
      const tables = [
        'mentor_payouts',
        'mentor_invoices',
        'mentor_wallet_transactions',
        'mentor_verification_documents',
        'mentor_verifications',
        'mentor_messages',
        'mentor_support_tickets',
        'mentor_events',
        'mentor_clients',
        'mentor_bookings',
        'mentor_packages',
        'mentor_availability_slots',
      ];

      for (const table of tables) {
        await queryInterface.bulkDelete(table, { mentorId }, { transaction });
      }
    });
  },
};
