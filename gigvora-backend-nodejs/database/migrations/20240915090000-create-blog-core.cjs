'use strict';

const { resolveJsonType, dropEnum } = require('../utils/migrationHelpers.cjs');

const POST_STATUSES = ['draft', 'scheduled', 'published', 'archived'];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);

      await queryInterface.createTable(
        'blog_categories',
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          workspaceId: {
            allowNull: true,
            type: Sequelize.INTEGER,
            references: { model: 'provider_workspaces', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          name: { allowNull: false, type: Sequelize.STRING(160) },
          slug: { allowNull: false, type: Sequelize.STRING(180) },
          description: { allowNull: true, type: Sequelize.TEXT },
          accentColor: { allowNull: true, type: Sequelize.STRING(20) },
          heroImageUrl: { allowNull: true, type: Sequelize.STRING(500) },
          metadata: { allowNull: true, type: jsonType },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addIndex('blog_categories', ['slug'], { unique: true, transaction });

      await queryInterface.createTable(
        'blog_tags',
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          workspaceId: {
            allowNull: true,
            type: Sequelize.INTEGER,
            references: { model: 'provider_workspaces', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          name: { allowNull: false, type: Sequelize.STRING(160) },
          slug: { allowNull: false, type: Sequelize.STRING(180) },
          description: { allowNull: true, type: Sequelize.TEXT },
          metadata: { allowNull: true, type: jsonType },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addIndex('blog_tags', ['slug'], { unique: true, transaction });

      await queryInterface.createTable(
        'blog_media',
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          url: { allowNull: false, type: Sequelize.STRING(500) },
          type: { allowNull: true, type: Sequelize.STRING(80) },
          altText: { allowNull: true, type: Sequelize.STRING(255) },
          caption: { allowNull: true, type: Sequelize.STRING(255) },
          metadata: { allowNull: true, type: jsonType },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addIndex('blog_media', ['type'], { transaction });

      await queryInterface.createTable(
        'blog_posts',
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          title: { allowNull: false, type: Sequelize.STRING(200) },
          slug: { allowNull: false, type: Sequelize.STRING(220) },
          excerpt: { allowNull: true, type: Sequelize.STRING(480) },
          content: { allowNull: false, type: Sequelize.TEXT },
          status: { allowNull: false, type: Sequelize.ENUM(...POST_STATUSES), defaultValue: 'draft' },
          publishedAt: { allowNull: true, type: Sequelize.DATE },
          readingTimeMinutes: { allowNull: false, type: Sequelize.INTEGER, defaultValue: 5 },
          featured: { allowNull: false, type: Sequelize.BOOLEAN, defaultValue: false },
          authorId: {
            allowNull: true,
            type: Sequelize.INTEGER,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          categoryId: {
            allowNull: true,
            type: Sequelize.INTEGER,
            references: { model: 'blog_categories', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          coverImageId: {
            allowNull: true,
            type: Sequelize.INTEGER,
            references: { model: 'blog_media', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          workspaceId: {
            allowNull: true,
            type: Sequelize.INTEGER,
            references: { model: 'provider_workspaces', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          meta: { allowNull: true, type: jsonType },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addIndex('blog_posts', ['slug'], { unique: true, transaction });
      await queryInterface.addIndex('blog_posts', ['status'], { transaction });
      await queryInterface.addIndex('blog_posts', ['publishedAt'], { transaction });
      await queryInterface.addIndex('blog_posts', ['categoryId'], { transaction });
      await queryInterface.addIndex('blog_posts', ['featured'], { transaction });

      await queryInterface.createTable(
        'blog_post_tags',
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          postId: {
            allowNull: false,
            type: Sequelize.INTEGER,
            references: { model: 'blog_posts', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          tagId: {
            allowNull: false,
            type: Sequelize.INTEGER,
            references: { model: 'blog_tags', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addIndex('blog_post_tags', ['postId', 'tagId'], { unique: true, transaction });

      await queryInterface.createTable(
        'blog_post_media',
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          postId: {
            allowNull: false,
            type: Sequelize.INTEGER,
            references: { model: 'blog_posts', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          mediaId: {
            allowNull: false,
            type: Sequelize.INTEGER,
            references: { model: 'blog_media', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          position: { allowNull: false, type: Sequelize.INTEGER, defaultValue: 0 },
          role: { allowNull: true, type: Sequelize.STRING(80) },
          caption: { allowNull: true, type: Sequelize.STRING(255) },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addIndex('blog_post_media', ['postId', 'mediaId'], { unique: true, transaction });
      await queryInterface.addIndex('blog_post_media', ['postId', 'position'], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('blog_post_media', { transaction });
      await queryInterface.dropTable('blog_post_tags', { transaction });
      await queryInterface.dropTable('blog_posts', { transaction });
      await queryInterface.dropTable('blog_media', { transaction });
      await queryInterface.dropTable('blog_tags', { transaction });
      await queryInterface.dropTable('blog_categories', { transaction });
      await dropEnum(queryInterface, 'enum_blog_posts_status', transaction);
    });
  },
};
