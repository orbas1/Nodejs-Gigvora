'use strict';

const COMMENT_STATUSES = ['pending', 'approved', 'rejected', 'spam', 'archived'];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'blog_post_metrics',
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          postId: {
            allowNull: false,
            type: Sequelize.INTEGER,
            references: { model: 'blog_posts', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            unique: true,
          },
          totalViews: { allowNull: false, type: Sequelize.INTEGER, defaultValue: 0 },
          uniqueVisitors: { allowNull: false, type: Sequelize.INTEGER, defaultValue: 0 },
          averageReadTimeSeconds: { allowNull: false, type: Sequelize.INTEGER, defaultValue: 0 },
          readCompletionRate: { allowNull: false, type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
          clickThroughRate: { allowNull: false, type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
          bounceRate: { allowNull: false, type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
          shareCount: { allowNull: false, type: Sequelize.INTEGER, defaultValue: 0 },
          likeCount: { allowNull: false, type: Sequelize.INTEGER, defaultValue: 0 },
          subscriberConversions: { allowNull: false, type: Sequelize.INTEGER, defaultValue: 0 },
          commentCount: { allowNull: false, type: Sequelize.INTEGER, defaultValue: 0 },
          lastSyncedAt: { allowNull: true, type: Sequelize.DATE },
          metadata: { allowNull: true, type: Sequelize.JSONB ?? Sequelize.JSON },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addIndex('blog_post_metrics', ['totalViews'], { transaction, name: 'blog_post_metrics_views_idx' });
      await queryInterface.addIndex('blog_post_metrics', ['updatedAt'], { transaction, name: 'blog_post_metrics_updated_idx' });

      await queryInterface.createTable(
        'blog_post_comments',
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          postId: {
            allowNull: false,
            type: Sequelize.INTEGER,
            references: { model: 'blog_posts', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          parentId: {
            allowNull: true,
            type: Sequelize.INTEGER,
            references: { model: 'blog_post_comments', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          authorId: {
            allowNull: true,
            type: Sequelize.INTEGER,
            references: { model: 'Users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          authorName: { allowNull: true, type: Sequelize.STRING(160) },
          authorEmail: { allowNull: true, type: Sequelize.STRING(255) },
          body: { allowNull: false, type: Sequelize.TEXT },
          status: { allowNull: false, type: Sequelize.ENUM(...COMMENT_STATUSES), defaultValue: 'pending' },
          isPinned: { allowNull: false, type: Sequelize.BOOLEAN, defaultValue: false },
          likeCount: { allowNull: false, type: Sequelize.INTEGER, defaultValue: 0 },
          flagCount: { allowNull: false, type: Sequelize.INTEGER, defaultValue: 0 },
          metadata: { allowNull: true, type: Sequelize.JSONB ?? Sequelize.JSON },
          publishedAt: { allowNull: true, type: Sequelize.DATE },
          editedAt: { allowNull: true, type: Sequelize.DATE },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addIndex('blog_post_comments', ['postId', 'status'], {
        transaction,
        name: 'blog_post_comments_post_status_idx',
      });
      await queryInterface.addIndex('blog_post_comments', ['createdAt'], {
        transaction,
        name: 'blog_post_comments_created_idx',
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('blog_post_comments', { transaction });
      await queryInterface.dropTable('blog_post_metrics', { transaction });
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_blog_post_comments_status\"", { transaction });
    });
  },
};
