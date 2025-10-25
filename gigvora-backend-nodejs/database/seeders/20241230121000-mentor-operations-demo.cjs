'use strict';

const crypto = require('crypto');
const { QueryTypes } = require('sequelize');

const mentorEmail = 'mentor@gigvora.com';
const availabilityNotes =
  'Tuesdays and Thursdays reserved for deep dives. Friday mornings available for async reviews.';

const SECRET_KEY = crypto
  .createHash('sha256')
  .update(
    String(process.env.AI_PROVIDER_SECRET || process.env.APP_SECRET || process.env.JWT_SECRET || 'gigvora-dev-secret'),
  )
  .digest();

function encryptSeedSecret(value) {
  if (!value) {
    return null;
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', SECRET_KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${Buffer.concat([iv, tag, ciphertext]).toString('base64')}`;
}

function fingerprintSeedSecret(value) {
  if (!value) {
    return null;
  }
  const hash = crypto.createHash('sha256').update(String(value)).digest('hex');
  return `${hash.slice(0, 8)}…${hash.slice(-8)}`;
}

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
        'mentor_system_preferences',
        'mentor_settings',
        'mentor_metric_reporting_settings',
        'mentor_metric_widgets',
        'mentor_ad_campaigns',
        'mentor_orders',
        'mentor_hub_spotlights',
        'mentor_hub_resources',
        'mentor_hub_actions',
        'mentor_hub_updates',
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
      const apiKeySeed = 'mentor-mission-control-demo-key';
      const apiKeyCiphertext = encryptSeedSecret(apiKeySeed);
      const apiKeyFingerprint = fingerprintSeedSecret(apiKeySeed);

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

      await queryInterface.bulkInsert(
        'mentor_hub_updates',
        withTimestamps([
          {
            mentorId,
            title: 'Explorer leads now include availability preferences',
            summary: 'Review your Explorer lead queue and tailor responses with the new scheduling preferences captured at request.',
            category: 'Explorer',
            link: 'https://mentor.gigvora.com/explorer/leads',
            status: 'Published',
            publishedAt: new Date(now.getTime() - twoDays).toISOString(),
          },
          {
            mentorId,
            title: 'Async recap template refresh',
            summary: 'Save time on follow-ups with the new async recap template that ships AI generated summaries to mentees.',
            category: 'Operations',
            link: 'https://mentor.gigvora.com/resources/recap-template',
            status: 'Published',
            publishedAt: new Date(now.getTime() - fiveDays).toISOString(),
          },
          {
            mentorId,
            title: 'Launch holiday office hours promotion',
            summary: 'Draft your December promo and push to Explorer and newsletter audiences before Friday to capture mentee demand.',
            category: 'Growth',
            link: 'https://mentor.gigvora.com/creation-studio/promotions',
            status: 'Draft',
            publishedAt: null,
          },
        ]),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'mentor_hub_actions',
        withTimestamps([
          {
            mentorId,
            label: 'Approve Explorer onboarding sequence update',
            owner: 'Avery Mentor',
            dueAt: new Date(now.getTime() + twoDays).toISOString(),
            status: 'In progress',
            priority: 'High',
          },
          {
            mentorId,
            label: 'Record new testimonial video',
            owner: 'Studio Team',
            dueAt: new Date(now.getTime() + fiveDays).toISOString(),
            status: 'Not started',
            priority: 'Medium',
          },
          {
            mentorId,
            label: 'Publish async recap automation playbook',
            owner: 'Operations',
            dueAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
            status: 'Awaiting mentor review',
            priority: 'High',
          },
        ]),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'mentor_hub_resources',
        withTimestamps([
          {
            mentorId,
            title: 'Explorer lead qualification checklist',
            description: 'Step-by-step checklist to qualify Explorer leads within 24 hours.',
            type: 'Guide',
            link: 'https://cdn.gigvora.com/resources/explorer-qualification.pdf',
            thumbnail: 'https://cdn.gigvora.com/thumbnails/explorer-qualification.png',
            tags: ['Explorer', 'Sales'],
            updatedAtExternal: new Date(now.getTime() - twoDays).toISOString(),
          },
          {
            mentorId,
            title: 'Async recap email template',
            description: 'Copy/paste template for async recaps with dynamic placeholders.',
            type: 'Template',
            link: 'https://cdn.gigvora.com/resources/async-recap-template.docx',
            thumbnail: null,
            tags: ['Operations', 'Automation'],
            updatedAtExternal: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
          },
        ]),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'mentor_hub_spotlights',
        withTimestamps([
          {
            mentorId,
            title: 'Book a leadership deep dive',
            description: 'Lock in a 90-minute strategy session to architect your 2025 leadership roadmap.',
            videoUrl: 'https://video.gigvora.com/mentor/leadership-deep-dive.mp4',
            ctaLabel: 'Schedule session',
            ctaLink: 'https://mentor.gigvora.com/book/leadership-deep-dive',
            thumbnailUrl: 'https://cdn.gigvora.com/thumbnails/leadership-deep-dive.png',
            backgroundGradient: 'linear-gradient(135deg,#1f3c88,#5c6bc0)',
          },
        ]),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'mentor_orders',
        withTimestamps([
          {
            mentorId,
            reference: 'ORD-2024-991',
            mentee: 'Pathlight Labs',
            package: 'Leadership accelerator',
            amount: 5400,
            currency: 'GBP',
            status: 'Awaiting payment',
            channel: 'Explorer',
            orderedAt: new Date(now.getTime() - twoDays).toISOString(),
            fulfillmentStatus: 'In progress',
            notes: 'Procurement completing vendor onboarding.',
            invoiceId: 'INV-2024-12',
          },
          {
            mentorId,
            reference: 'ORD-2024-992',
            mentee: 'Fluxwave',
            package: 'Async growth review',
            amount: 1250,
            currency: 'GBP',
            status: 'Paid',
            channel: 'Referral',
            orderedAt: new Date(now.getTime() - fiveDays).toISOString(),
            fulfillmentStatus: 'Completed',
            notes: 'Delivered recap and experimentation backlog.',
            invoiceId: 'INV-2024-11',
          },
        ]),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'mentor_ad_campaigns',
        withTimestamps([
          {
            mentorId,
            name: 'Explorer retargeting Q4',
            objective: 'Lead generation',
            status: 'Active',
            budget: 1500,
            spend: 620,
            impressions: 18500,
            clicks: 940,
            conversions: 42,
            startDate: new Date(now.getTime() - fiveDays).toISOString(),
            endDate: new Date(now.getTime() + fiveDays).toISOString(),
            placements: ['LinkedIn', 'Twitter'],
            cta: 'Book discovery call',
            creativeUrl: 'https://cdn.gigvora.com/creatives/explorer-q4.png',
            thumbnail: 'https://cdn.gigvora.com/thumbnails/explorer-q4-thumb.png',
            audience: 'Product leaders in EU & UK',
          },
          {
            mentorId,
            name: 'Async mentorship evergreen',
            objective: 'Awareness',
            status: 'Draft',
            budget: 800,
            spend: 0,
            impressions: 0,
            clicks: 0,
            conversions: 0,
            startDate: null,
            endDate: null,
            placements: ['Newsletter'],
            cta: 'Download playbook',
            creativeUrl: 'https://cdn.gigvora.com/creatives/async-evergreen.pdf',
            thumbnail: null,
            audience: 'Operations leaders & Chiefs of Staff',
          },
        ]),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'mentor_metric_widgets',
        withTimestamps([
          {
            mentorId,
            name: 'Explorer lead-to-booking',
            value: 32,
            goal: 25,
            unit: '%',
            timeframe: 'Last 30 days',
            insight: 'Explorer conversion is trending 8% above last month.',
            trend: 6.5,
            variance: 3.1,
            samples: [20, 24, 28, 32],
          },
          {
            mentorId,
            name: 'Average response time',
            value: 3.4,
            goal: 4,
            unit: 'hrs',
            timeframe: 'Last 14 days',
            insight: 'Automation rules shaved 45 minutes off the average reply time.',
            trend: -0.6,
            variance: -0.3,
            samples: [4.8, 4.1, 3.6, 3.4],
          },
          {
            mentorId,
            name: 'Monthly recurring revenue',
            value: 9800,
            goal: 12000,
            unit: 'GBP',
            timeframe: 'Month to date',
            insight: 'Recurring revenue lifted 12% from retainer upgrades.',
            trend: 12.0,
            variance: 1.8,
            samples: [7200, 7800, 8400, 9800],
          },
        ]),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'mentor_metric_reporting_settings',
        withTimestamps([
          {
            mentorId,
            cadence: 'Weekly',
            delivery: 'Email & Slack',
            recipients: ['mentor@gigvora.com', 'ops@gigvora.com'],
            nextDispatchAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'mentor_settings',
        withTimestamps([
          {
            mentorId,
            settings: {
              contactEmail: 'mentor@gigvora.com',
              supportEmail: 'support@gigvora.com',
              website: 'https://mentor.gigvora.com',
              timezone: 'Europe/London',
              availabilityLeadTimeHours: 24,
              bookingWindowDays: 45,
              autoAcceptReturning: true,
              doubleOptInIntroductions: true,
              calendlyLink: 'https://calendly.com/gigvora-mentor',
              videoGreeting: 'https://video.gigvora.com/mentor/intro.mp4',
              signature: 'Avery Mentor — Product leadership partner',
              brandPrimaryColor: '#1f3c88',
              brandSecondaryColor: '#5c6bc0',
              heroTagline: 'Mentorship that ships outcomes.',
              attachments: [
                {
                  id: 'playbook',
                  label: 'Mentor playbook',
                  url: 'https://cdn.gigvora.com/docs/mentor-playbook.pdf',
                  type: 'Document',
                },
              ],
              confirmationEmailTemplate: 'Thanks for booking! Here is what to prepare…',
              reminderSmsTemplate: 'Reminder: your session with Avery starts in 30 minutes.',
              sendAgendaSlack: true,
              autoDispatchRecap: true,
            },
          },
        ]),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'mentor_system_preferences',
        withTimestamps([
          {
            mentorId,
            preferences: {
              notifications: {
                explorerLeads: true,
                orders: true,
                payouts: true,
                support: false,
              },
              theme: 'midnight',
              language: 'en-GB',
              aiAssistant: {
                enabled: true,
                autopilot: false,
                tone: 'supportive strategist',
              },
              security: {
                mfaEnabled: true,
                sessionTimeoutMinutes: 90,
                deviceApprovals: 3,
              },
              api: {
                keyPreview: apiKeyFingerprint,
                lastRotatedAt: new Date(now.getTime() - twoDays).toISOString(),
              },
            },
            apiKeyCiphertext: apiKeyCiphertext,
            apiKeyFingerprint: apiKeyFingerprint,
            apiKeyLastRotatedAt: new Date(now.getTime() - twoDays).toISOString(),
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
        'mentor_system_preferences',
        'mentor_settings',
        'mentor_metric_reporting_settings',
        'mentor_metric_widgets',
        'mentor_ad_campaigns',
        'mentor_orders',
        'mentor_hub_spotlights',
        'mentor_hub_resources',
        'mentor_hub_actions',
        'mentor_hub_updates',
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
