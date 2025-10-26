'use strict';

const PRESENCE_AVAILABILITY_STATES = [
  'available',
  'away',
  'focus',
  'in_meeting',
  'do_not_disturb',
  'offline',
];

const PRESENCE_EVENT_TYPES = [
  'status_change',
  'focus_session',
  'calendar_sync',
  'availability_window',
  'huddle',
];

const HUDDLE_STATUSES = ['draft', 'scheduled', 'active', 'completed', 'cancelled'];
const HUDDLE_PARTICIPANT_ROLES = ['host', 'participant', 'observer', 'guest'];
const HUDDLE_PARTICIPANT_RESPONSES = ['invited', 'accepted', 'declined', 'tentative'];

const CALENDAR_SYNC_JOB_STATUSES = ['queued', 'running', 'success', 'failed'];

const dropEnum = async (queryInterface, enumName) => {
  const dialect = queryInterface.sequelize.getDialect();
  if (dialect === 'postgres' || dialect === 'postgresql') {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`);
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

    await queryInterface.createTable('user_presence_statuses', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      availability: {
        type: Sequelize.ENUM(...PRESENCE_AVAILABILITY_STATES),
        allowNull: false,
        defaultValue: 'available',
      },
      message: { type: Sequelize.TEXT, allowNull: true },
      online: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      focusUntil: { type: Sequelize.DATE, allowNull: true },
      lastSeenAt: { type: Sequelize.DATE, allowNull: true },
      calendarLastSyncedAt: { type: Sequelize.DATE, allowNull: true },
      supportedStates: { type: jsonType, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      activeFocusSessionId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'focus_sessions', key: 'id' },
        onDelete: 'SET NULL',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('user_presence_statuses', ['userId'], { unique: true });
    await queryInterface.addIndex('user_presence_statuses', ['availability']);

    await queryInterface.createTable('user_presence_events', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      eventType: {
        type: Sequelize.ENUM(...PRESENCE_EVENT_TYPES),
        allowNull: false,
        defaultValue: 'status_change',
      },
      title: { type: Sequelize.STRING(200), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      startedAt: { type: Sequelize.DATE, allowNull: true },
      endedAt: { type: Sequelize.DATE, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('user_presence_events', ['userId']);
    await queryInterface.addIndex('user_presence_events', ['eventType']);
    await queryInterface.addIndex('user_presence_events', ['startedAt']);

    await queryInterface.createTable('user_presence_windows', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      startAt: { type: Sequelize.DATE, allowNull: true },
      endAt: { type: Sequelize.DATE, allowNull: true },
      timezone: { type: Sequelize.STRING(120), allowNull: true },
      recurringRule: { type: Sequelize.STRING(512), allowNull: true },
      note: { type: Sequelize.TEXT, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('user_presence_windows', ['userId']);
    await queryInterface.addIndex('user_presence_windows', ['startAt']);

    await queryInterface.createTable('collaboration_huddles', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: { type: Sequelize.INTEGER, allowNull: true },
      projectId: { type: Sequelize.INTEGER, allowNull: true },
      spaceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'collaboration_spaces', key: 'id' },
        onDelete: 'SET NULL',
      },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      title: { type: Sequelize.STRING(200), allowNull: false },
      status: {
        type: Sequelize.ENUM(...HUDDLE_STATUSES),
        allowNull: false,
        defaultValue: 'draft',
      },
      agenda: { type: Sequelize.TEXT, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      recordMeeting: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      followUpRoomId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'collaboration_rooms', key: 'id' },
        onDelete: 'SET NULL',
      },
      launchUrl: { type: Sequelize.TEXT, allowNull: true },
      recordingUrl: { type: Sequelize.TEXT, allowNull: true },
      scheduledStart: { type: Sequelize.DATE, allowNull: true },
      scheduledDurationMinutes: { type: Sequelize.INTEGER, allowNull: true },
      startedAt: { type: Sequelize.DATE, allowNull: true },
      endedAt: { type: Sequelize.DATE, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('collaboration_huddles', ['workspaceId']);
    await queryInterface.addIndex('collaboration_huddles', ['projectId']);
    await queryInterface.addIndex('collaboration_huddles', ['status']);
    await queryInterface.addIndex('collaboration_huddles', ['scheduledStart']);

    await queryInterface.createTable('collaboration_huddle_participants', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      huddleId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'collaboration_huddles', key: 'id' },
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      email: { type: Sequelize.STRING(255), allowNull: true },
      role: {
        type: Sequelize.ENUM(...HUDDLE_PARTICIPANT_ROLES),
        allowNull: false,
        defaultValue: 'participant',
      },
      responseStatus: {
        type: Sequelize.ENUM(...HUDDLE_PARTICIPANT_RESPONSES),
        allowNull: false,
        defaultValue: 'invited',
      },
      invitedAt: { type: Sequelize.DATE, allowNull: true },
      respondedAt: { type: Sequelize.DATE, allowNull: true },
      joinedAt: { type: Sequelize.DATE, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('collaboration_huddle_participants', ['huddleId']);
    await queryInterface.addIndex('collaboration_huddle_participants', ['userId']);
    await queryInterface.addIndex('collaboration_huddle_participants', ['role']);
    await queryInterface.addIndex('collaboration_huddle_participants', ['responseStatus']);
    await queryInterface.addConstraint('collaboration_huddle_participants', {
      type: 'unique',
      fields: ['huddleId', 'userId'],
      name: 'collaboration_huddle_participants_unique_user',
    });

    await queryInterface.createTable('collaboration_huddle_templates', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: { type: Sequelize.INTEGER, allowNull: true },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      category: { type: Sequelize.STRING(120), allowNull: true },
      title: { type: Sequelize.STRING(200), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      agenda: { type: Sequelize.TEXT, allowNull: false },
      recommendedDurationMinutes: { type: Sequelize.INTEGER, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('collaboration_huddle_templates', ['workspaceId']);
    await queryInterface.addIndex('collaboration_huddle_templates', ['category']);

    await queryInterface.createTable('calendar_sync_jobs', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      triggeredById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.ENUM(...CALENDAR_SYNC_JOB_STATUSES),
        allowNull: false,
        defaultValue: 'queued',
      },
      startedAt: { type: Sequelize.DATE, allowNull: true },
      finishedAt: { type: Sequelize.DATE, allowNull: true },
      nextSyncAt: { type: Sequelize.DATE, allowNull: true },
      lastSyncedAt: { type: Sequelize.DATE, allowNull: true },
      errorCode: { type: Sequelize.STRING(120), allowNull: true },
      errorMessage: { type: Sequelize.TEXT, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('calendar_sync_jobs', ['userId']);
    await queryInterface.addIndex('calendar_sync_jobs', ['status']);
    await queryInterface.addIndex('calendar_sync_jobs', ['nextSyncAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('calendar_sync_jobs');
    await queryInterface.dropTable('collaboration_huddle_templates');
    await queryInterface.dropTable('collaboration_huddle_participants');
    await queryInterface.dropTable('collaboration_huddles');
    await queryInterface.dropTable('user_presence_windows');
    await queryInterface.dropTable('user_presence_events');
    await queryInterface.dropTable('user_presence_statuses');

    await dropEnum(queryInterface, 'enum_calendar_sync_jobs_status');
    await dropEnum(queryInterface, 'enum_collaboration_huddle_participants_responseStatus');
    await dropEnum(queryInterface, 'enum_collaboration_huddle_participants_role');
    await dropEnum(queryInterface, 'enum_collaboration_huddles_status');
    await dropEnum(queryInterface, 'enum_user_presence_events_eventType');
    await dropEnum(queryInterface, 'enum_user_presence_statuses_availability');
  },
};
