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
        'appearance_layouts',
        'audienceSegments',
        { type: jsonType, allowNull: false, defaultValue: [] },
        { transaction },
      );

      await queryInterface.addColumn(
        'appearance_layouts',
        'analytics',
        { type: jsonType, allowNull: false, defaultValue: {} },
        { transaction },
      );

      await queryInterface.addColumn(
        'appearance_layouts',
        'experimentKey',
        { type: Sequelize.STRING(120), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'appearance_layouts',
        'scheduledLaunch',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('appearance_layouts', 'scheduledLaunch', { transaction });
      await queryInterface.removeColumn('appearance_layouts', 'experimentKey', { transaction });
      await queryInterface.removeColumn('appearance_layouts', 'analytics', { transaction });
      await queryInterface.removeColumn('appearance_layouts', 'audienceSegments', { transaction });
    });
  },
};
