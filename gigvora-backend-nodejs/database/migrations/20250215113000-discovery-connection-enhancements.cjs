'use strict';

const TABLE_CONNECTIONS = 'discovery_connection_profiles';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await Promise.all([
      queryInterface.addColumn(TABLE_CONNECTIONS, 'pronouns', {
        type: Sequelize.STRING(60),
        allowNull: true,
      }),
      queryInterface.addColumn(TABLE_CONNECTIONS, 'matchScore', {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      }),
      queryInterface.addColumn(TABLE_CONNECTIONS, 'responseTimeLabel', {
        type: Sequelize.STRING(120),
        allowNull: true,
      }),
      queryInterface.addColumn(TABLE_CONNECTIONS, 'availabilityWindow', {
        type: Sequelize.STRING(160),
        allowNull: true,
      }),
      queryInterface.addColumn(TABLE_CONNECTIONS, 'focusAreas', {
        type: jsonType,
        allowNull: true,
      }),
    ]);
  },

  async down(queryInterface) {
    await Promise.all([
      queryInterface.removeColumn(TABLE_CONNECTIONS, 'focusAreas'),
      queryInterface.removeColumn(TABLE_CONNECTIONS, 'availabilityWindow'),
      queryInterface.removeColumn(TABLE_CONNECTIONS, 'responseTimeLabel'),
      queryInterface.removeColumn(TABLE_CONNECTIONS, 'matchScore'),
      queryInterface.removeColumn(TABLE_CONNECTIONS, 'pronouns'),
    ]);
  },
};
