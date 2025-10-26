'use strict';

const EVENT_STATUSES = ['draft', 'scheduled', 'completed', 'cancelled'];
const RESOURCE_STATUSES = ['draft', 'published', 'archived'];
const TIMELINE_VISIBILITIES = ['internal', 'members', 'public'];
const RESOLUTION_STATES = ['open', 'in_progress', 'resolved'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'group_events',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          groupId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'groups', key: 'id' },
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          startAt: { type: Sequelize.DATE, allowNull: false },
          endAt: { type: Sequelize.DATE, allowNull: true },
          timezone: { type: Sequelize.STRING(64), allowNull: true },
          format: { type: Sequelize.STRING(64), allowNull: true },
          location: { type: Sequelize.STRING(255), allowNull: true },
          hostName: { type: Sequelize.STRING(160), allowNull: true },
          hostTitle: { type: Sequelize.STRING(160), allowNull: true },
          registrationUrl: { type: Sequelize.STRING(500), allowNull: true },
          isVirtual: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          status: { type: Sequelize.ENUM(...EVENT_STATUSES), allowNull: false, defaultValue: 'scheduled' },
          metadata: { type: jsonType, allowNull: true },
          createdById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          updatedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );
      await queryInterface.addIndex('group_events', ['groupId', 'startAt'], { transaction, name: 'group_events_group_start_idx' });

      await queryInterface.createTable(
        'group_resources',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          groupId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'groups', key: 'id' },
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(200), allowNull: false },
          summary: { type: Sequelize.TEXT, allowNull: true },
          url: { type: Sequelize.STRING(1000), allowNull: false },
          type: { type: Sequelize.STRING(64), allowNull: false },
          category: { type: Sequelize.STRING(64), allowNull: true },
          collection: { type: Sequelize.STRING(120), allowNull: true },
          author: { type: Sequelize.STRING(160), allowNull: true },
          format: { type: Sequelize.STRING(120), allowNull: true },
          difficulty: { type: Sequelize.STRING(60), allowNull: true },
          duration: { type: Sequelize.STRING(60), allowNull: true },
          previewImageUrl: { type: Sequelize.STRING(500), allowNull: true },
          isFeatured: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          tags: { type: jsonType, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          status: { type: Sequelize.ENUM(...RESOURCE_STATUSES), allowNull: false, defaultValue: 'published' },
          viewCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          downloadCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          lastAccessedAt: { type: Sequelize.DATE, allowNull: true },
          publishedAt: { type: Sequelize.DATE, allowNull: true },
          createdById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          updatedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );
      await queryInterface.addIndex('group_resources', ['groupId', 'status'], {
        transaction,
        name: 'group_resources_group_status_idx',
      });
      await queryInterface.addIndex('group_resources', ['groupId', 'collection'], {
        transaction,
        name: 'group_resources_group_collection_idx',
      });

      await queryInterface.createTable(
        'group_guidelines',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          groupId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'groups', key: 'id' },
            onDelete: 'CASCADE',
          },
          content: { type: Sequelize.TEXT, allowNull: false },
          displayOrder: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          isRequired: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );
      await queryInterface.addIndex('group_guidelines', ['groupId', 'displayOrder'], {
        transaction,
        name: 'group_guidelines_group_order_idx',
      });

      await queryInterface.createTable(
        'group_timeline_events',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          groupId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'groups', key: 'id' },
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(200), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          occursAt: { type: Sequelize.DATE, allowNull: false },
          category: { type: Sequelize.STRING(80), allowNull: true },
          visibility: { type: Sequelize.ENUM(...TIMELINE_VISIBILITIES), allowNull: false, defaultValue: 'members' },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );
      await queryInterface.addIndex('group_timeline_events', ['groupId', 'occursAt'], {
        transaction,
        name: 'group_timeline_group_occurs_idx',
      });

      await queryInterface.addColumn(
        'group_posts',
        'topicTags',
        { type: jsonType, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'group_posts',
        'pinnedAt',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'group_posts',
        'lastActivityAt',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'group_posts',
        'replyCount',
        { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        { transaction },
      );
      await queryInterface.addColumn(
        'group_posts',
        'reactionSummary',
        { type: jsonType, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'group_posts',
        'resolutionState',
        { type: Sequelize.ENUM(...RESOLUTION_STATES), allowNull: false, defaultValue: 'open' },
        { transaction },
      );

      await queryInterface.addColumn(
        'group_memberships',
        'preferences',
        { type: jsonType, allowNull: true },
        { transaction },
      );
      await queryInterface.sequelize.query(
        'UPDATE group_memberships SET preferences = COALESCE(preferences, :defaultPrefs)',
        {
          transaction,
          replacements: {
            defaultPrefs: JSON.stringify({ notifications: { digest: true, newThread: true, upcomingEvent: true } }),
          },
        },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('group_memberships', 'preferences', { transaction });

      await queryInterface.removeColumn('group_posts', 'resolutionState', { transaction });
      await queryInterface.removeColumn('group_posts', 'reactionSummary', { transaction });
      await queryInterface.removeColumn('group_posts', 'replyCount', { transaction });
      await queryInterface.removeColumn('group_posts', 'lastActivityAt', { transaction });
      await queryInterface.removeColumn('group_posts', 'pinnedAt', { transaction });
      await queryInterface.removeColumn('group_posts', 'topicTags', { transaction });

      await queryInterface.dropTable('group_timeline_events', { transaction });
      await queryInterface.dropTable('group_guidelines', { transaction });
      await queryInterface.dropTable('group_resources', { transaction });
      await queryInterface.dropTable('group_events', { transaction });

      if (['postgres', 'postgresql'].includes(dialect)) {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_group_events_status";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_group_resources_status";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_group_timeline_events_visibility";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_group_posts_resolutionState";', { transaction });
      }
    });
  },
};
