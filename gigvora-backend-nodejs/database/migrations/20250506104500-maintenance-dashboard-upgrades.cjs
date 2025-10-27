'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.addColumn('maintenance_feedback_snapshots', 'totalResponses', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('maintenance_operational_snapshots', 'impacts', {
      type: jsonType,
      allowNull: false,
      defaultValue: [],
    });

    await queryInterface.addColumn('maintenance_operational_snapshots', 'nextUpdateAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('maintenance_operational_snapshots', 'nextUpdateAt');
    await queryInterface.removeColumn('maintenance_operational_snapshots', 'impacts');
    await queryInterface.removeColumn('maintenance_feedback_snapshots', 'totalResponses');
  },
};
