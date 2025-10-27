'use strict';

const { QueryTypes } = require('sequelize');

const SEED_KEY = 'admin-war-room-demo';
const TELEMETRY_THREAD_SIGNATURE = `${SEED_KEY}:telemetry-thread`;
const SUPPORT_THREAD_DEFINITIONS = [
  {
    signature: `${SEED_KEY}:support-thread-primary`,
    subject: 'Trust escalation: Moderation backlog',
    metadata: { channelSlug: 'support-escalations', channelName: 'Support escalations' },
  },
  {
    signature: `${SEED_KEY}:support-thread-vip`,
    subject: 'VIP retention response channel',
    metadata: { channelSlug: 'vip-support', channelName: 'VIP support' },
  },
];

const SECURITY_EVENT_SIGNATURE = `${SEED_KEY}:security-event`;
const ANALYTICS_EVENT_SIGNATURE = `${SEED_KEY}:analytics`;
const GDPR_SIGNATURE = `${SEED_KEY}:gdpr-settings`;
const EVENT_SLUG = 'executive-ops-briefing';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();

      const [user] = await queryInterface.sequelize.query(
        'SELECT id FROM users ORDER BY id ASC LIMIT 1',
        { type: QueryTypes.SELECT, transaction },
      );

      if (!user?.id) {
        throw new Error('Admin war room demo seed requires at least one user.');
      }

      const userId = Number(user.id);

      const ensureThread = async ({ signature, subject, channelType = 'group', metadata = {}, lastMessageAt = now }) => {
        const where = queryInterface.sequelize.where(
          queryInterface.sequelize.json('metadata.seedSignature'),
          signature,
        );
        let id = await queryInterface.rawSelect('message_threads', { where, transaction }, ['id']);
        if (!id) {
          await queryInterface.bulkInsert(
            'message_threads',
            [
              {
                subject,
                channelType,
                state: 'active',
                createdBy: userId,
                metadata: JSON.stringify({
                  seedKey: SEED_KEY,
                  seedSignature: signature,
                  ...metadata,
                }),
                lastMessageAt,
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
          id = await queryInterface.rawSelect('message_threads', { where, transaction }, ['id']);
        }
        if (!id) {
          throw new Error(`Failed to ensure message thread for ${signature}`);
        }
        return Number(id);
      };

      const telemetryThreadId = await ensureThread({
        signature: TELEMETRY_THREAD_SIGNATURE,
        subject: 'Executive war room feed',
        metadata: {
          channelSlug: 'executive-war-room',
          channelName: 'Executive war room',
          retentionDays: 45,
        },
        lastMessageAt: new Date(now.getTime() - 5 * 60 * 1000),
      });

      const telemetryMessages = [
        {
          body: 'Moderation backlog is trending +18% over the last hour; pulling duty managers into queue triage.',
          moderation: { status: 'pending_review', score: 0.88 },
          signature: `${SEED_KEY}:telemetry-message-1`,
        },
        {
          body: 'Support is coordinating with trust to clear VIP escalations before the morning status call.',
          moderation: { status: 'approved', score: 0.21 },
          signature: `${SEED_KEY}:telemetry-message-2`,
        },
        {
          body: 'Flagged AI summary escalated to manual review after auto-response warnings.',
          moderation: { status: 'escalated', score: 0.94 },
          signature: `${SEED_KEY}:telemetry-message-3`,
        },
        {
          body: 'Growth ops confirmed push notification throttle adjustments are live.',
          moderation: { status: 'approved', score: 0.09 },
          signature: `${SEED_KEY}:telemetry-message-4`,
        },
        {
          body: 'Community champions resolved 12 backlog conversations in the last 20 minutes.',
          moderation: { status: 'approved', score: 0.12 },
          signature: `${SEED_KEY}:telemetry-message-5`,
        },
        {
          body: 'Trust analytics flagged two partner API keys exceeding 80% utilisation.',
          moderation: { status: 'pending_review', score: 0.73 },
          signature: `${SEED_KEY}:telemetry-message-6`,
        },
      ];

      const firstTelemetryMessageWhere = queryInterface.sequelize.where(
        queryInterface.sequelize.json('metadata.seedSignature'),
        telemetryMessages[0].signature,
      );
      const existingTelemetryMessage = await queryInterface.rawSelect(
        'messages',
        { where: firstTelemetryMessageWhere, transaction },
        ['id'],
      );
      if (!existingTelemetryMessage) {
        const baseTime = now.getTime();
        await queryInterface.bulkInsert(
          'messages',
          telemetryMessages.map((message, index) => {
            const timestamp = new Date(baseTime - (index + 1) * 90_000);
            return {
              threadId: telemetryThreadId,
              senderId: userId,
              messageType: 'text',
              body: message.body,
              metadata: JSON.stringify({
                seedKey: SEED_KEY,
                seedSignature: message.signature,
                moderation: message.moderation,
              }),
              isEdited: false,
              editedAt: null,
              deletedAt: null,
              deliveredAt: timestamp,
              createdAt: timestamp,
              updatedAt: timestamp,
            };
          }),
          { transaction },
        );
      }

      const supportThreads = await Promise.all(
        SUPPORT_THREAD_DEFINITIONS.map((definition) =>
          ensureThread({
            signature: definition.signature,
            subject: definition.subject,
            metadata: definition.metadata,
            lastMessageAt: now,
          }),
        ),
      );

      const supportCaseWhere = queryInterface.sequelize.where(
        queryInterface.sequelize.json('metadata.seedSignature'),
        `${SEED_KEY}:support-case-primary`,
      );
      const existingSupportCase = await queryInterface.rawSelect(
        'support_cases',
        { where: supportCaseWhere, transaction },
        ['id'],
      );
      if (!existingSupportCase) {
        await queryInterface.bulkInsert(
          'support_cases',
          [
            {
              threadId: supportThreads[0],
              status: 'in_progress',
              priority: 'high',
              reason: 'Moderation backlog surge',
              metadata: JSON.stringify({
                seedKey: SEED_KEY,
                seedSignature: `${SEED_KEY}:support-case-primary`,
                sla: {
                  firstResponseTargetMinutes: 20,
                  firstResponseBreachedAt: new Date(now.getTime() - 50 * 60 * 1000).toISOString(),
                  escalatedAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
                },
              }),
              escalatedBy: userId,
              escalatedAt: new Date(now.getTime() - 55 * 60 * 1000),
              assignedTo: userId,
              assignedBy: userId,
              assignedAt: new Date(now.getTime() - 50 * 60 * 1000),
              firstResponseAt: new Date(now.getTime() - 40 * 60 * 1000),
              resolvedAt: null,
              resolvedBy: null,
              resolutionSummary: null,
              createdAt: new Date(now.getTime() - 70 * 60 * 1000),
              updatedAt: new Date(now.getTime() - 5 * 60 * 1000),
            },
            {
              threadId: supportThreads[1],
              status: 'waiting_on_customer',
              priority: 'urgent',
              reason: 'VIP onboarding response pending customer action',
              metadata: JSON.stringify({
                seedKey: SEED_KEY,
                seedSignature: `${SEED_KEY}:support-case-escalated`,
                sla: {
                  resolutionBreachedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
                  escalatedAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
                },
              }),
              escalatedBy: userId,
              escalatedAt: new Date(now.getTime() - 35 * 60 * 1000),
              assignedTo: userId,
              assignedBy: userId,
              assignedAt: new Date(now.getTime() - 32 * 60 * 1000),
              firstResponseAt: null,
              resolvedAt: null,
              resolvedBy: null,
              resolutionSummary: null,
              createdAt: new Date(now.getTime() - 45 * 60 * 1000),
              updatedAt: new Date(now.getTime() - 6 * 60 * 1000),
            },
          ],
          { transaction },
        );
      }

      const securityEventWhere = queryInterface.sequelize.where(
        queryInterface.sequelize.json('metadata.seedSignature'),
        SECURITY_EVENT_SIGNATURE,
      );
      const existingSecurityEvent = await queryInterface.rawSelect(
        'runtime_security_audit_events',
        { where: securityEventWhere, transaction },
        ['id'],
      );
      if (!existingSecurityEvent) {
        await queryInterface.bulkInsert(
          'runtime_security_audit_events',
          [
            {
              eventType: 'perimeter.alert',
              level: 'critical',
              message: 'WAF blocked credential stuffing attempt on login perimeter.',
              requestId: 'seed-war-room-1',
              triggeredBy: 'waf.edge',
              metadata: JSON.stringify({
                seedKey: SEED_KEY,
                seedSignature: SECURITY_EVENT_SIGNATURE,
                affectedRegion: 'eu-west-2',
              }),
              occurredAt: new Date(now.getTime() - 30 * 60 * 1000),
              createdAt: now,
              updatedAt: now,
            },
            {
              eventType: 'iam.policy',
              level: 'warn',
              message: 'Admin MFA reset requested outside change window.',
              requestId: 'seed-war-room-2',
              triggeredBy: 'identity-guardian',
              metadata: JSON.stringify({
                seedKey: SEED_KEY,
                seedSignature: `${SECURITY_EVENT_SIGNATURE}-2`,
              }),
              occurredAt: new Date(now.getTime() - 45 * 60 * 1000),
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const analyticsEventWhere = queryInterface.sequelize.where(
        queryInterface.sequelize.json('context.seedSignature'),
        ANALYTICS_EVENT_SIGNATURE,
      );
      const existingAnalyticsEvent = await queryInterface.rawSelect(
        'analytics_events',
        { where: analyticsEventWhere, transaction },
        ['id'],
      );
      if (!existingAnalyticsEvent) {
        const analyticsBaseTime = now.getTime();
        await queryInterface.bulkInsert(
          'analytics_events',
          [
            { eventName: 'timeline.publish', count: 120 },
            { eventName: 'community.timeline.highlight', count: 64 },
            { eventName: 'events.registration.started', count: 42 },
            { eventName: 'inbox.case.resolved', count: 37 },
          ].map((item, index) => {
            const occurred = new Date(analyticsBaseTime - (index + 1) * 120_000);
            return {
              eventName: item.eventName,
              userId: userId,
              actorType: 'user',
              entityType: 'war-room-demo',
              entityId: telemetryThreadId,
              source: 'war-room-seed',
              context: JSON.stringify({
                seedKey: SEED_KEY,
                seedSignature: ANALYTICS_EVENT_SIGNATURE,
              }),
              occurredAt: occurred,
              ingestedAt: new Date(occurred.getTime() + 30_000),
              createdAt: occurred,
              updatedAt: occurred,
            };
          }),
          { transaction },
        );
      }

      const [existingEvent] = await queryInterface.sequelize.query(
        'SELECT id FROM user_events WHERE slug = :slug LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { slug: EVENT_SLUG } },
      );
      let warRoomEventId = existingEvent?.id;
      if (!warRoomEventId) {
        await queryInterface.bulkInsert(
          'user_events',
          [
            {
              ownerId: userId,
              title: 'Executive reliability stand-up',
              slug: EVENT_SLUG,
              status: 'in_progress',
              format: 'virtual',
              visibility: 'invite_only',
              startAt: new Date(now.getTime() - 15 * 60 * 1000),
              endAt: new Date(now.getTime() + 45 * 60 * 1000),
              capacity: 80,
              registrationOpensAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
              registrationClosesAt: new Date(now.getTime() - 60 * 60 * 1000),
              timezone: 'UTC',
              contactEmail: 'ops.command@gigvora.com',
              metadata: JSON.stringify({
                seedKey: SEED_KEY,
                seedSignature: `${SEED_KEY}:user-event`,
              }),
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
        const [insertedEvent] = await queryInterface.sequelize.query(
          'SELECT id FROM user_events WHERE slug = :slug LIMIT 1',
          { type: QueryTypes.SELECT, transaction, replacements: { slug: EVENT_SLUG } },
        );
        warRoomEventId = insertedEvent?.id;
      }

      if (!warRoomEventId) {
        throw new Error('Failed to seed executive war room event.');
      }

      const guestWhere = queryInterface.sequelize.where(
        queryInterface.sequelize.json('metadata.seedSignature'),
        `${SEED_KEY}:user-event-guest`,
      );
      const existingGuest = await queryInterface.rawSelect(
        'user_event_guests',
        { where: guestWhere, transaction },
        ['id'],
      );
      if (!existingGuest) {
        await queryInterface.bulkInsert(
          'user_event_guests',
          [
            {
              eventId: warRoomEventId,
              fullName: 'Ops Duty Manager',
              email: 'duty.manager@gigvora.com',
              company: 'Gigvora',
              role: 'Operations',
              status: 'confirmed',
              seatsReserved: 2,
              metadata: JSON.stringify({
                seedKey: SEED_KEY,
                seedSignature: `${SEED_KEY}:user-event-guest`,
              }),
              checkedInAt: new Date(now.getTime() - 10 * 60 * 1000),
              createdAt: now,
              updatedAt: now,
            },
            {
              eventId: warRoomEventId,
              fullName: 'Trust Council Lead',
              email: 'trust.lead@gigvora.com',
              company: 'Gigvora',
              role: 'Trust & Safety',
              status: 'checked_in',
              seatsReserved: 1,
              metadata: JSON.stringify({
                seedKey: SEED_KEY,
                seedSignature: `${SEED_KEY}:user-event-guest-2`,
              }),
              checkedInAt: new Date(now.getTime() - 12 * 60 * 1000),
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const [existingTask] = await queryInterface.sequelize.query(
        'SELECT id FROM user_event_tasks WHERE eventId = :eventId LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { eventId: warRoomEventId } },
      );
      if (!existingTask) {
        await queryInterface.bulkInsert(
          'user_event_tasks',
          [
            {
              eventId: warRoomEventId,
              title: 'Publish status page delta',
              status: 'in_progress',
              priority: 'high',
              dueAt: new Date(now.getTime() + 30 * 60 * 1000),
              notes: '[seed:admin-war-room-demo] Coordinate with comms for status page update.',
              createdAt: now,
              updatedAt: now,
            },
            {
              eventId: warRoomEventId,
              title: 'Confirm on-call rotations',
              status: 'todo',
              priority: 'medium',
              dueAt: new Date(now.getTime() + 45 * 60 * 1000),
              notes: '[seed:admin-war-room-demo] Ensure APAC rotation acked.',
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const [existingSetting] = await queryInterface.sequelize.query(
        "SELECT id, value FROM platform_settings WHERE key = 'gdpr-settings' LIMIT 1",
        { type: QueryTypes.SELECT, transaction },
      );
      if (!existingSetting) {
        await queryInterface.bulkInsert(
          'platform_settings',
          [
            {
              key: 'gdpr-settings',
              value: JSON.stringify({
                seedKey: SEED_KEY,
                seedSignature: GDPR_SIGNATURE,
                dpo: {
                  name: 'Priya Natarajan',
                  email: 'privacy.office@gigvora.com',
                  phone: '+44 20 7000 0000',
                  officeLocation: 'London HQ',
                  availability: '24/7 on-call rotation',
                },
                dataSubjectRequests: {
                  contactEmail: 'dsar@gigvora.com',
                  escalationEmail: 'privacy.escalations@gigvora.com',
                  slaDays: 45,
                  automatedIntake: true,
                  intakeChannels: ['portal', 'email', 'phone'],
                  privacyPortalUrl: 'https://gigvora.test/privacy-portal',
                },
                breachResponse: {
                  notificationWindowHours: 48,
                  onCallContact: 'security.bridge@gigvora.com',
                  incidentRunbookUrl: 'https://gigvora.test/runbooks/privacy-breach',
                  tabletopLastRun: new Date(now.getTime() - 170 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .slice(0, 10),
                  tooling: ['PagerDuty', 'Slack', 'Statuspage'],
                },
                consentFramework: {
                  marketingOptInDefault: false,
                  cookieBannerEnabled: false,
                  cookieRefreshMonths: 12,
                  consentLogRetentionDays: 1095,
                  withdrawalChannels: ['portal', 'email'],
                  cookiePolicyUrl: 'https://gigvora.test/legal/cookie-policy',
                  preferenceCenterUrl: 'https://gigvora.test/preferences',
                },
              }),
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
    const { Op } = Sequelize;
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete(
        'user_event_tasks',
        {
          notes: {
            [Op.like]: '%[seed:admin-war-room-demo]%',
          },
        },
        { transaction },
      );

      const [warRoomEvent] = await queryInterface.sequelize.query(
        'SELECT id FROM user_events WHERE slug = :slug LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { slug: EVENT_SLUG } },
      );
      if (warRoomEvent?.id) {
        await queryInterface.bulkDelete('user_event_guests', { eventId: warRoomEvent.id }, { transaction });
        await queryInterface.bulkDelete('user_events', { id: warRoomEvent.id }, { transaction });
      }

      await queryInterface.bulkDelete(
        'analytics_events',
        {
          [Op.and]: [
            queryInterface.sequelize.where(
              queryInterface.sequelize.json('context.seedSignature'),
              ANALYTICS_EVENT_SIGNATURE,
            ),
          ],
        },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'runtime_security_audit_events',
        {
          [Op.and]: [
            queryInterface.sequelize.where(
              queryInterface.sequelize.json('metadata.seedSignature'),
              { [Op.like]: `${SECURITY_EVENT_SIGNATURE}%` },
            ),
          ],
        },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'support_cases',
        {
          [Op.and]: [
            queryInterface.sequelize.where(
              queryInterface.sequelize.json('metadata.seedSignature'),
              { [Op.like]: `${SEED_KEY}:support-case%` },
            ),
          ],
        },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'messages',
        {
          [Op.and]: [
            queryInterface.sequelize.where(
              queryInterface.sequelize.json('metadata.seedSignature'),
              { [Op.like]: `${SEED_KEY}:telemetry-message%` },
            ),
          ],
        },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'message_threads',
        {
          [Op.and]: [
            queryInterface.sequelize.where(
              queryInterface.sequelize.json('metadata.seedSignature'),
              { [Op.like]: `${SEED_KEY}:%` },
            ),
          ],
        },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'platform_settings',
        {
          [Op.and]: [
            queryInterface.sequelize.where(
              queryInterface.sequelize.literal("value ->> 'seedSignature'"),
              GDPR_SIGNATURE,
            ),
          ],
        },
        { transaction },
      );
    });
  },
};
