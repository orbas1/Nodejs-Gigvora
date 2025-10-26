'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'feed_shares',
        {
          id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
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
          target: {
            type: Sequelize.ENUM('linkedin', 'email', 'copy-link', 'copy-message', 'copy-embed', 'other'),
            allowNull: false,
            defaultValue: 'other',
          },
          message: { type: Sequelize.TEXT, allowNull: true },
          shareUrl: { type: Sequelize.STRING(2048), allowNull: true },
          metadata: { type: Sequelize.JSONB, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('feed_shares', ['postId'], { transaction, name: 'feed_shares_post' });
      await queryInterface.addIndex('feed_shares', ['userId'], { transaction, name: 'feed_shares_user' });
      await queryInterface.addIndex('feed_shares', ['postId', 'target'], {
        transaction,
        name: 'feed_shares_post_target',
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('feed_shares', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_feed_shares_target";', { transaction });
    });
  },
};
