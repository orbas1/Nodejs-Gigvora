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
        'personalization_theme',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'user_website_preferences',
        'personalization_layout',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'user_website_preferences',
        'personalization_subscriptions',
        { type: jsonType, allowNull: true },
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('user_website_preferences', 'personalization_subscriptions', {
        transaction,
      });
      await queryInterface.removeColumn('user_website_preferences', 'personalization_layout', {
        transaction,
      });
      await queryInterface.removeColumn('user_website_preferences', 'personalization_theme', {
        transaction,
      });
    });
  },
};
