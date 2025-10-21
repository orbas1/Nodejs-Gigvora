'use strict';

const POST_STATUSES = ['draft', 'scheduled', 'published', 'archived'];
const VISIBILITIES = ['internal', 'client', 'public'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = Sequelize.JSONB ?? Sequelize.JSON;

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'agency_timeline_posts',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          ownerId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          createdById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          updatedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          slug: { type: Sequelize.STRING(200), allowNull: false, unique: true },
          excerpt: { type: Sequelize.STRING(500), allowNull: true },
          content: { type: Sequelize.TEXT, allowNull: true },
          status: { type: Sequelize.ENUM(...POST_STATUSES), allowNull: false, defaultValue: 'draft' },
          visibility: { type: Sequelize.ENUM(...VISIBILITIES), allowNull: false, defaultValue: 'internal' },
          scheduledAt: { type: Sequelize.DATE, allowNull: true },
          publishedAt: { type: Sequelize.DATE, allowNull: true },
          archivedAt: { type: Sequelize.DATE, allowNull: true },
          lastSentAt: { type: Sequelize.DATE, allowNull: true },
          heroImageUrl: { type: Sequelize.STRING(512), allowNull: true },
          thumbnailUrl: { type: Sequelize.STRING(512), allowNull: true },
          tags: { type: jsonType, allowNull: true },
          attachments: { type: jsonType, allowNull: true },
          distributionChannels: { type: jsonType, allowNull: true },
          audienceRoles: { type: jsonType, allowNull: true },
          metadata: { type: jsonType, allowNull: false, defaultValue: {} },
          engagementScore: { type: Sequelize.DECIMAL(9, 4), allowNull: false, defaultValue: 0 },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('agency_timeline_posts', ['workspaceId'], { transaction });
      await queryInterface.addIndex('agency_timeline_posts', ['status'], { transaction });
      await queryInterface.addIndex('agency_timeline_posts', ['publishedAt'], { transaction });
      await queryInterface.addIndex('agency_timeline_posts', ['scheduledAt'], { transaction });

      await queryInterface.createTable(
        'agency_timeline_post_revisions',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          postId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'agency_timeline_posts', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          editorId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          version: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
          title: { type: Sequelize.STRING(180), allowNull: true },
          excerpt: { type: Sequelize.STRING(500), allowNull: true },
          content: { type: Sequelize.TEXT, allowNull: true },
          changeSummary: { type: Sequelize.STRING(400), allowNull: true },
          diff: { type: jsonType, allowNull: true },
          snapshot: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('agency_timeline_post_revisions', ['postId'], { transaction });
      await queryInterface.addIndex(
        'agency_timeline_post_revisions',
        ['postId', 'version'],
        { transaction, unique: true },
      );

      await queryInterface.createTable(
        'agency_timeline_post_metrics',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          postId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'agency_timeline_posts', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          periodStart: { type: Sequelize.DATE, allowNull: false },
          periodEnd: { type: Sequelize.DATE, allowNull: false },
          channel: { type: Sequelize.STRING(80), allowNull: true },
          impressions: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          clicks: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          engagements: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          shares: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          comments: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          leads: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          audience: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          conversionRate: { type: Sequelize.DECIMAL(8, 4), allowNull: false, defaultValue: 0 },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('agency_timeline_post_metrics', ['postId'], { transaction });
      await queryInterface.addIndex('agency_timeline_post_metrics', ['periodStart'], { transaction });
      await queryInterface.addIndex('agency_timeline_post_metrics', ['periodEnd'], { transaction });
      await queryInterface.addIndex('agency_timeline_post_metrics', ['channel'], { transaction });
      await queryInterface.addIndex(
        'agency_timeline_post_metrics',
        ['postId', 'periodStart', 'periodEnd', 'channel'],
        { transaction, unique: true },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('agency_timeline_post_metrics', ['postId', 'periodStart', 'periodEnd', 'channel'], {
        transaction,
      });
      await queryInterface.removeIndex('agency_timeline_post_metrics', ['channel'], { transaction });
      await queryInterface.removeIndex('agency_timeline_post_metrics', ['periodEnd'], { transaction });
      await queryInterface.removeIndex('agency_timeline_post_metrics', ['periodStart'], { transaction });
      await queryInterface.removeIndex('agency_timeline_post_metrics', ['postId'], { transaction });
      await queryInterface.dropTable('agency_timeline_post_metrics', { transaction });

      await queryInterface.removeIndex('agency_timeline_post_revisions', ['postId', 'version'], { transaction });
      await queryInterface.removeIndex('agency_timeline_post_revisions', ['postId'], { transaction });
      await queryInterface.dropTable('agency_timeline_post_revisions', { transaction });

      await queryInterface.removeIndex('agency_timeline_posts', ['scheduledAt'], { transaction });
      await queryInterface.removeIndex('agency_timeline_posts', ['publishedAt'], { transaction });
      await queryInterface.removeIndex('agency_timeline_posts', ['status'], { transaction });
      await queryInterface.removeIndex('agency_timeline_posts', ['workspaceId'], { transaction });
      await queryInterface.dropTable('agency_timeline_posts', { transaction });

      const dialect = queryInterface.sequelize.getDialect();
      if (dialect === 'postgres' || dialect === 'postgresql') {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_agency_timeline_posts_status";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_agency_timeline_posts_visibility";', { transaction });
      }
    });
  },
};
