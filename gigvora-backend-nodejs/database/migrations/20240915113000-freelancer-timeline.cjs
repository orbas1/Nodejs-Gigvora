'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      const timestampDefault = Sequelize.literal('CURRENT_TIMESTAMP');

      await queryInterface.createTable(
        'freelancer_timeline_workspaces',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          timezone: { type: Sequelize.STRING(120), allowNull: false, defaultValue: 'UTC' },
          defaultVisibility: {
            type: Sequelize.ENUM('public', 'connections', 'private'),
            allowNull: false,
            defaultValue: 'public',
          },
          autoShareToFeed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          reviewBeforePublish: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          distributionChannels: { type: jsonType, allowNull: true },
          contentThemes: { type: jsonType, allowNull: true },
          pinnedCampaigns: { type: jsonType, allowNull: true },
          cadenceGoal: { type: Sequelize.INTEGER, allowNull: true },
          lastSyncedAt: { type: Sequelize.DATE, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'freelancer_timeline_workspaces',
        ['freelancerId'],
        { unique: true, transaction, name: 'freelancer_timeline_workspaces_freelancer_id_unique' },
      );

      await queryInterface.createTable(
        'freelancer_timeline_posts',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'freelancer_timeline_workspaces', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          summary: { type: Sequelize.TEXT, allowNull: true },
          content: { type: Sequelize.TEXT, allowNull: true },
          status: {
            type: Sequelize.ENUM('draft', 'scheduled', 'published', 'archived'),
            allowNull: false,
            defaultValue: 'draft',
          },
          visibility: {
            type: Sequelize.ENUM('public', 'connections', 'private'),
            allowNull: false,
            defaultValue: 'public',
          },
          scheduledAt: { type: Sequelize.DATE, allowNull: true },
          publishedAt: { type: Sequelize.DATE, allowNull: true },
          timezone: { type: Sequelize.STRING(120), allowNull: true },
          heroImageUrl: { type: Sequelize.STRING(2048), allowNull: true },
          allowComments: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          tags: { type: jsonType, allowNull: true },
          attachments: { type: jsonType, allowNull: true },
          targetAudience: { type: jsonType, allowNull: true },
          campaign: { type: Sequelize.STRING(180), allowNull: true },
          callToAction: { type: jsonType, allowNull: true },
          metricsSnapshot: { type: jsonType, allowNull: true },
          lastEditedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'freelancer_timeline_posts',
        ['freelancerId', 'status'],
        { transaction, name: 'freelancer_timeline_posts_status_idx' },
      );
      await queryInterface.addIndex(
        'freelancer_timeline_posts',
        ['scheduledAt'],
        { transaction, name: 'freelancer_timeline_posts_scheduled_at_idx' },
      );
      await queryInterface.addIndex(
        'freelancer_timeline_posts',
        ['publishedAt'],
        { transaction, name: 'freelancer_timeline_posts_published_at_idx' },
      );

      await queryInterface.createTable(
        'freelancer_timeline_entries',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'freelancer_timeline_workspaces', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          entryType: {
            type: Sequelize.ENUM('milestone', 'content', 'event', 'campaign'),
            allowNull: false,
            defaultValue: 'milestone',
          },
          status: {
            type: Sequelize.ENUM('planned', 'in_progress', 'completed', 'blocked'),
            allowNull: false,
            defaultValue: 'planned',
          },
          startAt: { type: Sequelize.DATE, allowNull: true },
          endAt: { type: Sequelize.DATE, allowNull: true },
          linkedPostId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'freelancer_timeline_posts', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          owner: { type: Sequelize.STRING(180), allowNull: true },
          channel: { type: Sequelize.STRING(180), allowNull: true },
          location: { type: Sequelize.STRING(255), allowNull: true },
          tags: { type: jsonType, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'freelancer_timeline_entries',
        ['freelancerId', 'status'],
        { transaction, name: 'freelancer_timeline_entries_status_idx' },
      );
      await queryInterface.addIndex(
        'freelancer_timeline_entries',
        ['startAt'],
        { transaction, name: 'freelancer_timeline_entries_start_at_idx' },
      );

      await queryInterface.createTable(
        'freelancer_timeline_post_metrics',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true },
          postId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'freelancer_timeline_posts', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          capturedAt: { type: Sequelize.DATEONLY, allowNull: false },
          impressions: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          views: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          clicks: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          comments: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          reactions: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          saves: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          shares: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          profileVisits: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          leads: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          conversionRate: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'freelancer_timeline_post_metrics',
        ['postId', 'capturedAt'],
        { unique: true, transaction, name: 'freelancer_timeline_post_metrics_unique_capture' },
      );
      await queryInterface.addIndex(
        'freelancer_timeline_post_metrics',
        ['freelancerId', 'capturedAt'],
        { transaction, name: 'freelancer_timeline_post_metrics_freelancer_capture_idx' },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('freelancer_timeline_post_metrics', 'freelancer_timeline_post_metrics_freelancer_capture_idx', {
        transaction,
      });
      await queryInterface.removeIndex('freelancer_timeline_post_metrics', 'freelancer_timeline_post_metrics_unique_capture', {
        transaction,
      });
      await queryInterface.dropTable('freelancer_timeline_post_metrics', { transaction });

      await queryInterface.removeIndex('freelancer_timeline_entries', 'freelancer_timeline_entries_status_idx', {
        transaction,
      });
      await queryInterface.removeIndex('freelancer_timeline_entries', 'freelancer_timeline_entries_start_at_idx', {
        transaction,
      });
      await queryInterface.dropTable('freelancer_timeline_entries', { transaction });

      await queryInterface.removeIndex('freelancer_timeline_posts', 'freelancer_timeline_posts_status_idx', { transaction });
      await queryInterface.removeIndex('freelancer_timeline_posts', 'freelancer_timeline_posts_scheduled_at_idx', { transaction });
      await queryInterface.removeIndex('freelancer_timeline_posts', 'freelancer_timeline_posts_published_at_idx', { transaction });
      await queryInterface.dropTable('freelancer_timeline_posts', { transaction });

      await queryInterface.removeIndex(
        'freelancer_timeline_workspaces',
        'freelancer_timeline_workspaces_freelancer_id_unique',
        { transaction },
      );
      await queryInterface.dropTable('freelancer_timeline_workspaces', { transaction });

      const dialect = queryInterface.sequelize.getDialect();
      if (['postgres', 'postgresql'].includes(dialect)) {
        await queryInterface.sequelize.query(
          'DROP TYPE IF EXISTS "enum_freelancer_timeline_posts_status";',
          { transaction },
        );
        await queryInterface.sequelize.query(
          'DROP TYPE IF EXISTS "enum_freelancer_timeline_posts_visibility";',
          { transaction },
        );
        await queryInterface.sequelize.query(
          'DROP TYPE IF EXISTS "enum_freelancer_timeline_entries_entryType";',
          { transaction },
        );
        await queryInterface.sequelize.query(
          'DROP TYPE IF EXISTS "enum_freelancer_timeline_entries_status";',
          { transaction },
        );
        await queryInterface.sequelize.query(
          'DROP TYPE IF EXISTS "enum_freelancer_timeline_workspaces_defaultVisibility";',
          { transaction },
        );
      }
    });
  },
};
