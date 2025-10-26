'use strict';

const SHARE_AUDIENCES = ['internal', 'external'];
const SHARE_CHANNELS = ['copy', 'email', 'secure'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const jsonType = ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())
        ? Sequelize.JSONB
        : Sequelize.JSON;

      await queryInterface.createTable(
        'feed_shares',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          postId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'feed_posts', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          audience: {
            type: Sequelize.ENUM(...SHARE_AUDIENCES),
            allowNull: false,
            defaultValue: 'internal',
          },
          channel: {
            type: Sequelize.ENUM(...SHARE_CHANNELS),
            allowNull: false,
            defaultValue: 'copy',
          },
          message: { type: Sequelize.TEXT, allowNull: false },
          link: { type: Sequelize.STRING(2048), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('feed_shares', ['postId'], { transaction, name: 'feed_shares_post_id' });
      await queryInterface.addIndex('feed_shares', ['userId'], { transaction, name: 'feed_shares_user_id' });
      await queryInterface.addIndex('feed_shares', ['channel'], { transaction, name: 'feed_shares_channel' });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeIndex('feed_shares', 'feed_shares_post_id', { transaction }).catch(() => {});
      await queryInterface.removeIndex('feed_shares', 'feed_shares_user_id', { transaction }).catch(() => {});
      await queryInterface.removeIndex('feed_shares', 'feed_shares_channel', { transaction }).catch(() => {});
      await queryInterface.dropTable('feed_shares', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_feed_shares_audience";', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_feed_shares_channel";', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
