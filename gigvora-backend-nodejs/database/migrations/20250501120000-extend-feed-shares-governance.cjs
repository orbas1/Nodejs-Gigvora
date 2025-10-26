'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const jsonType = ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())
        ? Sequelize.JSONB
        : Sequelize.JSON;

      await queryInterface.addColumn(
        'feed_shares',
        'scheduledFor',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'feed_shares',
        'notifyList',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'feed_shares',
        'complianceAcknowledged',
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('feed_shares', 'scheduledFor', { transaction }).catch(() => {});
      await queryInterface.removeColumn('feed_shares', 'notifyList', { transaction }).catch(() => {});
      await queryInterface.removeColumn('feed_shares', 'complianceAcknowledged', { transaction }).catch(() => {});
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
