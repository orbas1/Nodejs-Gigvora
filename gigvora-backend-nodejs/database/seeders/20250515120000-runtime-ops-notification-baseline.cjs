'use strict';

const { QueryTypes, Op } = require('sequelize');

const SYSTEM_TABLE = 'system_settings';
const SITE_TABLE = 'site_settings';
const PREFERENCES_TABLE = 'notification_preferences';
const NOTIFICATIONS_TABLE = 'notifications';
const SYSTEM_KEY = 'core';
const SITE_KEY = 'site:global';
const SEED_ACTOR = 'seed:runtime-ops';
const SEED_CONTEXT = 'runtime-ops-seed';

function now() {
  return new Date();
}

function parseJson(value) {
  if (!value) {
    return {};
  }
  if (typeof value === 'object') {
    return { ...value };
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    return {};
  }
}

function mergeMetadata(existing = {}) {
  const next = { ...existing };
  if (Array.isArray(next.seedContexts)) {
    if (!next.seedContexts.includes(SEED_CONTEXT)) {
      next.seedContexts = [...next.seedContexts, SEED_CONTEXT];
    }
  } else {
    next.seedContexts = [SEED_CONTEXT];
  }
  next.seedContext = SEED_CONTEXT;
  next.lastSeededAt = now().toISOString();
  return next;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const timestamp = now();

      const [systemRow] = await queryInterface.sequelize.query(
        `SELECT id, value, metadata, version, category, "environmentScope" AS "environmentScope", "isSensitive" AS "isSensitive"
         FROM ${SYSTEM_TABLE}
         WHERE key = :key
         LIMIT 1`,
        {
          replacements: { key: SYSTEM_KEY },
          type: QueryTypes.SELECT,
          transaction,
        },
      );

      const existingSystemValue = parseJson(systemRow?.value);
      const systemValue = {
        ...existingSystemValue,
        general: {
          ...(existingSystemValue.general ?? {}),
          appName: existingSystemValue.general?.appName ?? 'Gigvora',
          incidentContact: 'ops@gigvora.com',
          supportEmail: 'support@gigvora.com',
          supportPhone: '+1-415-555-0199',
          allowedDomains: ['gigvora.com', 'gigvora.dev'],
        },
        notifications: {
          ...(existingSystemValue.notifications ?? {}),
          emailProvider: 'resend',
          emailFromName: 'Gigvora Ops',
          emailFromAddress: 'ops-broadcast@gigvora.com',
          smsProvider: 'twilio',
          smsFromNumber: '+14155550199',
          incidentWebhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/runtime-alerts',
          broadcastChannels: ['email', 'push', 'slack'],
        },
        maintenance: {
          ...(existingSystemValue.maintenance ?? {}),
          statusPageUrl: 'https://status.gigvora.com',
          supportChannel: 'https://gigvora.slack.com/archives/runtime-ops',
          upcomingWindows: [
            {
              id: 'runtime-q3-hardening',
              summary: 'Q3 runtime hardening rehearsal',
              impact: 'Global platform',
              startAt: '2025-05-18T06:00:00.000Z',
              endAt: '2025-05-18T07:30:00.000Z',
              timezone: 'UTC',
              contact: 'ops@gigvora.com',
            },
            {
              id: 'runtime-api-patch',
              summary: 'API gateway security patch',
              impact: 'Public API',
              startAt: '2025-05-22T02:00:00.000Z',
              endAt: '2025-05-22T02:45:00.000Z',
              timezone: 'UTC',
              contact: 'api-oncall@gigvora.com',
            },
          ],
        },
      };

      const systemMetadata = mergeMetadata(parseJson(systemRow?.metadata));
      const systemVersion = systemRow ? Math.max(Number(systemRow.version ?? 1), 1) + 1 : 1;
      const systemRecord = {
        category: systemRow?.category ?? 'global',
        description: 'Runtime operations baseline for executive dashboards.',
        environmentScope: systemRow?.environmentScope ?? 'global',
        valueType: 'json',
        isSensitive: Boolean(systemRow?.isSensitive ?? false),
        value: systemValue,
        metadata: systemMetadata,
        updatedBy: SEED_ACTOR,
        version: systemVersion,
        updatedAt: timestamp,
      };

      if (systemRow?.id) {
        await queryInterface.bulkUpdate(SYSTEM_TABLE, systemRecord, { id: systemRow.id }, { transaction });
      } else {
        await queryInterface.bulkInsert(
          SYSTEM_TABLE,
          [
            {
              key: SYSTEM_KEY,
              ...systemRecord,
              createdAt: timestamp,
            },
          ],
          { transaction },
        );
      }

      const [siteRow] = await queryInterface.sequelize.query(
        `SELECT id, value, metadata, version, category, description, "isSensitive" AS "isSensitive"
         FROM ${SITE_TABLE}
         WHERE key = :key
         LIMIT 1`,
        {
          replacements: { key: SITE_KEY },
          type: QueryTypes.SELECT,
          transaction,
        },
      );

      const existingSiteValue = parseJson(siteRow?.value);
      const siteValue = {
        ...existingSiteValue,
        heroPersonaChips: [
          'Founders',
          'Agencies',
          'Mentors',
          'Operators',
          'Investors',
        ],
        heroInsightStats: [
          { id: 'active-workspaces', label: 'Active workspaces', value: '1,240', helper: 'Across 42 countries' },
          { id: 'broadcast-opt-in', label: 'Broadcast opt-in', value: '92%', helper: 'Admin + ops cohorts' },
          { id: 'maintenance-readiness', label: 'Maintenance readiness', value: '2 rehearsals', helper: 'Per quarter' },
          { id: 'runtime-uplift', label: 'Runtime uplift', value: '+18%', helper: 'Resolution speed YoY' },
        ],
        heroValuePillars: [
          {
            id: 'runtime-telemetry',
            title: 'Runtime telemetry',
            description: 'Control tower dashboards surface uptime, latency, and guardrails for every executive review.',
            highlights: [
              'Real-time API, worker, and queue health signals',
              'Automated escalation hooks to Slack, PagerDuty, and status page',
            ],
            metric: { label: 'Incident-free days', value: '48', trend: '+12%' },
            icon: 'ShieldCheckIcon',
            action: { id: 'runtime-telemetry', label: 'Inspect runtime health', href: '/dashboard/admin/runtime-operations' },
          },
          {
            id: 'broadcast-discipline',
            title: 'Broadcast discipline',
            description: 'Comms cadences keep members, partners, and execs aligned during rehearsals or live incidents.',
            highlights: [
              'Segmented email, push, and Slack channels',
              'Quiet hours and digest automation reduce fatigue',
            ],
            metric: { label: 'Delivery < 60s', value: '98%' },
            icon: 'MegaphoneIcon',
            action: { id: 'broadcast-centre', label: 'Review notification pipelines', href: '/dashboard/admin/runtime-operations#notifications' },
          },
          {
            id: 'hero-experience',
            title: 'Hero experience',
            description: 'Premium hero stories refresh automatically from site settings and persona telemetry.',
            highlights: [
              'Persona chips sync with marketing CMS',
              'Insight stats draw from runtime performance data',
            ],
            metric: { label: 'Hero engagement', value: '4.2x', helper: 'vs. static landing copy' },
            icon: 'BoltIcon',
            action: { id: 'hero-governance', label: 'Manage hero surfaces', href: '/dashboard/admin/site-settings' },
          },
        ],
        announcement: {
          ...(existingSiteValue.announcement ?? {}),
          enabled: true,
          message: 'Platform maintenance rehearsal complete — runtime green across all regions.',
          linkLabel: 'View status page',
          linkUrl: 'https://status.gigvora.com',
        },
        operationsSummary: {
          runtimeHealth: {
            label: 'Runtime health',
            value: '99.98% uptime',
            change: '+0.04%',
            trend: [98, 99, 99, 100, 100, 99, 100],
          },
          notificationSlo: {
            label: 'Notification SLO',
            value: '98% < 60s',
            change: '+3%',
            trend: [82, 88, 90, 93, 95, 97, 98],
          },
          maintenanceReadiness: {
            label: 'Maintenance readiness',
            value: '2 rehearsals',
            change: '+1',
            trend: [0, 0, 0, 1, 1, 2, 2],
          },
        },
      };

      const siteMetadata = mergeMetadata(parseJson(siteRow?.metadata));
      const siteVersion = siteRow ? Math.max(Number(siteRow.version ?? 1), 1) + 1 : 1;
      const siteRecord = {
        category: siteRow?.category ?? 'marketing',
        description: siteRow?.description ?? 'Runtime hero and announcement settings.',
        isSensitive: Boolean(siteRow?.isSensitive ?? false),
        value: siteValue,
        metadata: siteMetadata,
        updatedBy: SEED_ACTOR,
        version: siteVersion,
        updatedAt: timestamp,
      };

      if (siteRow?.id) {
        await queryInterface.bulkUpdate(SITE_TABLE, siteRecord, { id: siteRow.id }, { transaction });
      } else {
        await queryInterface.bulkInsert(
          SITE_TABLE,
          [
            {
              key: SITE_KEY,
              ...siteRecord,
              createdAt: timestamp,
            },
          ],
          { transaction },
        );
      }

      const userEmails = ['ava@gigvora.com', 'mia@gigvora.com', 'leo@gigvora.com'];
      const users = await queryInterface.sequelize.query(
        'SELECT id, email FROM users WHERE email IN (:emails)',
        { replacements: { emails: userEmails }, type: QueryTypes.SELECT, transaction },
      );
      const userIdByEmail = new Map(users.map((user) => [user.email.toLowerCase(), user.id]));
      userEmails.forEach((email) => {
        if (!userIdByEmail.has(email)) {
          throw new Error(`Seed user ${email} is required for runtime operations seed data.`);
        }
      });

      const preferenceSeeds = [
        {
          email: 'ava@gigvora.com',
          data: {
            emailEnabled: true,
            pushEnabled: true,
            smsEnabled: false,
            inAppEnabled: true,
            digestFrequency: 'daily',
            quietHoursStart: '21:00',
            quietHoursEnd: '06:00',
            metadata: { timezone: 'America/New_York' },
          },
        },
        {
          email: 'mia@gigvora.com',
          data: {
            emailEnabled: true,
            pushEnabled: true,
            smsEnabled: true,
            inAppEnabled: true,
            digestFrequency: 'immediate',
            quietHoursStart: '22:00',
            quietHoursEnd: '05:30',
            metadata: { timezone: 'Europe/London' },
          },
        },
      ];

      const existingPreferences = await queryInterface.sequelize.query(
        `SELECT userId, metadata FROM ${PREFERENCES_TABLE} WHERE userId IN (:ids)`,
        {
          replacements: { ids: preferenceSeeds.map((seed) => userIdByEmail.get(seed.email)) },
          type: QueryTypes.SELECT,
          transaction,
        },
      );
      const preferenceMetadataByUserId = new Map(
        existingPreferences.map((row) => [row.userId, parseJson(row.metadata)]),
      );

      const preferenceInserts = [];
      for (const seed of preferenceSeeds) {
        const userId = userIdByEmail.get(seed.email);
        const metadata = mergeMetadata(preferenceMetadataByUserId.get(userId));
        metadata.timezone = seed.data.metadata.timezone;
        const payload = {
          emailEnabled: seed.data.emailEnabled,
          pushEnabled: seed.data.pushEnabled,
          smsEnabled: seed.data.smsEnabled,
          inAppEnabled: seed.data.inAppEnabled,
          digestFrequency: seed.data.digestFrequency,
          quietHoursStart: seed.data.quietHoursStart,
          quietHoursEnd: seed.data.quietHoursEnd,
          metadata,
          updatedAt: timestamp,
        };
        if (preferenceMetadataByUserId.has(userId)) {
          await queryInterface.bulkUpdate(PREFERENCES_TABLE, payload, { userId }, { transaction });
        } else {
          preferenceInserts.push({ userId, ...payload, createdAt: timestamp });
        }
      }

      if (preferenceInserts.length) {
        await queryInterface.bulkInsert(PREFERENCES_TABLE, preferenceInserts, { transaction });
      }

      const notificationSeeds = [
        {
          email: 'ava@gigvora.com',
          title: 'Ops rehearsal readiness update',
          body: 'All clusters passed readiness drills. Expect 15m timeline catch-up.',
          status: 'delivered',
          priority: 'critical',
          type: 'ops.runtime',
          category: 'system',
          createdAt: new Date(timestamp.getTime() - 60 * 60 * 1000),
          deliveredAt: new Date(timestamp.getTime() - 55 * 60 * 1000),
          payload: {
            campaignId: 'runtime-ops-weekly',
            channel: 'email',
            severity: 'notice',
            seedContext: SEED_CONTEXT,
            triggeredBy: SEED_ACTOR,
          },
        },
        {
          email: 'mia@gigvora.com',
          title: 'Notification digest adoption pulse',
          body: 'Daily digests now cover 92% of admin cohorts. Review opt-out trends before next push.',
          status: 'read',
          priority: 'normal',
          type: 'ops.notifications',
          category: 'system',
          createdAt: new Date(timestamp.getTime() - 45 * 60 * 1000),
          deliveredAt: new Date(timestamp.getTime() - 44 * 60 * 1000),
          readAt: new Date(timestamp.getTime() - 40 * 60 * 1000),
          payload: {
            campaignId: 'runtime-ops-weekly',
            channel: 'push',
            adoption: 'digest',
            seedContext: SEED_CONTEXT,
            triggeredBy: SEED_ACTOR,
          },
        },
        {
          email: 'leo@gigvora.com',
          title: 'Critical queue review pending',
          body: 'Leo, confirm follow-up on the mentorship automation anomaly before tomorrow’s stand-up.',
          status: 'pending',
          priority: 'high',
          type: 'ops.runtime',
          category: 'system',
          createdAt: new Date(timestamp.getTime() - 30 * 60 * 1000),
          payload: {
            campaignId: 'runtime-ops-critical',
            channel: 'in-app',
            seedContext: SEED_CONTEXT,
            triggeredBy: SEED_ACTOR,
          },
        },
      ];

      for (const seed of notificationSeeds) {
        const userId = userIdByEmail.get(seed.email);
        const [existing] = await queryInterface.sequelize.query(
          `SELECT id FROM ${NOTIFICATIONS_TABLE} WHERE userId = :userId AND title = :title LIMIT 1`,
          {
            replacements: { userId, title: seed.title },
            type: QueryTypes.SELECT,
            transaction,
          },
        );
        if (!existing) {
          await queryInterface.bulkInsert(
            NOTIFICATIONS_TABLE,
            [
              {
                userId,
                category: seed.category,
                type: seed.type,
                title: seed.title,
                body: seed.body,
                payload: seed.payload,
                priority: seed.priority,
                status: seed.status,
                deliveredAt: seed.deliveredAt ?? null,
                readAt: seed.readAt ?? null,
                expiresAt: null,
                createdAt: seed.createdAt,
                updatedAt: timestamp,
              },
            ],
            { transaction },
          );
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const timestamp = now();

      const [systemRow] = await queryInterface.sequelize.query(
        `SELECT id, value, metadata FROM ${SYSTEM_TABLE} WHERE key = :key LIMIT 1`,
        { replacements: { key: SYSTEM_KEY }, type: QueryTypes.SELECT, transaction },
      );
      if (systemRow?.id) {
        const value = parseJson(systemRow.value);
        if (value.notifications) {
          value.notifications.broadcastChannels = [];
        }
        if (value.maintenance) {
          value.maintenance.upcomingWindows = [];
        }
        const metadata = parseJson(systemRow.metadata);
        if (Array.isArray(metadata.seedContexts)) {
          metadata.seedContexts = metadata.seedContexts.filter((context) => context !== SEED_CONTEXT);
          if (metadata.seedContexts.length === 0) {
            delete metadata.seedContexts;
          }
        }
        if (metadata.seedContext === SEED_CONTEXT) {
          delete metadata.seedContext;
        }
        await queryInterface.bulkUpdate(
          SYSTEM_TABLE,
          {
            value,
            metadata,
            updatedBy: SEED_ACTOR,
            updatedAt: timestamp,
          },
          { id: systemRow.id },
          { transaction },
        );
      }

      const [siteRow] = await queryInterface.sequelize.query(
        `SELECT id, value, metadata FROM ${SITE_TABLE} WHERE key = :key LIMIT 1`,
        { replacements: { key: SITE_KEY }, type: QueryTypes.SELECT, transaction },
      );
      if (siteRow?.id) {
        const value = parseJson(siteRow.value);
        value.heroPersonaChips = [];
        value.heroInsightStats = [];
        value.heroValuePillars = [];
        if (value.announcement?.linkLabel === 'View status page' && value.announcement?.linkUrl === 'https://status.gigvora.com') {
          value.announcement.enabled = false;
        }
        value.operationsSummary = {};
        const metadata = parseJson(siteRow.metadata);
        if (Array.isArray(metadata.seedContexts)) {
          metadata.seedContexts = metadata.seedContexts.filter((context) => context !== SEED_CONTEXT);
          if (metadata.seedContexts.length === 0) {
            delete metadata.seedContexts;
          }
        }
        if (metadata.seedContext === SEED_CONTEXT) {
          delete metadata.seedContext;
        }
        await queryInterface.bulkUpdate(
          SITE_TABLE,
          {
            value,
            metadata,
            updatedBy: SEED_ACTOR,
            updatedAt: timestamp,
          },
          { id: siteRow.id },
          { transaction },
        );
      }

      const preferenceEmails = ['ava@gigvora.com', 'mia@gigvora.com'];
      const preferenceUsers = await queryInterface.sequelize.query(
        'SELECT id FROM users WHERE email IN (:emails)',
        { replacements: { emails: preferenceEmails }, type: QueryTypes.SELECT, transaction },
      );
      const preferenceIds = preferenceUsers.map((row) => row.id);
      if (preferenceIds.length) {
        await queryInterface.bulkDelete(
          PREFERENCES_TABLE,
          { userId: { [Op.in]: preferenceIds } },
          { transaction },
        );
      }

      const notificationEmails = ['ava@gigvora.com', 'mia@gigvora.com', 'leo@gigvora.com'];
      const notificationUsers = await queryInterface.sequelize.query(
        'SELECT id FROM users WHERE email IN (:emails)',
        { replacements: { emails: notificationEmails }, type: QueryTypes.SELECT, transaction },
      );
      const notificationIds = notificationUsers.map((row) => row.id);
      const titles = [
        'Ops rehearsal readiness update',
        'Notification digest adoption pulse',
        'Critical queue review pending',
      ];
      if (notificationIds.length) {
        await queryInterface.bulkDelete(
          NOTIFICATIONS_TABLE,
          {
            userId: { [Op.in]: notificationIds },
            title: { [Op.in]: titles },
          },
          { transaction },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
