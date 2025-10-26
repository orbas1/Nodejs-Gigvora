'use strict';

const resolveJsonType = (queryInterface, Sequelize) => {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);

      await queryInterface.addColumn(
        'user_website_preferences',
        'subscriptions',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      const dialect = queryInterface.sequelize.getDialect();
      if (dialect === 'postgres' || dialect === 'postgresql') {
        await queryInterface.bulkUpdate(
          'user_website_preferences',
          { subscriptions: Sequelize.literal("COALESCE(subscriptions, '{}'::jsonb)") },
          {},
          { transaction },
        );
      } else {
        await queryInterface.bulkUpdate(
          'user_website_preferences',
          { subscriptions: {} },
          {},
          { transaction },
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('user_website_preferences', 'subscriptions', { transaction });
    });
  },
};
