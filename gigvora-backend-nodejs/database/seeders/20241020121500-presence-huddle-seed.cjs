'use strict';

const { Op } = require('sequelize');

const PRESENCE_SEED_USERS = [
  'ava@gigvora.com',
  'leo@gigvora.com',
  'mia@gigvora.com',
];

const HUDDLE_TEMPLATE_SEED_KEY = 'presence-huddle-seed-template';
const HUDDLE_SEED_KEY = 'presence-huddle-seed-huddle';

function normaliseStates(states = []) {
  return Array.from(new Set(states));
}

function cloneMetadata(metadata) {
  if (!metadata) {
    return null;
  }
  return JSON.parse(JSON.stringify(metadata));
}

function buildJsonSelector(dialect, column, path) {
  const pathSegments = (Array.isArray(path) ? path : String(path).replace(/^\$\.?/, '')).split('.').filter(Boolean);
  if (!pathSegments.length) {
    return column;
  }

  if (['postgres', 'postgresql'].includes(dialect)) {
    return pathSegments.reduce((expression, segment, index) => {
      const operator = index === pathSegments.length - 1 ? '->>' : '->';
      return `${expression} ${operator} '${segment}'`;
    }, column);
  }

  if (['mysql', 'mariadb'].includes(dialect)) {
    return `JSON_UNQUOTE(JSON_EXTRACT(${column}, '$.${pathSegments.join('.')}'))`;
  }

  if (['sqlite', 'sqlite3'].includes(dialect)) {
    return `json_extract(${column}, '$.${pathSegments.join('.')}')`;
  }

  return `JSON_EXTRACT(${column}, '$.${pathSegments.join('.')}')`;
}

function jsonEquals(Sequelize, path, value) {
  return {
    [Op.and]: [Sequelize.where(Sequelize.json(path), value)],
  };
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const dialect = queryInterface.sequelize.getDialect();
    try {
      const [users] = await queryInterface.sequelize.query(
        'SELECT id, email FROM users WHERE email IN (:emails)',
        {
          type: Sequelize.QueryTypes.SELECT,
          replacements: { emails: PRESENCE_SEED_USERS },
          transaction,
        },
      );

      if (!users.length) {
        await transaction.commit();
        return;
      }

      const userIdByEmail = new Map(users.map((user) => [user.email, user.id]));
      const userIds = Array.from(userIdByEmail.values());

      const now = new Date();
      const focusUntil = new Date(now.getTime() + 45 * 60 * 1000);

      await queryInterface.bulkDelete(
        'user_presence_events',
        { userId: { [Op.in]: userIds } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'user_presence_windows',
        { userId: { [Op.in]: userIds } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'user_presence_statuses',
        { userId: { [Op.in]: userIds } },
        { transaction },
      );

      await queryInterface.bulkInsert(
        'user_presence_statuses',
        [
          {
            userId: userIdByEmail.get('ava@gigvora.com'),
            availability: 'in_meeting',
            message: 'Hosting executive alignment huddle',
            online: true,
            focusUntil: null,
            lastSeenAt: new Date(now.getTime() - 5 * 60 * 1000),
            calendarLastSyncedAt: new Date(now.getTime() - 15 * 60 * 1000),
            supportedStates: normaliseStates(['available', 'away', 'do_not_disturb', 'in_meeting', 'focus']),
            metadata: cloneMetadata({ seed: 'presence-huddle', persona: 'operations-lead' }),
            createdAt: now,
            updatedAt: now,
          },
          {
            userId: userIdByEmail.get('leo@gigvora.com'),
            availability: 'focus',
            message: 'Deep work sprint for proposal benchmarks',
            online: true,
            focusUntil,
            lastSeenAt: new Date(now.getTime() - 2 * 60 * 1000),
            calendarLastSyncedAt: new Date(now.getTime() - 25 * 60 * 1000),
            supportedStates: normaliseStates(['available', 'focus', 'away', 'do_not_disturb']),
            metadata: cloneMetadata({ seed: 'presence-huddle', persona: 'staff-engineer' }),
            createdAt: now,
            updatedAt: now,
          },
          {
            userId: userIdByEmail.get('mia@gigvora.com'),
            availability: 'available',
            message: 'Open for asynchronous collaboration',
            online: true,
            focusUntil: null,
            lastSeenAt: new Date(now.getTime() - 60 * 1000),
            calendarLastSyncedAt: new Date(now.getTime() - 5 * 60 * 1000),
            supportedStates: normaliseStates(['available', 'away', 'do_not_disturb', 'in_meeting']),
            metadata: cloneMetadata({ seed: 'presence-huddle', persona: 'ops-director' }),
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'user_presence_events',
        [
          {
            userId: userIdByEmail.get('ava@gigvora.com'),
            eventType: 'huddle',
            title: 'Executive customer alignment',
            description: 'Kicked off leadership sync with analytics and design leads.',
            startedAt: new Date(now.getTime() - 20 * 60 * 1000),
            endedAt: null,
            metadata: cloneMetadata({ seed: 'presence-huddle', channel: 'collaboration' }),
            createdAt: now,
            updatedAt: now,
          },
          {
            userId: userIdByEmail.get('leo@gigvora.com'),
            eventType: 'focus_session',
            title: 'Focus block: Marketplace benchmarks',
            description: 'Heads-down writing proposal benchmarks for enterprise clients.',
            startedAt: new Date(now.getTime() - 10 * 60 * 1000),
            endedAt: null,
            metadata: cloneMetadata({ durationMinutes: 45, seed: 'presence-huddle' }),
            createdAt: now,
            updatedAt: now,
          },
          {
            userId: userIdByEmail.get('mia@gigvora.com'),
            eventType: 'calendar_sync',
            title: 'Calendar sync refreshed',
            description: 'Triggered manual sync after integrating new CRM source.',
            startedAt: new Date(now.getTime() - 30 * 60 * 1000),
            endedAt: null,
            metadata: cloneMetadata({ seed: 'presence-huddle' }),
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'user_presence_windows',
        [
          {
            userId: userIdByEmail.get('ava@gigvora.com'),
            startAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
            endAt: new Date(now.getTime() + 3 * 60 * 60 * 1000),
            timezone: 'America/New_York',
            recurringRule: 'FREQ=WEEKLY;BYDAY=TU,TH',
            note: 'Mentor office hours for analytics pods.',
            metadata: cloneMetadata({ seed: 'presence-huddle' }),
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkDelete(
        'collaboration_huddle_templates',
        jsonEquals(Sequelize, 'metadata.seedKey', HUDDLE_TEMPLATE_SEED_KEY),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'collaboration_huddle_templates',
        [
          {
            workspaceId: null,
            createdById: userIdByEmail.get('ava@gigvora.com'),
            category: 'Leadership',
            title: 'Executive Customer Alignment',
            description: 'Align on customer escalations, roadmap readiness, and follow-ups.',
            agenda:
              '1. Wins since last sync\n2. Customer escalations\n3. Delivery health check\n4. Roadmap decisions\n5. Next actions & owners',
            recommendedDurationMinutes: 45,
            metadata: cloneMetadata({ seedKey: HUDDLE_TEMPLATE_SEED_KEY }),
            createdAt: now,
            updatedAt: now,
          },
          {
            workspaceId: null,
            createdById: userIdByEmail.get('mia@gigvora.com'),
            category: 'Operations',
            title: 'Revenue Operations Sync',
            description: 'Weekly review covering pipeline movement, retention metrics, and automation backlog.',
            agenda:
              '1. Pipeline health indicators\n2. Retention and churn watchlist\n3. Automation backlog review\n4. Cross-team blockers\n5. Commitments before next sync',
            recommendedDurationMinutes: 30,
            metadata: cloneMetadata({ seedKey: HUDDLE_TEMPLATE_SEED_KEY, variant: 'revops' }),
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkDelete(
        'collaboration_huddles',
        jsonEquals(Sequelize, 'metadata.seedKey', HUDDLE_SEED_KEY),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'collaboration_huddles',
        [
          {
            workspaceId: null,
            projectId: null,
            spaceId: null,
            createdById: userIdByEmail.get('ava@gigvora.com'),
            followUpRoomId: null,
            title: 'Enterprise launch readiness sync',
            status: 'scheduled',
            agenda:
              '1. Launch timeline validation\n2. Risk and dependency review\n3. Customer communications plan\n4. Next steps',
            notes: 'Ensure legal sign-off and analytics dashboards are enabled before launch.',
            recordMeeting: true,
            scheduledStart: new Date(now.getTime() + 90 * 60 * 1000),
            scheduledDurationMinutes: 45,
            startedAt: null,
            endedAt: null,
            metadata: cloneMetadata({ seedKey: HUDDLE_SEED_KEY }),
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      const metadataSeedKeySelector = buildJsonSelector(dialect, 'metadata', '$.seedKey');
      const [huddleRecord] = await queryInterface.sequelize.query(
        `SELECT id FROM collaboration_huddles WHERE ${metadataSeedKeySelector} = :seedKey ORDER BY id DESC LIMIT 1`,
        {
          replacements: { seedKey: HUDDLE_SEED_KEY },
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        },
      );

      if (huddleRecord) {
        await queryInterface.bulkDelete(
          'collaboration_huddle_participants',
          { huddleId: huddleRecord.id },
          { transaction },
        );
        await queryInterface.bulkInsert(
          'collaboration_huddle_participants',
          [
            {
              huddleId: huddleRecord.id,
              userId: userIdByEmail.get('ava@gigvora.com'),
              role: 'host',
              responseStatus: 'accepted',
              invitedAt: now,
              respondedAt: now,
              joinedAt: null,
              metadata: cloneMetadata({ seed: 'presence-huddle' }),
              createdAt: now,
              updatedAt: now,
            },
            {
              huddleId: huddleRecord.id,
              userId: userIdByEmail.get('mia@gigvora.com'),
              role: 'participant',
              responseStatus: 'accepted',
              invitedAt: now,
              respondedAt: now,
              joinedAt: null,
              metadata: cloneMetadata({ seed: 'presence-huddle' }),
              createdAt: now,
              updatedAt: now,
            },
            {
              huddleId: huddleRecord.id,
              userId: userIdByEmail.get('leo@gigvora.com'),
              role: 'participant',
              responseStatus: 'invited',
              invitedAt: now,
              respondedAt: null,
              joinedAt: null,
              metadata: cloneMetadata({ seed: 'presence-huddle' }),
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [users] = await queryInterface.sequelize.query(
        'SELECT id FROM users WHERE email IN (:emails)',
        {
          type: Sequelize.QueryTypes.SELECT,
          replacements: { emails: PRESENCE_SEED_USERS },
          transaction,
        },
      );

      const userIds = users.map((user) => user.id);

      if (userIds.length) {
        await queryInterface.bulkDelete(
          'user_presence_events',
          { userId: { [Op.in]: userIds } },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'user_presence_windows',
          { userId: { [Op.in]: userIds } },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'user_presence_statuses',
          { userId: { [Op.in]: userIds } },
          { transaction },
        );
      }

      await queryInterface.bulkDelete(
        'collaboration_huddle_participants',
        jsonEquals(Sequelize, 'metadata.seed', 'presence-huddle'),
        { transaction },
      );

      await queryInterface.bulkDelete(
        'collaboration_huddles',
        jsonEquals(Sequelize, 'metadata.seedKey', HUDDLE_SEED_KEY),
        { transaction },
      );

      await queryInterface.bulkDelete(
        'collaboration_huddle_templates',
        jsonEquals(Sequelize, 'metadata.seedKey', HUDDLE_TEMPLATE_SEED_KEY),
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
