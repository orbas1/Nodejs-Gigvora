'use strict';

const FEED_POST_TYPES = ['update', 'media', 'job', 'gig', 'project', 'volunteering', 'launchpad', 'news'];
const FEED_REACTION_TYPES = ['like', 'celebrate', 'support', 'love', 'insightful'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const jsonType = ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())
        ? Sequelize.JSONB
        : Sequelize.JSON;

      await queryInterface.addColumn(
        'feed_posts',
        'type',
        { type: Sequelize.ENUM(...FEED_POST_TYPES), allowNull: false, defaultValue: 'update' },
        { transaction },
      );
      await queryInterface.addColumn(
        'feed_posts',
        'link',
        { type: Sequelize.STRING(2048), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'feed_posts',
        'title',
        { type: Sequelize.STRING(280), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'feed_posts',
        'summary',
        { type: Sequelize.TEXT, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'feed_posts',
        'imageUrl',
        { type: Sequelize.STRING(2048), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'feed_posts',
        'source',
        { type: Sequelize.STRING(255), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'feed_posts',
        'externalId',
        { type: Sequelize.STRING(255), allowNull: true, unique: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'feed_posts',
        'authorName',
        { type: Sequelize.STRING(180), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'feed_posts',
        'authorHeadline',
        { type: Sequelize.STRING(255), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'feed_posts',
        'authorAvatarSeed',
        { type: Sequelize.STRING(255), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'feed_posts',
        'mediaAttachments',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.createTable(
        'feed_comments',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          postId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'feed_posts', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          parentId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'feed_comments', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          body: { type: Sequelize.TEXT, allowNull: false },
          authorName: { type: Sequelize.STRING(180), allowNull: true },
          authorHeadline: { type: Sequelize.STRING(255), allowNull: true },
          authorAvatarSeed: { type: Sequelize.STRING(255), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );
      await queryInterface.addIndex('feed_comments', ['postId'], { transaction });
      await queryInterface.addIndex('feed_comments', ['parentId'], { transaction });
      await queryInterface.addIndex('feed_comments', ['userId'], { transaction });

      await queryInterface.createTable(
        'feed_reactions',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          postId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'feed_posts', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          reactionType: {
            type: Sequelize.ENUM(...FEED_REACTION_TYPES),
            allowNull: false,
            defaultValue: 'like',
          },
          active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );
      await queryInterface.addIndex('feed_reactions', ['postId'], { transaction });
      await queryInterface.addIndex('feed_reactions', ['userId'], { transaction });
      await queryInterface.addConstraint('feed_reactions', {
        fields: ['postId', 'userId', 'reactionType'],
        type: 'unique',
        name: 'feed_reactions_unique_user_reaction',
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeConstraint('feed_reactions', 'feed_reactions_unique_user_reaction', { transaction });
      await queryInterface.dropTable('feed_reactions', { transaction });
      await queryInterface.dropTable('feed_comments', { transaction });

      await queryInterface.removeColumn('feed_posts', 'mediaAttachments', { transaction });
      await queryInterface.removeColumn('feed_posts', 'authorAvatarSeed', { transaction });
      await queryInterface.removeColumn('feed_posts', 'authorHeadline', { transaction });
      await queryInterface.removeColumn('feed_posts', 'authorName', { transaction });
      await queryInterface.removeColumn('feed_posts', 'externalId', { transaction });
      await queryInterface.removeColumn('feed_posts', 'source', { transaction });
      await queryInterface.removeColumn('feed_posts', 'imageUrl', { transaction });
      await queryInterface.removeColumn('feed_posts', 'summary', { transaction });
      await queryInterface.removeColumn('feed_posts', 'title', { transaction });
      await queryInterface.removeColumn('feed_posts', 'link', { transaction });
      await queryInterface.removeColumn('feed_posts', 'type', { transaction });

      if (['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())) {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_feed_reactions_reactionType";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_feed_posts_type";', { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
