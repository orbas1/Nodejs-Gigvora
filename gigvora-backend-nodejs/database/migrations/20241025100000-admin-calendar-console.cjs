'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

const ADMIN_CALENDAR_SYNC_STATUSES = ['connected', 'syncing', 'needs_attention', 'disconnected'];
const ADMIN_CALENDAR_EVENT_STATUSES = ['draft', 'scheduled', 'published', 'cancelled'];
const ADMIN_CALENDAR_VISIBILITIES = ['internal', 'external', 'private'];
const ADMIN_CALENDAR_EVENT_TYPES = ['ops_review', 'training', 'launch', 'webinar', 'support', 'governance'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('admin_calendar_accounts', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      provider: { type: Sequelize.STRING(80), allowNull: false },
      accountEmail: { type: Sequelize.STRING(160), allowNull: false },
      displayName: { type: Sequelize.STRING(120), allowNull: true },
      syncStatus: { type: Sequelize.ENUM(...ADMIN_CALENDAR_SYNC_STATUSES), allowNull: false, defaultValue: 'connected' },
      lastSyncedAt: { type: Sequelize.DATE, allowNull: true },
      syncError: { type: Sequelize.TEXT, allowNull: true },
      timezone: { type: Sequelize.STRING(120), allowNull: true },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
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

    await queryInterface.addIndex('admin_calendar_accounts', ['provider']);
    await queryInterface.addIndex('admin_calendar_accounts', ['syncStatus']);
    await queryInterface.addIndex('admin_calendar_accounts', ['accountEmail'], { unique: true });

    await queryInterface.createTable('admin_calendar_templates', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(120), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      durationMinutes: { type: Sequelize.INTEGER, allowNull: true },
      defaultEventType: { type: Sequelize.ENUM(...ADMIN_CALENDAR_EVENT_TYPES), allowNull: false, defaultValue: 'ops_review' },
      defaultVisibility: { type: Sequelize.ENUM(...ADMIN_CALENDAR_VISIBILITIES), allowNull: false, defaultValue: 'internal' },
      defaultLocation: { type: Sequelize.STRING(255), allowNull: true },
      defaultMeetingUrl: { type: Sequelize.STRING(2048), allowNull: true },
      defaultAllowedRoles: { type: jsonType, allowNull: false, defaultValue: [] },
      reminderMinutes: { type: jsonType, allowNull: false, defaultValue: [] },
      instructions: { type: Sequelize.TEXT, allowNull: true },
      bannerImageUrl: { type: Sequelize.STRING(1024), allowNull: true },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
      createdBy: { type: Sequelize.STRING(120), allowNull: true },
      updatedBy: { type: Sequelize.STRING(120), allowNull: true },
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

    await queryInterface.addIndex('admin_calendar_templates', ['isActive']);
    await queryInterface.addIndex('admin_calendar_templates', ['defaultEventType']);

    await queryInterface.createTable('admin_calendar_events', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      calendarAccountId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'admin_calendar_accounts', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      templateId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'admin_calendar_templates', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      eventType: { type: Sequelize.ENUM(...ADMIN_CALENDAR_EVENT_TYPES), allowNull: false, defaultValue: 'ops_review' },
      status: { type: Sequelize.ENUM(...ADMIN_CALENDAR_EVENT_STATUSES), allowNull: false, defaultValue: 'draft' },
      visibility: { type: Sequelize.ENUM(...ADMIN_CALENDAR_VISIBILITIES), allowNull: false, defaultValue: 'internal' },
      meetingUrl: { type: Sequelize.STRING(2048), allowNull: true },
      location: { type: Sequelize.STRING(255), allowNull: true },
      startsAt: { type: Sequelize.DATE, allowNull: false },
      endsAt: { type: Sequelize.DATE, allowNull: true },
      invitees: { type: jsonType, allowNull: false, defaultValue: [] },
      attachments: { type: jsonType, allowNull: false, defaultValue: [] },
      allowedRoles: { type: jsonType, allowNull: false, defaultValue: [] },
      coverImageUrl: { type: Sequelize.STRING(1024), allowNull: true },
      createdBy: { type: Sequelize.STRING(120), allowNull: true },
      updatedBy: { type: Sequelize.STRING(120), allowNull: true },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
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

    await queryInterface.addIndex('admin_calendar_events', ['startsAt']);
    await queryInterface.addIndex('admin_calendar_events', ['status']);
    await queryInterface.addIndex('admin_calendar_events', ['eventType']);

    await queryInterface.createTable('admin_calendar_availability_windows', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      calendarAccountId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'admin_calendar_accounts', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      dayOfWeek: { type: Sequelize.INTEGER, allowNull: false },
      startTimeMinutes: { type: Sequelize.INTEGER, allowNull: false },
      endTimeMinutes: { type: Sequelize.INTEGER, allowNull: false },
      timezone: { type: Sequelize.STRING(120), allowNull: true },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
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

    await queryInterface.addIndex('admin_calendar_availability_windows', ['calendarAccountId']);
    await queryInterface.addIndex('admin_calendar_availability_windows', ['dayOfWeek']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('admin_calendar_availability_windows');
    await queryInterface.dropTable('admin_calendar_events');
    await queryInterface.dropTable('admin_calendar_templates');
    await queryInterface.dropTable('admin_calendar_accounts');

    const dialect = queryInterface.sequelize.getDialect();
    if (['postgres', 'postgresql'].includes(dialect)) {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_admin_calendar_accounts_syncStatus";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_admin_calendar_templates_defaultEventType";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_admin_calendar_templates_defaultVisibility";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_admin_calendar_events_eventType";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_admin_calendar_events_status";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_admin_calendar_events_visibility";');
    }
  },
};
